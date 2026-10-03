import { NextResponse } from "next/server";
import "@/lib/zod-pl";
import { z } from "zod";
import { rateLimited } from "@/lib/rateLimit";
import { getRepo } from "@/lib/store";

const Body = z.object({
  innovationId: z.string().min(1, "Wybierz innowację."),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000),
  wantsToTest: z.boolean(),
});

export async function POST(req: Request) {
  const limited = rateLimited(req, "feedback");
  if (limited) return limited;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane." }, { status: 400 });
  }
  const feedback = await getRepo().addFeedback(parsed.data);
  return NextResponse.json({ feedback }, { status: 201 });
}
