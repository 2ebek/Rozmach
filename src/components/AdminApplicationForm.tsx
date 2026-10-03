"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { postJson } from "@/lib/client";
import type { IdeaCard, Nabor } from "@/lib/types";
import { Icon } from "./Icon";
import { Field, Status, btnCls, inputCls } from "./ui";

type IdeaOption = Pick<IdeaCard, "code" | "title" | "essence" | "audience" | "problem" | "innovativeness" | "change" | "vision">;

/**
 * Dodawanie wniosku (aplikacji) przez administratora – np. wniosku złożonego na papierze.
 * Pytania pochodzą z wybranego naboru; opcjonalne powiązanie z pomysłem wypełnia pola z fiszki.
 */
export function AdminApplicationForm({ nabory, ideas }: { nabory: Nabor[]; ideas: IdeaOption[] }) {
  const router = useRouter();
  const [naborId, setNaborId] = useState(nabory[0]?.id ?? "");
  const [ideaCode, setIdeaCode] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const nabor = nabory.find((n) => n.id === naborId);

  function linkIdea(code: string) {
    setIdeaCode(code);
    const idea = ideas.find((i) => i.code === code);
    if (!idea || !nabor) return;
    // puste pola uzupełniamy treścią fiszki (jak w publicznym generatorze wniosków)
    setAnswers((prev) => {
      const next = { ...prev };
      for (const q of nabor.questions) if (q.prefillFrom && !next[q.id]) next[q.id] = (q.prefillFrom === "problem" ? idea.problem || idea.essence : idea[q.prefillFrom]) ?? "";
      // Pkt 11 (zespół) i inne pola bez odpowiednika w fiszce administrator wpisuje z papierowego wniosku.
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setBusy(true);
    try {
      const res = await postJson<{ code: string }>("/api/admin", { action: "add-application", naborId, ideaCode: ideaCode || undefined, answers });
      setOk(`Dodano wniosek (kod ${res.code}).`);
      setAnswers({});
      setIdeaCode("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd.");
    } finally {
      setBusy(false);
    }
  }

  if (nabory.length === 0) return <p className="text-slate-700">Brak naborów – nie można dodać wniosku.</p>;

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="aa-nabor" label="Nabór">
          <select
            id="aa-nabor"
            value={naborId}
            onChange={(e) => {
              setNaborId(e.target.value);
              setAnswers({});
            }}
            className={inputCls}
          >
            {nabory.map((n) => (
              <option key={n.id} value={n.id}>
                {n.title}
                {n.open ? "" : " (zamknięty)"}
              </option>
            ))}
          </select>
        </Field>
        <Field id="aa-idea" label="Powiązany pomysł (opcjonalnie)">
          <select id="aa-idea" value={ideaCode} onChange={(e) => linkIdea(e.target.value)} className={inputCls}>
            <option value="">Bez powiązania</option>
            {ideas.map((i) => (
              <option key={i.code} value={i.code}>
                {i.title} ({i.code})
              </option>
            ))}
          </select>
        </Field>
      </div>
      {nabor?.questions.map((q) => {
        const long = q.maxLength > 200;
        const v = answers[q.id] ?? "";
        const set = (value: string) => setAnswers({ ...answers, [q.id]: value });
        return (
          <Field key={`${nabor.id}-${q.id}`} id={`aa-${q.id}`} label={q.label}>
            {long ? (
              <textarea id={`aa-${q.id}`} required rows={3} maxLength={q.maxLength} value={v} onChange={(e) => set(e.target.value)} className={inputCls} />
            ) : (
              <input id={`aa-${q.id}`} required maxLength={q.maxLength} value={v} onChange={(e) => set(e.target.value)} className={inputCls} />
            )}
          </Field>
        );
      })}
      <button type="submit" disabled={busy} className={btnCls}>
        <Icon name="file" className="h-5 w-5" /> {busy ? "Zapisuję…" : "Dodaj wniosek"}
      </button>
      <Status error={error} ok={ok} />
    </form>
  );
}
