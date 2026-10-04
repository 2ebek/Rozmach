import Link from "next/link";
import { AdminAppBar } from "@/components/AdminAppBar";
import { AdminIdeaList, type IdeaSummary } from "@/components/AdminIdeaList";
import { Icon } from "@/components/Icon";
import { PushControl } from "@/components/PushControl";
import { getRepo } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Aplikacja administratora: pomysły według statusu, wyszukiwanie i powiadomienia o nowych zgłoszeniach. */
export default async function Page() {
  const ideas = [...(await getRepo().listIdeas())].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const summaries: IdeaSummary[] = ideas.map((i) => ({
    id: i.id,
    title: i.title,
    audience: i.audience.length > 120 ? `${i.audience.slice(0, 119)}…` : i.audience,
    status: i.status,
    createdAt: i.createdAt,
    code: i.code,
    awaitsReply: i.thread[i.thread.length - 1]?.from === "author",
  }));
  const fresh = summaries.filter((i) => i.status === "nowy").length;
  const toVerify = summaries.filter((i) => i.status === "w-weryfikacji").length;
  const replies = summaries.filter((i) => i.awaitsReply).length;

  return (
    <div className="pb-6">
      <AdminAppBar badge={fresh} />
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <h1 className="text-3xl font-black tracking-tight">Pomysły do przejrzenia</h1>
          <ul className="mt-4 grid grid-cols-3 gap-3" aria-label="Podsumowanie">
            {(
              [
                [fresh, "nowe", "text-accent-ink"],
                [toVerify, "do weryfikacji", "text-amber-800"],
                [replies, "czeka na odpowiedź", "text-brand-700"],
              ] as const
            ).map(([n, label, tint]) => (
              <li key={label} className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
                <p className={`text-3xl font-black ${n ? tint : "text-slate-500"}`}>{n}</p>
                <p className="text-sm leading-tight text-slate-700">{label}</p>
              </li>
            ))}
          </ul>
        </header>

        <PushControl />
        <AdminIdeaList ideas={summaries} />

        <p className="text-center text-sm text-slate-600">
          <Link href="/admin/app/pobierz" className="inline-flex items-center gap-1.5 font-bold text-brand-700 hover:text-accent">
            <Icon name="download" className="h-4 w-4" /> Zainstaluj aplikację na innym urządzeniu
          </Link>
        </p>
      </div>
    </div>
  );
}
