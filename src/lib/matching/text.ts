/** Normalizacja tekstu polskiego: małe litery, bez ogonków, lekki "stemming" przez obcięcie do prefiksu. */

const STOPWORDS = new Set([
  "i", "w", "z", "na", "do", "o", "u", "a", "to", "nie", "sie", "ze", "jest", "oraz",
  "dla", "po", "przez", "od", "za", "jak", "co", "ale", "lub", "czy", "ktory", "ktora",
  "ktore", "mam", "mamy", "brak", "bardzo", "tez", "juz", "tylko", "nasz", "naszej",
  "nasza", "naszym", "moja", "moj", "jego", "jej", "ich", "tym", "tego", "sa",
]);

const PL_MAP: Record<string, string> = {
  ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z",
};

/** Długość prefiksu: przybliża rdzeń dla fleksji ("seniorzy" ~ "seniora" ~ "seniorom"). */
const STEM_LEN = 5;

export function stripDiacritics(s: string): string {
  return s.toLowerCase().replace(/[ąćęłńóśźż]/g, (c) => PL_MAP[c] ?? c);
}

export interface Token {
  stem: string;
  /** Oryginalne słowo (z ogonkami) – do pokazania użytkownikowi. */
  word: string;
}

export function tokenizeWithWords(text: string): Token[] {
  const words = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  const out: Token[] = [];
  for (const word of words) {
    const plain = stripDiacritics(word);
    if (plain.length <= 2 || STOPWORDS.has(plain)) continue;
    // oboczność ą/ę ("urząd" ~ "urzędu", "ręka" ~ "rąk") – w rdzeniu traktujemy je jednakowo
    const stem = stripDiacritics(word.replace(/[ąę]/g, "a")).slice(0, STEM_LEN);
    out.push({ stem, word });
  }
  return out;
}

export function tokenize(text: string): string[] {
  return tokenizeWithWords(text).map((t) => t.stem);
}
