import type { Permission } from "@/lib/permissions";

/** Пункты меню админки. Видимость фильтруется по матрице прав (ТЗ §18). */
export type AdminNavItem = {
  href: string;
  label: string;
  permission: Permission;
  /** Раздел ещё не построен — пункт показывается, но не кликабелен (честно, без битых ссылок). */
  soon?: true;
};

export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "Дашборд", permission: "dashboard" },
  { href: "/admin/leads", label: "Заявки", permission: "leads" },
  { href: "/admin/projects", label: "Проекты", permission: "content", soon: true },
  { href: "/admin/services", label: "Услуги", permission: "content" },
  { href: "/admin/faq", label: "FAQ", permission: "content" },
  { href: "/admin/testimonials", label: "Отзывы", permission: "content" },
  { href: "/admin/pages", label: "Контент", permission: "content", soon: true },
  { href: "/admin/media", label: "Медиа", permission: "media", soon: true },
  { href: "/admin/seo", label: "SEO", permission: "seo", soon: true },
  { href: "/admin/settings", label: "Настройки", permission: "settings", soon: true },
  { href: "/admin/users", label: "Пользователи", permission: "users", soon: true },
];
