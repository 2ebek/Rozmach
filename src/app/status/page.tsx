import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { ThreadView } from "@/components/ThreadView";
import { Badge, Panel, btnCls, inputCls } from "@/components/ui";
import { normalizeCode } from "@/lib/code";
import { APP_STATUS_LABEL, APP_STATUS_STYLE, STATUS_LABEL, STATUS_STYLE } from "@/lib/labels";
import { getRepo } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Status zgłoszenia – Hub Innowacji" };

const STEPS = ["Wysłane", "W weryfikacji", "Decyzja"];

export default async function Page({ searchParams }: { searchParams: { kod?: string } }) {
  const code = typeof searchParams.kod === "string" ? normalizeCode(searchParams.kod) : "";
  const found = code ? await getRepo().findByCode(code) : null;

  let step = 0;
  let statusLabel = "";
  let statusCls = "";
  if (found?.kind === "idea") {
    step = { nowy: 0, "w-weryfikacji": 1, zaakceptowany: 2, odrzucony: 2 }[found.item.status];
    statusLabel = STATUS_LABEL[found.item.status];
    statusCls = STATUS_STYLE[found.item.status];
  } else if (found?.kind === "application") {
    step = { zlozony: 0, "w-ocenie": 1, przyjety: 2, odrzucony: 2 }[found.item.status];
    statusLabel = APP_STATUS_LABEL[found.item.status];
    statusCls = APP_STATUS_STYLE[found.item.status];
  }

  return (
    <>
      <PageHeader
        eyebrow="Sprawdź status"
        title="Co dzieje się z moim zgłoszeniem?"
        lead="Wpisz kod, który dostałeś po wysłaniu fiszki pomysłu albo wniosku. Zobaczysz status i odpowiedzi zespołu Hubu – i możesz od razu odpisać."
      >
        <form action="/status" method="get" className="mt-6 flex max-w-lg flex-col gap-2 sm:flex-row">
          <label htmlFor="kod" className="sr-only">
            Kod zgłoszenia
          </label>
          <input id="kod" name="kod" required defaultValue={code} placeholder="np. HUB-KINO42" className={`${inputCls} font-bold uppercase tracking-widest`} />
          <button type="submit" className={btnCls}>
            Sprawdź
          </button>
        </form>
      </PageHeader>

      {code && !found && (
        <Panel className="max-w-2xl">
          <p className="text-lg font-black text-brand-900">Nie znaleźliśmy zgłoszenia o kodzie {code}.</p>
          <p className="mt-1 text-slate-700">Sprawdź, czy kod jest przepisany bez błędów. Kod ma postać HUB-XXXXXX (fiszka) albo WN-XXXXXX (wniosek).</p>
        </Panel>
      )}

      {!code && (
        <p className="text-slate-700">
          Na próbę wpisz przykładowy kod <Link href="/status?kod=HUB-KINO42" className="font-bold text-brand-700 underline">HUB-KINO42</Link>.
        </p>
      )}

      {found && (
        <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
          <Panel>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-accent">{found.kind === "idea" ? "Fiszka pomysłu" : "Wniosek w naborze"}</p>
                <h2 className="mt-1 text-2xl font-black">{found.item.title}</h2>
                <p className="text-sm text-slate-600">
                  Kod {found.item.code} · wysłano {new Date(found.item.createdAt).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <Badge className={statusCls}>{statusLabel}</Badge>
            </div>

            {/* Oś czasu zgłoszenia */}
            <ol className="my-8 grid grid-cols-3 gap-2" aria-label="Etapy zgłoszenia">
              {STEPS.map((s, i) => (
                <li key={s} aria-current={i === step ? "step" : undefined}>
                  <div className={`h-2 rounded-full ${i <= step ? "bg-brand-700" : "bg-slate-200"}`} />
                  <p className={`mt-2 text-sm font-bold ${i <= step ? "text-brand-900" : "text-slate-500"}`}>
                    {i < step && <span className="sr-only">Zakończony: </span>}
                    {s}
                  </p>
                </li>
              ))}
            </ol>

            <h3 className="mb-3 text-lg font-black text-brand-900">Rozmowa z zespołem Hubu</h3>
            <ThreadView code={found.item.code} thread={found.item.thread} as="author" />
          </Panel>

          <aside className="space-y-5">
            <div className="rounded-2xl bg-brand-900 p-6 text-white">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
                <Icon name="bell" className="h-5 w-5" />
              </span>
              <h2 className="mt-3 text-lg font-black !text-white">Jak to działa?</h2>
              <p className="mt-2 text-[0.95rem] text-slate-200">
                Każde zgłoszenie od razu trafia do panelu zespołu Hubu jako powiadomienie. Odpowiedź pojawi się tutaj – wystarczy kod, bez zakładania konta.
              </p>
            </div>
            {found.kind === "idea" && found.item.status === "zaakceptowany" && (
              <div className="rounded-2xl border border-slate-200 p-6">
                <h2 className="text-lg font-black">Następny krok</h2>
                <p className="mt-2 text-[0.95rem] text-slate-700">Pomysł zaakceptowany – możesz zamienić fiszkę we wniosek w otwartym naborze.</p>
                <Link href={`/kreator/wniosek?fiszka=${found.item.code}`} className="mt-3 inline-flex items-center gap-1.5 font-bold text-brand-700 hover:text-accent">
                  Przygotuj wniosek <Icon name="arrow" className="h-4 w-4" />
                </Link>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
