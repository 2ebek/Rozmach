import { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDocs, type Sql } from "./db";
import { createPostgresRepo } from "./store-pg";

// Push przy nowej fiszce – atrapa (bez sieci).
vi.mock("web-push", () => ({
  default: { generateVAPIDKeys: () => ({ publicKey: "pub", privateKey: "priv" }), sendNotification: vi.fn() },
}));

/** Prawdziwy Postgres w procesie (PGlite) – ten sam SQL co Neon na Vercelu. */
async function freshRepo() {
  const db = new PGlite();
  const sql: Sql = async (text, params = []) => (await db.query<Record<string, unknown>>(text, params)).rows;
  const docs = createDocs(sql);
  return { repo: createPostgresRepo(docs), docs, sql, db };
}

const idea = { title: "Kino Seniora", essence: "Pokazy filmów w szkolnej auli", audience: "samotni seniorzy", stage: "pomysl" as const, category: "dla-seniorow" as const };

describe("repozytorium w Postgresie (Vercel + Neon)", () => {
  let ctx: Awaited<ReturnType<typeof freshRepo>>;
  beforeEach(async () => {
    ctx = await freshRepo();
  });

  it("pusta baza: tworzy tabelę i raz wstawia dane demonstracyjne", async () => {
    const { repo, docs } = ctx;
    const [ideas, needs, messages] = await Promise.all([repo.listIdeas(), repo.listNeeds(), repo.listMessages()]);
    expect(ideas.map((i) => i.code)).toContain("HUB-KINO42");
    expect(needs.length).toBe(5);
    expect(messages.length).toBe(4);
    // druga instancja (inna funkcja serverless) na tej samej bazie nie dubluje danych
    const second = createPostgresRepo(docs);
    expect((await second.listNeeds()).length).toBe(5);
  });

  it("fiszka: zapis, kod, status, edycja, rozmowa i usunięcie – widoczne dla innej instancji", async () => {
    const { repo, docs } = ctx;
    const other = createPostgresRepo(docs);
    const rec = await repo.addIdea(idea);
    expect(rec.code).toMatch(/^HUB-/);
    expect((await other.findByCode(rec.code))?.item).toMatchObject({ title: "Kino Seniora", status: "nowy" });

    await other.setIdeaStatus(rec.id, "zaakceptowany");
    const updated = await repo.updateIdea(rec.id, { ...idea, title: "Szkolne Kino Seniora", problem: "Seniorzy rzadko wychodzą z domu" });
    expect(updated).toMatchObject({ title: "Szkolne Kino Seniora", status: "zaakceptowany", code: rec.code });

    expect(await repo.addThreadMessage(rec.code, { from: "admin", text: "Gratulacje!" })).toBe(true);
    expect(await other.addThreadMessage(rec.code, { from: "author", text: "Dziękujemy" })).toBe(true);
    const found = await repo.findByCode(rec.code);
    expect(found?.item.thread.map((m) => m.text)).toEqual(["Gratulacje!", "Dziękujemy"]);
    const [reply] = await repo.listEvents();
    expect(reply).toMatchObject({ kind: "reply", href: "/admin?kolejka=zaakceptowany#kolejka", read: false });

    expect(await repo.setIdeaComment(rec.id, " Brakuje diagnozy. ")).toBe(true);
    expect((await other.findByCode(rec.code))?.item).toMatchObject({ adminComment: "Brakuje diagnozy.", status: "zaakceptowany" });
    expect(await repo.setIdeaComment(rec.id, "")).toBe(true);
    expect((await other.findByCode(rec.code))?.item).not.toHaveProperty("adminComment");
    expect(await repo.setIdeaComment("nie-ma", "x")).toBe(false);

    expect(await repo.addThreadMessage("HUB-NIEMA0", { from: "author", text: "x" })).toBe(false);
    expect(await repo.deleteIdea(rec.id)).toBe(true);
    expect(await other.findByCode(rec.code)).toBeNull();
    expect(await repo.deleteIdea(rec.id)).toBe(false);
    expect(await repo.updateIdea(rec.id, idea)).toBeNull();
  });

  it("wnioski, nabory i powiadomienia", async () => {
    const { repo } = ctx;
    await repo.setNaborOpen("nab-iws", false);
    expect((await repo.listNabory()).find((n) => n.id === "nab-iws")?.open).toBe(false);
    await repo.setNaborOpen("nab-iws", true);
    expect((await repo.listNabory()).find((n) => n.id === "nab-iws")?.open).toBe(true);

    const app = await repo.addApplication({ naborId: "nab-iws", title: "Wniosek testowy", answers: { tytul: "x" } });
    expect(app.code).toMatch(/^WN-/);
    await repo.setApplicationStatus(app.id, "przyjety");
    expect((await repo.listApplications())[0]).toMatchObject({ status: "przyjety", answers: { tytul: "x" } });
    expect((await repo.findByCode(app.code))?.kind).toBe("application");

    const events = await repo.listEvents();
    expect(events[0]).toMatchObject({ kind: "application" }); // najnowsze pierwsze
    await repo.markEventsRead();
    expect((await repo.listEvents()).every((e) => e.read)).toBe(true);
  });

  it("Biblioteka: dodana innowacja i ukrywanie innowacji ROPS", async () => {
    const { repo } = ctx;
    const before = (await repo.listInnovations()).length;
    await repo.setInnovationPublished("rops-bawita", false);
    expect((await repo.listInnovations()).some((i) => i.id === "rops-bawita")).toBe(false);
    expect((await repo.listInnovations({ includeHidden: true })).find((i) => i.id === "rops-bawita")?.published).toBe(false);

    const inn = await repo.addInnovation({ title: "Rowerownia", summary: "Naprawa rowerów z młodzieżą", areas: ["dla-rynku-pracy"], tags: [], stage: "test", published: false });
    expect((await repo.listInnovations()).length).toBe(before - 1);
    await repo.setInnovationPublished(inn.id, true);
    expect((await repo.listInnovations()).some((i) => i.title === "Rowerownia")).toBe(true);
  });

  it("opinie, forum i giełda partnerstw", async () => {
    const { repo } = ctx;
    await repo.addFeedback({ innovationId: "rops-bawita", rating: 4, comment: "Dobre", wantsToTest: true });
    await repo.addMessage({ author: "Ola", role: "resident", text: "Cześć" });
    await repo.addPartnerOffer({ kind: "szukam", org: "Gmina", role: "jst", text: "Szukamy partnera do świetlicy" });
    expect((await repo.listFeedback()).at(-1)).toMatchObject({ rating: 4, wantsToTest: true });
    expect((await repo.listMessages()).at(-1)?.text).toBe("Cześć");
    expect((await repo.listPartnerOffers()).at(-1)?.org).toBe("Gmina");
    expect((await repo.listEvents())[0]?.kind).toBe("partner");
  });
});
