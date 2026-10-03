import { expect, test } from "@playwright/test";
import { loginAsAdmin, open, unique } from "./helpers";

test.describe("Panel: zarządzanie pomysłami", () => {
  test("dodanie, edycja i usunięcie pomysłu z poziomu panelu", async ({ page }) => {
    const title = unique("Pomysł z panelu");
    await loginAsAdmin(page, "/admin/pomysly");

    // dodanie
    await page.locator("#new-idea-title").fill(title);
    await page.locator("#new-idea-essence").fill("Wspólne gotowanie seniorów i studentów w świetlicy");
    await page.locator("#new-idea-audience").fill("seniorzy i studenci");
    await page.getByRole("button", { name: "Dodaj pomysł" }).click();
    await expect(page.getByText(/Dodano pomysł \(kod HUB-[A-Z0-9]{6}\)\./)).toBeVisible();
    const card = page.locator("li", { has: page.getByRole("heading", { name: title, exact: true }) });
    await expect(card).toBeVisible();
    const code = (await card.textContent())!.match(/HUB-[A-Z0-9]{6}/)![0];

    // walidacja w interfejsie: za krótki opis → komunikat, nic nie znika
    await page.locator("#new-idea-title").fill("Abc");
    await page.locator("#new-idea-essence").fill("za mało");
    await page.locator("#new-idea-audience").fill("ktoś");
    await page.locator("#new-idea-essence").evaluate((el) => el.closest("form")!.setAttribute("novalidate", ""));
    await page.getByRole("button", { name: "Dodaj pomysł" }).click();
    await expect(page.getByText("Opisz innowację (min. 10 znaków).")).toBeVisible();

    // pomysł jest dostępny dynamicznie w innych widokach
    await open(page, "/admin/app");
    await expect(page.getByRole("link", { name: new RegExp(title) })).toBeVisible();
    await open(page, `/status?kod=${code}`);
    await expect(page.getByRole("heading", { level: 2, name: title })).toBeVisible();

    // edycja
    await open(page, "/admin/pomysly");
    await card.getByText("Edytuj").click();
    await card.getByLabel("1. Tytuł innowacji").fill(`${title} (poprawiony)`);
    await card.getByRole("button", { name: "Zapisz zmiany" }).click();
    await expect(page.getByRole("heading", { name: `${title} (poprawiony)` })).toBeVisible();

    // usunięcie z potwierdzeniem
    const edited = page.locator("li", { has: page.getByRole("heading", { name: `${title} (poprawiony)` }) });
    page.once("dialog", (d) => void d.accept());
    await edited.getByRole("button", { name: "Usuń pomysł" }).click();
    await expect(page.getByRole("heading", { name: `${title} (poprawiony)` })).toHaveCount(0);
    await open(page, `/status?kod=${code}`);
    await expect(page.getByText(`Nie znaleźliśmy zgłoszenia o kodzie ${code}.`)).toBeVisible();
  });

  test("anulowanie potwierdzenia nie usuwa pomysłu", async ({ page }) => {
    await loginAsAdmin(page, "/admin/pomysly");
    const first = page.locator("section[aria-labelledby=h-lista-pomyslow] li").first();
    const name = (await first.getByRole("heading").textContent())!;
    page.once("dialog", (d) => void d.dismiss());
    await first.getByRole("button", { name: "Usuń pomysł" }).click();
    await page.waitForTimeout(1000);
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  });
});

test.describe("Panel: dodawanie wniosków (aplikacji)", () => {
  test("administrator dodaje wniosek powiązany z pomysłem – pola z fiszki uzupełniają się same", async ({ page }) => {
    await loginAsAdmin(page, "/admin/nabory");
    await page.locator("#aa-nabor").selectOption("nab-1");
    await page.locator("#aa-idea").selectOption("HUB-KINO42");
    await expect(page.locator("#aa-tytul")).toHaveValue("Szkolne Kino Seniora");
    const title = unique("Kino Seniora – wniosek papierowy");
    await page.locator("#aa-tytul").fill(title);
    await page.locator("#aa-dzialania").fill("Pokazy raz w miesiącu");
    await page.locator("#aa-partnerzy").fill("Szkoła, gmina");
    await page.locator("#aa-rezultaty").fill("Liczba widzów");
    await page.locator("#aa-budzet").fill("4000 zł – projektor");
    await page.getByRole("button", { name: "Dodaj wniosek" }).click();
    await expect(page.getByText(/Dodano wniosek \(kod WN-[A-Z0-9]{6}\)\./)).toBeVisible();

    const app = page.locator("li", { has: page.getByRole("heading", { name: title }) });
    await expect(app).toContainText("z fiszki HUB-KINO42");
    await expect(app.getByText("Złożony", { exact: true })).toBeVisible();
  });

  test("brak wymaganego pola → komunikat błędu z serwera", async ({ page }) => {
    await loginAsAdmin(page, "/admin/nabory");
    await page.locator("#aa-nabor").selectOption("nab-1");
    await page.locator("#aa-tytul").evaluate((el) => el.closest("form")!.setAttribute("novalidate", ""));
    await page.locator("#aa-tytul").fill("Wniosek bez treści");
    await page.getByRole("button", { name: "Dodaj wniosek" }).click();
    await expect(page.getByText("Uzupełnij pole: „Jaki problem rozwiązuje projekt?”.")).toBeVisible();
  });

  test("bez logowania nie da się dodać pomysłu ani wniosku", async ({ playwright, baseURL }) => {
    const anon = await playwright.request.newContext({ baseURL });
    const idea = { action: "add-idea", title: "Nieautoryzowany", essence: "Próba bez logowania", audience: "nikt", stage: "pomysl" };
    expect((await anon.post("/api/admin", { data: idea })).status()).toBe(401);
    expect((await anon.post("/api/admin", { data: { action: "add-application", naborId: "nab-1", answers: {} } })).status()).toBe(401);
    expect((await anon.post("/api/admin", { data: { action: "delete-idea", id: "i1" } })).status()).toBe(401);
    await anon.dispose();
    const page = await (await playwright.chromium.launch({ channel: "msedge" })).newPage({ baseURL });
    await page.goto("/admin/pomysly");
    await expect(page).toHaveURL(/\/logowanie\?next=%2Fadmin%2Fpomysly/);
    await page.context().browser()!.close();
  });
});
