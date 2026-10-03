import Link from "next/link";
import { AssistantPanel } from "@/components/AssistantPanel";
import { Icon } from "@/components/Icon";
import { IdeaForm } from "@/components/IdeaForm";
import { IdeaVisualization } from "@/components/IdeaVisualization";
import { PageHeader } from "@/components/PageHeader";
import { Dot, Panel, SectionTitle } from "@/components/ui";
import { AREA_COLOR, AREA_LABEL } from "@/lib/labels";
import { getRepo } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kreator pomysłów – Hub Innowacji" };

const fmtDate = (d: string) => new Date(d).toLocaleDateString("pl-PL", { timeZone: "Europe/Warsaw", day: "numeric", month: "long" });

export default async function Page() {
  const nabory = await getRepo().listNabory();

  return (
    <>
      <PageHeader
        eyebrow="Kreator pomysłów"
        title="Masz pomysł na zmianę w swojej okolicy?"
        lead="Opisz go na krótkiej fiszce. Dostaniesz kod zgłoszenia – nim sprawdzisz status i odpowiedź zespołu Hubu."
      >
        <nav aria-label="Narzędzia kreatora" className="mt-6 flex flex-wrap gap-2">
          {[
            { href: "#fiszka", label: "Fiszka pomysłu" },
            { href: "/kreator/canva", label: "Canva innowacji" },
            { href: "#asystent", label: "Asystent" },
            { href: "#nabory", label: "Nabory i wnioski" },
          ].map((j) => (
            <Link key={j.href} href={j.href} className="inline-block rounded-full bg-white px-4 py-2 text-sm font-bold text-brand-900 no-underline shadow-sm hover:text-accent">
              {j.label}
            </Link>
          ))}
        </nav>
      </PageHeader>

      <div className="space-y-20">
        <section id="fiszka" aria-labelledby="h-fiszka" className="scroll-mt-6">
          <SectionTitle id="h-fiszka" kicker="Dostępna zawsze">
            Fiszka pomysłu
          </SectionTitle>
          <IdeaForm />
        </section>

        <section aria-labelledby="h-canva" className="grid items-center gap-8 rounded-3xl border border-slate-200 p-8 md:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-accent">Materiały do prototypowania</p>
            <h2 id="h-canva" className="mt-1 text-2xl font-black">
              Canva innowacji społecznej
            </h2>
            <p className="mt-2 max-w-2xl text-slate-700">
              Rozpisz pomysł na planszy: problem, odbiorcy, rozwiązanie, zasoby, partnerzy, koszty i miary sukcesu. Szkic zapisuje się w przeglądarce, a
              gotową planszę wydrukujesz.
            </p>
          </div>
          <Link href="/kreator/canva" className="inline-flex items-center gap-2 rounded-xl bg-brand-900 px-6 py-3.5 font-bold text-white no-underline hover:bg-brand-700">
            <Icon name="grid" className="h-5 w-5" /> Otwórz Canvę
          </Link>
        </section>

        <section id="asystent" aria-labelledby="h-asystent" className="scroll-mt-6">
          <SectionTitle id="h-asystent" kicker="Asystent kreatora innowacji">
            Rozwiń pomysł z asystentem
          </SectionTitle>
          <Panel>
            <AssistantPanel
              kind="develop-idea"
              inputLabel="Opisz pomysł – nawet w jednym zdaniu"
              inputPlaceholder="np. Chcę, żeby uczniowie uczyli seniorów obsługi smartfona"
              submitLabel="Podpowiedz mi"
            />
          </Panel>
          <Panel className="mt-6">
            <h3 id="h-wizualizacja" className="flex items-center gap-2 text-xl font-black text-brand-900">
              <Icon name="sparkle" className="h-5 w-5" /> Wizualizacja pomysłu
            </h3>
            <p className="mb-5 mt-1 max-w-3xl text-slate-700">
              Zobacz, jak może wyglądać Twoja innowacja – np. nowy przedmiot, miejsce spotkań albo materiał informacyjny. Asystent przygotuje obraz z
              opisu.
            </p>
            <IdeaVisualization />
          </Panel>
        </section>

        <section id="nabory" aria-labelledby="h-nabory" className="scroll-mt-6">
          <SectionTitle id="h-nabory" kicker="Generator wniosków">
            Nabory w konkursach grantowych
          </SectionTitle>
          <ul className="grid gap-5 md:grid-cols-2">
            {nabory.map((n) => (
              <li key={n.id} className={`relative flex flex-col overflow-hidden rounded-2xl p-7 ${n.open ? "bg-brand-900 text-white" : "border-2 border-dashed border-slate-300"}`}>
                {n.open && <div aria-hidden className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-brand-700" />}
                <p className="relative">
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-0.5 text-sm font-bold ${n.open ? "bg-emerald-400 text-brand-900" : "bg-slate-200 text-slate-800"}`}>
                    {n.open ? `Nabór otwarty · do ${fmtDate(n.deadline)}` : "Nabór zamknięty"}
                  </span>
                </p>
                <h3 className={`relative mt-3 text-xl font-black ${n.open ? "text-white" : "text-brand-900"}`}>{n.title}</h3>
                <p className={`relative mt-1 flex-1 ${n.open ? "text-slate-200" : "text-slate-700"}`}>{n.description}</p>
                <p className="relative mt-3 flex flex-wrap gap-3 text-sm">
                  {n.areas.map((a) => (
                    <span key={a} className={`inline-flex items-center gap-1.5 ${n.open ? "text-slate-200" : "text-slate-700"}`}>
                      <Dot className={AREA_COLOR[a]} /> {AREA_LABEL[a]}
                    </span>
                  ))}
                </p>
                {n.open ? (
                  <Link href={`/kreator/wniosek?nabor=${n.id}`} className="relative mt-5 inline-flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-brand-900 no-underline hover:bg-brand-50">
                    <Icon name="file" className="h-5 w-5" /> Wypełnij wniosek
                  </Link>
                ) : (
                  <p className="relative mt-5 text-sm font-bold text-slate-600">Generator otworzy się wraz z naborem. Informacja pojawi się w Aktualnościach.</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
