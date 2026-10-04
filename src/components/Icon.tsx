/** Proste ikony liniowe (dekoracyjne – zawsze aria-hidden, znaczenie niesie tekst obok). */
const PATHS = {
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm10 17-5.2-5.2",
  book: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zm0 14a2 2 0 0 1 2-2h13",
  bulb: "M9 18h6m-5 3h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3z",
  flask: "M9 3h6m-5 0v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3M7 15h10",
  chat: "M4 5h16v11H9l-5 4V5zm4 5h8",
  swap: "M4 8h13l-3-3m6 11H7l3 3",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  chart: "M4 20V10m6 10V4m6 16v-7m4 7H2",
  play: "M8 5v14l11-7z",
  file: "M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5zm0 0v5h5M9 13h6m-6 4h6",
  grid: "M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z",
  star: "M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z",
  check: "M5 12l5 5L20 7",
  plus: "M12 5v14M5 12h14",
  bell: "M6 16V11a6 6 0 1 1 12 0v5l2 2H4zm4 4h4",
  users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 10a7 7 0 0 1 14 0m1-10a3 3 0 1 0 0-6m2 16a6 6 0 0 0-3-5.2",
  send: "M4 12l16-8-6 16-2-7z",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z",
  external: "M7 17 17 7M8 7h9v9",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6 6 18",
  minus: "M5 12h14",
  shield: "M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6zm-3.5 9 2.5 2.5 4.5-5",
  userCheck: "M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 10a7 7 0 0 1 11-5.7M15 18l2 2 4-4",
  scan: "M4 8V5a1 1 0 0 1 1-1h3m8 0h3a1 1 0 0 1 1 1v3m0 8v3a1 1 0 0 1-1 1h-3m-8 0H5a1 1 0 0 1-1-1v-3m4-6h8m-8 4h8m-8 4h5",
  copy: "M8 8h11v13H8zM5 16H4V3h11v1",
  history: "M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5m4-1v5l3 2",
  source: "M5 4h10l4 4v12H5zM9 12h6m-6 4h6M9 8h3",
  share: "M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm12 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4m0-11-6.8 4",
  message: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z",
  monitor: "M3 4h18v12H3zm5 16h8m-4-4v4",
  phone: "M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm4 16h2",
  download: "M12 3v12m-5-5 5 5 5-5M4 21h16",
  refresh: "M20 11a8 8 0 0 0-14.6-4.5L3 9m0-5v5h5m-4 4a8 8 0 0 0 14.6 4.5L21 15m0 5v-5h-5",
  offline: "M2 8.5a15 15 0 0 1 4.3-2.8m4-1.1a15 15 0 0 1 11.7 3.9M5 12.4a10 10 0 0 1 3.5-2.1M16 10.6a10 10 0 0 1 3 1.8M8.5 16a5 5 0 0 1 7 0M12 20h.01M3 3l18 18",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "h-6 w-6" }: { name: IconName; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={PATHS[name]} />
    </svg>
  );
}
