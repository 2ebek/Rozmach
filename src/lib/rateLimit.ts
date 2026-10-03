import { NextResponse } from "next/server";

/**
 * Prosty limit zapytań na adres IP (okno przesuwne, pamięć procesu) – ochrona formularzy przed spamem.
 * Produkcja: limit na poziomie bramy/WAF albo w Redis, wspólny dla wszystkich instancji.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;
const hits = new Map<string, number[]>();

export function rateLimited(req: Request, bucket: string): NextResponse | null {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (recent.length > MAX_PER_WINDOW) {
    return NextResponse.json({ error: "Zbyt wiele zgłoszeń w krótkim czasie. Spróbuj za minutę." }, { status: 429 });
  }
  return null;
}
