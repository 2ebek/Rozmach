"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { postJson } from "@/lib/client";
import { AREAS, AREA_LABEL_ROPS, STAGES, STAGE_LABEL } from "@/lib/labels";
import type { ChallengeArea, IdeaCard, IdeaStage } from "@/lib/types";
import { Icon } from "./Icon";
import { Field, Status, btnCls, inputCls } from "./ui";

type EditableIdea = Pick<
  IdeaCard,
  "id" | "title" | "essence" | "audience" | "stage" | "category" | "problem" | "innovativeness" | "change" | "vision" | "beneficiaries" | "evidence" | "authors"
>;

type TextKey = "essence" | "innovativeness" | "problem" | "audience" | "change" | "vision" | "beneficiaries" | "evidence" | "authors";

/** Pola jak w fiszce (pkt formularza IWS 2.0) + pola karty Biblioteki ROPS, które uzupełnia redakcja. */
const TEXT_FIELDS: { key: TextKey; label: string; max: number; rows: number; required?: boolean }[] = [
  { key: "essence", label: "3. Opis innowacji", max: 4000, rows: 3, required: true },
  { key: "innovativeness", label: "4. Innowacyjność rozwiązania", max: 4000, rows: 2 },
  { key: "problem", label: "5. Diagnoza problemu", max: 4000, rows: 2 },
  { key: "audience", label: "6. Opis odbiorców innowacji", max: 3000, rows: 2, required: true },
  { key: "change", label: "7. Zmiana, jaką wprowadza innowacja", max: 3000, rows: 2 },
  { key: "vision", label: "8. Wizja przyszłości innowacji", max: 3000, rows: 2 },
  { key: "beneficiaries", label: "Karta ROPS: kto może skorzystać z innowacji?", max: 800, rows: 2 },
  { key: "evidence", label: "Karta ROPS: czy to działa?", max: 1200, rows: 2 },
  { key: "authors", label: "Autorzy", max: 200, rows: 1 },
];

/**
 * Formularz pomysłu w panelu administratora – dodawanie (bez `idea`) albo edycja istniejącego.
 * Przy edycji wysyłamy wszystkie pola, żeby nie wymazać tego, co wpisał autor.
 */
export function AdminIdeaForm({ idea }: { idea?: EditableIdea }) {
  const router = useRouter();
  const editing = !!idea;
  const prefix = idea ? `edit-${idea.id}` : "new-idea";
  const initial = () => Object.fromEntries(TEXT_FIELDS.map((f) => [f.key, idea?.[f.key] ?? ""])) as Record<TextKey, string>;
  const [title, setTitle] = useState(idea?.title ?? "");
  const [category, setCategory] = useState<ChallengeArea | "">(idea?.category ?? "");
  const [text, setText] = useState<Record<TextKey, string>>(initial);
  const [stage, setStage] = useState<IdeaStage>(idea?.stage ?? "pomysl");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setBusy(true);
    try {
      const fields = {
        ...Object.fromEntries(TEXT_FIELDS.map((f) => [f.key, f.required ? text[f.key] : text[f.key] || undefined])),
        title,
        stage,
        category: category || undefined,
      };
      if (editing) {
        await postJson("/api/admin", { action: "update-idea", id: idea.id, ...fields });
        setOk("Zapisano zmiany.");
      } else {
        const res = await postJson<{ code: string }>("/api/admin", { action: "add-idea", ...fields });
        setOk(`Dodano pomysł (kod ${res.code}).`);
        setTitle("");
        setText(Object.fromEntries(TEXT_FIELDS.map((f) => [f.key, ""])) as Record<TextKey, string>);
        setCategory("");
        setStage("pomysl");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field id={`${prefix}-title`} label="1. Tytuł innowacji">
        <input id={`${prefix}-title`} required maxLength={150} value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
        <Field id={`${prefix}-category`} label="Kategoria Biblioteki ROPS">
          <select id={`${prefix}-category`} value={category} onChange={(e) => setCategory(e.target.value as ChallengeArea | "")} className={inputCls}>
            <option value="">Bez kategorii</option>
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {AREA_LABEL_ROPS[a]}
              </option>
            ))}
          </select>
        </Field>
        <Field id={`${prefix}-stage`} label="Etap">
          <select id={`${prefix}-stage`} value={stage} onChange={(e) => setStage(e.target.value as IdeaStage)} className={inputCls}>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABEL[s]}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {TEXT_FIELDS.map((f) => {
        const id = `${prefix}-${f.key}`;
        const props = { id, required: f.required, maxLength: f.max, value: text[f.key], className: inputCls };
        const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setText({ ...text, [f.key]: e.target.value });
        return (
          <Field key={f.key} id={id} label={f.label}>
            {f.rows > 1 ? <textarea {...props} rows={f.rows} onChange={onChange} /> : <input {...props} onChange={onChange} />}
          </Field>
        );
      })}
      <button type="submit" disabled={busy} className={btnCls}>
        <Icon name="check" className="h-5 w-5" /> {editing ? "Zapisz zmiany" : "Dodaj pomysł"}
      </button>
      <Status error={error} ok={ok} />
    </form>
  );
}
