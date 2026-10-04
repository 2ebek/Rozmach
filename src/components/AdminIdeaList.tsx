"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "./Icon";
import { Badge, inputCls } from "./ui";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/labels";
import type { IdeaCard } from "@/lib/types";

export type IdeaSummary = Pick<IdeaCard, "id" | "title" | "audience" | "status" | "createdAt" | "code"> & { awaitsReply: boolean };

const TABS: { status: IdeaCard["status"] | "wszystkie"; label: string; empty: string }[] = [
  { status: "nowy", label: "Nowe", empty: "Brak nowych pomysłów. Dostaniesz powiadomienie, gdy pojawi się kolejny." },
  { status: "w-weryfikacji", label: "Do weryfikacji", empty: "Żaden pomysł nie czeka na weryfikację." },
  { status: "zaakceptowany", label: "Zaakceptowane", empty: "Nie ma jeszcze zaakceptowanych pomysłów." },
  { status: "odrzucony", label: "Odrzucone", empty: "Nie ma odrzuconych pomysłów." },
  { status: "wszystkie", label: "Wszystkie", empty: "Nie ma jeszcze żadnych pomysłów." },
];

const fmt = (iso: string) => new Date(iso).toLocaleString("pl-PL", { timeZone: "Europe/Warsaw", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Lista pomysłów w aplikacji administratora: zakładki statusów z licznikami i wyszukiwanie po tytule, odbiorcach i kodzie. */
export function AdminIdeaList({ ideas }: { ideas: IdeaSummary[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["status"]>(() => (ideas.some((i) => i.status === "nowy") ? "nowy" : "wszystkie"));
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("pl");
    return ideas.filter(
      (i) =>
        (tab === "wszystkie" || i.status === tab) &&
        (!q || `${i.title} ${i.audience} ${i.code}`.toLocaleLowerCase("pl").includes(q)),
    );
  }, [ideas, tab, query]);
  const current = TABS.find((t) => t.status === tab)!;

  return (
    <section aria-labelledby="h-lista" className="space-y-4">
      <h2 id="h-lista" className="sr-only">
        Pomysły
      </h2>
      <div className="relative">
        <label htmlFor="szukaj-pomyslu" className="sr-only">
          Szukaj pomysłu
        </label>
        <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
        <input
          id="szukaj-pomyslu"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Szukaj po tytule, odbiorcach lub kodzie"
          className={`${inputCls} rounded-full pl-12`}
        />
      </div>

      <div role="tablist" aria-label="Status pomysłu" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {TABS.map((t) => {
          const n = t.status === "wszystkie" ? ideas.length : ideas.filter((i) => i.status === t.status).length;
          const active = t.status === tab;
          return (
            <button
              key={t.status}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.status)}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border-2 px-4 text-sm font-bold ${
                active ? "border-brand-900 bg-brand-900 text-white" : "border-slate-300 bg-white text-brand-900 hover:border-brand-900"
              }`}
            >
              {t.label}
              <span className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-white text-brand-900" : t.status === "nowy" && n ? "bg-accent text-white" : "bg-mist text-slate-700"}`}>
                {n}
              </span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel" aria-label={current.label} aria-live="polite">
        {shown.length === 0 ? (
          <p className="rounded-2xl bg-mist p-5 text-slate-700">{query.trim() ? "Nic nie pasuje do wyszukiwania." : current.empty}</p>
        ) : (
          <ul className="space-y-3">
            {shown.map((idea) => (
              <li key={idea.id}>
                <Link
                  href={`/admin/app/${idea.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 no-underline transition hover:border-brand-700 hover:shadow-md active:scale-[0.99]"
                >
                  <span
                    aria-hidden
                    className={`h-12 w-1.5 shrink-0 rounded-full ${idea.status === "nowy" ? "bg-accent" : idea.status === "odrzucony" ? "bg-red-300" : idea.status === "zaakceptowany" ? "bg-emerald-500" : "bg-amber-400"}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-lg font-black leading-snug text-brand-900">{idea.title}</span>
                    <span className="block truncate text-sm text-slate-600">Dla: {idea.audience}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                      <span>{fmt(idea.createdAt)}</span>
                      <span className="font-bold tracking-wider">{idea.code}</span>
                      {idea.awaitsReply && (
                        <span className="inline-flex items-center gap-1 font-bold text-accent-ink">
                          <Icon name="chat" className="h-3.5 w-3.5" /> czeka na odpowiedź
                        </span>
                      )}
                    </span>
                  </span>
                  {tab === "wszystkie" && <Badge className={`hidden sm:inline-flex ${STATUS_STYLE[idea.status]}`}>{STATUS_LABEL[idea.status]}</Badge>}
                  <Icon name="arrow" className="h-5 w-5 shrink-0 text-brand-700" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
