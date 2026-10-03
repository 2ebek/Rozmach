"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CoachPoint, CoachResponse, CoachSectionId } from "@/lib/ai/ideaCoach";
import { postJson } from "@/lib/client";
import { iossUnits } from "@/lib/data/ioss-jednostki";
import type { IossFact } from "@/lib/ioss";
import { IWS_SECTIONS } from "@/lib/iws";
import { AREAS, AREA_COLOR, AREA_LABEL, AREA_LABEL_ROPS, STAGES, STAGE_LABEL } from "@/lib/labels";
import type { ChallengeArea, IdeaStage } from "@/lib/types";
import { Icon } from "./Icon";
import { CodeCard } from "./CodeCard";
import { Dot, Field, Panel, Status, btnCls, btnSecondaryCls, inputCls } from "./ui";

/** Pola fiszki odpowiadające punktom formularza aplikacyjnego IWS 2.0 (pkt 11 „Zespół” – dopiero we wniosku). */
const FIELDS = [
  { key: "essence", section: "opis", required: true },
  { key: "innovativeness", section: "innowacyjnosc", required: false },
  { key: "problem", section: "diagnoza", required: true },
  { key: "audience", section: "odbiorcy", required: true },
  { key: "change", section: "zmiana", required: false },
  { key: "vision", section: "wizja", required: false },
] as const satisfies readonly { key: string; section: CoachSectionId; required: boolean }[];

type TextKey = (typeof FIELDS)[number]["key"];
/** Wszystkie pola, które asystent może uzupełnić: tytuł + punkty opisowe. */
type DraftKey = "title" | TextKey;
const EMPTY: Record<TextKey, string> = { essence: "", innovativeness: "", problem: "", audience: "", change: "", vision: "" };
const section = (id: CoachSectionId) => IWS_SECTIONS.find((s) => s.id === id)!;
const SECTION_OF: Record<DraftKey, CoachSectionId> = { title: "tytul", ...Object.fromEntries(FIELDS.map((f) => [f.key, f.section])) } as Record<DraftKey, CoachSectionId>;

/** Powiaty z gminami – lista wyboru miejsca (dane IOSS). */
const POWIATY = iossUnits
  .filter((u) => u.kind === "powiat")
  .map((p) => ({ powiat: p, gminy: iossUnits.filter((g) => g.powiat === p.id) }));

const STATUS_STYLE: Record<CoachPoint["status"], { label: string; cls: string }> = {
  ok: { label: "W porządku", cls: "bg-emerald-100 text-emerald-900" },
  "do-poprawy": { label: "Do rozwinięcia", cls: "bg-amber-100 text-amber-900" },
  brak: { label: "Brakuje", cls: "bg-rose-100 text-rose-900" },
};

/**
 * Fiszka pomysłu – pytania z części merytorycznej formularza aplikacyjnego ROPS „Inkubator Włączenia Społecznego 2.0”,
 * żeby fiszkę dało się jednym kliknięciem przenieść do wniosku. Bez danych osobowych – autor dostaje kod zgłoszenia.
 * Asystent AI ocenia punkty, proponuje treść (wstawianą dopiero po kliknięciu) i pokazuje podobne innowacje z Biblioteki ROPS.
 */
export function IdeaForm() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ChallengeArea | "">("");
  const [text, setText] = useState<Record<TextKey, string>>(EMPTY);
  const [authors, setAuthors] = useState("");
  const [stage, setStage] = useState<IdeaStage>("pomysl");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [coach, setCoach] = useState<CoachResponse | null>(null);
  const [coaching, setCoaching] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);
  /** Poprzednia treść pól zastąpionych propozycją – do cofnięcia. */
  const [undo, setUndo] = useState<Partial<Record<DraftKey, string>>>({});
  /** Gmina/powiat (id IOSS) i prawdziwe wskaźniki dla niego – do diagnozy problemu. */
  const [place, setPlace] = useState("");
  const [facts, setFacts] = useState<IossFact[] | null>(null);
  const [factsError, setFactsError] = useState<string | null>(null);

  useEffect(() => {
    setFacts(null);
    setFactsError(null);
    if (!place) return;
    let cancelled = false;
    fetch(`/api/ioss?unit=${encodeURIComponent(place)}${category ? `&area=${category}` : ""}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error())))
      .then((d: { facts: IossFact[] }) => !cancelled && setFacts(d.facts))
      .catch(() => !cancelled && setFactsError("Nie udało się pobrać danych z Obserwatora. Spróbuj ponownie później."));
    return () => {
      cancelled = true;
    };
  }, [place, category]);

  /** Dopisuje zdanie ze wskaźnikiem na końcu diagnozy (z możliwością cofnięcia). */
  function insertFact(sentence: string) {
    setUndo((u) => ({ ...u, problem: text.problem }));
    const next = [text.problem.trim(), sentence].filter(Boolean).join("\n\n");
    setText((prev) => ({ ...prev, problem: next.slice(0, section("diagnoza").max) }));
  }

  const valueOf = (k: DraftKey) => (k === "title" ? title : text[k]);
  const setValue = (k: DraftKey, v: string) => (k === "title" ? setTitle(v) : setText((prev) => ({ ...prev, [k]: v })));

  async function askCoach() {
    setCoachError(null);
    setCoaching(true);
    try {
      // Do asystenta trafia tylko treść merytoryczna – bez pola „Autorzy”.
      const sections = Object.fromEntries((Object.keys(SECTION_OF) as DraftKey[]).map((k) => [SECTION_OF[k], valueOf(k)]));
      setCoach(await postJson<CoachResponse>("/api/ideas/coach", { category: category || undefined, stage, sections, place: place || undefined }));
      setUndo({});
    } catch (err) {
      setCoachError(err instanceof Error ? err.message : "Asystent jest chwilowo niedostępny.");
    } finally {
      setCoaching(false);
    }
  }

  function applySuggestion(k: DraftKey, suggestion: string) {
    setUndo((u) => ({ ...u, [k]: valueOf(k) }));
    setValue(k, suggestion);
  }

  function revert(k: DraftKey) {
    setValue(k, undo[k] ?? "");
    setUndo(({ [k]: _removed, ...rest }) => rest);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const optional = Object.fromEntries(FIELDS.filter((f) => !f.required).map((f) => [f.key, text[f.key].trim() || undefined]));
      const res = await postJson<{ code: string }>("/api/ideas", {
        title,
        category: category || undefined,
        essence: text.essence,
        problem: text.problem,
        audience: text.audience,
        ...optional,
        authors: authors || undefined,
        stage,
      });
      setCode(res.code);
      setTitle("");
      setText(EMPTY);
      setAuthors("");
      setCategory("");
      setPlace("");
      setStage("pomysl");
      setCoach(null);
      setUndo({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd.");
    } finally {
      setSending(false);
    }
  }

  /** Wskazówka asystenta pod polem (po sprawdzeniu fiszki). */
  function coachNote(k: DraftKey) {
    const p = coach?.points.find((x) => x.section === SECTION_OF[k]);
    if (!p) return null;
    const st = STATUS_STYLE[p.status];
    return (
      <div className="mt-2 rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm" data-coach={SECTION_OF[k]}>
        <p className="flex flex-wrap items-center gap-2">
          <Icon name="sparkle" className="h-4 w-4 text-brand-900" />
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${st.cls}`}>{st.label}</span>
          <span className="text-ink">{p.feedback}</span>
        </p>
        {p.suggestion && (
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Propozycja asystenta – sprawdź i popraw po swojemu</p>
            <p className="mt-1 whitespace-pre-line rounded-lg bg-white p-3 text-ink">{p.suggestion}</p>
          </div>
        )}
        <p className="mt-3 flex flex-wrap gap-3">
          {p.suggestion && valueOf(k) !== p.suggestion && (
            <button type="button" onClick={() => applySuggestion(k, p.suggestion!)} className="font-semibold text-brand-700 underline-offset-2 hover:underline">
              {valueOf(k).trim() ? "Zastąp moją treść propozycją" : "Wstaw propozycję"}
              <span className="sr-only"> – {section(SECTION_OF[k]).label}</span>
            </button>
          )}
          {undo[k] !== undefined && (
            <button type="button" onClick={() => revert(k)} className="font-semibold text-muted underline-offset-2 hover:underline">
              Cofnij<span className="sr-only"> – {section(SECTION_OF[k]).label}</span>
            </button>
          )}
        </p>
      </div>
    );
  }

  /** Prawdziwe wskaźniki IOSS dla wybranej gminy/powiatu – pod diagnozą problemu. */
  function iossPanel() {
    if (!place) {
      return (
        <p className="mt-2 text-sm text-muted">
          Wskazówka: wybierz wyżej gminę lub powiat, a podpowiemy prawdziwe dane do diagnozy z Obserwatora Statystyk Społecznych ROPS.
        </p>
      );
    }
    return (
      <section aria-labelledby="ioss-h" className="mt-2 rounded-xl border border-slate-200 bg-white p-4 text-sm" data-ioss>
        <h4 id="ioss-h" className="flex items-center gap-2 font-semibold text-brand-900">
          <Icon name="chart" className="h-4 w-4" /> Dane do diagnozy – Obserwator Statystyk Społecznych ROPS
        </h4>
        {!category && <p className="mt-1 text-muted">Wybierz kategorię ROPS, by zobaczyć wskaźniki dopasowane do odbiorców pomysłu. Na razie pokazujemy ogólne.</p>}
        <div aria-live="polite">
          {factsError && <p className="mt-2 font-semibold text-red-800">{factsError}</p>}
          {!facts && !factsError && <p className="mt-2 text-muted">Pobieram dane…</p>}
          {facts?.length === 0 && <p className="mt-2 text-muted">Brak wskaźników dla tego miejsca w tej kategorii.</p>}
          {facts && facts.length > 0 && (
            <ul className="mt-3 space-y-3">
              {facts.map((fact) => {
                const inserted = text.problem.includes(fact.sentence);
                return (
                  <li key={fact.indicatorId} className="rounded-lg bg-mist p-3">
                    <p className="font-semibold text-brand-900">{fact.label}</p>
                    <p className="mt-1">
                      <span className="text-2xl font-black text-brand-900">{fact.valueText}</span>{" "}
                      <span className="text-ink">
                        – {fact.placeName}, {fact.year}&nbsp;r.
                      </span>
                    </p>
                    <p className="text-muted">
                      {fact.powiat && `${fact.powiat.name}: ${fact.powiat.valueText} · `}
                      {fact.region.label}: {fact.region.valueText}
                    </p>
                    {fact.description && <p className="mt-1 text-xs text-muted">{fact.description.length > 220 ? `${fact.description.slice(0, 219)}…` : fact.description}</p>}
                    <p className="mt-2 flex flex-wrap gap-4">
                      <button type="button" disabled={inserted} onClick={() => insertFact(fact.sentence)} className="font-semibold text-brand-700 underline-offset-2 enabled:hover:underline disabled:text-muted">
                        {inserted ? "Wstawiono do diagnozy" : "Wstaw do diagnozy"}
                        <span className="sr-only"> – {fact.label}</span>
                      </button>
                      <a href={fact.url} target="_blank" rel="noopener noreferrer" className="text-brand-700 underline">
                        Źródło w IOSS<span className="sr-only"> – {fact.label} (otwiera się w nowej karcie)</span>
                      </a>
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
          {undo.problem !== undefined && !coach?.points.some((p) => p.section === "diagnoza") && (
            <button type="button" onClick={() => revert("problem")} className="mt-3 font-semibold text-muted underline-offset-2 hover:underline">
              Cofnij zmianę w diagnozie
            </button>
          )}
        </div>
      </section>
    );
  }

  const stageIdx = STAGES.indexOf(stage);
  const t = section("tytul");

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <Panel>
        <form onSubmit={onSubmit} className="space-y-6">
          <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-slate-800">
            Pytania pochodzą z <strong>formularza aplikacyjnego ROPS „Inkubator Włączenia Społecznego 2.0”</strong> (pkt 1 i 3–8). Fiszkę wczytasz potem do wniosku
            jej kodem – nie trzeba nic przepisywać. Pola oznaczone „opcjonalnie” możesz uzupełnić później, a <strong>asystent AI</strong> (przycisk na dole) podpowie,
            co dopisać.
          </p>
          <Field id="idea-title" label={`${t.no}. ${t.label}`} hint={t.hint}>
            <input id="idea-title" aria-describedby="idea-title-hint" required maxLength={t.max} value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="np. Sąsiedzka wymiana usług" />
            {coachNote("title")}
          </Field>
          <Field id="idea-category" label="Kategoria Biblioteki ROPS – dla kogo jest innowacja?">
            <select id="idea-category" required value={category} onChange={(e) => setCategory(e.target.value as ChallengeArea | "")} className={inputCls}>
              <option value="">Wybierz kategorię…</option>
              {AREAS.map((a) => (
                <option key={a} value={a}>
                  {AREA_LABEL_ROPS[a]}
                </option>
              ))}
            </select>
          </Field>
          <Field
            id="idea-place"
            label="Gmina lub powiat, którego dotyczy pomysł (opcjonalnie)"
            hint="Przy diagnozie problemu pokażemy prawdziwe dane dla tego miejsca z Obserwatora Statystyk Społecznych ROPS – możesz je wstawić jednym kliknięciem."
          >
            <select id="idea-place" aria-describedby="idea-place-hint" value={place} onChange={(e) => setPlace(e.target.value)} className={inputCls}>
              <option value="">Nie wybrano</option>
              {POWIATY.map(({ powiat, gminy }) => (
                <optgroup key={powiat.id} label={powiat.name}>
                  <option value={powiat.id}>{powiat.name} – cały powiat</option>
                  {gminy.map((g) => (
                    <option key={g.id} value={g.id}>
                      gmina {g.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>
          {FIELDS.map((f) => {
            const s = section(f.section);
            const id = `idea-${f.key}`;
            const v = text[f.key];
            return (
              <Field key={f.key} id={id} label={`${s.no}. ${s.label}${f.required ? "" : " (opcjonalnie)"}`} hint={s.hint}>
                <textarea
                  id={id}
                  aria-describedby={`${id}-hint ${id}-count`}
                  required={f.required}
                  rows={f.required ? 5 : 3}
                  maxLength={s.max}
                  value={v}
                  onChange={(e) => setText({ ...text, [f.key]: e.target.value })}
                  className={inputCls}
                />
                <p id={`${id}-count`} className="text-right text-xs text-slate-600">
                  {v.length} / {s.max} znaków
                </p>
                {f.key === "problem" && iossPanel()}
                {coachNote(f.key)}
              </Field>
            );
          })}
          <Field id="idea-authors" label="Autorzy (opcjonalnie)" hint="Nazwa organizacji, grupy lub podpis. Nie podawaj adresu ani telefonu – dane wnioskodawcy wpiszesz dopiero we wniosku, a kontakt odbywa się przez kod zgłoszenia.">
            <input id="idea-authors" aria-describedby="idea-authors-hint" maxLength={200} value={authors} onChange={(e) => setAuthors(e.target.value)} className={inputCls} />
          </Field>
          <fieldset>
            <legend className="mb-2 font-bold text-brand-900">Na jakim etapie jest pomysł?</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {STAGES.map((s) => (
                <label
                  key={s}
                  className={`flex cursor-pointer items-center justify-center rounded-lg border-2 px-3 py-2.5 text-center font-bold transition has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-accent ${
                    stage === s ? "border-brand-700 bg-brand-700 text-white" : "border-slate-300 text-brand-900 hover:border-brand-700"
                  }`}
                >
                  <input type="radio" name="stage" value={s} checked={stage === s} onChange={() => setStage(s)} className="sr-only" />
                  {STAGE_LABEL[s]}
                </label>
              ))}
            </div>
          </fieldset>

          {/* ASYSTENT AI FISZKI */}
          <section aria-labelledby="coach-h" className="rounded-2xl bg-brand-100 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 id="coach-h" className="flex items-center gap-2 text-lg font-semibold text-brand-900">
                  <Icon name="sparkle" className="h-5 w-5" /> Asystent AI fiszki
                </h3>
                <p className="text-sm text-muted">Oceni punkty jak komisja IWS 2.0, zaproponuje brakującą treść i sprawdzi, czy podobne rozwiązanie już jest w Bibliotece ROPS.</p>
              </div>
              <button type="button" onClick={askCoach} disabled={coaching} className={btnSecondaryCls}>
                <Icon name="sparkle" className="h-4 w-4" /> {coaching ? "Sprawdzam…" : coach ? "Sprawdź ponownie" : "Sprawdź fiszkę z AI"}
              </button>
            </div>
            <div aria-live="polite" className="mt-4 space-y-4 empty:hidden">
              {coachError && <p className="font-semibold text-red-800">{coachError}</p>}
              {coach && !coaching && (
                <>
                  <div className="rounded-xl bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {coach.source === "ai" ? "Podsumowanie AI • wersja robocza" : "Podpowiedzi bez AI (tryb podstawowy)"}
                    </p>
                    <p className="mt-1 text-ink">{coach.summary}</p>
                    <p className="mt-2 text-sm text-brand-900">
                      <strong>Następny krok:</strong> {coach.nextStep}
                    </p>
                    <p className="mt-2 text-sm text-muted">Wskazówki do poszczególnych punktów są pod polami formularza. AI podpowiada – o treści decydujesz Ty.</p>
                  </div>
                  {coach.similar.length > 0 && (
                    <div className="rounded-xl bg-white p-4">
                      <p className="font-semibold text-brand-900">Podobne innowacje w Bibliotece ROPS</p>
                      <p className="text-sm text-muted">Formularz wymaga, by pomysł nie powielał wdrożonych rozwiązań – pokaż w pkt 4, czym się różni.</p>
                      <ul className="mt-3 space-y-2">
                        {coach.similar.map((s) => (
                          <li key={s.id} className="text-sm">
                            <Link href={`/zasobnik/${s.id}`} target="_blank" className="font-semibold text-brand-700 hover:underline">
                              {s.title}
                              <span className="sr-only"> (otwiera się w nowej karcie)</span>
                            </Link>
                            <span className="text-ink"> – {s.reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-4 border-t border-slate-200 pt-6">
            <button type="submit" disabled={sending} className={btnCls}>
              <Icon name="send" className="h-5 w-5" />
              {sending ? "Wysyłam…" : "Wyślij fiszkę"}
            </button>
            <p className="text-sm text-slate-600">Nie potrzebujemy danych osobowych – wystarczy opis pomysłu.</p>
          </div>
          <Status error={error} />
          {code && <CodeCard code={code} />}
        </form>
      </Panel>

      {/* Podgląd fiszki na żywo */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-600">Podgląd fiszki</p>
        <div aria-hidden className="relative rotate-[0.6deg] rounded-xl bg-[#fffdf5] p-6 shadow-[0_12px_32px_-12px_rgba(0,15,55,0.35)] ring-1 ring-amber-200/70">
          <div className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 rotate-[-2deg] rounded-sm bg-sun/70" />
          <p className="text-xs font-bold uppercase tracking-wider text-accent">Fiszka pomysłu · IWS 2.0</p>
          <p className="mt-2 break-words text-xl font-black text-brand-900">{title || "Tytuł innowacji"}</p>
          <p className="mt-2 flex items-center gap-1.5 text-sm">
            {category ? (
              <>
                <Dot className={AREA_COLOR[category]} /> <span className="font-bold text-slate-700">{AREA_LABEL[category]}</span>
              </>
            ) : (
              <span className="text-slate-400">Kategoria ROPS…</span>
            )}
          </p>
          <p className={`mt-3 line-clamp-4 break-words text-[0.95rem] ${text.essence ? "text-slate-800" : "text-slate-400"}`}>
            {text.essence || "Opis innowacji…"}
          </p>
          <p className="mt-3 line-clamp-3 break-words text-sm">
            <span className="font-bold text-slate-700">Problem: </span>
            <span className={text.problem ? "text-slate-800" : "text-slate-400"}>{text.problem || "…"}</span>
          </p>
          <p className="mt-2 line-clamp-2 break-words text-sm">
            <span className="font-bold text-slate-700">Odbiorcy: </span>
            <span className={text.audience ? "text-slate-800" : "text-slate-400"}>{text.audience || "…"}</span>
          </p>
          <p className="mt-3 text-xs font-bold text-slate-600">
            Wypełniono {[title, ...FIELDS.map((f) => text[f.key])].filter((x) => x.trim()).length} z 7 punktów formularza
          </p>
          {coach && (
            <p className="mt-1 text-xs font-bold text-brand-700">
              Asystent: {coach.points.filter((p) => p.status === "ok").length} z {coach.points.length} punktów w porządku
            </p>
          )}
          <div className="mt-4">
            <div className="flex gap-1">
              {STAGES.map((s, i) => (
                <span key={s} className={`h-1.5 flex-1 rounded-full ${i <= stageIdx ? "bg-brand-700" : "bg-slate-200"}`} />
              ))}
            </div>
            <p className="mt-1.5 text-xs font-bold text-brand-700">Etap: {STAGE_LABEL[stage]}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
