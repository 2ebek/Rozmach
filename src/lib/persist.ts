import fs from "node:fs";
import path from "node:path";
import { seedIdeas } from "./data/seed";
import type { Application, IdeaCard } from "./types";

/**
 * Trwały magazyn pomysłów i wniosków: plik JSON (prototyp bez bazy danych, bez dodatkowych zależności).
 * Ścieżka: HUB_DATA_FILE albo data/hub-data.json. Produkcja: te same kolekcje jako tabele w PostgreSQL.
 */
export interface PersistedData {
  version: 1;
  ideas: IdeaCard[];
  applications: Application[];
}

export function dataFile(): string {
  return process.env.HUB_DATA_FILE || path.join(process.cwd(), "data", "hub-data.json");
}

/** Seed / migracja: pomysły dawniej wpisane na sztywno w kodzie trafiają do magazynu przy pierwszym starcie. */
function seeded(): PersistedData {
  return { version: 1, ideas: seedIdeas(), applications: [] };
}

function isValid(d: unknown): d is PersistedData {
  const x = d as Partial<PersistedData> | null;
  return !!x && x.version === 1 && Array.isArray(x.ideas) && Array.isArray(x.applications);
}

export function saveData(data: PersistedData, file = dataFile()): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  // zapis przez plik tymczasowy – przerwany zapis nie zostawi uciętego JSON-a
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
  try {
    fs.renameSync(tmp, file);
  } catch {
    // Windows potrafi zablokować podmianę (np. antywirus) – wtedy zapis bezpośredni
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
    fs.rmSync(tmp, { force: true });
  }
}

export function loadData(file = dataFile()): PersistedData {
  if (!fs.existsSync(file)) {
    const data = seeded();
    saveData(data, file);
    return data;
  }
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(file, "utf8"));
    if (isValid(parsed)) return parsed;
    throw new Error("nieznany format pliku");
  } catch (err) {
    // Nie nadpisujemy po cichu: uszkodzony plik zostaje jako kopia do ręcznego odzyskania.
    const backup = `${file}.uszkodzony-${Date.now()}`;
    fs.renameSync(file, backup);
    console.warn(`[persist] nie udało się wczytać ${file} (${err instanceof Error ? err.message : err}); kopia: ${backup}, start z danymi początkowymi`);
    const data = seeded();
    saveData(data, file);
    return data;
  }
}
