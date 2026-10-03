import type { ChallengeArea, Innovation, MatchResult } from "../types";
import { tokenize, tokenizeWithWords } from "./text";

/**
 * Matchmaking społeczny: TF-IDF + podobieństwo cosinusowe, z premią za zgodność obszaru i tagów.
 * Działa lokalnie, bez klucza API – deterministycznie i wyjaśnialnie (zwraca dopasowane słowa).
 * Interfejs `Matcher` pozwala podmienić implementację na wektorową (embeddings) bez zmian w UI.
 */
export interface Matcher {
  match(query: string, opts?: { area?: ChallengeArea; limit?: number }): MatchResult[];
}

const TAG_BOOST = 2;
const AREA_BOOST = 0.15;
const COVERAGE_FLOOR = 0.3;

function docTokens(inn: Innovation): string[] {
  const tagTokens = inn.tags.flatMap((t) => tokenize(t));
  // tagi liczone wielokrotnie = wyższa waga
  return [
    ...tokenize(inn.title),
    ...tokenize(inn.subtitle ?? ""),
    ...tokenize(inn.summary),
    // pola karty ROPS – tu najczęściej jest opisany problem i odbiorcy
    ...tokenize(inn.problem ?? ""),
    ...tokenize(inn.targetGroup ?? ""),
    ...tokenize(inn.beneficiaries ?? ""),
    ...Array.from({ length: TAG_BOOST }, () => tagTokens).flat(),
  ];
}

function termFreq(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  return tf;
}

export function createMatcher(corpus: Innovation[]): Matcher {
  const docs = corpus.map((inn) => ({ inn, tf: termFreq(docTokens(inn)) }));
  const df = new Map<string, number>();
  for (const { tf } of docs) for (const term of tf.keys()) df.set(term, (df.get(term) ?? 0) + 1);

  const idf = (term: string) => Math.log(1 + docs.length / (1 + (df.get(term) ?? 0)));
  const weigh = (tf: Map<string, number>) => {
    const w = new Map<string, number>();
    for (const [term, f] of tf) w.set(term, f * idf(term));
    return w;
  };
  const norm = (w: Map<string, number>) => Math.sqrt([...w.values()].reduce((s, v) => s + v * v, 0));

  const weighted = docs.map((d) => {
    const w = weigh(d.tf);
    return { ...d, w, n: norm(w) };
  });

  return {
    match(query, opts = {}) {
      const { area, limit = 5 } = opts;
      const qTokens = tokenizeWithWords(query);
      // rdzeń -> pierwsze oryginalne słowo z zapytania (pokazujemy słowa użytkownika, nie rdzenie)
      const wordOf = new Map<string, string>();
      for (const t of qTokens) if (!wordOf.has(t.stem)) wordOf.set(t.stem, t.word);
      const qw = weigh(termFreq(qTokens.map((t) => t.stem)));
      const qn = norm(qw);
      if (qn === 0) return [];
      const qTotal = [...qw.values()].reduce((s, v) => s + v, 0);

      const results: MatchResult[] = [];
      for (const d of weighted) {
        if (d.n === 0) continue;
        let dot = 0;
        let covered = 0;
        const matchedTerms: string[] = [];
        for (const [term, qv] of qw) {
          const dv = d.w.get(term);
          if (dv) {
            dot += qv * dv;
            covered += qv;
            matchedTerms.push(wordOf.get(term) ?? term);
          }
        }
        // Pokrycie: jaka (ważona idf) część zapytania znalazła się w opisie innowacji.
        // Bez tego krótkie opisy z jednym wspólnym słowem wygrywają z opisami trafiającymi w cały problem.
        const coverage = covered / qTotal;
        let score = (dot / (qn * d.n)) * (COVERAGE_FLOOR + (1 - COVERAGE_FLOOR) * coverage);
        // wybrany obszar dorzuca innowacje z tego obszaru nawet bez wspólnych słów
        if (area && d.inn.areas.includes(area)) score += AREA_BOOST;
        if (score > 0) results.push({ innovation: d.inn, score: Math.min(score, 1), matchedTerms });
      }
      return results.sort((a, b) => b.score - a.score).slice(0, limit);
    },
  };
}
