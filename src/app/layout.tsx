import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { AccessibilityBar } from "@/components/AccessibilityBar";
import { Icon } from "@/components/Icon";
import { NavLinks } from "@/components/NavLinks";
import "./globals.css";

const font = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rozmach – Małopolski Hub Innowacji Społecznych",
  description: "Zgłoś lokalną potrzebę – Rozmach szuka pomysłów z Hubu, a zespół Hubu pomaga z prototypem i finansowaniem.",
};

const FOOTER = [
  {
    title: "Odkrywaj",
    links: [
      { href: "/#jak-dziala", label: "Jak działa Rozmach" },
      { href: "/zasobnik", label: "Baza rozwiązań" },
      { href: "/dopasuj", label: "Zgłoś potrzebę" },
      { href: "/kreator", label: "Zgłoś pomysł" },
    ],
  },
  {
    title: "Współpracuj",
    links: [
      { href: "/komunikacja", label: "Dla mieszkańców" },
      { href: "/middleman", label: "Dla instytucji" },
      { href: "/tester", label: "Testowanie rozwiązań" },      { href: "/admin", label: "Dla zespołu Hubu" },
    ],
  },
  {
    title: "Dowiedz się",
    links: [
      { href: "/o-projekcie", label: "O platformie" },
      { href: "/#zasady-ai", label: "Zasady użycia AI" },
      { href: "/kreator/wniosek", label: "Generator wniosków" },
      { href: "/status", label: "Sprawdź status zgłoszenia" },
      { href: "/o-projekcie#api", label: "API dla integracji" },
    ],
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={font.variable}>
      <body className="min-h-screen overflow-x-hidden font-sans text-ink antialiased">
        {/* WCAG 2.4.1: pominięcie nawigacji */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:bg-white focus:p-3"
        >
          Przejdź do treści
        </a>

        <div className="site-chrome border-b border-brand-100 bg-white text-sm print:hidden">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-1.5 sm:px-8">
            <p className="flex flex-wrap items-center gap-x-4 text-muted">
              <span>Prototyp hackathonowy · dane przykładowe</span>
              <Link href="/status" className="font-semibold text-brand-700 underline-offset-2 hover:underline">
                Sprawdź status zgłoszenia
              </Link>
            </p>
            <AccessibilityBar />
          </div>
        </div>

        <header className="site-chrome relative border-b border-brand-100 bg-white print:hidden">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 sm:px-8 xl:py-6">
            <Link href="/" className="flex items-center gap-4 no-underline">
              <span className="font-display text-[2.1rem] leading-none text-brand-900 sm:text-[2.5rem]">Rozmach</span>
              <span aria-hidden className="hidden h-8 w-px bg-brand-100 sm:block xl:hidden min-[1720px]:block" />
              <span className="hidden max-w-[11rem] text-[0.8rem] leading-snug text-muted sm:block xl:hidden min-[1720px]:block min-[1720px]:max-w-none">Małopolski Hub Innowacji Społecznych</span>
              <span className="sr-only"> – Małopolski Hub Innowacji Społecznych, strona główna</span>
            </Link>
            <NavLinks />
          </div>
        </header>

        <main id="main" className="mx-auto max-w-7xl px-4 pb-24 sm:px-8">
          {children}
        </main>

        <footer className="site-chrome on-dark bg-brand-900 text-white print:hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <div className="grid items-center gap-10 border-b border-white/20 py-20 lg:grid-cols-[1.6fr_1fr]">
              <div>
                <p className="text-[0.8rem] font-bold uppercase tracking-wide text-[#ff7aa0]">Lokalne potrzeby. Wspólne możliwości.</p>
                <p className="mt-4 text-[2.4rem] font-semibold leading-[1.1] tracking-tight sm:text-[3.4rem]">
                  Szkoda życia na czekanie, aż „ktoś inny się tym zajmie”.
                </p>
                <p className="mt-5 max-w-xl text-lg text-slate-300">Zacznijmy od małego kroku. Opowiedz nam o swojej okolicy przy wirtualnej kawie.</p>
              </div>
              <div className="flex flex-col items-start gap-4 lg:items-end">
                <Link href="/dopasuj" className="inline-flex items-center gap-3 rounded-full bg-accent px-6 py-3.5 font-semibold text-white hover:bg-[#b8174a]">
                  Wchodzę w to — zgłaszam sprawę <Icon name="external" className="h-4 w-4" />
                </Link>
                <Link href="/zasobnik" className="inline-flex items-center gap-3 rounded-full bg-white px-6 py-3.5 font-semibold text-brand-900 hover:bg-brand-50">
                  Zobacz, co już wspólnie naprawiamy <Icon name="external" className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="grid gap-8 py-12 text-[0.95rem] sm:grid-cols-3 lg:max-w-3xl">
              {FOOTER.map((col) => (
                <div key={col.title}>
                  <h2 className="mb-4 text-[0.95rem] font-semibold text-[#ff7aa0]">{col.title}</h2>
                  <ul className="space-y-3 text-slate-200">
                    {col.links.map((l) => (
                      <li key={l.label}>
                        <Link href={l.href} className="hover:text-white hover:underline">
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 pb-10 text-sm text-slate-300">
              <p className="max-w-3xl">
                ROZMACH • Regionalny Ośrodek Zintegrowanych Metod, Aktywności i Cyfryzacji Hubu. Koncepcja platformy AI dla Małopolskiego Hubu Innowacji Społecznych.
                Prototyp hackathonowy dla ROPS w Krakowie – dane przykładowe.
              </p>
              <ul className="flex gap-6">
                <li>
                  <Link href="/o-projekcie#bezpieczenstwo" className="hover:text-white hover:underline">
                    Prywatność
                  </Link>
                </li>
                <li>
                  <Link href="/o-projekcie#bezpieczenstwo" className="hover:text-white hover:underline">
                    Dostępność (WCAG 2.1 AA)
                  </Link>
                </li>
                <li>
                  <Link href="/o-projekcie" className="hover:text-white hover:underline">
                    Regulamin
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
