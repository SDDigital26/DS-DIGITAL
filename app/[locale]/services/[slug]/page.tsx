import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { connection } from "next/server";
import { defaultLocale, isLocale, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { db } from "@/lib/db";

// Данные из БД + connection(): правки в админке применяются без деплоя (ТЗ §17).
// instant = false — единственный совместимый с cacheComponents способ
// сделать маршрут динамическим (PPR отдаёт 200 с корректной 404-страницей в теле).
export const instant = false;

/**
 * Данные услуги из БД (правится в админке, применяется без деплоя).
 * cache() — один запрос на запрос для metadata и страницы.
 */
const loadService = cache(async (locale: Locale, slug: string) => {
  const service = await db.service.findFirst({
    where: { slug, published: true },
    include: { translations: true },
  });
  if (!service) return null;

  const translation =
    service.translations.find((t) => t.locale === locale) ?? service.translations[0] ?? null;

  return {
    slug: service.slug,
    availableLocales: service.translations.map((t) => t.locale),
    translation,
  };
});

type Loaded = NonNullable<Awaited<ReturnType<typeof loadService>>>;

function alternatesFor(loaded: Loaded, locale: Locale): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const l of loaded.availableLocales) {
    if (isLocale(l)) languages[l] = `/${l}/services/${loaded.slug}`;
  }
  if (!languages.x_default) languages["x-default"] = `/${defaultLocale}/services/${loaded.slug}`;
  return { canonical: `/${locale}/services/${loaded.slug}`, languages };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const l: Locale = isLocale(locale) ? locale : defaultLocale;
  await connection();
  const loaded = await loadService(l, slug);
  if (!loaded?.translation) return {};

  const t = loaded.translation;
  return {
    title: t.seoTitle || t.title,
    description: t.seoDesc || t.hero || t.title,
    alternates: alternatesFor(loaded, l),
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const l: Locale = isLocale(locale) ? locale : defaultLocale;
  const dict = getDictionary(l);

  await connection();
  const loaded = await loadService(l, slug);
  if (!loaded?.translation) notFound();

  const t = loaded.translation;
  const benefits = Array.isArray(t.benefits) ? (t.benefits as string[]) : [];

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-6">
        <Link href={`/${l}/services`} className="text-sm text-secondary hover:text-white">
          ← {dict.nav.services}
        </Link>
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">{t.title}</h1>
        {t.hero ? (
          <p className="mt-4 max-w-3xl text-lg text-secondary">{t.hero}</p>
        ) : null}
      </div>

      {t.problem ? (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h2 className="text-2xl font-semibold">Проблема</h2>
          <p className="mt-3 max-w-3xl whitespace-pre-wrap text-secondary">{t.problem}</p>
        </section>
      ) : null}

      {t.solution ? (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h2 className="text-2xl font-semibold">Решение</h2>
          <p className="mt-3 max-w-3xl whitespace-pre-wrap text-secondary">{t.solution}</p>
        </section>
      ) : null}

      {benefits.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h2 className="text-2xl font-semibold">Преимущества</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <li
                key={benefit}
                className="rounded-xl border border-white/10 bg-surface p-4 text-sm"
              >
                {benefit}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-white/10 bg-surface p-8">
          <h2 className="text-2xl font-semibold">{dict.home.ctaPrimary}</h2>
          <p className="mt-2 text-sm text-secondary">{dict.calculator.disclaimer}</p>
          <Link
            href={`/${l}/contact`}
            className="mt-6 inline-block rounded-full bg-accent px-6 py-3 font-medium text-white hover:bg-accent/85"
          >
            {dict.nav.letsTalk}
          </Link>
        </div>
      </section>

      {loaded.availableLocales.length > 1 ? (
        <nav
          aria-label="Languages"
          className="mx-auto flex max-w-7xl gap-3 px-4 pb-16 sm:px-6"
        >
          {locales
            .filter((loc) => loaded.availableLocales.includes(loc))
            .map((loc) => (
              <Link
                key={loc}
                href={`/${loc}/services/${loaded.slug}`}
                hrefLang={loc}
                aria-current={loc === l ? "true" : undefined}
                className="rounded px-2 py-1 text-sm uppercase text-secondary hover:text-white"
              >
                {loc}
              </Link>
            ))}
        </nav>
      ) : null}
    </>
  );
}
