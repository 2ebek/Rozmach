"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

const TABS = [
  { href: "/admin", label: "Pulpit" },
  { href: "/admin/wiedza", label: "Zarządzanie wiedzą" },
  { href: "/admin/pomysly", label: "Pomysły" },
  { href: "/admin/nabory", label: "Nabory i wnioski" },
  { href: "/admin/app/pobierz", label: "Pobierz aplikację", icon: "download" },
] as const;

export function AdminNav({ unread }: { unread: number }) {
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    // Pełne przejście czyści pamięć routera – inaczej strony panelu zostają dostępne z pamięci po wylogowaniu.
    window.location.assign("/");
  }

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
      <nav aria-label="Sekcje panelu">
        <ul className="flex flex-wrap gap-2">
          {TABS.map((t) => {
            const active = pathname === t.href;
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold no-underline shadow-sm ${active ? "bg-brand-900 text-white" : "bg-white text-brand-900 hover:text-accent"}`}
                >
                  {"icon" in t && <Icon name={t.icon} className="h-4 w-4" />}
                  {t.label}
                  {t.href === "/admin" && unread > 0 && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-xs text-white">
                      {unread}
                      <span className="sr-only"> nowych powiadomień</span>
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <button type="button" onClick={logout} className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-accent">
        <Icon name="arrow" className="h-4 w-4 rotate-180" /> Wyloguj
      </button>
    </div>
  );
}
