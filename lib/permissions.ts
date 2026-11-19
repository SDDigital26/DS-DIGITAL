import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getCurrentUser, requireRole, type SessionUser } from "@/lib/auth";
import { can, permissionsFor, MATRIX, type Permission } from "@/lib/permissions-matrix";

export { can, permissionsFor, MATRIX };
export type { Permission };

/**
 * Серверные гарды админки (ТЗ Док.2 §18).
 *
 * Видимость пунктов меню в UI — лишь удобство; ограничение применяется
 * ВСЕГДА на сервере: в layout страницы и в каждом API-обработчике.
 */

export function forbidden(): NextResponse {
  return NextResponse.json({ error: "forbidden" }, { status: 403 });
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

/** Текущий пользователь с нужным правом или null. */
export async function userWithPermission(
  permission: Permission,
): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, permission)) return null;
  return user;
}

/** Гард страницы: нет входа → /admin/login; нет права → /admin (403 не показываем данные). */
export async function requirePagePermission(permission: Permission): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (!can(user.role, permission)) redirect("/admin");
  return user;
}

/** Гард API: SessionUser или готовая ошибка (401 без входа, 403 без права). */
export async function requirePermissionApi(
  permission: Permission,
): Promise<SessionUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!can(user.role, permission)) return forbidden();
  return user;
}

/** Гард API с явной минимальной ролью (для мест, где важен ранг, а не имя права). */
export async function requireApiRole(minRole: "OWNER" | "ADMIN" | "EDITOR" | "MANAGER"): Promise<SessionUser | NextResponse> {
  const user = await requireRole(minRole);
  if (!user) {
    const existing = await getCurrentUser();
    return existing ? forbidden() : unauthorized();
  }
  return user;
}
