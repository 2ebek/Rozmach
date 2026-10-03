import { LoginForm } from "@/components/LoginForm";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/ui";
import { DEMO_PASSWORD } from "@/lib/session";

export const metadata = { title: "Logowanie – Hub Innowacji" };

export default function Page({ searchParams }: { searchParams: { next?: string } }) {
  // tylko ścieżki wewnętrzne – bez przekierowań na zewnętrzne adresy
  const next = typeof searchParams.next === "string" && searchParams.next.startsWith("/") && !searchParams.next.startsWith("//") ? searchParams.next : "/admin";
  const demoHint = !process.env.ADMIN_DEMO_PASSWORD;
  return (
    <>
      <PageHeader eyebrow="Panel administratora" title="Logowanie dla zespołu Hubu" lead="Panel z trendami, moderacją zgłoszeń i edycją wiedzy jest dostępny tylko dla pracowników ROPS." />
      <div className="mx-auto max-w-md">
        <Panel>
          <LoginForm next={next} />
          {demoHint && (
            <p className="mt-6 rounded-lg bg-amber-100 px-4 py-3 text-sm text-amber-950">
              <strong>Prototyp:</strong> hasło demonstracyjne to <code className="rounded bg-white px-1.5 py-0.5 font-bold">{DEMO_PASSWORD}</code>. W
              wersji docelowej – logowanie przez konto urzędowe (SSO).
            </p>
          )}
        </Panel>
      </div>
    </>
  );
}
