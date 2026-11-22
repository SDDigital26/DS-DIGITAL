import { requirePagePermission } from "@/lib/permissions";
import { getSiteContent } from "@/lib/content/site-overrides";
import { flattenSiteContent } from "@/lib/content/site-overrides";
import { SiteTextsEditor } from "@/components/admin/SiteTextsEditor";

// Динамический раздел: тексты из БД (Next 16 cacheComponents)
export const instant = false;
export const metadata = { title: "Тексты сайта" };

export default async function AdminTextsPage() {
  await requirePagePermission("content");
  const [ru, en] = await Promise.all([getSiteContent("ru"), getSiteContent("en")]);
  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Тексты сайта</h1>
        <p className="mt-1 text-sm text-secondary">Все строки главной и внутренних страниц: RU / EN.</p>
      </header>
      <SiteTextsEditor
        texts={{ ru: flattenSiteContent(ru), en: flattenSiteContent(en) }}
      />
    </div>
  );
}
