import { cache } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { connection } from "next/server";
import { defaultLocale, isLocale, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getSiteContent } from "@/lib/content/site-overrides";
import { db } from "@/lib/db";
import { ContactForm } from "@/components/site/ContactForm";

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

  const translation = service.translations.find((t) => t.locale === locale) ?? null;

  return {
    slug: service.slug,
    availableLocales: service.translations.map((t) => t.locale),
    translation,
  };
});

type Loaded = NonNullable<Awaited<ReturnType<typeof loadService>>>;

/** Опубликованные кейсы и FAQ — по ТЗ §8 пустые разделы не показываем. */
async function loadRelated(locale: Locale) {
  const [projects, faq] = await Promise.all([
    db.project.findMany({
      where: { published: true },
      orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
      take: 4,
      include: { translations: true },
    }),
    db.faqItem.findMany({
      where: { locale, published: true },
      orderBy: [{ sort: "asc" }, { question: "asc" }],
      take: 6,
      select: { id: true, question: true, answer: true },
    }),
  ]);
  const cases = projects.flatMap((project) => {
    const t =
      project.translations.find((x) => x.locale === locale) ?? project.translations[0];
    if (!t) return [];
    return [{ id: project.id, title: t.title, summary: t.summary || t.description.slice(0, 160) }];
  });
  return { cases, faq };
}

/** Демонстрация — только реальный публичный кейс RIDEFLOW (скриншоты на демо-данных). */
const DEMO_SHOTS = [
  { src: "/cases/rideflow/calendar.webp", alt: "Occupancy calendar" },
  { src: "/cases/rideflow/rentals.webp", alt: "Rental list" },
  { src: "/cases/rideflow/gps-map.jpg", alt: "GPS tracking" },
];

function alternatesFor(loaded: Loaded, locale: Locale): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  const available = loaded.availableLocales.filter(isLocale);
  for (const l of loaded.availableLocales) {
    if (isLocale(l)) languages[l] = `/${l}/services/${loaded.slug}`;
  }
  const defaultAlt = available.includes(defaultLocale) ? defaultLocale : available[0];
  if (defaultAlt) languages["x-default"] = `/${defaultAlt}/services/${loaded.slug}`;
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
  const [related, settings] = await Promise.all([
    loadRelated(l),
    import("@/lib/site-settings").then((m) => m.getSiteSettings()),
  ]);
  const sectionLabels = l === "ru"
    ? {
        breadcrumb: "Главная", result: "Результат для клиента", audience: "Кому подходит",
        problem: "Задача", solution: "Подход к решению",
        features: "Возможности", benefits: "Что входит", demo: "Демонстрация",
        portfolio: "Связанные кейсы", technologies: "Технологии", process: "Процесс работы",
        timeline: "Сроки", faq: "Частые вопросы", request: "Обсудить задачу", start: "Начать проект",
      }
    : {
        breadcrumb: "Home", result: "The result for you", audience: "Who it is for",
        problem: "The challenge", solution: "Approach",
        features: "Capabilities", benefits: "What’s included", demo: "Demo",
        portfolio: "Related cases", technologies: "Technologies", process: "Our process",
        timeline: "Timeline", faq: "FAQ", request: "Discuss your project", start: "Start a project",
      };
  const s = (await getSiteContent(l));
  const showDemo = slug === "crm-development" && settings.aiEnabled;

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-6">
        <nav aria-label={l === "ru" ? "Навигационная цепочка" : "Breadcrumb"} className="mb-6 text-sm text-secondary">
          <Link href={`/${l}`}>{sectionLabels.breadcrumb}</Link>
          <span aria-hidden="true"> / </span>
          <Link href={`/${l}/services`}>{dict.nav.services}</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page" className="text-white">{t.title}</span>
        </nav>
        <Link href={`/${l}/services`} className="text-sm text-secondary hover:text-white">
          ← {dict.nav.services}
        </Link>
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">{t.title}</h1>
        {t.hero ? (
          <p className="mt-4 max-w-3xl text-lg text-secondary">{t.hero}</p>
        ) : null}
        {/* ТЗ §8: CTA в первом экране, доступен без долгого скролла на мобильных. */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="#lead-form" className="rounded-full bg-accent px-6 py-3 font-medium text-white hover:bg-accent/85">
            {sectionLabels.request}
          </Link>
          <Link href={`/${l}/calculator`} className="rounded-full border border-white/15 px-6 py-3 font-medium text-white hover:bg-white/5">
            {l === "ru" ? "Рассчитать стоимость" : "Estimate cost"}
          </Link>
        </div>
      </div>

      {t.result ? (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h2 className="text-2xl font-semibold">{sectionLabels.result}</h2>
          <p className="mt-3 max-w-3xl whitespace-pre-wrap text-secondary">{t.result}</p>
        </section>
      ) : null}

      {t.audience ? (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h2 className="text-2xl font-semibold">{sectionLabels.audience}</h2>
          <p className="mt-3 max-w-3xl whitespace-pre-wrap text-secondary">{t.audience}</p>
        </section>
      ) : null}

      {t.problem ? (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h2 className="text-2xl font-semibold">{sectionLabels.problem}</h2>
          <p className="mt-3 max-w-3xl whitespace-pre-wrap text-secondary">{t.problem}</p>
        </section>
      ) : null}

      {t.solution ? (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h2 className="text-2xl font-semibold">{sectionLabels.solution}</h2>
          <p className="mt-3 max-w-3xl whitespace-pre-wrap text-secondary">{t.solution}</p>
        </section>
      ) : null}

      {benefits.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h2 className="text-2xl font-semibold">{sectionLabels.benefits}</h2>
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

      {/* ТЗ §8: Возможности — реальные направления студии (без выдуманных фактов). */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h2 className="text-2xl font-semibold">{sectionLabels.features}</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {s.about.focus.map((item) => (
            <li key={item} className="rounded-xl border border-white/10 bg-surface/50 p-3 text-sm text-secondary">
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* ТЗ §8: Демонстрация — только реальный кейс, скриншоты на демо-данных. */}
      {showDemo ? (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h2 className="text-2xl font-semibold">{sectionLabels.demo}</h2>
          <p className="mt-2 text-sm text-secondary">
            {l === "ru"
              ? "RIDEFLOW — CRM для управления арендой. Скриншоты на демонстрационных данных."
              : "RIDEFLOW — a CRM for rental management. Screenshots show demo data."}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {DEMO_SHOTS.map((shot) => (
              <div key={shot.src} className="relative aspect-video overflow-hidden rounded-xl border border-white/10">
                <Image src={shot.src} alt={shot.alt} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
              </div>
            ))}
          </div>
          <Link href={`/${l}/projects`} className="mt-4 inline-block text-sm text-link hover:text-cyan">
            {l === "ru" ? "Все проекты" : "All projects"} →
          </Link>
        </section>
      ) : null}

      {/* ТЗ §8: Портфолио — только опубликованные кейсы; пустое не показываем. */}
      {related.cases.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h2 className="text-2xl font-semibold">{sectionLabels.portfolio}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {related.cases.map((item) => (
              <article key={item.id} className="rounded-xl border border-white/10 bg-surface p-4">
                <h3 className="font-medium">{item.title}</h3>
                <p className="mt-1 text-sm text-secondary">{item.summary}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {/* ТЗ §8: Технологии — только реально используемый стек. */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h2 className="text-2xl font-semibold">{sectionLabels.technologies}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {s.technologies.groups.map((group) => (
            <div key={group.name} className="rounded-xl border border-white/10 bg-surface p-4">
              <h3 className="text-sm font-semibold text-cyan">{group.name}</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li key={item} className="rounded-full bg-white/5 px-2 py-1 text-xs text-secondary">{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ТЗ Док.2 §7.2: сроки публикуются только после подтверждения. */}
      {t.timeline ? (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h2 className="text-2xl font-semibold">{sectionLabels.timeline}</h2>
          <p className="mt-3 max-w-3xl whitespace-pre-wrap text-secondary">{t.timeline}</p>
        </section>
      ) : null}

      {/* ТЗ §8: Процесс работы — пять шагов, согласованных в ТЗ. */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h2 className="text-2xl font-semibold">{sectionLabels.process}</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {s.process.steps.map((step, index) => (
            <li key={step.title} className="rounded-xl border border-white/10 bg-surface p-4">
              <span className="text-xs text-cyan">0{index + 1}</span>
              <h3 className="mt-2 font-medium">{step.title}</h3>
              <p className="mt-1 text-xs text-secondary">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ТЗ §8: FAQ — только опубликованные вопросы; пустое не показываем. */}
      {related.faq.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h2 className="text-2xl font-semibold">{sectionLabels.faq}</h2>
          <div className="mt-4 grid gap-2">
            {related.faq.map((item) => (
              <details key={item.id} className="rounded-xl border border-white/10 bg-surface p-4">
                <summary className="cursor-pointer font-medium">{item.question}</summary>
                <p className="mt-2 text-sm text-secondary">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-white/10 bg-surface p-8">
          <h2 className="text-2xl font-semibold">{dict.home.ctaPrimary}</h2>
          <p className="mt-2 text-sm text-secondary">{dict.calculator.disclaimer}</p>
          <Link
            href="#lead-form"
            className="mt-6 inline-block rounded-full bg-accent px-6 py-3 font-medium text-white hover:bg-accent/85"
          >
            {sectionLabels.request}
          </Link>
        </div>
      </section>

      <section id="lead-form" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-16 sm:px-6">
        <h2 className="mb-6 text-2xl font-semibold">{sectionLabels.request}</h2>
        <ContactForm key={`${l}-${t.title}`} locale={l} defaultService={t.title} />
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
