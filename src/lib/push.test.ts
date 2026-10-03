import { describe, expect, it, vi } from "vitest";
import { createPushService, ideaPushPayload, type PushSender, type StoredSubscription } from "./push";

const sub = (n: number): StoredSubscription => ({ endpoint: `https://push.example/${n}`, keys: { p256dh: `p256dh-key-${n}`, auth: `auth-${n}xx` } });
const payload = ideaPushPayload({ id: "idea-1", title: "Kino Seniora", audience: "seniorzy" });

describe("ideaPushPayload", () => {
  it("prowadzi do szczegółów pomysłu w aplikacji administratora", () => {
    expect(payload.url).toBe("/admin/app/idea-1");
    expect(payload.title).toBe("Nowy pomysł w Hubie");
    expect(payload.body).toContain("Kino Seniora");
    expect(payload.tag).toBe("idea-idea-1");
  });

  it("koduje identyfikator w adresie i przycina długi opis", () => {
    const p = ideaPushPayload({ id: "a/b", title: "x".repeat(300), audience: "y" });
    expect(p.url).toBe("/admin/app/a%2Fb");
    expect(p.body.length).toBeLessThanOrEqual(160);
  });
});

describe("createPushService", () => {
  it("wysyła do wszystkich subskrypcji i nie dubluje tego samego urządzenia", async () => {
    const send = vi.fn<PushSender>().mockResolvedValue(undefined);
    const svc = createPushService(send);
    await svc.subscribe(sub(1));
    await svc.subscribe(sub(2));
    await svc.subscribe(sub(1)); // ponowna subskrypcja tego samego urządzenia
    const r = await svc.notifyAll(payload);
    expect(r).toEqual({ sent: 2, removed: 0, failed: 0 });
    expect(send).toHaveBeenCalledTimes(2);
    expect(JSON.parse(send.mock.calls[0]![1])).toEqual(payload);
  });

  it("usuwa wygasłe subskrypcje (404/410), a przy innych błędach je zostawia", async () => {
    const send = vi.fn<PushSender>(async (s) => {
      if (s.endpoint.endsWith("/1")) throw { statusCode: 410 };
      if (s.endpoint.endsWith("/2")) throw { statusCode: 404 };
      if (s.endpoint.endsWith("/3")) throw { statusCode: 500 };
    });
    const svc = createPushService(send);
    for (const n of [1, 2, 3, 4]) await svc.subscribe(sub(n));
    const r = await svc.notifyAll(payload);
    expect(r).toEqual({ sent: 1, removed: 2, failed: 1 });
    expect(await svc.count()).toBe(2); // zostały: /3 (błąd chwilowy) i /4
  });

  it("wypisanie urządzenia wyłącza powiadomienia", async () => {
    const send = vi.fn<PushSender>().mockResolvedValue(undefined);
    const svc = createPushService(send);
    await svc.subscribe(sub(1));
    await svc.unsubscribe(sub(1).endpoint);
    expect(await svc.notifyAll(payload)).toEqual({ sent: 0, removed: 0, failed: 0 });
    expect(send).not.toHaveBeenCalled();
  });
});
