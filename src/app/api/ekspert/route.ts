import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { parseBody } from "@/lib/api";
import { normalizeCode } from "@/lib/code";
import { EXPERT_COOKIE, isExpertToken } from "@/lib/session";
import { getRepo } from "@/lib/store";

export const dynamic = "force-dynamic";

const Body = z.object({
  code: z.string().min(4).max(20),
  text: z.string().trim().min(2, "Wpisz komentarz.").max(1000),
  name: z.string().trim().min(3, "Podpisz się – np. specjalizacją (Ekspert ds. …).").max(80),
});

/** Komentarz eksperta/mentora do fiszki – trafia do rozmowy z autorem (widoczny na stronie statusu) i do powiadomień Hubu. */
export async function POST(req: Request) {
  if (!(await isExpertToken(cookies().get(EXPERT_COOKIE)?.value))) {
    return NextResponse.json({ error: "Brak uprawnień. Zaloguj się jako ekspert." }, { status: 401 });
  }
  const body = await parseBody(req, Body, "messages");
  if ("error" in body) return body.error;
  const code = normalizeCode(body.data.code);
  const repo = getRepo();
  // eksperci komentują tylko fiszki (wnioski zawierają dane wnioskodawców i ocenia je zespół Hubu)
  if ((await repo.findByCode(code))?.kind !== "idea") return NextResponse.json({ error: "Nie znaleziono fiszki." }, { status: 404 });
  await repo.addThreadMessage(code, { from: "expert", name: body.data.name, text: body.data.text });
  return NextResponse.json({ ok: true }, { status: 201 });
}
