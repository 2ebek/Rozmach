import { AdminAction } from "@/components/AdminAction";
import { AdminIdeaForm } from "@/components/AdminIdeaForm";
import { AdminNav } from "@/components/AdminNav";
import { PageHeader } from "@/components/PageHeader";
import { Badge, Panel, SectionTitle, actionCls } from "@/components/ui";
import { AREA_LABEL, STAGE_LABEL, STATUS_LABEL, STATUS_STYLE } from "@/lib/labels";
import { getRepo } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pomysły – Hub Innowacji" };

const fmt = (iso: string) => new Date(iso).toLocaleDateString("pl-PL", { timeZone: "Europe/Warsaw", day: "numeric", month: "short", year: "numeric" });

export default async function Page() {
  const repo = getRepo();
  const [ideas, applications, events] = await Promise.all([repo.listIdeas(), repo.listApplications(), repo.listEvents()]);
  const unread = events.filter((e) => !e.read).length;
  const sorted = [...ideas].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <PageHeader
        eyebrow="Panel administratora"
        title="Pomysły"
        lead="Dodawaj, poprawiaj i usuwaj fiszki pomysłów. Zmiany są zapisywane trwale i od razu widoczne w panelu, aplikacji administratora i na stronie statusu."
      >
        <AdminNav unread={unread} />
      </PageHeader>

      <div className="grid gap-10 lg:grid-cols-[1fr_24rem]">
        <section aria-labelledby="h-lista-pomyslow">
          <SectionTitle id="h-lista-pomyslow" kicker={`${ideas.length} w bazie`}>
            Wszystkie pomysły
          </SectionTitle>
          {sorted.length === 0 ? (
            <p className="rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center text-slate-700">
              Brak pomysłów. Dodaj pierwszy w formularzu obok albo poczekaj na zgłoszenia z Kreatora.
            </p>
          ) : (
            <ul className="space-y-4">
              {sorted.map((i) => {
                const linked = applications.filter((a) => a.ideaCode === i.code).length;
                return (
                  <li key={i.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="text-lg font-black text-brand-900">{i.title}</h3>
                      <Badge className={STATUS_STYLE[i.status]}>{STATUS_LABEL[i.status]}</Badge>
                    </div>
                    <p className="mt-1 text-slate-800">{i.essence}</p>
                    {i.problem && (
                      <p className="mt-1 text-sm text-slate-700">
                        <span className="font-bold">Problem: </span>
                        {i.problem}
                      </p>
                    )}
                    <p className="mt-2 text-sm text-slate-600">
                      {i.category ? `${AREA_LABEL[i.category]} · ` : ""}Dla: {i.audience.length > 120 ? `${i.audience.slice(0, 119)}…` : i.audience} · Etap: {STAGE_LABEL[i.stage]} · {fmt(i.createdAt)} · kod {i.code}
                      {linked > 0 && ` · wnioski: ${linked}`}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <details className="w-full rounded-lg bg-mist p-4">
                        <summary className="cursor-pointer font-bold text-brand-700">Edytuj</summary>
                        <div className="mt-4">
                          <AdminIdeaForm idea={i} />
                        </div>
                      </details>
                      <AdminAction
                        payload={{ action: "delete-idea", id: i.id }}
                        className={actionCls.ghost}
                        confirm={`Usunąć pomysł „${i.title}”? Tej operacji nie można cofnąć.`}
                      >
                        Usuń pomysł
                      </AdminAction>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside aria-labelledby="h-nowy-pomysl" className="lg:sticky lg:top-6 lg:self-start">
          <SectionTitle id="h-nowy-pomysl" kicker="Nowa fiszka">
            Dodaj pomysł
          </SectionTitle>
          <Panel>
            <AdminIdeaForm />
          </Panel>
        </aside>
      </div>
    </>
  );
}
