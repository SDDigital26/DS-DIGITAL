import { en } from "./dictionaries/en";
import { ru } from "./dictionaries/ru";
import type { Locale } from "./config";

export type Dictionary = typeof en;

const dictionaries: Record<Locale, Dictionary> = {
  en,
  ru: ru as unknown as Dictionary,
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
