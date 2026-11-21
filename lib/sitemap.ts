import { connection } from "next/server";
import { db } from "@/lib/db";
import { defaultLocale, isLocale, locales, type Locale } from "@/lib/i18n/config";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const STATIC_PATHS = [
  "",
  "/services",
  "/projects",
  "/about",
  "/process",
  "/reviews",
  "/faq",
  "/contact",
  "/calculator",
  "/privacy",
  "/terms",
  "/cookies",
] as const;

type Entry = { path: string; languages: Locale[]; lastModified?: Date };

function xmlEscape(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      default: return "&apos;";
    }
  });
}

function normalizePath(path: string): string {
  const withoutLocale = path.replace(/^\/(ru|en)(?=\/|$)/, "");
  return withoutLocale || "/";
}

function absoluteUrl(locale: Locale, path: string): string {
  const safePath = path.split("/").map((part) => encodeURIComponent(part)).join("/");
  return `${SITE_URL}/${locale}${safePath}`;
}

export function sitemapIndexXml(): string {
  const lastmod = new Date().toISOString();
  const entries = locales.map((locale) =>
    `<sitemap><loc>${xmlEscape(`${SITE_URL}/sitemap-${locale}.xml`)}</loc><lastmod>${lastmod}</lastmod></sitemap>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join("")}</sitemapindex>`;
}

export async function localizedSitemapXml(locale: Locale): Promise<string> {
  await connection();
  const [services, projects, noindex] = await Promise.all([
    db.service.findMany({
      where: { published: true },
      select: { slug: true, translations: { select: { locale: true } } },
    }),
    db.project.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true, translations: { select: { locale: true } } },
    }),
    db.seoSetting.findMany({ where: { locale, noindex: true }, select: { path: true } }),
  ]);

  const entries: Entry[] = [
    ...STATIC_PATHS.map((path) => ({ path, languages: [...locales] as Locale[] })),
    ...services.flatMap((service) => {
      const languages = service.translations.map((t) => t.locale).filter(isLocale);
      return languages.includes(locale) ? [{ path: `/services/${service.slug}`, languages }] : [];
    }),
    ...projects.flatMap((project) => {
      const languages = project.translations.map((t) => t.locale).filter(isLocale);
      return languages.includes(locale)
        ? [{ path: `/projects/${project.slug}`, languages, lastModified: project.updatedAt }]
        : [];
    }),
  ];

  const excluded = new Set(noindex.map((setting) => normalizePath(setting.path)));
  const urls = entries
    .filter((entry) => !excluded.has(normalizePath(entry.path)))
    .map((entry) => {
      const alternates = entry.languages
        .map((language) => `<xhtml:link rel="alternate" hreflang="${language}" href="${xmlEscape(absoluteUrl(language, entry.path))}"/>`)
        .concat(
          entry.languages.includes(defaultLocale)
            ? [`<xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(absoluteUrl(defaultLocale, entry.path))}"/>`]
            : [],
        )
        .join("");
      const lastmod = entry.lastModified ? `<lastmod>${entry.lastModified.toISOString()}</lastmod>` : "";
      return `<url><loc>${xmlEscape(absoluteUrl(locale, entry.path))}</loc>${lastmod}${alternates}</url>`;
    });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join("")}</urlset>`;
}
