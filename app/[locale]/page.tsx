import Link from "next/link";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { SERVICES } from "@/lib/services";
import { PendingBlock } from "@/components/layout/PagePrimitives";

const SECTION_KEYS = [
  "about",
  "services",
  "projects",
  "karma",
  "technologies",
  "process",
  "why",
  "reviews",
  "faq",
  "calculator",
  "ai",
  "contact",
] as const;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l: Locale = isLocale(locale) ? locale : defaultLocale;
  const dict = getDictionary(l);

  return (
    <>
      {/* Hero (ТЗ §6.3): оригинальная композиция, не «текст слева, картинка справа».
          3D-компонента добавляется на этапе 6 плана. */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 70% 20%, rgba(23,107,255,0.18), transparent 70%), radial-gradient(50% 40% at 20% 80%, rgba(139,92,255,0.14), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-24 sm:px-6 md:pt-32">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan">
            DS DIGITAL
          </p>
          <h1 className="mt-6 max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
            {dict.home.slogan}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-secondary md:text-xl">
            {dict.home.heroText}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href={`/${l}/contact`}
              className="rounded-full bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent/85"
            >
              {dict.home.ctaPrimary}
            </Link>
            <Link
              href={`/${l}/services`}
              className="rounded-full border border-white/20 px-6 py-3 font-medium text-white transition-colors hover:border-cyan"
            >
              {dict.home.ctaSecondary}
            </Link>
          </div>
        </div>
      </section>

      {/* Services — карточки 7 направлений (реальные названия из брифа) */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-bold">{dict.services.title}</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service) => (
            <Link
              key={service.slug}
              href={`/${l}/services/${service.slug}`}
              className="group rounded-2xl border border-white/10 bg-surface p-6 transition-colors hover:border-accent/60"
            >
              <h3 className="text-lg font-semibold group-hover:text-cyan">
                {service.title[l]}
              </h3>
              <p className="mt-2 text-sm text-secondary">{service.short[l]}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Остальные секции главной — по плану этапов 5-8.
          Заглушки честные, без выдуманного контента (ТЗ §4). */}
      {SECTION_KEYS.filter((k) => k !== "services").map((key) => (
        <section key={key} className="py-6">
          <PendingBlock text={dict.home.contentPending} />
        </section>
      ))}
    </>
  );
}
