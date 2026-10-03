import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon, type IconName } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { Dot, Panel } from "@/components/ui";
import { AREA_COLOR, AREA_LABEL_ROPS, ropsCategoryUrl } from "@/lib/labels";
import { getRepo } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Karta innowacji w układzie Biblioteki ROPS: 6 pytań + materiały, z linkiem do oryginału na stronie ROPS. */
export default async function Page({ params }: { params: { id: string } }) {
  const inn = (await getRepo().listInnovations()).find((i) => i.id === params.id);
  if (!inn) notFound();

  // Pytania karty ROPS; niektóre karty nie mają wszystkich (np. „Czy to działa?”) – numerujemy tylko pokazane, jak na stronie ROPS.
  const SECTIONS = (
    [
      ["Na czym polega rozwiązanie?", inn.summary],
      ["Jakich problemów dotyczy innowacja?", inn.problem],
      ["Grupa docelowa", inn.targetGroup],
      ["Kto może skorzystać z innowacji?", inn.beneficiaries],
      ["Czy to działa?", inn.evidence],
    ] as [string, string | undefined][]
  ).filter((s): s is [string, string] => !!s[1]);

  const LINKS: { href?: string; icon: IconName; label: string }[] = [
    { href: inn.folderUrl, icon: "search", label: "Dowiedz się więcej (folder PDF)" },
    { href: inn.videoUrl, icon: "play", label: "Zobacz film" },
    { href: inn.materialsUrl, icon: "file", label: "Pobierz materiały" },
    { href: inn.ropsUrl, icon: "book", label: "Karta w Bibliotece ROPS" },
  ];

  return (
    <>
      <PageHeader eyebrow="Biblioteka Innowacji Społecznych" title={inn.title} lead={inn.subtitle || ""}>
        <p className="mt-4 flex flex-wrap gap-2 text-sm">
          {inn.areas.map((a) => (
            <a
              key={a}
              href={ropsCategoryUrl(a)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-bold text-brand-900 no-underline shadow-sm hover:text-accent"
            >
              <Dot className={AREA_COLOR[a]} /> {AREA_LABEL_ROPS[a]}
              <span className="sr-only"> (strona ROPS, otwiera się w nowej karcie)</span>
            </a>
          ))}
        </p>
        {inn.project && (
          <p className="mt-4 text-sm font-bold uppercase tracking-wide text-brand-700">
            Innowacja wybrana do upowszechniania w ramach projektu „{inn.project}”
          </p>
        )}
      </PageHeader>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <Panel>
          <dl className="space-y-7">
            {SECTIONS.map(([q, v], i) => (
              <div key={q}>
                <dt className="text-lg font-black text-brand-900">
                  {i + 1}. {q}
                </dt>
                <dd className="mt-1 whitespace-pre-line text-slate-800">{v}</dd>
              </div>
            ))}
            <div>
              <dt className="text-lg font-black text-brand-900">{SECTIONS.length + 1}. Autorzy</dt>
              <dd className="mt-1 text-slate-800">
                {inn.ropsUrl ? (
                  <>
                    Informacje o autorach znajdziesz na{" "}
                    <a href={inn.ropsUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-brand-700 underline">
                      karcie innowacji w Bibliotece ROPS
                    </a>
                    .
                  </>
                ) : (
                  "Brak informacji."
                )}
              </dd>
            </div>
          </dl>
        </Panel>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-black">Materiały</h2>
            <ul className="mt-3 space-y-2">
              {LINKS.filter((l) => l.href).map((l) => (
                <li key={l.label}>
                  <a href={l.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg p-2 font-bold text-brand-700 no-underline hover:bg-brand-50 hover:text-accent">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50">
                      <Icon name={l.icon} className="h-4 w-4" />
                    </span>
                    {l.label}
                    <span className="sr-only"> (otwiera się w nowej karcie)</span>
                  </a>
                </li>
              ))}
            </ul>
            {inn.license && (
              <p className="mt-4 text-sm text-slate-700">
                <span className="font-bold">Zasady wykorzystania: </span>
                {inn.license === "CC BY 4.0" ? (
                  <a href="https://creativecommons.org/licenses/by/4.0/deed.pl" target="_blank" rel="noopener noreferrer" className="underline">
                    licencja CC BY 4.0
                  </a>
                ) : (
                  "prawa zastrzeżone – zapytaj ROPS o zgodę na wykorzystanie"
                )}
              </p>
            )}
          </div>
          <div className="rounded-2xl bg-brand-900 p-6 text-white">
            <h2 className="text-lg font-black !text-white">Chcesz ją wdrożyć?</h2>
            <p className="mt-2 text-[0.95rem] text-slate-200">Asystent podpowie, jak zamienić tę innowację w usługę w Twojej instytucji.</p>
            <Link href={`/middleman?innowacja=${encodeURIComponent(inn.title)}`} className="mt-4 inline-flex items-center gap-2 font-bold text-white underline-offset-4 hover:underline">
              Middleman Innowacji <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </div>
          <Link href="/tester" className="block rounded-2xl border border-slate-200 p-6 font-bold text-brand-700 no-underline hover:border-brand-700">
            Znasz tę innowację? Oceń ją w Testerze →
          </Link>
        </aside>
      </div>
    </>
  );
}
