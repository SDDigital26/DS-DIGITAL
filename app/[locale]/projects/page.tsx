import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { PageHeader, PendingBlock } from "@/components/layout/PagePrimitives";

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : defaultLocale;
  const dict = getDictionary(l);

  return (
    <>
      <PageHeader locale={l} title={dict.projects.title} subtitle={dict.projects.subtitle} />
      <PendingBlock text={dict.projects.empty} />
    </>
  );
}
