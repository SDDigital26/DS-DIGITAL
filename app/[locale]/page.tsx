import Link from "next/link";
import { connection } from "next/server";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { db } from "@/lib/db";
import { SERVICES } from "@/lib/services";
import { ServicesShowcase, type ShowcaseItem } from "@/components/home/ServicesShowcase";
import { KarmaDemo } from "@/components/home/KarmaDemo";
import { ContactCta } from "@/components/home/ContactCta";

// Данные из БД (услуги) + connection(): правки в админке применяются без деплоя.
export const instant = false;

const MORE_SECTIONS = [
  { key: "projects", href: "/projects" },
  { key: "about", href: "/about" },
  { key: "process", href: "/process" },
  { key: "faq", href: "/faq" },
  { key: "calculator", href: "/calculator" },
] as const;

/**
 * Карточки «Что мы создаём»: из БД (отредактировано в админке).
 * Если БД пуста (не запускали seed:content) — показываем список из брифа,
 * чтобы первый экран не был пустым.
 */
async function showcaseItems(locale: Locale): Promise<ShowcaseItem[]> {
  await connection();

  const services = await db.service.findMany({
    where: { published: true },
    orderBy: [{ sort: "asc" }, { slug: "asc" }],
    include: { translations: true },
  });

  const items: ShowcaseItem[] = [];
  for (const service of services) {
    const translation =
      service.translations.find((t) => t.locale === locale) ?? service.translations[0];
    if (!translation) continue;
    items.push({ slug: service.slug, title: translation.title, hero: translation.hero });
  }

  if (items.length > 0) return items;

  return SERVICES.map((service) => ({
    slug: service.slug,
    title: service.title[locale],
    hero: service.short[locale],
  }));
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l: Locale = isLocale(locale) ? locale : defaultLocale;
  const dict = getDictionary(l);
  const items = await showcaseItems(l);

  const channels =
    l === "ru" ? ["Telegram", "WhatsApp", "Email"] : ["Telegram", "WhatsApp", "Email"];

  return (
    <>
      {/* Hero — по прототипу первого экрана */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 70% 20%, rgba(23,107,255,0.18), transparent 70%), radial-gradient(50% 40% at 20% 80%, rgba(139,92,255,0.14), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 md:pt-28">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan">
            {dict.home.slogan}
          </p>
          <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
            {dict.home.headline}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-secondary md:text-xl">
            {dict.home.subhead}
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href={`/${l}/contact`}
              className="rounded-full bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent/85"
            >
              {dict.home.ctaPrimary}
            </Link>
            <a
              href="#services"
              className="rounded-full border border-white/20 px-6 py-3 font-medium text-white transition-colors hover:border-cyan"
            >
              {dict.home.ctaSecondary}
            </a>
          </div>

          <a
            href="#services"
            className="mt-14 inline-flex items-center gap-2 text-sm text-secondary transition-colors hover:text-white"
          >
            {dict.home.scrollHint}
            <svg
              aria-hidden
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14" />
              <path d="m19 12-7 7-7-7" />
            </svg>
          </a>
        </div>
      </section>

      {/* Что мы создаём */}
      <section id="services" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold sm:text-3xl">{dict.home.showcaseTitle}</h2>
        <div className="mt-6">
          <ServicesShowcase
            items={items}
            hint={dict.home.showcaseHint}
            emptyTitle={dict.home.showcaseEmptyTitle}
            emptyText={dict.home.showcaseEmptyText}
          />
        </div>
      </section>

      {/* KarmaRent CRM — интерактивная демонстрация (появится на этапе 5) */}
      <KarmaDemo locale={l} title={dict.home.demoTitle} note={dict.home.demoNote} />

      {/* Готовы начать? */}
      <ContactCta
        locale={l}
        title={dict.home.ctaTitle}
        text={dict.home.ctaText}
        note={dict.home.prototypeNote}
        channels={channels}
      />

      {/* Остальные разделы — честно «в подготовке», со ссылками на существующие страницы */}
      <section className="border-t border-white/5 bg-surface/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-secondary">
            {dict.common.inDevelopment}
          </h2>
          <nav aria-label="Sections" className="mt-4 flex flex-wrap gap-3">
            {MORE_SECTIONS.map((section) => (
              <Link
                key={section.key}
                href={`/${l}${section.href}`}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-secondary transition-colors hover:border-cyan hover:text-white"
              >
                {dict[section.key].title}
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </>
  );
}
