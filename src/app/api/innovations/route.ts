import { NextResponse } from "next/server";
import { getRepo } from "@/lib/store";

// zawsze aktualne dane – zmiany z panelu administratora widoczne od razu
export const dynamic = "force-dynamic";

/** Publiczne API integracyjne: opublikowane innowacje (np. dla portali gmin, systemu grantowego). */
export async function GET() {
  return NextResponse.json(
    { innovations: await getRepo().listInnovations() },
    { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=60" } },
  );
}
