import { cookies } from "next/headers";
import { ExpertBoard } from "@/components/ExpertBoard";
import { ExpertLogout } from "@/components/ExpertLogout";
import { LoginForm } from "@/components/LoginForm";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/ui";
import { DEMO_EXPERT_PASSWORD, EXPERT_COOKIE, isExpertToken } from "@/lib/session";
import { getRepo } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dla ekspertów – Hub Innowacji" };

/** Panel ekspertów i mentorów: szybki feedback dla autorów fiszek (widoczny dla autora na stronie statusu). */
export default async function Page() {
  const isExpert = await isExpertToken(cookies().get(EXPERT_COOKIE)?.value);
  const demoHint = !process.env.EXPERT_PASSWORD;

  if (!isExpert) {
    return (
      <>
        <PageHeader
          eyebrow="Dla ekspertów i mentorów"
          title="Pomóż autorom dopracować pomysły"
          lead="Eksperci Hubu komentują fiszki pomysłów: co poprawić, kogo zaprosić do współpracy, na co uważać. Autor widzi komentarz na stronie statusu, a zespół Hubu dostaje powiadomienie."
        />
        <div className="mx-auto max-w-md">
          <Panel>
            <LoginForm next="/ekspert" endpoint="/api/auth/expert" label="Hasło dla ekspertów" />
            {demoHint && (
              <p className="mt-6 rounded-lg bg-amber-100 px-4 py-3 text-sm text-amber-950">
                <strong>Prototyp:</strong> hasło demonstracyjne to <code className="rounded bg-white px-1.5 py-0.5 font-bold">{DEMO_EXPERT_PASSWORD}</code>. W
                wersji docelowej – osobne konta ekspertów z sieci mentorów ROPS.
              </p>
            )}
          </Panel>
        </div>
      </>
    );
  }

  // Odrzucone fiszki pomijamy – zespół Hubu już podjął decyzję i ją uzasadnił.
  const ideas = (await getRepo().listIdeas()).filter((i) => i.status !== "odrzucony").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <PageHeader
        eyebrow="Panel eksperta"
        title="Fiszki do konsultacji"
        lead="Napisz autorowi krótki, konkretny feedback. Komentarz trafi do rozmowy przy fiszce – autor zobaczy go po kodzie zgłoszenia, a zespół Hubu dostanie powiadomienie. Decyzje o statusie podejmuje zespół Hubu."
      >
        <div className="mt-5">
          <ExpertLogout />
        </div>
      </PageHeader>
      <ExpertBoard ideas={ideas} />
    </>
  );
}
