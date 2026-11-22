import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { defaultLocale, isLocale, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getSiteContent } from "@/lib/content/site-overrides";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Lightning } from "@/components/site/Lightning";
import { CursorSparks } from "@/components/site/CursorSparks";
import { AiConsultant } from "@/components/site/AiConsultant";
import { CookieBanner } from "@/components/site/CookieBanner";
import { getSiteSettings } from "@/lib/site-settings";
import { AnalyticsGate } from "@/components/site/AnalyticsGate";
import "../globals.css";
import "../proto.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Layout читает изменяемые настройки из БД; публичные страницы должны рендериться на запрос.
export const instant = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

function alternatesFor(locale: Locale, path = ""): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[l] = `/${l}${path}`;
  }
  languages["x-default"] = `/${defaultLocale}${path}`;
  return {
    canonical: `/${locale}${path}`,
    languages,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(isLocale(locale) ? locale : defaultLocale);
  const settings = await getSiteSettings();

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `DS DIGITAL — ${dict.home.slogan}`,
      template: "%s | DS DIGITAL",
    },
    description: dict.home.heroText,
    alternates: alternatesFor(isLocale(locale) ? locale : defaultLocale),
    // noindex включается в кабинете, пока домен не согласован (ТЗ §26).
    ...(settings.noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      siteName: "DS DIGITAL",
      type: "website",
      locale: locale === "ru" ? "ru_RU" : "en_US",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = (await getSiteContent(locale));
  const settings = await getSiteSettings();

  return (
    <html lang={locale} className="h-full antialiased" data-effects={settings.effectsMode}>
      <body className="min-h-full">
        {/* Метрики — только после согласия на аналитику (cookie-политика). */}
        <AnalyticsGate />
        {/* Молния (тёмная тема) и искры+кометы (светлая тема) — вне .ds,
            чтобы overflow-x: clip не влиял на fixed-слой */}
        <Lightning mode={settings.effectsMode} />
        <CursorSparks />
        {/* .ds — скоуп стилей прототипа: не задевает Tailwind-классы внутренних страниц */}
        <div className="ds">
          <a className="skip" href="#main">
            {t.skip}
          </a>
          <SiteHeader locale={locale} content={t} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter locale={locale} content={t} />
        </div>
        {settings.aiEnabled ? <AiConsultant locale={locale} /> : null}
        <CookieBanner locale={locale} content={t} />
      </body>
    </html>
  );
}
