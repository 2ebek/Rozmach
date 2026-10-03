import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimited } from "@/lib/rateLimit";
import { getAssistant } from "@/lib/ai/assistant";

const Body = z.object({
  kind: z.enum(["develop-idea", "adapt-innovation"]),
  input: z.string().trim().min(5, "Opisz temat (min. 5 znaków).").max(2000),
  context: z.string().trim().max(1000).optional(),
});

export async function POST(req: Request) {
  const limited = rateLimited(req, "assistant");
  if (limited) return limited;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane." }, { status: 400 });
  }
  return NextResponse.json(await getAssistant().run(parsed.data));
}
