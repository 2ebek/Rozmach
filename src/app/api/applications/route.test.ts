import fs from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { validIwsForm } from "@/lib/iws.fixture";

vi.mock("web-push", () => ({
  default: { generateVAPIDKeys: () => ({ publicKey: "k", privateKey: "p" }), sendNotification: vi.fn() },
}));

const { POST } = await import("./route");
const { GET } = await import("../status/route");
const { getRepo } = await import("@/lib/store");

let ip = 0;
const call = async (body: unknown) => {
  // osobny adres na każde wywołanie – limit zapytań nie wpływa na testy
  const headers = { "Content-Type": "application/json", "x-forwarded-for": `10.0.0.${++ip}` };
  const res = await POST(new Request("http://localhost/api/applications", { method: "POST", headers, body: JSON.stringify(body) }));
  return { status: res.status, json: (await res.json()) as Record<string, unknown> };
};

beforeEach(() => {
  fs.rmSync(process.env.HUB_DATA_FILE!, { force: true });
  (globalThis as { __hubStore?: unknown }).__hubStore = undefined;
});

describe("POST /api/applications – nabór ROPS IWS 2.0", () => {
  it("zapisuje pełny formularz, a treść merytoryczną także jako odpowiedzi", async () => {
    const form = validIwsForm();
    const r = await call({ naborId: "nab-iws", ideaCode: "hub-kino42", form });
    expect(r.status).toBe(201);
    const app = (await getRepo().listApplications()).find((a) => a.code === r.json.code)!;
    expect(app).toMatchObject({ naborId: "nab-iws", ideaCode: "HUB-KINO42", title: form.sections.tytul, answers: form.sections });
    expect(app.form?.applicant.kind).toBe("osoba");
    expect(app.form?.grantAmount).toBe(8000.5);
  });

  it("odrzuca formularz z błędem i wniosek bez formularza", async () => {
    const bad = { ...validIwsForm(), grantAmount: 1 };
    const r = await call({ naborId: "nab-iws", form: bad });
    expect(r.status).toBe(400);
    expect(String(r.json.error)).toMatch(/sumie kosztów/);
    expect((await call({ naborId: "nab-iws", answers: { tytul: "Coś" } })).status).toBe(400);
    expect(await getRepo().listApplications()).toHaveLength(0);
  });

  it("strona statusu wniosku nie ujawnia danych wnioskodawcy", async () => {
    const r = await call({ naborId: "nab-iws", form: validIwsForm() });
    const res = await GET(new Request(`http://localhost/api/status?code=${r.json.code}`, { headers: { "x-forwarded-for": "10.1.0.1" } }));
    const body = JSON.stringify(await res.json());
    expect(res.status).toBe(200);
    expect(body).not.toMatch(/Przykładowa|anna@example\.org|500 000 000/);
  });

  it("zwykłe nabory działają jak wcześniej", async () => {
    const answers = { tytul: "Spiżarnia", problem: "Marnowanie jedzenia", odbiorcy: "Seniorzy", dzialania: "Dyżury", partnerzy: "Gmina", rezultaty: "Liczba osób", budzet: "3000 zł" };
    expect((await call({ naborId: "nab-1", answers })).status).toBe(201);
  });
});
