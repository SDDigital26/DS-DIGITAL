import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { PageHeader } from "@/components/layout/PagePrimitives";
import { ContactForm } from "@/components/site/ContactForm";

/** На отдельной странице — реальная заявка в CRM (первый экран остаётся по прототипу). */
export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : defaultLocale;
  const dict = getDictionary(l);

  return (
    <>
      <PageHeader locale={l} title={dict.contact.title} subtitle={dict.contact.subtitle} />
      <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <ContactForm locale={l} />
      </div>
    </>
  );
}
