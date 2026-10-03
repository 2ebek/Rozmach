"use client";

import { useState } from "react";
import { postJson } from "@/lib/client";
import { AREAS, AREA_COLOR, AREA_LABEL } from "@/lib/labels";
import type { ChallengeArea, Innovation } from "@/lib/types";
import { Icon } from "./Icon";
import { Dot, Field, Panel, Status, btnCls, inputCls } from "./ui";

const RATING_LABEL = ["", "Słabo", "Tak sobie", "Dobrze", "Bardzo dobrze", "Świetnie"];

const focusRing = "has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent";

export function FeedbackForm({ innovations }: { innovations: Innovation[] }) {
  // 114 innowacji z Biblioteki ROPS – wybór w dwóch krokach: kategoria, potem innowacja
  const categories = AREAS.filter((a) => innovations.some((i) => i.areas.includes(a)));
  const [category, setCategory] = useState<ChallengeArea>(categories[0] ?? "dla-seniorow");
  const inCategory = innovations.filter((i) => i.areas.includes(category));
  const [innovationId, setInnovationId] = useState(inCategory[0]?.id ?? "");
  const selected = innovations.find((i) => i.id === innovationId);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [wantsToTest, setWantsToTest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    if (!rating) {
      setError("Wybierz ocenę od 1 do 5 gwiazdek.");
      return;
    }
    try {
      await postJson("/api/feedback", { innovationId, rating, comment, wantsToTest });
      setOk(wantsToTest ? "Dziękujemy! Zapisaliśmy opinię i zgłoszenie do testów." : "Dziękujemy za opinię!");
      setComment("");
      setRating(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd.");
    }
  }

  const shown = hover || rating;

  return (
    <Panel>
      <form onSubmit={onSubmit} className="space-y-8">
        <fieldset>
          <legend className="mb-3 text-lg font-black text-brand-900">1. Którą innowację oceniasz?</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="fb-category" label="Kategoria Biblioteki ROPS">
              <select
                id="fb-category"
                value={category}
                onChange={(e) => {
                  const c = e.target.value as ChallengeArea;
                  setCategory(c);
                  setInnovationId(innovations.find((i) => i.areas.includes(c))?.id ?? "");
                }}
                className={inputCls}
              >
                {categories.map((a) => (
                  <option key={a} value={a}>
                    {AREA_LABEL[a]}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="fb-innovation" label="Innowacja">
              <select id="fb-innovation" value={innovationId} onChange={(e) => setInnovationId(e.target.value)} className={inputCls}>
                {inCategory.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.title}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          {selected && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-mist px-4 py-3 text-[0.95rem] text-slate-800">
              <Dot className={`mt-2 ${AREA_COLOR[category]}`} />
              <span>
                <strong>{selected.title}</strong>
                {selected.subtitle ? ` – ${selected.subtitle}` : ""}
              </span>
            </p>
          )}
        </fieldset>

        <fieldset>
          <legend className="mb-3 text-lg font-black text-brand-900">2. Twoja ocena</legend>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} onMouseEnter={() => setHover(n)} className={`cursor-pointer rounded-md p-0.5 ${focusRing}`}>
                  <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} className="sr-only" />
                  <span className="sr-only">
                    {n} na 5 – {RATING_LABEL[n]}
                  </span>
                  <svg aria-hidden viewBox="0 0 24 24" className={`h-10 w-10 transition ${n <= shown ? "fill-sun stroke-sun" : "fill-transparent stroke-slate-400"}`} strokeWidth={1.5} strokeLinejoin="round">
                    <path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z" />
                  </svg>
                </label>
              ))}
            </div>
            <span className="min-w-[8rem] text-lg font-bold text-brand-900">{shown ? RATING_LABEL[shown] : "Wybierz gwiazdki"}</span>
          </div>
        </fieldset>

        <Field id="fb-comment" label="3. Uwagi i propozycje usprawnień (opcjonalnie)">
          <textarea id="fb-comment" rows={4} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Co działa dobrze? Co warto zmienić?" className={inputCls} />
        </Field>

        <label className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition ${focusRing} ${wantsToTest ? "border-emerald-700 bg-emerald-50" : "border-slate-200 hover:border-slate-400"}`}>
          <input type="checkbox" checked={wantsToTest} onChange={(e) => setWantsToTest(e.target.checked)} className="sr-only" />
          <span aria-hidden className={`relative h-7 w-12 shrink-0 rounded-full transition ${wantsToTest ? "bg-emerald-700" : "bg-slate-300"}`}>
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${wantsToTest ? "left-6" : "left-1"}`} />
          </span>
          <span>
            <span className="block font-bold text-brand-900">Chcę wziąć udział w testach tej innowacji</span>
            <span className="text-sm text-slate-600">Zgłoszenie trafi do zespołu Hubu.</span>
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-4 border-t border-slate-200 pt-6">
          <button type="submit" className={btnCls}>
            <Icon name="send" className="h-5 w-5" /> Wyślij opinię
          </button>
        </div>
        <Status error={error} ok={ok} />
      </form>
    </Panel>
  );
}
