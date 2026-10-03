import { NextResponse } from "next/server";
import "@/lib/zod-pl";
import { z } from "zod";
import { rateLimited } from "@/lib/rateLimit";
import { ADMIN_COOKIE, adminPassword, tokenFor } from "@/lib/session";

const Body = z.object({ password: z.string().max(200) });

export async function POST(req: Request) {
  const limited = rateLimited(req, "login");
  if (limited) return limited;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success || parsed.data.password !== adminPassword()) {
    return NextResponse.json({ error: "Nieprawidłowe hasło." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, await tokenFor(parsed.data.password), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8, // dzień pracy
  });
  return res;
}
