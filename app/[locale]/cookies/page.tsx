import type { Metadata } from "next";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { getSiteContent } from "@/lib/content/site-overrides";
import { CookiePolicyBody } from "@/components/site/CookiePolicyBody";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : defaultLocale;
  return {
    title: (await getSiteContent(l)).cookies.policyLink,
    description: (await getSiteContent(l)).cookies.lead,
    alternates: { canonical: `/${l}/cookies` },
  };
}

export default async function CookiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : defaultLocale;
  const content = await getSiteContent(l);

  return (
    <div className="ds-calc-page">
      <div className="swrap">
        <CookiePolicyBody locale={l} content={content} />
      </div>
    </div>
  );
}
