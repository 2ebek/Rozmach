"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAMES: Record<string, string> = {
  dopasuj: "Znajdź rozwiązanie",
  zasobnik: "Zasobnik wiedzy",
  kreator: "Kreator pomysłów",
  wniosek: "Generator wniosków",
  canva: "Canva innowacji",
  tester: "Tester innowacji",
  komunikacja: "Rozmowy",
  middleman: "Middleman Innowacji",
  admin: "Panel administratora",
  wiedza: "Zarządzanie wiedzą",
  nabory: "Nabory i wnioski",
  pomysly: "Pomysły",
  status: "Status zgłoszenia",
  logowanie: "Logowanie",
  "o-projekcie": "O projekcie",
  app: "Aplikacja administratora",
  pobierz: "Pobierz aplikację",
};

/** Segment bez nazwy (np. identyfikator) – opis zależny od sekcji, nigdy surowe id. */
function label(seg: string, parent?: string): string {
  if (NAMES[seg]) return NAMES[seg];
  if (parent === "zasobnik") return "Karta innowacji";
  if (parent === "app") return "Szczegóły pomysłu";
  return "Szczegóły";
}

export function Breadcrumbs() {
  const segs = usePathname().split("/").filter(Boolean);
  if (segs.length === 0) return null;
  return (
    <nav aria-label="Jesteś tutaj" className="mb-6 text-sm text-slate-700 print:hidden">
      <ol className="flex flex-wrap items-center">
        <li>
          <Link href="/" className="underline">
            Strona główna
          </Link>
        </li>
        {segs.map((s, i) => {
          const href = "/" + segs.slice(0, i + 1).join("/");
          const last = i === segs.length - 1;
          return (
            <li key={href} className="flex items-center">
              <span aria-hidden className="mx-2">
                ›
              </span>
              {last ? (
                <span aria-current="page">{label(s, segs[i - 1])}</span>
              ) : (
                <Link href={href} className="underline">
                  {label(s, segs[i - 1])}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
