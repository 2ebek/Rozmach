"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";

/** Menu jak w makiecie ROZMACH, uzupełnione o moduły prototypu (Kreator, Tester, Rozmowy). */
const NAV = [
  { href: "/#jak-dziala", label: "Jak to działa" },
  { href: "/zasobnik", label: "Rozwiązania" },
  { href: "/kreator", label: "Kreator pomysłów" },
  { href: "/tester", label: "Tester" },
  { href: "/komunikacja", label: "Rozmowy" },
  { href: "/admin", label: "Dla Hubu" },
];

const CTA = { href: "/dopasuj", label: "Zgłoś problem lub potrzebę" };

export function NavLinks() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const link = (n: { href: string; label: string }, mobile = false) => {
    const active = pathname === n.href || (n.href !== "/#jak-dziala" && pathname.startsWith(n.href + "/"));
    return (
      <li key={n.href}>
        <Link
          href={n.href}
          aria-current={active ? "page" : undefined}
          className={
            mobile
              ? `block rounded-lg px-3 py-3 font-semibold ${active ? "bg-brand-50 text-brand-900" : "text-brand-900 hover:bg-brand-50"}`
              : `block border-b-2 py-1 text-[0.95rem] ${active ? "border-accent text-brand-900" : "border-transparent text-brand-900 hover:border-brand-900"}`
          }
        >
          {n.label}
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label="Menu główne" className="flex flex-1 flex-wrap items-center justify-end">
      {/* Szerokie ekrany: menu w jednej linii */}
      <div className="hidden items-center gap-7 xl:flex">
        <ul className="flex items-center gap-5">{NAV.map((n) => link(n))}</ul>
        <Link href="/logowanie" className="hidden text-[0.95rem] text-muted hover:text-brand-900 2xl:inline">

          Zaloguj się
        </Link>
        <Link href={CTA.href} className="inline-flex items-center gap-3 rounded-full bg-brand-900 px-5 py-3 text-[0.95rem] font-semibold text-white hover:bg-brand-700">
          {CTA.label} <Icon name="external" className="h-4 w-4" />
        </Link>
      </div>

      {/* Telefony i tablety: przycisk Menu */}
      <div className="flex items-center gap-2 xl:hidden">
        <Link href={CTA.href} className="hidden items-center gap-2 rounded-full bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white sm:inline-flex">
          {CTA.label} <Icon name="external" className="h-4 w-4" />
        </Link>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="menu-mobile"
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-2 rounded-full border border-brand-900 px-4 py-2.5 text-sm font-semibold text-brand-900"
        >
          <Icon name={open ? "close" : "menu"} className="h-5 w-5" /> Menu
        </button>
      </div>
      {open && (
        <div id="menu-mobile" className="absolute inset-x-0 top-full z-40 border-y border-brand-100 bg-white px-4 pb-5 pt-3 shadow-[0_20px_40px_-20px_rgba(19,33,79,0.35)] sm:px-8 xl:hidden">
          <ul className="grid gap-1 sm:grid-cols-2">
            {NAV.map((n) => link(n, true))}
            {link({ href: "/middleman", label: "Middleman – dla instytucji" }, true)}
            {link({ href: "/logowanie", label: "Zaloguj się" }, true)}
          </ul>
          <Link href={CTA.href} className="mt-3 flex items-center justify-center gap-2 rounded-full bg-brand-900 px-5 py-3 font-semibold text-white sm:hidden">
            {CTA.label} <Icon name="external" className="h-4 w-4" />
          </Link>
        </div>
      )}
    </nav>
  );
}
