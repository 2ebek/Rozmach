import { MatchForm } from "@/components/MatchForm";
import { PageHeader } from "@/components/PageHeader";
import { AREAS } from "@/lib/labels";
import type { ChallengeArea } from "@/lib/types";

export const metadata = { title: "Znajdź rozwiązanie – Hub Innowacji" };

export default function Page({ searchParams }: { searchParams: { q?: string | string[]; area?: string | string[] } }) {
  const q = typeof searchParams.q === "string" ? searchParams.q.slice(0, 2000) : "";
  const area = AREAS.find((a) => a === searchParams.area) as ChallengeArea | undefined;
  return (
    <>
      <PageHeader
        eyebrow="Matchmaking społeczny"
        title="Znajdź rozwiązanie swojego problemu"
        lead="Opisz sytuację, a porównamy ją z innowacjami społecznymi z Biblioteki ROPS i pokażemy te, które najlepiej pasują."
      />
      <MatchForm initialQuery={q} initialArea={area} />
    </>
  );
}
