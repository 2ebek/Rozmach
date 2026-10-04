"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Icon } from "./Icon";

const AUTO_REFRESH_MS = 60_000;

/**
 * Górny pasek aplikacji administratora. Utrzymuje dane na bieżąco: odświeża widok po powrocie do aplikacji,
 * co minutę (gdy okno jest widoczne) i po powiadomieniu push; pokazuje brak sieci i licznik na ikonie aplikacji.
 */
export function AdminAppBar({ badge, back }: { badge: number; back?: { href: string; label: string } }) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [online, setOnline] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!refreshing) setUpdatedAt(new Date());
  }, [refreshing]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible" && navigator.onLine) startRefresh(() => router.refresh());
    };
    const onNet = () => {
      setOnline(navigator.onLine);
      refresh();
    };
    const onMessage = (e: MessageEvent) => {
      if ((e.data as { type?: string })?.type === "new-idea") refresh();
    };
    setOnline(navigator.onLine);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("online", onNet);
    window.addEventListener("offline", onNet);
    navigator.serviceWorker?.addEventListener("message", onMessage);
    const t = window.setInterval(refresh, AUTO_REFRESH_MS);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("online", onNet);
      window.removeEventListener("offline", onNet);
      navigator.serviceWorker?.removeEventListener("message", onMessage);
      window.clearInterval(t);
    };
  }, [router]);

  // licznik nowych pomysłów na ikonie zainstalowanej aplikacji (Windows, macOS, Android – gdzie system to obsługuje)
  useEffect(() => {
    const nav = navigator as Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
    if (badge > 0) nav.setAppBadge?.(badge).catch(() => undefined);
    else nav.clearAppBadge?.().catch(() => undefined);
  }, [badge]);

  return (
    <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-brand-100 bg-white/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur sm:-mx-8 sm:px-8">
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        {back ? (
          <Link href={back.href} className="inline-flex min-h-11 items-center gap-2 rounded-full pr-3 font-bold text-brand-700 no-underline hover:text-accent">
            <Icon name="arrow" className="h-5 w-5 rotate-180" /> {back.label}
          </Link>
        ) : (
          <Link href="/admin/app" className="flex items-center gap-3 no-underline">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/admin-192.png" alt="" width={36} height={36} className="h-9 w-9 rounded-xl" />
            <span className="leading-tight">
              <span className="block text-lg font-black text-brand-900">Hub Admin</span>
              <span className="block text-xs text-slate-600">
                {updatedAt ? `Zaktualizowano ${updatedAt.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}` : "Małopolski Hub Innowacji"}
              </span>
            </span>
          </Link>
        )}
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => startRefresh(() => router.refresh())}
          disabled={refreshing || !online}
          className="grid h-11 w-11 place-items-center rounded-full text-brand-900 hover:bg-brand-50 disabled:opacity-50"
          aria-label="Odśwież"
          title="Odśwież"
        >
          <Icon name="refresh" className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
        </button>
        <Link
          href="/admin"
          className="inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-slate-300 px-4 text-sm font-bold text-brand-900 no-underline hover:border-brand-700"
        >
          Pełny panel
        </Link>
      </div>
      {!online && (
        <p role="status" className="mx-auto mt-3 flex max-w-3xl items-center gap-2 rounded-xl bg-amber-50 px-4 py-2 text-sm font-bold text-amber-900">
          <Icon name="offline" className="h-4 w-4" /> Brak połączenia z internetem – pokazuję ostatnio pobrane dane.
        </p>
      )}
    </div>
  );
}
