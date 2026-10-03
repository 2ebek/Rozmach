import { NextResponse } from "next/server";
import { z } from "zod";
import { AREA_ENUM, IdeaFields, parseBody } from "@/lib/api";
import { validateAnswers } from "@/lib/applications";
import { normalizeCode } from "@/lib/code";
import { getRepo } from "@/lib/store";

/**
 * Jedno API akcji administratora (chronione przez middleware: /api/admin/*).
 * Akcje: status fiszki/wniosku, odpowiedź w wątku, edycja wiedzy, otwieranie naborów, powiadomienia,
 * zarządzanie pomysłami (dodaj/edytuj/usuń) i dodawanie wniosków.
 */
const Action = z.discriminatedUnion("action", [
  z.object({ action: z.literal("idea-status"), id: z.string(), status: z.enum(["nowy", "w-weryfikacji", "zaakceptowany", "odrzucony"]) }),
  z.object({ action: z.literal("application-status"), id: z.string(), status: z.enum(["zlozony", "w-ocenie", "przyjety", "odrzucony"]) }),
  z.object({ action: z.literal("reply"), code: z.string(), text: z.string().trim().min(2, "Wpisz odpowiedź.").max(1000) }),
  // komentarz zespołu do fiszki – widoczny dla autora na stronie statusu; pusty tekst usuwa komentarz
  z.object({ action: z.literal("idea-comment"), id: z.string().min(1), comment: z.string().trim().max(1000, "Komentarz może mieć najwyżej 1000 znaków.") }),
  z.object({
    action: z.literal("add-innovation"),
    title: z.string().trim().min(3, "Podaj tytuł innowacji.").max(120),
    summary: z.string().trim().min(10, "Opisz, na czym polega rozwiązanie (min. 10 znaków).").max(1500),
    areas: z.array(z.enum(AREA_ENUM)).min(1, "Wybierz co najmniej jedną kategorię ROPS."),
    tags: z.array(z.string().trim().min(2).max(40)).max(12),
    stage: z.enum(["pomysl", "prototyp", "test", "wdrozenie"]),
    videoUrl: z.string().url("Podaj poprawny adres filmu.").optional(),
    published: z.boolean(),
    // pola karty Biblioteki ROPS (opcjonalne)
    subtitle: z.string().trim().max(300).optional(),
    problem: z.string().trim().max(1500).optional(),
    targetGroup: z.string().trim().max(800).optional(),
    beneficiaries: z.string().trim().max(800).optional(),
    evidence: z.string().trim().max(1500).optional(),
    project: z.string().trim().max(200).optional(),
    ropsUrl: z.string().url("Podaj poprawny adres karty w Bibliotece ROPS.").optional(),
    materialsUrl: z.string().url("Podaj poprawny adres materiałów.").optional(),
  }),
  z.object({ action: z.literal("publish"), id: z.string(), published: z.boolean() }),
  z.object({ action: z.literal("nabor-open"), id: z.string(), open: z.boolean() }),
  z.object({ action: z.literal("events-read") }),
  IdeaFields.extend({ action: z.literal("add-idea") }),
  IdeaFields.extend({ action: z.literal("update-idea"), id: z.string().min(1) }),
  z.object({ action: z.literal("delete-idea"), id: z.string().min(1) }),
  z.object({
    action: z.literal("add-application"),
    naborId: z.string().min(1, "Wybierz nabór."),
    ideaCode: z.string().max(20).optional(),
    answers: z.record(z.string(), z.string().max(4000)),
  }),
]);

export async function POST(req: Request) {
  const body = await parseBody(req, Action);
  if ("error" in body) return body.error;
  const repo = getRepo();
  const a = body.data;

  switch (a.action) {
    case "idea-status":
      await repo.setIdeaStatus(a.id, a.status);
      break;
    case "idea-comment":
      if (!(await repo.setIdeaComment(a.id, a.comment))) return NextResponse.json({ error: "Nie znaleziono pomysłu." }, { status: 404 });
      break;
    case "application-status":
      await repo.setApplicationStatus(a.id, a.status);
      break;
    case "reply":
      if (!(await repo.addThreadMessage(normalizeCode(a.code), { from: "admin", text: a.text }))) {
        return NextResponse.json({ error: "Nie znaleziono zgłoszenia." }, { status: 404 });
      }
      break;
    case "add-innovation": {
      const { action: _action, ...inn } = a;
      await repo.addInnovation(inn);
      break;
    }
    case "publish":
      await repo.setInnovationPublished(a.id, a.published);
      break;
    case "nabor-open":
      await repo.setNaborOpen(a.id, a.open);
      break;
    case "events-read":
      await repo.markEventsRead();
      break;
    case "add-idea": {
      const { action: _action, ...fields } = a;
      const idea = await repo.addIdea(fields);
      return NextResponse.json({ ok: true, id: idea.id, code: idea.code }, { status: 201 });
    }
    case "update-idea": {
      const { action: _action, id, ...fields } = a;
      if (!(await repo.updateIdea(id, fields))) return NextResponse.json({ error: "Nie znaleziono pomysłu." }, { status: 404 });
      break;
    }
    case "delete-idea":
      if (!(await repo.deleteIdea(a.id))) return NextResponse.json({ error: "Nie znaleziono pomysłu." }, { status: 404 });
      break;
    case "add-application": {
      const nabor = (await repo.listNabory()).find((n) => n.id === a.naborId);
      if (!nabor) return NextResponse.json({ error: "Nie ma takiego naboru." }, { status: 404 });
      // Relacja wniosek → pomysł: jeśli podano kod fiszki, musi istnieć.
      const ideaCode = a.ideaCode ? normalizeCode(a.ideaCode) : undefined;
      if (ideaCode && (await repo.findByCode(ideaCode))?.kind !== "idea") {
        return NextResponse.json({ error: "Nie ma pomysłu o kodzie " + ideaCode + "." }, { status: 400 });
      }
      const checked = validateAnswers(nabor, a.answers);
      if ("error" in checked) return NextResponse.json({ error: checked.error }, { status: 400 });
      // Administrator może dodać wniosek także do zamkniętego naboru (np. wniosek złożony na papierze w terminie).
      const app = await repo.addApplication({ naborId: nabor.id, ideaCode, title: checked.answers.tytul ?? nabor.title, answers: checked.answers });
      return NextResponse.json({ ok: true, id: app.id, code: app.code }, { status: 201 });
    }
  }
  return NextResponse.json({ ok: true });
}
