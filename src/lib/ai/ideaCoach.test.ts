import type Anthropic from "@anthropic-ai/sdk";
import { ApiError, type GoogleGenAI } from "@google/genai";
import { afterEach, describe, expect, it, vi } from "vitest";
import { innovations } from "../data/seed";
import { llmAssistantRun, getAssistant } from "./assistant";
import { COACH_SECTIONS, coachIdea, localCoach, type IdeaDraft } from "./ideaCoach";
import { GEMINI_DEFAULT_MODEL, GEMINI_FALLBACK_MODEL, resetGeminiCooldown } from "./llm";

const fakeClaude = (parsed: unknown, stop_reason = "end_turn") => {
  const parse = vi.fn(async (_p: unknown) => ({ stop_reason, parsed_output: parsed }));
  return { claude: { beta: { messages: { parse } } } as unknown as Anthropic, parse };
};
const fakeGemini = (...responses: (string | Error)[]) => {
  const generateContent = vi.fn(async (_p: unknown) => {
    const r = responses.shift()!;
    if (r instanceof Error) throw r;
    return { text: r };
  });
  return { gemini: { models: { generateContent } } as unknown as GoogleGenAI, generateContent };
};

const draft: IdeaDraft = {
  category: "dla-seniorow",
  stage: "pomysl",
  sections: { tytul: "Kino Seniora", opis: "Raz w miesiącu szkoła udostępnia aulę na pokaz filmu dla seniorów, a uczniowie prowadzą rozmowę po seansie." },
};
const okPoint = (section: string) => ({ section, status: "ok", feedback: "Dobrze.", suggestion: "" });
const aiOut = {
  summary: "Dobry start, brakuje diagnozy.",
  points: [
    ...COACH_SECTIONS.filter((s) => s !== "diagnoza").map(okPoint),
    { section: "diagnoza", status: "brak", feedback: "Opisz skalę problemu.", suggestion: "Seniorzy w naszej okolicy rzadko wychodzą z domu." },
    { section: "diagnoza", status: "ok", feedback: "duplikat", suggestion: "" },
  ],
  similar: [
    { id: "rops-senior-cuder", reason: "Też łączy seniorów." },
    { id: "nie-istnieje", reason: "x" },
    { id: "rops-senior-cuder", reason: "duplikat" },
  ],
  nextStep: "Uzupełnij diagnozę.",
};

afterEach(() => vi.unstubAllEnvs());

describe("asystent fiszki (Kreator pomysłów)", () => {
  it("AI: każdy punkt raz i w kolejności formularza, propozycje tylko dla punktów do pracy, tylko istniejące innowacje", async () => {
    const { claude, parse } = fakeClaude(aiOut);
    const r = await coachIdea(draft, innovations, { claude });
    expect(r.source).toBe("ai");
    expect(r.points.map((p) => p.section)).toEqual([...COACH_SECTIONS]);
    expect(r.points.find((p) => p.section === "diagnoza")).toMatchObject({ status: "brak", suggestion: "Seniorzy w naszej okolicy rzadko wychodzą z domu." });
    expect(r.points.filter((p) => p.suggestion)).toHaveLength(1);
    expect(r.similar).toEqual([{ id: "rops-senior-cuder", title: innovations.find((i) => i.id === "rops-senior-cuder")!.title, reason: "Też łączy seniorów." }]);

    // treść fiszki jako dane w znacznikach, katalog Biblioteki w cache'owanym kontekście
    const params = parse.mock.calls[0]![0] as { system: { text: string; cache_control?: unknown }[]; messages: { content: string }[] };
    expect(params.messages[0]!.content).toContain("<opis>Raz w miesiącu");
    expect(params.messages[0]!.content).toContain("<diagnoza>(puste)</diagnoza>");
    expect(params.system[1]).toMatchObject({ cache_control: { type: "ephemeral" } });
    expect(params.system[1]!.text).toContain('<innowacja id="rops-bawita">');
  });

  it("Gemini przeciążony na obu modelach → podpowiedzi lokalne zamiast błędu", async () => {
    const { gemini, generateContent } = fakeGemini(new ApiError({ message: "x", status: 503 }), new ApiError({ message: "x", status: 503 }));
    const r = await coachIdea(draft, innovations, { gemini });
    expect(generateContent).toHaveBeenCalledTimes(2);
    expect(r.source).toBe("lokalne");
  });

  it("wyczerpany limit modelu głównego (429) → kolejne zapytania od razu na modelu zapasowym", async () => {
    resetGeminiCooldown();
    const json = JSON.stringify(aiOut);
    const { gemini, generateContent } = fakeGemini(new ApiError({ message: "quota", status: 429 }), json, json);
    expect((await coachIdea(draft, innovations, { gemini })).source).toBe("ai");
    expect((await coachIdea(draft, innovations, { gemini })).source).toBe("ai");
    const models = generateContent.mock.calls.map((c) => (c[0] as { model: string }).model);
    expect(models).toEqual([GEMINI_DEFAULT_MODEL, GEMINI_FALLBACK_MODEL, GEMINI_FALLBACK_MODEL]);
    resetGeminiCooldown();
  });

  it("odmowa modelu → tryb lokalny", async () => {
    const { claude } = fakeClaude(null, "refusal");
    expect((await coachIdea(draft, innovations, { claude })).source).toBe("lokalne");
  });

  it("tryb lokalny: puste punkty to „brak”, krótkie „do-poprawy”, bez wymyślonych propozycji", () => {
    const r = localCoach(draft, innovations);
    const by = Object.fromEntries(r.points.map((p) => [p.section, p]));
    expect(by.tytul!.status).toBe("ok");
    expect(by.opis!.status).toBe("do-poprawy");
    expect(by.diagnoza!.status).toBe("brak");
    expect(by.diagnoza!.feedback).toContain("Na jaki problem odpowiada innowacja");
    expect(r.points.every((p) => !p.suggestion)).toBe(true);
    expect(r.summary).toMatch(/z 7 punktów/);
  });

  const facts = ["Udział osób w wieku 60+ w liczbie ludności – gmina Drwinia: 22,07% (powiat bocheński: 23,33%). Źródło: IOSS, dane za 2024 r."];

  it("dane IOSS trafiają do modelu jako dane; propozycja z wymyśloną liczbą jest odrzucana", async () => {
    const withNumbers = {
      ...aiOut,
      points: aiOut.points.map((p) =>
        p.section === "diagnoza" ? { ...p, suggestion: "W gminie Drwinia 22,07% mieszkańców ma 60+ (2024)." } : p.section === "wizja" ? { ...p, status: "do-poprawy", suggestion: "Za 3 lata obejmiemy 500 seniorów." } : p,
      ),
    };
    const { claude, parse } = fakeClaude(withNumbers);
    const r = await coachIdea({ ...draft, place: "gmina Drwinia", facts }, innovations, { claude });
    const content = (parse.mock.calls[0]![0] as { messages: { content: string }[] }).messages[0]!.content;
    expect(content).toContain('<dane_ioss miejsce="gmina Drwinia">');
    expect(content).toContain("<wskaznik>Udział osób w wieku 60+");
    // liczby z IOSS – zostają; „500 seniorów” nie ma w źródłach – propozycja odrzucona (punkt z trybu lokalnego)
    expect(r.points.find((p) => p.section === "diagnoza")!.suggestion).toContain("22,07%");
    expect(r.points.find((p) => p.section === "wizja")!.suggestion).toBeUndefined();
  });

  it("tryb lokalny z danymi IOSS: diagnoza bez liczb dostaje propozycję z prawdziwymi wskaźnikami", () => {
    const r = localCoach({ ...draft, place: "gmina Drwinia", facts, sections: { ...draft.sections, diagnoza: "Seniorzy są samotni." } }, innovations);
    const d = r.points.find((p) => p.section === "diagnoza")!;
    expect(d.status).toBe("do-poprawy");
    expect(d.suggestion).toBe(`Seniorzy są samotni.\n\n${facts[0]}`);
    // diagnoza z liczbami – bez propozycji
    const r2 = localCoach({ ...draft, facts, sections: { ...draft.sections, diagnoza: "W gminie 22% osób ma 60+. ".repeat(8) } }, innovations);
    expect(r2.points.find((p) => p.section === "diagnoza")!.suggestion).toBeUndefined();
  });

  it("bez klucza AI asystent fiszki nie wywołuje modelu", async () => {
    vi.stubEnv("HUB_AI", "off");
    expect((await coachIdea(draft, innovations)).source).toBe("lokalne");
  });
});

describe("Asystent kreatora i Middleman z AI", () => {
  it("sekcje od modelu + inspiracje tylko z katalogu Biblioteki ROPS", async () => {
    const { claude, parse } = fakeClaude({
      sections: [{ title: "Doprecyzuj problem", items: ["Kogo dokładnie dotyczy samotność?"] }],
      inspirations: [{ id: "rops-bawita", reason: "Pokazuje, jak angażować seniorów." }, { id: "wymyslona", reason: "x" }],
    });
    const r = await llmAssistantRun({ kind: "develop-idea", input: "Uczniowie uczą seniorów smartfonów" }, { claude });
    expect(r?.source).toBe("llm");
    expect(r?.sections[0]).toEqual({ title: "Doprecyzuj problem", items: ["Kogo dokładnie dotyczy samotność?"] });
    expect(r?.sections.at(-1)?.title).toBe("Zainspiruj się (Biblioteka ROPS)");
    expect(r?.sections.at(-1)?.items).toHaveLength(1);
    expect((parse.mock.calls[0]![0] as { messages: { content: string }[] }).messages[0]!.content).toContain("<opis>\nUczniowie uczą seniorów smartfonów");
  });

  it("Middleman przekazuje opis instytucji; pusta odpowiedź modelu → null (tryb lokalny)", async () => {
    const { claude, parse } = fakeClaude({ sections: [], inspirations: [] });
    expect(await llmAssistantRun({ kind: "adapt-innovation", input: "BaWita", context: "Gmina wiejska" }, { claude })).toBeNull();
    expect((parse.mock.calls[0]![0] as { messages: { content: string }[] }).messages[0]!.content).toContain("<instytucja>\nGmina wiejska");
  });

  it("HUB_AI=off → asystent lokalny", async () => {
    vi.stubEnv("HUB_AI", "off");
    expect((await getAssistant().run({ kind: "develop-idea", input: "Spotkania dla seniorów" })).source).toBe("local");
  });
});
