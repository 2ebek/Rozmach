import { defineConfig } from "@playwright/test";

/**
 * Testy E2E w prawdziwej przeglądarce (Microsoft Edge zainstalowany w systemie – bez pobierania przeglądarek).
 * Jeden worker: aplikacja trzyma dane w pamięci, a testy je modyfikują.
 * Uruchomienie: `npm run test:e2e` (użyje działającego `npm run dev` albo sam go uruchomi z HUB_AI=off).
 * Jeśli serwer już działa z kluczem AI, uruchom go z HUB_AI=off – inaczej testy wywołają prawdziwe API.
 */
export default defineConfig({
  testDir: "e2e",
  workers: 1,
  fullyParallel: false,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    channel: "msedge",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    // testy deterministyczne i bez kosztów API – AI wyłączone (dotyczy serwera uruchamianego przez Playwright)
    env: { HUB_AI: "off" },
    timeout: 180_000,
  },
});
