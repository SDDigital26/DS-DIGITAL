import { requirePagePermission } from "@/lib/permissions";
import { MediaPanel } from "@/components/admin/MediaPanel";

export const metadata = { title: "Медиа" };

/** /admin/media — право media (OWNER/ADMIN/EDITOR, ТЗ §18). */
export default async function AdminMediaPage() {
  await requirePagePermission("media");
  return <MediaPanel />;
}
