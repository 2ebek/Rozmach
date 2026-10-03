import { expect, type Page } from "@playwright/test";

/** Otwiera stronę i czeka na hydratację – kliknięcia przed nią React by zignorował. */
export async function open(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

/** Wypełnia formularz logowania (strona /logowanie musi być już otwarta). */
export async function submitLogin(page: Page, password = "demo") {
  await expect(page).toHaveURL(/\/logowanie/);
  await page.waitForLoadState("networkidle");
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Zaloguj się" }).click();
}

export async function loginAsAdmin(page: Page, startPath = "/admin") {
  await page.goto(startPath);
  await submitLogin(page);
  await expect(page).toHaveURL(new RegExp(`${startPath.replace(/\//g, "\\/")}$`));
  await page.waitForLoadState("networkidle");
}

export const unique = (prefix: string) => `${prefix} ${Date.now().toString(36)}`;
