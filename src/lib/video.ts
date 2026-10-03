/** Adres odtwarzacza YouTube (tryb bez ciasteczek) dla linku do filmu z Biblioteki ROPS; null dla innych serwisów. */
export function youtubeEmbed(url?: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = u.pathname.slice(1);
    else if (host.endsWith("youtube.com")) id = u.searchParams.get("v") ?? (u.pathname.startsWith("/embed/") ? (u.pathname.split("/")[2] ?? null) : null);
    if (!id || !/^[\w-]{6,20}$/.test(id)) return null;
    const start = Number.parseInt(u.searchParams.get("t") ?? "", 10);
    return `https://www.youtube-nocookie.com/embed/${id}${start > 0 ? `?start=${start}` : ""}`;
  } catch {
    return null;
  }
}
