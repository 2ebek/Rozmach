import fs from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("web-push", () => ({
  default: { generateVAPIDKeys: () => ({ publicKey: "k", privateKey: "p" }), sendNotification: vi.fn() },
}));

const { getRepo } = await import("./store");
const { seedIdeas } = await import("./data/seed");

/** Symulacja restartu serwera: nowy obiekt repozytorium czyta dane z pliku od nowa. */
function restart() {
  (globalThis as { __hubStore?: unknown }).__hubStore = undefined;
  return getRepo();
}

beforeEach(() => {
  fs.rmSync(process.env.HUB_DATA_FILE!, { force: true });
  restart();
});

const fields = { title: "Ogród sensoryczny", essence: "Ogród dla osób z niepełnosprawnościami przy szkole", audience: "uczniowie i seniorzy", stage: "pomysl" as const };

describe("pomysły w repozytorium – dane dynamiczne i trwałe", () => {
  it("startowe pomysły pochodzą z magazynu (seed), a nie z kodu repozytorium", async () => {
    const ideas = await getRepo().listIdeas();
    expect(ideas.map((i) => i.code)).toEqual(seedIdeas().map((i) => i.code));
    expect(fs.existsSync(process.env.HUB_DATA_FILE!)).toBe(true);
  });

  it("nowy pomysł przetrwa restart", async () => {
    const created = await getRepo().addIdea(fields);
    const after = await restart().listIdeas();
    expect(after.find((i) => i.id === created.id)).toMatchObject({ ...fields, status: "nowy", code: created.code });
  });

  it("edycja pomysłu jest trwała i nie rusza statusu, kodu ani rozmowy", async () => {
    const before = (await getRepo().findByCode("HUB-KINO42"))!.item;
    const updated = await getRepo().updateIdea(before.id, { ...fields, title: "Kino Seniora 2.0" });
    expect(updated).toMatchObject({ title: "Kino Seniora 2.0", status: "w-weryfikacji", code: "HUB-KINO42" });
    const after = (await restart().findByCode("HUB-KINO42"))!.item;
    expect(after.title).toBe("Kino Seniora 2.0");
    expect(after.thread).toHaveLength(2);
  });

  it("usunięcie pomysłu jest trwałe; kod przestaje działać na stronie statusu", async () => {
    const idea = (await getRepo().findByCode("HUB-DEMO23"))!.item;
    expect(await getRepo().deleteIdea(idea.id)).toBe(true);
    const repo = restart();
    expect((await repo.listIdeas()).map((i) => i.code)).not.toContain("HUB-DEMO23");
    expect(await repo.findByCode("HUB-DEMO23")).toBeNull();
  });

  it("edycja i usuwanie nieistniejącego pomysłu zwracają brak wyniku", async () => {
    expect(await getRepo().updateIdea("nie-ma", fields)).toBeNull();
    expect(await getRepo().deleteIdea("nie-ma")).toBe(false);
  });

  it("puste dane: po usunięciu wszystkich pomysłów lista pozostaje pusta także po restarcie", async () => {
    for (const i of await getRepo().listIdeas()) await getRepo().deleteIdea(i.id);
    expect(await restart().listIdeas()).toEqual([]);
  });

  it("status, rozmowa i wnioski powiązane z pomysłem są zapisywane trwale", async () => {
    const repo = getRepo();
    const idea = (await repo.findByCode("HUB-DEMO23"))!.item;
    await repo.setIdeaStatus(idea.id, "zaakceptowany");
    await repo.addThreadMessage("HUB-DEMO23", { from: "admin", text: "Akceptujemy" });
    const app = await repo.addApplication({ naborId: "nab-1", ideaCode: "HUB-DEMO23", title: "Wniosek", answers: { tytul: "Wniosek" } });
    await repo.setApplicationStatus(app.id, "w-ocenie");

    const after = restart();
    expect((await after.findByCode("HUB-DEMO23"))!.item).toMatchObject({ status: "zaakceptowany", thread: [{ from: "admin", text: "Akceptujemy" }] });
    expect(await after.listApplications()).toEqual([expect.objectContaining({ code: app.code, ideaCode: "HUB-DEMO23", status: "w-ocenie" })]);
  });
});
