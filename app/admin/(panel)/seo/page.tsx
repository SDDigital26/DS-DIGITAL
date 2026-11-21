import { requirePagePermission } from "@/lib/permissions";
import { SeoPanel } from "@/components/admin/SeoPanel";

export const metadata = { title: "SEO" };

/** /admin/seo — право seo (OWNER/ADMIN, ТЗ §18). */
export default async function AdminSeoPage() {
  await requirePagePermission("seo");
  return <SeoPanel />;
}
