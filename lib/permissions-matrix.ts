import type { Role } from "./roles";

/**
 * Матрица прав (ТЗ Док.2 §18) — чистый модуль без зависимостей от Next/Prisma.
 * Вынесена отдельно, чтобы модуль можно было тестировать изолированно.
 */

export type Permission =
  | "dashboard" // дашборд — все роли
  | "content" // Projects/Services/Testimonials/Pages
  | "media" // библиотека изображений
  | "seo"
  | "leads" // просмотр/фильтр/комментарии/статусы
  | "leads_export" // экспорт CSV
  | "settings" // настройки/интеграции/калькулятор
  | "users"; // пользователи и роли

export const MATRIX: Record<Role, readonly Permission[]> = {
  OWNER: ["dashboard", "content", "media", "seo", "leads", "leads_export", "settings", "users"],
  ADMIN: ["dashboard", "content", "media", "seo", "leads", "leads_export", "settings"],
  EDITOR: ["dashboard", "content", "media"],
  MANAGER: ["dashboard", "leads", "leads_export"],
};

export function can(role: Role, permission: Permission): boolean {
  return MATRIX[role].includes(permission);
}

export function permissionsFor(role: Role): readonly Permission[] {
  return MATRIX[role];
}
