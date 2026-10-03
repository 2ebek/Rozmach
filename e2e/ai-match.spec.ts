import { expect, test } from "@playwright/test";
import { open } from "./helpers";

test.describe("Matchmaking z AI – interfejs", () => {
  test("wyświetla podsumowanie AI, uzasadnienia, podobne pomysły i następny krok", async ({ page }) => {
    // Podstawiamy odpowiedź API (bez kosztów i bez klucza) – sprawdzamy sam interfejs.
    await page.route("**/api/match", (route) =>
      route.fulfill({
        json: {
          source: "ai",
          area: "dla-seniorow",
          similar: [],
          challenge: null,
          results: [
            {
              innovation: { id: "inn-6", title: "Telefoniczny Przyjaciel", summary: "Wolontariusze dzwonią codziennie do samotnych osób starszych.", areas: ["dla-seniorow"], tags: [], stage: "wdrozenie", published: true },
              score: 0.9,
              matchedTerms: [],
              reason: "Osoby, które nie wychodzą z domu, mogą mieć codzienny kontakt bez wychodzenia.",
            },
          ],
          ai: {
            summary: "Szukasz sposobu, żeby starsi sąsiedzi nie byli sami.",
            nextStep: "Porozmawiaj z autorami Telefonicznego Przyjaciela w zakładce Rozmowy.",
            ideas: [
              { status: "zaakceptowany", pending: false, title: "Mapa dostępnych ławek", essence: "Miejsca odpoczynku dla seniorów.", audience: "seniorzy", stage: "pomysl", reason: "Ułatwia wyjście z domu." },
              { status: "nowy", pending: true },
            ],
          },
        },
      }),
    );
    await open(page, "/dopasuj");
    await page.locator("#problem").fill("Starsi sąsiedzi nie wychodzą z domu");
    await page.getByRole("button", { name: "Znajdź rozwiązania" }).click();

    await expect(page.getByText("Dopasowanie AI")).toBeVisible();
    await expect(page.getByText("Szukasz sposobu, żeby starsi sąsiedzi nie byli sami.")).toBeVisible();
    await expect(page.getByText("Osoby, które nie wychodzą z domu, mogą mieć codzienny kontakt bez wychodzenia.")).toBeVisible();
    await expect(page.getByText("Trafność: wysoka")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Podobne pomysły zgłoszone w Hubie" })).toBeVisible();
    await expect(page.getByText("Mapa dostępnych ławek")).toBeVisible();
    await expect(page.getByText("czeka na weryfikację przez zespół Hubu")).toBeVisible();
    await expect(page.getByText("Porozmawiaj z autorami Telefonicznego Przyjaciela")).toBeVisible();
    await expect(page.getByText("asystent AI jest teraz niedostępny")).toHaveCount(0);
  });

  test("bez AI (brak klucza) – wyniki z wyszukiwania słów kluczowych i informacja o tym", async ({ page }) => {
    await open(page, "/dopasuj");
    await page.locator("#problem").fill("Starsi sąsiedzi w naszej wsi czują się samotni");
    await page.getByRole("button", { name: "Znajdź rozwiązania" }).click();
    await expect(page.getByRole("heading", { name: /Znaleźliśmy \d/ })).toBeVisible();
    await expect(page.getByText("Wyniki z wyszukiwania słów kluczowych – asystent AI jest teraz niedostępny.")).toBeVisible();
    await expect(page.getByText("Dopasowanie AI")).toHaveCount(0);
  });
});
