import webpush from "web-push";
import type { IdeaCard } from "./types";

/**
 * Powiadomienia Web Push dla aplikacji administratora (/admin/app).
 * Subskrypcje trzymamy w pamięci procesu – jak resztę danych prototypu (produkcja: tabela w bazie).
 * Klucze VAPID z env (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY); bez nich generujemy parę przy starcie –
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

export function createPushService(send: PushSender) {
  const subs = new Map<string, StoredSubscription>();
  return {
    subscribe(sub: StoredSubscription) {
      subs.set(sub.endpoint, sub);
    },
    unsubscribe(endpoint: string) {
      subs.delete(endpoint);
    },
    count: () => subs.size,
    async notifyAll(payload: PushPayload): Promise<NotifyResult> {
      const body = JSON.stringify(payload);
      const result: NotifyResult = { sent: 0, removed: 0, failed: 0 };
      await Promise.all(
        [...subs.values()].map(async (sub) => {
          try {
            await send(sub, body);
            result.sent++;
          } catch (err) {
            const status = (err as { statusCode?: number }).statusCode;
            if (status && GONE.has(status)) {
              subs.delete(sub.endpoint);
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
const g = globalThis as unknown as { __hubPush?: { service: PushService; publicKey: string } };

function init() {
  let publicKey = process.env.VAPID_PUBLIC_KEY;
  let privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) ({ publicKey, privateKey } = webpush.generateVAPIDKeys());
  const subject = process.env.VAPID_SUBJECT || "mailto:hub@example.org";
  const sender: PushSender = async (sub, payload) => {
    await webpush.sendNotification(sub, payload, { vapidDetails: { subject, publicKey: publicKey!, privateKey: privateKey! }, TTL: 60 * 60 * 24 });
  };
  return { service: createPushService(sender), publicKey };
}

export function getPush() {
  return (g.__hubPush ??= init());
}

/** Wywoływane przy każdej nowej fiszce – nie blokuje zapisu zgłoszenia. */
export function pushNewIdea(idea: Pick<IdeaCard, "id" | "title" | "audience">): void {
  void getPush()
    .service.notifyAll(ideaPushPayload(idea))
    .catch((err: unknown) => console.warn("[push] błąd:", err));
}
