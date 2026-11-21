/**
 * Статическая витрина для GitHub Pages (временный публичный адрес, ТЗ Док.4 этап 0).
 *
 * GitHub Pages — только статика: API, БД, cookies и middleware там не работают.
 * Поэтому снимаем HTML готовых страниц с запущенного сайта, удаляем скрипты
 * (иначе ониattempt API-запросы и падают) и переписываем абсолютные пути
 * под префикс репозитория /DS-DIGITAL/.
 *
 * Запуск: PREVIEW_BASE=http://localhost:3001 npm run pages:build
 * Результат: docs/ — отдаётся GitHub Pages из ветки main, папки /docs.
 */
import { mkdir, writeFile, cp } from "node:fs/promises";
import { join, dirname } from "node:path";

const BASE = process.env.PREVIEW_BASE ?? "http://localhost:3001";
const PREFIX = process.env.PAGES_PREFIX ?? "/DS-DIGITAL";
const OUT = "docs";

const ROUTES = [
  "/ru", "/en",
  "/ru/about", "/en/about",
  "/ru/services", "/en/services",
  "/ru/projects", "/en/projects",
  "/ru/process", "/en/process",
  "/ru/calculator", "/en/calculator",
  "/ru/reviews", "/en/reviews",
  "/ru/faq", "/en/faq",
  "/ru/contact", "/en/contact",
  "/ru/privacy", "/en/privacy",
  "/ru/terms", "/en/terms",
  "/ru/cookies", "/en/cookies",
];

const fetchedAssets = new Set();

/** Переписать абсолютные пути под префикс GitHub Pages. */
function rewritePaths(html) {
  return html
    .replace(/(href|src|action)="\/([^"]*)"/g, (_m, attr, path) => `${attr}="${PREFIX}/${path}"`)
    .replace(/url\(\/([^)]*)\)/g, (_m, path) => `url(${PREFIX}/${path})`)
    // next/image: /_next/image?url=%2Fcases%2F... -> прямой файл из public
    .replace(/src="\/_next\/image\?url=([^"&]*)[^"]*"/g, (_m, encoded) => {
      const path = decodeURIComponent(encoded);
      return `src="${PREFIX}${path}"`;
    })
    // srcSet у next/image: заменить каждую строку на прямой файл.
    .replace(/srcSet="([^"]*)"/g, (m, value) => {
      if (!value.includes("/_next/image")) return m;
      const first = value.split(",")[0].trim().split(" ")[0];
      const encoded = first.match(/url=([^&]*)/)?.[1];
      if (!encoded) return m;
      const path = decodeURIComponent(encoded);
      return `srcSet="${PREFIX}${path}"`;
    });
}

async function downloadCss(url, relativePath) {
  if (fetchedAssets.has(relativePath)) return;
  fetchedAssets.add(relativePath);
  try {
    const res = await fetch(url.startsWith("http") ? url : `${BASE}${url}`);
    if (!res.ok) return;
    let css = await res.text();
    css = css.replace(/url\(\/([^)]*)\)/g, (_m, path) => `url(${PREFIX}/${path})`);
    // Внутренние url(./...) остаются относительными — структура _next сохраняется.
    const target = join(OUT, relativePath.replace(/^\//, ""));
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, css, "utf8");
  } catch {
    /* ассет необязателен */
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  // Публичные файлы из public (картинки кейса, иконки).
  await cp("public", OUT, { recursive: true, force: true });

  const missing = [];
  for (const route of ROUTES) {
    const res = await fetch(`${BASE}${route}`, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) {
      missing.push(`${route}: ${res.status}`);
      continue;
    }
    let html = await res.text();

    // Скачиваем CSS, на который ссылается страница.
    const cssLinks = [...html.matchAll(/<link[^>]+href="(\/_next\/static\/[^"]+\.css)"/g)].map((m) => m[1]);
    const preloadLinks = [...html.matchAll(/(?:href|src)="(\/_next\/static\/[^"]+\.(?:js|css|woff2?))"/g)].map((m) => m[1]);
    const assets = [...new Set([...cssLinks, ...preloadLinks])];
    for (const asset of assets) await downloadCss(asset, asset);

    // Удаляем все скрипты Next: на статике нет ни API, ни роутера, ни сессии.
    html = html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "")
      .replace(/<script\b[^>]*\/>/g, "");

    html = rewritePaths(html);
    html = html.replace(
      "</head>",
      `<meta name="robots" content="noindex,nofollow"><style>.preloader,.ai,.calc-form,.contact-form{display:none!important}</style></head>`,
    );

    const target = join(OUT, route === "/" ? "index.html" : `${route}/index.html`);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, html, "utf8");
    process.stdout.write(`  ${route} -> ${target}\n`);
  }

  // Корневой index: редирект на RU.
  await writeFile(
    join(OUT, "index.html"),
    `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${PREFIX}/ru/"><link rel="canonical" href="${PREFIX}/ru/"><title>DS DIGITAL</title><a href="${PREFIX}/ru/">DS DIGITAL →</a>`,
    "utf8",
  );

  if (missing.length) process.stdout.write(`Пропущено: ${missing.join(", ")}\n`);
  process.stdout.write(`Готово: витрина в ${OUT}/ (${ROUTES.length} страниц)\n`);
}

main().catch((error) => {
  console.error("[pages:build]", error);
  process.exitCode = 1;
});
