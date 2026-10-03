import { iossUnits } from "./data/ioss-jednostki";
import { iossIndicators } from "./data/ioss-wskazniki";
import type { IossIndicator, IossUnit } from "./ioss-types";
import type { Challenge, ChallengeArea } from "./types";

/**
 * Prawdziwe wskaźniki społeczne Małopolski z Internetowego Obserwatora Statystyk Społecznych ROPS (IOSS, dane GUS i sprawozdań
 * pomocy społecznej). Zasilają Mapę Wyzwań i podpowiadają liczby do diagnozy problemu w fiszce (pkt 5 formularza IWS 2.0).
 * IOSS nie podaje wartości dla całego województwa – porównujemy z medianą powiatów (albo sumą, gdy wskaźnik jest liczbą placówek/osób).
 */

export const IOSS_URL = "https://obserwator.rops.krakow.pl/";
export const IOSS_NAME = "Internetowy Obserwator Statystyk Społecznych ROPS";

/** Czytelne nazwy wskaźników i ich jednostki (IOSS podaje część wartości procentowych bez znaku %). */
const META: Record<number, { label: string; unit?: string; sum?: true }> = {
  257: { label: "Udział osób w wieku 60+ w liczbie ludności" },
  274: { label: "Osoby w wieku 85+ na 100 osób w wieku 50–64 lata (wskaźnik wsparcia osób najstarszych)" },
  38: { label: "Klienci pomocy społecznej wspierani z powodu bezradności w sprawach opiekuńczo-wychowawczych" },
  36: { label: "Klienci pomocy społecznej wspierani z powodu przemocy domowej" },
  31: { label: "Klienci pomocy społecznej wspierani z powodu ubóstwa" },
  32: { label: "Klienci pomocy społecznej wspierani z powodu bezrobocia" },
  25: { label: "Stopa bezrobocia rejestrowanego", unit: "%" },
  189: { label: "Bezrobotni dłużej niż rok – udział wśród wszystkich bezrobotnych", unit: "%" },
  37: { label: "Klienci pomocy społecznej wspierani z powodu niepełnosprawności" },
  215: { label: "Osoby z niepełnosprawnością (prawną lub biologiczną) w liczbie ludności" },
  99: { label: "Saldo migracji zagranicznych (liczba osób)", sum: true },
  244: { label: "Środowiskowe domy samopomocy (liczba placówek)", sum: true },
  34: { label: "Klienci pomocy społecznej wspierani z powodu bezdomności" },
  247: { label: "Noclegownie, schroniska i domy dla osób bezdomnych (liczba placówek)", sum: true },
  39: { label: "Klienci pomocy społecznej wspierani z powodu długotrwałej lub ciężkiej choroby" },
  18: { label: "Łóżka w szpitalach ogólnych na 10 tys. mieszkańców" },
};

/** Wskaźniki pokazywane przy diagnozie problemu – wg kategorii Biblioteki ROPS (najpierw te z danymi dla gmin). */
export const AREA_INDICATORS: Record<ChallengeArea, number[]> = {
  "dla-seniorow": [257, 274],
  "dla-dzieci-mlodziezy-i-rodziny": [38, 36],
  "dla-rynku-pracy": [32, 25, 189],
  "dla-osob-o-ograniczonej-mobilnosci": [37, 215],
  "dla-osob-z-niepelnosprawnoscia-sensoryczna": [37, 215],
  "dla-cudzoziemcow": [99],
  "dla-osob-z-niepelnosprawnoscia-intelektualna": [37, 244],
  "dla-osob-w-kryzysie-bezdomnosci": [34, 247],
  "dla-zdrowia-i-medycyny": [39, 18],
};
/** Bez wybranej kategorii – ogólny obraz sytuacji społecznej. */
const DEFAULT_INDICATORS = [31, 257];

export interface IossFact {
  indicatorId: number;
  label: string;
  description?: string;
  year: number;
  url: string;
  /** Wartość dla wybranej jednostki; gdy gmina nie ma danych – wartość jej powiatu (wtedy `fromPowiat`). */
  value: number;
  valueText: string;
  placeName: string;
  fromPowiat: boolean;
  /** Dla gminy – porównanie z powiatem. */
  powiat?: { name: string; valueText: string };
  region: { label: string; valueText: string };
  /** Gotowe zdanie do wstawienia w diagnozę (z rokiem i źródłem). */
  sentence: string;
}

export const listIossUnits = (): IossUnit[] => iossUnits;
export const getIossUnit = (id: string) => iossUnits.find((u) => u.id === id);
const getIndicator = (id: number) => iossIndicators.find((i) => i.id === id);
const unitOf = (ind: IossIndicator) => META[ind.id]?.unit ?? ind.unit;
const labelOf = (ind: IossIndicator) => META[ind.id]?.label ?? ind.name;

export function formatValue(v: number, unit: string): string {
  return v.toLocaleString("pl-PL", { maximumFractionDigits: 2 }) + unit;
}

/** Nazwa jednostki w zdaniu: „gmina Drwinia”, „powiat bocheński”. */
export const unitLabel = (u: IossUnit) => (u.kind === "gmina" ? `gmina ${u.name}` : u.name);

const powiatValues = (ind: IossIndicator) =>
  iossUnits.flatMap((u) => {
    const value = ind.values[u.id];
    return u.kind === "powiat" && value !== undefined ? [{ name: u.name, value }] : [];
  });

/** Wartość dla Małopolski: suma powiatów (liczby placówek/osób) albo mediana powiatów (wskaźniki względne) z zakresem. */
export function regionSummary(ind: IossIndicator) {
  const rows = powiatValues(ind).sort((a, b) => a.value - b.value);
  if (!rows.length) throw new Error(`Wskaźnik IOSS ${ind.id} nie ma wartości dla powiatów`);
  const unit = unitOf(ind);
  const range = { min: rows[0]!, max: rows[rows.length - 1]!, count: rows.length };
  if (META[ind.id]?.sum) {
    const total = Math.round(rows.reduce((s, r) => s + r.value, 0) * 100) / 100;
    return { value: total, label: "suma dla Małopolski", valueText: formatValue(total, unit), ...range };
  }
  const mid = Math.floor(rows.length / 2);
  const median = rows.length % 2 ? rows[mid]!.value : Math.round(((rows[mid - 1]!.value + rows[mid]!.value) / 2) * 100) / 100;
  return { value: median, label: "mediana powiatów Małopolski", valueText: formatValue(median, unit), ...range };
}

/** Wskaźniki IOSS dla gminy lub powiatu – do diagnozy problemu. Pusta lista, gdy jednostka jest nieznana. */
export function localFacts(unitId: string, area?: ChallengeArea): IossFact[] {
  const unit = getIossUnit(unitId);
  if (!unit) return [];
  const powiat = unit.kind === "gmina" ? getIossUnit(unit.powiat!) : undefined;
  const facts: IossFact[] = [];
  for (const id of area ? AREA_INDICATORS[area] : DEFAULT_INDICATORS) {
    const ind = getIndicator(id);
    if (!ind) continue;
    const u = unitOf(ind);
    const own = ind.values[unit.id];
    const fromPowiat = own === undefined && !!powiat;
    const value = own ?? (powiat ? ind.values[powiat.id] : undefined);
    if (value === undefined) continue;
    const region = regionSummary(ind);
    const placeName = fromPowiat ? `${powiat!.name} (IOSS nie podaje tego wskaźnika dla gmin)` : unitLabel(unit);
    const powiatValue = powiat ? ind.values[powiat.id] : undefined;
    const powiatCmp = !fromPowiat && powiat && powiatValue !== undefined ? { name: powiat.name, valueText: formatValue(powiatValue, u) } : undefined;
    const valueText = formatValue(value, u);
    const cmp = [powiatCmp && `${powiatCmp.name}: ${powiatCmp.valueText}`, `${region.label}: ${region.valueText}`].filter(Boolean).join("; ");
    facts.push({
      indicatorId: ind.id,
      label: labelOf(ind),
      description: ind.description,
      year: ind.year,
      url: ind.url,
      value,
      valueText,
      placeName,
      fromPowiat,
      powiat: powiatCmp,
      region: { label: region.label, valueText: region.valueText },
      sentence: `${labelOf(ind)} – ${fromPowiat ? powiat!.name : unitLabel(unit)}: ${valueText} (${cmp}). Źródło: ${IOSS_NAME}, dane za ${ind.year} r.`,
    });
  }
  return facts;
}

/** Wskaźnik do karty wyzwania w Mapie Wyzwań – wartość dla Małopolski z zakresem między powiatami. */
export function challengeIndicator(id: number): NonNullable<Challenge["indicator"]> {
  const ind = getIndicator(id);
  if (!ind) throw new Error(`Brak wskaźnika IOSS ${id} – uruchom npm run import:ioss`);
  const r = regionSummary(ind);
  const unit = unitOf(ind);
  const note = META[ind.id]?.sum
    ? `Suma ${r.count} powiatów; najwięcej: ${r.max.name} (${formatValue(r.max.value, unit)}).`
    : `Mediana ${r.count} powiatów; od ${formatValue(r.min.value, unit)} (${r.min.name}) do ${formatValue(r.max.value, unit)} (${r.max.name}).`;
  return { label: labelOf(ind), value: r.value, unit, year: ind.year, note, sourceUrl: ind.url };
}
