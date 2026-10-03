import type { Role } from "./types";

/** Macierz uprawnień – jedno miejsce prawdy. Prototyp: rola z nagłówka/ciasteczka; produkcja: OIDC/SSO. */
export type Permission =
  | "match:use"
  | "idea:submit"
  | "test:join"
  | "chat:use"
  | "admin:view-trends"
  | "admin:moderate";

const PERMISSIONS: Record<Role, Permission[]> = {
  resident: ["match:use", "idea:submit", "test:join", "chat:use"],
  ngo: ["match:use", "idea:submit", "test:join", "chat:use"],
  jst: ["match:use", "idea:submit", "chat:use"],
  expert: ["match:use", "chat:use"],
  admin: ["match:use", "idea:submit", "test:join", "chat:use", "admin:view-trends", "admin:moderate"],
};

export function can(role: Role, perm: Permission): boolean {
  return PERMISSIONS[role].includes(perm);
}
