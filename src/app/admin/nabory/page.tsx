import { AdminAction } from "@/components/AdminAction";
import { AdminApplicationForm } from "@/components/AdminApplicationForm";
import { AdminNav } from "@/components/AdminNav";
import { IwsApplicationDetails } from "@/components/IwsApplicationDetails";
import { PageHeader } from "@/components/PageHeader";
import { ThreadView } from "@/components/ThreadView";
import { Badge, Panel, SectionTitle, actionCls } from "@/components/ui";
import { APP_STATUS_LABEL, APP_STATUS_STYLE } from "@/lib/labels";
import { getRepo } from "@/lib/store";
import type { Application } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nabory i wnioski – Hub Innowacji" };

const fmtDate = (d: string) => new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });

const APP_ACTIONS: { status: Application["status"]; label: string; cls: string }[] = [
  { status: "w-ocenie", label: "Przekaż do oceny", cls: actionCls.secondary },
  { status: "przyjety", label: "Przyjmij", cls: actionCls.primary },
  { status: "odrzucony", label: "Odrzuć", cls: actionCls.ghost },
];

export default async function Page() {
  const repo = getRepo();
  const [nabory, applications, events, ideas] = await Promise.all([repo.listNabory(), repo.listApplications(), repo.listEvents(), repo.listIdeas()]);
  const unread = events.filter((e) => !e.read).length;

  return (
    <>
      <PageHeader
        eyebrow="Panel administratora"
        title="Nabory i wnioski"
        lead="Otwieraj i zamykaj nabory – generator wniosków i Aktualności na stronie głównej zmieniają się automatycznie. Tu trafiają też złożone wnioski."
      >
        <AdminNav unread={unread} />
      </PageHeader>

      <div className="space-y-16">
        <section aria-labelledby="h-nabory">
          <SectionTitle id="h-nabory" kicker="Konkursy grantowe">
            Nabory
          </SectionTitle>
          <ul className="grid gap-5 md:grid-cols-2">
            {nabory.map((n) => {
              const count = applications.filter((a) => a.naborId === n.id).length;
              return (
                <li key={n.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="text-lg font-black text-brand-900">{n.title}</h3>
                    <Badge className={n.open ? "bg-emerald-100 text-emerald-900" : "bg-slate-200 text-slate-800"}>{n.open ? "Otwarty" : "Zamknięty"}</Badge>
                  </div>
                  <p className="mt-1 flex-1 text-slate-700">{n.description}</p>
                  <p className="mt-3 text-sm text-slate-600">
                    Termin: {fmtDate(n.deadline)} · {n.questions.length} pytań · wniosków: {count}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <AdminAction payload={{ action: "nabor-open", id: n.id, open: !n.open }} className={n.open ? actionCls.secondary : actionCls.dark}>
                      {n.open ? "Zamknij nabór" : "Otwórz nabór"}
                    </AdminAction>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="h-dodaj-wniosek">
          <SectionTitle id="h-dodaj-wniosek" kicker="Np. wniosek złożony na papierze">
            Dodaj wniosek
          </SectionTitle>
          <Panel>
            <AdminApplicationForm nabory={nabory} ideas={ideas.map(({ code, title, essence, audience, problem, innovativeness, change, vision }) => ({ code, title, essence, audience, problem, innovativeness, change, vision }))} />
          </Panel>
        </section>

        <section aria-labelledby="h-wnioski">
          <SectionTitle id="h-wnioski" kicker={`${applications.length} złożonych`}>
            Wnioski
          </SectionTitle>
          {applications.length === 0 ? (
            <p className="rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center text-slate-700">
              Jeszcze brak wniosków. Pojawią się tu po wysłaniu formularza w Generatorze wniosków.
            </p>
          ) : (
            <ul className="space-y-5">
              {[...applications].reverse().map((a) => {
                const nabor = nabory.find((n) => n.id === a.naborId);
                return (
                  <li key={a.id} className="rounded-2xl border border-slate-200 bg-white p-6">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-black text-brand-900">{a.title}</h3>
                        <p className="text-sm text-slate-600">
                          {nabor?.title} · kod {a.code}
                          {a.ideaCode && ` · z fiszki ${a.ideaCode}`} · {fmtDate(a.createdAt)}
                        </p>
                      </div>
                      <Badge className={APP_STATUS_STYLE[a.status]}>{APP_STATUS_LABEL[a.status]}</Badge>
                    </div>
                    <details className="mt-4 rounded-lg bg-mist p-4">
                      <summary className="cursor-pointer font-bold text-brand-700">Treść wniosku</summary>
                      <dl className="mt-3 space-y-3">
                        {nabor?.questions.map((q) => (
                          <div key={q.id}>
                            <dt className="text-sm font-bold text-brand-900">{q.label}</dt>
                            <dd className="whitespace-pre-line text-slate-800">{a.answers[q.id]}</dd>
                          </div>
                        ))}
                      </dl>
                    </details>
                    {a.form && (
                      <details className="mt-4 rounded-lg border border-slate-200 p-4">
                        <summary className="cursor-pointer font-bold text-brand-700">Wnioskodawca, plan działania i oświadczenia</summary>
                        <div className="mt-4">
                          <IwsApplicationDetails form={a.form} />
                        </div>
                      </details>
                    )}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {APP_ACTIONS.filter((x) => x.status !== a.status).map((x) => (
                        <AdminAction key={x.status} payload={{ action: "application-status", id: a.id, status: x.status }} className={x.cls}>
                          {x.label}
                        </AdminAction>
                      ))}
                    </div>
                    <details className="mt-4 rounded-lg border border-slate-200 p-4">
                      <summary className="cursor-pointer font-bold text-brand-700">Rozmowa z wnioskodawcą ({a.thread.length})</summary>
                      <div className="mt-4">
                        <ThreadView code={a.code} thread={a.thread} as="admin" />
                      </div>
                    </details>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
