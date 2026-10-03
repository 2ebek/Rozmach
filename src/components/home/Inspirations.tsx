"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "../Icon";

type Tag = "Relacje i dobrostan" | "Dostępność" | "Wspólne zasoby";

/** Przykładowe modele z makiety – TREŚCI DEMONSTRACYJNE. „Poznaj model” szuka podobnych, prawdziwych innowacji w Bibliotece ROPS. */
const MODELS: { tag: Tag; title: string; text: string; who: string; img: string; query: string }[] = [
  {
    tag: "Relacje i dobrostan",
    title: "Sąsiedzki krąg spotkań",
    text: "Regularne, kameralne spotkania osób starszych — bliżej domu i codziennych potrzeb.",
    who: "Mieszkańcy i domy kultury",
    img: "/img/model-krag.jpg",
    query: "regularne spotkania osób starszych blisko domu, samotność seniorów",
  },
  {
    tag: "Wspólne zasoby",
    title: "Osiedlowa naprawialnia",
    text: "Miejsce, w którym wiedza i narzędzia krążą między sąsiadami, a rzeczy zyskują drugie życie.",
    who: "Społeczności i organizacje",
    img: "/img/model-naprawialnia.jpg",
    query: "sąsiedzka naprawa rzeczy, dzielenie się narzędziami i wiedzą",
  },
  {
    tag: "Dostępność",
    title: "Mapa dostępnej okolicy",
    text: "Wspólny spacer badawczy, który pomaga rozpoznać bariery i zaplanować konkretne zmiany.",
    who: "Mieszkańcy i samorządy",
    img: "/img/model-mapa.jpg",
    query: "bariery architektoniczne, dostępność przestrzeni dla osób z niepełnosprawnościami",
  },
];
const TAGS: (Tag | "Wszystkie")[] = ["Wszystkie", "Relacje i dobrostan", "Dostępność", "Wspólne zasoby"];

export function Inspirations({ libraryCount }: { libraryCount: number }) {
  const [tag, setTag] = useState<Tag | "Wszystkie">("Wszystkie");
  const shown = MODELS.filter((m) => tag === "Wszystkie" || m.tag === tag);

  return (
    <>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <div role="group" aria-label="Filtruj inspiracje" className="flex flex-wrap gap-2">
          {TAGS.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tag === t}
              onClick={() => setTag(t)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold ${tag === t ? "border-brand-900 bg-brand-900 text-white" : "border-line bg-white text-brand-900 hover:border-brand-900"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted">
          Treści demonstracyjne, nie katalog wdrożeń ·{" "}
          <Link href="/zasobnik#biblioteka" className="font-semibold text-brand-700 hover:underline">
            {libraryCount} prawdziwych innowacji w Bibliotece ROPS
          </Link>
        </p>
      </div>
      <ul aria-live="polite" className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {shown.map((m) => (
          <li key={m.title} className="flex flex-col overflow-hidden rounded-3xl bg-brand-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.img} alt="" loading="lazy" className="h-60 w-full object-cover" />
            <div className="flex flex-1 flex-col p-6">
              <p>
                <span className="rounded-full bg-accent px-3 py-1 text-[0.8rem] font-semibold text-white">{m.tag}</span>
              </p>
              <h3 className="mt-4 text-[1.6rem] font-semibold leading-tight text-brand-900">{m.title}</h3>
              <p className="mt-3 text-muted">{m.text}</p>
              <p className="mt-3 flex-1 text-sm text-muted">Dla kogo: {m.who}</p>
              <Link
                href={`/dopasuj?q=${encodeURIComponent(m.query)}`}
                className="mt-5 flex items-center justify-between border-t border-brand-100 pt-4 font-semibold text-brand-900 no-underline hover:text-accent"
              >
                Poznaj model <span className="sr-only">„{m.title}” – podobne innowacje</span>
                <Icon name="external" className="h-4 w-4" />
              </Link>
              <p className="mt-3 text-xs text-muted">Przykładowy model • do weryfikacji Hubu</p>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
