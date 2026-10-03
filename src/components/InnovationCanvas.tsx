"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { btnCls, btnSecondaryCls } from "./ui";

/** Uproszczona Canva innowacji społecznych – 9 pól ułożonych jak na planszy. */
const FIELDS: { id: string; label: string; hint: string; span: string; tint: string }[] = [
  { id: "problem", label: "Problem", hint: "Co jest nie tak? Kogo dotyczy i jak bardzo?", span: "lg:col-span-2", tint: "border-t-accent" },
  { id: "odbiorcy", label: "Odbiorcy", hint: "Dla kogo konkretnie? Opisz jedną osobę.", span: "", tint: "border-t-accent" },
  { id: "wartosc", label: "Wartość", hint: "Co zmieni się w życiu odbiorców?", span: "", tint: "border-t-brand-700" },
  { id: "rozwiazanie", label: "Rozwiązanie", hint: "Na czym polega pomysł – w 2–3 zdaniach.", span: "lg:col-span-2", tint: "border-t-brand-700" },
  { id: "dzialania", label: "Kluczowe działania", hint: "Co trzeba robić, żeby to działało?", span: "", tint: "border-t-sun" },
  { id: "zasoby", label: "Zasoby", hint: "Ludzie, miejsce, sprzęt, wiedza.", span: "", tint: "border-t-sun" },
  { id: "partnerzy", label: "Partnerzy", hint: "Gmina, CUS, NGO, szkoła, biznes…", span: "", tint: "border-t-sun" },
  { id: "koszty", label: "Koszty i finansowanie", hint: "Ile to kosztuje i kto zapłaci?", span: "", tint: "border-t-emerald-600" },
  { id: "wplyw", label: "Miary sukcesu", hint: "Po czym poznasz, że działa?", span: "lg:col-span-2", tint: "border-t-emerald-600" },
];

const STORAGE_KEY = "hub-canva-v1";

export function InnovationCanvas() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  // Szkic zapisuje się tylko w tej przeglądarce – wygoda, nie przechowywanie danych.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setValues(JSON.parse(raw) as Record<string, string>);
    } catch {
      /* brak dostępu do pamięci przeglądarki – działamy bez autozapisu */
    }
  }, []);

  function update(id: string, v: string) {
    const next = { ...values, [id]: v };
    setValues(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }

  const filled = FIELDS.filter((f) => (values[f.id] ?? "").trim()).length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <p className="text-slate-700" aria-live="polite">
          Wypełniono {filled} z {FIELDS.length} pól{saved ? " · szkic zapisany w tej przeglądarce" : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => window.print()} className={btnSecondaryCls}>
            <Icon name="file" className="h-5 w-5" /> Drukuj / zapisz PDF
          </button>
          <Link href="/kreator#fiszka" className={`${btnCls} no-underline`}>
            Zamień w fiszkę <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-flow-dense gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FIELDS.map((f) => (
          <div key={f.id} className={`flex flex-col rounded-xl border border-slate-200 border-t-4 bg-white p-4 print:break-inside-avoid ${f.span} ${f.tint}`}>
            <label htmlFor={`canva-${f.id}`} className="font-black text-brand-900">
              {f.label}
            </label>
            <p id={`canva-${f.id}-hint`} className="mb-2 text-sm text-slate-600">
              {f.hint}
            </p>
            <textarea
              id={`canva-${f.id}`}
              aria-describedby={`canva-${f.id}-hint`}
              rows={5}
              value={values[f.id] ?? ""}
              onChange={(e) => update(f.id, e.target.value)}
              className="flex-1 resize-none rounded-lg bg-mist p-3 text-[0.95rem] focus:bg-brand-50"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
