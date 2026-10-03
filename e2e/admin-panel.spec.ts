import { expect, test } from "@playwright/test";
import { loginAsAdmin, open, submitLogin } from "./helpers";

const panelHeading = (page: import("@playwright/test").Page) => page.getByRole("heading", { level: 1, name: "Dzień dobry, zespole Hubu" });

test.describe("Panel administratora – ładowanie i logowanie", () => {
  test("po wejściu z menu i zalogowaniu panel ładuje się bez odświeżania (regresja błędu)", async ({ page }) => {
    let reloads = 0;
    page.on("framenavigated", (f) => f === page.mainFrame() && reloads++);
    await open(page, "/");
    await page.locator("header nav a[href='/admin']").click();
    await submitLogin(page);
    await expect(panelHeading(page)).toBeVisible();
    await expect(page).toHaveURL(/\/admin$/);
    // przycisk logowania nie może zostać w stanie „Loguję…”
    await expect(page.getByRole("button", { name: "Loguję…" })).toHaveCount(0);
    expect(reloads).toBeLessThan(10);
  });

  test("bezpośrednie wejście na /admin → logowanie → panel", async ({ page }) => {
    await page.goto("/admin");
    await submitLogin(page);
    await expect(panelHeading(page)).toBeVisible();
  });

  test("błędne hasło pokazuje komunikat i odblokowuje przycisk", async ({ page }) => {
    await page.goto("/admin");
    await submitLogin(page, "zle-haslo");
    await expect(page.locator("main").getByRole("alert")).toHaveText("Nieprawidłowe hasło.");
    await expect(page.getByRole("button", { name: "Zaloguj się" })).toBeEnabled();
    await expect(page).toHaveURL(/\/logowanie/);
  });

  test("zakładki panelu ładują się po nawigacji klienckiej", async ({ page }) => {
    await loginAsAdmin(page);
    for (const [tab, heading] of [
      ["Zarządzanie wiedzą", "Zarządzanie wiedzą"],
      ["Nabory i wnioski", "Nabory i wnioski"],
      ["Aplikacja na telefon", "Nowe pomysły"],
    ] as const) {
      await open(page, "/admin");
      await page.getByRole("link", { name: tab }).click();
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    }
  });

  test("wylogowanie usuwa dostęp – panel nie jest widoczny z pamięci przeglądarki", async ({ page, context }) => {
    await loginAsAdmin(page);
    await page.getByRole("button", { name: "Wyloguj" }).click();
    await expect(page).toHaveURL(/\/$/);
    expect((await context.cookies()).find((c) => c.name === "hub_admin")).toBeUndefined();
    await page.waitForLoadState("networkidle");
    await page.locator("header nav a[href='/admin']").click();
    await expect(page).toHaveURL(/\/logowanie/);
    await expect(panelHeading(page)).toHaveCount(0);
  });

  test("API administratora odrzuca niezalogowanych", async ({ playwright, baseURL }) => {
    const anon = await playwright.request.newContext({ baseURL });
    expect((await anon.post("/api/admin", { data: { action: "events-read" } })).status()).toBe(401);
    expect((await anon.get("/api/admin/push")).status()).toBe(401);
    expect((await anon.post("/api/admin/push", { data: {} })).status()).toBe(401);
    await anon.dispose();
  });
});
