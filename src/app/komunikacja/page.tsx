import { Chat } from "@/components/Chat";
import { PartnerBoard } from "@/components/PartnerBoard";
import { SectionTitle } from "@/components/ui";
import { PageHeader } from "@/components/PageHeader";
import { ROLE_LABEL } from "@/lib/labels";
import { getRepo } from "@/lib/store";
import type { Role } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Rozmowy – Hub Innowacji" };

const LEGEND: { role: Role; cls: string }[] = [
  { role: "admin", cls: "bg-brand-900" },
  { role: "expert", cls: "bg-accent" },
  { role: "jst", cls: "bg-brand-700" },
  { role: "ngo", cls: "bg-teal-700" },
  { role: "resident", cls: "bg-sun" },
];

export default async function Page() {
  const repo = getRepo();
  const [messages, offers] = await Promise.all([repo.listMessages(), repo.listPartnerOffers()]);
  return (
    <>
      <PageHeader
        eyebrow="Platforma aktywnej komunikacji"
        title="Zapytaj, podpowiedz, znajdź partnera"
        lead="Miejsce rozmowy mieszkańców, organizacji, samorządów, ekspertów i zespołu ROPS Kraków."
      />
      <div className="grid gap-10 lg:grid-cols-[1fr_17rem]">
        <Chat initial={messages} />
        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-black">Kto tu jest?</h2>
            <ul className="mt-3 space-y-2.5">
              {LEGEND.map((l) => (
                <li key={l.role} className="flex items-center gap-3 text-[0.95rem]">
                  <span aria-hidden className={`h-3 w-3 rounded-full ${l.cls}`} />
                  {ROLE_LABEL[l.role]}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-brand-50 p-6">
            <h2 className="text-lg font-black">Zasady</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[0.95rem] text-slate-800">
              <li>Nie podawaj danych osobowych ani wrażliwych.</li>
              <li>Pisz życzliwie – wszyscy tu pomagają.</li>
              <li>Wiadomości widzi zespół Hubu.</li>
            </ul>
          </div>
        </aside>
      </div>

      <section id="partnerstwa" aria-labelledby="h-partnerstwa" className="mt-20 scroll-mt-6">
        <SectionTitle id="h-partnerstwa" kicker="Partnerstwa międzysektorowe">
          Giełda partnerstw
        </SectionTitle>
        <PartnerBoard initial={offers} />
      </section>
    </>
  );
}
