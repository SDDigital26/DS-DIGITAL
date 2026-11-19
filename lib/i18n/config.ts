export const locales = ["ru", "en"] as const;
export type Locale = (typeof locales)[number];

/** Язык по умолчанию — международный (/en/). ТЗ Док.2 §15, пометка [С]. */
export const defaultLocale: Locale = "en";

export const LOCALE_COOKIE = "ds_locale";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
