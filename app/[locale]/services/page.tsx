import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { SERVICES } from "@/lib/services";
import { PageHeader } from "@/components/layout/PagePrimitives";
import Link from "next/link";

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : defaultLocale;
  const dict = getDictionary(l);

  return (
    <>
      <PageHeader locale={l} title={dict.services.title} subtitle={dict.services.subtitle} />
      <div className="mx-auto grid max-w-7xl gap-4 px-4 pb-24 sm:px-6 md:grid-cols-2">
        {SERVICES.map((service) => (
          <Link
            key={service.slug}
            href={`/${l}/services/${service.slug}`}
            className="rounded-2xl border border-white/10 bg-surface p-8 transition-colors hover:border-accent/60"
          >
            <h2 className="text-xl font-semibold">{service.title[l]}</h2>
            <p className="mt-3 text-sm text-secondary">{service.short[l]}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
