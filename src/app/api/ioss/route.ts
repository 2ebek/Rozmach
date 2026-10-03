import { NextResponse } from "next/server";
import { AREA_ENUM } from "@/lib/api";
import { IOSS_URL, getIossUnit, localFacts } from "@/lib/ioss";
import type { ChallengeArea } from "@/lib/types";

/**
 * Wskaźniki z Obserwatora Statystyk Społecznych ROPS dla gminy lub powiatu – do diagnozy problemu w fiszce.
 * GET /api/ioss?unit=g-bochenski-drwinia&area=dla-seniorow
 */
export function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const unit = getIossUnit(params.get("unit") ?? "");
  if (!unit) return NextResponse.json({ error: "Wybierz gminę lub powiat z listy." }, { status: 400 });
  const area = (AREA_ENUM as readonly string[]).includes(params.get("area") ?? "") ? (params.get("area") as ChallengeArea) : undefined;
  return NextResponse.json(
    { unit, source: IOSS_URL, facts: localFacts(unit.id, area) },
    { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=3600" } },
  );
}
