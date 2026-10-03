"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { postJson } from "@/lib/client";
import { AREAS, AREA_LABEL, STAGES, STAGE_LABEL } from "@/lib/labels";
import type { ChallengeArea, IdeaStage } from "@/lib/types";
import { Icon } from "./Icon";
import { Field, Status, btnCls, btnSecondaryCls, inputCls } from "./ui";

/** Formularz dodawania innowacji do Biblioteki – pola jak karta Biblioteki ROPS (6 pytań + materiały). */
export function AddInnovationForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [summary, setSummary] = useState("");
  const [problem, setProblem] = useState("");
  const [targetGroup, setTargetGroup] = useState("");
  const [beneficiaries, setBeneficiaries] = useState("");
  const [evidence, setEvidence] = useState("");
  const [areas, setAreas] = useState<ChallengeArea[]>([]);
  const [tags, setTags] = useState("");
  const [stage, setStage] = useState<IdeaStage>("wdrozenie");
  const [project, setProject] = useState("");
  const [ropsUrl, setRopsUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [materialsUrl, setMaterialsUrl] = useState("");
  const [published, setPublished] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function toggleArea(a: ChallengeArea) {
    setAreas((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    const opt = (v: string) => v.trim() || undefined;
    try {
      await postJson("/api/admin", {
        action: "add-innovation",
        title,
        subtitle: opt(subtitle),
        summary,
        problem: opt(problem),
        targetGroup: opt(targetGroup),
        beneficiaries: opt(beneficiaries),
        evidence: opt(evidence),
        areas,
        tags: tags.split(",").map((t) => t.trim()).filter((t) => t.length >= 2),
        stage,
        project: opt(project),
        ropsUrl: opt(ropsUrl),
        videoUrl: opt(videoUrl),
        materialsUrl: opt(materialsUrl),
        published,
      });
      setOk(published ? "Dodano – innowacja jest już widoczna w Bibliotece i w matchmakingu." : "Dodano jako ukrytą – opublikuj ją po weryfikacji.");
      for (const reset of [setTitle, setSubtitle, setSummary, setProblem, setTargetGroup, setBeneficiaries, setEvidence, setTags, setProject, setRopsUrl, setVideoUrl, setMaterialsUrl]) reset("");
      setAreas([]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Field id="ai-title" label="Nazwa innowacji">
        <input id="ai-title" required value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
      </Field>
      <Field id="ai-subtitle" label="Krótki opis (jedno zdanie, jak na liście ROPS)">
        <input id="ai-subtitle" maxLength={300} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className={inputCls} />
      </Field>
      <fieldset>
        <legend className="mb-2 font-bold text-brand-900">Kategorie Biblioteki ROPS</legend>
        <div className="flex flex-wrap gap-2">
          {AREAS.map((a) => (
            <label
              key={a}
              className={`cursor-pointer rounded-full border-2 px-3 py-1 text-sm font-bold has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-accent ${
                areas.includes(a) ? "border-brand-900 bg-brand-900 text-white" : "border-slate-300 text-brand-900"
              }`}
            >
              <input type="checkbox" checked={areas.includes(a)} onChange={() => toggleArea(a)} className="sr-only" />
              {AREA_LABEL[a]}
            </label>
          ))}
        </div>
      </fieldset>
      <Field id="ai-summary" label="1. Na czym polega rozwiązanie?" hint="Prostym językiem. Ten tekst przeszukuje matchmaking.">
        <textarea id="ai-summary" aria-describedby="ai-summary-hint" required rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} className={inputCls} />
      </Field>
      <Field id="ai-problem" label="2. Jakich problemów dotyczy innowacja?">
        <textarea id="ai-problem" rows={2} value={problem} onChange={(e) => setProblem(e.target.value)} className={inputCls} />
      </Field>
      <Field id="ai-target" label="3. Grupa docelowa">
        <textarea id="ai-target" rows={2} value={targetGroup} onChange={(e) => setTargetGroup(e.target.value)} className={inputCls} />
      </Field>
      <Field id="ai-beneficiaries" label="4. Kto może skorzystać z innowacji?">
        <textarea id="ai-beneficiaries" rows={2} value={beneficiaries} onChange={(e) => setBeneficiaries(e.target.value)} className={inputCls} />
      </Field>
      <Field id="ai-evidence" label="5. Czy to działa?">
        <textarea id="ai-evidence" rows={2} value={evidence} onChange={(e) => setEvidence(e.target.value)} className={inputCls} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="ai-tags" label="Słowa kluczowe" hint="Oddziel przecinkami – poprawiają trafność dopasowań.">
          <input id="ai-tags" aria-describedby="ai-tags-hint" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="senior, pamięć, terapia" className={inputCls} />
        </Field>
        <Field id="ai-stage" label="Etap">
          <select id="ai-stage" value={stage} onChange={(e) => setStage(e.target.value as IdeaStage)} className={inputCls}>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABEL[s]}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field id="ai-project" label="Projekt ROPS, w ramach którego upowszechniana (opcjonalnie)">
        <input id="ai-project" value={project} onChange={(e) => setProject(e.target.value)} placeholder="np. Inkubator Włączenia Społecznego" className={inputCls} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field id="ai-rops" label="Karta w Bibliotece ROPS">
          <input id="ai-rops" type="url" value={ropsUrl} onChange={(e) => setRopsUrl(e.target.value)} placeholder="https://rops.krakow.pl/…" className={inputCls} />
        </Field>
        <Field id="ai-video" label="Film">
          <input id="ai-video" type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://…" className={inputCls} />
        </Field>
        <Field id="ai-materials" label="Materiały">
          <input id="ai-materials" type="url" value={materialsUrl} onChange={(e) => setMaterialsUrl(e.target.value)} placeholder="https://…" className={inputCls} />
        </Field>
      </div>
      <label className="flex items-center gap-3 font-bold text-brand-900">
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-5 w-5 accent-brand-700" />
        Opublikuj od razu
      </label>
      <button type="submit" className={btnCls}>
        <Icon name="check" className="h-5 w-5" /> Dodaj do Biblioteki
      </button>
      <Status error={error} ok={ok} />
    </form>
  );
}

/** Edycja wartości wskaźnika wyzwania (Mapa Wyzwań). */
export function IndicatorEditor({ id, value, unit, label }: { id: string; value: number; unit: string; label: string }) {
  const router = useRouter();
  const [v, setV] = useState(String(value));
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      await postJson("/api/admin", { action: "indicator", id, value: Number(v) });
      setState("saved");
      router.refresh();
    } catch {
      setState("error");
    }
  }

  return (
    <form onSubmit={save} className="flex flex-wrap items-end gap-2">
      <div>
        <label htmlFor={`ind-${id}`} className="mb-1 block text-sm text-slate-600">
          {label}
        </label>
        <div className="flex items-center gap-1">
          <input id={`ind-${id}`} type="number" min={0} max={100} step={1} value={v} onChange={(e) => { setV(e.target.value); setState("idle"); }} className={`${inputCls} w-24 py-2`} />
          <span className="font-bold text-slate-700">{unit}</span>
        </div>
      </div>
      <button type="submit" className={`${btnSecondaryCls} py-2`}>
        Zapisz
      </button>
      <span aria-live="polite" className="text-sm font-bold">
        {state === "saved" && <span className="text-emerald-800">Zapisano</span>}
        {state === "error" && <span className="text-red-800">Błąd zapisu</span>}
      </span>
    </form>
  );
}
