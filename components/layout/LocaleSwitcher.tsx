"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, LOCALE_COOKIE, type Locale } from "@/lib/i18n/config";

/** Сохранение выбора языка (ТЗ §15) — вне компонента, чтобы правило не считало мутацией. */
function persistLocale(next: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

/**
 * Переключатель RU/EN (ТЗ §15): ведёт на ту же страницу на другом языке,
 * сохраняет выбор в cookie — авто-переключений больше нет.
 */
export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const pathWithoutLocale = pathname.replace(/^\/(ru|en)(?=\/|$)/, "");

  return (
    <div className="flex items-center gap-1 text-sm" role="group" aria-label="Language">
      {locales.map((l) => (
        <Link
          key={l}
          href={`/${l}${pathWithoutLocale}`}
          onClick={() => persistLocale(l)}
          hrefLang={l}
          aria-current={l === locale ? "true" : undefined}
          className={`rounded px-2 py-1 uppercase transition-colors ${
            l === locale
              ? "bg-surface font-semibold text-white"
              : "text-secondary hover:text-white"
          }`}
        >
          {l}
        </Link>
      ))}
    </div>
  );
}
