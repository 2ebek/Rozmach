import type { HubEvent } from "./types";

/**
 * Automatyzacja powiadomień: każde zdarzenie (nowa fiszka, wniosek, zmiana naboru…) trafia do
 * panelu administratora, a gdy ustawiono NOTIFY_WEBHOOK_URL – także na zewnętrzny webhook
 * (np. Teams/Slack, system grantowy, automat e-mailowy). Błąd webhooka nie blokuje zgłoszenia.
 */
export function sendWebhook(event: HubEvent): void {
  const url = process.env.NOTIFY_WEBHOOK_URL;
  if (!url) return;
  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source: "hub-innowacji", event }),
  }).catch((err: unknown) => {
    console.warn("[notify] webhook nieudany:", err instanceof Error ? err.message : err);
  });
}
