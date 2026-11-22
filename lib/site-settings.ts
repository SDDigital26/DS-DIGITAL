import { cache } from "react";
import type { Locale } from "@/lib/i18n/config";
import { DEFAULT_DISCLAIMER } from "@/lib/calculator-defaults";
import type { CalcRule } from "@/lib/calculator";
import { getSetting, CALCULATOR_SETTING_KEY, SEO_DEFAULTS_KEY } from "@/lib/settings";
import { db } from "@/lib/db";
import { normalizeRules } from "@/lib/calculator";

/**
 * Настройки сайта, которые меняются в кабинете (`/admin/settings`).
 *
 * Хранятся в таблице `Setting` (ключ `site`). Если ключа нет — используются
 * дефолты из кода, поэтому сайт всегда работает даже до первой правки.
 */

export type SiteSettings = {
  /** Реальные контакты. Пустая строка — канал скрыт. */
  telegram: string;
  whatsapp: string;
  email: string;
  /** Режим эффектов: full | lite | static (ТЗ §7.4). */
  effectsMode: "full" | "lite" | "static";
  /** Включён ли AI-консультант. */
  aiEnabled: boolean;
  /** Согласие в формах (текст). */
  consentTextRu: string;
  consentTextEn: string;
  /** noindex для всего сайта, пока домен не согласован. */
  noindex: boolean;
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  telegram: "",
  whatsapp: "",
  email: "",
  effectsMode: "lite",
  aiEnabled: true,
  consentTextRu: "Согласен на обработку данных для связи со мной",
  consentTextEn: "I agree to be contacted about my request",
  noindex: true,
};

/**
 * Один запрос к БД на один серверный рендер (layout + metadata + page).
 * `cache()` действует в рамках запроса и не кэширует между пользователями.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const raw = await getSetting<Partial<SiteSettings>>("site").catch(() => null);
  return { ...DEFAULT_SITE_SETTINGS, ...(raw ?? {}) };
});

export type CalculatorData = {
  rules: CalcRule[];
  disclaimer: Record<Locale, string>;
};

/**
 * Правила калькулятора для одного языка + дисклеймер.
 * Дисклеймер читается в обоих исторических форматах (`ru`/`en` и
 * `disclaimerRu`/`disclaimerEn`), чтобы правки из кабинета всегда работали.
 */
export async function getCalculatorData(locale: Locale): Promise<CalculatorData> {
  const rows = await db.calculatorRule.findMany({
    where: { active: true, locale },
    orderBy: [{ sort: "asc" }],
  });

  const config = await getSetting<Record<string, unknown>>(CALCULATOR_SETTING_KEY).catch(() => null);
  const pick = (a: unknown, b: unknown, fallback: string) =>
    typeof a === "string" && a.trim() ? a : typeof b === "string" && b.trim() ? b : fallback;

  return {
    rules: normalizeRules(rows.map((r) => ({ ...r }))),
    disclaimer: {
      ru: pick(config?.ru, config?.disclaimerRu, DEFAULT_DISCLAIMER.ru),
      en: pick(config?.en, config?.disclaimerEn, DEFAULT_DISCLAIMER.en),
    },
  };
}

export type SeoDefaults = { titleRu: string; titleEn: string; descRu: string; descEn: string };

export async function getSeoDefaults(): Promise<SeoDefaults | null> {
  return getSetting<SeoDefaults>(SEO_DEFAULTS_KEY).catch(() => null);
}
