import Link from "next/link";
import { AdminAction } from "@/components/AdminAction";
import { AdminNav } from "@/components/AdminNav";
import { Icon, type IconName } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { ThreadView } from "@/components/ThreadView";
import { Badge, Dot, actionCls } from "@/components/ui";
import { AREAS, AREA_COLOR, AREA_LABEL, ROLE_LABEL, STAGE_LABEL, STATUS_LABEL, STATUS_STYLE } from "@/lib/labels";
import { getRepo } from "@/lib/store";
import type { HubEvent, IdeaCard } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Panel administratora – Hub Innowacji" };

const fmt = (iso: string) => new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
const fmtTime = (iso: string) => new Date(iso).toLocaleString("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const EVENT_ICON: Record<HubEvent["kind"], IconName> = {
  idea: "bulb",
  application: "file",
  feedback: "star",
  need: "search",
  message: "chat",
  partner: "users",
  nabor: "bell",
  reply: "send",
  wiedza: "book",
};

const IDEA_ACTIONS: { status: IdeaCard["status"]; label: string; cls: string }[] = [
  { status: "zaakceptowany", label: "Akceptuj", cls: actionCls.primary },
  { status: "w-weryfikacji", label: "Do weryfikacji", cls: actionCls.secondary },
  { status: "odrzucony", label: "Odrzuć", cls: actionCls.ghost },
];

const QUEUES: { status: IdeaCard["status"]; label: string; empty: string; alert?: true }[] = [
  { status: "nowy", label: "Nieprzejrzane", empty: "Brak nowych fiszek – wszystkie zostały przejrzane.", alert: true },
  { status: "w-weryfikacji", label: "Do weryfikacji", empty: "Żadna fiszka nie czeka na weryfikację.", alert: true },
  { status: "zaakceptowany", label: "Zaakceptowane", empty: "Nie ma jeszcze zaakceptowanych fiszek." },
  { status: "odrzucony", label: "Odrzucone", empty: "Nie ma odrzuconych fiszek." },
];

export default async function Page({ searchParams }: { searchParams: { kolejka?: string } }) {
  const repo = getRepo();
  const [needs, ideas, feedback, innovations, events] = await Promise.all([
    repo.listNeeds(),
    repo.listIdeas(),
    repo.listFeedback(),
    repo.listInnovations({ includeHidden: true }),
    repo.listEvents(),
  ]);

  const counts = AREAS.map((a) => ({ area: a, n: needs.filter((x) => x.area === a).length }))
    .filter((c) => c.n > 0)
    .sort((a, b) => b.n - a.n);
  const max = Math.max(1, ...counts.map((c) => c.n));
  const pending = ideas.filter((i) => i.status === "nowy" || i.status === "w-weryfikacji");
  // Osobna kolejka dla każdego statusu fiszki (?kolejka=…), domyślnie nieprzejrzane.
  const queue = QUEUES.find((q) => q.status === searchParams.kolejka) ?? QUEUES[0]!;
  const shown = ideas.filter((i) => i.status === queue.status);
  const testers = feedback.filter((f) => f.wantsToTest).length;
  const avg = feedback.length ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1) : "–";
  const unread = events.filter((e) => !e.read).length;
  const titleOf = (id: string) => innovations.find((i) => i.id === id)?.title ?? id;

  const KPI: { icon: IconName; value: string | number; label: string; tint: string }[] = [
    { icon: "search", value: needs.length, label: "zgłoszonych potrzeb", tint: "bg-brand-50 text-brand-700" },
    { icon: "bulb", value: pending.length, label: "fiszek do przejrzenia (nowe i do weryfikacji)", tint: "bg-rose-50 text-accent" },
    { icon: "flask", value: testers, label: "chętnych do testów", tint: "bg-orange-50 text-orange-800" },
    { icon: "star", value: avg, label: "średnia ocena innowacji", tint: "bg-emerald-50 text-emerald-800" },
  ];

  const ideaCard = (i: IdeaCard) => {
    const awaitsReply = i.thread[i.thread.length - 1]?.from === "author";
    return (
      <li key={i.id} className="rounded-xl bg-mist p-5">
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
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {IDEA_ACTIONS.filter((a) => a.status !== i.status).map((a) => (
            <AdminAction key={a.status} payload={{ action: "idea-status", id: i.id, status: a.status }} className={a.cls}>
              {a.label}
            </AdminAction>
          ))}
        </div>
        <details className="group mt-4 rounded-lg bg-white p-4" open={awaitsReply}>
          <summary className="cursor-pointer font-bold text-brand-700">
            Rozmowa z autorem ({i.thread.length})
            {awaitsReply && <span className="ml-2 text-accent">· czeka na odpowiedź</span>}
          </summary>
          <div className="mt-4">
            <ThreadView code={i.code} thread={i.thread} as="admin" />
          </div>
        </details>
      </li>
    );
  };

  return (
    <>
      <PageHeader eyebrow="Panel administratora" title="Dzień dobry, zespole Hubu" lead="Powiadomienia, kolejka fiszek z rozmową z autorami i trendy potrzeb mieszkańców w jednym miejscu.">
        <AdminNav unread={unread} />
      </PageHeader>

      <div className="space-y-12">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPI.map((k) => (
            <li key={k.label} className="rounded-2xl border border-slate-200 bg-white p-6">
              <span className={`grid h-11 w-11 place-items-center rounded-xl ${k.tint}`}>
                <Icon name={k.icon} className="h-5 w-5" />
              </span>
              <p className="mt-4 text-4xl font-black tracking-tight text-brand-900">{k.value}</p>
              <p className="text-slate-700">{k.label}</p>
            </li>
          ))}
        </ul>

        {/* POWIADOMIENIA – każde zgłoszenie od razu trafia tutaj (i na webhook, jeśli skonfigurowany) */}
        <section aria-labelledby="h-powiadomienia" className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="h-powiadomienia" className="flex items-center gap-3 text-2xl font-black">
              Powiadomienia
              {unread > 0 && <Badge className="bg-accent text-white">{unread} nowe</Badge>}
            </h2>
            {unread > 0 && (
              <AdminAction payload={{ action: "events-read" }} className={actionCls.secondary}>
                Oznacz wszystkie jako przeczytane
              </AdminAction>
            )}
          </div>
          <ul className="mt-5 divide-y divide-slate-200">
            {events.slice(0, 8).map((e) => (
              <li key={e.id} className={`flex items-center gap-4 py-3 ${e.read ? "" : "font-bold"}`}>
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${e.read ? "bg-mist text-slate-600" : "bg-rose-50 text-accent"}`}>
                  <Icon name={EVENT_ICON[e.kind]} className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  {!e.read && <span className="sr-only">Nowe: </span>}
                  {e.href ? (
                    <Link href={e.href} className="text-brand-900 hover:text-brand-700 hover:underline">
                      {e.text}
                    </Link>
                  ) : (
                    e.text
                  )}
                </span>
                <time className="shrink-0 text-sm font-normal text-slate-600">{fmtTime(e.createdAt)}</time>
              </li>
            ))}
          </ul>
        </section>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.15fr]">
          <section id="trendy" aria-labelledby="h-trendy" className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 id="h-trendy" className="text-2xl font-black">
              Trendy potrzeb
            </h2>
            <p className="mt-1 text-sm text-slate-600">Zgłoszenia z matchmakingu według kategorii Biblioteki ROPS – dane widoczne wyłącznie dla administratora.</p>
            <ul className="mt-6 space-y-4">
              {counts.map((c) => (
                <li key={c.area}>
                  <div className="mb-1.5 flex items-center justify-between text-[0.95rem]">
                    <span className="flex items-center gap-2 font-bold text-brand-900">
                      <Dot className={AREA_COLOR[c.area]} /> {AREA_LABEL[c.area]}
                    </span>
                    <span className="font-bold text-slate-700">{c.n}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-mist">
                    <div className={`h-full rounded-full ${AREA_COLOR[c.area]}`} style={{ width: `${(c.n / max) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>

            <h3 className="mt-10 font-black text-brand-900">Ostatnie zgłoszenia</h3>
            <ul className="mt-3 divide-y divide-slate-200">
              {[...needs]
                .reverse()
                .slice(0, 5)
                .map((n) => (
                  <li key={n.id} className="flex items-start justify-between gap-4 py-3 text-[0.95rem]">
                    <span>
                      „{n.text}”
                      <span className="block text-sm text-slate-600">
                        {ROLE_LABEL[n.submitterRole]}
                        {n.area && ` · ${AREA_LABEL[n.area]}`}
                      </span>
                    </span>
                    <time className="shrink-0 text-sm text-slate-600">{fmt(n.createdAt)}</time>
                  </li>
                ))}
            </ul>
          </section>

          <section id="kolejka" aria-labelledby="h-kolejka" className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 id="h-kolejka" className="text-2xl font-black">
              Kolejki fiszek
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Po decyzji fiszka przechodzi do odpowiedniej kolejki, a autor od razu widzi status i odpowiedź na stronie statusu (po kodzie zgłoszenia).
            </p>
            <nav aria-label="Kolejki fiszek" className="mt-5">
              <ul className="flex flex-wrap gap-2">
                {QUEUES.map((q) => {
                  const n = ideas.filter((i) => i.status === q.status).length;
                  const active = q.status === queue.status;
                  return (
                    <li key={q.status}>
                      <Link
                        href={`/admin?kolejka=${q.status}#kolejka`}
                        scroll={false}
                        aria-current={active ? "page" : undefined}
                        className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-bold no-underline ${
                          active ? "border-brand-900 bg-brand-900 text-white" : "border-slate-300 text-brand-900 hover:border-brand-900"
                        }`}
                      >
                        {q.label}
                        <span className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-white text-brand-900" : n && q.alert ? "bg-accent text-white" : "bg-mist text-slate-700"}`}>
                          {n}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <h3 className="sr-only">
              {queue.label} ({shown.length})
            </h3>
            {shown.length === 0 ? (
              <p className="mt-6 rounded-xl bg-mist p-5 text-slate-700">{queue.empty}</p>
            ) : (
              <ul className="mt-6 space-y-4">{[...shown].reverse().map(ideaCard)}</ul>
            )}
          </section>
        </div>

        <section id="opinie" aria-labelledby="h-opinie" className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 id="h-opinie" className="text-2xl font-black">
            Opinie testerów
          </h2>
          {feedback.length === 0 ? (
            <p className="mt-3 text-slate-700">Jeszcze brak opinii.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-200">
              {[...feedback].reverse().map((f) => (
                <li key={f.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                  <span>
                    <span className="font-bold text-brand-900">{titleOf(f.innovationId)}</span>
                    {f.comment && <span className="block text-slate-700">„{f.comment}”</span>}
                  </span>
                  <span className="flex items-center gap-3 text-sm">
                    {f.wantsToTest && <Badge className="bg-emerald-100 text-emerald-900">chce testować</Badge>}
                    <span className="font-bold text-brand-900">
                      <span className="sr-only">Ocena {f.rating} na 5</span>
                      <span aria-hidden>
                        {"★".repeat(f.rating)}
                        <span className="text-slate-300">{"★".repeat(5 - f.rating)}</span>
                      </span>
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
