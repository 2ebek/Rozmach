import { beforeEach, describe, expect, it, vi } from "vitest";

// Prawdziwe wysyłanie zastępujemy atrapą – sprawdzamy, kiedy i z jaką treścią system wysyła push.
const sendNotification = vi.fn().mockResolvedValue(undefined);
vi.mock("web-push", () => ({
  default: {
    generateVAPIDKeys: () => ({ publicKey: "test-public-key", privateKey: "test-private-key" }),
    sendNotification: (...args: unknown[]) => sendNotification(...args),
  },
}));

const { getRepo } = await import("./store");
const { getPush } = await import("./push");

const flush = () => new Promise((r) => setTimeout(r, 0));

describe("powiadomienia o nowych pomysłach", () => {
  beforeEach(() => {
    sendNotification.mockClear();
    getPush().service.subscribe({ endpoint: "https://push.example/admin-phone", keys: { p256dh: "p256dh-test-key", auth: "auth-test" } });
  });

  it("nowa fiszka wysyła push do zapisanych urządzeń administratorów", async () => {
    const idea = await getRepo().addIdea({ title: "Ogród na dachu", essence: "Wspólny ogród na dachu biblioteki", audience: "sąsiedzi", stage: "pomysl" });
    await flush();
    expect(sendNotification).toHaveBeenCalledTimes(1);
    const [subscription, body] = sendNotification.mock.calls[0]!;
    expect((subscription as { endpoint: string }).endpoint).toBe("https://push.example/admin-phone");
    const payload = JSON.parse(body as string) as { url: string; body: string };
    expect(payload.url).toBe(`/admin/app/${idea.id}`);
    expect(payload.body).toContain("Ogród na dachu");
  });

  it("inne zdarzenia (opinia, wiadomość) nie wysyłają pusha", async () => {
    await getRepo().addFeedback({ innovationId: "rops-bawita", rating: 5, comment: "", wantsToTest: false });
    await getRepo().addMessage({ author: "Test", role: "resident", text: "Dzień dobry" });
    await flush();
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it("nowa fiszka trafia też do powiadomień w panelu", async () => {
    await getRepo().addIdea({ title: "Rowerowa biblioteka", essence: "Wypożyczalnia rowerów przy bibliotece", audience: "młodzież", stage: "pomysl" });
    const events = await getRepo().listEvents();
    expect(events[0]).toMatchObject({ kind: "idea", read: false });
    expect(events[0]!.text).toContain("Rowerowa biblioteka");
  });
});
