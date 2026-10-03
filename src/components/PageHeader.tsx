import type { ReactNode } from "react";
import { Breadcrumbs } from "./Breadcrumbs";

/** Wspólny nagłówek podstron (styl makiety ROZMACH): jasny pas na pełną szerokość z okruszkami, nadtytułem, tytułem i leadem. */
export function PageHeader({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  children?: ReactNode;
}) {
  return (
    <div className="full-bleed mb-12 bg-brand-50">
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-8">
        <Breadcrumbs />
        <p className="mb-3 text-[0.8rem] font-bold uppercase tracking-wide text-brand-900">{eyebrow}</p>
        <h1 className="max-w-4xl font-display text-[2.5rem] leading-[1.05] sm:text-[3.25rem]">{title}</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">{lead}</p>
        {children}
      </div>
    </div>
  );
}
