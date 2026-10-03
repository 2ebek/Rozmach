import { NextResponse } from "next/server";
import { z } from "zod";
import { parseBody } from "@/lib/api";
import { validateAnswers } from "@/lib/applications";
import { normalizeCode } from "@/lib/code";
import { IwsForm } from "@/lib/iws";
import { getRepo } from "@/lib/store";

const Body = z.object({
  naborId: z.string(),
  ideaCode: z.string().max(20).optional(),
  answers: z.record(z.string(), z.string().max(4000)).optional(),
  /** Pełny formularz – tylko dla naborów formType "rops-iws". */
  form: z.unknown().optional(),
});

export async function POST(req: Request) {
  const body = await parseBody(req, Body, "applications");
  if ("error" in body) return body.error;
  const repo = getRepo();
  const nabor = (await repo.listNabory()).find((n) => n.id === body.data.naborId);
  if (!nabor) return NextResponse.json({ error: "Nie ma takiego naboru." }, { status: 404 });
  if (!nabor.open) return NextResponse.json({ error: "Ten nabór jest zamknięty." }, { status: 409 });
  const ideaCode = body.data.ideaCode ? normalizeCode(body.data.ideaCode) : undefined;

  if (nabor.formType === "rops-iws") {
    const parsed = IwsForm.safeParse(body.data.form);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Nieprawidłowy formularz." }, { status: 400 });
    const form = parsed.data;
    // Treść merytoryczna także jako zwykłe odpowiedzi – panel i eksport działają jak dla innych naborów.
    const app = await repo.addApplication({ naborId: nabor.id, ideaCode, title: form.sections.tytul, answers: { ...form.sections }, form });
    return NextResponse.json({ code: app.code }, { status: 201 });
  }

  const checked = validateAnswers(nabor, body.data.answers ?? {});
  if ("error" in checked) return NextResponse.json({ error: checked.error }, { status: 400 });
  const { answers } = checked;

  const app = await repo.addApplication({
    naborId: nabor.id,
    ideaCode,
    title: answers.tytul ?? nabor.title,
    answers,
  });
  return NextResponse.json({ code: app.code }, { status: 201 });
}
