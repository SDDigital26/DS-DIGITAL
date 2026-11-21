import type { MetadataRoute } from "next";
import { defaultLocale, locales } from "@/lib/i18n/config";
import { SERVICES } from "@/lib/services";
import { db } from "@/lib/db";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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
  "/blog",
  "/privacy",
  "/terms",
  "/cookies",
];

function alternates(path: string, available?: string[]) {
  const langs = available?.length ? available : locales;
  return {
    languages: Object.fromEntries([
      ...langs.map((l) => [l, `${SITE_URL}/${l}${path}`]),
      ["x-default", `${SITE_URL}/${defaultLocale}${path}`],
    ]),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const path of STATIC_PATHS) {
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: path === "" ? 1 : path === "/blog" ? 0.8 : 0.7,
        alternates: alternates(path),
      });
    }
    for (const service of SERVICES) {
      const path = `/services/${service.slug}`;
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
        alternates: alternates(path),
      });
    }
  }

  // Опубликованные статьи: только те языки, где есть перевод (корректный hreflang).
  const articles = await db.article
    .findMany({
      where: { status: "published" },
      select: { slug: true, publishedAt: true, translations: { select: { locale: true } } },
    })
    .catch(() => []);
  for (const article of articles) {
    const path = `/blog/${article.slug}`;
    const available = article.translations.map((t) => t.locale).filter((l) => locales.includes(l as never));
    for (const locale of available) {
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: article.publishedAt ?? new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
        alternates: alternates(path, available),
      });
    }
  }

  return entries;
}
