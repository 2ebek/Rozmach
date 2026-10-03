"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { postJson } from "@/lib/client";
import { ROLE_LABEL } from "@/lib/labels";
import type { Message, Role } from "@/lib/types";
import { Icon } from "./Icon";
import { Status, btnCls, inputCls } from "./ui";

const ROLE_STYLE: Record<Role, { avatar: string; bubble: string }> = {
  resident: { avatar: "bg-sun text-brand-900", bubble: "bg-white" },
  ngo: { avatar: "bg-teal-700 text-white", bubble: "bg-white" },
  jst: { avatar: "bg-brand-700 text-white", bubble: "bg-white" },
  expert: { avatar: "bg-accent text-white", bubble: "bg-rose-50 ring-1 ring-rose-200" },
  admin: { avatar: "bg-brand-900 text-white", bubble: "bg-brand-50 ring-1 ring-brand-100" },
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

function when(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pl-PL", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}

export function Chat({ initial }: { initial: Message[] }) {
  const [messages, setMessages] = useState(initial);
  const [author, setAuthor] = useState("");
  const [role, setRole] = useState<Role>("resident");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLOListElement>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/messages");
    if (res.ok) setMessages(((await res.json()) as { messages: Message[] }).messages);
  }, []);

  // Proste odpytywanie co 5 s; produkcja: WebSocket / SSE.
  useEffect(() => {
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [refresh]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await postJson("/api/messages", { author, role, text });
      setText("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd.");
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-mist">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h2 className="text-lg font-black">Forum Hubu</h2>
          <p className="text-sm text-slate-600">{messages.length} wiadomości · odświeża się automatycznie</p>
        </div>
        <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800">
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-emerald-600" /> Na żywo
        </span>
      </div>

      <ol ref={listRef} aria-label="Wiadomości" tabIndex={0} className="max-h-[32rem] space-y-5 overflow-y-auto p-6">
        {messages.map((m) => {
          const s = ROLE_STYLE[m.role];
          return (
            <li key={m.id} className="flex gap-3">
              <span aria-hidden className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-black ${s.avatar}`}>
                {initials(m.author)}
              </span>
              <div className="min-w-0 max-w-2xl">
                <p className="mb-1 text-sm">
                  <strong className="text-brand-900">{m.author}</strong>
                  <span className="text-slate-600"> · {ROLE_LABEL[m.role]} · {when(m.createdAt)}</span>
                </p>
                <p className={`rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm ${s.bubble}`}>{m.text}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <form onSubmit={onSubmit} className="space-y-3 border-t border-slate-200 bg-white p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="chat-author" className="mb-1 block text-sm font-bold text-brand-900">
              Podpis
            </label>
            <input id="chat-author" required value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Imię, pseudonim lub nazwa organizacji" className={inputCls} />
          </div>
          <div>
            <label htmlFor="chat-role" className="mb-1 block text-sm font-bold text-brand-900">
              Piszę jako
            </label>
            <select id="chat-role" value={role} onChange={(e) => setRole(e.target.value as Role)} className={inputCls}>
              {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label htmlFor="chat-text" className="block text-sm font-bold text-brand-900">
          Wiadomość
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <textarea id="chat-text" required rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Napisz pytanie lub odpowiedź…" className={`${inputCls} flex-1`} />
          <button type="submit" className={btnCls}>
            <Icon name="send" className="h-5 w-5" /> Wyślij
          </button>
        </div>
        <Status error={error} />
      </form>
    </div>
  );
}
