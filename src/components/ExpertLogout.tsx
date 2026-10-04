"use client";

import { btnSecondaryCls } from "./ui";

/** Wylogowanie eksperta – usuwa ciasteczko sesji i wraca do strony logowania ekspertów. */
export function ExpertLogout() {
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/auth/expert", { method: "DELETE" });
        window.location.assign("/ekspert");
      }}
      className={btnSecondaryCls}
    >
      Wyloguj
    </button>
  );
}
