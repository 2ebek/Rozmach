import { FeedbackForm } from "@/components/FeedbackForm";
import { Icon, type IconName } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { getRepo } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tester innowacji – Hub Innowacji" };

const WHY: { icon: IconName; title: string; text: string }[] = [
  { icon: "check", title: "Lepsze rozwiązania", text: "Twoja opinia trafia do autorów i pomaga poprawić innowację, zanim trafi do innych gmin." },
  { icon: "users", title: "Głos mieszkańców", text: "Testujemy z ludźmi, dla których rozwiązanie powstaje – nie tylko z ekspertami." },
  { icon: "chart", title: "Dowód, że działa", text: "Wyniki testów pomagają samorządom zdecydować o wdrożeniu." },
];

export default async function Page() {
  const innovations = (await getRepo().listInnovations()).filter((i) => i.stage !== "pomysl");
  return (
    <>
      <PageHeader
        eyebrow="Tester innowacji"
        title="Oceń rozwiązanie albo pomóż je przetestować"
        lead="Znasz którąś z innowacji z naszej Biblioteki? Powiedz, co o niej myślisz. Szukamy też osób chętnych do testów."
      />
      <div className="grid gap-10 lg:grid-cols-[1fr_19rem]">
        <FeedbackForm innovations={innovations} />
        <aside aria-labelledby="h-why" className="space-y-4">
          <h2 id="h-why" className="text-lg font-black">
            Po co testować?
          </h2>
          {WHY.map((w) => (
            <div key={w.title} className="flex gap-4 rounded-2xl border border-slate-200 p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <Icon name={w.icon} className="h-5 w-5" />
              </span>
              <div>
                <p className="font-bold text-brand-900">{w.title}</p>
                <p className="mt-0.5 text-[0.95rem] text-slate-700">{w.text}</p>
              </div>
            </div>
          ))}
        </aside>
      </div>
    </>
  );
}
