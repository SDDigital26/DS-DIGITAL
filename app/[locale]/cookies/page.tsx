import type { Metadata } from "next";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { SITE } from "@/lib/content/site";
import { CookiePolicyBody } from "@/components/site/CookiePolicyBody";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : defaultLocale;
  return {
    title: SITE[l].cookies.policyLink,
    description: SITE[l].cookies.lead,
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

  return (
    <div className="ds-calc-page">
      <div className="swrap">
        <CookiePolicyBody locale={l} />
      </div>
    </div>
  );
}
