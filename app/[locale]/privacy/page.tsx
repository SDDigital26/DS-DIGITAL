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
    title: SITE[l].legal.privacyTitle,
    description: SITE[l].legal.privacyLead,
    alternates: { canonical: `/${l}/privacy` },
  };
}

export default async function PrivacyPage({
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
        <h1>{t.legal.privacyTitle}</h1>
        <p>{t.legal.privacyLead}</p>

        {t.legal.privacy.map((section) => (
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
