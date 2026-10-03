import { describe, expect, it } from "vitest";
import { innovations } from "../data/seed";
import { createMatcher } from "./index";

// Dane: prawdziwe innowacje z Biblioteki Innowacji Społecznych ROPS (rops-biblioteka.ts).
describe("matchmaking na danych Biblioteki ROPS", () => {
  const matcher = createMatcher(innovations);
  const ids = (q: string, limit = 3, area?: Parameters<typeof matcher.match>[1]) => matcher.match(q, { limit, ...area }).map((r) => r.innovation.id);

  it("konkretny problem → właściwa innowacja na pierwszym miejscu", () => {
    expect(ids("Mieszkańcy nie umieją obsłużyć biletomatu i kiosku samoobsługowego")[0]).toBe("rops-merkury");
    expect(ids("Dziecko z autyzmem potrzebuje terapii sensorycznej")[0]).toBe("rops-mobilny-pomocnik-dydaktyczno-sensoryczny-dla-uczniowstudentow-ze-spektrum-autyzmu");
    expect(ids("Młodzież ma depresję")[0]).toBe("rops-centrum-antydepresyjne");
  });

  it("pole „Jakich problemów dotyczy” z karty ROPS jest brane pod uwagę", () => {
    expect(ids("Babcia ma demencję i zapomina, potrzebujemy ćwiczeń pamięci")).toContain("rops-bawita");
    expect(ids("Osoby w kryzysie bezdomności nie mają gdzie się umyć", 2)).toContain("rops-wiejski-program-pomocy-osobom-w-kryzysie-bezdomnosci-sciezka-feniksa");
  });

  it("wyniki dla opisu o seniorach pochodzą z kategorii „dla seniorów”", () => {
    const res = matcher.match("Starsi sąsiedzi czują się samotni, brakuje spotkań dla seniorów", { limit: 2 });
    expect(res.length).toBeGreaterThan(0);
    for (const r of res) expect(r.innovation.areas).toContain("dla-seniorow");
  });

  it("pokazuje słowa użytkownika, a nie rdzenie", () => {
    const r = matcher.match("Seniorzy boją się kiosku samoobsługowego").find((x) => x.innovation.id === "rops-merkury");
    expect(r?.matchedTerms).toContain("kiosku");
  });

  it("wybrana kategoria ROPS dorzuca innowacje z tej kategorii", () => {
    // zapytanie bez wspólnych słów z katalogiem – wyniki pochodzą wyłącznie z premii za kategorię
    const res = matcher.match("qqqq", { area: "dla-cudzoziemcow", limit: 5 });
    expect(res.length).toBeGreaterThan(0);
    expect(res.every((r) => r.innovation.areas.includes("dla-cudzoziemcow"))).toBe(true);
  });

  it("zwraca pustą listę dla pustego zapytania", () => {
    expect(matcher.match("")).toEqual([]);
  });
});
