import type { Application, ChallengeArea, IdeaCard, IdeaStage, Resource, Role } from "./types";

/** Kategorie Biblioteki Innowacji Społecznych ROPS – krótka etykieta (np. w filtrach). */
export const AREA_LABEL: Record<ChallengeArea, string> = {
  "dla-seniorow": "Seniorzy",
  "dla-dzieci-mlodziezy-i-rodziny": "Dzieci, młodzież i rodzina",
  "dla-rynku-pracy": "Rynek pracy",
  "dla-osob-o-ograniczonej-mobilnosci": "Osoby o ograniczonej mobilności",
  "dla-osob-z-niepelnosprawnoscia-sensoryczna": "Osoby z niepełnosprawnością sensoryczną",
  "dla-cudzoziemcow": "Cudzoziemcy",
  "dla-osob-z-niepelnosprawnoscia-intelektualna": "Osoby z niepełnosprawnością intelektualną",
  "dla-osob-w-kryzysie-bezdomnosci": "Osoby w kryzysie bezdomności",
  "dla-zdrowia-i-medycyny": "Zdrowie i medycyna",
};

/** Pełna nazwa kategorii tak jak w Bibliotece ROPS („innowacje dla seniorów”). */
export const AREA_LABEL_ROPS: Record<ChallengeArea, string> = {
  "dla-seniorow": "innowacje dla seniorów",
  "dla-dzieci-mlodziezy-i-rodziny": "innowacje dla dzieci, młodzieży i rodziny",
  "dla-rynku-pracy": "innowacje dla rynku pracy",
  "dla-osob-o-ograniczonej-mobilnosci": "innowacje dla osób o ograniczonej mobilności",
  "dla-osob-z-niepelnosprawnoscia-sensoryczna": "innowacje dla osób z niepełnosprawnością sensoryczną",
  "dla-cudzoziemcow": "innowacje dla cudzoziemców",
  "dla-osob-z-niepelnosprawnoscia-intelektualna": "innowacje dla osób z niepełnosprawnością intelektualną",
  "dla-osob-w-kryzysie-bezdomnosci": "innowacje dla osób w kryzysie bezdomności",
  "dla-zdrowia-i-medycyny": "innowacje dla zdrowia i medycyny",
};

export const AREAS = Object.keys(AREA_LABEL) as ChallengeArea[];

/** Adres kategorii w Bibliotece ROPS. */
export const ropsCategoryUrl = (a: ChallengeArea) => `https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/${a}`;

/** Kolor kategorii – tylko akcent dekoracyjny (kropka, pasek); nazwa kategorii zawsze jest w tekście. */
export const AREA_COLOR: Record<ChallengeArea, string> = {
  "dla-seniorow": "bg-brand-700",
  "dla-dzieci-mlodziezy-i-rodziny": "bg-sun",
  "dla-rynku-pracy": "bg-emerald-600",
  "dla-osob-o-ograniczonej-mobilnosci": "bg-teal-600",
  "dla-osob-z-niepelnosprawnoscia-sensoryczna": "bg-violet-600",
  "dla-cudzoziemcow": "bg-amber-500",
  "dla-osob-z-niepelnosprawnoscia-intelektualna": "bg-pink-500",
  "dla-osob-w-kryzysie-bezdomnosci": "bg-brand-900",
  "dla-zdrowia-i-medycyny": "bg-accent",
};

export const STAGE_LABEL: Record<IdeaStage, string> = {
  pomysl: "Pomysł",
  prototyp: "Prototyp",
  test: "W testach",
  wdrozenie: "Wdrożone",
};

export const STAGES = Object.keys(STAGE_LABEL) as IdeaStage[];

export const STATUS_LABEL: Record<IdeaCard["status"], string> = {
  nowy: "Nowy",
  "w-weryfikacji": "W weryfikacji",
  zaakceptowany: "Zaakceptowany",
  odrzucony: "Odrzucony",
};

export const STATUS_STYLE: Record<IdeaCard["status"], string> = {
  nowy: "bg-brand-50 text-brand-700",
  "w-weryfikacji": "bg-amber-100 text-amber-900",
  zaakceptowany: "bg-emerald-100 text-emerald-900",
  odrzucony: "bg-red-100 text-red-900 ring-1 ring-red-300",
};

export const ROLE_LABEL: Record<Role, string> = {
  resident: "Mieszkaniec",
  ngo: "Organizacja",
  jst: "Samorząd",
  expert: "Ekspert / mentor",
  admin: "ROPS Kraków",
};

export const RESOURCE_LABEL: Record<Resource["kind"], string> = {
  raport: "Raport",
  film: "Film",
  poradnik: "Poradnik",
  canva: "Canva",
};

export const APP_STATUS_LABEL: Record<Application["status"], string> = {
  zlozony: "Złożony",
  "w-ocenie": "W ocenie",
  przyjety: "Przyjęty",
  odrzucony: "Odrzucony",
};

export const APP_STATUS_STYLE: Record<Application["status"], string> = {
  zlozony: "bg-brand-50 text-brand-700",
  "w-ocenie": "bg-amber-100 text-amber-900",
  przyjety: "bg-emerald-100 text-emerald-900",
  odrzucony: "bg-red-100 text-red-900 ring-1 ring-red-300",
};

/** Kroki ścieżki zgłoszenia – oś czasu na stronie statusu. */
export const IDEA_STEPS: { status: IdeaCard["status"]; label: string }[] = [
  { status: "nowy", label: "Wysłana" },
  { status: "w-weryfikacji", label: "W weryfikacji" },
  { status: "zaakceptowany", label: "Decyzja" },
];
