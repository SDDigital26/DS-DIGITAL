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
  { href: "/admin/projects", label: "Проекты", permission: "content" },
  { href: "/admin/services", label: "Услуги", permission: "content" },
  { href: "/admin/faq", label: "FAQ", permission: "content" },
  { href: "/admin/articles", label: "SEO-статьи", permission: "content" },
  { href: "/admin/texts", label: "Тексты сайта", permission: "content" },
  { href: "/admin/testimonials", label: "Отзывы", permission: "content" },
  { href: "/admin/calculator", label: "Калькулятор", permission: "settings" },
  { href: "/admin/knowledge", label: "База знаний AI", permission: "settings" },
  { href: "/admin/pages", label: "Контент", permission: "content" },
  { href: "/admin/media", label: "Медиа", permission: "media" },
  { href: "/admin/seo", label: "SEO", permission: "seo" },
  { href: "/admin/settings", label: "Настройки", permission: "settings" },
  { href: "/admin/users", label: "Пользователи", permission: "users" },
];
