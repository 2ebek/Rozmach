import { notFound } from "next/navigation";
import { AdminAction } from "@/components/AdminAction";
import { AdminAppBar } from "@/components/AdminAppBar";
import { IdeaComment } from "@/components/IdeaComment";
import { ThreadView } from "@/components/ThreadView";
import { Badge, Panel, actionCls } from "@/components/ui";
import { AREA_LABEL_ROPS, STAGE_LABEL, STATUS_LABEL, STATUS_STYLE } from "@/lib/labels";
import { getRepo } from "@/lib/store";
import type { IdeaCard } from "@/lib/types";

export const dynamic = "force-dynamic";

const fmt = (iso: string) => new Date(iso).toLocaleString("pl-PL", { timeZone: "Europe/Warsaw", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

const ACTIONS: { status: IdeaCard["status"]; label: string; cls: string }[] = [
  { status: "zaakceptowany", label: "Akceptuj", cls: actionCls.primary },
  { status: "w-weryfikacji", label: "Do weryfikacji", cls: actionCls.secondary },
  { status: "odrzucony", label: "Odrzuć", cls: "border-2 border-red-300 text-red-900 hover:border-red-700" },
];

/** Szczegóły pomysłu w aplikacji administratora: treść fiszki, decyzja, komentarz dla autora i rozmowa. */
export default async function Page({ params }: { params: { id: string } }) {
  const ideas = await getRepo().listIdeas();
  const idea = ideas.find((i) => i.id === params.id);
  if (!idea) notFound();
  const fresh = ideas.filter((i) => i.status === "nowy").length;
  const awaitsReply = idea.thread[idea.thread.length - 1]?.from === "author";

  return (
    <div className="pb-6">
      <AdminAppBar badge={fresh} back={{ href: "/admin/app", label: "Pomysły" }} />
      <div className="mx-auto max-w-3xl space-y-6">
        <Panel>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-sm font-bold uppercase tracking-wider text-accent-ink">Fiszka pomysłu · {idea.code}</p>
            <Badge className={STATUS_STYLE[idea.status]}>{STATUS_LABEL[idea.status]}</Badge>
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight">{idea.title}</h1>
          <p className="mt-2 text-sm text-slate-600">
            Zgłoszono {fmt(idea.createdAt)} · Etap: {STAGE_LABEL[idea.stage]}
            {idea.category ? ` · ${AREA_LABEL_ROPS[idea.category]}` : ""}
          </p>

          <section aria-labelledby="h-decyzja" className="mt-6 rounded-2xl bg-mist p-4" data-decision>
            <h2 id="h-decyzja" className="font-black text-brand-900">
              Decyzja
            </h2>
            <p className="text-sm text-slate-700">Autor od razu zobaczy nowy status na stronie statusu (po kodzie zgłoszenia).</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {ACTIONS.filter((a) => a.status !== idea.status).map((a) => (
                <AdminAction key={a.status} payload={{ action: "idea-status", id: idea.id, status: a.status }} className={`min-h-11 ${a.cls}`}>
                  {a.label}
                </AdminAction>
              ))}
            </div>
            <IdeaComment id={idea.id} comment={idea.adminComment} />
          </section>

          <dl className="mt-6 space-y-5">
            <div>
              <dt className="text-sm font-bold text-slate-600">3. Opis innowacji</dt>
              <dd className="mt-1 whitespace-pre-line text-lg text-slate-900">{idea.essence}</dd>
            </div>
            {(
              [
                ["4. Innowacyjność rozwiązania", idea.innovativeness],
                ["5. Diagnoza problemu", idea.problem],
                ["6. Opis odbiorców", idea.audience],
                ["7. Zmiana, jaką wprowadza", idea.change],
                ["8. Wizja przyszłości", idea.vision],
              ] as const
            )
              .filter(([, v]) => v)
              .map(([label, v]) => (
                <div key={label}>
                  <dt className="text-sm font-bold text-slate-600">{label}</dt>
                  <dd className="mt-1 whitespace-pre-line text-slate-900">{v}</dd>
                </div>
              ))}
          </dl>
        </Panel>

        <Panel>
          <h2 className="flex flex-wrap items-center gap-2 text-xl font-black">
            Rozmowa z autorem ({idea.thread.length})
            {awaitsReply && <Badge className="bg-rose-50 text-accent-ink">czeka na odpowiedź</Badge>}
          </h2>
          <div className="mt-4">
            <ThreadView code={idea.code} thread={idea.thread} as="admin" />
          </div>
        </Panel>
      </div>
    </div>
  );
}
