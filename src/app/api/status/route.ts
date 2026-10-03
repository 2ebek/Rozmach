import { NextResponse } from "next/server";
import { z } from "zod";
import { parseBody } from "@/lib/api";
import { normalizeCode } from "@/lib/code";
import { rateLimited } from "@/lib/rateLimit";
import { getRepo } from "@/lib/store";

/**
 * Publiczny podgląd zgłoszenia po kodzie – bez wewnętrznych identyfikatorów.
 * Kod zna tylko autor, więc zwracamy też treść fiszki (do wczytania w generatorze wniosków).
 */
export async function GET(req: Request) {
  const limited = rateLimited(req, "status");
  if (limited) return limited;
  const code = normalizeCode(new URL(req.url).searchParams.get("code") ?? "");
  const found = code ? await getRepo().findByCode(code) : null;
  if (!found) return NextResponse.json({ error: "Nie znaleźliśmy zgłoszenia o tym kodzie." }, { status: 404 });
  const { item } = found;
  const idea =
    found.kind === "idea"
      ? {
          essence: found.item.essence,
          audience: found.item.audience,
          problem: found.item.problem,
          innovativeness: found.item.innovativeness,
          change: found.item.change,
          vision: found.item.vision,
          category: found.item.category,
        }
      : undefined;
  return NextResponse.json({ kind: found.kind, code: item.code, title: item.title, status: item.status, createdAt: item.createdAt, thread: item.thread, idea });
}

const Reply = z.object({
  code: z.string().min(4).max(20),
  text: z.string().trim().min(2, "Wpisz odpowiedź.").max(1000),
});

/** Odpowiedź autora w wątku zgłoszenia. */
export async function POST(req: Request) {
  const body = await parseBody(req, Reply, "status-reply");
  if ("error" in body) return body.error;
  const ok = await getRepo().addThreadMessage(normalizeCode(body.data.code), { from: "author", text: body.data.text });
  if (!ok) return NextResponse.json({ error: "Nie znaleźliśmy zgłoszenia o tym kodzie." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
