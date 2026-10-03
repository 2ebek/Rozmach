"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AREAS, AREA_LABEL } from "@/lib/labels";
import type { ChallengeArea } from "@/lib/types";
import { Icon } from "../Icon";

const KEY = "rozmach-szkic";
type Draft = { title: string; text: string; place: string; area: ChallengeArea | "" };
const EMPTY: Draft = { title: "", text: "", place: "", area: "" };

const field = "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[0.95rem] text-ink placeholder:text-slate-500 focus:border-brand-700";
const label = "mb-1.5 block text-sm font-semibold text-brand-900";

/**
 * „Co chcesz zmienić?” – krok 1 zgłoszenia potrzeby z makiety. Krok 2 to wyniki matchmakingu (/dopasuj).
 * Szkic zostaje tylko w tej przeglądarce; bez danych osobowych.
 */
export function NeedForm() {
  const router = useRouter();
  const [d, setD] = useState<Draft>(EMPTY);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setD({ ...EMPTY, ...(JSON.parse(raw) as Partial<Draft>) });
    } catch {
      /* brak dostępu do pamięci przeglądarki – formularz działa bez szkicu */
    }
  }, []);

  const set = (patch: Partial<Draft>) => {
    setSaved(false);
    setD({ ...d, ...patch });
  };

  function saveDraft() {
    try {
      localStorage.setItem(KEY, JSON.stringify(d));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = [d.title.trim(), d.text.trim(), d.place.trim() && `Miejsce: ${d.place.trim()}`].filter(Boolean).join(". ");
    const params = new URLSearchParams({ q: q.slice(0, 2000), ...(d.area ? { area: d.area } : {}) });
    router.push(`/dopasuj?${params}`);
  }

  return (
    <form onSubmit={onSubmit} aria-labelledby="need-h" className="rounded-3xl bg-white p-5 shadow-[0_20px_50px_-25px_rgba(19,33,79,0.35)] sm:p-7">
      <div className="flex items-baseline justify-between gap-3">
        <h3 id="need-h" className="text-[1.6rem] font-semibold text-brand-900">
          Co chcesz zmienić?
        </h3>
        <p className="shrink-0 text-sm text-muted">Krok 1 z 2</p>
      </div>
      <div aria-hidden className="mt-4 flex gap-1.5">
        <span className="h-1 flex-1 rounded-full bg-accent" />
        <span className="h-1 flex-1 rounded-full bg-brand-100" />
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <label htmlFor="need-title" className={label}>
            Nazwij potrzebę
          </label>
          <input id="need-title" required maxLength={120} value={d.title} onChange={(e) => set({ title: e.target.value })} placeholder="np. Więcej spotkań dla osób starszych" className={field} />
        </div>
        <div>
          <label htmlFor="need-text" className={label}>
            Co dzieje się w Twojej okolicy?
          </label>
          <textarea
            id="need-text"
            rows={3}
            maxLength={1500}
            value={d.text}
            onChange={(e) => set({ text: e.target.value })}
            placeholder="np. Osobom starszym na naszym osiedlu brakuje okazji do spotkań. Część z nich ma trudności z dotarciem do domu kultury."
            className={field}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="need-place" className={label}>
              Miejsce
            </label>
            <input id="need-place" maxLength={80} value={d.place} onChange={(e) => set({ place: e.target.value })} placeholder="np. osiedle • małe miasto" className={field} />
          </div>
          <div>
            <label htmlFor="need-area" className={label}>
              Kogo dotyczy potrzeba?
            </label>
            <select id="need-area" value={d.area} onChange={(e) => set({ area: e.target.value as ChallengeArea | "" })} className={field}>
              <option value="">Wybierz (opcjonalnie)</option>
              {AREAS.map((a) => (
                <option key={a} value={a}>
                  {AREA_LABEL[a]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="flex items-start gap-3 rounded-xl bg-brand-50 px-4 py-3 text-sm text-muted">
          <Icon name="shield" className="mt-0.5 h-5 w-5 shrink-0 text-brand-900" />
          Nie wpisuj nazwisk ani danych wrażliwych. Kontakt z zespołem Hubu odbywa się przez kod zgłoszenia – bez zakładania konta.
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button type="button" onClick={saveDraft} className="text-sm text-muted underline-offset-2 hover:text-brand-900 hover:underline">
          Zapisz szkic
        </button>
        <span aria-live="polite" className="flex-1 text-sm font-semibold text-emerald-800">
          {saved ? "Szkic zapisany w tej przeglądarce." : ""}
        </span>
        <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-semibold text-white hover:bg-[#b8174a]">
          Dalej <Icon name="external" className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
