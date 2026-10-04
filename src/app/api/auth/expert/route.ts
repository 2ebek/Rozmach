import { NextResponse } from "next/server";
import "@/lib/zod-pl";
import { z } from "zod";
import { rateLimited } from "@/lib/rateLimit";
import { EXPERT_COOKIE, expertPassword, expertTokenFor } from "@/lib/session";

const Body = z.object({ password: z.string().max(200) });

/** Logowanie eksperta/mentora (dostęp tylko do komentowania fiszek – bez panelu administratora). */
export async function POST(req: Request) {
  const limited = rateLimited(req, "login");
  if (limited) return limited;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success || parsed.data.password !== expertPassword()) {
    return NextResponse.json({ error: "Nieprawidłowe hasło." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(EXPERT_COOKIE, await expertTokenFor(parsed.data.password), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(EXPERT_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
