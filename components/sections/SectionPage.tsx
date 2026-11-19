import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { PageHeader, PendingBlock } from "@/components/layout/PagePrimitives";

type Section = "about" | "process" | "faq" | "contact" | "calculator" | "privacy" | "terms";

export function createSectionPage(section: Section) {
  return async function SectionPage({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }) {
    const { locale } = await params;
    const l = isLocale(locale) ? locale : defaultLocale;
    const dict = getDictionary(l);

    const content = {
      about: { title: dict.about.title, subtitle: dict.about.subtitle },
      process: { title: dict.process.title, subtitle: dict.process.subtitle },
      faq: { title: dict.faq.title, subtitle: dict.faq.subtitle },
      contact: { title: dict.contact.title, subtitle: dict.contact.subtitle },
      calculator: {
        title: dict.calculator.title,
        subtitle: `${dict.calculator.subtitle} ${dict.calculator.disclaimer}`,
      },
      privacy: { title: dict.footer.privacy, subtitle: dict.home.contentPending },
      terms: { title: dict.footer.terms, subtitle: dict.home.contentPending },
    }[section];

    return (
      <>
        <PageHeader locale={l} title={content.title} subtitle={content.subtitle} />
        <PendingBlock text={dict.home.contentPending} />
      </>
    );
  };
}
