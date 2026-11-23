/**
 * G4 performance budget: размер исходного JS-бандла главной страницы (gzip).
 * Запуск: npm run perf:budget [URL]
 */
import { gzipSync } from "node:zlib";

const siteUrl = process.argv[2] || process.env.SITE_URL || "https://ds-digital-ebon.vercel.app";
const budgetKb = Number(process.env.JS_BUDGET_KB || 200);
const target = `${siteUrl.replace(/\/+$/, "")}/ru`;

const response = await fetch(target, { headers: { "User-Agent": "ds-perf-budget/1.0" } });
if (!response.ok) {
  console.error(`[perf] page status ${response.status}`);
  process.exit(1);
}
const html = await response.text();

const scripts = [
  ...new Set(
    [...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map((m) => m[1]),
  ),
].filter((src) => src.includes("/_next/"));

let total = 0;
const rows = [];
for (const src of scripts) {
  const url = src.startsWith("http") ? src : `${siteUrl.replace(/\/+$/, "")}${src}`;
  const asset = await fetch(url);
  if (!asset.ok) continue;
  const bytes = Buffer.from(await asset.arrayBuffer());
  const gz = gzipSync(bytes).length;
  total += gz;
  rows.push({ file: src.split("/").pop(), raw: bytes.length, gzip: gz });
}

rows.sort((a, b) => b.gzip - a.gzip);
const kb = (n) => (n / 1024).toFixed(1);
console.log(`[perf] ${target}`);
console.log(`[perf] initial JS: ${rows.length} files, gzip ${kb(total)} KB (budget ${budgetKb} KB)`);
for (const row of rows.slice(0, 10)) {
  console.log(`  ${kb(row.gzip).padStart(7)} KB  ${row.file} (raw ${kb(row.raw)} KB)`);
}

if (total > budgetKb * 1024) {
  console.error(`[perf] FAIL: budget exceeded by ${kb(total - budgetKb * 1024)} KB`);
  process.exit(1);
}
console.log("[perf] OK: JS budget satisfied");
