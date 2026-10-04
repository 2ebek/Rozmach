import fs from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("web-push", () => ({
  default: { generateVAPIDKeys: () => ({ publicKey: "k", privateKey: "p" }), sendNotification: vi.fn() },
}));

// Ciasteczko sesji eksperta podstawiamy przez atrapę next/headers.
let cookie: string | undefined;
vi.mock("next/headers", () => ({ cookies: () => ({ get: () => (cookie ? { value: cookie } : undefined) }) }));

const { POST } = await import("./route");
const { getRepo } = await import("@/lib/store");
const { expertTokenFor, expertPassword } = await import("@/lib/session");

const call = async (body: unknown) => {
  const res = await POST(new Request("http://localhost/api/ekspert", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }));
  return { status: res.status, json: (await res.json()) as { error?: string } };
};

beforeEach(() => {
  fs.rmSync(process.env.HUB_DATA_FILE!, { force: true });
  (globalThis as { __hubStore?: unknown }).__hubStore = undefined;
  cookie = undefined;
});

describe("komentarze ekspertów do fiszek", () => {
  it("bez zalogowania jako ekspert → 401", async () => {
    expect((await call({ code: "HUB-KINO42", text: "Dobry pomysł", name: "Mentor ds. seniorów" })).status).toBe(401);
    cookie = "zly-token";
    expect((await call({ code: "HUB-KINO42", text: "Dobry pomysł", name: "Mentor ds. seniorów" })).status).toBe(401);
  });

  it("ekspert dodaje podpisany komentarz – trafia do rozmowy i do powiadomień Hubu", async () => {
    cookie = await expertTokenFor(expertPassword());
    const r = await call({ code: "hub-kino42", text: "Zaproście do współpracy UTW.", name: "Mentor ds. seniorów" });
    expect(r.status).toBe(201);
    const idea = (await getRepo().findByCode("HUB-KINO42"))!.item;
    expect(idea.thread.at(-1)).toMatchObject({ from: "expert", name: "Mentor ds. seniorów", text: "Zaproście do współpracy UTW." });
    expect((await getRepo().listEvents())[0]).toMatchObject({ kind: "reply", text: expect.stringContaining("Ekspert (Mentor ds. seniorów)") });
  });

  it("wymaga podpisu, nie pozwala komentować wniosków ani nieistniejących kodów", async () => {
    cookie = await expertTokenFor(expertPassword());
    expect((await call({ code: "HUB-KINO42", text: "Komentarz", name: "" })).json.error).toMatch(/Podpisz się/);
    expect((await call({ code: "HUB-NIEMA0", text: "Komentarz", name: "Mentor" })).status).toBe(404);
    const app = await getRepo().addApplication({ naborId: "nab-1", title: "Wniosek", answers: {} });
    expect((await call({ code: app.code, text: "Komentarz", name: "Mentor" })).status).toBe(404);
  });
});
