import { describe, expect, it, vi } from "vitest";

const neon = vi.fn(() => ({ query: vi.fn(async () => []) }));
vi.mock("@neondatabase/serverless", () => ({ neon }));

describe("połączenie z bazą (Neon)", () => {
  it("zapytania omijają pamięć podręczną fetch Next.js – panel zawsze widzi nowe zgłoszenia", async () => {
    const { neonSql } = await import("./db");
    neonSql("postgres://u:p@host/db");
    expect(neon).toHaveBeenCalledWith("postgres://u:p@host/db", { fetchOptions: { cache: "no-store" } });
  });
});
