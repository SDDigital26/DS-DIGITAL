import { requirePagePermission } from "@/lib/permissions";
import { UsersPanel } from "@/components/admin/UsersPanel";

export const metadata = { title: "Пользователи" };

/** /admin/users — только OWNER (право users, ТЗ §18). */
export default async function AdminUsersPage() {
  await requirePagePermission("users");
  return <UsersPanel />;
}
