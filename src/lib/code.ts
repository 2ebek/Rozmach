// Bez znaków łatwych do pomylenia (0/O, 1/I/L) – kod przepisują też seniorzy.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Kod zgłoszenia, np. "HUB-7KQ4M2". Zastępuje konto użytkownika i dane kontaktowe. */
export function newCode(prefix = "HUB"): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return `${prefix}-${Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("")}`;
}

export function normalizeCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}
