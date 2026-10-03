import { describe, expect, it } from "vitest";
import { z } from "zod";
import "./zod-pl";

const msg = (schema: z.ZodTypeAny, value: unknown) => {
  const r = schema.safeParse(value);
  return r.success ? null : r.error.issues[0]!.message;
};

describe("polskie komunikaty walidacji", () => {
  it("zastępują angielskie komunikaty zod (np. za długi podpis na forum)", () => {
    expect(msg(z.object({ author: z.string().max(60) }), { author: "A".repeat(80) })).toBe("Podpis: tekst jest za długi – najwyżej 60 znaków.");
    expect(msg(z.object({ comment: z.string().min(5) }), { comment: "ab" })).toBe("Komentarz: wpisz co najmniej 5 znaków.");
    expect(msg(z.string().min(3), "a")).toBe("wpisz co najmniej 3 znaki.");
    expect(msg(z.string().max(22), "x".repeat(30))).toBe("tekst jest za długi – najwyżej 22 znaki.");
    expect(msg(z.string().max(12), "x".repeat(30))).toBe("tekst jest za długi – najwyżej 12 znaków.");
    expect(msg(z.object({ rating: z.number().max(5) }), { rating: 9 })).toBe("wartość może wynosić najwyżej 5.");
    expect(msg(z.object({ kind: z.enum(["a", "b"]) }), { kind: "c" })).toBe("wybierz jedną z dostępnych opcji.");
    expect(msg(z.object({ text: z.string() }), {})).toBe("Treść: uzupełnij wymagane pole.");
    expect(msg(z.string().url(), "nie-adres")).toBe("podaj poprawny adres (https://…).");
  });

  it("własne komunikaty w schematach mają pierwszeństwo", () => {
    expect(msg(z.string().min(3, "Wpisz co najmniej 3 znaki."), "a")).toBe("Wpisz co najmniej 3 znaki.");
  });
});
