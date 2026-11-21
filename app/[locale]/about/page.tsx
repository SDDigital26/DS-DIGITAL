import type { Metadata } from "next";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { SITE } from "@/lib/content/site";
import { ServiceCards } from "@/components/site/ServiceCards";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : defaultLocale;
  return {
    title: SITE[l].about.title,
    description: SITE[l].about.lead,
    alternates: { canonical: `/${l}/about` },
  };
}

export default async function AboutPage({
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
        <h1>{t.about.title}</h1>
        <p>{t.about.lead}</p>

        {t.about.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 40)}>{paragraph}</p>
        ))}

        <section>
          <h2>{t.about.focusTitle}</h2>
          <ul className="about-list">
            {t.about.focus.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <section id="services">
        <div className="swrap">
          <h2>{t.services.title}</h2>
          <p className="slead">{t.services.lead}</p>
          <ServiceCards locale={l} />
        </div>
      </section>
    </div>
  );
}
