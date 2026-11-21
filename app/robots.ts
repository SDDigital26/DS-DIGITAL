import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/config";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: locales.map((l) => `/${l}/`),
        disallow: ["/admin/", "/api/", "/*/demo/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap-index.xml`,
  };
}
