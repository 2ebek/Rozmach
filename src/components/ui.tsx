import type { ReactNode } from "react";

export const inputCls =
  "w-full rounded-lg border border-line bg-white px-4 py-3 transition placeholder:text-slate-500 hover:border-brand-700 focus:border-brand-700";
export const btnCls =
  "inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-bold text-white transition hover:bg-[#b8174a] disabled:cursor-wait disabled:opacity-60";
export const btnSecondaryCls =
  "inline-flex items-center justify-center gap-2 rounded-full border border-brand-900 bg-white px-5 py-2.5 font-bold text-brand-900 transition hover:bg-brand-50 disabled:opacity-60";
/** Granatowy przycisk z makiety (np. „Zgłoś problem lub potrzebę”). */
export const btnDarkCls =
  "inline-flex items-center justify-center gap-2 rounded-full bg-brand-900 px-6 py-3 font-bold text-white no-underline transition hover:bg-brand-700";

/** Style przycisków akcji w panelu administratora (stałe – można importować w komponentach serwerowych). */
export const actionCls = {
  primary: "bg-emerald-700 text-white hover:bg-emerald-800",
  secondary: "border-2 border-slate-300 text-brand-900 hover:border-brand-700",
  ghost: "text-slate-700 underline hover:text-accent",
  dark: "bg-brand-900 text-white hover:bg-brand-700",
};

export function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block font-bold text-brand-900">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {children}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`h-full rounded-xl border border-slate-200 bg-white p-6 ${className}`}>{children}</div>;
}

/** Biała karta z cieniem – dla formularzy i głównych paneli. */
export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-brand-100 bg-white p-6 shadow-[0_16px_40px_-20px_rgba(19,33,79,0.25)] sm:p-8 ${className}`}>
      {children}
    </div>
  );
}

export function Badge({ children, className = "bg-brand-50 text-brand-700" }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-sm font-bold ${className}`}>{children}</span>;
}

export function Dot({ className }: { className: string }) {
  return <span aria-hidden className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${className}`} />;
}

export function SectionTitle({ id, children, kicker }: { id?: string; children: ReactNode; kicker?: string }) {
  return (
    <div className="mb-6">
      {kicker && <p className="mb-2 text-[0.8rem] font-bold uppercase tracking-wide text-brand-900">{kicker}</p>}
      <h2 id={id} className="font-display text-[2rem] leading-tight sm:text-[2.4rem]">
        {children}
      </h2>
    </div>
  );
}

/** Komunikat statusu ogłaszany czytnikom ekranu. */
export function Status({ error, ok }: { error?: string | null; ok?: string | null }) {
  return (
    <div aria-live="polite">
      {error && (
        <p role="alert" className="rounded-lg border-l-4 border-red-700 bg-red-50 px-4 py-3 font-semibold text-red-900">
          {error}
        </p>
      )}
      {ok && <p className="rounded-lg border-l-4 border-emerald-700 bg-emerald-50 px-4 py-3 font-semibold text-emerald-900">{ok}</p>}
    </div>
  );
}
