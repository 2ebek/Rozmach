import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimited } from "@/lib/rateLimit";
import { getRepo } from "@/lib/store";

const Body = z.object({
  author: z.string().trim().min(2, "Podaj imię lub pseudonim.").max(60),
  role: z.enum(["resident", "ngo", "jst", "expert", "admin"]),
  text: z.string().trim().min(2, "Wpisz wiadomość.").max(1000),
});

export async function GET() {
  return NextResponse.json({ messages: await getRepo().listMessages() });
}

export async function POST(req: Request) {
  const limited = rateLimited(req, "messages");
  if (limited) return limited;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane." }, { status: 400 });
  }
  const message = await getRepo().addMessage(parsed.data);
  return NextResponse.json({ message }, { status: 201 });
}
