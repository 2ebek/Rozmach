import { z, ZodIssueCode, type ZodErrorMap } from "zod";

/**
 * Polskie komunikaty walidacji dla API. Schematy z własnym komunikatem (np. .min(3, "Wpisz…")) go zachowują;
 * ta mapa obsługuje resztę, żeby użytkownik nigdy nie zobaczył angielskiego „String must contain…”.
 * Import ma efekt uboczny (globalna mapa zod) – dołączają go api.ts i trasy, które z niego nie korzystają.
 */
const FIELD: Record<string, string> = {
  author: "Podpis",
  org: "Nazwa instytucji",
  text: "Treść",
  comment: "Komentarz",
  title: "Tytuł",
  essence: "Opis innowacji",
  audience: "Odbiorcy",
  problem: "Opis problemu",
  input: "Opis",
  context: "Opis instytucji",
  password: "Hasło",
  code: "Kod zgłoszenia",
  tags: "Słowa kluczowe",
};

const field = (path: (string | number)[]) => {
  const key = [...path].reverse().find((p): p is string => typeof p === "string");
  return key && FIELD[key] ? `${FIELD[key]}: ` : "";
};

/** 1 znak, 2–4 znaki (bez 12–14), 5+ znaków. */
const znaki = (n: number | bigint) => {
  const v = Number(n);
  if (v === 1) return "1 znak";
  const d = v % 10;
  const t = v % 100;
  return `${v} ${d >= 2 && d <= 4 && (t < 12 || t > 14) ? "znaki" : "znaków"}`;
};

export const plErrorMap: ZodErrorMap = (issue, ctx) => {
  const f = field(issue.path);
  switch (issue.code) {
    case ZodIssueCode.too_big:
      if (issue.type === "string") return { message: `${f}tekst jest za długi – najwyżej ${znaki(issue.maximum)}.` };
      if (issue.type === "array") return { message: `${f}najwyżej ${issue.maximum} pozycji.` };
      return { message: `${f}wartość może wynosić najwyżej ${issue.maximum}.` };
    case ZodIssueCode.too_small:
      if (issue.type === "string") return { message: Number(issue.minimum) <= 1 ? `${f}to pole jest wymagane.` : `${f}wpisz co najmniej ${znaki(issue.minimum)}.` };
      if (issue.type === "array") return { message: `${f}wybierz co najmniej ${issue.minimum}.` };
      return { message: `${f}wartość musi wynosić co najmniej ${issue.minimum}.` };
    case ZodIssueCode.invalid_type:
      return { message: issue.received === "undefined" ? `${f}uzupełnij wymagane pole.` : `${f}nieprawidłowy format danych.` };
    case ZodIssueCode.invalid_enum_value:
    case ZodIssueCode.invalid_literal:
    case ZodIssueCode.invalid_union_discriminator:
      return { message: `${f}wybierz jedną z dostępnych opcji.` };
    case ZodIssueCode.invalid_string:
      if (issue.validation === "url") return { message: `${f}podaj poprawny adres (https://…).` };
      if (issue.validation === "email") return { message: `${f}podaj poprawny adres e-mail.` };
      return { message: `${f}nieprawidłowy format.` };
    default:
      return { message: ctx.defaultError.startsWith("Invalid") || ctx.defaultError.startsWith("Required") ? `${f}nieprawidłowe dane.` : ctx.defaultError };
  }
};

z.setErrorMap(plErrorMap);
