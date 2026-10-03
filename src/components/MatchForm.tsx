"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { postJson } from "@/lib/client";
import { AREAS, AREA_COLOR, AREA_LABEL, STAGE_LABEL } from "@/lib/labels";
import type { AiMatchInfo, Challenge, ChallengeArea, MatchResult } from "@/lib/types";
import { Icon } from "./Icon";
import { Badge, Dot, Field, Panel, btnCls, inputCls } from "./ui";

const EXAMPLES = [
  "Mama ma demencję i coraz częściej zapomina – szukamy sposobu na ćwiczenie pamięci w domu",
  "Dziecko z autyzmem w naszej szkole potrzebuje wsparcia sensorycznego",
  "Seniorzy boją się biletomatów i kiosków samoobsługowych",
];

interface MatchContext {
  similar: { text: string; area?: ChallengeArea; createdAt: string }[];
  challenge: Challenge | null;
  /** "ai" – dopasował model; "lokalne" – wyszukiwanie słów kluczowych (AI wyłączone lub niedostępne). */
  source: "ai" | "lokalne";
  ai: AiMatchInfo | null;
}

type MatchResponse = { results: MatchResult[] } & MatchContext;

/** Pamięć wyników w obrębie karty przeglądarki – wygoda przy powrocie; brak dostępu nie psuje wyszukiwania. */
function readCache(key: string): MatchResponse | null {
  try {
    const raw = sessionStorage.getItem(`hub-match:${key}`);
    return raw ? (JSON.parse(raw) as MatchResponse) : null;
  } catch {
    return null;
  }
}
function writeCache(key: string, data: MatchResponse) {
  try {
    sessionStorage.setItem(`hub-match:${key}`, JSON.stringify(data));
  } catch {
    /* tryb prywatny / brak miejsca – trudno, wyszukamy ponownie */
  }
}

/** Progi: dla AI wynik to ocena dopasowania (0.2/0.5/0.9), dla TF-IDF – podobieństwo tekstu. */
function relevance(score: number, ai: boolean): { label: string; cls: string } {
  const [high, mid] = ai ? [0.8, 0.4] : [0.15, 0.05];
  if (score >= high) return { label: "wysoka", cls: "bg-emerald-100 text-emerald-900" };
  if (score >= mid) return { label: "średnia", cls: "bg-amber-100 text-amber-900" };
  return { label: "niska", cls: "bg-slate-200 text-slate-800" };
}

/** `initialQuery`/`initialArea` przychodzą z wyszukiwarki lub kafelków (?q=…&area=…) – wtedy szukamy od razu. */
export function MatchForm({ initialQuery = "", initialArea }: { initialQuery?: string; initialArea?: ChallengeArea }) {
  const [text, setText] = useState(initialQuery);
  const [area, setArea] = useState<ChallengeArea | "">(initialArea ?? "");
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [context, setContext] = useState<MatchContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const resultsRef = useRef<HTMLHeadingElement>(null);
  // StrictMode w dev uruchamia efekt dwa razy – bez tego ta sama potrzeba zapisałaby się podwójnie
  const lastAuto = useRef<string | null>(null);

  useEffect(() => {
    // Przy „Wstecz” router Next.js odtwarza stronę z pamięci bez ?q=… – wtedy zapytanie bierzemy z adresu.
    const fromUrl = new URLSearchParams(window.location.search);
    const q = initialQuery || fromUrl.get("q") || "";
    const a = initialArea ?? (AREAS.find((x) => x === fromUrl.get("area")) || "");
    setText(q);
    setArea(a);
    const key = `${q}|${a}`;
    if (q && lastAuto.current !== key) {
      lastAuto.current = key;
      // powrót z karty innowacji: wyniki z pamięci karty – bez ponownego zapytania i bez dublowania zgłoszenia
      const cached = readCache(key);
      if (cached) show(cached);
      else void search(q, a);
    }
  }, [initialQuery, initialArea]);

  function show(data: MatchResponse) {
    setResults(data.results);
    setContext({ similar: data.similar, challenge: data.challenge, source: data.source ?? "lokalne", ai: data.ai ?? null });
  }

  async function search(q: string, a: ChallengeArea | "", focus = false) {
    setLoading(true);
    setError(null);
    try {
      const data = await postJson<MatchResponse>("/api/match", { text: q, area: a || undefined });
      show(data);
      // adres z zapytaniem: „Wstecz” z karty innowacji wraca do tych samych wyników
      const key = `${q}|${a}`;
      lastAuto.current = key;
      writeCache(key, data);
      const params = new URLSearchParams({ q, ...(a ? { area: a } : {}) });
      window.history.replaceState(null, "", `/dopasuj?${params.toString()}`);
      // po wyszukaniu przenosimy fokus na nagłówek wyników (czytnik ekranu od razu je ogłosi)
      if (focus) requestAnimationFrame(() => resultsRef.current?.focus());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd.");
    } finally {
      setLoading(false);
    }
  }

  const top = results?.[0]?.score ?? 1;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_19rem]">
      <div className="space-y-10">
        <Panel>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void search(text, area, true);
            }}
            className="space-y-5"
          >
            <Field id="problem" label="Opisz problem lub potrzebę" hint="Kogo dotyczy, gdzie występuje, co już próbowaliście. Wystarczy kilka zdań.">
              <textarea
                id="problem"
                aria-describedby="problem-hint"
                required
                minLength={3}
                rows={5}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="np. W naszej gminie starsze osoby mieszkają same i rzadko wychodzą z domu…"
                className={`${inputCls} resize-y text-lg`}
              />
            </Field>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Field id="area" label="Kogo dotyczy? (kategoria Biblioteki ROPS, opcjonalnie)">
                  <select id="area" value={area} onChange={(e) => setArea(e.target.value as ChallengeArea | "")} className={inputCls}>
                    <option value="">Wszystkie kategorie</option>
                    {AREAS.map((a) => (
                      <option key={a} value={a}>
                        {AREA_LABEL[a]}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <button type="submit" disabled={loading} className={`${btnCls} sm:py-3.5`}>
                <Icon name="search" className="h-5 w-5" />
                {loading ? "Szukam…" : "Znajdź rozwiązania"}
              </button>
            </div>
          </form>

          {!results && (
            <div className="mt-6 border-t border-slate-200 pt-5">
              <p className="mb-2 text-sm font-bold text-slate-700">Nie wiesz, jak zacząć? Wybierz przykład:</p>
              <ul className="flex flex-col gap-2">
                {EXAMPLES.map((e) => (
                  <li key={e}>
                    <button
                      type="button"
                      onClick={() => {
                        setText(e);
                        void search(e, area, true);
                      }}
                      className="w-full rounded-lg bg-mist px-4 py-2.5 text-left text-slate-800 transition hover:bg-brand-50 hover:text-brand-900"
                    >
                      „{e}”
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>

        <section aria-live="polite" aria-busy={loading}>
          {error && (
            <p role="alert" className="rounded-lg border-l-4 border-red-700 bg-red-50 px-4 py-3 font-semibold text-red-900">
              {error}
            </p>
          )}

          {loading && <p className="mb-4 font-bold text-brand-700">Analizujemy opis i szukamy rozwiązań – to może potrwać kilka sekund…</p>}
          {loading && (
            <ul aria-hidden className="space-y-4">
              {[0, 1, 2].map((i) => (
                <li key={i} className="animate-pulse rounded-2xl border border-slate-200 p-6">
                  <div className="h-5 w-1/3 rounded bg-slate-200" />
                  <div className="mt-3 h-4 w-full rounded bg-slate-100" />
                  <div className="mt-2 h-4 w-2/3 rounded bg-slate-100" />
                </li>
              ))}
            </ul>
          )}

          {!loading && results && (
            <>
              <h2 ref={resultsRef} tabIndex={-1} className="mb-5 text-2xl font-black outline-none">
                {results.length > 0 ? `Znaleźliśmy ${results.length} ${results.length === 1 ? "propozycję" : results.length < 5 ? "propozycje" : "propozycji"}` : "Brak dopasowań"}
              </h2>

              {context?.ai && (
                <div className="mb-6 rounded-2xl border border-brand-100 bg-brand-50 p-5">
                  <p className="flex items-center gap-2 text-sm font-bold text-brand-700">
                    <Icon name="sparkle" className="h-4 w-4" /> Dopasowanie AI
                  </p>
                  <p className="mt-1 text-slate-800">{context.ai.summary}</p>
                </div>
              )}

              {results.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center">
                  <p className="text-lg font-bold text-brand-900">Nie znaleźliśmy jeszcze podobnej innowacji.</p>
                  <p className="mt-1 text-slate-700">Spróbuj opisać problem innymi słowami – albo zgłoś własny pomysł. Może to Ty go rozwiążesz?</p>
                  <Link href="/kreator" className={`${btnCls} mt-5 no-underline`}>
                    Zgłoś pomysł
                  </Link>
                </div>
              ) : (
                <ol className="space-y-4">
                  {results.map((r, i) => {
                    const rel = relevance(r.score, context?.source === "ai");
                    return (
                      <li key={r.innovation.id} className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-brand-100 hover:shadow-[0_12px_32px_-16px_rgba(0,15,55,0.3)]">
                        <div className="flex gap-4">
                          <span aria-hidden className={`grid h-10 w-10 shrink-0 place-items-center rounded-full font-black ${i === 0 ? "bg-accent text-white" : "bg-brand-50 text-brand-700"}`}>
                            {i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <h3 className="text-xl font-black text-brand-900">{r.innovation.title}</h3>
                              <Badge className={rel.cls}>Trafność: {rel.label}</Badge>
                            </div>
                            <p className="mt-2 text-slate-700">{r.innovation.subtitle || r.innovation.summary}</p>
                            <Link href={`/zasobnik/${r.innovation.id}`} className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:text-accent">
                              Karta innowacji: problem, grupa docelowa, materiały <Icon name="arrow" className="h-3.5 w-3.5" />
                            </Link>

                            <div aria-hidden className="mt-4 h-1.5 overflow-hidden rounded-full bg-mist">
                              <div className="h-full rounded-full bg-gradient-to-r from-brand-700 to-accent" style={{ width: `${Math.max(8, (r.score / top) * 100)}%` }} />
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                              {r.innovation.areas.map((a) => (
                                <span key={a} className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                                  <Dot className={AREA_COLOR[a]} /> {AREA_LABEL[a]}
                                </span>
                              ))}
                              <Badge>{STAGE_LABEL[r.innovation.stage]}</Badge>
                            </div>

                            {r.reason && (
                              <p className="mt-3 text-[0.95rem] text-slate-800">
                                <span className="font-bold">Dlaczego ta propozycja? </span>
                                {r.reason}
                              </p>
                            )}
                            {r.matchedTerms.length > 0 && (
                              <p className="mt-3 text-sm text-slate-700">
                                {!r.reason && <span className="font-bold">Dlaczego ta propozycja? </span>}
                                Wspólne słowa:{" "}
                                {r.matchedTerms.map((t) => (
                                  <mark key={t} className="mx-0.5 rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-950">
                                    {t}
                                  </mark>
                                ))}
                              </p>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}

              {context?.ai && context.ai.ideas.length > 0 && (
                <section aria-labelledby="h-pomysly-hubu" className="mt-10">
                  <h3 id="h-pomysly-hubu" className="mb-1 text-xl font-black text-brand-900">
                    Podobne pomysły zgłoszone w Hubie
                  </h3>
                  <p className="mb-4 text-sm text-slate-600">Ich autorzy mogą zostać Twoimi partnerami – napisz do zespołu Hubu w zakładce Rozmowy.</p>
                  <ul className="space-y-3">
                    {context.ai.ideas.map((idea, i) =>
                      idea.pending ? (
                        <li key={`pending-${i}`} className="rounded-2xl border-2 border-dashed border-slate-300 p-5 text-slate-700">
                          Podobny pomysł został już zgłoszony i czeka na weryfikację przez zespół Hubu.
                        </li>
                      ) : (
                        <li key={`${idea.title}-${i}`} className="rounded-2xl border border-slate-200 bg-white p-5">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="text-lg font-black text-brand-900">{idea.title}</p>
                            {idea.stage && <Badge>{STAGE_LABEL[idea.stage]}</Badge>}
                          </div>
                          <p className="mt-1 text-slate-700">{idea.essence}</p>
                          {idea.audience && <p className="mt-1 text-sm text-slate-600">Dla: {idea.audience}</p>}
                          {idea.reason && (
                            <p className="mt-3 text-[0.95rem] text-slate-800">
                              <span className="font-bold">Dlaczego podobny? </span>
                              {idea.reason}
                            </p>
                          )}
                        </li>
                      ),
                    )}
                  </ul>
                </section>
              )}

              {context?.ai?.nextStep && (
                <p className="mt-8 flex gap-3 rounded-2xl bg-brand-900 p-5 text-white">
                  <Icon name="arrow" className="mt-1 h-5 w-5 shrink-0 text-sun" />
                  <span>
                    <span className="font-bold">Co dalej? </span>
                    {context.ai.nextStep}
                  </span>
                </p>
              )}

              {context?.source === "lokalne" && (
                <p className="mt-6 text-sm text-slate-600">Wyniki z wyszukiwania słów kluczowych – asystent AI jest teraz niedostępny.</p>
              )}

              {context && (context.challenge || context.similar.length > 0) && (
                <div className="mt-10 grid gap-5 md:grid-cols-2">
                  {context.challenge && (
                    <div className="rounded-2xl bg-brand-50 p-6">
                      <p className="text-sm font-bold uppercase tracking-wider text-accent">Co wiemy o tym wyzwaniu</p>
                      <h3 className="mt-2 flex items-center gap-2 text-xl font-black text-brand-900">
                        <Dot className={AREA_COLOR[context.challenge.area]} /> {context.challenge.title}
                      </h3>
                      <p className="mt-1 text-slate-700">{context.challenge.description}</p>
                      {context.challenge.indicator && (
                        <p className="mt-3">
                          <span className="text-3xl font-black text-brand-900">
                            {context.challenge.indicator.value}
                            {context.challenge.indicator.unit}
                          </span>{" "}
                          <span className="text-sm text-slate-600">{context.challenge.indicator.label}</span>
                        </p>
                      )}
                      <Link href="/zasobnik#wyzwania" className="mt-4 inline-flex items-center gap-1.5 font-bold text-brand-700 hover:text-accent">
                        Więcej w Zasobniku wiedzy <Icon name="arrow" className="h-4 w-4" />
                      </Link>
                    </div>
                  )}
                  {context.similar.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 p-6">
                      <p className="text-sm font-bold uppercase tracking-wider text-accent">Podobne przypadki</p>
                      <h3 className="mt-2 text-xl font-black text-brand-900">Inni zgłaszali podobny problem</h3>
                      <ul className="mt-3 space-y-3">
                        {context.similar.map((s) => (
                          <li key={s.text + s.createdAt} className="rounded-xl bg-mist px-4 py-3">
                            <p className="text-slate-800">„{s.text}”</p>
                            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                              {s.area && <Dot className={AREA_COLOR[s.area]} />}
                              {s.area ? AREA_LABEL[s.area] : "Bez obszaru"} ·{" "}
                              {new Date(s.createdAt).toLocaleDateString("pl-PL", { day: "numeric", month: "long" })}
                            </p>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 text-sm text-slate-600">Nie jesteś sam – zespół Hubu widzi, które problemy powtarzają się w regionie.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <aside className="space-y-5">
        <div className="rounded-2xl bg-brand-900 p-6 text-white">
          <h2 className="text-lg font-black !text-white">Jak dobrze opisać problem?</h2>
          <ul className="mt-3 space-y-2.5 text-[0.95rem] text-slate-200">
            {["Kogo dotyczy – np. seniorów, młodzieży, rodzin.", "Gdzie – wieś, miasto, konkretna gmina.", "Co już próbowaliście i co nie zadziałało."].map((t) => (
              <li key={t} className="flex gap-2.5">
                <span aria-hidden className="mt-2 h-2 w-2 shrink-0 rounded-full bg-sun" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-black">Nie znalazłeś rozwiązania?</h2>
          <p className="mt-2 text-[0.95rem] text-slate-700">Twój opis trafia do zespołu Hubu i pomaga nam wyznaczać, nad czym warto pracować.</p>
          <Link href="/kreator" className="mt-4 inline-flex items-center gap-1.5 font-bold text-brand-700 hover:text-accent">
            Zgłoś własny pomysł <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-black">Wolisz porozmawiać?</h2>
          <p className="mt-2 text-[0.95rem] text-slate-700">Mentorzy pomogą nazwać problem i wskażą, gdzie szukać wsparcia.</p>
          <Link href="/komunikacja" className="mt-4 inline-flex items-center gap-1.5 font-bold text-brand-700 hover:text-accent">
            Napisz do mentora <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
      </aside>
    </div>
  );
}
