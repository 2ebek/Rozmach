// Import wskaźników z Internetowego Obserwatora Statystyk Społecznych ROPS (https://obserwator.rops.krakow.pl/)
// do src/lib/data/ioss-jednostki.ts (powiaty i gminy) i src/lib/data/ioss-wskazniki.ts (wartości z najnowszego roku).
// Dane publiczne GUS (Bank Danych Lokalnych) w układzie powiatów i gmin Małopolski – bez danych osobowych.
// Użycie: npm run import:ioss   (zapytania idą po kolei, z odstępem – bez obciążania serwera ROPS)
import fs from "node:fs";

const BASE = "https://obserwator.rops.krakow.pl";
/** Wskaźniki powiązane z kategoriami Biblioteki ROPS (mapowanie w src/lib/ioss.ts). */
const INDICATORS = [257, 274, 38, 36, 31, 32, 25, 189, 37, 215, 99, 244, 34, 247, 39, 18];
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36";
const OUT_UNITS = new URL("../src/lib/data/ioss-jednostki.ts", import.meta.url);
const OUT_VALUES = new URL("../src/lib/data/ioss-wskazniki.ts", import.meta.url);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const decode = (s) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&bdquo;/g, "„")
    .replace(/&rdquo;|&ldquo;/g, "”")
    .replace(/&ndash;/g, "–")
    .replace(/&oacute;/g, "ó")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
const text = (html) => decode(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const slug = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

async function get(url) {
  for (let i = 0; i < 3; i++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.ok) return res.text();
    await sleep(1500);
  }
  throw new Error("HTTP error " + url);
}

/** Wiersze tabeli: [nazwa, wartość] – pomija puste wartości (brak danych dla jednostki). */
function rows(tableHtml) {
  const out = [];
  for (const tr of tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => text(m[1]));
    if (cells.length < 2) continue;
    out.push([cells[0], cells[cells.length - 1]]);
  }
  return out;
}

const units = new Map(); // id -> { id, name, kind, powiat? }
const indicators = [];

for (const id of INDICATORS) {
  const url = `${BASE}/differenceanalysis/${id}`;
  const html = await get(url);
  const name = text(html.match(/<h1>([\s\S]*?)<\/h1>/)?.[1] ?? "");
  const year = Number(html.match(/Analiza zróżnicowania &gt; województwo małopolskie - (\d{4})/)?.[1]);
  const opis = html.slice(html.indexOf('id="opis"'));
  const section = (h) => {
    const m = opis.match(new RegExp(`<h[23] class="h[23]">${h}</h[23]>([\\s\\S]*?)(?=<h[23] class="h[23]">|</div>)`));
    return m ? text(m[1]) : undefined;
  };
  const description = section("Opis");
  const source = section("Źródło");

  // Tabela główna (powiaty) i ukryte tabele gmin: div#myChart0_table_child_row_N odpowiada N-temu powiatowi.
  const t0 = html.indexOf('class="analysisTable"');
  const main = html.slice(t0, html.indexOf("</table>", t0));
  const powiaty = rows(main).filter(([n]) => n.startsWith("powiat "));
  let percent = false;
  const values = {};
  const num = (v) => {
    if (!v) return undefined;
    if (v.endsWith("%")) percent = true;
    const n = Number(v.replace("%", "").replace(",", ".").replace(/\s/g, ""));
    return Number.isFinite(n) ? n : undefined;
  };
  powiaty.forEach(([pName, pVal], i) => {
    const pid = "p-" + slug(pName.replace(/^powiat /, ""));
    units.set(pid, { id: pid, name: pName, kind: "powiat" });
    const v = num(pVal);
    if (v !== undefined) values[pid] = v;
    const c0 = html.indexOf(`id="myChart0_table_child_row_${i + 1}"`);
    if (c0 < 0) return;
    const child = html.slice(c0, html.indexOf("</table>", c0));
    for (const [gName, gVal] of rows(child)) {
      const gid = `g-${pid.slice(2)}-${slug(gName)}`;
      if (!units.has(gid)) units.set(gid, { id: gid, name: gName, kind: "gmina", powiat: pid });
      const gv = num(gVal);
      if (gv !== undefined) values[gid] = gv;
    }
  });
  if (!name || !year || !powiaty.length) throw new Error(`Nie rozpoznano wskaźnika ${id} – zmienił się układ strony IOSS?`);
  indicators.push({ id, name, description, source, year, unit: percent ? "%" : "", url, values });
  console.log(id, name, year, "| powiaty:", powiaty.length, "| wartości:", Object.keys(values).length);
  await sleep(500);
}

const date = new Date().toISOString().slice(0, 10);
const header = (what) =>
  [
    "/**",
    ` * ${what} z Internetowego Obserwatora Statystyk Społecznych ROPS Kraków (https://obserwator.rops.krakow.pl/), dane GUS (BDL).`,
    ` * Wygenerowane ${date} skryptem scripts/import-ioss.mjs. Nie edytuj ręcznie; odśwież: npm run import:ioss.`,
    " */",
  ].join("\n");

fs.writeFileSync(
  OUT_UNITS,
  `${header("Powiaty i gminy województwa małopolskiego")}\nimport type { IossUnit } from "../ioss-types";\n\nexport const IOSS_IMPORTED = "${date}";\n\nexport const iossUnits: IossUnit[] = ${JSON.stringify([...units.values()], null, 2)};\n`,
);
fs.writeFileSync(
  OUT_VALUES,
  `${header("Wskaźniki (najnowszy rok dostępny w IOSS)")}\nimport type { IossIndicator } from "../ioss-types";\n\nexport const iossIndicators: IossIndicator[] = ${JSON.stringify(indicators)};\n`,
);
console.log("zapisano jednostek:", units.size, "| wskaźników:", indicators.length);
