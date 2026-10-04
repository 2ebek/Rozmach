"use client";

import { useEffect, useState } from "react";
import { AREA_LABEL, STAGE_LABEL, STATUS_LABEL, STATUS_STYLE } from "@/lib/labels";
import type { IdeaCard } from "@/lib/types";
import { ThreadView } from "./ThreadView";
import { Badge, Field, inputCls } from "./ui";

const NAME_KEY = "hub-expert-name";

/**
 * Panel eksperta: podpis (specjalizacja, nie dane osobowe) zapamiętany w przeglądarce + fiszki z rozmową,
 * w której ekspert daje autorowi feedback. Ekspert nie zmienia statusów – decyzje podejmuje zespół Hubu.
 */
export function ExpertBoard({ ideas }: { ideas: IdeaCard[] }) {
  const [name, setName] = useState("");
  const [filter, setFilter] = useState<"bez" | "wszystkie">("bez");
  // Rozwinięte rozmowy: na start te bez komentarza eksperta; potem decyduje ekspert (nie zwijamy po wysłaniu komentarza).
  const [open, setOpen] = useState<Set<string>>(() => new Set(ideas.filter((i) => !i.thread.some((m) => m.from === "expert")).map((i) => i.id)));

  useEffect(() => {
    try {
      // nie nadpisuj podpisu wpisanego zanim strona się w pełni załadowała
      const saved = localStorage.getItem(NAME_KEY);
      if (saved) setName((current) => current || saved);
    } catch {
      /* bez pamięci przeglądarki – podpis trzeba wpisać ponownie */
    }
  }, []);

  function updateName(v: string) {
    setName(v);
    try {
      localStorage.setItem(NAME_KEY, v);
    } catch {
      /* ignoruj */
    }
  }

  const withoutExpert = ideas.filter((i) => !i.thread.some((m) => m.from === "expert"));
  const shown = filter === "bez" ? withoutExpert : ideas;

  return (
    <div className="space-y-8">
      <div className="max-w-xl">
        <Field id="expert-name" label="Twój podpis pod komentarzami" hint="Np. „Ekspertka ds. ekonomii społecznej” albo „Mentor – usługi dla seniorów”. Wystarczy specjalizacja – nie podawaj nazwiska ani kontaktu.">
          <input id="expert-name" aria-describedby="expert-name-hint" maxLength={80} value={name} onChange={(e) => updateName(e.target.value)} className={inputCls} />
        </Field>
      </div>

      <div role="group" aria-label="Które fiszki pokazać" className="flex flex-wrap gap-2">
        {(
          [
            ["bez", `Czekają na eksperta (${withoutExpert.length})`],
            ["wszystkie", `Wszystkie (${ideas.length})`],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            aria-pressed={filter === k}
            onClick={() => setFilter(k)}
            className={`rounded-full border-2 px-4 py-2 text-sm font-bold ${filter === k ? "border-brand-900 bg-brand-900 text-white" : "border-slate-300 text-brand-900 hover:border-brand-900"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-xl bg-mist p-5 text-slate-700">Wszystkie fiszki mają już komentarz eksperta.</p>
      ) : (
        <ul className="space-y-5">
          {shown.map((i) => (
            <li key={i.id} className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-lg font-black text-brand-900">{i.title}</h3>
                <Badge className={STATUS_STYLE[i.status]}>{STATUS_LABEL[i.status]}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {i.category ? `${AREA_LABEL[i.category]} · ` : ""}Etap: {STAGE_LABEL[i.stage]} · kod {i.code}
              </p>
              <p className="mt-3 text-slate-800">{i.essence}</p>
              {i.problem && (
                <p className="mt-2 text-sm text-slate-700">
                  <span className="font-bold">Problem: </span>
                  {i.problem}
                </p>
              )}
              <p className="mt-2 text-sm text-slate-700">
                <span className="font-bold">Odbiorcy: </span>
                {i.audience}
              </p>
              <details
                className="mt-4 rounded-lg bg-mist p-4"
                open={open.has(i.id)}
                onToggle={(e) => {
                  const isOpen = e.currentTarget.open;
                  setOpen((prev) => {
                    if (prev.has(i.id) === isOpen) return prev;
                    const next = new Set(prev);
                    if (isOpen) next.add(i.id);
                    else next.delete(i.id);
                    return next;
                  });
                }}
              >
                <summary className="cursor-pointer font-bold text-brand-700">Rozmowa z autorem ({i.thread.length})</summary>
                <div className="mt-4">
                  <ThreadView code={i.code} thread={i.thread} as="expert" expertName={name} />
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
