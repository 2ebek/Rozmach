"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ThreadMessage } from "@/lib/types";
import { Icon } from "./Icon";
import { Status, btnCls, inputCls } from "./ui";

const fmt = (iso: string) => new Date(iso).toLocaleString("pl-PL", { timeZone: "Europe/Warsaw", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

type Role = "author" | "admin" | "expert";

const BUBBLE: Record<ThreadMessage["from"], { box: string; meta: string }> = {
  admin: { box: "rounded-tl-sm bg-brand-900 text-white", meta: "text-slate-300" },
  author: { box: "rounded-tr-sm bg-mist text-ink", meta: "text-slate-600" },
  expert: { box: "rounded-tl-sm bg-emerald-50 text-ink ring-1 ring-emerald-200", meta: "text-emerald-900" },
};

const who = (m: ThreadMessage) => (m.from === "admin" ? "Zespół Hubu" : m.from === "expert" ? `Ekspert Hubu · ${m.name ?? "mentor"}` : "Autor zgłoszenia");

/**
 * Wątek zgłoszenia (ścieżka odpowiedzi). Ten sam komponent dla autora, administratora i eksperta –
 * różni się tylko adres API i podpis "kto pisze". Ekspert podpisuje komentarz (np. specjalizacją).
 */
export function ThreadView({ code, thread, as, expertName }: { code: string; thread: ThreadMessage[]; as: Role; expertName?: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const [url, body] =
      as === "admin" ? ["/api/admin", { action: "reply", code, text }] : as === "expert" ? ["/api/ekspert", { code, text, name: expertName ?? "" }] : ["/api/status", { code, text }];
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    if (!res.ok) {
      setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Nie udało się wysłać.");
      return;
    }
    setText("");
    router.refresh();
  }

  const mine = (m: ThreadMessage) => m.from === as;
  const label = as === "admin" ? "Odpowiedz autorowi" : as === "expert" ? "Komentarz eksperta dla autora" : "Twoja odpowiedź";

  return (
    <div className="space-y-4">
      {thread.length === 0 ? (
        <p className="rounded-xl bg-mist px-4 py-3 text-slate-700">
          {as === "author" ? "Zespół Hubu jeszcze nie odpowiedział. Odpowiedź pojawi się w tym miejscu." : "Brak wiadomości w wątku."}
        </p>
      ) : (
        <ol className="space-y-3">
          {thread.map((m, i) => (
            <li key={i} className={`flex ${mine(m) ? "justify-end" : "justify-start"}`} data-from={m.from}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${BUBBLE[m.from].box}`}>
                <p className={`mb-1 text-xs font-bold ${BUBBLE[m.from].meta}`}>
                  {who(m)} · {fmt(m.createdAt)}
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
            {label}
          </label>
          <textarea id={`reply-${code}`} required rows={2} maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} className={inputCls} />
        </div>
        <button type="submit" disabled={busy} className={btnCls}>
          <Icon name="send" className="h-5 w-5" /> Wyślij
        </button>
      </form>
      <Status error={error} />
    </div>
  );
}
