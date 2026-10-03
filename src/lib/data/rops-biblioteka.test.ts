import { describe, expect, it } from "vitest";
import { AREAS } from "../labels";
import { ropsInnovations } from "./rops-biblioteka";
import { exampleIdeas, seedIdeas } from "./seed";

describe("fiszki przykładowe dla jurorów", () => {
  it("mają unikalne kody z alfabetu kodów, pola wymagane i co najmniej po jednej fiszce w każdym statusie", () => {
    const all = seedIdeas();
    const ex = exampleIdeas();
    expect(new Set(all.map((i) => i.code)).size).toBe(all.length);
    for (const i of ex) {
      expect(i.code).toMatch(/^HUB-[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{6}$/);
      expect(i.title && i.essence && i.audience && i.problem && i.category).toBeTruthy();
      expect(i.thread.every((m) => m.createdAt <= new Date().toISOString())).toBe(true);
    }
    expect(new Set(ex.map((i) => i.status))).toEqual(new Set(["nowy", "w-weryfikacji", "zaakceptowany", "odrzucony"]));
    // odrzucona fiszka ma uzasadnienie zespołu
    expect(ex.find((i) => i.status === "odrzucony")?.adminComment).toBeTruthy();
  });
});

describe("dane z Biblioteki Innowacji Społecznych ROPS", () => {
  it("obejmują wszystkie 9 kategorii ROPS i tylko je", () => {
    const used = new Set(ropsInnovations.flatMap((i) => i.areas));
    expect([...used].sort()).toEqual([...AREAS].sort());
  });

  it("każda innowacja ma kartę: unikalne id, opis rozwiązania, kategorię i link do ROPS", () => {
    const ids = new Set<string>();
    for (const i of ropsInnovations) {
      expect(i.id).toMatch(/^rops-[a-z0-9-]+$/);
      expect(ids.has(i.id)).toBe(false);
      ids.add(i.id);
      expect(i.title.length).toBeGreaterThan(1);
      expect(i.summary.length).toBeGreaterThan(5);
      expect(i.areas.length).toBeGreaterThan(0);
      expect(i.ropsUrl).toMatch(/^https:\/\/rops\.krakow\.pl\/innowacje-spoleczne\/biblioteka-innowacji-spolecznych\//);
      expect(i.published).toBe(true);
    }
  });

  it("większość kart ma opis problemu i grupę docelową (pytania 2 i 3 karty ROPS)", () => {
    const full = ropsInnovations.filter((i) => i.problem && i.targetGroup).length;
    expect(full / ropsInnovations.length).toBeGreaterThan(0.95);
  });

  it("nie przenosi danych osobowych autorów – karta odsyła do strony ROPS", () => {
    for (const i of ropsInnovations) expect(i).not.toHaveProperty("authors");
    const text = JSON.stringify(ropsInnovations);
    // sekcja „Autorzy” bywa numerowana 5. albo 6. i doklejona do poprzedniego pytania
    expect(text).not.toMatch(/\d\.\s*Autor(zy|ka|ki)?\b/);
    expect(text).not.toMatch(/[A-Za-z0-9._%+-]+@(?!rops\.krakow\.pl)[A-Za-z0-9.-]+\.[a-z]{2,}/);
  });
});
