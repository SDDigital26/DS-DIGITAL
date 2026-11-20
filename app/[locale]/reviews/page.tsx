import type { Metadata } from "next";
import { connection } from "next/server";
import { defaultLocale, isLocale, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { db } from "@/lib/db";
import { PUBLIC_TESTIMONIAL_WHERE } from "@/lib/validation/testimonial";
import { PageHeader, PendingBlock } from "@/components/layout/PagePrimitives";

// Данные из БД: правки в админке применяются без деплоя.
export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l: Locale = isLocale(locale) ? locale : defaultLocale;
  const dict = getDictionary(l);

  const languages: Record<string, string> = Object.fromEntries(
    locales.map((loc) => [loc, `/${loc}/reviews`]),
  );
  languages["x-default"] = `/${defaultLocale}/reviews`;

  return {
    title: dict.reviews.title,
    description: dict.reviews.subtitle,
    alternates: { canonical: `/${l}/reviews`, languages },
  };
}

export default async function ReviewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l: Locale = isLocale(locale) ? locale : defaultLocale;
  const dict = getDictionary(l);

  await connection();

  const testimonials = await db.testimonial.findMany({
    where: { ...PUBLIC_TESTIMONIAL_WHERE, locale: l },
    orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
  });

  return (
    <>
      <PageHeader locale={l} title={dict.reviews.title} subtitle={dict.reviews.subtitle} />

      {testimonials.length === 0 ? (
        <PendingBlock text={dict.reviews.empty} />
      ) : (
        <div className="mx-auto grid max-w-7xl gap-4 px-4 pb-24 sm:px-6 md:grid-cols-2">
          {testimonials.map((t) => (
            <figure
              key={t.id}
              className="rounded-2xl border border-white/10 bg-surface p-6"
            >
              <blockquote className="whitespace-pre-wrap text-sm text-white/90">
                {t.text}
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                {t.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.avatarUrl}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover"
                    loading="lazy"
                  />
                ) : null}
                <span className="text-sm">
                  <span className="block font-medium">{t.authorName}</span>
                  {t.authorRole ? (
                    <span className="block text-xs text-secondary">{t.authorRole}</span>
                  ) : null}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </>
  );
}
