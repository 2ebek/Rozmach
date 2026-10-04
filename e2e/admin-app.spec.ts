import { chromium, expect, test } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loginAsAdmin, submitLogin, unique } from "./helpers";

test.describe("Aplikacja administratora (PWA) – dostęp, lista, szczegóły", () => {
  test("niezalogowany trafia na logowanie, a po nim wraca do aplikacji", async ({ page }) => {
    await page.goto("/admin/app");
    await expect(page).toHaveURL(/\/logowanie\?next=%2Fadmin%2Fapp/);
    await submitLogin(page);
    await expect(page).toHaveURL(/\/admin\/app$/);
    await expect(page.getByRole("heading", { level: 1, name: "Pomysły do przejrzenia" })).toBeVisible();
  });

  test("nowy pomysł jest w zakładce „Nowe”, a decyzję i komentarz można dodać w aplikacji", async ({ page, request }) => {
    const title = unique("Pomysł e2e");
    const res = await request.post("/api/ideas", { data: { title, essence: "Opis pomysłu do testu aplikacji", audience: "testerzy", stage: "pomysl" } });
    expect(res.status()).toBe(201);
    const { code } = (await res.json()) as { code: string };

    await loginAsAdmin(page, "/admin/app");
    await expect(page.getByRole("tab", { name: /Nowe/ })).toHaveAttribute("aria-selected", "true");
    await page.getByRole("tabpanel").getByRole("link", { name: new RegExp(title) }).click();

    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByText("Opis pomysłu do testu aplikacji")).toBeVisible();
    await expect(page.getByText(code).first()).toBeVisible();

    // decyzja bez przechodzenia do pełnego panelu
    const decision = page.locator("[data-decision]");
    await decision.getByRole("button", { name: "Do weryfikacji" }).click();
    await expect(page.locator("main").getByText("W weryfikacji", { exact: true }).first()).toBeVisible();
    await decision.getByRole("button", { name: "Dodaj komentarz" }).click();
    await decision.getByLabel("Komentarz zespołu do fiszki").fill("Prosimy o doprecyzowanie budżetu.");
    await decision.getByRole("button", { name: "Zapisz komentarz" }).click();
    await expect(decision.getByText("Prosimy o doprecyzowanie budżetu.")).toBeVisible();

    // pomysł przeszedł do zakładki „Do weryfikacji” i da się go znaleźć wyszukiwarką
    await page.getByRole("link", { name: "Pomysły" }).click();
    await expect(page).toHaveURL(/\/admin\/app$/);
    await page.getByRole("tab", { name: /Do weryfikacji/ }).click();
    await page.getByRole("searchbox", { name: "Szukaj pomysłu" }).fill(code);
    await expect(page.getByRole("tabpanel").getByRole("link")).toHaveCount(1);
    await expect(page.getByRole("tabpanel").getByRole("link", { name: new RegExp(title) })).toBeVisible();
    await page.getByRole("searchbox", { name: "Szukaj pomysłu" }).fill("zzz-nie-ma-takiego");
    await expect(page.getByText("Nic nie pasuje do wyszukiwania.")).toBeVisible();
  });

  test("strona „Pobierz aplikację” – instalacja na komputerze i kod QR dla telefonu", async ({ page }) => {
    await loginAsAdmin(page, "/admin");
    await page.getByRole("link", { name: "Pobierz aplikację" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Aplikacja Hub Admin" })).toBeVisible();
    await expect(page.locator("link[rel=manifest]")).toHaveAttribute("href", "/admin-app.webmanifest");
    await expect(page.locator("[data-install]")).toContainText("To urządzenie: komputer");
    await expect(page.getByRole("heading", { name: "Na komputer" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Na telefon" })).toBeVisible();
    await expect(page.getByRole("img", { name: /Kod QR z adresem aplikacji: http:\/\/.+\/admin\/app$/ })).toBeVisible();
    await expect(page.locator("[data-qr] svg path").first()).toBeAttached();
    await page.getByRole("link", { name: "Otwórz aplikację w przeglądarce" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Pomysły do przejrzenia" })).toBeVisible();
  });

  // Playwright nie odcina sieci service workerowi, więc sprawdzamy, że strona offline jest w jego pamięci.
  test("bez sieci aplikacja ma stronę „Brak połączenia” (w pamięci service workera)", async ({ page }) => {
    await loginAsAdmin(page, "/admin/app");
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    const cached = await page.evaluate(async () => {
      const res = await caches.match("/admin-offline.html");
      return res ? await res.text() : null;
    });
    expect(cached).toContain("Brak połączenia");
    await page.goto("/admin-offline.html");
    await expect(page.getByRole("heading", { name: "Brak połączenia" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Spróbuj ponownie" })).toBeVisible();
  });

  test("nieistniejący pomysł → 404", async ({ page }) => {
    await loginAsAdmin(page, "/admin/app");
    const res = await page.goto("/admin/app/nie-ma-takiego");
    expect(res?.status()).toBe(404);
  });

  test("manifest, ikony i service worker pozwalają zainstalować aplikację", async ({ page, request }) => {
    await loginAsAdmin(page, "/admin/app");
    const href = await page.locator("link[rel=manifest]").getAttribute("href");
    expect(href).toBe("/admin-app.webmanifest");
    const manifest = (await (await request.get(href!)).json()) as { start_url: string; scope: string; display: string; icons: { src: string; sizes: string }[] };
    expect(manifest).toMatchObject({ start_url: "/admin/app", scope: "/admin/app", display: "standalone" });
    for (const icon of manifest.icons) {
      const r = await request.get(icon.src);
      expect(r.status(), icon.src).toBe(200);
      expect(r.headers()["content-type"]).toContain("image/png");
    }
    const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
    expect(scope).toMatch(/\/admin\/app$/);
  });

  test("manifest nie jest dołączany do stron publicznych", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("link[rel=manifest]")).toHaveCount(0);
  });
});

test.describe("Aplikacja administratora – powiadomienia push", () => {
  // Push wymaga zwykłego (nie-incognito) profilu przeglądarki i połączenia z usługą push przeglądarki (internet).
  test("nowy pomysł → push przez usługę przeglądarki → powiadomienie z linkiem do szczegółów", async ({ baseURL }) => {
    test.slow();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hub-push-"));
    const ctx = await chromium.launchPersistentContext(dir, { channel: "msedge", headless: true, baseURL });
    try {
      await ctx.grantPermissions(["notifications"], { origin: baseURL! });
      const page = await ctx.newPage();
      await loginAsAdmin(page, "/admin/app");

      await page.getByRole("button", { name: "Włącz powiadomienia" }).click();
      await expect(page.getByText("Powiadomienia o nowych pomysłach są włączone na tym urządzeniu.")).toBeVisible({ timeout: 30_000 });
      const { subscriptions } = (await page.evaluate(async () => (await fetch("/api/admin/push")).json())) as { subscriptions: number };
      expect(subscriptions).toBeGreaterThan(0);

      const title = unique("Push e2e");
      await page.request.post("/api/ideas", { data: { title, essence: "Sprawdzenie powiadomień", audience: "administratorzy", stage: "pomysl" } });

      // powiadomienie wyświetlone przez service worker
      await expect
        .poll(
          () =>
            page.evaluate(async (t) => {
              const reg = await navigator.serviceWorker.getRegistration("/admin/app");
              const n = (await reg!.getNotifications()).find((x) => x.body.includes(t));
              return n ? { title: n.title, url: (n.data as { url: string }).url } : null;
            }, title),
          { timeout: 30_000 },
        )
        .toMatchObject({ title: "Nowy pomysł w Hubie", url: expect.stringMatching(/^\/admin\/app\/idea-/) });

      // otwarta lista odświeża się sama
      await expect(page.getByText(title)).toBeVisible();

      // link z powiadomienia prowadzi do szczegółów pomysłu
      const url = await page.evaluate(async (t) => {
        const reg = await navigator.serviceWorker.getRegistration("/admin/app");
        return ((await reg!.getNotifications()).find((x) => x.body.includes(t))!.data as { url: string }).url;
      }, title);
      await page.goto(url);
      await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();

      // wyłączenie powiadomień usuwa subskrypcję z serwera
      await page.goto("/admin/app");
      await page.waitForLoadState("networkidle");
      await page.getByRole("button", { name: "Wyłącz" }).click();
      await expect(page.getByRole("button", { name: "Włącz powiadomienia" })).toBeVisible();
      const after = (await page.evaluate(async () => (await fetch("/api/admin/push")).json())) as { subscriptions: number };
      expect(after.subscriptions).toBe(subscriptions - 1);
    } finally {
      await ctx.close();
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
