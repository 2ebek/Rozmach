import { newCode } from "./code";
import { challenges as seedChallenges, innovations as seedInnovations, nabory as seedNabory, resources } from "./data/seed";
import { sendWebhook } from "./notify";
import { loadData, saveData } from "./persist";
import { pushNewIdea } from "./push";
import type {
  Application,
  Challenge,
  Feedback,
  HubEvent,
  IdeaCard,
  Innovation,
  Message,
  Nabor,
  NeedSubmission,
  PartnerOffer,
  Resource,
  ThreadMessage,
} from "./types";

/**
 * Warstwa dostępu do danych (port). Prototyp: pamięć procesu; pomysły i wnioski zapisywane trwale (persist.ts).
 * Produkcja: ta sama sygnatura nad PostgreSQL (+ pgvector dla embeddings) – UI i API bez zmian.
 */
export interface HubRepository {
  // Zasobnik wiedzy
  listInnovations(opts?: { includeHidden?: boolean }): Promise<Innovation[]>;
  addInnovation(i: Omit<Innovation, "id">): Promise<Innovation>;
  setInnovationPublished(id: string, published: boolean): Promise<void>;
  listChallenges(): Promise<Challenge[]>;
  setChallengeIndicator(id: string, value: number): Promise<void>;
  listResources(): Promise<Resource[]>;
  // Matchmaking
  addNeed(n: Omit<NeedSubmission, "id" | "createdAt">): Promise<NeedSubmission>;
  listNeeds(): Promise<NeedSubmission[]>;
  // Kreator pomysłów
  addIdea(i: Omit<IdeaCard, "id" | "createdAt" | "status" | "code" | "thread">): Promise<IdeaCard>;
  listIdeas(): Promise<IdeaCard[]>;
  setIdeaStatus(id: string, status: IdeaCard["status"]): Promise<void>;
  /** Edycja treści pomysłu przez administratora; null, gdy pomysł nie istnieje. */
  updateIdea(id: string, patch: IdeaPatch): Promise<IdeaCard | null>;
  /** Usunięcie pomysłu; false, gdy nie istnieje. Wnioski zachowują historyczny kod fiszki. */
  deleteIdea(id: string): Promise<boolean>;
  // Nabory i wnioski
  listNabory(): Promise<Nabor[]>;
  setNaborOpen(id: string, open: boolean): Promise<void>;
  addApplication(a: Omit<Application, "id" | "code" | "createdAt" | "status" | "thread">): Promise<Application>;
  listApplications(): Promise<Application[]>;
  setApplicationStatus(id: string, status: Application["status"]): Promise<void>;
  // Ścieżka odpowiedzi: wspólna dla fiszek i wniosków (po kodzie)
  findByCode(code: string): Promise<{ kind: "idea"; item: IdeaCard } | { kind: "application"; item: Application } | null>;
  addThreadMessage(code: string, msg: Omit<ThreadMessage, "createdAt">): Promise<boolean>;
  // Tester, komunikacja, partnerstwa
  addFeedback(f: Omit<Feedback, "id" | "createdAt">): Promise<Feedback>;
  listFeedback(): Promise<Feedback[]>;
  addMessage(m: Omit<Message, "id" | "createdAt">): Promise<Message>;
  listMessages(): Promise<Message[]>;
  addPartnerOffer(p: Omit<PartnerOffer, "id" | "createdAt">): Promise<PartnerOffer>;
  listPartnerOffers(): Promise<PartnerOffer[]>;
  // Powiadomienia administratora
  listEvents(): Promise<HubEvent[]>;
  markEventsRead(): Promise<void>;
}

/** Pola fiszki edytowalne w panelu (jak karta ROPS); status, kod i rozmowa się nie zmieniają. */
export type IdeaPatch = Pick<IdeaCard, "title" | "essence" | "audience" | "stage"> &
  Partial<Pick<IdeaCard, "category" | "problem" | "innovativeness" | "change" | "vision" | "beneficiaries" | "evidence" | "authors">>;

// Singleton przeżywający hot-reload w dev.
const g = globalThis as unknown as { __hubStore?: HubRepository };

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

function createInMemoryRepo(): HubRepository {
  // Kopie danych startowych – redakcja może je modyfikować w panelu administratora.
  const innovations: Innovation[] = seedInnovations.map((i) => ({ ...i }));
  const challenges: Challenge[] = seedChallenges.map((c) => ({ ...c, indicator: c.indicator && { ...c.indicator } }));
  const nabory: Nabor[] = seedNabory.map((n) => ({ ...n }));

  // Fikcyjne dane startowe, żeby panel trendów i rozmowy nie były puste w demo.
  const needs: NeedSubmission[] = [
    { id: "n1", text: "Samotni seniorzy w gminie", area: "dla-seniorow", submitterRole: "jst", createdAt: daysAgo(9) },
    { id: "n2", text: "Starsi nie radzą sobie z e-urzędem", area: "dla-seniorow", submitterRole: "resident", createdAt: daysAgo(6) },
    { id: "n3", text: "Brak psychologa dla młodzieży w powiecie", area: "dla-dzieci-mlodziezy-i-rodziny", submitterRole: "ngo", createdAt: daysAgo(4) },
    { id: "n4", text: "Seniorzy bez kontaktu z rodziną", area: "dla-seniorow", submitterRole: "resident", createdAt: daysAgo(3) },
    { id: "n5", text: "Daleko do urzędu i poradni", area: "dla-osob-o-ograniczonej-mobilnosci", submitterRole: "resident", createdAt: daysAgo(1) },
  ];
  // Pomysły i wnioski – z trwałego magazynu (przy pierwszym starcie seed z data/seed.ts).
  const stored = loadData();
  const ideas: IdeaCard[] = stored.ideas;
  const applications: Application[] = stored.applications;
  const persist = () => saveData({ version: 1, ideas, applications });
  const feedback: Feedback[] = [
    { id: "f1", innovationId: "rops-senior-cuder", rating: 5, comment: "Gramy w świetlicy co tydzień, seniorzy bardzo się angażują. Polecam!", wantsToTest: false, createdAt: daysAgo(5) },
    { id: "f2", innovationId: "rops-merkury", rating: 4, comment: "Świetne do nauki obsługi biletomatu, ale potrzebny jest opiekun grupy.", wantsToTest: true, createdAt: daysAgo(2) },
  ];
  const messages: Message[] = [
    { id: "m1", author: "Zespół Hubu", role: "admin", text: "Dzień dobry! Tu możecie pytać o nabory, szukać partnerów i dzielić się doświadczeniami.", createdAt: daysAgo(3) },
    { id: "m2", author: "Gmina Przykładowa", role: "jst", text: "Szukamy organizacji, która pomogłaby nam uruchomić Kawiarenkę Seniora. Ktoś ma doświadczenie?", createdAt: daysAgo(2) },
    { id: "m3", author: "Mentorka ds. ekonomii społecznej", role: "expert", text: "Warto zacząć od rozmowy z autorami innowacji – w Bibliotece są opisane pierwsze kroki. Chętnie pomogę przygotować plan pilotażu.", createdAt: daysAgo(2) },
    { id: "m4", author: "Fundacja Sąsiedzi (przykład)", role: "ngo", text: "Prowadzimy podobne spotkania od roku, możemy się podzielić scenariuszami zajęć.", createdAt: daysAgo(1) },
  ];
  const partners: PartnerOffer[] = [
    { id: "p1", kind: "szukam", org: "Gmina Przykładowa", role: "jst", text: "Szukamy organizacji do prowadzenia Kawiarenki Seniora w 3 sołectwach.", area: "dla-seniorow", createdAt: daysAgo(4) },
    { id: "p2", kind: "oferuje", org: "Biblioteka Publiczna (przykład)", role: "ngo", text: "Udostępnimy salę i sprzęt na zajęcia cyfrowe dla seniorów, 2 popołudnia w tygodniu.", area: "dla-seniorow", createdAt: daysAgo(2) },
    { id: "p3", kind: "oferuje", org: "Ekspertka ds. ewaluacji", role: "expert", text: "Pomogę zaplanować badanie efektów pilotażu (ankiety, wskaźniki).", createdAt: daysAgo(1) },
  ];
  const events: HubEvent[] = [
    { id: "e1", kind: "idea", text: "Nowa fiszka: „Wymiana usług sąsiedzkich”", href: "/admin#kolejka", createdAt: daysAgo(2), read: false },
    { id: "e2", kind: "reply", text: "Autor odpowiedział w wątku „Szkolne Kino Seniora”", href: "/admin#kolejka", createdAt: daysAgo(3), read: false },
  ];

  const id = (p: string) => `${p}-${crypto.randomUUID()}`;
  const now = () => new Date().toISOString();

  /** Rejestruje zdarzenie: powiadomienie w panelu admina + webhook (automatyzacja). */
  function emit(kind: HubEvent["kind"], text: string, href?: string) {
    const ev: HubEvent = { id: id("ev"), kind, text, href, createdAt: now(), read: false };
    events.push(ev);
    sendWebhook(ev);
  }

  return {
    listInnovations: async (opts) => innovations.filter((i) => opts?.includeHidden || i.published),
    async addInnovation(i) {
      const rec = { ...i, id: id("inn") };
      innovations.push(rec);
      emit("wiedza", `Dodano innowację do Biblioteki: „${rec.title}”${rec.published ? "" : " (ukryta)"}`, "/admin/wiedza");
      return rec;
    },
    async setInnovationPublished(innId, published) {
      const inn = innovations.find((i) => i.id === innId);
      if (inn) inn.published = published;
    },
    listChallenges: async () => challenges,
    async setChallengeIndicator(chId, value) {
      const ch = challenges.find((c) => c.id === chId);
      if (ch?.indicator) ch.indicator.value = value;
    },
    listResources: async () => resources,

    async addNeed(n) {
      const rec = { ...n, id: id("need"), createdAt: now() };
      needs.push(rec);
      emit("need", `Nowa potrzeba: „${rec.text.slice(0, 80)}”`, "/admin#trendy");
      return rec;
    },
    listNeeds: async () => [...needs],

    async addIdea(i) {
      const rec: IdeaCard = { ...i, id: id("idea"), code: newCode(), createdAt: now(), status: "nowy", thread: [] };
      ideas.push(rec);
      persist();
      emit("idea", `Nowa fiszka: „${rec.title}”`, "/admin#kolejka");
      pushNewIdea(rec); // powiadomienie push do aplikacji administratora
      return rec;
    },
    listIdeas: async () => [...ideas],
    async setIdeaStatus(ideaId, status) {
      const idea = ideas.find((i) => i.id === ideaId);
      if (!idea) return;
      idea.status = status;
      persist();
    },
    async updateIdea(ideaId, patch) {
      const idea = ideas.find((i) => i.id === ideaId);
      if (!idea) return null;
      const { title, essence, audience, stage, category, problem, innovativeness, change, vision, beneficiaries, evidence, authors } = patch;
      Object.assign(idea, { title, essence, audience, stage, category, problem, innovativeness, change, vision, beneficiaries, evidence, authors });
      persist();
      return idea;
    },
    async deleteIdea(ideaId) {
      const idx = ideas.findIndex((i) => i.id === ideaId);
      if (idx === -1) return false;
      ideas.splice(idx, 1);
      persist();
      return true;
    },

    listNabory: async () => nabory,
    async setNaborOpen(naborId, open) {
      const n = nabory.find((x) => x.id === naborId);
      if (!n) return;
      n.open = open;
      emit("nabor", `${open ? "Otwarto" : "Zamknięto"} nabór: „${n.title}”`, "/admin/nabory");
    },
    async addApplication(a) {
      const rec: Application = { ...a, id: id("app"), code: newCode("WN"), createdAt: now(), status: "zlozony", thread: [] };
      applications.push(rec);
      persist();
      emit("application", `Nowy wniosek: „${rec.title}”`, "/admin/nabory");
      return rec;
    },
    listApplications: async () => [...applications],
    async setApplicationStatus(appId, status) {
      const app = applications.find((a) => a.id === appId);
      if (!app) return;
      app.status = status;
      persist();
    },

    async findByCode(code) {
      const idea = ideas.find((i) => i.code === code);
      if (idea) return { kind: "idea", item: idea };
      const app = applications.find((a) => a.code === code);
      if (app) return { kind: "application", item: app };
      return null;
    },
    async addThreadMessage(code, msg) {
      const target = ideas.find((i) => i.code === code) ?? applications.find((a) => a.code === code);
      if (!target) return false;
      target.thread.push({ ...msg, createdAt: now() });
      persist();
      if (msg.from === "author") emit("reply", `Autor odpowiedział w wątku „${target.title}”`, "/admin#kolejka");
      return true;
    },

    async addFeedback(f) {
      const rec = { ...f, id: id("fb"), createdAt: now() };
      feedback.push(rec);
      const title = innovations.find((i) => i.id === f.innovationId)?.title ?? f.innovationId;
      emit("feedback", `Nowa opinia (${f.rating}/5) o „${title}”${f.wantsToTest ? " + zgłoszenie do testów" : ""}`, "/admin#opinie");
      return rec;
    },
    listFeedback: async () => [...feedback],
    async addMessage(m) {
      const rec = { ...m, id: id("msg"), createdAt: now() };
      messages.push(rec);
      emit("message", `Nowa wiadomość na forum od: ${rec.author}`, "/komunikacja");
      return rec;
    },
    listMessages: async () => [...messages],
    async addPartnerOffer(p) {
      const rec = { ...p, id: id("par"), createdAt: now() };
      partners.push(rec);
      emit("partner", `Nowe ogłoszenie partnerskie: ${rec.org}`, "/komunikacja#partnerstwa");
      return rec;
    },
    listPartnerOffers: async () => [...partners],

    listEvents: async () => [...events].reverse(),
    async markEventsRead() {
      for (const e of events) e.read = true;
    },
  };
}

export function getRepo(): HubRepository {
  return (g.__hubStore ??= createInMemoryRepo());
}
