import { newCode } from "./code";
import { sharedDocs } from "./db";
import { demoState } from "./data/demo";
import { challenges as seedChallenges, innovations as seedInnovations, nabory as seedNabory, resources } from "./data/seed";
import { sendWebhook } from "./notify";
import { loadData, saveData } from "./persist";
import { pushNewIdea } from "./push";
import { createPostgresRepo, threadHref } from "./store-pg";
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
  /** Wyzwania regionu ze wskaźnikami IOSS (tylko do odczytu – odświeżane skryptem npm run import:ioss). */
  listChallenges(): Promise<Challenge[]>;
  listResources(): Promise<Resource[]>;
  // Matchmaking
  addNeed(n: Omit<NeedSubmission, "id" | "createdAt">): Promise<NeedSubmission>;
  listNeeds(): Promise<NeedSubmission[]>;
  // Kreator pomysłów
  addIdea(i: Omit<IdeaCard, "id" | "createdAt" | "status" | "code" | "thread">): Promise<IdeaCard>;
  listIdeas(): Promise<IdeaCard[]>;
  setIdeaStatus(id: string, status: IdeaCard["status"]): Promise<void>;
  /** Komentarz zespołu do fiszki (pusty – usuwa); false, gdy fiszka nie istnieje. */
  setIdeaComment(id: string, comment: string): Promise<boolean>;
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

function createInMemoryRepo(): HubRepository {
  // Kopie danych startowych – redakcja może je modyfikować w panelu administratora.
  const innovations: Innovation[] = seedInnovations.map((i) => ({ ...i }));
  const challenges: Challenge[] = seedChallenges;
  const nabory: Nabor[] = seedNabory.map((n) => ({ ...n }));

  // Fikcyjne dane startowe (trendy, forum, opinie, powiadomienia) – wspólne z repozytorium w bazie.
  const { needs, feedback, messages, partners, events } = demoState();
  // Pomysły i wnioski – z trwałego magazynu (przy pierwszym starcie seed z data/seed.ts).
  const stored = loadData();
  const ideas: IdeaCard[] = stored.ideas;
  const applications: Application[] = stored.applications;
  const persist = () => saveData({ version: 1, ideas, applications });

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
      void pushNewIdea(rec); // powiadomienie push do aplikacji administratora
      return rec;
    },
    listIdeas: async () => [...ideas],
    async setIdeaStatus(ideaId, status) {
      const idea = ideas.find((i) => i.id === ideaId);
      if (!idea) return;
      idea.status = status;
      persist();
    },
    async setIdeaComment(ideaId, comment) {
      const idea = ideas.find((i) => i.id === ideaId);
      if (!idea) return false;
      if (comment.trim()) idea.adminComment = comment.trim();
      else delete idea.adminComment;
      persist();
      return true;
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
      const idea = ideas.find((i) => i.code === code);
      const target = idea ?? applications.find((a) => a.code === code);
      if (!target) return false;
      target.thread.push({ ...msg, createdAt: now() });
      persist();
      if (msg.from === "author") emit("reply", `Autor odpowiedział w wątku „${target.title}”`, threadHref(idea));
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

/**
 * Repozytorium danych: z DATABASE_URL (Vercel + Neon) – Postgres, wspólny dla wszystkich instancji serverless;
 * bez niego (lokalnie, testy) – pamięć procesu + plik data/hub-data.json.
 */
export function getRepo(): HubRepository {
  if (!g.__hubStore) {
    const docs = sharedDocs();
    g.__hubStore = docs ? createPostgresRepo(docs) : createInMemoryRepo();
  }
  return g.__hubStore;
}
