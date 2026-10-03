import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { seedIdeas } from "./data/seed";
import { loadData, saveData } from "./persist";

/** Fiszki startowe: 3 demo + przykładowe dla jurorów. */
const SEED_CODES = seedIdeas().map((i) => i.code);

let dir: string;
let file: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "hub-persist-"));
  file = path.join(dir, "nested", "hub-data.json");
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

describe("trwały magazyn pomysłów i wniosków", () => {
  it("pierwsze uruchomienie: seed przenosi dotychczas zahardkodowane pomysły do pliku", () => {
    const data = loadData(file);
    expect(data.ideas.map((i) => i.code)).toEqual(SEED_CODES);
    expect(data.applications).toEqual([]);
    const onDisk = JSON.parse(fs.readFileSync(file, "utf8"));
    expect(onDisk.version).toBe(1);
    expect(onDisk.ideas).toHaveLength(SEED_CODES.length);
    // rozmowa przy pomyśle też została przeniesiona
    expect(data.ideas.find((i) => i.code === "HUB-KINO42")!.thread).toHaveLength(2);
  });

  it("kolejne uruchomienie czyta plik i nie seeduje ponownie", () => {
    const data = loadData(file);
    data.ideas = data.ideas.filter((i) => i.code !== "HUB-DEMO23");
    saveData(data, file);
    expect(loadData(file).ideas.map((i) => i.code)).toEqual(SEED_CODES.filter((c) => c !== "HUB-DEMO23"));
  });

  it("puste kolekcje są poprawnym stanem – usunięte pomysły nie wracają z seeda", () => {
    saveData({ version: 1, ideas: [], applications: [] }, file);
    expect(loadData(file)).toEqual({ version: 1, ideas: [], applications: [] });
  });

  it("uszkodzony plik: kopia zapasowa zamiast utraty danych i start od seeda", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, "{ to nie jest JSON");
    const data = loadData(file);
    expect(data.ideas).toHaveLength(SEED_CODES.length);
    const backups = fs.readdirSync(path.dirname(file)).filter((f) => f.includes(".uszkodzony-"));
    expect(backups).toHaveLength(1);
    expect(fs.readFileSync(path.join(path.dirname(file), backups[0]!), "utf8")).toBe("{ to nie jest JSON");
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("plik w nieznanym formacie traktuje jak uszkodzony", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify({ version: 99, ideas: "x" }));
    expect(loadData(file).ideas).toHaveLength(SEED_CODES.length);
  });
});
