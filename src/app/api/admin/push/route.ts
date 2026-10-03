import { NextResponse } from "next/server";
import { z } from "zod";
import { parseBody } from "@/lib/api";
import { getPush } from "@/lib/push";

// Chronione przez middleware (/api/admin/*) – subskrybować mogą tylko zalogowani administratorzy.
export const dynamic = "force-dynamic";

const Subscription = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(8).max(100) }),
});

/** Klucz publiczny VAPID potrzebny przeglądarce do subskrypcji. */
export async function GET() {
  const { publicKey, service } = await getPush();
  return NextResponse.json({ publicKey, subscriptions: await service.count() });
}

export async function POST(req: Request) {
  const body = await parseBody(req, z.object({ subscription: Subscription }));
  if ("error" in body) return body.error;
  await (await getPush()).service.subscribe(body.data.subscription);
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: Request) {
  const body = await parseBody(req, z.object({ endpoint: z.string().url().max(1000) }));
  if ("error" in body) return body.error;
  await (await getPush()).service.unsubscribe(body.data.endpoint);
  return NextResponse.json({ ok: true });
}
