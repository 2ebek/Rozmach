import { InnovationCanvas } from "@/components/InnovationCanvas";
import { PageHeader } from "@/components/PageHeader";

export const metadata = { title: "Canva innowacji – Hub Innowacji" };

export default function Page() {
  return (
    <>
      <PageHeader
        eyebrow="Kreator pomysłów · materiały"
        title="Canva innowacji społecznej"
        lead="Rozpisz pomysł na jednej planszy – od problemu po miary sukcesu. Uproszczona wersja Canwy innowacji społecznych; możesz ją wydrukować albo zapisać jako PDF."
      />
      <InnovationCanvas />
    </>
  );
}
