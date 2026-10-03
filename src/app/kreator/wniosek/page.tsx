import Link from "next/link";
import { ApplicationForm } from "@/components/ApplicationForm";
import { Icon } from "@/components/Icon";
import { IwsApplicationForm } from "@/components/IwsApplicationForm";
import { PageHeader } from "@/components/PageHeader";
import { Dot, Panel } from "@/components/ui";
import { AREA_COLOR, AREA_LABEL } from "@/lib/labels";
import { getRepo } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Generator wniosków – Hub Innowacji" };

const fmtDate = (d: string) => new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });

export default async function Page({ searchParams }: { searchParams: { nabor?: string; fiszka?: string } }) {
  const nabory = await getRepo().listNabory();
  const open = nabory.filter((n) => n.open);
  const selected = open.find((n) => n.id === searchParams.nabor) ?? open[0];
  const fiszka = typeof searchParams.fiszka === "string" ? searchParams.fiszka : "";

  return (
    <>
      <PageHeader
        eyebrow="Generator wniosków"
        title={selected ? selected.title : "Brak otwartych naborów"}
        lead={
          selected
            ? `${selected.description} Nabór trwa do ${fmtDate(selected.deadline)}. Formularz zawiera tylko pytania tego naboru.`
            : "Generator wniosków działa w czasie naboru w konkursach grantowych. Sprawdź, kiedy rusza kolejny."
        }
      >
        {selected && (
          <p className="mt-4 flex flex-wrap gap-3 text-sm">
            {selected.areas.map((a) => (
              <span key={a} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-bold text-brand-900 shadow-sm">
                <Dot className={AREA_COLOR[a]} /> {AREA_LABEL[a]}
              </span>
            ))}
          </p>
        )}
      </PageHeader>

      {open.length > 1 && (
        <nav aria-label="Otwarte nabory" className="mb-8 flex flex-wrap gap-2">
          {open.map((n) => (
            <Link
              key={n.id}
              href={`/kreator/wniosek?nabor=${n.id}${fiszka ? `&fiszka=${fiszka}` : ""}`}
              aria-current={n.id === selected?.id ? "page" : undefined}
              className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold no-underline ${n.id === selected?.id ? "border-brand-900 bg-brand-900 text-white" : "border-slate-200 text-brand-900"}`}
            >
              {n.title}
            </Link>
          ))}
        </nav>
      )}

      {selected ? (
        selected.formType === "rops-iws" ? (
          <IwsApplicationForm key={selected.id} nabor={selected} initialIdeaCode={fiszka} />
        ) : (
          <ApplicationForm key={selected.id} nabor={selected} initialIdeaCode={fiszka} />
        )
      ) : (
        <Panel className="max-w-2xl">
          <ul className="space-y-4">
            {nabory.map((n) => (
              <li key={n.id}>
                <p className="font-black text-brand-900">{n.title}</p>
                <p className="text-slate-700">Nabór zamknięty · planowany termin: do {fmtDate(n.deadline)}</p>
              </li>
            ))}
          </ul>
          <Link href="/kreator" className="mt-6 inline-flex items-center gap-1.5 font-bold text-brand-700 hover:text-accent">
            Wróć do Kreatora i przygotuj fiszkę <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </Panel>
      )}
    </>
  );
}
