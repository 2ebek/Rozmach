import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PushControl } from "@/components/PushControl";
import { Badge } from "@/components/ui";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/labels";
import { getRepo } from "@/lib/store";
import type { IdeaCard } from "@/lib/types";

export const dynamic = "force-dynamic";

const fmt = (iso: string) => new Date(iso).toLocaleString("pl-PL", { timeZone: "Europe/Warsaw", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function IdeaRow({ idea }: { idea: IdeaCard }) {
  return (
    <li>
      <Link
        href={`/admin/app/${idea.id}`}
        className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 no-underline transition hover:border-brand-700 hover:shadow-md"
      >
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 text-lg font-black leading-snug text-brand-900">{idea.title}</span>
          <span className="block truncate text-sm text-slate-600">
            Dla: {idea.audience.length > 120 ? `${idea.audience.slice(0, 119)}…` : idea.audience} · {fmt(idea.createdAt)}
          </span>
        </span>
        <Badge className={STATUS_STYLE[idea.status]}>{STATUS_LABEL[idea.status]}</Badge>
        <Icon name="arrow" className="h-5 w-5 shrink-0 text-brand-700" />
      </Link>
    </li>
  );
}

/** Lista pomysłów dla aplikacji administratora: najpierw nowe (do przejrzenia), potem pozostałe. */
export default async function Page() {
  const ideas = [...(await getRepo().listIdeas())].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const fresh = ideas.filter((i) => i.status === "nowy");
  const rest = ideas.filter((i) => i.status !== "nowy");

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-accent">Hub Admin</p>
          <h1 className="text-3xl font-black tracking-tight">Nowe pomysły</h1>
        </div>
        <Link href="/admin" className="text-sm font-bold text-brand-700 hover:text-accent">
          Pełny panel
        </Link>
      </header>

      <PushControl />

      <section aria-labelledby="h-nowe">
        <h2 id="h-nowe" className="mb-3 flex items-center gap-2 text-xl font-black">
          Do przejrzenia <Badge className="bg-accent text-white">{fresh.length}</Badge>
        </h2>
        {fresh.length === 0 ? (
          <p className="rounded-2xl bg-mist p-5 text-slate-700">Brak nowych pomysłów. Dostaniesz powiadomienie, gdy pojawi się kolejny.</p>
        ) : (
          <ul className="space-y-3">
            {fresh.map((i) => (
              <IdeaRow key={i.id} idea={i} />
            ))}
          </ul>
        )}
      </section>

      {rest.length > 0 && (
        <section aria-labelledby="h-pozostale">
          <h2 id="h-pozostale" className="mb-3 text-xl font-black">
            Pozostałe
          </h2>
          <ul className="space-y-3">
            {rest.map((i) => (
              <IdeaRow key={i.id} idea={i} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
