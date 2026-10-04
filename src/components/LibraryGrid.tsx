"use client";

import Link from "next/link";
import { useState } from "react";
import { AREAS, AREA_COLOR, AREA_LABEL, AREA_LABEL_ROPS } from "@/lib/labels";
import type { ChallengeArea, Innovation } from "@/lib/types";
import { Icon } from "./Icon";
import { Dot } from "./ui";

/** Biblioteka Innowacji w kategoriach ROPS. Filtr to zwykłe przyciski z aria-pressed. */
export function LibraryGrid({ innovations, initialFilter = null }: { innovations: Innovation[]; initialFilter?: ChallengeArea | null }) {
  const [filter, setFilter] = useState<ChallengeArea | null>(initialFilter);
  const [onlyVideo, setOnlyVideo] = useState(false);
  const pool = onlyVideo ? innovations.filter((i) => i.videoUrl) : innovations;
  const count = (a: ChallengeArea) => pool.filter((i) => i.areas.includes(a)).length;
  const areas = AREAS.filter((a) => count(a) > 0 || a === filter);
  const shown = filter ? pool.filter((i) => i.areas.includes(filter)) : pool;
  const withVideo = innovations.filter((i) => i.videoUrl).length;

  const chip = (active: boolean) =>
    `inline-flex items-center gap-2 rounded-full border-2 px-4 py-1.5 text-sm font-bold transition ${
      active ? "border-brand-900 bg-brand-900 text-white" : "border-slate-200 bg-white text-brand-900 hover:border-brand-700"
    }`;

  return (
    <div>
      <div role="group" aria-label="Filtruj według kategorii Biblioteki ROPS" className="mb-6 flex flex-wrap gap-2">
        <button type="button" aria-pressed={filter === null} onClick={() => setFilter(null)} className={chip(filter === null)}>
          Wszystkie <span className="opacity-70">{pool.length}</span>
        </button>
        {areas.map((a) => (
          <button key={a} type="button" aria-pressed={filter === a} onClick={() => setFilter(a)} className={chip(filter === a)}>
            <Dot className={AREA_COLOR[a]} /> {AREA_LABEL[a]} <span className="opacity-70">{count(a)}</span>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm text-slate-600">
          {filter ? `${AREA_LABEL_ROPS[filter].replace(/^./, (c) => c.toUpperCase())}: ` : "Wszystkie innowacje: "}
          {shown.length}
          {onlyVideo && " (z filmem)"}
        </p>
        <button type="button" aria-pressed={onlyVideo} onClick={() => setOnlyVideo(!onlyVideo)} className={chip(onlyVideo)}>
          <Icon name="play" className="h-4 w-4" /> Tylko z filmem <span className="opacity-70">{withVideo}</span>
        </button>
      </div>

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((i) => (
          <li key={i.id}>
            <Link
              href={`/zasobnik/${i.id}`}
              className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 no-underline transition hover:-translate-y-1 hover:border-brand-100 hover:shadow-[0_16px_40px_-16px_rgba(0,15,55,0.3)]"
            >
              <span className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                {i.areas.map((a) => (
                  <span key={a} className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                    <Dot className={AREA_COLOR[a]} /> {AREA_LABEL[a]}
                  </span>
                ))}
              </span>
              <h3 className="text-xl font-black text-brand-900 group-hover:text-brand-700">{i.title}</h3>
              <span className="mt-2 line-clamp-3 flex-1 text-slate-700">{i.subtitle || i.summary}</span>
              <span className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                {i.videoUrl && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 font-bold text-brand-700">
                    <Icon name="play" className="h-3.5 w-3.5" /> film
                  </span>
                )}
                {i.materialsUrl && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 font-bold text-brand-700">
                    <Icon name="file" className="h-3.5 w-3.5" /> materiały
                  </span>
                )}
                <span className="ml-auto inline-flex items-center gap-1 font-bold text-brand-700 group-hover:text-accent">
                  Szczegóły <Icon name="arrow" className="h-4 w-4" />
                </span>
              </span>
            </Link>
          </li>
        ))}
        <li className="relative flex flex-col justify-center overflow-hidden rounded-2xl bg-accent p-8 text-white">
          <div aria-hidden className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
          <div aria-hidden className="absolute -bottom-8 left-8 h-20 w-20 rounded-full bg-sun/50" />
          <p className="relative text-2xl font-black">Twojej innowacji tu brakuje?</p>
          <p className="relative mt-2 text-white">Zgłoś ją w Kreatorze – według tych samych pytań co karta w Bibliotece ROPS.</p>
          <Link href="/kreator" className="relative mt-5 inline-flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-accent no-underline hover:bg-brand-50">
            Zgłoś innowację <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </li>
      </ul>
    </div>
  );
}
