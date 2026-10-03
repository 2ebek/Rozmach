"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "./Icon";
import { btnSecondaryCls, inputCls } from "./ui";

/**
 * Komentarz zespołu Hubu do fiszki (panel administratora). W odróżnieniu od rozmowy to jedna, aktualna notatka
 * przy fiszce – np. uzasadnienie decyzji. Autor widzi ją na stronie statusu.
 */
export function IdeaComment({ id, comment }: { id: string; comment?: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(comment ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fieldId = `comment-${id}`;

  async function save(value: string) {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "idea-comment", id, comment: value }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Nie udało się zapisać.");
      return;
    }
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4" data-comment>
        <p className="flex items-center gap-2 text-sm font-bold text-brand-900">
          <Icon name="message" className="h-4 w-4" /> Komentarz zespołu
          <span className="font-normal text-muted">· widoczny dla autora na stronie statusu</span>
        </p>
        {comment ? <p className="mt-1 whitespace-pre-line text-slate-800">{comment}</p> : <p className="mt-1 text-sm text-muted">Brak komentarza.</p>}
        <p className="mt-2 flex gap-4">
          <button type="button" onClick={() => { setText(comment ?? ""); setEditing(true); }} className="text-sm font-bold text-brand-700 underline-offset-2 hover:underline">
            {comment ? "Edytuj komentarz" : "Dodaj komentarz"}
          </button>
          {comment && (
            <button type="button" disabled={busy} onClick={() => save("")} className="text-sm font-bold text-muted underline-offset-2 hover:underline">
              Usuń komentarz
            </button>
          )}
        </p>
        {error && <p role="alert" className="mt-2 text-sm font-bold text-red-800">{error}</p>}
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save(text);
      }}
      className="mt-4 rounded-lg border border-slate-200 bg-white p-4"
      data-comment
    >
      <label htmlFor={fieldId} className="text-sm font-bold text-brand-900">
        Komentarz zespołu do fiszki
      </label>
      <p id={`${fieldId}-hint`} className="text-sm text-muted">
        Np. uzasadnienie decyzji albo co poprawić. Autor zobaczy go na stronie statusu (po kodzie zgłoszenia).
      </p>
      <textarea id={fieldId} aria-describedby={`${fieldId}-hint`} rows={3} maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} className={`${inputCls} mt-2`} autoFocus />
      <p className="text-right text-xs text-slate-600">{text.length} / 1000 znaków</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy || !text.trim()} className={`${btnSecondaryCls} py-2`}>
          {busy ? "Zapisuję…" : "Zapisz komentarz"}
        </button>
        <button type="button" onClick={() => setEditing(false)} className="text-sm font-bold text-muted underline-offset-2 hover:underline">
          Anuluj
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm font-bold text-red-800">{error}</p>}
    </form>
  );
}
