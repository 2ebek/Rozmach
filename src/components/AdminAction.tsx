"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

/** Przycisk akcji administratora: wysyła akcję do /api/admin i odświeża widok serwera. */
export function AdminAction({
  payload,
  children,
  className = "",
  confirm,
}: {
  payload: Record<string, unknown>;
  children: ReactNode;
  className?: string;
  /** Pytanie potwierdzające przed akcją nieodwracalną (np. usunięcie). */
  confirm?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (confirm && !window.confirm(confirm)) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!res.ok) {
      setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Nie udało się.");
      return;
    }
    router.refresh();
  }

  return (
    <>
      <button type="button" disabled={busy} onClick={run} className={`rounded-lg px-4 py-2 text-sm font-bold transition disabled:opacity-60 ${className}`}>
        {children}
      </button>
      {error && (
        <span role="alert" className="text-sm font-bold text-red-800">
          {error}
        </span>
      )}
    </>
  );
}
