"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { btnCls } from "./ui";

/** Zdarzenie Chrome/Edge/Androida pozwalające wywołać okno instalacji aplikacji (PWA). */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Device = "ios" | "android" | "mac-safari" | "firefox" | "desktop";
type State = "detecting" | "installed" | "ready" | "manual" | "done";

export const SW_URL = "/admin-sw.js";
export const SW_SCOPE = "/admin/app";

function detect(): Device {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1)) return "ios";
  if (/Android/.test(ua)) return "android";
  if (/Firefox\//.test(ua)) return "firefox";
  if (ua.includes("Macintosh") && /Version\/[\d.]+ Safari/.test(ua)) return "mac-safari";
  return "desktop";
}

const DEVICE_NAME: Record<Device, string> = {
  ios: "iPhone / iPad",
  android: "telefon z Androidem",
  "mac-safari": "Mac (Safari)",
  firefox: "komputer (Firefox)",
  desktop: "komputer",
};

/** Instrukcja dla urządzeń, na których przeglądarka nie pokazuje własnego okna instalacji. */
const MANUAL: Record<Device, string> = {
  ios: "W Safari stuknij „Udostępnij” (kwadrat ze strzałką), potem „Do ekranu początkowego” i „Dodaj”.",
  android: "Otwórz menu przeglądarki (⋮) i wybierz „Zainstaluj aplikację” lub „Dodaj do ekranu głównego”.",
  "mac-safari": "W Safari wybierz z menu „Plik” → „Dodaj do Docka”.",
  firefox: "Firefox nie instaluje aplikacji internetowych. Otwórz tę stronę w Edge lub Chrome i kliknij „Zainstaluj”.",
  desktop: "Kliknij ikonę instalacji po prawej stronie paska adresu (monitor ze strzałką) albo menu przeglądarki → „Zainstaluj Hub Admin”.",
};

/**
 * Instalacja aplikacji administratora na bieżącym urządzeniu. W Edge/Chrome (Windows, macOS, Android)
 * pokazuje przycisk z systemowym oknem instalacji, gdzie indziej – krótką instrukcję dla wykrytego urządzenia.
 */
export function InstallApp() {
  const [device, setDevice] = useState<Device>("desktop");
  const [state, setState] = useState<State>("detecting");
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    setDevice(detect());
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
    if (standalone) return setState("installed");

    // service worker jest potrzebny do powiadomień i pracy bez sieci – rejestrujemy go już tutaj
    navigator.serviceWorker?.register(SW_URL, { scope: SW_SCOPE }).catch(() => undefined);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPromptEvent);
      setState("ready");
    };
    const onInstalled = () => {
      setPrompt(null);
      setState("done");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    // gdy przeglądarka nie zaproponuje instalacji (Safari, Firefox, aplikacja już zainstalowana) – instrukcja
    const t = window.setTimeout(() => setState((s) => (s === "detecting" ? "manual" : s)), 1500);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.clearTimeout(t);
    };
  }, []);

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    setPrompt(null);
    setState(outcome === "accepted" ? "done" : "manual");
  }

  const mobile = device === "ios" || device === "android";

  return (
    <div className="flex flex-wrap items-center gap-5 rounded-3xl bg-brand-900 p-6 text-white sm:p-8" aria-live="polite" data-install>
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10">
        <Icon name={mobile ? "phone" : "monitor"} className="h-7 w-7" />
      </span>
      <div className="min-w-[14rem] flex-1">
        <p className="text-sm font-bold uppercase tracking-wider text-[#ff7aa0]">To urządzenie: {DEVICE_NAME[device]}</p>
        {state === "detecting" && <p className="mt-1 text-lg font-bold">Sprawdzam, czy można zainstalować aplikację…</p>}
        {state === "ready" && <p className="mt-1 text-lg font-bold">Aplikację Hub Admin można zainstalować jednym kliknięciem.</p>}
        {state === "installed" && <p className="mt-1 text-lg font-bold">Korzystasz z zainstalowanej aplikacji Hub Admin.</p>}
        {state === "done" && (
          <p className="mt-1 text-lg font-bold">Gotowe – aplikacja jest zainstalowana. Znajdziesz ją {mobile ? "na ekranie głównym" : "w menu Start lub w Docku"}.</p>
        )}
        {state === "manual" && (
          <>
            <p className="mt-1 text-lg font-bold">Zainstaluj aplikację z menu przeglądarki</p>
            <p className="mt-1 text-slate-200">{MANUAL[device]}</p>
            <p className="mt-1 text-sm text-slate-300">Jeśli aplikacja jest już zainstalowana, przeglądarka nie zaproponuje instalacji ponownie.</p>
          </>
        )}
      </div>
      {state === "ready" && (
        <button type="button" onClick={install} className={btnCls}>
          <Icon name="download" className="h-5 w-5" /> Zainstaluj {mobile ? "na telefonie" : "na komputerze"}
        </button>
      )}
    </div>
  );
}
