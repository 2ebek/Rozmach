import { newCode } from "./code";
import type { Docs } from "./db";
import { demoState } from "./data/demo";
import { challenges, innovations as seedInnovations, nabory as seedNabory, resources, seedIdeas } from "./data/seed";
import { sendWebhook } from "./notify";
import { pushNewIdea } from "./push";
import type { HubRepository } from "./store";
import type { Application, HubEvent, IdeaCard, Innovation, Nabor, ThreadMessage } from "./types";

/** Link do kolejki w panelu, w której jest teraz fiszka (albo do wniosków). */
export const threadHref = (idea?: Pick<IdeaCard, "status">) => (idea ? `/admin?kolejka=${idea.status}#kolejka` : "/admin/nabory");

/** Treść powiadomienia dla zespołu Hubu o nowej wiadomości w wątku (od autora); null – bez powiadomienia. */
export function threadEventText(msg: Omit<ThreadMessage, "createdAt">, title: string): string | null {
  return msg.from === "author" ? `Autor odpowiedział w wątku „${title}”` : null;
}

/**
 * Repozytorium danych w Postgresie (Vercel + Neon) – ten sam interfejs co wersja w pamięci, więc UI i API się nie zmieniają.
 * Funkcje serverless nie dzielą pamięci, dlatego cały stan zmienny jest w bazie. Dane z kodu (Biblioteka ROPS, wyzwania IOSS,
 * nabory, materiały) zostają w kodzie; w bazie są tylko zmiany redakcji: dodane innowacje, widoczność, otwarcie naborów.
 * Przy pierwszym uruchomieniu na pustej bazie wstawiamy dane demonstracyjne (jak lokalnie).
 */
export function createPostgresRepo(docs: Docs): HubRepository {
  const { sql } = docs;
  const id = (p: string) => `${p}-${crypto.randomUUID()}`;
  const now = () => new Date().toISOString();

  let seeded: Promise<void> | undefined;
  /** Schemat + jednorazowe dane demonstracyjne (znacznik meta/seeded chroni przed podwójnym wstawieniem). */
  const ready = () =>
    (seeded ??= (async () => {
      await docs.ready();
      if (!(await docs.insertNew("meta", "seeded", { at: now() }))) return;
      const demo = demoState();
      const rows: [string, { id: string }][] = [
        ...demo.needs.map((x) => ["need", x] as [string, { id: string }]),
        ...demo.feedback.map((x) => ["feedback", x] as [string, { id: string }]),
        ...demo.messages.map((x) => ["message", x] as [string, { id: string }]),
        ...demo.partners.map((x) => ["partner", x] as [string, { id: string }]),
        ...demo.events.map((x) => ["event", x] as [string, { id: string }]),
        ...seedIdeas().map((x) => ["idea", x] as [string, { id: string }]),
      ];
      for (const [kind, data] of rows) await docs.put(kind, data.id, data);
    })().catch((err) => {
      seeded = undefined;
      throw err;
    }));

  const all = async <T>(kind: string, order?: "asc" | "desc") => (await ready(), docs.all<T>(kind, order));

  /** Zdarzenie: powiadomienie w panelu + webhook. Czekamy na zapis – funkcja serverless może zostać wstrzymana po odpowiedzi. */
  async function emit(kind: HubEvent["kind"], text: string, href?: string) {
    const ev: HubEvent = { id: id("ev"), kind, text, href, createdAt: now(), read: false };
    await docs.put("event", ev.id, ev);
    sendWebhook(ev);
  }

  async function listInnovations(opts?: { includeHidden?: boolean }): Promise<Innovation[]> {
    const [added, visibility] = await Promise.all([all<Innovation>("innovation"), all<{ id: string; published: boolean }>("innovation-visibility")]);
    const hidden = new Map(visibility.map((v) => [v.id, v.published]));
    const list = [...seedInnovations.map((i) => ({ ...i, published: hidden.get(i.id) ?? i.published })), ...added];
    return list.filter((i) => opts?.includeHidden || i.published);
  }

  async function listNabory(): Promise<Nabor[]> {
    const open = new Map((await all<{ id: string; open: boolean }>("nabor-open")).map((n) => [n.id, n.open]));
    return seedNabory.map((n) => ({ ...n, open: open.get(n.id) ?? n.open }));
  }

  /** Dokument z kodem zgłoszenia (fiszka albo wniosek). */
  async function byCode(code: string) {
    await ready();
    const rows = await sql(`SELECT kind, data FROM hub_items WHERE kind IN ('idea', 'application') AND data->>'code' = $1 LIMIT 1`, [code]);
    const row = rows[0];
    if (!row) return null;
    return row.kind === "idea" ? { kind: "idea" as const, item: row.data as IdeaCard } : { kind: "application" as const, item: row.data as Application };
  }

  /** Częściowa zmiana dokumentu w jednym zapytaniu (bez wyścigu odczyt–zapis). */
  async function patch(kind: string, docId: string, fields: object) {
    await ready();
    await sql(`UPDATE hub_items SET data = data || $3::jsonb WHERE kind = $1 AND id = $2`, [kind, docId, JSON.stringify(fields)]);
  }

  return {
    listInnovations,
    async addInnovation(i) {
      await ready();
      const rec = { ...i, id: id("inn"), createdAt: now() };
      await docs.put("innovation", rec.id, rec);
      await emit("wiedza", `Dodano innowację do Biblioteki: „${rec.title}”${rec.published ? "" : " (ukryta)"}`, "/admin/wiedza");
      const { createdAt: _c, ...inn } = rec;
      return inn;
    },
    async setInnovationPublished(innId, published) {
      await ready();
      if (await docs.get("innovation", innId)) await patch("innovation", innId, { published });
      else await docs.put("innovation-visibility", innId, { id: innId, published });
    },
    listChallenges: async () => challenges,
    listResources: async () => resources,

    async addNeed(n) {
      await ready();
      const rec = { ...n, id: id("need"), createdAt: now() };
      await docs.put("need", rec.id, rec);
      await emit("need", `Nowa potrzeba: „${rec.text.slice(0, 80)}”`, "/admin#trendy");
      return rec;
    },
    listNeeds: () => all("need"),

    async addIdea(i) {
      await ready();
      const rec: IdeaCard = { ...i, id: id("idea"), code: newCode(), createdAt: now(), status: "nowy", thread: [] };
      await docs.put("idea", rec.id, rec);
      await emit("idea", `Nowa fiszka: „${rec.title}”`, "/admin#kolejka");
      await pushNewIdea(rec);
      return rec;
    },
    listIdeas: () => all("idea"),
    async setIdeaStatus(ideaId, status) {
      await patch("idea", ideaId, { status });
    },
    async setIdeaComment(ideaId, comment) {
      await ready();
      const text = comment.trim();
      const rows = text
        ? await sql(`UPDATE hub_items SET data = jsonb_set(data, '{adminComment}', to_jsonb($2::text)) WHERE kind = 'idea' AND id = $1 RETURNING id`, [ideaId, text])
        : await sql(`UPDATE hub_items SET data = data - 'adminComment' WHERE kind = 'idea' AND id = $1 RETURNING id`, [ideaId]);
      return rows.length > 0;
    },
    async updateIdea(ideaId, p) {
      await ready();
      const idea = await docs.get<IdeaCard>("idea", ideaId);
      if (!idea) return null;
      const { title, essence, audience, stage, category, problem, innovativeness, change, vision, beneficiaries, evidence, authors } = p;
      const next: IdeaCard = { ...idea, title, essence, audience, stage, category, problem, innovativeness, change, vision, beneficiaries, evidence, authors };
      await docs.put("idea", ideaId, next);
      return JSON.parse(JSON.stringify(next)) as IdeaCard; // jak po zapisie: bez pól undefined
    },
    async deleteIdea(ideaId) {
      await ready();
      return docs.del("idea", ideaId);
    },

    listNabory,
    async setNaborOpen(naborId, open) {
      await ready();
      const n = seedNabory.find((x) => x.id === naborId);
      if (!n) return;
      await docs.put("nabor-open", naborId, { id: naborId, open });
      await emit("nabor", `${open ? "Otwarto" : "Zamknięto"} nabór: „${n.title}”`, "/admin/nabory");
    },
    async addApplication(a) {
      await ready();
      const rec: Application = { ...a, id: id("app"), code: newCode("WN"), createdAt: now(), status: "zlozony", thread: [] };
      await docs.put("application", rec.id, rec);
      await emit("application", `Nowy wniosek: „${rec.title}”`, "/admin/nabory");
      return rec;
    },
    listApplications: () => all("application"),
    async setApplicationStatus(appId, status) {
      await patch("application", appId, { status });
    },

    findByCode: byCode,
    async addThreadMessage(code, msg) {
      await ready();
      const entry = { ...msg, createdAt: now() };
      const rows = await sql(
        `UPDATE hub_items SET data = jsonb_set(data, '{thread}', COALESCE(data->'thread', '[]'::jsonb) || jsonb_build_array($2::jsonb))
         WHERE kind IN ('idea', 'application') AND data->>'code' = $1 RETURNING kind, data`,
        [code, JSON.stringify(entry)],
      );
      const row = rows[0];
      if (!row) return false;
      const target = row.data as IdeaCard | Application;
      const note = threadEventText(msg, target.title);
      if (note) await emit("reply", note, threadHref(row.kind === "idea" ? (target as IdeaCard) : undefined));
      return true;
    },

    async addFeedback(f) {
      await ready();
      const rec = { ...f, id: id("fb"), createdAt: now() };
      await docs.put("feedback", rec.id, rec);
      const title = (await listInnovations({ includeHidden: true })).find((i) => i.id === f.innovationId)?.title ?? f.innovationId;
      await emit("feedback", `Nowa opinia (${f.rating}/5) o „${title}”${f.wantsToTest ? " + zgłoszenie do testów" : ""}`, "/admin#opinie");
      return rec;
    },
    listFeedback: () => all("feedback"),
    async addMessage(m) {
      await ready();
      const rec = { ...m, id: id("msg"), createdAt: now() };
      await docs.put("message", rec.id, rec);
      await emit("message", `Nowa wiadomość na forum od: ${rec.author}`, "/komunikacja");
      return rec;
    },
    listMessages: () => all("message"),
    async addPartnerOffer(p) {
      await ready();
      const rec = { ...p, id: id("par"), createdAt: now() };
      await docs.put("partner", rec.id, rec);
      await emit("partner", `Nowe ogłoszenie partnerskie: ${rec.org}`, "/komunikacja#partnerstwa");
      return rec;
    },
    listPartnerOffers: () => all("partner"),

    listEvents: () => all("event", "desc"),
    async markEventsRead() {
      await ready();
      await sql(`UPDATE hub_items SET data = data || '{"read": true}'::jsonb WHERE kind = 'event' AND (data->>'read')::boolean IS NOT TRUE`);
    },
  };
}
