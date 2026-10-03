"use client";

import { useState } from "react";
import { postJson } from "@/lib/client";
import { AREAS, AREA_COLOR, AREA_LABEL, ROLE_LABEL } from "@/lib/labels";
import type { ChallengeArea, PartnerOffer, Role } from "@/lib/types";
import { Icon } from "./Icon";
import { Dot, Field, Status, btnCls, inputCls } from "./ui";

type Filter = "all" | PartnerOffer["kind"];

const KIND = {
  szukam: { label: "Szukam partnera", cls: "bg-rose-50 text-accent" },
  oferuje: { label: "Oferuję wsparcie", cls: "bg-emerald-50 text-emerald-800" },
} as const;

/** Giełda partnerstw: ogłoszenia "szukam / oferuję" między mieszkańcami, NGO, JST i ekspertami. */
export function PartnerBoard({ initial }: { initial: PartnerOffer[] }) {
  const [offers, setOffers] = useState(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const [kind, setKind] = useState<PartnerOffer["kind"]>("szukam");
  const [org, setOrg] = useState("");
  const [role, setRole] = useState<Role>("ngo");
  const [area, setArea] = useState<ChallengeArea | "">("");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const shown = [...offers].reverse().filter((o) => filter === "all" || o.kind === filter);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    try {
      const res = await postJson<{ offer: PartnerOffer }>("/api/partners", { kind, org, role, text, area: area || undefined });
      setOffers((o) => [...o, res.offer]);
      setText("");
      setOk("Ogłoszenie dodane. Zainteresowani odpowiedzą na forum powyżej.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd.");
    }
  }

  const chip = (active: boolean) =>
    `rounded-full border-2 px-4 py-1.5 text-sm font-bold transition ${active ? "border-brand-900 bg-brand-900 text-white" : "border-slate-200 text-brand-900 hover:border-brand-700"}`;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div>
        <div role="group" aria-label="Filtruj ogłoszenia" className="mb-5 flex flex-wrap gap-2">
          {(
            [
              ["all", "Wszystkie"],
              ["szukam", "Szukają partnera"],
              ["oferuje", "Oferują wsparcie"],
            ] as const
          ).map(([v, l]) => (
            <button key={v} type="button" aria-pressed={filter === v} onClick={() => setFilter(v)} className={chip(filter === v)}>
              {l}
            </button>
          ))}
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {shown.map((o) => (
            <li key={o.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
              <span className={`w-fit rounded-full px-3 py-0.5 text-sm font-bold ${KIND[o.kind].cls}`}>{KIND[o.kind].label}</span>
              <p className="mt-3 flex-1 text-slate-800">{o.text}</p>
              <p className="mt-3 text-sm">
                <strong className="text-brand-900">{o.org}</strong>
                <span className="text-slate-600"> · {ROLE_LABEL[o.role]}</span>
              </p>
              {o.area && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                  <Dot className={AREA_COLOR[o.area]} /> {AREA_LABEL[o.area]}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-brand-50 p-6 lg:self-start">
        <h3 className="text-lg font-black text-brand-900">Dodaj ogłoszenie</h3>
        <fieldset>
          <legend className="sr-only">Rodzaj ogłoszenia</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["szukam", "oferuje"] as const).map((k) => (
              <label
                key={k}
                className={`cursor-pointer rounded-lg border-2 px-3 py-2 text-center text-sm font-bold has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-accent ${
                  kind === k ? "border-brand-700 bg-brand-700 text-white" : "border-slate-300 bg-white text-brand-900"
                }`}
              >
                <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
                {k === "szukam" ? "Szukam" : "Oferuję"}
              </label>
            ))}
          </div>
        </fieldset>
        <Field id="p-org" label="Instytucja lub podpis">
          <input id="p-org" required maxLength={80} value={org} onChange={(e) => setOrg(e.target.value)} className={inputCls} />
        </Field>
        <Field id="p-role" label="Kim jesteś?">
          <select id="p-role" value={role} onChange={(e) => setRole(e.target.value as Role)} className={inputCls}>
            {(Object.keys(ROLE_LABEL) as Role[])
              .filter((r) => r !== "admin")
              .map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
          </select>
        </Field>
        <Field id="p-area" label="Kategoria Biblioteki ROPS (opcjonalnie)">
          <select id="p-area" value={area} onChange={(e) => setArea(e.target.value as ChallengeArea | "")} className={inputCls}>
            <option value="">Dowolny</option>
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {AREA_LABEL[a]}
              </option>
            ))}
          </select>
        </Field>
        <Field id="p-text" label={kind === "szukam" ? "Kogo szukasz i do czego?" : "Co możesz zaoferować?"}>
          <textarea id="p-text" required rows={3} maxLength={600} value={text} onChange={(e) => setText(e.target.value)} className={inputCls} />
        </Field>
        <button type="submit" className={`${btnCls} w-full`}>
          <Icon name="users" className="h-5 w-5" /> Opublikuj
        </button>
        <Status error={error} ok={ok} />
      </form>
    </div>
  );
}
