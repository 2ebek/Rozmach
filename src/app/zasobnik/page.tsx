import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { LibraryGrid } from "@/components/LibraryGrid";
import { PageHeader } from "@/components/PageHeader";
import { Dot, SectionTitle } from "@/components/ui";
import { AREAS, AREA_COLOR, AREA_LABEL, RESOURCE_LABEL } from "@/lib/labels";
import { getRepo } from "@/lib/store";
import type { Resource } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Zasobnik wiedzy – Hub Innowacji" };

const RESOURCE_ICON: Record<Resource["kind"], IconName> = {
  raport: "chart",
  film: "play",
  poradnik: "book",
  canva: "grid",
};

const JUMP = [
  { href: "#wyzwania", label: "Wyzwania regionu" },
  { href: "#biblioteka", label: "Biblioteka Innowacji" },
  { href: "#materialy", label: "Materiały" },
];

export default async function Page({ searchParams }: { searchParams: { kategoria?: string } }) {
  const initialFilter = AREAS.find((a) => a === searchParams.kategoria) ?? null;
  const repo = getRepo();
  const [challenges, innovations, resources] = await Promise.all([
    repo.listChallenges(),
    repo.listInnovations(),
    repo.listResources(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Zasobnik wiedzy"
        title="Wiedza o wyzwaniach i innowacjach Małopolski"
        lead="Kondycja regionu w liczbach, sprawdzone innowacje społeczne i materiały, które pomogą Ci działać."
      >
        <nav aria-label="Sekcje strony" className="mt-6">
          <ul className="flex flex-wrap gap-2">
            {JUMP.map((j) => (
              <li key={j.href}>
                <a href={j.href} className="inline-block rounded-full bg-white px-4 py-2 text-sm font-bold text-brand-900 no-underline shadow-sm hover:text-accent">
                  {j.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PageHeader>

      <div className="space-y-20">
        <section id="wyzwania" aria-labelledby="h-wyzwania" className="scroll-mt-6">
          <SectionTitle id="h-wyzwania" kicker="Mapa Wyzwań Społecznych">
            Najważniejsze wyzwania regionu
          </SectionTitle>
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {challenges.map((c) => (
              <li key={c.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6">
                <p className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Dot className={AREA_COLOR[c.area]} /> {AREA_LABEL[c.area]}
                </p>
                {c.indicator && (
                  <div className="mt-4">
                    <p className="text-5xl font-black tracking-tight text-brand-900">
                      {c.indicator.value}
                      <span className="text-3xl">{c.indicator.unit}</span>
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{c.indicator.label}</p>
                    <div
                      role="meter"
                      aria-valuenow={c.indicator.value}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={c.indicator.label}
                      className="mt-3 h-2 overflow-hidden rounded-full bg-mist"
                    >
                      <div className={`h-full rounded-full ${AREA_COLOR[c.area]}`} style={{ width: `${c.indicator.value}%` }} />
                    </div>
                  </div>
                )}
                <h3 className="mt-5 text-xl font-black text-brand-900">{c.title}</h3>
                <p className="mt-1 flex-1 text-slate-700">{c.description}</p>
                <Link
                  href={`/dopasuj?q=${encodeURIComponent(c.title)}&area=${c.area}`}
                  className="mt-5 inline-flex items-center gap-1.5 font-bold text-brand-700 hover:text-accent"
                >
                  Zobacz rozwiązania <Icon name="arrow" className="h-4 w-4" />
                </Link>
              </li>
            ))}
            <li className="flex flex-col justify-center rounded-2xl bg-brand-50 p-6">
              <p className="font-black text-brand-900">Wartości są przykładowe.</p>
              <p className="mt-1 text-slate-700">
                W wersji docelowej dane pochodzą z raportów ROPS i Mapy Wyzwań Społecznych, a redakcja aktualizuje je w panelu administratora.
              </p>
            </li>
          </ul>
        </section>

        <section id="biblioteka" aria-labelledby="h-biblioteka" className="scroll-mt-6">
          <SectionTitle id="h-biblioteka" kicker="Biblioteka Innowacji Społecznych ROPS">
            Sprawdzone rozwiązania
          </SectionTitle>
          <p className="-mt-3 mb-6 max-w-3xl text-slate-700">
            Innowacje i kategorie pochodzą z{" "}
            <a href="https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/kategorie" target="_blank" rel="noopener noreferrer" className="font-bold text-brand-700 underline">
              Biblioteki Innowacji Społecznych ROPS Kraków
              <span className="sr-only"> (otwiera się w nowej karcie)</span>
            </a>
            . Każda karta prowadzi do materiałów ROPS.
          </p>
          <LibraryGrid innovations={innovations} initialFilter={initialFilter} />
        </section>

        <section id="materialy" aria-labelledby="h-materialy" className="scroll-mt-6">
          <SectionTitle id="h-materialy" kicker="Do pobrania">
            Materiały edukacyjne
          </SectionTitle>
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200">
            {resources.map((r) => {
              const ready = r.url !== "#";
              const external = r.url.startsWith("http");
              return (
                <li key={r.id} className="flex items-center gap-4 bg-white p-5 transition hover:bg-brand-50">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                    <Icon name={RESOURCE_ICON[r.kind]} />
                  </span>
                  <div className="min-w-0 flex-1">
                    {ready ? (
                      <a href={r.url} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="font-bold text-brand-900 hover:text-brand-700 hover:underline">
                        {r.title}
                        {external && <span className="sr-only"> (otwiera się w nowej karcie)</span>}
                      </a>
                    ) : (
                      <p className="font-bold text-brand-900">{r.title}</p>
                    )}
                    <p className="text-sm text-slate-600">
                      {RESOURCE_LABEL[r.kind]}
                      {r.areas.length > 0 && ` · ${r.areas.map((a) => AREA_LABEL[a]).join(", ")}`}
                    </p>
                  </div>
                  {!ready && <span className="hidden text-sm font-bold text-slate-500 sm:block">wkrótce</span>}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </>
  );
}
