import { describe, expect, it } from "vitest";
import { challenges } from "./data/seed";
import { iossUnits } from "./data/ioss-jednostki";
import { iossIndicators } from "./data/ioss-wskazniki";
import { AREA_INDICATORS, challengeIndicator, formatValue, getIossUnit, localFacts, regionSummary } from "./ioss";
import { AREAS } from "./labels";

describe("dane z Obserwatora Statystyk Społecznych ROPS (IOSS)", () => {
  it("import: 22 powiaty, gminy przypisane do istniejących powiatów, wszystkie wskaźniki z mapowania kategorii", () => {
    const powiaty = iossUnits.filter((u) => u.kind === "powiat");
    expect(powiaty).toHaveLength(22);
    expect(iossUnits.filter((u) => u.kind === "gmina").every((g) => powiaty.some((p) => p.id === g.powiat))).toBe(true);
    expect(new Set(iossUnits.map((u) => u.id)).size).toBe(iossUnits.length);
    for (const a of AREAS) for (const id of AREA_INDICATORS[a]) expect(iossIndicators.some((i) => i.id === id), `wskaźnik ${id}`).toBe(true);
    for (const i of iossIndicators) {
      expect(i.year).toBeGreaterThanOrEqual(2020);
      expect(powiaty.every((p) => typeof i.values[p.id] === "number"), `${i.name}: wartości dla powiatów`).toBe(true);
    }
  });

  it("mediana powiatów i zakres; suma dla liczby placówek", () => {
    const ind = { ...iossIndicators[0]!, values: { "p-bochenski": 10, "p-brzeski": 30, "p-chrzanowski": 20, "p-dabrowski": 40 } };
    expect(regionSummary(ind)).toMatchObject({ value: 25, label: "mediana powiatów Małopolski", min: { value: 10 }, max: { value: 40 }, count: 4 });
    const placowki = iossIndicators.find((i) => i.id === 244)!;
    const sum = Object.entries(placowki.values).filter(([k]) => k.startsWith("p-")).reduce((s, [, v]) => s + v, 0);
    expect(regionSummary(placowki)).toMatchObject({ value: sum, label: "suma dla Małopolski" });
    expect(formatValue(27.32, "%")).toBe("27,32%");
  });

  it("dane dla gminy: wartość gminy, porównanie z powiatem i regionem, zdanie ze źródłem i rokiem", () => {
    const gmina = iossUnits.find((u) => u.kind === "gmina" && iossIndicators.find((i) => i.id === 257)!.values[u.id] !== undefined)!;
    const [f] = localFacts(gmina.id, "dla-seniorow");
    expect(f).toMatchObject({ indicatorId: 257, fromPowiat: false, placeName: `gmina ${gmina.name}` });
    expect(f!.powiat?.name).toBe(getIossUnit(gmina.powiat!)!.name);
    expect(f!.sentence).toContain(`gmina ${gmina.name}: ${f!.valueText}`);
    expect(f!.sentence).toMatch(/Internetowy Obserwator Statystyk Społecznych ROPS, dane za \d{4} r\./);
  });

  it("wskaźnik bez danych dla gmin → wartość powiatu z wyjaśnieniem; nieznana jednostka → brak danych", () => {
    const gmina = iossUnits.find((u) => u.kind === "gmina")!;
    const f = localFacts(gmina.id, "dla-rynku-pracy").find((x) => x.indicatorId === 25)!;
    expect(f.fromPowiat).toBe(true);
    expect(f.placeName).toContain("nie podaje tego wskaźnika dla gmin");
    expect(localFacts("g-nie-istnieje")).toEqual([]);
    expect(localFacts("p-bochenski").map((x) => x.indicatorId)).toEqual([31, 257]);
  });

  it("Mapa Wyzwań: każde wyzwanie ma prawdziwy wskaźnik IOSS z rokiem i źródłem", () => {
    for (const c of challenges) {
      expect(c.indicator?.sourceUrl).toMatch(/^https:\/\/obserwator\.rops\.krakow\.pl\/differenceanalysis\/\d+$/);
      expect(c.indicator?.label).not.toMatch(/przykład/i);
      expect(c.indicator?.note).toMatch(/(Mediana|Suma) 22 powiatów/);
    }
    expect(() => challengeIndicator(999_999)).toThrow(/import:ioss/);
  });
});
