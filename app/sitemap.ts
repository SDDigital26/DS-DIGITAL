import type { MetadataRoute } from "next";
import { defaultLocale, locales } from "@/lib/i18n/config";
import { SERVICES } from "@/lib/services";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const STATIC_PATHS = [
  "",
  "/services",
  "/projects",
  "/about",
  "/process",
  "/faq",
  "/contact",
  "/calculator",
  "/privacy",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const path of STATIC_PATHS) {
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: path === "" ? 1 : 0.7,
        alternates: {
          languages: Object.fromEntries([
            ...locales.map((l) => [l, `${SITE_URL}/${l}${path}`]),
            ["x-default", `${SITE_URL}/${defaultLocale}${path}`],
          ]),
        },
      });
    }
    for (const service of SERVICES) {
      const path = `/services/${service.slug}`;
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
        alternates: {
          languages: Object.fromEntries([
            ...locales.map((l) => [l, `${SITE_URL}/${l}${path}`]),
            ["x-default", `${SITE_URL}/${defaultLocale}${path}`],
          ]),
        },
      });
    }
  }

  return entries;
}
