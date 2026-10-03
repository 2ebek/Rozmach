import type { Nabor } from "./types";

/**
 * Walidacja odpowiedzi wniosku względem pytań naboru – wspólna dla generatora (/api/applications)
 * i dodawania wniosku przez administratora. Tylko pytania tego naboru, każde wymagane i w limicie znaków.
 */
export function validateAnswers(nabor: Nabor, input: Record<string, string>): { answers: Record<string, string> } | { error: string } {
  const answers: Record<string, string> = {};
  for (const q of nabor.questions) {
    const a = (input[q.id] ?? "").trim();
    if (a.length < 3) return { error: `Uzupełnij pole: „${q.label}”.` };
    if (a.length > q.maxLength) return { error: `Pole „${q.label}” jest za długie.` };
    answers[q.id] = a;
  }
  return { answers };
}
