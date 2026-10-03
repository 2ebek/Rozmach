"use client";

import { useState } from "react";
import type { AssistantResponse } from "@/lib/ai/assistant";
import { postJson } from "@/lib/client";
import { Icon } from "./Icon";
import { Field, Status, btnCls, inputCls } from "./ui";

interface Props {
  kind: "develop-idea" | "adapt-innovation";
  inputLabel: string;
  inputPlaceholder?: string;
  contextLabel?: string;
  contextPlaceholder?: string;
  submitLabel: string;
  /** Wartość startowa pola głównego (np. nazwa innowacji z karty Biblioteki). */
  initialInput?: string;
}

/** Wspólny panel asystenta: Asystent kreatora (III) i Middleman Innowacji (VII). */
export function AssistantPanel({ kind, inputLabel, inputPlaceholder, contextLabel, contextPlaceholder, submitLabel, initialInput = "" }: Props) {
  const [input, setInput] = useState(initialInput);
  const [context, setContext] = useState("");
  const [answer, setAnswer] = useState<AssistantResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      setAnswer(await postJson<AssistantResponse>("/api/assistant", { kind, input, context: context || undefined }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form onSubmit={onSubmit} className="space-y-5">
        <Field id={`${kind}-input`} label={inputLabel}>
          <textarea id={`${kind}-input`} required rows={5} value={input} onChange={(e) => setInput(e.target.value)} placeholder={inputPlaceholder} className={inputCls} />
        </Field>
        {contextLabel && (
          <Field id={`${kind}-ctx`} label={contextLabel}>
            <textarea id={`${kind}-ctx`} rows={4} value={context} onChange={(e) => setContext(e.target.value)} placeholder={contextPlaceholder} className={inputCls} />
          </Field>
        )}
        <button type="submit" disabled={loading} className={btnCls}>
          <Icon name="sparkle" className="h-5 w-5" />
          {loading ? "Analizuję…" : submitLabel}
        </button>
        <Status error={error} />
      </form>

      <div aria-live="polite" className="min-h-[16rem] rounded-2xl bg-mist p-6">
        {!answer && !loading && (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-600">
            <span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-white text-brand-700 shadow-sm">
              <Icon name="sparkle" className="h-7 w-7" />
            </span>
            <p className="max-w-xs">Tu pojawią się podpowiedzi asystenta – pytania, kolejne kroki i podobne innowacje.</p>
          </div>
        )}
        {loading && (
          <div aria-hidden className="space-y-3">
            <div className="h-4 w-1/3 animate-pulse rounded bg-slate-300" />
            <div className="h-3 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-slate-200" />
          </div>
        )}
        {answer && !loading && (
          <div className="space-y-5">
            <p className="flex items-center gap-2 text-sm font-bold text-brand-700">
              <Icon name="sparkle" className="h-4 w-4" /> Podpowiedzi asystenta
              <span className="font-medium text-muted">{answer.source === "llm" ? "(AI • wersja robocza – sprawdź przed użyciem)" : "(tryb podstawowy, bez AI)"}</span>
            </p>
            {answer.sections.map((s) => (
              <div key={s.title} className="rounded-xl bg-white p-5">
                <h3 className="font-black text-brand-900">{s.title}</h3>
                <ul className="mt-2 space-y-2 text-[0.95rem] text-slate-800">
                  {s.items.map((it) => (
                    <li key={it} className="flex gap-2.5">
                      <span aria-hidden className="mt-1 text-emerald-700">
                        <Icon name="check" className="h-4 w-4" />
                      </span>
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
