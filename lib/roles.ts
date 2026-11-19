/**
 * Роли пользователей админки (ТЗ Док.2 §18) — чистый модуль без зависимостей.
 */

export type Role = "OWNER" | "ADMIN" | "EDITOR" | "MANAGER";

export const ROLES: readonly Role[] = ["OWNER", "ADMIN", "EDITOR", "MANAGER"];

export const ROLE_RANK: Record<Role, number> = {
  MANAGER: 1,
  EDITOR: 2,
  ADMIN: 3,
  OWNER: 4,
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}
