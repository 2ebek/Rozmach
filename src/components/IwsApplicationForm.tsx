"use client";

import { useEffect, useRef, useState } from "react";
import { postJson } from "@/lib/client";
import {
  APPLICANT_KIND_LABEL,
  IWS_SECTIONS,
  IwsForm,
  PREP_MAX_MONTHS,
  RODO_CLAUSES,
  SECTION_PREFILL,
  TEST_MAX_MONTHS,
  declarationsFor,
  formatPln,
  spanMonths,
  type ApplicantKind,
  type IwsSectionId,
} from "@/lib/iws";
import type { IdeaPrefillField, Nabor } from "@/lib/types";
import { CodeCard } from "./CodeCard";
import { Icon } from "./Icon";
import { Field, Panel, Status, btnCls, btnSecondaryCls, inputCls } from "./ui";

// ---------- stan formularza (wartości tekstowe, konwersja przy wysyłce) ----------

const person = { firstName: "", lastName: "", address: "", postalCode: "", city: "", phone: "", email: "" };
const contact = { role: "", name: "", phone: "", email: "" };
const entity = { name: "", krs: "", regon: "", nip: "", address: "", postalCode: "", city: "", phone: "", email: "", representative: { ...contact }, contact: { ...contact } };
type Partner = { kind: "osoba" | "podmiot"; name: string; details: string };
const newPartner = (): Partner => ({ kind: "osoba", name: "", details: "" });
type Row = { action: string; from: string; to: string; cost: string };
const newRow = (): Row => ({ action: "", from: "", to: "", cost: "" });
type PhaseKey = "preparation" | "testPhase1" | "testPhase2";

const PHASES: { key: PhaseKey; title: string; hint: string; required: boolean }[] = [
  { key: "preparation", title: "Okres przygotowawczy", hint: `Do ${PREP_MAX_MONTHS} miesięcy: przygotowanie testowania, rekrutacja odbiorców, zakupy.`, required: true },
  { key: "testPhase1", title: "Faza I testu", hint: "Pierwsza runda testowania z odbiorcami.", required: true },
  { key: "testPhase2", title: "Faza II testu (opcjonalnie)", hint: `Razem z fazą I najwyżej ${TEST_MAX_MONTHS} miesięcy testowania.`, required: false },
];

const STEPS = ["Wnioskodawca", "Treść innowacji", "Plan działania i budżet", "Oświadczenia"] as const;

/** Dane FIKCYJNE do pokazu prototypu – NIP i REGON mają poprawne sumy kontrolne, ale nie należą do nikogo. */
const EXAMPLE = {
  osoba: { firstName: "Anna", lastName: "Przykładowa", address: "ul. Testowa 1/2", postalCode: "30-001", city: "Kraków", phone: "+48 500 000 000", email: "anna@example.org" },
  podmiot: {
    name: "Fundacja Przykładowa (dane fikcyjne)",
    krs: "",
    regon: "123456785",
    nip: "5260250274",
    address: "ul. Przykładowa 10",
    postalCode: "30-002",
    city: "Kraków",
    phone: "+48 12 000 00 00",
    email: "biuro@example.org",
    representative: { role: "Prezes zarządu", name: "Jan Przykładowy", phone: "+48 500 000 001", email: "prezes@example.org" },
    contact: { role: "Koordynatorka", name: "Ewa Testowa", phone: "+48 500 000 002", email: "kontakt@example.org" },
  },
};

interface IdeaPrefill {
  title: string;
  idea?: Partial<Record<IdeaPrefillField, string>>;
  error?: string;
}

/**
 * Generator wniosku w naborze ROPS „Inkubator Włączenia Społecznego 2.0” – formularz jak Załącznik nr 3, w 4 krokach.
 * Treść merytoryczną można wczytać z fiszki pomysłu (po kodzie). Dane osobowe trafiają wyłącznie do panelu administratora.
 */
export function IwsApplicationForm({ nabor, initialIdeaCode = "" }: { nabor: Nabor; initialIdeaCode?: string }) {
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<ApplicantKind>("osoba");
  const [osoba, setOsoba] = useState(person);
  const [podmiot, setPodmiot] = useState(entity);
  const [partners, setPartners] = useState<Partner[]>([newPartner(), newPartner()]);
  const [groupContact, setGroupContact] = useState({ name: "", phone: "", email: "" });
  const [sections, setSections] = useState<Record<IwsSectionId, string>>(() => Object.fromEntries(IWS_SECTIONS.map((s) => [s.id, ""])) as Record<IwsSectionId, string>);
  const [plan, setPlan] = useState<Record<PhaseKey, Row[]>>({ preparation: [newRow()], testPhase1: [newRow()], testPhase2: [] });
  const [grant, setGrant] = useState<string | null>(null); // null = równa sumie kosztów
  const [declarations, setDeclarations] = useState<boolean[]>(() => declarationsFor("osoba").map(() => false));
  const [rodo, setRodo] = useState(false);
  const [ideaCode, setIdeaCode] = useState(initialIdeaCode);
  const [loadedFrom, setLoadedFrom] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const autoLoaded = useRef(false);

  async function loadIdea(c: string) {
    setLoadError(null);
    const res = await fetch(`/api/status?code=${encodeURIComponent(c)}`);
    const data = (await res.json().catch(() => ({}))) as IdeaPrefill;
    if (!res.ok || !data.idea) {
      setLoadError(data.error ?? "Ten kod nie należy do fiszki pomysłu.");
      return;
    }
    const source: Partial<Record<IdeaPrefillField, string>> = { ...data.idea, title: data.title };
    setSections((prev) => {
      const next = { ...prev };
      for (const [sec, field] of Object.entries(SECTION_PREFILL) as [IwsSectionId, IdeaPrefillField][]) if (!next[sec] && source[field]) next[sec] = source[field]!;
      return next;
    });
    setLoadedFrom(c.trim().toUpperCase());
  }

  useEffect(() => {
    if (initialIdeaCode && !autoLoaded.current) {
      autoLoaded.current = true;
      void loadIdea(initialIdeaCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialIdeaCode]);

  function changeKind(k: ApplicantKind) {
    setKind(k);
    setDeclarations(declarationsFor(k).map(() => false)); // inna lista oświadczeń (A albo B)
  }

  const rows = (k: PhaseKey) => plan[k].map((r) => ({ ...r, cost: Number(r.cost.replace(",", ".")) || 0 }));
  const allRows = [...rows("preparation"), ...rows("testPhase1"), ...rows("testPhase2")];
  const filledRows = (k: PhaseKey) => rows(k).filter((r) => r.from && r.to);
  const total = Math.round(allRows.reduce((s, r) => s + r.cost, 0) * 100) / 100;
  const grantValue = grant === null ? total : Number(grant.replace(",", ".")) || 0;
  const prepMonths = spanMonths(filledRows("preparation"));
  const testMonths = spanMonths([...filledRows("testPhase1"), ...filledRows("testPhase2")]);

  function buildForm() {
    const applicant =
      kind === "osoba"
        ? { kind, osoba }
        : kind === "podmiot"
          ? { kind, podmiot }
          : { kind, grupa: { partners, contact: groupContact } };
    return {
      applicant,
      sections,
      plan: { preparation: rows("preparation"), testPhase1: rows("testPhase1"), testPhase2: rows("testPhase2") },
      grantAmount: grantValue,
      declarations,
      rodoAccepted: rodo,
    };
  }

  function go(to: number) {
    setError(null);
    setStep(to);
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (step < STEPS.length - 1) return go(step + 1); // Enter / „Dalej” – przeglądarka sprawdziła już pola tego kroku
    const parsed = IwsForm.safeParse(buildForm());
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Sprawdź formularz.");
      return;
    }
    setBusy(true);
    try {
      const res = await postJson<{ code: string }>("/api/applications", { naborId: nabor.id, ideaCode: loadedFrom ?? undefined, form: parsed.data });
      setCode(res.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd.");
    } finally {
      setBusy(false);
    }
  }

  if (code) return <CodeCard code={code} kind="wniosku" />;

  const decls = declarationsFor(kind);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <Panel>
        <ol className="mb-6 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4" aria-label="Kroki formularza">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => (i < step || formRef.current?.reportValidity()) && go(i)}
                aria-current={i === step ? "step" : undefined}
                className={`w-full rounded-lg border-2 px-3 py-2 text-left font-bold ${i === step ? "border-brand-900 bg-brand-900 text-white" : i < step ? "border-emerald-700 text-emerald-900" : "border-slate-200 text-slate-700"}`}
              >
                <span className="block text-xs font-normal">Krok {i + 1}</span>
                {s}
              </button>
            </li>
          ))}
        </ol>

        <form ref={formRef} onSubmit={onSubmit} className="space-y-6">
          <h2 ref={headingRef} tabIndex={-1} className="text-xl font-black text-brand-900 outline-none">
            {step + 1}. {STEPS[step]}
          </h2>

          {step === 0 && (
            <>
              <p role="note" className="rounded-lg border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm text-slate-900">
                <strong>Prototyp:</strong> nie wpisuj prawdziwych danych osobowych. Użyj danych przykładowych – przycisk poniżej wstawi fikcyjne dane. Dane wnioskodawcy widzi
                tylko administrator naboru; nie trafiają do asystenta AI ani na stronę statusu.
              </p>
              <fieldset>
                <legend className="mb-2 font-bold text-brand-900">Kto składa wniosek?</legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {(Object.keys(APPLICANT_KIND_LABEL) as ApplicantKind[]).map((k) => (
                    <label
                      key={k}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-2.5 font-bold has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-accent ${kind === k ? "border-brand-700 bg-brand-50 text-brand-900" : "border-slate-300 text-brand-900"}`}
                    >
                      <input type="radio" name="applicant-kind" value={k} checked={kind === k} onChange={() => changeKind(k)} />
                      {APPLICANT_KIND_LABEL[k]}
                    </label>
                  ))}
                </div>
              </fieldset>
              {kind !== "grupa" && (
                <button
                  type="button"
                  className={btnSecondaryCls}
                  onClick={() => (kind === "osoba" ? setOsoba(EXAMPLE.osoba) : setPodmiot({ ...EXAMPLE.podmiot, representative: { ...EXAMPLE.podmiot.representative }, contact: { ...EXAMPLE.podmiot.contact } }))}
                >
                  Wstaw dane przykładowe
                </button>
              )}

              {kind === "osoba" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Text id="os-first" label="Imię" auto="given-name" value={osoba.firstName} set={(v) => setOsoba({ ...osoba, firstName: v })} />
                  <Text id="os-last" label="Nazwisko" auto="family-name" value={osoba.lastName} set={(v) => setOsoba({ ...osoba, lastName: v })} />
                  <Text id="os-address" label="Adres korespondencyjny (ulica, nr)" auto="street-address" value={osoba.address} set={(v) => setOsoba({ ...osoba, address: v })} wide />
                  <Text id="os-postal" label="Kod pocztowy" auto="postal-code" pattern="\d{2}-\d{3}" placeholder="00-000" value={osoba.postalCode} set={(v) => setOsoba({ ...osoba, postalCode: v })} />
                  <Text id="os-city" label="Miejscowość" auto="address-level2" value={osoba.city} set={(v) => setOsoba({ ...osoba, city: v })} />
                  <Text id="os-phone" label="Telefon" type="tel" auto="tel" value={osoba.phone} set={(v) => setOsoba({ ...osoba, phone: v })} />
                  <Text id="os-email" label="E-mail" type="email" auto="email" value={osoba.email} set={(v) => setOsoba({ ...osoba, email: v })} />
                </div>
              )}

              {kind === "podmiot" && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Text id="pd-name" label="Nazwa podmiotu" auto="organization" value={podmiot.name} set={(v) => setPodmiot({ ...podmiot, name: v })} wide />
                    <Text id="pd-krs" label="KRS (jeśli dotyczy)" required={false} inputMode="numeric" value={podmiot.krs} set={(v) => setPodmiot({ ...podmiot, krs: v })} />
                    <Text id="pd-regon" label="REGON" inputMode="numeric" value={podmiot.regon} set={(v) => setPodmiot({ ...podmiot, regon: v })} />
                    <Text id="pd-nip" label="NIP" inputMode="numeric" value={podmiot.nip} set={(v) => setPodmiot({ ...podmiot, nip: v })} />
                    <Text id="pd-address" label="Adres siedziby (ulica, nr)" auto="street-address" value={podmiot.address} set={(v) => setPodmiot({ ...podmiot, address: v })} />
                    <Text id="pd-postal" label="Kod pocztowy" auto="postal-code" pattern="\d{2}-\d{3}" placeholder="00-000" value={podmiot.postalCode} set={(v) => setPodmiot({ ...podmiot, postalCode: v })} />
                    <Text id="pd-city" label="Miejscowość" auto="address-level2" value={podmiot.city} set={(v) => setPodmiot({ ...podmiot, city: v })} />
                    <Text id="pd-phone" label="Telefon" type="tel" value={podmiot.phone} set={(v) => setPodmiot({ ...podmiot, phone: v })} />
                    <Text id="pd-email" label="E-mail" type="email" value={podmiot.email} set={(v) => setPodmiot({ ...podmiot, email: v })} />
                  </div>
                  {(["representative", "contact"] as const).map((who) => (
                    <fieldset key={who} className="rounded-xl border border-slate-200 p-4">
                      <legend className="px-1 font-bold text-brand-900">{who === "representative" ? "Osoba upoważniona do reprezentowania podmiotu" : "Osoba do kontaktów roboczych"}</legend>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {(["role", "name", "phone", "email"] as const).map((f) => (
                          <Text
                            key={f}
                            id={`pd-${who}-${f}`}
                            label={{ role: "Funkcja", name: "Imię i nazwisko", phone: "Telefon", email: "E-mail" }[f]}
                            type={f === "email" ? "email" : f === "phone" ? "tel" : "text"}
                            value={podmiot[who][f]}
                            set={(v) => setPodmiot({ ...podmiot, [who]: { ...podmiot[who], [f]: v } })}
                          />
                        ))}
                      </div>
                    </fieldset>
                  ))}
                </>
              )}

              {kind === "grupa" && (
                <>
                  <p className="text-sm text-slate-700">Grupa nieformalna to 2–5 partnerów (osób fizycznych lub podmiotów). Każdy partner składa oświadczenia z pkt 12 A.</p>
                  {partners.map((p, i) => (
                    <fieldset key={i} className="rounded-xl border border-slate-200 p-4">
                      <legend className="px-1 font-bold text-brand-900">Partner {i + 1}</legend>
                      <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
                        <Field id={`gr-${i}-kind`} label="Rodzaj">
                          <select id={`gr-${i}-kind`} value={p.kind} onChange={(e) => setPartners(partners.map((x, j) => (j === i ? { ...x, kind: e.target.value as Partner["kind"] } : x)))} className={inputCls}>
                            <option value="osoba">Osoba fizyczna</option>
                            <option value="podmiot">Podmiot</option>
                          </select>
                        </Field>
                        <Text id={`gr-${i}-name`} label={p.kind === "osoba" ? "Imię i nazwisko" : "Nazwa podmiotu"} value={p.name} set={(v) => setPartners(partners.map((x, j) => (j === i ? { ...x, name: v } : x)))} />
                      </div>
                      <div className="mt-4">
                        <Field id={`gr-${i}-details`} label={p.kind === "osoba" ? "Adres, telefon, e-mail" : "KRS/REGON/NIP, adres siedziby, reprezentant, kontakt"}>
                          <textarea id={`gr-${i}-details`} required rows={2} maxLength={1000} value={p.details} onChange={(e) => setPartners(partners.map((x, j) => (j === i ? { ...x, details: e.target.value } : x)))} className={inputCls} />
                        </Field>
                      </div>
                      {partners.length > 2 && (
                        <button type="button" onClick={() => setPartners(partners.filter((_, j) => j !== i))} className="mt-3 text-sm font-bold text-slate-700 underline hover:text-accent">
                          Usuń partnera {i + 1}
                        </button>
                      )}
                    </fieldset>
                  ))}
                  {partners.length < 5 && (
                    <button type="button" onClick={() => setPartners([...partners, newPartner()])} className={btnSecondaryCls}>
                      <Icon name="plus" className="h-4 w-4" /> Dodaj partnera
                    </button>
                  )}
                  <fieldset className="rounded-xl border border-slate-200 p-4">
                    <legend className="px-1 font-bold text-brand-900">Osoba reprezentująca grupę w kontaktach roboczych</legend>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Text id="gr-contact-name" label="Imię i nazwisko" value={groupContact.name} set={(v) => setGroupContact({ ...groupContact, name: v })} />
                      <Text id="gr-contact-phone" label="Telefon" type="tel" value={groupContact.phone} set={(v) => setGroupContact({ ...groupContact, phone: v })} />
                      <Text id="gr-contact-email" label="E-mail" type="email" value={groupContact.email} set={(v) => setGroupContact({ ...groupContact, email: v })} />
                    </div>
                  </fieldset>
                </>
              )}
            </>
          )}

          {step === 1 &&
            IWS_SECTIONS.map((s) => {
              const id = `iws-${s.id}`;
              const v = sections[s.id];
              const set = (value: string) => setSections({ ...sections, [s.id]: value });
              return (
                <Field key={s.id} id={id} label={`${s.no}. ${s.label}`} hint={s.hint}>
                  {s.long ? (
                    <textarea id={id} aria-describedby={`${id}-hint ${id}-count`} required minLength={20} rows={5} maxLength={s.max} value={v} onChange={(e) => set(e.target.value)} className={inputCls} />
                  ) : (
                    <input id={id} aria-describedby={`${id}-hint ${id}-count`} required minLength={3} maxLength={s.max} value={v} onChange={(e) => set(e.target.value)} className={inputCls} />
                  )}
                  <p id={`${id}-count`} className="text-right text-xs text-slate-600">
                    {v.length} / {s.max} znaków
                  </p>
                </Field>
              );
            })}

          {step === 2 && (
            <>
              <p className="text-[0.95rem] text-slate-700">
                Pkt 9 i 10 formularza: działania z terminami (miesiąc i rok) i kosztami. Okres przygotowawczy do {PREP_MAX_MONTHS} miesięcy, testowanie (faza I + II) do{" "}
                {TEST_MAX_MONTHS} miesięcy. Wnioskowana kwota grantu musi być równa sumie kosztów.
              </p>
              {PHASES.map((ph) => (
                <fieldset key={ph.key} className="rounded-xl border border-slate-200 p-4">
                  <legend className="px-1 font-black text-brand-900">{ph.title}</legend>
                  <p className="text-sm text-slate-600">{ph.hint}</p>
                  {plan[ph.key].map((r, i) => {
                    const set = (patch: Partial<Row>) => setPlan({ ...plan, [ph.key]: plan[ph.key].map((x, j) => (j === i ? { ...x, ...patch } : x)) });
                    const base = `plan-${ph.key}-${i}`;
                    return (
                      <div key={i} className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-[1fr_9.5rem_9.5rem_8rem]">
                        <Field id={`${base}-action`} label={`Działanie ${i + 1}`}>
                          <input id={`${base}-action`} required maxLength={500} value={r.action} onChange={(e) => set({ action: e.target.value })} className={inputCls} />
                        </Field>
                        <Field id={`${base}-from`} label="Od (miesiąc)">
                          <input id={`${base}-from`} type="month" required value={r.from} onChange={(e) => set({ from: e.target.value })} className={inputCls} />
                        </Field>
                        <Field id={`${base}-to`} label="Do (miesiąc)">
                          <input id={`${base}-to`} type="month" required min={r.from || undefined} value={r.to} onChange={(e) => set({ to: e.target.value })} className={inputCls} />
                        </Field>
                        <Field id={`${base}-cost`} label="Koszt (zł)">
                          <input id={`${base}-cost`} type="number" required min={0} step="0.01" inputMode="decimal" value={r.cost} onChange={(e) => set({ cost: e.target.value })} className={inputCls} />
                        </Field>
                        {(plan[ph.key].length > 1 || !ph.required) && (
                          <button
                            type="button"
                            onClick={() => setPlan({ ...plan, [ph.key]: plan[ph.key].filter((_, j) => j !== i) })}
                            className="justify-self-start text-sm font-bold text-slate-700 underline hover:text-accent sm:col-span-4"
                          >
                            Usuń działanie {i + 1}
                          </button>
                        )}
                      </div>
                    );
                  })}
                  <button type="button" onClick={() => setPlan({ ...plan, [ph.key]: [...plan[ph.key], newRow()] })} className={`${btnSecondaryCls} mt-4`}>
                    <Icon name="plus" className="h-4 w-4" /> Dodaj działanie
                  </button>
                </fieldset>
              ))}
              <div className="grid gap-4 rounded-xl bg-mist p-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-bold text-slate-700">Suma kosztów</p>
                  <p className="text-2xl font-black text-brand-900" id="plan-total">
                    {formatPln(total)}
                  </p>
                </div>
                <Field id="grant-amount" label="Wnioskowana kwota grantu (zł)">
                  <input
                    id="grant-amount"
                    type="number"
                    required
                    min={0.01}
                    step="0.01"
                    value={grant ?? String(total || "")}
                    onChange={(e) => setGrant(e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <fieldset>
                <legend className="mb-2 font-black text-brand-900">
                  12 {kind === "podmiot" ? "B" : "A"}. Oświadczenia {kind === "podmiot" ? "reprezentanta podmiotu" : kind === "grupa" ? "(każdy partner grupy nieformalnej)" : "osoby fizycznej"}
                </legend>
                <p className="mb-3 text-sm text-slate-700">
                  {kind === "podmiot" ? "Reprezentując podmiot, oświadczam, że:" : "Oświadczam, że:"} – wszystkie oświadczenia są warunkiem udziału w naborze.
                </p>
                <label className="mb-3 flex items-center gap-2 font-bold text-brand-700">
                  <input
                    type="checkbox"
                    checked={declarations.every(Boolean)}
                    onChange={(e) => setDeclarations(decls.map(() => e.target.checked))}
                    className="h-5 w-5"
                  />
                  Zaznacz wszystkie oświadczenia
                </label>
                <ol className="space-y-2">
                  {decls.map((d, i) => (
                    <li key={i}>
                      <label className="flex gap-3 rounded-lg border border-slate-200 p-3 text-[0.95rem] text-slate-800">
                        <input type="checkbox" required checked={declarations[i] ?? false} onChange={(e) => setDeclarations(declarations.map((x, j) => (j === i ? e.target.checked : x)))} className="mt-1 h-5 w-5 shrink-0" />
                        <span>
                          {i + 1}. {d}
                        </span>
                      </label>
                    </li>
                  ))}
                </ol>
              </fieldset>
              <details className="rounded-xl border border-slate-200 p-4">
                <summary className="cursor-pointer font-bold text-brand-700">Klauzule informacyjne RODO (pkt 13)</summary>
                {RODO_CLAUSES.map((c) => (
                  <div key={c.title} className="mt-4">
                    <h3 className="font-black text-brand-900">{c.title}</h3>
                    <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-800">
                      {c.points.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ol>
                  </div>
                ))}
              </details>
              <label className="flex gap-3 rounded-lg border-2 border-brand-700 p-3 font-bold text-brand-900">
                <input type="checkbox" required checked={rodo} onChange={(e) => setRodo(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0" />
                Zapoznałem/am się z klauzulami informacyjnymi RODO.
              </label>
            </>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-6">
            {step > 0 && (
              <button type="button" onClick={() => go(step - 1)} className={btnSecondaryCls}>
                Wstecz
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button type="submit" className={btnCls}>
                Dalej <Icon name="arrow" className="h-5 w-5" />
              </button>
            ) : (
              <button type="submit" disabled={busy} className={btnCls}>
                <Icon name="send" className="h-5 w-5" /> {busy ? "Wysyłam…" : "Złóż wniosek"}
              </button>
            )}
          </div>
          <Status error={error} />
        </form>
      </Panel>

      <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-2xl bg-brand-50 p-6">
          <h2 className="text-lg font-black">Masz już fiszkę?</h2>
          <p className="mt-1 text-[0.95rem] text-slate-700">Wpisz jej kod – przepiszemy punkty 1 i 3–8 do wniosku.</p>
          <div className="mt-3 flex gap-2">
            <label htmlFor="idea-code" className="sr-only">
              Kod fiszki
            </label>
            <input id="idea-code" value={ideaCode} onChange={(e) => setIdeaCode(e.target.value)} placeholder="HUB-…" className={`${inputCls} py-2 font-bold uppercase`} />
            <button type="button" onClick={() => ideaCode && void loadIdea(ideaCode)} className={btnSecondaryCls}>
              Wczytaj
            </button>
          </div>
          <div aria-live="polite" className="mt-2 text-sm">
            {loadedFrom && <p className="font-bold text-emerald-800">Wczytano treść z fiszki {loadedFrom}.</p>}
            {loadError && <p className="font-bold text-red-800">{loadError}</p>}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-black">Kontrola wniosku</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            <Check ok={IWS_SECTIONS.every((s) => sections[s.id].trim().length >= (s.long ? 20 : 3))}>Treść: pkt 1, 3–8 i 11</Check>
            <Check ok={prepMonths > 0 && prepMonths <= PREP_MAX_MONTHS}>
              Przygotowanie: {prepMonths} / {PREP_MAX_MONTHS} mies.
            </Check>
            <Check ok={testMonths > 0 && testMonths <= TEST_MAX_MONTHS}>
              Testowanie: {testMonths} / {TEST_MAX_MONTHS} mies.
            </Check>
            <Check ok={total > 0 && Math.abs(grantValue - total) < 0.005}>Grant {formatPln(grantValue)} = suma kosztów</Check>
            <Check ok={declarations.length === decls.length && declarations.every(Boolean) && rodo}>Oświadczenia i RODO</Check>
          </ul>
        </div>
      </aside>
    </div>
  );
}

function Check({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-start gap-2 ${ok ? "text-emerald-900" : "text-slate-700"}`}>
      <span aria-hidden className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full text-[0.65rem] font-black text-white ${ok ? "bg-emerald-700" : "bg-slate-400"}`}>
        {ok ? "✓" : "–"}
      </span>
      <span>
        {children}
        <span className="sr-only">{ok ? " – w porządku" : " – do uzupełnienia"}</span>
      </span>
    </li>
  );
}

function Text({
  id,
  label,
  value,
  set,
  type = "text",
  auto,
  pattern,
  placeholder,
  inputMode,
  required = true,
  wide,
}: {
  id: string;
  label: string;
  value: string;
  set: (v: string) => void;
  type?: "text" | "email" | "tel";
  auto?: string;
  pattern?: string;
  placeholder?: string;
  inputMode?: "numeric" | "decimal";
  required?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <Field id={id} label={label}>
        <input
          id={id}
          type={type}
          autoComplete={auto}
          pattern={pattern}
          placeholder={placeholder}
          inputMode={inputMode}
          required={required}
          maxLength={200}
          value={value}
          onChange={(e) => set(e.target.value)}
          className={inputCls}
        />
      </Field>
    </div>
  );
}
