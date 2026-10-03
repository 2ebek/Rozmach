import { NextResponse } from "next/server";
import "./zod-pl";
import { z } from "zod";
import { rateLimited } from "./rateLimit";

/**
 * Wspólna obsługa wejścia API: limit zapytań (opcjonalnie) + walidacja zod.
 * Zwraca dane albo gotową odpowiedź błędu z polskim komunikatem.
 */
export async function parseBody<T extends z.ZodTypeAny>(
  req: Request,
  schema: T,
  bucket?: string,
): Promise<{ data: z.infer<T> } | { error: NextResponse }> {
  if (bucket) {
    const limited = rateLimited(req, bucket);
    if (limited) return { error: limited };
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return { error: NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane." }, { status: 400 }) };
  }
  return { data: parsed.data };
}

/** Kategorie Biblioteki ROPS (patrz ChallengeArea). */
export const AREA_ENUM = [
  "dla-seniorow",
  "dla-dzieci-mlodziezy-i-rodziny",
  "dla-rynku-pracy",
  "dla-osob-o-ograniczonej-mobilnosci",
  "dla-osob-z-niepelnosprawnoscia-sensoryczna",
  "dla-cudzoziemcow",
  "dla-osob-z-niepelnosprawnoscia-intelektualna",
  "dla-osob-w-kryzysie-bezdomnosci",
  "dla-zdrowia-i-medycyny",
] as const;

/**
 * Pola fiszki pomysłu – wspólne dla zgłoszenia publicznego (/api/ideas) i edycji w panelu administratora.
 * Pytania i limity jak w formularzu aplikacyjnym ROPS IWS 2.0 (pkt 1, 3–8), żeby fiszkę dało się przenieść do wniosku.
 */
export const IdeaFields = z.object({
  title: z.string().trim().min(3, "Podaj tytuł innowacji (min. 3 znaki).").max(150),
  essence: z.string().trim().min(10, "Opisz innowację (min. 10 znaków).").max(4000),
  audience: z.string().trim().min(3, "Opisz odbiorców innowacji.").max(3000),
  stage: z.enum(["pomysl", "prototyp", "test", "wdrozenie"]),
  // W formularzu Kreatora kategoria i diagnoza są wymagane; w API opcjonalne (zgodność wsteczna).
  category: z.enum(AREA_ENUM).optional(),
  problem: z.string().trim().max(4000).optional(),
  innovativeness: z.string().trim().max(4000).optional(),
  change: z.string().trim().max(3000).optional(),
  vision: z.string().trim().max(3000).optional(),
  // Pola karty Biblioteki ROPS – uzupełnia redakcja w panelu.
  beneficiaries: z.string().trim().max(800).optional(),
  evidence: z.string().trim().max(1200).optional(),
  authors: z.string().trim().max(200).optional(),
});
