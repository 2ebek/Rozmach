// Import Biblioteki Innowacji Społecznych ROPS do src/lib/data/rops-biblioteka.ts.
// Pobiera 9 kategorii i karty szczegółów (6 pytań), scala duplikaty, pomija autorów (dane osobowe).
// Użycie: npm run import:rops   (zapytania idą po kolei, z odstępem – bez obciążania serwera ROPS)
import fs from "node:fs";

const BASE = "https://rops.krakow.pl";
const PATH = "/innowacje-spoleczne/biblioteka-innowacji-spolecznych/";
const CATEGORIES = [
  "dla-seniorow",
  "dla-dzieci-mlodziezy-i-rodziny",
  "dla-rynku-pracy",
  "dla-osob-o-ograniczonej-mobilnosci",
  "dla-osob-z-niepelnosprawnoscia-sensoryczna",
  "dla-cudzoziemcow",
  "dla-osob-z-niepelnosprawnoscia-intelektualna",
  "dla-osob-w-kryzysie-bezdomnosci",
  "dla-zdrowia-i-medycyny",
];
const PROJECTS = {
  "INKUBATOR WŁĄCZENIA SPOŁECZNEGO": "Inkubator Włączenia Społecznego",
  "MAŁOPOLSKI INKUBATOR INNOWACJI SPOŁECZNYCH": "Małopolski Inkubator Innowacji Społecznych",
  "MAŁOPOLSKIEGO INKUBATORA WŁĄCZENIA SPOŁECZNEGO": "Małopolski Inkubator Włączenia Społecznego",
  "INKUBATOR DOSTĘPNOŚCI": "Inkubator Dostępności",
};
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";
const OUT = new URL("../src/lib/data/rops-biblioteka.ts", import.meta.url);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const decode = (s) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&bdquo;/g, "„")
    .replace(/&rdquo;|&ldquo;/g, "”")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&oacute;/g, "ó")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
const text = (html) => decode(html.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const abs = (u) => (u ? (u.startsWith("http") ? u : BASE + (u.startsWith("/") ? u : "/" + u)) : undefined);
/** Ucina sekcję „Autorzy” (dane osobowe) – na części kart ROPS ma numer 5, a nie 6, i jest doklejona do poprzedniego pytania. */
const stripAuthors = (s) => s.replace(/\s*\d\.\s*Autor(?:zy|ka|ki)?\b[\s\S]*$/, "");
const clean = (s, max) => {
  if (!s) return undefined;
  s = stripAuthors(s).replace(/\s+/g, " ").trim();
  if (!s) return undefined;
  return s.length > max ? s.slice(0, max - 1).replace(/\s+\S*$/, "") + "…" : s;
};

async function get(url) {
  for (let i = 0; i < 3; i++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.ok) return res.text();
    await sleep(1500);
  }
  throw new Error("HTTP error " + url);
}

// 1. Listy kategorii
const items = new Map();
for (const cat of CATEGORIES) {
  const html = await get(BASE + PATH + cat);
  const blocks = html.split('<div class="news-list__item">').slice(1);
  for (const b of blocks) {
    const m = b.match(/href="([^"]*biblioteka-innowacji-spolecznych\/[^",]+,([^"]+))"\s+class="news-list__title">([\s\S]*?)<\/a>/);
    if (!m) continue;
    const slug = m[2];
    const desc = b.match(/class="news-list__desc">([\s\S]*?)<\/p>/);
    const project = text(b).match(/W RAMACH PROJEKTU\s*[„"]?([^"”]+)[”"]/i);
    const link = (re) => {
      const x = b.match(re);
      return x ? abs(x[1]) : undefined;
    };
    const rec = items.get(slug) ?? {
      slug,
      title: text(m[3]),
      subtitle: desc ? text(desc[1]) : "",
      project: project ? project[1].trim() : undefined,
      folderUrl: link(/<a href="([^"]+)"[^>]*>\s*<img[^>]*lupa/),
      videoUrl: link(/<a href="([^"]*(?:youtube|youtu\.be|vimeo)[^"]*)"/),
      materialsUrl: link(/<a href="([^"]+)"[^>]*>\s*<img[^>]*read2/),
      license: /CC_BY_SA/i.test(b) ? "CC BY-SA 4.0" : /CC_BY/i.test(b) ? "CC BY 4.0" : /symbol-c/i.test(b) ? "©" : undefined,
      ropsUrl: abs(m[1]),
      categories: [],
    };
    if (!rec.categories.includes(cat)) rec.categories.push(cat);
    items.set(slug, rec);
  }
  console.log(cat, blocks.length);
  await sleep(400);
}

// 2. Karty szczegółów – pytania 1–5 (pytanie 6 „Autorzy” pomijamy celowo)
const Q = [
  ["solution", /^1\.\s*Na czym polega/i],
  ["problem", /^2\.\s*Jakich problem/i],
  ["targetGroup", /^3\.\s*Grupa docelowa/i],
  ["beneficiaries", /^4\.\s*Kto może skorzystać/i],
  ["evidence", /^5\.\s*Czy to działa/i],
  ["authors", /^\d\.\s*Autor/i],
];
for (const rec of items.values()) {
  try {
    const html = await get(rec.ropsUrl);
    const main = html.slice(html.indexOf('class="page-title"'), html.indexOf("Powrót"));
    const lines = decode(main.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|h\d|li|div|strong)>/gi, "\n").replace(/<[^>]+>/g, " "))
      .split("\n")
      .map((l) => l.replace(/\s+/g, " ").trim())
      .filter(Boolean);
    let current = null;
    const sec = {};
    for (const l of lines) {
      const q = Q.find(([, re]) => re.test(l));
      if (q) {
        current = q[0];
        sec[current] = [];
        continue;
      }
      if (current) sec[current].push(l);
    }
    for (const [k] of Q) if (k !== "authors" && sec[k]?.length) rec[k] = sec[k].join(" ").trim();
  } catch (e) {
    console.warn("szczegóły niedostępne:", rec.slug, e.message);
  }
  await sleep(300);
}

// 3. Scalenie duplikatów (ta sama innowacja pod dwoma adresami) i zapis
const byTitle = new Map();
for (const r of items.values()) {
  const k = r.title.toLowerCase();
  const prev = byTitle.get(k);
  if (!prev) {
    byTitle.set(k, { ...r });
    continue;
  }
  for (const c of r.categories) if (!prev.categories.includes(c)) prev.categories.push(c);
  for (const f of ["solution", "problem", "targetGroup", "beneficiaries", "evidence", "videoUrl", "materialsUrl", "folderUrl", "project"]) prev[f] ??= r[f];
}
const out = [...byTitle.values()].map((r) => {
  const o = {
    id: "rops-" + r.slug,
    title: r.title,
    subtitle: clean(r.subtitle, 300),
    summary: clean(r.solution || r.subtitle, 1500),
    problem: clean(r.problem, 1200),
    targetGroup: clean(r.targetGroup, 800),
    beneficiaries: clean(r.beneficiaries, 800),
    evidence: clean(r.evidence, 1500),
    areas: r.categories,
    tags: [],
    stage: "wdrozenie",
    published: true,
    project: r.project ? (PROJECTS[r.project] ?? r.project) : undefined,
    ropsUrl: r.ropsUrl,
    videoUrl: r.videoUrl,
    folderUrl: r.folderUrl,
    materialsUrl: r.materialsUrl,
    license: r.license,
  };
  for (const k of Object.keys(o)) if (o[k] === undefined) delete o[k];
  return o;
});

const header = [
  "/**",
  " * Innowacje z Biblioteki Innowacji Społecznych ROPS Kraków (https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/kategorie).",
  ` * Wygenerowane ${new Date().toISOString().slice(0, 10)} skryptem scripts/import-rops.mjs: kategorie, opis wg 6 pytań ROPS i linki do materiałów.`,
  " * Bez danych osobowych autorów – karta innowacji odsyła do strony ROPS. Nie edytuj ręcznie; odśwież: npm run import:rops.",
  " */",
  'import type { Innovation } from "../types";',
  "",
  "export const ropsInnovations: Innovation[] = ",
].join("\n");
fs.writeFileSync(OUT, header + JSON.stringify(out, null, 2) + ";\n");
console.log("zapisano innowacji:", out.length, "| z opisem problemu:", out.filter((o) => o.problem).length);
