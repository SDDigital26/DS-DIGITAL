import Link from "next/link";
import { defaultLocale, locales } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default function NotFound() {
  // not-found не получает locale-параметр — определяем из URL на клиенте нельзя,
  // поэтому используем нейтральный текст и ссылки на оба языка.
  const dict = getDictionary(defaultLocale);

  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-32 text-center">
      <p className="text-6xl font-bold text-accent">404</p>
      <p className="mt-4 text-lg text-secondary">Page not found · Страница не найдена</p>
      <div className="mt-8 flex gap-4">
        {locales.map((l) => (
          <Link
            key={l}
            href={`/${l}`}
            className="rounded-full border border-white/20 px-5 py-2 text-sm hover:border-cyan"
          >
            {l.toUpperCase()}
          </Link>
        ))}
      </div>
      <p className="sr-only">{dict.nav.services}</p>
    </div>
  );
}
