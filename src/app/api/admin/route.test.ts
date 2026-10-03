import fs from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("web-push", () => ({
  default: { generateVAPIDKeys: () => ({ publicKey: "k", privateKey: "p" }), sendNotification: vi.fn() },
}));

// Handler testujemy bezpośrednio; autoryzację (/api/admin → 401 bez sesji) sprawdza middleware.test.ts i E2E.
const { POST } = await import("./route");
const { getRepo } = await import("@/lib/store");

const call = async (body: unknown) => {
  const res = await POST(new Request("http://localhost/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }));
  return { status: res.status, json: (await res.json()) as Record<string, unknown> };
};

const idea = { title: "Sąsiedzka spiżarnia", essence: "Lodówka z jedzeniem do oddania przy świetlicy", audience: "mieszkańcy", stage: "pomysl" };
const answers = {
  tytul: "Spiżarnia przy świetlicy",
  problem: "Marnowanie jedzenia i samotność",
  odbiorcy: "Seniorzy",
  dzialania: "Cotygodniowe dyżury",
  partnerzy: "Gmina",
  rezultaty: "Liczba osób",
  budzet: "3000 zł",
};

beforeEach(() => {
  fs.rmSync(process.env.HUB_DATA_FILE!, { force: true });
  (globalThis as { __hubStore?: unknown }).__hubStore = undefined;
});

describe("POST /api/admin – pomysły", () => {
  it("dodaje pomysł i zwraca jego kod", async () => {
    const r = await call({ action: "add-idea", ...idea });
    expect(r.status).toBe(201);
    expect(r.json.code).toMatch(/^HUB-[A-Z0-9]{6}$/);
    expect((await getRepo().listIdeas()).find((i) => i.code === r.json.code)).toMatchObject(idea);
  });

  it.each([
    [{ ...idea, title: "ab" }, "Podaj tytuł innowacji (min. 3 znaki)."],
    [{ ...idea, essence: "krótko" }, "Opisz innowację (min. 10 znaków)."],
    [{ ...idea, stage: "gotowe" }, undefined],
    [{ ...idea, title: "   " }, "Podaj tytuł innowacji (min. 3 znaki)."],
    [{ ...idea, vision: "x".repeat(3001) }, undefined],
  ])("odrzuca niepoprawne dane pomysłu (%#)", async (body, message) => {
    const before = (await getRepo().listIdeas()).length;
    const r = await call({ action: "add-idea", ...body });
    expect(r.status).toBe(400);
    if (message) expect(r.json.error).toBe(message);
    expect(await getRepo().listIdeas()).toHaveLength(before);
  });

  it("edytuje pomysł", async () => {
    const target = (await getRepo().listIdeas())[0]!;
    const r = await call({ action: "update-idea", id: target.id, ...idea, title: "Nowa nazwa" });
    expect(r.status).toBe(200);
    expect((await getRepo().listIdeas()).find((i) => i.id === target.id)!.title).toBe("Nowa nazwa");
  });

  it("edycja i usunięcie nieistniejącego pomysłu → 404", async () => {
    expect((await call({ action: "update-idea", id: "nie-ma", ...idea })).status).toBe(404);
    expect((await call({ action: "delete-idea", id: "nie-ma" })).status).toBe(404);
  });

  it("usuwa pomysł", async () => {
    const target = (await getRepo().listIdeas())[0]!;
    expect((await call({ action: "delete-idea", id: target.id })).status).toBe(200);
    expect((await getRepo().listIdeas()).some((i) => i.id === target.id)).toBe(false);
  });

  it("puste lub nieznane żądanie → 400", async () => {
    expect((await call({})).status).toBe(400);
    expect((await call({ action: "nie-ma-takiej" })).status).toBe(400);
    expect((await call(null)).status).toBe(400);
  });
});

describe("POST /api/admin – dodawanie wniosków (aplikacji)", () => {
  it("dodaje wniosek powiązany z pomysłem", async () => {
    const r = await call({ action: "add-application", naborId: "nab-1", ideaCode: "hub-kino42", answers });
    expect(r.status).toBe(201);
    expect(r.json.code).toMatch(/^WN-[A-Z0-9]{6}$/);
    const apps = await getRepo().listApplications();
    expect(apps).toEqual([expect.objectContaining({ code: r.json.code, naborId: "nab-1", ideaCode: "HUB-KINO42", title: answers.tytul, status: "zlozony" })]);
  });

  it("administrator może dodać wniosek do zamkniętego naboru", async () => {
    const r = await call({
      action: "add-application",
      naborId: "nab-2",
      answers: { tytul: "Cyfrowy senior", problem: "Brak umiejętności", odbiorcy: "Seniorzy", dostepnosc: "Duża czcionka", budzet: "2000 zł" },
    });
    expect(r.status).toBe(201);
  });

  it("nieznany nabór → 404", async () => {
    expect((await call({ action: "add-application", naborId: "nab-x", answers })).status).toBe(404);
  });

  it("kod nieistniejącego pomysłu → 400", async () => {
    const r = await call({ action: "add-application", naborId: "nab-1", ideaCode: "HUB-ZZZZZZ", answers });
    expect(r.status).toBe(400);
    expect(r.json.error).toBe("Nie ma pomysłu o kodzie HUB-ZZZZZZ.");
  });

  it("brakujące lub puste odpowiedzi → 400 z nazwą pola, nic nie zapisuje", async () => {
    const r = await call({ action: "add-application", naborId: "nab-1", answers: { ...answers, budzet: "  " } });
    expect(r.status).toBe(400);
    expect(r.json.error).toBe("Uzupełnij pole: „Szacunkowy budżet (zł) i główne koszty”.");
    expect((await call({ action: "add-application", naborId: "nab-1", answers: {} })).status).toBe(400);
    expect(await getRepo().listApplications()).toEqual([]);
  });

  it("za długa odpowiedź → 400", async () => {
    const r = await call({ action: "add-application", naborId: "nab-1", answers: { ...answers, tytul: "x".repeat(121) } });
    expect(r.status).toBe(400);
    expect(r.json.error).toBe("Pole „Tytuł projektu” jest za długie.");
  });
});

describe("POST /api/admin – fiszka w formacie karty Biblioteki ROPS", () => {
  const ropsIdea = {
    ...idea,
    category: "dla-seniorow",
    problem: "Seniorzy marnują jedzenie i są samotni",
    beneficiaries: "CUS, kluby seniora",
    evidence: "Pilotaż w jednej świetlicy",
    authors: "Stowarzyszenie (przykład)",
  };

  it("zapisuje kategorię ROPS i pola karty", async () => {
    const r = await call({ action: "add-idea", ...ropsIdea });
    expect(r.status).toBe(201);
    const saved = (await getRepo().listIdeas()).find((i) => i.code === r.json.code);
    expect(saved).toMatchObject({ category: "dla-seniorow", problem: ropsIdea.problem, beneficiaries: ropsIdea.beneficiaries, evidence: ropsIdea.evidence, authors: ropsIdea.authors });
  });

  it("odrzuca kategorię spoza listy ROPS (np. dawny obszar)", async () => {
    expect((await call({ action: "add-idea", ...ropsIdea, category: "samotnosc" })).status).toBe(400);
  });

  it("pola karty są opcjonalne w API (zgodność ze starszymi zgłoszeniami)", async () => {
    expect((await call({ action: "add-idea", ...idea })).status).toBe(201);
  });

  it("edycja z pełnym zestawem pól zmienia kategorię i problem", async () => {
    const created = await call({ action: "add-idea", ...ropsIdea });
    const target = (await getRepo().listIdeas()).find((i) => i.code === created.json.code)!;
    const r = await call({ action: "update-idea", id: target.id, ...ropsIdea, category: "dla-dzieci-mlodziezy-i-rodziny", problem: "Inny problem" });
    expect(r.status).toBe(200);
    expect((await getRepo().listIdeas()).find((i) => i.id === target.id)).toMatchObject({ category: "dla-dzieci-mlodziezy-i-rodziny", problem: "Inny problem", evidence: ropsIdea.evidence });
  });

  it("dodanie innowacji z polami karty ROPS", async () => {
    const r = await call({
      action: "add-innovation",
      title: "Nowa innowacja",
      subtitle: "Krótki opis",
      summary: "Na czym polega rozwiązanie – opis",
      problem: "Jaki problem",
      targetGroup: "Seniorzy",
      areas: ["dla-seniorow"],
      tags: [],
      stage: "wdrozenie",
      ropsUrl: "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-seniorow,nowa",
      published: true,
    });
    expect(r.status).toBe(200);
    expect((await getRepo().listInnovations()).find((i) => i.title === "Nowa innowacja")).toMatchObject({ problem: "Jaki problem", targetGroup: "Seniorzy" });
    expect((await call({ action: "add-innovation", title: "X innowacja", summary: "opis opis opis", areas: ["zmiany-osadnicze"], tags: [], stage: "test", published: true })).status).toBe(400);
  });
});
