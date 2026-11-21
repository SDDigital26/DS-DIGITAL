import type { Metadata } from "next";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { SITE } from "@/lib/content/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : defaultLocale;
  return {
    title: SITE[l].legal.termsTitle,
    description: SITE[l].legal.termsLead,
    alternates: { canonical: `/${l}/terms` },
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : defaultLocale;
  const t = SITE[l];

  return (
    <div className="ds-calc-page">
      <div className="swrap policy">
        <h1>{t.legal.termsTitle}</h1>
        <p>{t.legal.termsLead}</p>

        {t.legal.terms.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            <p>{section.text}</p>
          </section>
        ))}

        <p>{t.legal.contactNote}</p>
      </div>
    </div>
  );
}
