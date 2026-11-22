import { cache } from "react";
import { SITE } from "@/lib/content/site";
import type { Locale } from "@/lib/i18n/config";
import { getSetting, setSetting } from "@/lib/settings";

/**
 * Редактор текстов сайта (ТЗ §17): любые строки словаря SITE правились бы
 * в кабинете без деплоя. Переопределения хранятся в Setting["site-content"].
 */
export const SITE_CONTENT_KEY = "site-content";
export type SiteDictionary = (typeof SITE)[Locale];
export type SiteOverrides = Partial<Record<Locale, Record<string, string>>>;

/** Разворачивает словарь в плоский список полей для редактора. */
export function flattenSiteContent(value: unknown, prefix = "", out: Record<string, string> = {}) {
  if (value === null || value === undefined) return out;
  if (Array.isArray(value)) {
    if (value.every((v) => typeof v === "string" || typeof v === "number" || typeof v === "boolean")) {
      out[prefix] = value.map(String).join("\n");
    } else {
      value.forEach((item, i) => flattenSiteContent(item, `${prefix}.${i}`, out));
    }
  } else if (typeof value === "object") {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      flattenSiteContent(item, prefix ? `${prefix}.${key}` : key, out);
    }
  } else {
    out[prefix] = String(value);
  }
  return out;
}

function setPath(target: Record<string, unknown>, path: string, raw: string, base: unknown) {
  const keys = path.split(".");
  let cursor: Record<string, unknown> = target;
  let baseCursor: unknown = base;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const next = cursor[key];
    if (!next || typeof next !== "object") return;
    cursor = next as Record<string, unknown>;
    baseCursor = (baseCursor as Record<string, unknown> | undefined)?.[key];
  }
  const last = keys[keys.length - 1];
  const current = cursor[last];
  const baseValue = (baseCursor as Record<string, unknown> | undefined)?.[last];

  if (Array.isArray(current)) {
    const lines = raw.split("\n");
    cursor[last] = current.every((v) => typeof v === "number")
      ? lines.map((line) => Number(line) || 0)
      : lines;
  } else if (typeof current === "number") {
    cursor[last] = Number(raw) || 0;
  } else if (typeof current === "boolean") {
    cursor[last] = raw === "true";
  } else if (baseValue !== undefined) {
    cursor[last] = raw;
  }
}

/** Словарь сайта с учётом правок из кабинета. Один запрос на серверный рендер. */
export const getSiteContent = cache(async (locale: Locale): Promise<SiteDictionary> => {
  const base = SITE[locale];
  const overrides = await getSetting<SiteOverrides>(SITE_CONTENT_KEY).catch(() => null);
  const patch = overrides?.[locale];
  if (!patch || !Object.keys(patch).length) return base;

  const merged = structuredClone(base) as unknown as Record<string, unknown>;
  const flatBase = flattenSiteContent(base);
  for (const [path, value] of Object.entries(patch)) {
    if (!(path in flatBase)) continue;
    setPath(merged, path, value, base);
  }
  return merged as unknown as SiteDictionary;
});

export async function saveSiteOverrides(overrides: SiteOverrides): Promise<void> {
  const current = (await getSetting<SiteOverrides>(SITE_CONTENT_KEY).catch(() => null)) ?? {};
  const next: SiteOverrides = { ...current };
  for (const locale of ["ru", "en"] as const) {
    if (overrides[locale]) next[locale] = { ...(current[locale] ?? {}), ...overrides[locale] };
  }
  await setSetting(SITE_CONTENT_KEY, next);
}

export async function clearSiteOverrides(locale: Locale): Promise<void> {
  const current = (await getSetting<SiteOverrides>(SITE_CONTENT_KEY).catch(() => null)) ?? {};
  const next = { ...current };
  delete next[locale];
  await setSetting(SITE_CONTENT_KEY, next);
}
