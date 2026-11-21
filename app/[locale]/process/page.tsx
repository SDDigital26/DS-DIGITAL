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
    title: SITE[l].process.title,
    description: SITE[l].process.lead,
    alternates: { canonical: `/${l}/process` },
  };
}

export default async function ProcessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : defaultLocale;
  const t = SITE[l];

  return (
    <div className="ds-calc-page">
      <div className="swrap">
        <h1>{t.process.title}</h1>
        <p className="slead">{t.process.lead}</p>

        <ol className="steps">
          {t.process.steps.map((step, index) => (
            <li key={step.title}>
              <span className="num" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
