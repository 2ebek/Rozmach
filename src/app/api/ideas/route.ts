import { NextResponse } from "next/server";
import { IdeaFields, parseBody } from "@/lib/api";
import { getRepo } from "@/lib/store";

const Body = IdeaFields;

export async function POST(req: Request) {
  const body = await parseBody(req, Body, "ideas");
  if ("error" in body) return body.error;
  const idea = await getRepo().addIdea(body.data);
  // Autor dostaje tylko kod – nim sprawdza status i odpowiada w wątku.
  return NextResponse.json({ code: idea.code }, { status: 201 });
}
