"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

/** Potwierdzenie zgłoszenia z kodem – jedyny "klucz" autora do statusu i rozmowy z zespołem Hubu. */
export function CodeCard({ code, kind = "fiszki" }: { code: string; kind?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // fokus na potwierdzenie, żeby czytnik ekranu od razu je odczytał
  useEffect(() => ref.current?.focus(), [code]);

  return (
    <div ref={ref} tabIndex={-1} role="status" className="rounded-2xl border-2 border-emerald-700 bg-emerald-50 p-6 outline-none">
      <p className="flex items-center gap-2 font-black text-emerald-900">
        <Icon name="check" className="h-5 w-5" /> Dziękujemy! Zgłoszenie {kind} trafiło do zespołu Hubu.
      </p>
      <p className="mt-3 text-slate-800">Twój kod zgłoszenia – zapisz go, aby sprawdzić status i odpowiedź:</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <code className="rounded-lg bg-white px-4 py-2 text-2xl font-black tracking-widest text-brand-900 ring-1 ring-emerald-200">{code}</code>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(code).then(() => setCopied(true));
          }}
          className="rounded-lg border-2 border-emerald-700 px-4 py-2 font-bold text-emerald-900 hover:bg-white"
        >
          {copied ? "Skopiowano" : "Kopiuj kod"}
        </button>
      </div>
      <Link href={`/status?kod=${code}`} className="mt-4 inline-flex items-center gap-1.5 font-bold text-brand-700 hover:text-accent">
        Sprawdź status zgłoszenia <Icon name="arrow" className="h-4 w-4" />
      </Link>
    </div>
  );
}
