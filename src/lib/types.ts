/**
 * Model domenowy Hubu – dopasowany do Biblioteki Innowacji Społecznych ROPS Kraków (kategorie i 6 pytań karty innowacji).
 * Innowacje pochodzą z publicznej Biblioteki ROPS; pozostałe dane prototypu są fikcyjne (brak danych osobowych).
 */

import type { IwsFormT } from "./iws";

export type Role ="resident" | "ngo" | "jst" | "expert" | "admin";

/**
 * Kategorie Biblioteki Innowacji Społecznych ROPS (grupy odbiorców). Wartości = końcówki adresów kategorii ROPS,
 * np. rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-seniorow.
 */
export type ChallengeArea =
  | "dla-seniorow"
  | "dla-dzieci-mlodziezy-i-rodziny"
  | "dla-rynku-pracy"
  | "dla-osob-o-ograniczonej-mobilnosci"
  | "dla-osob-z-niepelnosprawnoscia-sensoryczna"
  | "dla-cudzoziemcow"
  | "dla-osob-z-niepelnosprawnoscia-intelektualna"
  | "dla-osob-w-kryzysie-bezdomnosci"
  | "dla-zdrowia-i-medycyny";

/** Innowacja – karta jak w Bibliotece ROPS (6 pytań) + linki do materiałów ROPS. */
export interface Innovation {
  id: string;
  title: string;
  /** Krótki opis z listy ROPS (jedno zdanie). */
  subtitle?: string;
  /** 1. Na czym polega rozwiązanie? */
  summary: string;
  /** 2. Jakich problemów dotyczy innowacja? */
  problem?: string;
  /** 3. Grupa docelowa */
  targetGroup?: string;
  /** 4. Kto może skorzystać z innowacji? (instytucje) */
  beneficiaries?: string;
  /** 5. Czy to działa? (wynik testu) */
  evidence?: string;
  /** Kategorie Biblioteki ROPS. */
  areas: ChallengeArea[];
  tags: string[];
  /** Projekt ROPS, w ramach którego innowację wybrano do upowszechniania. */
  project?: string;
  /** Karta innowacji w Bibliotece ROPS (tam są też autorzy). */
  ropsUrl?: string;
  /** Film o innowacji. */
  videoUrl?: string;
  /** Folder „dowiedz się więcej” (PDF). */
  folderUrl?: string;
  /** Materiały do pobrania. */
  materialsUrl?: string;
  /** Zasady wykorzystania, np. CC BY 4.0. */
  license?: string;
  stage: IdeaStage;
  /** Czy innowacja jest widoczna publicznie (redakcja może ukryć ją do czasu weryfikacji). */
  published: boolean;
}

export type IdeaStage = "pomysl" | "prototyp" | "test" | "wdrozenie";

export interface Challenge {
  id: string;
  area: ChallengeArea;
  title: string;
  description: string;
  /** Wskaźnik z Internetowego Obserwatora Statystyk Społecznych ROPS (Mapa Wyzwań Społecznych). */
  indicator?: {
    label: string;
    value: number;
    unit: string;
    /** Rok danych. */
    year: number;
    /** Jak policzono wartość dla regionu (mediana/suma powiatów) i zakres. */
    note: string;
    /** Strona wskaźnika w IOSS. */
    sourceUrl: string;
  };
}

export interface Resource {
  id: string;
  title: string;
  kind: "raport" | "film" | "poradnik" | "canva";
  url: string;
  areas: ChallengeArea[];
}

/** Zgłoszona potrzeba/problem – wejście do matchmakingu i źródło trendów dla admina. */
export interface NeedSubmission {
  id: string;
  text: string;
  area?: ChallengeArea;
  submitterRole: Role;
  createdAt: string; // ISO
}

/**
 * Fiszka pomysłu (Kreator pomysłów) – pytania z części merytorycznej formularza aplikacyjnego ROPS
 * „Inkubator Włączenia Społecznego 2.0” (pkt 1, 3–8) + kategoria Biblioteki ROPS. Bez danych osobowych.
 */
export interface IdeaCard {
  id: string;
  /** Pkt 1. Tytuł innowacji */
  title: string;
  /** Pkt 3. Opis innowacji (na czym polega) */
  essence: string;
  /** Pkt 6. Opis odbiorców innowacji */
  audience: string;
  stage: IdeaStage;
  /** Kategoria Biblioteki ROPS (starsze zgłoszenia mogą jej nie mieć). */
  category?: ChallengeArea;
  /** Pkt 5. Diagnoza problemu */
  problem?: string;
  /** Pkt 4. Innowacyjność rozwiązania */
  innovativeness?: string;
  /** Pkt 7. Zmiana, jaką wprowadza innowacja */
  change?: string;
  /** Pkt 8. Wizja przyszłości innowacji */
  vision?: string;
  /** Kto może skorzystać z innowacji? */
  beneficiaries?: string;
  /** Czy to działa? (jeśli testowano) */
  evidence?: string;
  /** Autorzy – nazwa organizacji lub podpis (opcjonalnie). */
  authors?: string;
  /** Komentarz zespołu Hubu do fiszki (np. uzasadnienie decyzji) – widoczny dla autora na stronie statusu. */
  adminComment?: string;
  createdAt: string;
  status: "nowy" | "w-weryfikacji" | "zaakceptowany" | "odrzucony";
  /** Kod zgłoszenia – autor sprawdza nim status bez zakładania konta i bez danych osobowych. */
  code: string;
  thread: ThreadMessage[];
}

/** Wiadomość w wątku zgłoszenia (ścieżka odpowiedzi admin ↔ autor). */
export interface ThreadMessage {
  from: "admin" | "author";
  text: string;
  createdAt: string;
}

export interface MatchResult {
  innovation: Innovation;
  /** 0..1 */
  score: number;
  /** Słowa z zapytania użytkownika, które zadecydowały o dopasowaniu (wyjaśnialność). */
  matchedTerms: string[];
  /** Uzasadnienie dopasowania od AI (gdy odpowiadał model). */
  reason?: string;
}

/** Pomysł z Hubu wskazany przez AI jako podobny. Treść tylko dla zaakceptowanych – reszta to sygnał "czeka na weryfikację". */
export interface AiIdeaMatch {
  status: IdeaCard["status"];
  pending: boolean;
  title?: string;
  essence?: string;
  audience?: string;
  stage?: IdeaStage;
  reason?: string;
}

/** Dodatkowe informacje z dopasowania AI. */
export interface AiMatchInfo {
  summary: string;
  nextStep: string;
  ideas: AiIdeaMatch[];
}

export interface Feedback {
  id: string;
  innovationId: string;
  rating: number; // 1..5
  comment: string;
  wantsToTest: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  author: string;
  role: Role;
  text: string;
  createdAt: string;
}

export interface NaborQuestion {
  id: string;
  label: string;
  hint?: string;
  maxLength: number;
  /** Pole fiszki, którym można wstępnie wypełnić odpowiedź. */
  prefillFrom?: IdeaPrefillField;
}

export type IdeaPrefillField = "title" | "essence" | "audience" | "problem" | "innovativeness" | "change" | "vision";

/** Nabór w konkursie grantowym – generator wniosków działa tylko dla otwartych naborów. */
export interface Nabor {
  id: string;
  title: string;
  description: string;
  areas: ChallengeArea[];
  /** Data zakończenia naboru (YYYY-MM-DD). */
  deadline: string;
  open: boolean;
  questions: NaborQuestion[];
  /** "rops-iws" – pełny formularz aplikacyjny ROPS IWS 2.0 (dane wnioskodawcy, plan działań, oświadczenia). */
  formType?: "rops-iws";
}

export interface Application {
  id: string;
  code: string;
  naborId: string;
  /** Kod fiszki, z której przygotowano wniosek (opcjonalnie). */
  ideaCode?: string;
  title: string;
  answers: Record<string, string>;
  /** Pełny formularz IWS 2.0 (tylko nabory formType "rops-iws"). Zawiera dane osobowe – widoczny wyłącznie w panelu admina. */
  form?: IwsFormT;
  status: "zlozony" | "w-ocenie" | "przyjety" | "odrzucony";
  createdAt: string;
  thread: ThreadMessage[];
}

/** Zdarzenie w systemie – źródło powiadomień administratora i webhooka. */
export interface HubEvent {
  id: string;
  kind: "idea" | "application" | "feedback" | "need" | "message" | "partner" | "nabor" | "reply" | "wiedza";
  text: string;
  href?: string;
  createdAt: string;
  read: boolean;
}

/** Ogłoszenie w giełdzie partnerstw międzysektorowych. */
export interface PartnerOffer {
  id: string;
  kind: "szukam" | "oferuje";
  org: string;
  role: Role;
  text: string;
  area?: ChallengeArea;
  createdAt: string;
}
