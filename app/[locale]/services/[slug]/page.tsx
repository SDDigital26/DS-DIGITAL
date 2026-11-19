import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { defaultLocale, isLocale, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { SERVICES, getService } from "@/lib/services";
import { PageHeader, PendingBlock } from "@/components/layout/PagePrimitives";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    SERVICES.map((service) => ({ locale, slug: service.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const l: Locale = isLocale(locale) ? locale : defaultLocale;
  const service = getService(slug);
  if (!service) return {};
  return {
    title: service.title[l],
    description: service.short[l],
    alternates: {
      canonical: `/${l}/services/${slug}`,
      languages: Object.fromEntries([
        ...locales.map((x) => [x, `/${x}/services/${slug}`]),
        ["x-default", `/${defaultLocale}/services/${slug}`],
      ]),
    },
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const l: Locale = isLocale(locale) ? locale : defaultLocale;
  const service = getService(slug);
  if (!service) notFound();

  const dict = getDictionary(l);

  return (
    <>
      <PageHeader locale={l} title={service.title[l]} subtitle={service.short[l]} />
      {/* Полный шаблон страницы услуги (ТЗ §8) — этап 5 плана разработки. */}
      <PendingBlock text={dict.services.empty} />
    </>
  );
}
