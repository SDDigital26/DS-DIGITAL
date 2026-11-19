import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { defaultLocale, isLocale, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "../globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `DS DIGITAL — ${dict.home.slogan}`,
      template: "%s | DS DIGITAL",
    },
    description: dict.home.heroText,
    alternates: alternatesFor(isLocale(locale) ? locale : defaultLocale),
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

  const dict = getDictionary(locale);

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <Header locale={locale} dict={dict} />
        <main className="flex-1">{children}</main>
        <Footer locale={locale} dict={dict} />
      </body>
    </html>
  );
}
