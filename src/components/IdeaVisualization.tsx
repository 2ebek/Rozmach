"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { Field, btnCls, inputCls } from "./ui";

const STYLES = ["Szkic koncepcyjny", "Ilustracja", "Zdjęcie produktu", "Plakat informacyjny"] as const;

/**
 * Wizualizacja pomysłu (asystent kreatora): opis obrazu, np. innowacyjnego przedmiotu albo miejsca.
 * Generowanie obrazów wymaga płatnego planu modelu AI – w prototypie przycisk jest wyłączony, a pole pozwala przygotować opis.
 */
export function IdeaVisualization() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<(typeof STYLES)[number]>(STYLES[0]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]" data-visualization>
      <div className="space-y-5">
        <Field id="viz-prompt" label="Co ma przedstawiać wizualizacja?" hint="Opisz przedmiot, miejsce albo sytuację: kto z niego korzysta, gdzie, jak wygląda. Nie podawaj danych osobowych.">
          <textarea
            id="viz-prompt"
            aria-describedby="viz-prompt-hint viz-prompt-count"
            rows={4}
            maxLength={1000}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="np. Mobilna szafka z grami planszowymi na kółkach, którą seniorzy i uczniowie rozkładają w świetlicy wiejskiej"
            className={inputCls}
          />
          <p id="viz-prompt-count" className="text-right text-xs text-slate-600">
            {prompt.length} / 1000 znaków
          </p>
        </Field>
        <fieldset>
          <legend className="mb-2 font-bold text-brand-900">Styl obrazu</legend>
          <div className="flex flex-wrap gap-2">
            {STYLES.map((s) => (
              <label
                key={s}
                className={`cursor-pointer rounded-full border-2 px-4 py-2 text-sm font-bold has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-accent ${
                  style === s ? "border-brand-900 bg-brand-900 text-white" : "border-slate-300 text-brand-900 hover:border-brand-900"
                }`}
              >
                <input type="radio" name="viz-style" value={s} checked={style === s} onChange={() => setStyle(s)} className="sr-only" />
                {s}
              </label>
            ))}
          </div>
        </fieldset>
        <div id="viz-paid" role="note" className="rounded-xl border-l-4 border-amber-500 bg-amber-50 p-4 text-amber-950">
          <p className="font-bold">Generowanie obrazów wymaga płatnego planu AI.</p>
          <p className="mt-1 text-sm">
            Modele tworzące obrazy (np. Gemini Image, Imagen) nie są dostępne w darmowym planie, z którego korzysta prototyp. Po wykupieniu planu przycisk
            poniżej utworzy wizualizację z opisu – na razie możesz przygotować opis i wykorzystać go w fiszce lub w Canvie.
          </p>
        </div>
        <button type="button" disabled aria-describedby="viz-paid" className={`${btnCls} cursor-not-allowed opacity-60`}>
          <Icon name="sparkle" className="h-5 w-5" /> Wygeneruj wizualizację
        </button>
      </div>

      {/* Miejsce na wynik */}
      <div aria-hidden className="flex aspect-square flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-mist p-6 text-center lg:self-start">
        <Icon name="sparkle" className="h-10 w-10 text-slate-500" />
        <p className="mt-3 font-bold text-slate-700">Tu pojawi się wizualizacja</p>
        <p className="mt-1 text-sm text-slate-600">{style}</p>
      </div>
    </div>
  );
}
