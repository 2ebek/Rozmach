import { NextResponse } from "next/server";
import { z } from "zod";
import { AREA_ENUM, parseBody } from "@/lib/api";
import { getRepo } from "@/lib/store";

const Body = z.object({
  kind: z.enum(["szukam", "oferuje"]),
  org: z.string().trim().min(2, "Podaj nazwę instytucji lub podpis.").max(80),
  role: z.enum(["resident", "ngo", "jst", "expert", "admin"]),
  text: z.string().trim().min(10, "Opisz ogłoszenie (min. 10 znaków).").max(600),
  area: z.enum(AREA_ENUM).optional(),
});

export async function GET() {
  return NextResponse.json({ offers: await getRepo().listPartnerOffers() });
}

export async function POST(req: Request) {
  const body = await parseBody(req, Body, "partners");
  if ("error" in body) return body.error;
  const offer = await getRepo().addPartnerOffer(body.data);
  return NextResponse.json({ offer }, { status: 201 });
}
