# Hub Innowacji Społecznych Małopolski – prototyp

Wyzwanie ROPS Kraków (HackYeah). Brief: `CRITERIA Wojewodztwo Malopolskie HUBMI.pdf`.
Opis rozwiązania, architektura, API i koszt utrzymania: strona **/o-projekcie** w aplikacji.

## Start

Wymagany Node.js >= 20.

```
npm install
npm run dev        # http://localhost:3000
npm run typecheck
npm test           # testy jednostkowe (Vitest)
npm run test:e2e   # testy E2E w Microsoft Edge (Playwright) – panel, aplikacja admina, regresja
```

Panel administratora: `/admin`, hasło demo `demo` (zmienisz w `ADMIN_DEMO_PASSWORD`, patrz `.env.example`).
Przykładowy kod zgłoszenia do strony statusu: `HUB-KINO42`.

## Aplikacja administratora (telefon / komputer)

`/admin/app` – PWA tylko dla zalogowanych administratorów (ten sam mechanizm logowania co panel):
lista nowych pomysłów, podgląd szczegółów i powiadomienia push o każdym nowym pomyśle.

- **Komputer (Edge/Chrome):** otwórz `/admin/app`, kliknij ikonę instalacji w pasku adresu, potem „Włącz powiadomienia”.
- **Android (Chrome):** menu ⋮ → „Zainstaluj aplikację”, potem „Włącz powiadomienia”.
- **iPhone (iOS 16.4+):** Udostępnij → „Do ekranu początkowego”, otwórz aplikację z ekranu i włącz powiadomienia.

Powiadomienia push wymagają HTTPS (lub `localhost`). Klucze VAPID: patrz `.env.example`.

## Mapa wymagań (brief → aplikacja)

| Wymaganie z briefu | Gdzie |
|---|---|
| I Matchmaking: podobne przypadki, informacje o kwestii, gotowe innowacje | `/dopasuj`, `src/lib/matching`, `src/app/api/match` |
| II Zasobnik: wyzwania, Biblioteka (filmy), materiały; trendy tylko dla admina | `/zasobnik`, `/admin#trendy` |
| II Szybka aktualizacja danych | `/admin/wiedza` (dodawanie/publikacja innowacji, wskaźniki) |
| III Fiszka pomysłu (zawsze dostępna) | `/kreator#fiszka` → kod zgłoszenia |
| III Generator wniosków w czasie naboru, wniosek dopasowany do naboru | `/kreator/wniosek`, `/admin/nabory` |
| III Canwy innowacji społecznych | `/kreator/canva` (druk/PDF) |
| III Asystent kreatora | `/kreator#asystent`, `src/lib/ai` |
| IV Tester: testy, ocena, feedback, usprawnienia | `/tester` |
| V Dialog ROPS ↔ użytkownicy, mentorzy, partnerstwa | `/komunikacja` (forum + giełda partnerstw), `/status` (wątek zgłoszenia) |
| VI Panel admina: modyfikacja, weryfikacja, udostępnianie wiedzy | `/admin`, `/admin/wiedza`, `/admin/nabory` (logowanie: `src/middleware.ts`) |
| VII Middleman Innowacji | `/middleman` |
| Powiadamianie admina o nowym pomyśle + ścieżka odpowiedzi do autora | powiadomienia w `/admin`, webhook `NOTIFY_WEBHOOK_URL`, `/status?kod=…` |
| Automatyzacja powiadomień o zmianach w naborach | otwarcie naboru → Aktualności na stronie głównej + zdarzenie/webhook |
| Integracja z innymi systemami | `GET /api/innovations`, `/api/challenges`, `/api/nabory` |
| Bezpieczeństwo danych | brak danych osobowych (kod zamiast konta), walidacja zod, limit zapytań, httpOnly cookie |
| WCAG 2.1 AA | kontrasty, klawiatura, aria-live, A/A+/A++, wersja kontrastowa |
| Koszt utrzymania i zasoby | `/o-projekcie` |

## Dopasowanie do Biblioteki Innowacji Społecznych ROPS

Aplikacja wspiera istniejący system ROPS zamiast tworzyć własny:

- **Kategorie** – 9 kategorii Biblioteki ROPS (seniorzy; dzieci, młodzież i rodzina; rynek pracy; osoby o ograniczonej mobilności;
  z niepełnosprawnością sensoryczną; cudzoziemcy; z niepełnosprawnością intelektualną; w kryzysie bezdomności; zdrowie i medycyna)
  we wszystkich modułach: Biblioteka, matchmaking, fiszki, wnioski, trendy w panelu, giełda partnerstw.
- **Dane** – 114 prawdziwych innowacji z Biblioteki ROPS (`src/lib/data/rops-biblioteka.ts`) z linkami do kart, filmów i materiałów ROPS.
  Bez danych osobowych autorów (karta odsyła do strony ROPS). Odświeżenie: `npm run import:rops`.
- **Karta innowacji** (`/zasobnik/[id]`) i **zgłaszanie** (fiszka w Kreatorze, formularze panelu) według 6 pytań karty ROPS:
  na czym polega rozwiązanie · jakich problemów dotyczy · grupa docelowa · kto może skorzystać · czy to działa · autorzy.
- Linki kategorii (`/zasobnik?kategoria=dla-seniorow`) odpowiadają adresom kategorii ROPS.

## Formularz aplikacyjny ROPS „Inkubator Włączenia Społecznego 2.0”

Definicja i walidacja formularza (Załącznik nr 3): `src/lib/iws.ts`.

- **Fiszka pomysłu** (`/kreator#fiszka`) zadaje pytania z pkt 1 i 3–8 formularza, plus kategorię ROPS. Nie zbiera danych osobowych.
- **Nabór `nab-iws`** (`/kreator/wniosek`) to pełny formularz w 4 krokach:
  - wnioskodawca: osoba, podmiot (NIP/REGON z sumą kontrolną) albo grupa 2–5 partnerów,
  - treść, wczytywana z fiszki po kodzie,
  - plan działania: przygotowanie ≤ 3 mies., testowanie ≤ 9 mies., kwota grantu = suma kosztów,
  - oświadczenia 12 A/B i RODO.
- **Dane wnioskodawcy** widzi tylko administrator (`/admin/nabory`). Nie trafiają do AI ani na stronę statusu.

## Matchmaking z AI

`/api/match` przy ustawionym `ANTHROPIC_API_KEY` wysyła opis problemu do Claude (`claude-opus-5-5`, structured outputs) razem z katalogiem
innowacji i **aktualnymi pomysłami** z magazynu (`data/hub-data.json`; bez odrzuconych i bez kodów zgłoszeń). Model zwraca dopasowania
z uzasadnieniem, podobne pomysły i następny krok (`src/lib/ai/matchmaker.ts`). Publicznie pokazujemy tylko treść zaakceptowanych pomysłów.
Bez klucza, przy błędzie, odmowie modelu lub limicie czasu (30 s) odpowiada dotychczasowy TF-IDF – format odpowiedzi API się nie zmienia
(dochodzą pola `source` i `ai`). Włączony jest `fallbacks: "default"` (beta `server-side-fallback-2026-07-01`). `HUB_AI=off` wyłącza AI.

## AI w Kreatorze pomysłów

- **Asystent fiszki** (`/kreator#fiszka`, przycisk „Sprawdź fiszkę z AI”, `POST /api/ideas/coach`, `src/lib/ai/ideaCoach.ts`):
  - ocenia 7 punktów fiszki tak, jak oceni je komisja IWS 2.0,
  - proponuje treść pustych lub słabych punktów; autor wstawia ją przyciskiem, a „Cofnij” przywraca poprzednią treść,
  - wskazuje podobne innowacje z Biblioteki ROPS (wymóg niepowtarzalności z pkt 4),
  - do AI trafia tylko treść merytoryczna, bez pola „Autorzy”; model ma zakaz wymyślania statystyk.
- **Asystent kreatora i Middleman** (`/api/assistant`, `src/lib/ai/assistant.ts`) dają podpowiedzi z modelu i inspiracje wyłącznie z katalogu Biblioteki.
- **Wspólna warstwa wywołań** (`src/lib/ai/llm.ts`) obsługuje Claude albo Gemini ze schematem Zod.
  Gdy model jest niedostępny, każda funkcja wraca do trybu podstawowego (reguły + TF-IDF).
  Po 429 (wyczerpany limit) model główny Gemini jest pomijany przez 10 minut.

## Decyzje architektoniczne

- **Porty i adaptery** (`HubRepository`, `Matcher`, `Assistant`): prototyp działa w pamięci i lokalnie; produkcja podmienia implementację (PostgreSQL/pgvector, embeddings, LLM) bez zmian w UI.
- **Zdarzenia** (`emit` w `src/lib/store.ts`): każda akcja użytkownika trafia do powiadomień admina i na webhook.
- **Pomysły i wnioski są zapisywane trwale** w `data/hub-data.json` (ścieżka: `HUB_DATA_FILE`). Przy pierwszym uruchomieniu plik powstaje z seeda (`seedIdeas` w `src/lib/data/seed.ts`); reset danych = usunięcie pliku. Administrator zarządza pomysłami w `/admin/pomysly` i dodaje wnioski w `/admin/nabory`.
- Pozostałe dane (innowacje, wiadomości, opinie…) są fikcyjne i wracają do stanu startowego po restarcie serwera.

## Do zrobienia przed oddaniem

Prezentacja PDF (≤10 slajdów) lub film (≤3 min), makiety UX/UI, link do dema, ostateczna nazwa rozwiązania.
