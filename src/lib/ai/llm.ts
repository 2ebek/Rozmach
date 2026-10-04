import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { ApiError, GoogleGenAI } from "@google/genai";
import * as z from "zod/v4";

/**
 * Wspólna warstwa wywołań modelu dla wszystkich funkcji AI Hubu (matchmaking, fiszka, asystent kreatora, Middleman).
 * Claude albo Gemini (AI_PROVIDER), odpowiedź zawsze w schemacie Zod. Każdy problem (brak klucza, błąd, odmowa,
 * limit czasu, odpowiedź niezgodna ze schematem) → null, a wywołujący przechodzi na tryb lokalny.
 */

export const CLAUDE_MODEL = "claude-opus-5-5";
/**
 * Domyślny model Gemini; zmiana przez GEMINI_MODEL. Wersja „lite” – szybka, z wyższym dziennym limitem w planie
 * bezpłatnym (modele flash wyczerpywały limit w trakcie dnia demo).
 */
export const GEMINI_DEFAULT_MODEL = "gemini-3.5-flash-lite";
/** Model zapasowy przy przeciążeniu lub limicie (503/429/500); zmiana przez GEMINI_FALLBACK_MODEL. */
export const GEMINI_FALLBACK_MODEL = "gemini-2.5-flash-lite";
const geminiModel = () => process.env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL;
const geminiFallbackModel = () => process.env.GEMINI_FALLBACK_MODEL || GEMINI_FALLBACK_MODEL;
const GEMINI_RETRYABLE = new Set([429, 500, 503]);

export type AiProvider = "claude" | "gemini";

/**
 * Dostawca AI: AI_PROVIDER (claude|gemini) albo automatycznie wg dostępnego klucza (najpierw Gemini, potem Claude).
 * HUB_AI=off wyłącza AI. Wybrany dostawca bez klucza = brak AI (tryb podstawowy).
 */
export function aiProvider(): AiProvider | null {
  if (process.env.HUB_AI === "off") return null;
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasClaude = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
  const wanted = process.env.AI_PROVIDER;
  if (wanted === "gemini") return hasGemini ? "gemini" : null;
  if (wanted === "claude") return hasClaude ? "claude" : null;
  return hasGemini ? "gemini" : hasClaude ? "claude" : null;
}

export function aiEnabled(): boolean {
  return aiProvider() !== null;
}

/** Wstrzykiwane klienty (testy). Bez nich klient tworzy się z kluczy w env. */
export interface AiClients {
  claude?: Anthropic;
  gemini?: GoogleGenAI;
}

let claudeClient: Anthropic | null = null;
let geminiClient: GoogleGenAI | null = null;

export interface StructuredRequest<S extends z.ZodType> {
  /** Krótka nazwa funkcji do logów, np. "ai-match". */
  tag: string;
  schema: S;
  system: string;
  /** Duży, stały kontekst (np. katalog Biblioteki) – w Claude cache'owany, w Gemini dołączany do instrukcji systemowej. */
  context?: string;
  user: string;
  maxTokens?: number;
  effort?: "low" | "medium" | "high";
  /** Limit czasu jednej próby Gemini (ms). Domyślnie 15 s – dwie próby mieszczą się w ~30 s. */
  timeoutMs?: number;
  clients?: AiClients;
}

/** Po 429 (wyczerpany limit) model główny Gemini jest pomijany przez ten czas – zapytania idą od razu na zapasowy. */
const QUOTA_COOLDOWN_MS = 10 * 60_000;
let primaryCooldownUntil = 0;
/** Tylko dla testów. */
export function resetGeminiCooldown() {
  primaryCooldownUntil = 0;
}

export async function generateStructured<S extends z.ZodType>(req: StructuredRequest<S>): Promise<z.infer<S> | null> {
  const clients = req.clients ?? {};
  const provider: AiProvider | null = clients.gemini ? "gemini" : clients.claude ? "claude" : aiProvider();
  if (!provider) return null;
  try {
    return provider === "gemini"
      ? await askGemini(req, clients.gemini ?? (geminiClient ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })))
      : await askClaude(req, clients.claude ?? (claudeClient ??= new Anthropic({ timeout: 30_000, maxRetries: 1 })));
  } catch (err) {
    const t = `[${req.tag}]`;
    if (err instanceof Anthropic.AuthenticationError) console.warn(`${t} nieprawidłowy klucz Claude – tryb podstawowy`);
    else if (err instanceof Anthropic.RateLimitError) console.warn(`${t} limit zapytań Claude – tryb podstawowy`);
    else if (err instanceof Anthropic.APIError) console.warn(`${t} błąd API Claude ${err.status} – tryb podstawowy`);
    else if (err instanceof ApiError) console.warn(`${t} błąd API Gemini ${err.status} – tryb podstawowy`);
    else console.warn(`${t} AI (${provider}) niedostępne – tryb podstawowy:`, err instanceof Error ? err.message : err);
    return null;
  }
}

/** Claude: structured outputs (schemat Zod) + automatyczny fallback przy odmowie. */
async function askClaude<S extends z.ZodType>(req: StructuredRequest<S>, client: Anthropic): Promise<z.infer<S> | null> {
  const response = await client.beta.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: req.maxTokens ?? 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: req.effort ?? "medium", format: betaZodOutputFormat(req.schema) },
    system: [{ type: "text", text: req.system }, ...(req.context ? [{ type: "text" as const, text: req.context, cache_control: { type: "ephemeral" as const } }] : [])],
    messages: [{ role: "user", content: req.user }],
  });
  if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens" || !response.parsed_output) {
    console.warn(`[${req.tag}] brak użytecznej odpowiedzi Claude (stop_reason: ${response.stop_reason})`);
    return null;
  }
  return response.parsed_output as z.infer<S>;
}

const jsonSchemas = new WeakMap<z.ZodType, Record<string, unknown>>();
/** Schemat JSON dla Gemini wyprowadzony z tego samego schematu Zod (bez pola $schema). */
function geminiSchema(schema: z.ZodType): Record<string, unknown> {
  let s = jsonSchemas.get(schema);
  if (!s) {
    const { $schema: _ignored, ...rest } = z.toJSONSchema(schema) as Record<string, unknown>;
    s = rest;
    jsonSchemas.set(schema, s);
  }
  return s;
}

/** Gemini: bezstanowe generateContent z odpowiedzią JSON według schematu; przy przeciążeniu jedna próba na modelu zapasowym. */
async function askGemini<S extends z.ZodType>(req: StructuredRequest<S>, client: GoogleGenAI): Promise<z.infer<S> | null> {
  const primary = geminiModel();
  const fallback = geminiFallbackModel();
  if (fallback !== primary && Date.now() < primaryCooldownUntil) return askGeminiModel(req, client, fallback);
  try {
    return await askGeminiModel(req, client, primary);
  } catch (err) {
    if (!(err instanceof ApiError) || !GEMINI_RETRYABLE.has(err.status) || fallback === primary) throw err;
    if (err.status === 429) primaryCooldownUntil = Date.now() + QUOTA_COOLDOWN_MS;
    console.warn(`[${req.tag}] Gemini ${primary}: ${err.status} – próba na ${fallback}`);
    return askGeminiModel(req, client, fallback);
  }
}

async function askGeminiModel<S extends z.ZodType>(req: StructuredRequest<S>, client: GoogleGenAI, model: string): Promise<z.infer<S> | null> {
  const response = await client.models.generateContent({
    model,
    contents: req.user,
    config: {
      systemInstruction: req.context ? `${req.system}\n\n${req.context}` : req.system,
      responseMimeType: "application/json",
      responseJsonSchema: geminiSchema(req.schema),
      // Modele 2.5 domyślnie „myślą” przed odpowiedzią – przy długim JSON-ie nie mieszczą się w limicie czasu.
      ...(model.startsWith("gemini-2.5") ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
      abortSignal: AbortSignal.timeout(req.timeoutMs ?? 15_000),
    },
  });
  const text = response.text;
  if (!text) {
    console.warn(`[${req.tag}] pusta odpowiedź Gemini (finishReason: ${response.candidates?.[0]?.finishReason ?? "brak"})`);
    return null;
  }
  const parsed = req.schema.safeParse(JSON.parse(text));
  if (!parsed.success) {
    console.warn(`[${req.tag}] odpowiedź Gemini niezgodna ze schematem`);
    return null;
  }
  return parsed.data as z.infer<S>;
}
