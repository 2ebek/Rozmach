import { AdminAction } from "@/components/AdminAction";
import { AddInnovationForm, IndicatorEditor } from "@/components/AdminKnowledge";
import { AdminNav } from "@/components/AdminNav";
import { PageHeader } from "@/components/PageHeader";
import { Badge, Dot, Panel, SectionTitle, actionCls } from "@/components/ui";
import { AREA_COLOR, AREA_LABEL, STAGE_LABEL } from "@/lib/labels";
import { getRepo } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Zarządzanie wiedzą – Hub Innowacji" };

export default async function Page() {
  const repo = getRepo();
  const [innovations, challenges, events] = await Promise.all([repo.listInnovations({ includeHidden: true }), repo.listChallenges(), repo.listEvents()]);
  const unread = events.filter((e) => !e.read).length;

  return (
    <>
      <PageHeader
        eyebrow="Panel administratora"
        title="Zarządzanie wiedzą"
        lead="Dodawaj innowacje do Biblioteki, ukrywaj je do czasu weryfikacji i aktualizuj wskaźniki wyzwań. Zmiany są widoczne od razu – także w matchmakingu i w API."
      >
        <AdminNav unread={unread} />
      </PageHeader>

      <div className="space-y-16">
        <section aria-labelledby="h-dodaj" className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionTitle id="h-dodaj" kicker="Biblioteka Innowacji">
              Dodaj innowację
            </SectionTitle>
            <Panel>
              <AddInnovationForm />
            </Panel>
          </div>
          <div>
            <SectionTitle kicker="Mapa Wyzwań Społecznych">Wskaźniki wyzwań</SectionTitle>
            <ul className="space-y-4">
              {challenges.map((c) => (
                <li key={c.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="flex items-center gap-2 font-black text-brand-900">
                    <Dot className={AREA_COLOR[c.area]} /> {c.title}
                  </p>
                  {c.indicator && (
                    <div className="mt-3">
                      <IndicatorEditor id={c.id} value={c.indicator.value} unit={c.indicator.unit} label={c.indicator.label} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="h-lista">
          <SectionTitle id="h-lista" kicker={`${innovations.length} pozycji`}>
            Innowacje w Bibliotece
          </SectionTitle>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[40rem] text-left">
              <caption className="sr-only">Lista innowacji z możliwością publikacji</caption>
              <thead className="bg-mist text-sm uppercase tracking-wide text-slate-700">
                <tr>
                  <th scope="col" className="px-5 py-3">
                    Innowacja
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Kategorie ROPS
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Etap
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Widoczność
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {[...innovations].reverse().map((i) => (
                  <tr key={i.id}>
                    <th scope="row" className="px-5 py-4 font-bold text-brand-900">
                      {i.title}
                    </th>
                    <td className="px-5 py-4 text-sm text-slate-700">{i.areas.map((a) => AREA_LABEL[a]).join(", ")}</td>
                    <td className="px-5 py-4">
                      <Badge>{STAGE_LABEL[i.stage]}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge className={i.published ? "bg-emerald-100 text-emerald-900" : "bg-slate-200 text-slate-800"}>{i.published ? "Opublikowana" : "Ukryta"}</Badge>
                        <AdminAction payload={{ action: "publish", id: i.id, published: !i.published }} className={i.published ? actionCls.ghost : actionCls.dark}>
                          {i.published ? "Ukryj" : "Opublikuj"}
                        </AdminAction>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
