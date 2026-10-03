"use client";

import { useEffect, useRef, useState } from "react";
import { postJson } from "@/lib/client";
import type { IdeaPrefillField, Nabor } from "@/lib/types";
import { CodeCard } from "./CodeCard";
import { Icon } from "./Icon";
import { Field, Panel, Status, btnCls, btnSecondaryCls, inputCls } from "./ui";

interface IdeaPrefill {
  title: string;
  idea?: { essence: string; audience: string; problem?: string; innovativeness?: string; change?: string; vision?: string };
}

/**
 * Generator wniosków: formularz budowany z pytań wybranego naboru,
 * z możliwością wczytania treści z wcześniej wysłanej fiszki (po kodzie).
 */
export function ApplicationForm({ nabor, initialIdeaCode = "" }: { nabor: Nabor; initialIdeaCode?: string }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [ideaCode, setIdeaCode] = useState(initialIdeaCode);
  const [loadedFrom, setLoadedFrom] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const autoLoaded = useRef(false);

  async function loadIdea(c: string) {
    setLoadError(null);
    const res = await fetch(`/api/status?code=${encodeURIComponent(c)}`);
    const data = (await res.json().catch(() => ({}))) as IdeaPrefill & { error?: string };
    if (!res.ok || !data.idea) {
      setLoadError(data.error ?? "Ten kod nie należy do fiszki pomysłu.");
      return;
    }
    // starsze fiszki nie mają pola "problem" – wtedy opis rozwiązania
    const source: Partial<Record<IdeaPrefillField, string>> = { ...data.idea, title: data.title, problem: data.idea.problem || data.idea.essence };
    setAnswers((prev) => {
      const next = { ...prev };
      for (const q of nabor.questions) if (q.prefillFrom && !next[q.id] && source[q.prefillFrom]) next[q.id] = source[q.prefillFrom]!;
      return next;
    });
    setLoadedFrom(c.toUpperCase());
  }

  useEffect(() => {
    if (initialIdeaCode && !autoLoaded.current) {
      autoLoaded.current = true;
      void loadIdea(initialIdeaCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialIdeaCode]);

  const filled = nabor.questions.filter((q) => (answers[q.id] ?? "").trim().length >= 3).length;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await postJson<{ code: string }>("/api/applications", { naborId: nabor.id, ideaCode: loadedFrom ?? undefined, answers });
      setCode(res.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd.");
    } finally {
      setBusy(false);
    }
  }

  if (code) return <CodeCard code={code} kind="wniosku" />;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <Panel>
        <form onSubmit={onSubmit} className="space-y-6">
          {nabor.questions.map((q, i) => {
            const v = answers[q.id] ?? "";
            const long = q.maxLength > 200;
            return (
              <Field key={q.id} id={`q-${q.id}`} label={`${i + 1}. ${q.label}`} hint={q.hint}>
                {long ? (
                  <textarea
                    id={`q-${q.id}`}
                    aria-describedby={`q-${q.id}-hint q-${q.id}-count`}
                    required
                    rows={4}
                    maxLength={q.maxLength}
                    value={v}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    className={inputCls}
                  />
                ) : (
                  <input
                    id={`q-${q.id}`}
                    aria-describedby={`q-${q.id}-count`}
                    required
                    maxLength={q.maxLength}
                    value={v}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    className={inputCls}
                  />
                )}
                <p id={`q-${q.id}-count`} className="text-right text-xs text-slate-600">
                  {v.length} / {q.maxLength} znaków
                </p>
              </Field>
            );
          })}
          <div className="flex flex-wrap items-center gap-4 border-t border-slate-200 pt-6">
            <button type="submit" disabled={busy} className={btnCls}>
              <Icon name="send" className="h-5 w-5" /> {busy ? "Wysyłam…" : "Złóż wniosek"}
            </button>
            <p className="text-sm text-slate-600">
              Uzupełniono {filled} z {nabor.questions.length} pól
            </p>
          </div>
          <Status error={error} />
        </form>
      </Panel>

      <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-2xl bg-brand-50 p-6">
          <h2 className="text-lg font-black">Masz już fiszkę?</h2>
          <p className="mt-1 text-[0.95rem] text-slate-700">Wpisz jej kod – przepiszemy tytuł, opis i odbiorców do wniosku.</p>
          <div className="mt-3 flex gap-2">
            <label htmlFor="idea-code" className="sr-only">
              Kod fiszki
            </label>
            <input id="idea-code" value={ideaCode} onChange={(e) => setIdeaCode(e.target.value)} placeholder="HUB-…" className={`${inputCls} py-2 font-bold uppercase`} />
            <button type="button" onClick={() => ideaCode && void loadIdea(ideaCode)} className={btnSecondaryCls}>
              Wczytaj
            </button>
          </div>
          <div aria-live="polite" className="mt-2 text-sm">
            {loadedFrom && <p className="font-bold text-emerald-800">Wczytano treść z fiszki {loadedFrom}.</p>}
            {loadError && <p className="font-bold text-red-800">{loadError}</p>}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-black">Postęp</h2>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-mist">
            <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${(filled / nabor.questions.length) * 100}%` }} />
          </div>
          <p className="mt-2 text-sm text-slate-700">
            {filled} z {nabor.questions.length} pól uzupełnionych
          </p>
        </div>
      </aside>
    </div>
  );
}
