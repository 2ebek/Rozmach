import { NextResponse } from "next/server";
import { z } from "zod";
import { aiMatch } from "@/lib/ai/matchmaker";
import { AREA_ENUM, parseBody } from "@/lib/api";
import { createMatcher } from "@/lib/matching";
import { tokenize } from "@/lib/matching/text";
import { getRepo } from "@/lib/store";
import type { NeedSubmission } from "@/lib/types";

// Vercel: dopasowanie przez AI ma limit 30 s – funkcja musi móc trwać dłużej niż domyślnie.
export const maxDuration = 60;

const Body = z.object({
  text: z.string().trim().min(3, "Wpisz co najmniej 3 znaki.").max(2000),
  area: z.enum(AREA_ENUM).optional(),
});

/** Podobne wcześniejsze zgłoszenia (Jaccard na rdzeniach) – "podobne przypadki" z briefu. */
function similarNeeds(text: string, needs: NeedSubmission[], limit = 3) {
  const q = new Set(tokenize(text));
  if (q.size === 0) return [];
  const self = text.trim().toLowerCase();
  return needs
    .filter((n) => n.text.trim().toLowerCase() !== self)
    .map((n) => {
      const t = new Set(tokenize(n.text));
      const shared = [...t].filter((s) => q.has(s)).length;
      return { need: n, sim: shared / (q.size + t.size - shared || 1) };
    })
    .filter((x) => x.sim > 0)
    .sort((a, b) => b.sim - a.sim)
    .slice(0, limit)
    .map(({ need }) => ({ text: need.text, area: need.area, createdAt: need.createdAt }));
}

export async function POST(req: Request) {
  const body = await parseBody(req, Body, "match");
  if ("error" in body) return body.error;
  const { text, area } = body.data;
  const repo = getRepo();

  const innovations = await repo.listInnovations();
  const matcher = createMatcher(innovations);
  const lexical = matcher.match(text, { area, limit: 5 });

  // AI (gdy dostępne) rozumie sens opisu i ma dostęp do aktualnych pomysłów z Hubu;
  // bez niego – dotychczasowy, lokalny TF-IDF (ten sam format odpowiedzi).
  const ai = await aiMatch({
    query: text,
    area,
    innovations,
    ideas: await repo.listIdeas(),
    lexicalRanking: matcher.match(text, { area, limit: innovations.length }).map((r) => r.innovation.id),
  });
  const results = ai
    ? ai.results.map((r) => ({ ...r, matchedTerms: lexical.find((l) => l.innovation.id === r.innovation.id)?.matchedTerms ?? [] }))
    : lexical;

  // Bez wskazanego obszaru przypisujemy obszar najlepszego dopasowania,
  // żeby zgłoszenie zasiliło trendy w panelu admina i żeby pokazać informacje o wyzwaniu.
  const inferred = area ?? (results[0] && results[0].score >= 0.05 ? results[0].innovation.areas[0] : undefined);
  const similar = similarNeeds(text, await repo.listNeeds());
  const challenge = inferred ? (await repo.listChallenges()).find((c) => c.area === inferred) ?? null : null;

  await repo.addNeed({ text, area: inferred, submitterRole: "resident" });

  return NextResponse.json({ results, similar, challenge, area: inferred ?? null, source: ai ? "ai" : "lokalne", ai: ai?.info ?? null });
}
