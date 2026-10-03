import { NextResponse } from "next/server";
import { getRepo } from "@/lib/store";

// zawsze aktualne dane – zmiany z panelu administratora widoczne od razu
export const dynamic = "force-dynamic";

/** Publiczne API integracyjne: nabory i ich status (otwarty/zamknięty). */
export async function GET() {
  return NextResponse.json(
    { nabory: await getRepo().listNabory() },
    { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=60" } },
  );
}
