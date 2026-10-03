import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Badge, Panel } from "@/components/ui";
import { AREA_LABEL_ROPS, STAGE_LABEL, STATUS_LABEL, STATUS_STYLE } from "@/lib/labels";
import { getRepo } from "@/lib/store";

export const dynamic = "force-dynamic";

const fmt = (iso: string) => new Date(iso).toLocaleString("pl-PL", { timeZone: "Europe/Warsaw", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** Podgląd szczegółów pomysłu w aplikacji administratora (tylko odczyt – decyzje w pełnym panelu). */
export default async function Page({ params }: { params: { id: string } }) {
  const idea = (await getRepo().listIdeas()).find((i) => i.id === params.id);
  if (!idea) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/app" className="inline-flex items-center gap-2 font-bold text-brand-700 hover:text-accent">
        <Icon name="arrow" className="h-4 w-4 rotate-180" /> Wszystkie pomysły
      </Link>

      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="text-sm font-bold uppercase tracking-wider text-accent">Fiszka pomysłu</p>
          <Badge className={STATUS_STYLE[idea.status]}>{STATUS_LABEL[idea.status]}</Badge>
        </div>
        <h1 className="mt-2 text-3xl font-black tracking-tight">{idea.title}</h1>

        <dl className="mt-6 space-y-5">
          <div>
            <dt className="text-sm font-bold text-slate-600">3. Opis innowacji</dt>
            <dd className="mt-1 whitespace-pre-line text-lg text-slate-900">{idea.essence}</dd>
          </div>
          {idea.category && (
            <div>
              <dt className="text-sm font-bold text-slate-600">Kategoria Biblioteki ROPS</dt>
              <dd className="mt-1 text-slate-900">{AREA_LABEL_ROPS[idea.category]}</dd>
            </div>
          )}
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
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <dt className="text-sm font-bold text-slate-600">Etap</dt>
              <dd className="mt-1 text-slate-900">{STAGE_LABEL[idea.stage]}</dd>
            </div>
            <div>
              <dt className="text-sm font-bold text-slate-600">Zgłoszono</dt>
              <dd className="mt-1 text-slate-900">{fmt(idea.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-sm font-bold text-slate-600">Kod zgłoszenia</dt>
              <dd className="mt-1 font-bold tracking-wider text-brand-900">{idea.code}</dd>
            </div>
          </div>
          <div>
            <dt className="text-sm font-bold text-slate-600">Rozmowa z autorem</dt>
            <dd className="mt-1 text-slate-900">
              {idea.thread.length === 0 ? "Brak wiadomości." : `${idea.thread.length} ${idea.thread.length === 1 ? "wiadomość" : "wiadomości"}`}
            </dd>
          </div>
        </dl>
      </Panel>

      <Link href={`/admin?kolejka=${idea.status}#kolejka`} className="inline-flex items-center gap-2 rounded-xl bg-brand-900 px-5 py-3 font-bold text-white no-underline hover:bg-brand-700">
        Oceń lub odpowiedz w pełnym panelu <Icon name="arrow" className="h-4 w-4" />
      </Link>
    </div>
  );
}
