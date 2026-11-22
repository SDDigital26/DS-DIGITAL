import Link from "next/link";
import { requirePagePermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import {
  PROJECTS_PER_PAGE,
  buildProjectWhere,
  parsePage,
  parseProjectFilters,
  type ProjectFilters,
} from "@/lib/project-filters";
import { PROJECT_STATUSES } from "@/lib/validation/project";

// Динамический раздел: данные из БД и searchParams (Next 16 cacheComponents)
export const instant = false;

export const metadata = { title: "Проекты" };

const STATUS_LABELS: Record<string, string> = {
  draft: "Черновик",
  live: "Работает",
  in_development: "В разработке",
  archived: "В архиве",
};

function qs(filters: ProjectFilters, patch: Partial<Record<string, string | undefined>> = {}): string {
  const merged: Record<string, string | undefined> = {
    published: filters.published,
    status: filters.status,
    locale: filters.locale,
    category: filters.category,
    q: filters.q,
    page: filters.page,
    ...patch,
  };
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value) sp.set(key, value);
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePagePermission("content");

  const filters = parseProjectFilters(await searchParams);
  const where = buildProjectWhere(filters);
  const page = parsePage(filters.page);
  const skip = (page - 1) * PROJECTS_PER_PAGE;

  const [total, projects] = await Promise.all([
    db.project.count({ where }),
    db.project.findMany({
      where,
      orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
      skip,
      take: PROJECTS_PER_PAGE,
      include: { translations: true },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PROJECTS_PER_PAGE));

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Проекты</h1>
          <p className="mt-1 text-sm text-secondary">Всего: {total}</p>
        </div>
        <Link href="/admin/projects/new" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/85">
          Новый кейс
        </Link>
      </header>

      <form method="get" className="grid gap-3 rounded-2xl border border-white/10 bg-surface p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="q" className="text-xs text-secondary">Поиск (slug / название)</label>
          <input
            id="q"
            name="q"
            type="search"
            maxLength={100}
            defaultValue={filters.q ?? ""}
            className="rounded-lg border border-white/10 bg-bg px-3 py-2 text-base outline-none focus:border-accent"
            placeholder="Найти кейс…"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="published" className="text-xs text-secondary">Публикация</label>
          <select id="published" name="published" defaultValue={filters.published ?? ""} className="rounded-lg border border-white/10 bg-bg px-3 py-2 text-base outline-none focus:border-accent">
            <option value="">Все</option>
            <option value="1">Опубликованные</option>
            <option value="0">Черновики</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-xs text-secondary">Статус</label>
          <select id="status" name="status" defaultValue={filters.status ?? ""} className="rounded-lg border border-white/10 bg-bg px-3 py-2 text-base outline-none focus:border-accent">
            <option value="">Все</option>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="locale" className="text-xs text-secondary">Язык перевода</label>
          <select id="locale" name="locale" defaultValue={filters.locale ?? ""} className="rounded-lg border border-white/10 bg-bg px-3 py-2 text-base outline-none focus:border-accent">
            <option value="">Все</option>
            <option value="ru">RU</option>
            <option value="en">EN</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="category" className="text-xs text-secondary">Категория</label>
          <input
            id="category"
            name="category"
            type="search"
            maxLength={80}
            defaultValue={filters.category ?? ""}
            className="rounded-lg border border-white/10 bg-bg px-3 py-2 text-base outline-none focus:border-accent"
            placeholder="Например, CRM"
          />
        </div>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
          <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/85">
            Применить
          </button>
          <Link href="/admin/projects" className="rounded-lg border border-white/15 px-4 py-2 text-sm text-secondary hover:text-white">
            Сбросить
          </Link>
        </div>
      </form>

      {projects.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 bg-surface/50 p-8 text-center text-sm text-secondary">
          Ничего не найдено. Публикуйте только реально существующие проекты (ТЗ §4).
        </p>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-surface text-left text-xs text-secondary">
                  <tr>
                    <th className="px-4 py-3">Slug</th>
                    <th className="px-4 py-3">Название RU</th>
                    <th className="px-4 py-3">Название EN</th>
                    <th className="px-4 py-3">Категория</th>
                    <th className="px-4 py-3">Статус</th>
                    <th className="px-4 py-3">Публикация</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => {
                    const ru = project.translations.find((t) => t.locale === "ru");
                    const en = project.translations.find((t) => t.locale === "en");
                    return (
                      <tr key={project.id} className="border-t border-white/5">
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{project.slug}</td>
                        <td className="px-4 py-3">{ru?.title ?? "—"}</td>
                        <td className="px-4 py-3 text-secondary">{en?.title ?? "—"}</td>
                        <td className="px-4 py-3 text-secondary">{ru?.category ?? en?.category ?? "—"}</td>
                        <td className="px-4 py-3 text-secondary">{STATUS_LABELS[project.status] ?? project.status}</td>
                        <td className="px-4 py-3">
                          {project.published ? (
                            <span className="text-emerald-300">опубликован</span>
                          ) : (
                            <span className="text-secondary">черновик</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/admin/projects/${project.id}`} className="text-sm text-link hover:text-cyan">
                            Редактировать
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 ? (
            <nav aria-label="Страницы" className="flex items-center justify-between gap-3 text-sm">
              <p className="text-secondary">Страница {page} из {totalPages}</p>
              <div className="flex gap-2">
                {page > 1 ? (
                  <Link href={`/admin/projects${qs(filters, { page: String(page - 1) })}`} className="rounded-lg border border-white/15 px-4 py-2 hover:border-cyan">
                    ← Назад
                  </Link>
                ) : null}
                {page < totalPages ? (
                  <Link href={`/admin/projects${qs(filters, { page: String(page + 1) })}`} className="rounded-lg border border-white/15 px-4 py-2 hover:border-cyan">
                    Вперёд →
                  </Link>
                ) : null}
              </div>
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
