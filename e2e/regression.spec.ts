import { expect, test, type Page } from "@playwright/test";
import { loginAsAdmin, open, unique } from "./helpers";

/** Wiersz planu działania w formularzu IWS 2.0. */
async function fillRow(page: Page, phase: string, i: number, action: string, from: string, to: string, cost: string) {
  const base = `#plan-${phase}-${i}`;
  await page.locator(`${base}-action`).fill(action);
  await page.locator(`${base}-from`).fill(from);
  await page.locator(`${base}-to`).fill(to);
  await page.locator(`${base}-cost`).fill(cost);
}

test.describe("Strony publiczne", () => {
  const PAGES: [string, RegExp][] = [
    ["/", /Zróbmy to z rozmachem/],
    ["/dopasuj", /Znajdź rozwiązanie swojego problemu/],
    ["/zasobnik", /Wiedza o wyzwaniach/],
    ["/kreator", /Masz pomysł na zmianę/],
    ["/kreator/canva", /Canva innowacji społecznej/],
    ["/zasobnik/rops-bawita", /BaWita/],
    ["/kreator/wniosek", /Inkubator Włączenia Społecznego 2.0|Razem przeciw samotności|Brak otwartych naborów/],
    ["/tester", /Oceń rozwiązanie/],
    ["/komunikacja", /Zapytaj, podpowiedz/],
    ["/middleman", /Zamień sprawdzoną innowację/],
    ["/status", /Co dzieje się z moim zgłoszeniem/],
    ["/o-projekcie", /Hub Innowacji Społecznych Małopolski/],
    ["/logowanie", /Logowanie dla zespołu Hubu/],
  ];
  for (const [path, h1] of PAGES) {
    test(`${path} ładuje się bez błędów`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(h1);
      expect(errors).toEqual([]);
    });
  }
});

test.describe("Kluczowe scenariusze", () => {
  test("matchmaking: opis problemu → propozycje, wyjaśnienie, podobne przypadki, wyzwanie", async ({ page }) => {
    await open(page, "/dopasuj");
    await page.locator("#problem").fill("Seniorzy boją się biletomatów i kiosków samoobsługowych");
    await page.getByRole("button", { name: "Znajdź rozwiązania" }).click();
    await expect(page.getByRole("heading", { name: /Znaleźliśmy \d/ })).toBeVisible();
    await expect(page.locator("ol li h3").first()).toHaveText("Merkury");
    // karta wyniku prowadzi do karty innowacji w układzie Biblioteki ROPS
    await page.getByRole("link", { name: /Karta innowacji/ }).first().click();
    await expect(page.getByRole("heading", { level: 1, name: "Merkury" })).toBeVisible();
    await expect(page.getByText("2. Jakich problemów dotyczy innowacja?")).toBeVisible();
    await expect(page.getByRole("link", { name: /Karta w Bibliotece ROPS/ })).toHaveAttribute("href", /rops\.krakow\.pl/);
    // „Wstecz” wraca do tych samych wyników (z pamięci karty – bez ponownego zapytania)
    let refetched = false;
    page.on("request", (r) => r.url().includes("/api/match") && (refetched = true));
    await page.goBack();
    await expect(page).toHaveURL(/\/dopasuj\?q=/);
    await expect(page.locator("ol li h3").first()).toHaveText("Merkury");
    expect(refetched).toBe(false);
    await expect(page.getByText("Dlaczego ta propozycja?").first()).toBeVisible();
    await expect(page.getByText("Co wiemy o tym wyzwaniu")).toBeVisible();
    await expect(page.getByText("Inni zgłaszali podobny problem")).toBeVisible();
  });

  test("„Co chcesz zmienić?” na stronie głównej od razu pokazuje wyniki (krok 2)", async ({ page }) => {
    await open(page, "/");
    await page.locator("#need-title").fill("kiosk samoobsługowy");
    await page.locator("#need-area").selectOption("dla-seniorow");
    await page.getByRole("button", { name: "Dalej" }).click();
    await expect(page).toHaveURL(/\/dopasuj\?q=kiosk.*area=dla-seniorow/);
    await expect(page.locator("ol li h3").first()).toHaveText("Merkury");
  });

  test("strona główna: szkic potrzeby zostaje w przeglądarce, filtr inspiracji, menu na telefonie", async ({ page }) => {
    await open(page, "/");
    await page.locator("#need-title").fill("Brak ławek przy przystanku");
    await page.getByRole("button", { name: "Zapisz szkic" }).click();
    await expect(page.getByText("Szkic zapisany w tej przeglądarce.")).toBeVisible();
    await page.reload();
    await expect(page.locator("#need-title")).toHaveValue("Brak ławek przy przystanku");

    await page.getByRole("button", { name: "Dostępność", exact: true }).click();
    await expect(page.getByRole("heading", { level: 3, name: "Mapa dostępnej okolicy" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "Sąsiedzki krąg spotkań" })).toHaveCount(0);

    await page.setViewportSize({ width: 390, height: 800 });
    await page.getByRole("button", { name: "Menu" }).click();
    await page.locator("#menu-mobile").getByRole("link", { name: "Tester" }).click();
    await expect(page).toHaveURL(/\/tester$/);
  });

  test("fiszka → kod → status → decyzja i odpowiedź admina → odpowiedź autora → wniosek z fiszki", async ({ page, browser }) => {
    const title = unique("Fiszka regresji");
    await open(page, "/kreator");
    await page.locator("#idea-title").fill(title);
    await page.locator("#idea-category").selectOption("dla-seniorow");
    await page.locator("#idea-essence").fill("Sąsiedzi pomagają seniorom w zakupach i rozmowie");
    await page.locator("#idea-problem").fill("Samotni seniorzy nie mają kogo poprosić o pomoc w zakupach");
    await page.locator("#idea-audience").fill("Samotni seniorzy w gminie wiejskiej bez rodziny w pobliżu");
    await page.locator("#idea-innovativeness").fill("W gminie nie ma żadnej sąsiedzkiej sieci pomocy dla seniorów");
    await page.getByRole("button", { name: "Wyślij fiszkę" }).click();
    const code = (await page.locator("code").first().textContent())!.trim();
    expect(code).toMatch(/^HUB-[A-Z0-9]{6}$/);

    const statusLink = page.getByRole("status").getByRole("link", { name: "Sprawdź status zgłoszenia" });
    await expect(statusLink).toHaveAttribute("href", `/status?kod=${code}`);
    await statusLink.click();
    await expect(page.getByRole("heading", { level: 2, name: title })).toBeVisible();
    await expect(page.getByText("Nowy", { exact: true })).toBeVisible();

    // administrator akceptuje i odpowiada (osobna sesja przeglądarki)
    const adminCtx = await browser.newContext();
    const admin = await adminCtx.newPage();
    await loginAsAdmin(admin);
    // nowa fiszka jest w kolejce „Nieprzejrzane”; po akceptacji przechodzi do „Zaakceptowane”
    const queues = admin.getByRole("navigation", { name: "Kolejki fiszek" });
    await expect(queues.getByRole("link", { name: /Nieprzejrzane/ })).toHaveAttribute("aria-current", "page");
    const card = admin.locator("#kolejka li", { has: admin.getByRole("heading", { name: title }) });
    await card.getByRole("button", { name: "Akceptuj" }).click();
    await expect(card).toHaveCount(0);
    await queues.getByRole("link", { name: /Zaakceptowane/ }).click();
    await expect(queues.getByRole("link", { name: /Zaakceptowane/ })).toHaveAttribute("aria-current", "page");
    await expect(card.getByText("Zaakceptowany")).toBeVisible();
    await card.locator("summary").click();
    await card.getByLabel("Odpowiedz autorowi").fill("Gratulacje, zapraszamy do naboru!");
    await card.getByRole("button", { name: "Wyślij" }).click();
    await expect(card.getByText("Gratulacje, zapraszamy do naboru!")).toBeVisible();
    await adminCtx.close();

    // autor widzi decyzję i odpowiedź, odpisuje
    await open(page, `/status?kod=${code}`);
    await expect(page.getByText("Zaakceptowany", { exact: true })).toBeVisible();
    await expect(page.getByText("Gratulacje, zapraszamy do naboru!")).toBeVisible();
    await page.getByLabel("Twoja odpowiedź").fill("Dziękujemy, składamy wniosek.");
    await page.getByRole("button", { name: "Wyślij" }).click();
    await expect(page.getByText("Dziękujemy, składamy wniosek.")).toBeVisible();

    // generator wniosku (formularz ROPS IWS 2.0) z treścią fiszki
    await page.getByRole("link", { name: "Przygotuj wniosek" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Inkubator Włączenia Społecznego 2.0");
    await expect(page.getByText(`Wczytano treść z fiszki ${code}.`)).toBeVisible();
    await page.getByRole("button", { name: "Wstaw dane przykładowe" }).click();
    await page.getByRole("button", { name: "Dalej" }).click();

    await expect(page.locator("#iws-tytul")).toHaveValue(title);
    await expect(page.locator("#iws-diagnoza")).toHaveValue("Samotni seniorzy nie mają kogo poprosić o pomoc w zakupach");
    await expect(page.locator("#iws-innowacyjnosc")).toHaveValue(/sąsiedzkiej sieci/);
    await page.locator("#iws-zmiana").fill("Seniorzy mają do kogo zadzwonić i rzadziej czują się samotni");
    await page.locator("#iws-wizja").fill("Model da się przenieść do każdej gminy z aktywnym KGW");
    await page.locator("#iws-zespol").fill("Koło Gospodyń Wiejskich i wolontariusze z doświadczeniem w pracy z seniorami");
    await page.getByRole("button", { name: "Dalej" }).click();

    await fillRow(page, "preparation", 0, "Rekrutacja seniorów i wolontariuszy", "2027-01", "2027-02", "1500");
    await fillRow(page, "testPhase1", 0, "Cotygodniowe dyżury pomocy", "2027-03", "2027-08", "6000");
    await expect(page.locator("#plan-total")).toContainText("7500,00");
    await expect(page.locator("#grant-amount")).toHaveValue("7500");
    await page.getByRole("button", { name: "Dalej" }).click();

    await page.getByLabel("Zaznacz wszystkie oświadczenia").check();
    await page.getByLabel("Zapoznałem/am się z klauzulami informacyjnymi RODO.").check();
    await page.getByRole("button", { name: "Złóż wniosek" }).click();
    await expect(page.locator("code").first()).toHaveText(/^WN-[A-Z0-9]{6}$/);
  });

  test("daty w czasie polskim niezależnie od strefy przeglądarki i serwera (bez błędów hydracji)", async ({ browser }) => {
    // Na Vercelu serwer działa w UTC – różne strefy dawały inne godziny w HTML i w przeglądarce (React #418/#425).
    const ctx = await browser.newContext({ timezoneId: "America/New_York" });
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const path of ["/status?kod=HUB-KINO42", "/komunikacja"]) {
      await page.goto(path, { waitUntil: "networkidle" });
    }
    expect(errors).toEqual([]);
    await ctx.close();
  });

  test("odrzucona fiszka z komentarzem zespołu: czerwony status i uzasadnienie u autora", async ({ page, browser }) => {
    const title = unique("Fiszka odrzucana");
    await open(page, "/kreator");
    await page.locator("#idea-title").fill(title);
    await page.locator("#idea-category").selectOption("dla-seniorow");
    await page.locator("#idea-essence").fill("Opis pomysłu do testu odrzucenia fiszki");
    await page.locator("#idea-problem").fill("Problem do testu odrzucenia fiszki");
    await page.locator("#idea-audience").fill("Odbiorcy testu odrzucenia fiszki");
    await page.getByRole("button", { name: "Wyślij fiszkę" }).click();
    const code = (await page.locator("code").first().textContent())!.trim();

    const adminCtx = await browser.newContext();
    const admin = await adminCtx.newPage();
    await loginAsAdmin(admin);
    const card = admin.locator("#kolejka li", { has: admin.getByRole("heading", { name: title }) });
    await card.getByRole("button", { name: "Dodaj komentarz" }).click();
    await card.getByLabel("Komentarz zespołu do fiszki").fill("Podobna innowacja jest już w Bibliotece ROPS.");
    await card.getByRole("button", { name: "Zapisz komentarz" }).click();
    await expect(card.locator("[data-comment]")).toContainText("Podobna innowacja jest już w Bibliotece ROPS.");
    await card.getByRole("button", { name: "Odrzuć" }).click();
    await expect(card).toHaveCount(0);
    await adminCtx.close();

    await open(page, `/status?kod=${code}`);
    const badge = page.getByText("Odrzucony", { exact: true });
    await expect(badge).toHaveClass(/bg-red-100/);
    await expect(page.getByText("Fiszka została odrzucona.")).toBeVisible();
    await expect(page.getByText("Decyzja: odrzucone")).toBeVisible();
    await expect(page.locator("[data-comment]")).toContainText("Podobna innowacja jest już w Bibliotece ROPS.");
  });

  test("wniosek IWS 2.0: limity okresów i kwoty grantu, podmiot z oświadczeniami B, dane widoczne tylko w panelu", async ({ page, browser }) => {
    await open(page, "/kreator/wniosek?nabor=nab-iws");
    await page.getByLabel("Podmiot (organizacja, firma, instytucja)").check();
    await page.getByRole("button", { name: "Wstaw dane przykładowe" }).click();
    await page.getByRole("button", { name: "Dalej" }).click();
    const title = unique("Wniosek IWS podmiotu");
    await page.locator("#iws-tytul").fill(title);
    for (const id of ["opis", "innowacyjnosc", "diagnoza", "odbiorcy", "zmiana", "wizja", "zespol"]) await page.locator(`#iws-${id}`).fill(`Treść punktu ${id} – opis wystarczająco długi.`);
    await page.getByRole("button", { name: "Dalej" }).click();

    await fillRow(page, "preparation", 0, "Przygotowanie", "2027-01", "2027-04", "1000"); // 4 miesiące – za długo
    await fillRow(page, "testPhase1", 0, "Test", "2027-05", "2027-10", "2000");
    await page.getByRole("button", { name: "Dalej" }).click();
    await expect(page.getByText("Oświadczenia reprezentanta podmiotu")).toBeVisible();
    await expect(page.locator("ol li input[type=checkbox]")).toHaveCount(21);
    await page.getByLabel("Zaznacz wszystkie oświadczenia").check();
    await page.getByLabel("Zapoznałem/am się z klauzulami informacyjnymi RODO.").check();
    await page.getByRole("button", { name: "Złóż wniosek" }).click();
    await expect(page.getByText("Okres przygotowawczy nie może przekroczyć 3 miesięcy.")).toBeVisible();

    await page.getByRole("button", { name: "Wstecz" }).click();
    await page.locator("#plan-preparation-0-to").fill("2027-03");
    await page.locator("#grant-amount").fill("2500");
    await page.getByRole("button", { name: "Dalej" }).click();
    await page.getByRole("button", { name: "Złóż wniosek" }).click();
    await expect(page.getByText(/musi być równa sumie kosztów/)).toBeVisible();

    await page.getByRole("button", { name: "Wstecz" }).click();
    await page.locator("#grant-amount").fill("3000");
    await page.getByRole("button", { name: "Dalej" }).click();
    await page.getByRole("button", { name: "Złóż wniosek" }).click();
    const appCode = (await page.locator("code").first().textContent())!.trim();
    expect(appCode).toMatch(/^WN-[A-Z0-9]{6}$/);

    // publiczny status nie pokazuje danych wnioskodawcy
    await open(page, `/status?kod=${appCode}`);
    await expect(page.getByRole("heading", { level: 2, name: title })).toBeVisible();
    await expect(page.getByText("Fundacja Przykładowa")).toHaveCount(0);

    // administrator widzi dane, plan i oświadczenia
    const adminCtx = await browser.newContext();
    const admin = await adminCtx.newPage();
    await loginAsAdmin(admin, "/admin/nabory");
    const card = admin.locator("li", { has: admin.getByRole("heading", { name: title }) });
    await card.getByText("Wnioskodawca, plan działania i oświadczenia").click();
    await expect(card.getByText("Fundacja Przykładowa (dane fikcyjne)")).toBeVisible();
    await expect(card.getByText(/Wnioskowana kwota grantu: 3000,00/)).toBeVisible();
    await expect(card.getByText(/Złożono 21 z 21 oświadczeń z pkt 12 B/)).toBeVisible();
    await adminCtx.close();
  });

  test("asystent fiszki: ocena punktów IWS pod polami i podobne innowacje (tryb bez AI)", async ({ page }) => {
    await open(page, "/kreator");
    await page.locator("#idea-title").fill("Kiosk dla seniorów");
    await page.locator("#idea-category").selectOption("dla-seniorow");
    await page.locator("#idea-essence").fill("Nauka obsługi kiosku samoobsługowego i biletomatu dla seniorów");
    await page.getByRole("button", { name: "Sprawdź fiszkę z AI" }).click();
    await expect(page.getByText("Podpowiedzi bez AI (tryb podstawowy)")).toBeVisible();
    await expect(page.locator('[data-coach="diagnoza"]')).toContainText("Brakuje");
    await expect(page.locator('[data-coach="opis"]')).toContainText("Do rozwinięcia");
    await expect(page.getByText("Podobne innowacje w Bibliotece ROPS")).toBeVisible();
    await expect(page.getByRole("link", { name: /Merkury/ })).toBeVisible();
  });

  test("fiszka: prawdziwe dane IOSS dla gminy przy diagnozie – wstawienie, cofnięcie i propozycja asystenta", async ({ page }) => {
    await open(page, "/kreator");
    await page.locator("#idea-title").fill("Kino Seniora");
    await page.locator("#idea-category").selectOption("dla-seniorow");
    await page.locator("#idea-place").selectOption("g-bochenski-drwinia");
    const panel = page.locator("[data-ioss]");
    await expect(panel.getByText("Udział osób w wieku 60+ w liczbie ludności", { exact: true })).toBeVisible();
    await expect(panel.getByText(/powiat bocheński: [\d,]+% · mediana powiatów Małopolski/).first()).toBeVisible();

    await panel.getByRole("button", { name: /Wstaw do diagnozy – Udział osób w wieku 60\+/ }).click();
    await expect(page.locator("#idea-problem")).toHaveValue(/gmina Drwinia: [\d,]+%.*Internetowy Obserwator Statystyk Społecznych ROPS, dane za \d{4} r\./);
    await expect(panel.getByRole("button", { name: /Wstawiono do diagnozy/ })).toBeDisabled();
    await panel.getByRole("button", { name: "Cofnij zmianę w diagnozie" }).click();
    await expect(page.locator("#idea-problem")).toHaveValue("");

    // asystent (tryb bez AI) proponuje diagnozę z tymi samymi wskaźnikami – bez wymyślonych liczb
    await page.locator("#idea-essence").fill("Raz w miesiącu szkoła udostępnia aulę na pokaz filmu dla seniorów.");
    await page.getByRole("button", { name: "Sprawdź fiszkę z AI" }).click();
    const note = page.locator('[data-coach="diagnoza"]');
    await expect(note).toContainText("gmina Drwinia");
    await note.getByRole("button", { name: /Wstaw propozycję/ }).click();
    await expect(page.locator("#idea-problem")).toHaveValue(/Udział osób w wieku 60\+ w liczbie ludności – gmina Drwinia/);
  });

  test("Zasobnik: Mapa Wyzwań z prawdziwymi wskaźnikami IOSS", async ({ page }) => {
    await open(page, "/zasobnik");
    const wyzwania = page.locator("#wyzwania");
    await expect(wyzwania.getByRole("link", { name: /Źródło: IOSS ROPS/ })).toHaveCount(6);
    await expect(wyzwania.getByText(/Mediana 22 powiatów; od [\d,]+% \(powiat/).first()).toBeVisible();
    await expect(wyzwania.getByText(/przykład/i)).toHaveCount(0);
  });

  test("tester: ocena gwiazdkowa i zgłoszenie do testów", async ({ page }) => {
    await open(page, "/tester");
    await page.locator("#fb-category").selectOption("dla-seniorow");
    await page.locator("#fb-innovation").selectOption("rops-merkury");
    await expect(page.getByText("Merkury – ")).toBeVisible();
    await page.locator("label", { hasText: "4 na 5" }).click();
    await page.getByText("Chcę wziąć udział w testach tej innowacji").click();
    await page.getByRole("button", { name: "Wyślij opinię" }).click();
    await expect(page.getByText("Zapisaliśmy opinię i zgłoszenie do testów")).toBeVisible();
  });

  test("forum i giełda partnerstw", async ({ page }) => {
    const msg = unique("Wiadomość testowa");
    await open(page, "/komunikacja");
    await page.locator("#chat-author").fill("Tester");
    await page.locator("#chat-text").fill(msg);
    await page.getByRole("button", { name: "Wyślij" }).click();
    await expect(page.getByText(msg)).toBeVisible();

    const offer = unique("Oferujemy salę na spotkania");
    await page.locator("#p-org").fill("Dom Kultury (test)");
    await page.locator("#p-text").fill(offer);
    await page.getByRole("button", { name: "Opublikuj" }).click();
    await expect(page.getByText(offer)).toBeVisible();
  });

  test("ekspert: logowanie, podpisany komentarz do fiszki, autor widzi go na stronie statusu", async ({ page, browser }) => {
    const ctx = await browser.newContext();
    const expert = await ctx.newPage();
    await expert.goto("/ekspert");
    await expert.getByLabel("Hasło dla ekspertów").fill("ekspert");
    await expert.getByRole("button", { name: "Zaloguj się" }).click();
    await expect(expert.getByRole("heading", { name: "Fiszki do konsultacji" })).toBeVisible();
    // czekamy, aż strona reaguje (hydracja) – kliknięcie wcześniej przepada
    const all = expert.getByRole("button", { name: /^Wszystkie/ });
    await expect(async () => {
      await all.click();
      await expect(all).toHaveAttribute("aria-pressed", "true", { timeout: 1000 });
    }).toPass();
    await expert.getByLabel("Twój podpis pod komentarzami").fill("Mentor ds. usług dla seniorów");
    const comment = unique("Zaproście do współpracy Uniwersytet Trzeciego Wieku");
    const card = expert.locator("li", { has: expert.getByRole("heading", { name: "Szkolne Kino Seniora", exact: true }) });
    // rozwiń rozmowę, jeśli fiszka ma już komentarz eksperta (wtedy jest zwinięta)
    if ((await card.locator("details").getAttribute("open")) === null) await card.locator("summary").click();
    await card.getByLabel("Komentarz eksperta dla autora").fill(comment);
    await card.getByRole("button", { name: "Wyślij" }).click();
    // po wysłaniu rozmowa zostaje rozwinięta, a komentarz jest widoczny z podpisem
    await expect(card.locator('[data-from="expert"]', { hasText: comment })).toContainText("Mentor ds. usług dla seniorów");
    await ctx.close();

    await open(page, "/status?kod=HUB-KINO42");
    const msg = page.locator('[data-from="expert"]', { hasText: comment });
    await expect(msg).toContainText("Ekspert Hubu · Mentor ds. usług dla seniorów");
  });

  test("wizualizacja pomysłu: pole opisu i informacja o płatnym planie AI (przycisk wyłączony)", async ({ page }) => {
    await open(page, "/kreator#asystent");
    const viz = page.locator("[data-visualization]");
    await viz.getByLabel("Co ma przedstawiać wizualizacja?").fill("Szafka z grami na kółkach w świetlicy");
    await expect(viz.getByText("0 / 1000 znaków")).toHaveCount(0);
    await viz.getByText("Plakat informacyjny").click();
    await expect(viz.getByText("Generowanie obrazów wymaga płatnego planu AI.")).toBeVisible();
    await expect(viz.getByRole("button", { name: "Wygeneruj wizualizację" })).toBeDisabled();
  });

  test("asystent kreatora i Middleman zwracają podpowiedzi", async ({ page }) => {
    await open(page, "/kreator");
    await page.locator("#develop-idea-input").fill("Uczniowie uczą seniorów obsługi smartfona");
    await page.getByRole("button", { name: "Podpowiedz mi" }).click();
    await expect(page.getByText("Podpowiedzi asystenta")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Zainspiruj się" })).toBeVisible();

    await open(page, "/middleman");
    await page.locator("#adapt-innovation-input").fill("BaWita");
    await page.getByRole("button", { name: "Przygotuj szkic usługi" }).click();
    await expect(page.getByRole("heading", { name: "Forma usługi" })).toBeVisible();
  });

  test("Zasobnik: filtr Biblioteki", async ({ page }) => {
    await open(page, "/zasobnik");
    const status = page.locator("#biblioteka p[aria-live=polite]");
    const all = await status.textContent();
    await page.getByRole("button", { name: /^Cudzoziemcy/ }).click();
    await expect(status).not.toHaveText(all!);
    await expect(page.getByRole("heading", { name: "Bajkala" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "BaWita" })).toHaveCount(0);
  });

  test("karta innowacji: pytania numerowane po kolei, także gdy karta ROPS nie ma któregoś pytania", async ({ page }) => {
    // Therapy Set nie ma „Czy to działa?”, OSA i ECO puzzle – „Grupy docelowej”
    for (const id of ["rops-therapy-set", "rops-osa-i-eco-puzzle", "rops-bawita"]) {
      await open(page, `/zasobnik/${id}`);
      const numbers = (await page.locator("main dt").allInnerTexts()).map((t) => Number(t.match(/^(\d+)\./)?.[1]));
      expect(numbers, id).toEqual(numbers.map((_, i) => i + 1));
      await expect(page.locator("main dt").last()).toHaveText(/\d+\. Autorzy/);
    }
  });

  test("Zasobnik: link z kategorią ROPS otwiera przefiltrowaną Bibliotekę", async ({ page }) => {
    await open(page, "/zasobnik?kategoria=dla-osob-w-kryzysie-bezdomnosci");
    await expect(page.getByRole("button", { name: /^Osoby w kryzysie bezdomności/ })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("heading", { name: "Szlakiem ludzi bezdomnych" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "BaWita" })).toHaveCount(0);
  });

  test("Canva zapisuje szkic w przeglądarce", async ({ page }) => {
    await open(page, "/kreator/canva");
    await page.locator("#canva-problem").fill("Samotność seniorów w małej wsi");
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#canva-problem")).toHaveValue("Samotność seniorów w małej wsi");
  });

  test("pasek dostępności: powiększenie tekstu i wersja kontrastowa", async ({ page }) => {
    await open(page, "/");
    await page.getByRole("button", { name: "A++" }).click();
    expect(await page.evaluate(() => document.documentElement.style.fontSize)).toBe("125%");
    await page.getByRole("button", { name: "Wersja kontrastowa" }).click();
    await expect(page.locator("html")).toHaveClass(/hc/);
    // przywrócenie ustawień
    await page.getByRole("button", { name: "Wersja kontrastowa" }).click();
    await page.getByRole("button", { name: "A", exact: true }).click();
  });
});

test.describe("Administrator: wiedza i nabory", () => {
  test("dodana innowacja trafia do Biblioteki i do matchmakingu", async ({ page }) => {
    const title = unique("Innowacja e2e Rowerownia");
    await loginAsAdmin(page, "/admin/wiedza");
    await page.locator("#ai-title").fill(title);
    await page.locator("#ai-summary").fill("Sąsiedzka naprawa rowerów dla dzieci z rodzin wielodzietnych");
    await page.locator("label").filter({ hasText: /^Seniorzy$/ }).click();
    await page.locator("#ai-tags").fill("rower, naprawa, warsztat");
    await page.getByRole("button", { name: "Dodaj do Biblioteki" }).click();
    await expect(page.getByText("innowacja jest już widoczna")).toBeVisible();

    await open(page, "/zasobnik");
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await open(page, "/dopasuj?q=" + encodeURIComponent("naprawa rowerów dla dzieci"));
    // wcześniejsze uruchomienia testów mogły dodać identyczne innowacje – liczy się obecność nowej w wynikach
    await expect(page.locator("ol li h3", { hasText: title })).toBeVisible();
  });

  test("otwarcie naboru pokazuje go w Aktualnościach i w generatorze; zamknięcie chowa", async ({ page }) => {
    await loginAsAdmin(page, "/admin/nabory");
    const card = page.locator("li", { has: page.getByRole("heading", { name: "Cyfrowa Małopolska bez barier (przykład)" }) });
    await card.getByRole("button", { name: "Otwórz nabór" }).click();
    await expect(card.getByText("Otwarty", { exact: true })).toBeVisible();

    await open(page, "/");
    await expect(page.getByRole("link", { name: "Cyfrowa Małopolska bez barier (przykład)" })).toBeVisible();

    await open(page, "/admin/nabory");
    await card.getByRole("button", { name: "Zamknij nabór" }).click();
    await expect(card.getByText("Zamknięty", { exact: true })).toBeVisible();
    await open(page, "/");
    await expect(page.getByRole("link", { name: "Cyfrowa Małopolska bez barier (przykład)" })).toHaveCount(0);
  });

  test("powiadomienia w panelu: nowa fiszka pojawia się jako nieprzeczytana", async ({ page, request }) => {
    const title = unique("Fiszka powiadomienie");
    await request.post("/api/ideas", { data: { title, essence: "Sprawdzenie powiadomień w panelu", audience: "admin", stage: "pomysl" } });
    await loginAsAdmin(page);
    await expect(page.getByRole("link", { name: `Nowa fiszka: „${title}”` })).toBeVisible();
    await page.getByRole("button", { name: "Oznacz wszystkie jako przeczytane" }).click();
    await expect(page.getByRole("button", { name: "Oznacz wszystkie jako przeczytane" })).toHaveCount(0);
  });
});
