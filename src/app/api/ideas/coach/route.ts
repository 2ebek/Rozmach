import { NextResponse } from "next/server";
import { z } from "zod";
import { AREA_ENUM, parseBody } from "@/lib/api";
import { COACH_SECTIONS, coachIdea } from "@/lib/ai/ideaCoach";
import { getIossUnit, localFacts, unitLabel } from "@/lib/ioss";
import { IWS_SECTIONS } from "@/lib/iws";
import { getRepo } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Szkic fiszki do oceny przez asystenta – tylko treść merytoryczna (bez autorów), limity jak w formularzu IWS 2.0. */
const Body = z
  .object({
    category: z.enum(AREA_ENUM).optional(),
    stage: z.enum(["pomysl", "prototyp", "test", "wdrozenie"]).optional(),
    sections: z.object(
      Object.fromEntries(COACH_SECTIONS.map((id) => [id, z.string().max(IWS_SECTIONS.find((s) => s.id === id)!.max).optional()])) as Record<
        (typeof COACH_SECTIONS)[number],
        z.ZodOptional<z.ZodString>
      >,
    ),
    /** Id gminy lub powiatu z IOSS – serwer dołącza prawdziwe wskaźniki do diagnozy. */
    place: z.string().max(80).optional(),
  })
  .refine((b) => Object.values(b.sections).join("").trim().length >= 10, "Napisz choć kilka zdań o pomyśle – asystent potrzebuje punktu wyjścia.");

/** Asystent fiszki pomysłu: ocena punktów IWS 2.0, propozycje treści i podobne innowacje z Biblioteki ROPS. */
export async function POST(req: Request) {
  const body = await parseBody(req, Body, "assistant");
  if ("error" in body) return body.error;
  const innovations = await getRepo().listInnovations();
  const { place, ...draft } = body.data;
  const unit = place ? getIossUnit(place) : undefined;
  const facts = unit ? localFacts(unit.id, draft.category).map((f) => f.sentence) : [];
  return NextResponse.json(await coachIdea({ ...draft, place: unit && unitLabel(unit), facts }, innovations));
}
