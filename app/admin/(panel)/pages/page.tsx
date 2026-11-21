import { requirePagePermission } from "@/lib/permissions";
import { PagesPanel } from "@/components/admin/PagesPanel";

export const metadata = { title: "Контент · страницы" };

/** /admin/pages — право content. */
export default async function AdminPagesPage() {
  await requirePagePermission("content");
  return <PagesPanel />;
}
