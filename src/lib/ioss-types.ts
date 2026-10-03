/** Typy danych z Internetowego Obserwatora Statystyk Społecznych ROPS (pliki generuje scripts/import-ioss.mjs). */

export interface IossUnit {
  /** np. "p-bochenski" (powiat) albo "g-bochenski-drwinia" (gmina). */
  id: string;
  /** Nazwa jak w IOSS, np. "powiat bocheński", "Bochnia (miasto)". */
  name: string;
  kind: "powiat" | "gmina";
  /** Id powiatu, do którego należy gmina. */
  powiat?: string;
}

export interface IossIndicator {
  /** Numer wskaźnika w IOSS (adres /differenceanalysis/{id}). */
  id: number;
  name: string;
  description?: string;
  source?: string;
  /** Rok, którego dotyczą wartości (najnowszy dostępny w IOSS). */
  year: number;
  /** "%" – gdy IOSS podaje wartości w procentach. */
  unit: "%" | "";
  url: string;
  /** Wartości wg id jednostki (powiaty i – jeśli IOSS je podaje – gminy). */
  values: Record<string, number>;
}
