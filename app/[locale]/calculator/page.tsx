import Link from "next/link";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
import { Calculator } from "@/components/site/Calculator";
import { getSiteContent } from "@/lib/content/site-overrides";

/** Калькулятор — тот же серверный расчёт, что в блоке главной страницы. */
export default async function CalculatorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l: Locale = isLocale(locale) ? locale : defaultLocale;
  const t = (await getSiteContent(l));

  return (
    <div className="ds-calc-page">
      <div className="swrap">
        <p className="back">
          <Link href={`/${l}`}>← {l === "ru" ? "На главную" : "Back home"}</Link>
        </p>
        <h2>{t.calculator.title}</h2>
        <p className="slead">{t.calculator.lead}</p>
      </div>
      <Calculator locale={l} />
    </div>
  );
}
