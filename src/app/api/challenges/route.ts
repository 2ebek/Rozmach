import { NextResponse } from "next/server";
import { getRepo } from "@/lib/store";

// zawsze aktualne dane – zmiany z panelu administratora widoczne od razu
export const dynamic = "force-dynamic";

/** Publiczne API integracyjne: wyzwania regionu ze wskaźnikami. */
export async function GET() {
  return NextResponse.json(
    { challenges: await getRepo().listChallenges() },
    { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=60" } },
  );
}
