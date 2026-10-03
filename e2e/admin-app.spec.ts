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
    await expect(page.getByRole("heading", { level: 1, name: "Nowe pomysły" })).toBeVisible();
  });

  test("nowy pomysł jest na liście „Do przejrzenia” i ma podgląd szczegółów", async ({ page, request }) => {
    const title = unique("Pomysł e2e");
    const res = await request.post("/api/ideas", { data: { title, essence: "Opis pomysłu do testu aplikacji", audience: "testerzy", stage: "pomysl" } });
    expect(res.status()).toBe(201);
    const { code } = (await res.json()) as { code: string };

    await loginAsAdmin(page, "/admin/app");
    const fresh = page.locator("section", { has: page.getByRole("heading", { name: /Do przejrzenia/ }) });
    await fresh.getByRole("link", { name: new RegExp(title) }).click();

    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByText("Opis pomysłu do testu aplikacji")).toBeVisible();
    await expect(page.getByText(code)).toBeVisible();
    await page.getByRole("link", { name: "Wszystkie pomysły" }).click();
    await expect(page).toHaveURL(/\/admin\/app$/);
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
