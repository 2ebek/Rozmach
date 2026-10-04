import type { Challenge, IdeaCard, Innovation, Nabor, Resource, ThreadMessage } from "../types";
import { challengeIndicator } from "../ioss";
import { iwsQuestions } from "../iws";
import { AREAS } from "../labels";
import examples from "./fiszki-przykladowe.json";
import { ropsInnovations } from "./rops-biblioteka";

/** Innowacje z Biblioteki Innowacji Społecznych ROPS (rops-biblioteka.ts). */
export const innovations: Innovation[] = ropsInnovations;

/**
 * Wyzwania regionu w kategoriach ROPS. Wskaźniki są PRAWDZIWE – z Internetowego Obserwatora Statystyk Społecznych ROPS
 * (src/lib/data/ioss-wskazniki.ts, odświeżane: npm run import:ioss). Opisy wyzwań są robocze.
 */
export const challenges: Challenge[] = [
  {
    id: "ch-1",
    area: "dla-seniorow",
    title: "Starzenie się i samotność seniorów",
    description: "Rośnie liczba osób starszych, które mieszkają same i potrzebują wsparcia, opieki i okazji do kontaktu z innymi.",
    indicator: challengeIndicator(257),
  },
  {
    id: "ch-2",
    area: "dla-dzieci-mlodziezy-i-rodziny",
    title: "Rodziny potrzebujące wsparcia w opiece i wychowaniu",
    description: "Część rodzin nie radzi sobie z opieką nad dziećmi i prowadzeniem domu – potrzebują wsparcia blisko miejsca zamieszkania, zanim dojdzie do kryzysu.",
    indicator: challengeIndicator(38),
  },
  {
    id: "ch-3",
    area: "dla-osob-o-ograniczonej-mobilnosci",
    title: "Dostępność usług i przestrzeni",
    description: "Bariery architektoniczne i transportowe utrudniają codzienne życie osobom z niepełnosprawnościami i o ograniczonej mobilności.",
    indicator: challengeIndicator(215),
  },
  {
    id: "ch-4",
    area: "dla-rynku-pracy",
    title: "Długotrwałe bezrobocie",
    description: "Osobom długo pozostającym bez pracy coraz trudniej do niej wrócić – potrzebują wsparcia dopasowanego do ich sytuacji.",
    indicator: challengeIndicator(189),
  },
  {
    id: "ch-5",
    area: "dla-cudzoziemcow",
    title: "Integracja cudzoziemców",
    description: "Bariera językowa i nieznajomość lokalnych usług utrudniają cudzoziemcom codzienne funkcjonowanie.",
    indicator: challengeIndicator(99),
  },
  {
    id: "ch-6",
    area: "dla-osob-w-kryzysie-bezdomnosci",
    title: "Kryzys bezdomności",
    description: "Osoby w kryzysie bezdomności potrzebują nie tylko schronienia, ale i drogi do własnego mieszkania i pracy.",
    indicator: challengeIndicator(34),
  },
];

export const resources: Resource[] = [
  { id: "res-1", title: "Biblioteka Innowacji Społecznych ROPS – wszystkie kategorie", kind: "poradnik", url: "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/kategorie", areas: [] },
  { id: "res-2", title: "Canva Innowacji Społecznych", kind: "canva", url: "/kreator/canva", areas: [] },
  // Materiały ROPS Kraków (strony sprawdzone 4.10.2026)
  { id: "res-3", title: "Publikacje ze świata innowacji społecznych (ROPS)", kind: "poradnik", url: "https://rops.krakow.pl/innowacje-spoleczne/publikacje-ze-swiata-innowacji", areas: [] },
  { id: "res-4", title: "Innowacje w małopolskich modelach usług (ROPS)", kind: "poradnik", url: "https://rops.krakow.pl/innowacje-spoleczne/innowacje-w-malopolskich-modelach", areas: [] },
  { id: "res-5", title: "Raporty z badań ROPS Kraków", kind: "raport", url: "https://rops.krakow.pl/badania-analizy-raporty/raporty-z-badan", areas: [] },
  { id: "res-6", title: "Ocena zasobów pomocy społecznej w województwie małopolskim", kind: "raport", url: "https://rops.krakow.pl/badania-analizy-raporty/ocena-zasobow-pomocy-spolecznej-w-woj-malopolskim/biezaca-ocena", areas: [] },
  { id: "res-7", title: "Internetowy Obserwator Statystyk Społecznych – wskaźniki dla gmin i powiatów", kind: "raport", url: "https://obserwator.rops.krakow.pl/", areas: [] },
  { id: "res-8", title: "Ewaluacja krok po kroku – jak sprawdzić, czy innowacja działa (ROPS)", kind: "poradnik", url: "https://rops.krakow.pl/badania-analizy-raporty/ewaluacja/czym-jest-ewaluacja", areas: [] },
];

/**
 * Nabory. Pierwszy odpowiada formularzowi aplikacyjnemu ROPS „Inkubator Włączenia Społecznego 2.0” (Załącznik nr 3);
 * jego termin jest PRZYKŁADOWY. Pozostałe są FIKCYJNE – w produkcji z systemu grantowego Hubu (integracja).
 */
export const nabory: Nabor[] = [
  {
    id: "nab-iws",
    title: "Inkubator Włączenia Społecznego 2.0 – nabór pomysłów",
    description:
      "Nabór pomysłów na innowacje społeczne wspierające włączenie społeczne (FERS 2021–2027, Działanie 5.1). Formularz jak Załącznik nr 3 do Ogłoszenia ROPS: okres przygotowawczy do 3 miesięcy, testowanie do 9 miesięcy.",
    areas: [...AREAS],
    deadline: "2026-12-31",
    open: true,
    formType: "rops-iws",
    questions: iwsQuestions(),
  },
  {
    id: "nab-1",
    title: "Małe granty: Razem przeciw samotności (przykład)",
    description: "Wsparcie dla pomysłów, które łączą ludzi i zmniejszają samotność – szczególnie osób starszych.",
    areas: ["dla-seniorow"],
    deadline: "2026-10-31",
    open: true,
    questions: [
      { id: "tytul", label: "Tytuł projektu", maxLength: 120, prefillFrom: "title" },
      { id: "problem", label: "Jaki problem rozwiązuje projekt?", hint: "Kogo dotyczy i jak duży jest problem w Twojej okolicy.", maxLength: 1200, prefillFrom: "problem" },
      { id: "odbiorcy", label: "Odbiorcy i sposób dotarcia", maxLength: 800, prefillFrom: "audience" },
      { id: "dzialania", label: "Działania i harmonogram (3–6 miesięcy)", maxLength: 1500 },
      { id: "partnerzy", label: "Partnerzy (gmina, CUS, organizacje, szkoły)", maxLength: 600 },
      { id: "rezultaty", label: "Jak zmierzysz efekty?", hint: "Np. liczba uczestników, ankieta przed i po.", maxLength: 800 },
      { id: "budzet", label: "Szacunkowy budżet (zł) i główne koszty", maxLength: 600 },
    ],
  },
  {
    id: "nab-2",
    title: "Cyfrowa Małopolska bez barier (przykład)",
    description: "Pomysły na zmniejszanie wykluczenia cyfrowego. Nabór wkrótce.",
    areas: ["dla-seniorow", "dla-osob-z-niepelnosprawnoscia-sensoryczna"],
    deadline: "2026-12-15",
    open: false,
    questions: [
      { id: "tytul", label: "Tytuł projektu", maxLength: 120, prefillFrom: "title" },
      { id: "problem", label: "Opis problemu", maxLength: 1200, prefillFrom: "essence" },
      { id: "odbiorcy", label: "Odbiorcy", maxLength: 800, prefillFrom: "audience" },
      { id: "dostepnosc", label: "Jak zapewnisz dostępność dla osób z niepełnosprawnościami?", maxLength: 800 },
      { id: "budzet", label: "Budżet (zł)", maxLength: 600 },
    ],
  },
];

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

/**
 * FIKCYJNE pomysły startowe (dawniej wpisane na sztywno w store.ts).
 * Trafiają do trwałego magazynu przy pierwszym uruchomieniu (patrz persist.ts) – potem zarządza nimi panel.
 */
export function seedIdeas(): IdeaCard[] {
  return [
    {
      id: "i1",
      code: "HUB-DEMO23",
      title: "Wymiana usług sąsiedzkich",
      category: "dla-seniorow",
      problem: "Seniorów i młode rodziny nie stać na drobne usługi, a sąsiedzi nie wiedzą, jak sobie nawzajem pomagać.",
      essence: "Mieszkańcy wymieniają się drobnymi usługami zamiast płacić.",
      audience: "Seniorzy i młode rodziny",
      stage: "pomysl",
      createdAt: daysAgo(2),
      status: "nowy",
      thread: [],
    },
    {
      id: "i2",
      code: "HUB-KINO42",
      title: "Szkolne Kino Seniora",
      category: "dla-seniorow",
      problem: "Seniorzy są samotni i mają mało okazji do spotkań z młodym pokoleniem.",
      essence: "Raz w miesiącu szkoła udostępnia aulę na pokaz filmu dla seniorów, a uczniowie przygotowują poczęstunek i rozmowę po seansie.",
      audience: "Seniorzy i uczniowie szkół średnich",
      stage: "prototyp",
      createdAt: daysAgo(4),
      status: "w-weryfikacji",
      thread: [
        { from: "admin", text: "Dziękujemy za fiszkę! Czy szkoła wyraziła już wstępną zgodę na udostępnienie auli?", createdAt: daysAgo(3) },
        { from: "author", text: "Tak, dyrekcja jest na tak. Brakuje nam projektora.", createdAt: daysAgo(3) },
      ],
    },
    {
      id: "i3",
      code: "HUB-LAWK57",
      title: "Mapa dostępnych ławek",
      category: "dla-osob-o-ograniczonej-mobilnosci",
      problem: "Osoby starsze i z niepełnosprawnościami rezygnują ze spacerów, bo nie wiedzą, gdzie po drodze odpocząć.",
      essence: "Mieszkańcy zaznaczają na mapie miejsca odpoczynku, by osoby starsze mogły zaplanować spacer.",
      audience: "Osoby starsze i z niepełnosprawnościami",
      stage: "pomysl",
      createdAt: daysAgo(6),
      status: "zaakceptowany",
      thread: [{ from: "admin", text: "Pomysł zaakceptowany – zapraszamy do naboru „Razem przeciw samotności”.", createdAt: daysAgo(5) }],
    },
    ...exampleIdeas(),
  ];
}

/**
 * Fiszki przykładowe dla jurorów (fiszki-przykladowe.json) – pełna treść IWS 2.0, różne statusy, rozmowy i komentarze zespołu.
 * Dane fikcyjne; liczby w diagnozach to prawdziwe wskaźniki z Obserwatora Statystyk Społecznych ROPS.
 */
export function exampleIdeas(): IdeaCard[] {
  return examples.map(({ daysAgo: d, thread, innovativeness, change, vision, authors, adminComment, ...rest }) => ({
    ...rest,
    category: rest.category as IdeaCard["category"],
    stage: rest.stage as IdeaCard["stage"],
    status: rest.status as IdeaCard["status"],
    ...(innovativeness ? { innovativeness } : {}),
    ...(change ? { change } : {}),
    ...(vision ? { vision } : {}),
    ...(authors ? { authors } : {}),
    ...(adminComment ? { adminComment } : {}),
    createdAt: daysAgo(d),
    thread: thread.map((m) => ({
      from: m.from as ThreadMessage["from"],
      ...("name" in m && m.name ? { name: m.name } : {}),
      text: m.text,
      createdAt: daysAgo(m.daysAgo),
    })),
  }));
}
