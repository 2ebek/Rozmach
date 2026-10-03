"use client";

import { useState } from "react";
import { postJson } from "@/lib/client";
import { Field, Status, btnCls, inputCls } from "./ui";

export function LoginForm({ next }: { next: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await postJson("/api/auth/login", { password });
      // Pełne przejście zamiast router.push/refresh: pamięć routera po stronie klienta trzyma
      // przekierowanie /admin → /logowanie sprzed zalogowania, przez co panel nigdy się nie pojawiał.
      window.location.assign(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Field id="password" label="Hasło administratora">
        <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
      </Field>
      <button type="submit" disabled={busy} className={`${btnCls} w-full`}>
        {busy ? "Loguję…" : "Zaloguj się"}
      </button>
      <Status error={error} />
    </form>
  );
}
