"use client";

import { useEffect, useState } from "react";

const SIZES = [
  { label: "A", title: "Domyślna wielkość tekstu", pct: "100%" },
  { label: "A+", title: "Większy tekst", pct: "112.5%" },
  { label: "A++", title: "Największy tekst", pct: "125%" },
];

function load(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* tryb prywatny – ustawienie działa do odświeżenia strony */
  }
}

/** Pasek dostępności: wielkość tekstu i wersja kontrastowa (WCAG 1.4.4, 1.4.6). */
export function AccessibilityBar() {
  const [size, setSize] = useState(0);
  const [hc, setHc] = useState(false);

  useEffect(() => {
    setSize(Number(load("a11y-size") ?? 0) || 0);
    setHc(load("a11y-hc") === "1");
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = SIZES[size]?.pct ?? "100%";
    document.documentElement.classList.toggle("hc", hc);
  }, [size, hc]);

  return (
    <div className="flex items-center gap-4">
      <div role="group" aria-label="Wielkość tekstu" className="flex items-baseline gap-1">
        {SIZES.map((s, i) => (
          <button
            key={s.label}
            type="button"
            title={s.title}
            aria-pressed={size === i}
            onClick={() => {
              setSize(i);
              save("a11y-size", String(i));
            }}
            className={`px-1 font-bold ${size === i ? "text-brand-700 underline" : "text-slate-800"}`}
            style={{ fontSize: `${0.8 + i * 0.12}rem` }}
          >
            {s.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        aria-pressed={hc}
        onClick={() => {
          setHc(!hc);
          save("a11y-hc", hc ? "0" : "1");
        }}
        className="flex items-center gap-1.5 font-semibold text-slate-800 hover:underline"
      >
        <span aria-hidden className="inline-block h-3.5 w-3.5 rounded-full border-2 border-current bg-[linear-gradient(90deg,currentColor_50%,transparent_50%)]" />
        Wersja kontrastowa
      </button>
    </div>
  );
}
