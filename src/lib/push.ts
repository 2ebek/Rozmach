import webpush from "web-push";
import { sharedDocs, type Docs } from "./db";
import type { IdeaCard } from "./types";

/**
 * Powiadomienia Web Push dla aplikacji administratora (/admin/app).
 * Subskrypcje: w bazie, gdy jest DATABASE_URL (Vercel), inaczej w pamięci procesu.
 * Klucze VAPID z env (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY), z bazy albo generowane przy starcie –
 * aplikacja sama odnawia subskrypcję, gdy klucz się zmieni.
 */

export interface StoredSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface PushPayload {
  title: string;
  body: string;
  /** Adres otwierany po kliknięciu powiadomienia. */
  url: string;
  /** Ten sam tag = powiadomienie zastępuje poprzednie zamiast się dublować. */
  tag: string;
}

/** Wysyła jedną wiadomość; przy błędzie rzuca obiekt z polem statusCode (jak web-push). */
export type PushSender = (sub: StoredSubscription, payload: string) => Promise<void>;

export interface NotifyResult {
  sent: number;
  removed: number;
  failed: number;
}

export function ideaPushPayload(idea: Pick<IdeaCard, "id" | "title" | "audience">): PushPayload {
  return {
    title: "Nowy pomysł w Hubie",
    body: `${idea.title} – dla: ${idea.audience}`.slice(0, 160),
    url: `/admin/app/${encodeURIComponent(idea.id)}`,
    tag: `idea-${idea.id}`,
  };
}

/** Kody, po których subskrypcja jest martwa (użytkownik wyłączył powiadomienia / odinstalował aplikację). */
const GONE = new Set([404, 410]);

/** Gdzie trzymamy subskrypcje: pamięć procesu (lokalnie) albo baza (Vercel – funkcje nie dzielą pamięci). */
export interface SubscriptionStore {
  list(): Promise<StoredSubscription[]>;
  add(sub: StoredSubscription): Promise<void>;
  remove(endpoint: string): Promise<void>;
}

export function memorySubscriptions(): SubscriptionStore {
  const subs = new Map<string, StoredSubscription>();
  return {
    list: async () => [...subs.values()],
    add: async (sub) => void subs.set(sub.endpoint, sub),
    remove: async (endpoint) => void subs.delete(endpoint),
  };
}

function dbSubscriptions(docs: Docs): SubscriptionStore {
  return {
    list: () => docs.all<StoredSubscription>("push"),
    add: (sub) => docs.put("push", sub.endpoint, { endpoint: sub.endpoint, keys: sub.keys }),
    remove: async (endpoint) => void (await docs.del("push", endpoint)),
  };
}

export function createPushService(send: PushSender, store: SubscriptionStore = memorySubscriptions()) {
  return {
    subscribe: (sub: StoredSubscription) => store.add(sub),
    unsubscribe: (endpoint: string) => store.remove(endpoint),
    count: async () => (await store.list()).length,
    async notifyAll(payload: PushPayload): Promise<NotifyResult> {
      const body = JSON.stringify(payload);
      const result: NotifyResult = { sent: 0, removed: 0, failed: 0 };
      await Promise.all(
        (await store.list()).map(async (sub) => {
          try {
            await send(sub, body);
            result.sent++;
          } catch (err) {
            const status = (err as { statusCode?: number }).statusCode;
            if (status && GONE.has(status)) {
              await store.remove(sub.endpoint);
              result.removed++;
            } else {
              result.failed++;
              console.warn("[push] nie udało się wysłać:", status ?? (err instanceof Error ? err.message : err));
            }
          }
        }),
      );
      return result;
    },
  };
}

export type PushService = ReturnType<typeof createPushService>;

// Singleton przeżywający hot-reload w dev (jak repozytorium danych).
const g = globalThis as unknown as { __hubPush?: Promise<{ service: PushService; publicKey: string }> };

/**
 * Klucze VAPID: z env; bez nich – w bazie (pierwsza instancja generuje parę, pozostałe ją czytają, żeby subskrypcje
 * działały na wszystkich instancjach serverless); lokalnie bez bazy – nowa para przy starcie.
 */
async function vapidKeys(docs: Docs | null): Promise<{ publicKey: string; privateKey: string }> {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (publicKey && privateKey) return { publicKey, privateKey };
  if (!docs) return webpush.generateVAPIDKeys();
  await docs.insertNew("meta", "vapid", webpush.generateVAPIDKeys());
  return (await docs.get<{ publicKey: string; privateKey: string }>("meta", "vapid"))!;
}

async function init() {
  const docs = sharedDocs();
  const { publicKey, privateKey } = await vapidKeys(docs);
  const subject = process.env.VAPID_SUBJECT || "mailto:hub@example.org";
  const sender: PushSender = async (sub, payload) => {
    await webpush.sendNotification(sub, payload, { vapidDetails: { subject, publicKey, privateKey }, TTL: 60 * 60 * 24 });
  };
  return { service: createPushService(sender, docs ? dbSubscriptions(docs) : memorySubscriptions()), publicKey };
}

export function getPush() {
  return (g.__hubPush ??= init().catch((err) => {
    g.__hubPush = undefined;
    throw err;
  }));
}

/** Wywoływane przy każdej nowej fiszce; błąd push nie przerywa zapisu zgłoszenia. */
export async function pushNewIdea(idea: Pick<IdeaCard, "id" | "title" | "audience">): Promise<void> {
  try {
    await (await getPush()).service.notifyAll(ideaPushPayload(idea));
  } catch (err) {
    console.warn("[push] błąd:", err);
  }
}
