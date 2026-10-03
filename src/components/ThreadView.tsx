"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ThreadMessage } from "@/lib/types";
import { Icon } from "./Icon";
import { Status, btnCls, inputCls } from "./ui";

const fmt = (iso: string) => new Date(iso).toLocaleString("pl-PL", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

/**
 * Wątek zgłoszenia (ścieżka odpowiedzi). Ten sam komponent dla autora i administratora –
 * różni się tylko adres API i podpis "kto pisze".
 */
export function ThreadView({ code, thread, as }: { code: string; thread: ThreadMessage[]; as: "author" | "admin" }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(as === "admin" ? "/api/admin" : "/api/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(as === "admin" ? { action: "reply", code, text } : { code, text }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Nie udało się wysłać.");
      return;
    }
    setText("");
    router.refresh();
  }

  const mine = (m: ThreadMessage) => m.from === as;

  return (
    <div className="space-y-4">
      {thread.length === 0 ? (
        <p className="rounded-xl bg-mist px-4 py-3 text-slate-700">
          {as === "author" ? "Zespół Hubu jeszcze nie odpowiedział. Odpowiedź pojawi się w tym miejscu." : "Brak wiadomości w wątku."}
        </p>
      ) : (
        <ol className="space-y-3">
          {thread.map((m, i) => (
            <li key={i} className={`flex ${mine(m) ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.from === "admin" ? "rounded-tl-sm bg-brand-900 text-white" : "rounded-tr-sm bg-mist text-ink"}`}>
                <p className={`mb-1 text-xs font-bold ${m.from === "admin" ? "text-slate-300" : "text-slate-600"}`}>
                  {m.from === "admin" ? "Zespół Hubu" : "Autor zgłoszenia"} · {fmt(m.createdAt)}
                </p>
                <p>{m.text}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor={`reply-${code}`} className="mb-1 block text-sm font-bold text-brand-900">
            {as === "admin" ? "Odpowiedz autorowi" : "Twoja odpowiedź"}
          </label>
          <textarea id={`reply-${code}`} required rows={2} value={text} onChange={(e) => setText(e.target.value)} className={inputCls} />
        </div>
        <button type="submit" disabled={busy} className={btnCls}>
          <Icon name="send" className="h-5 w-5" /> Wyślij
        </button>
      </form>
      <Status error={error} />
    </div>
  );
}
