/**
 * Sesja administratora (prototyp): hasło z ADMIN_DEMO_PASSWORD, w ciasteczku httpOnly trzymamy jego skrót.
 * Działa w middleware (Edge) i w trasach API (Node) – używa wyłącznie Web Crypto.
 * Produkcja: logowanie przez SSO/OIDC urzędu (np. Entra ID) z rolami – ta sama funkcja isAdmin().
 */
export const ADMIN_COOKIE = "hub_admin";

/** Hasło demo, jeśli nie ustawiono zmiennej środowiskowej. Podane na stronie logowania – to prototyp. */
export const DEMO_PASSWORD = "demo";

export function adminPassword(): string {
  return process.env.ADMIN_DEMO_PASSWORD || DEMO_PASSWORD;
}

export async function tokenFor(password: string): Promise<string> {
  const data = new TextEncoder().encode(`hub-admin:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function isAdminToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  return token === (await tokenFor(adminPassword()));
}

/**
 * Sesja eksperta/mentora (prototyp): wspólne hasło z EXPERT_PASSWORD. Ekspert może tylko komentować fiszki
 * (feedback dla autorów) – bez dostępu do panelu administratora. Produkcja: konta ekspertów w SSO z rolą „ekspert”.
 */
export const EXPERT_COOKIE = "hub_expert";
export const DEMO_EXPERT_PASSWORD = "ekspert";

export function expertPassword(): string {
  return process.env.EXPERT_PASSWORD || DEMO_EXPERT_PASSWORD;
}

export async function expertTokenFor(password: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`hub-expert:${password}`));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function isExpertToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  return token === (await expertTokenFor(expertPassword()));
}
