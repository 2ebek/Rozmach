import { AssistantPanel } from "@/components/AssistantPanel";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/ui";

export const metadata = { title: "Middleman Innowacji – Hub Innowacji" };

const STEPS = ["Wskaż innowację", "Opisz swoją instytucję", "Otrzymaj szkic usługi"];

export default function Page({ searchParams }: { searchParams: { innowacja?: string } }) {
  const initial = typeof searchParams.innowacja === "string" ? searchParams.innowacja.slice(0, 200) : "";
  return (
    <>
      <PageHeader
        eyebrow="Middleman Innowacji · dla instytucji"
        title="Zamień sprawdzoną innowację w usługę dla mieszkańców"
        lead="Dla gmin, Centrów Usług Społecznych i organizacji. Asystent podpowie formę usługi, potrzebne zasoby i pierwsze kroki."
      >
        <ol className="mt-6 flex flex-wrap gap-3">
          {STEPS.map((s, i) => (
            <li key={s} className="inline-flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-4 text-sm font-bold text-brand-900 shadow-sm">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-900 text-white">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      </PageHeader>
      <Panel>
        <AssistantPanel
          kind="adapt-innovation"
          inputLabel="Którą innowację chcesz wdrożyć?"
          inputPlaceholder="np. BaWita – tablica terapeutyczna dla seniorów"
          initialInput={initial}
          contextLabel="Twoja instytucja i jej potrzeby"
          contextPlaceholder="np. Gmina wiejska, 8 tys. mieszkańców, dużo osób starszych, mamy świetlice w sołectwach"
          submitLabel="Przygotuj szkic usługi"
        />
      </Panel>
    </>
  );
}
