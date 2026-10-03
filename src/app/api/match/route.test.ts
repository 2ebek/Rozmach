import fs from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AiMatchInput, AiMatchOutput } from "@/lib/ai/matchmaker";

vi.mock("web-push", () => ({
  default: { generateVAPIDKeys: () => ({ publicKey: "k", privateKey: "p" }), sendNotification: vi.fn() },
}));

// Podmieniamy tylko wywołanie modelu; reszta (katalog, TF-IDF, magazyn) działa naprawdę.
const aiMatch = vi.fn<(input: AiMatchInput) => Promise<AiMatchOutput | null>>();
vi.mock("@/lib/ai/matchmaker", () => ({ aiMatch: (input: AiMatchInput) => aiMatch(input) }));

const { POST } = await import("./route");
const { getRepo } = await import("@/lib/store");
const { createMatcher } = await import("@/lib/matching");

const call = async (body: unknown) => {
  const res = await POST(new Request("http://localhost/api/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }));
  return { status: res.status, json: (await res.json()) as Record<string, any> };
};

beforeEach(() => {
  fs.rmSync(process.env.HUB_DATA_FILE!, { force: true });
  (globalThis as { __hubStore?: unknown }).__hubStore = undefined;
  aiMatch.mockReset();
});

describe("POST /api/match z AI", () => {
  it("AI dostaje opis, katalog i aktualne pomysły z magazynu", async () => {
    aiMatch.mockResolvedValue(null);
    const created = await getRepo().addIdea({ title: "Świeży pomysł", essence: "Zgłoszony przed chwilą pomysł", audience: "seniorzy", stage: "pomysl" });
    await call({ text: "samotni seniorzy", area: "dla-seniorow" });
    const input = aiMatch.mock.calls[0]![0];
    expect(input.query).toBe("samotni seniorzy");
    expect(input.area).toBe("dla-seniorow");
    expect(input.innovations.length).toBeGreaterThan(0);
    expect(input.ideas.map((i) => i.id)).toContain(created.id); // dynamiczne dane, nie zahardkodowane
    // ranking TF-IDF (innowacje z co najmniej jednym wspólnym słowem) – do zawężenia bardzo dużego katalogu
    expect(input.lexicalRanking!.length).toBeGreaterThan(0);
    expect(input.lexicalRanking!.every((id) => input.innovations.some((i) => i.id === id))).toBe(true);
  });

  it("gdy AI odpowiada – wyniki z uzasadnieniem, pomysły i źródło 'ai'", async () => {
    const inn = (await getRepo().listInnovations()).find((i) => i.id === "rops-bawita")!;
    aiMatch.mockResolvedValue({
      results: [{ innovation: inn, score: 0.9, matchedTerms: [], reason: "Codzienne rozmowy telefoniczne." }],
      info: { summary: "Samotność seniorów.", nextStep: "Napisz do Hubu.", ideas: [{ status: "nowy", pending: true }] },
    });
    const r = await call({ text: "tablica dla seniorów z demencją" });
    expect(r.status).toBe(200);
    expect(r.json.source).toBe("ai");
    expect(r.json.results[0]).toMatchObject({ innovation: { id: "rops-bawita" }, reason: "Codzienne rozmowy telefoniczne." });
    expect(r.json.ai).toEqual({ summary: "Samotność seniorów.", nextStep: "Napisz do Hubu.", ideas: [{ status: "nowy", pending: true }] });
  });

  it("bez AI – dokładnie dotychczasowy wynik TF-IDF (wsteczna zgodność)", async () => {
    aiMatch.mockResolvedValue(null);
    const r = await call({ text: "Mieszkańcy nie umieją załatwić sprawy w e-urzędzie" });
    const expected = createMatcher(await getRepo().listInnovations()).match("Mieszkańcy nie umieją załatwić sprawy w e-urzędzie", { limit: 5 });
    expect(r.json.source).toBe("lokalne");
    expect(r.json.ai).toBeNull();
    expect(r.json.results).toEqual(JSON.parse(JSON.stringify(expected)));
    expect(r.json).toHaveProperty("similar");
    expect(r.json).toHaveProperty("challenge");
  });

  it("niepoprawne dane → 400 bez wywołania AI", async () => {
    expect((await call({ text: "a" })).status).toBe(400);
    expect((await call({ text: "seniorzy", area: "nie-ma" })).status).toBe(400);
    expect((await call(null)).status).toBe(400);
    expect(aiMatch).not.toHaveBeenCalled();
  });
});
