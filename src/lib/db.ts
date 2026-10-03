import { neon } from "@neondatabase/serverless";

/**
 * Minimalny interfejs zapytań SQL (tekst z $1, $2… i parametry → wiersze). Produkcja: Neon Postgres przez HTTP
 * (działa w funkcjach serverless Vercela bez puli połączeń). Testy: PGlite (Postgres w procesie) z tym samym SQL.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Sql = (text: string, params?: unknown[]) => Promise<Record<string, any>[]>;

/** Adres bazy: DATABASE_URL (integracja Neon w Vercelu ustawia go sama) albo POSTGRES_URL. */
export function databaseUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || undefined;
}

export function neonSql(url: string): Sql {
  // Sterownik pyta bazę przez fetch, a Next.js 14 na Vercelu zapamiętuje odpowiedzi fetch w Data Cache –
  // bez "no-store" strony pokazywałyby stare dane (np. panel bez nowych zgłoszeń).
  const client = neon(url, { fetchOptions: { cache: "no-store" } });
  return (text, params = []) => client.query(text, params);
}

/**
 * Magazyn dokumentów JSON w jednej tabeli: (rodzaj, id) → dane. Kolekcje prototypu (fiszki, wnioski, potrzeby,
 * opinie, forum, powiadomienia, subskrypcje push) mają różne pola, a zapytania są proste – jedna tabela z JSONB
 * wystarcza i nie wymaga migracji przy zmianie pól. Kody zgłoszeń mają indeks.
 */
export function createDocs(sql: Sql) {
  let schema: Promise<void> | undefined;
  const ready = () =>
    (schema ??= (async () => {
      await sql(`CREATE TABLE IF NOT EXISTS hub_items (
        kind text NOT NULL,
        id text NOT NULL,
        data jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (kind, id)
      )`);
      await sql(`CREATE INDEX IF NOT EXISTS hub_items_code ON hub_items ((data->>'code'))`);
    })().catch((err) => {
      schema = undefined; // spróbuj ponownie przy następnym zapytaniu
      throw err;
    }));

  return {
    sql,
    ready,
    async all<T>(kind: string, order: "asc" | "desc" = "asc"): Promise<T[]> {
      await ready();
      const rows = await sql(`SELECT data FROM hub_items WHERE kind = $1 ORDER BY created_at ${order === "asc" ? "ASC" : "DESC"}, id`, [kind]);
      return rows.map((r) => r.data as T);
    },
    async get<T>(kind: string, id: string): Promise<T | null> {
      await ready();
      const rows = await sql(`SELECT data FROM hub_items WHERE kind = $1 AND id = $2`, [kind, id]);
      return (rows[0]?.data as T) ?? null;
    },
    /** Wstawia albo zastępuje dokument; kolejność listy wg `createdAt` z danych (jeśli jest). */
    async put(kind: string, id: string, data: object): Promise<void> {
      await ready();
      const at = (data as { createdAt?: string }).createdAt ?? new Date().toISOString();
      await sql(
        `INSERT INTO hub_items (kind, id, data, created_at) VALUES ($1, $2, $3::jsonb, $4::timestamptz)
         ON CONFLICT (kind, id) DO UPDATE SET data = EXCLUDED.data`,
        [kind, id, JSON.stringify(data), at],
      );
    },
    /** Wstawia tylko, gdy dokumentu nie ma; true = wstawiono. */
    async insertNew(kind: string, id: string, data: object): Promise<boolean> {
      await ready();
      const rows = await sql(`INSERT INTO hub_items (kind, id, data) VALUES ($1, $2, $3::jsonb) ON CONFLICT DO NOTHING RETURNING id`, [kind, id, JSON.stringify(data)]);
      return rows.length > 0;
    },
    async del(kind: string, id: string): Promise<boolean> {
      await ready();
      return (await sql(`DELETE FROM hub_items WHERE kind = $1 AND id = $2 RETURNING id`, [kind, id])).length > 0;
    },
  };
}

export type Docs = ReturnType<typeof createDocs>;

const g = globalThis as unknown as { __hubDocs?: Docs | null };

/** Wspólny magazyn w bazie (repozytorium danych i subskrypcje push); null bez DATABASE_URL – wtedy pamięć/plik. */
export function sharedDocs(): Docs | null {
  if (g.__hubDocs === undefined) {
    const url = databaseUrl();
    g.__hubDocs = url ? createDocs(neonSql(url)) : null;
  }
  return g.__hubDocs;
}
