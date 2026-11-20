import Link from "next/link";
import { connection } from "next/server";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { PageHeader } from "@/components/layout/PagePrimitives";
import { db } from "@/lib/db";

// Данные из БД + connection(): правки в админке применяются без деплоя (ТЗ §17)
export const instant = false;

/**
 * Публичный список услуг — данные из БД (редактируются в админке).
 * connection(): страница считается на запросе, чтобы правки применялись
 * сразу после revalidate из админки (без деплоя, ТЗ §17).
 */
export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : defaultLocale;
  const dict = getDictionary(l);

  await connection();

  const services = await db.service.findMany({
    where: { published: true },
    orderBy: [{ sort: "asc" }, { slug: "asc" }],
    include: { translations: { where: { locale: l } } },
  });

  return (
    <>
      <PageHeader locale={l} title={dict.services.title} subtitle={dict.services.subtitle} />

      {services.length === 0 ? (
        <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
          <div className="rounded-2xl border border-dashed border-white/15 bg-surface/50 p-8 text-center text-sm text-secondary">
            {dict.home.contentPending}
          </div>
        </div>
      ) : (
        <div className="mx-auto grid max-w-7xl gap-4 px-4 pb-24 sm:px-6 md:grid-cols-2">
          {services.map((service) => {
            const translation = service.translations[0];
            if (!translation) return null;
            return (
              <Link
                key={service.id}
                href={`/${l}/services/${service.slug}`}
                className="rounded-2xl border border-white/10 bg-surface p-8 transition-colors hover:border-accent/60"
              >
                <h2 className="text-xl font-semibold">{translation.title}</h2>
                <p className="mt-3 text-sm text-secondary">{translation.hero}</p>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
