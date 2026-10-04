"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "./Icon";
import { btnCls, btnSecondaryCls } from "./ui";

type State = "loading" | "unsupported" | "ios-install" | "denied" | "off" | "on" | "error";

const SW_URL = "/admin-sw.js";
const SCOPE = "/admin/app";

function keyToBytes(base64url: string) {
  const pad = "=".repeat((4 - (base64url.length % 4)) % 4);
  const raw = atob((base64url + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function sameKey(sub: PushSubscription, key: Uint8Array): boolean {
  const current = sub.options.applicationServerKey;
  if (!current) return false;
  const a = new Uint8Array(current);
  return a.length === key.length && a.every((v, i) => v === key[i]);
}

async function sendToServer(sub: PushSubscription) {
  const res = await fetch("/api/admin/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: sub.toJSON() }),
  });
  if (!res.ok) throw new Error("Serwer odrzucił subskrypcję.");
}

/**
 * Rejestruje service worker aplikacji administratora i zarządza subskrypcją Web Push.
 * Przy każdym otwarciu odnawia subskrypcję na serwerze.
 */
export function PushControl() {
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState<string | null>(null);

  const ensure = useCallback(async (askPermission: boolean) => {
    const reg = await navigator.serviceWorker.register(SW_URL, { scope: SCOPE });
    await navigator.serviceWorker.ready;
    if (askPermission && Notification.permission === "default") await Notification.requestPermission();
    if (Notification.permission === "denied") return setState("denied");
    if (Notification.permission !== "granted") return setState("off");

    const { publicKey } = (await (await fetch("/api/admin/push")).json()) as { publicKey: string };
    const key = keyToBytes(publicKey);
    let sub = await reg.pushManager.getSubscription();
    // klucz serwera zmienił się (np. restart prototypu) – stara subskrypcja jest bezużyteczna
    if (sub && !sameKey(sub, key)) {
      await sub.unsubscribe();
      sub = null;
    }
    if (!sub && !askPermission) return setState("off");
    sub ??= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
    await sendToServer(sub);
    setState("on");
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      // iPhone/iPad: push działa dopiero w aplikacji dodanej do ekranu początkowego
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
      setState(ios ? "ios-install" : "unsupported");
      return;
    }
    // odświeżanie listy po pushu obsługuje pasek aplikacji (AdminAppBar)
    ensure(false).catch(() => setState("off"));
  }, [ensure]);

  async function enable() {
    setMessage(null);
    setState("loading");
    try {
      await ensure(true);
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Nie udało się włączyć powiadomień.");
    }
  }

  async function disable() {
    setState("loading");
    const reg = await navigator.serviceWorker.getRegistration(SCOPE);
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await fetch("/api/admin/push", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
    }
    setState("off");
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200" aria-live="polite">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${state === "on" ? "bg-emerald-50 text-emerald-800" : "bg-mist text-slate-700"}`}>
        <Icon name="bell" className="h-5 w-5" />
      </span>
      <p className="min-w-[12rem] flex-1 text-[0.95rem]">
        {state === "loading" && "Sprawdzam powiadomienia…"}
        {state === "on" && <strong className="text-emerald-900">Powiadomienia o nowych pomysłach są włączone na tym urządzeniu.</strong>}
        {state === "off" && "Włącz powiadomienia, aby wiedzieć o każdym nowym pomyśle."}
        {state === "denied" && "Powiadomienia są zablokowane w ustawieniach przeglądarki dla tej strony."}
        {state === "unsupported" && "Ta przeglądarka nie obsługuje powiadomień push."}
        {state === "ios-install" && "Na iPhonie: Udostępnij → „Do ekranu początkowego”, potem otwórz aplikację i włącz powiadomienia."}
        {state === "error" && (message ?? "Nie udało się włączyć powiadomień.")}
      </p>
      {(state === "off" || state === "error") && (
        <button type="button" onClick={enable} className={btnCls}>
          Włącz powiadomienia
        </button>
      )}
      {state === "on" && (
        <button type="button" onClick={disable} className={btnSecondaryCls}>
          Wyłącz
        </button>
      )}
    </div>
  );
}
