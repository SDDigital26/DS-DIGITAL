import type { Metadata } from "next";
import { connection } from "next/server";
import { defaultLocale, isLocale, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { db } from "@/lib/db";
import { PageHeader, PendingBlock } from "@/components/layout/PagePrimitives";
import { JsonLd } from "@/components/site/JsonLd";

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
    locales.map((loc) => [loc, `/${loc}/faq`]),
  );
  languages["x-default"] = `/${defaultLocale}/faq`;

  return {
    title: dict.faq.title,
    description: dict.faq.subtitle,
    alternates: { canonical: `/${l}/faq`, languages },
  };
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l: Locale = isLocale(locale) ? locale : defaultLocale;
  const dict = getDictionary(l);

  await connection();

  const items = await db.faqItem.findMany({
    where: { locale: l, published: true },
    orderBy: [{ sort: "asc" }, { question: "asc" }],
  });

  return (
    <>
      {items.length > 0 ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            inLanguage: l,
            mainEntity: items.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
          }}
        />
      ) : null}

      <PageHeader locale={l} title={dict.faq.title} subtitle={dict.faq.subtitle} />

      {items.length === 0 ? (
        <PendingBlock text={dict.home.contentPending} />
      ) : (
        <div className="mx-auto max-w-4xl px-4 pb-24 sm:px-6">
          <div className="flex flex-col divide-y divide-white/5 rounded-2xl border border-white/10 bg-surface">
            {items.map((item) => (
              <details key={item.id} className="group px-5 py-4">
                <summary className="cursor-pointer list-none text-base font-medium marker:hidden">
                  <span className="flex items-start justify-between gap-4">
                    {item.question}
                    <span
                      aria-hidden
                      className="mt-1 shrink-0 text-secondary transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 whitespace-pre-wrap text-sm text-secondary">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
