import Link from "next/link";
import { requirePagePermission, can } from "@/lib/permissions";
import { ADMIN_NAV } from "@/components/admin/nav";
import { LogoutButton } from "@/components/admin/LogoutButton";

// Динамический раздел: данные из cookies/БД (Next 16 cacheComponents)
export const instant = false;

/**
 * Панель админки: серверная проверка входа обязательна.
 * Права дополнительно проверяются на каждом разделе и API — UI не защита.
 */
export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePagePermission("dashboard");
  const items = ADMIN_NAV.filter((item) => can(user.role, item.permission));

  return (
    <div className="min-h-screen bg-bg text-white lg:flex">
      {/* Боковая панель (lg+) */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-white/5 bg-surface/40 p-4 lg:flex">
        <Link href="/admin" className="px-2 py-2 text-lg font-bold">
          DS<span className="text-accent"> DIGITAL</span>
          <span className="block text-[11px] font-normal uppercase tracking-widest text-secondary">
            Админка
          </span>
        </Link>
        <nav aria-label="Разделы админки" className="mt-6 flex flex-col gap-1">
          {items.map((item) =>
            item.soon ? (
              <span
                key={item.href}
                aria-disabled
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-secondary/60"
              >
                {item.label}
                <span className="text-[10px] uppercase tracking-wider">скоро</span>
              </span>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm text-secondary transition-colors hover:bg-white/5 hover:text-white"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="mt-auto border-t border-white/5 pt-4">
          <p className="px-3 text-sm">{user.name ?? user.email}</p>
          <p className="px-3 text-xs text-secondary">Роль: {user.role}</p>
          <div className="mt-3 px-3">
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Шапка + горизонтальная навигация на телефоне/планшете (внутренняя прокрутка) */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-white/5 bg-surface/40 p-3 lg:hidden">
          <div className="flex items-center justify-between gap-2">
            <Link href="/admin" className="text-base font-bold">
              DS<span className="text-accent"> DIGITAL</span>
              <span className="ml-2 text-[10px] font-normal uppercase text-secondary">Админка</span>
            </Link>
            <LogoutButton />
          </div>
          <nav
            aria-label="Разделы админки"
            className="mt-2 flex gap-1 overflow-x-auto pb-1"
          >
            {items.map((item) =>
              item.soon ? (
                <span
                  key={item.href}
                  aria-disabled
                  className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-secondary/60"
                >
                  {item.label} · скоро
                </span>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-secondary hover:bg-white/5 hover:text-white"
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
