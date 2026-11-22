import Link from "next/link";
import { requirePagePermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import {
  TESTIMONIALS_PER_PAGE,
  buildTestimonialWhere,
  parsePage,
  parseTestimonialFilters,
  type TestimonialFilters,
} from "@/lib/testimonial-filters";

// Динамический раздел: данные из БД и searchParams (Next 16 cacheComponents)
export const instant = false;

export const metadata = { title: "Отзывы" };

function qs(filters: TestimonialFilters, patch: Partial<Record<string, string | undefined>> = {}): string {
  const merged: Record<string, string | undefined> = {
    state: filters.state,
    locale: filters.locale,
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

export default async function AdminTestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePagePermission("content");

  const filters = parseTestimonialFilters(await searchParams);
  const where = buildTestimonialWhere(filters);
  const page = parsePage(filters.page);
  const skip = (page - 1) * TESTIMONIALS_PER_PAGE;

  const [total, publishedCount, testimonials] = await Promise.all([
    db.testimonial.count({ where }),
    db.testimonial.count({ where: { approved: true, consentAt: { not: null } } }),
    db.testimonial.findMany({
      where,
      orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
      skip,
      take: TESTIMONIALS_PER_PAGE,
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / TESTIMONIALS_PER_PAGE));

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Отзывы</h1>
          <p className="mt-1 text-sm text-secondary">
            Найдено: {total} · опубликовано всего: {publishedCount}
          </p>
        </div>
        <Link
          href="/admin/testimonials/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/85"
        >
          Новый отзыв
        </Link>
      </header>

      <p className="rounded-xl border border-white/10 bg-surface/50 px-4 py-3 text-xs text-secondary">
        Отзыв публикуется только при двух условиях: он одобрен и зафиксирована дата согласия автора.
        Выдуманные отзывы добавлять нельзя.
      </p>

      <form method="get" className="grid gap-3 rounded-2xl border border-white/10 bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="q" className="text-xs text-secondary">Поиск (автор / роль / текст)</label>
          <input
            id="q"
            name="q"
            type="search"
            maxLength={100}
            defaultValue={filters.q ?? ""}
            className="rounded-lg border border-white/10 bg-bg px-3 py-2 text-base outline-none focus:border-accent"
            placeholder="Найти отзыв…"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="state" className="text-xs text-secondary">Статус</label>
          <select id="state" name="state" defaultValue={filters.state ?? ""} className="rounded-lg border border-white/10 bg-bg px-3 py-2 text-base outline-none focus:border-accent">
            <option value="">Все</option>
            <option value="published">Опубликованные</option>
            <option value="no-consent">Одобрены, без согласия</option>
            <option value="draft">Черновики</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="locale" className="text-xs text-secondary">Язык</label>
          <select id="locale" name="locale" defaultValue={filters.locale ?? ""} className="rounded-lg border border-white/10 bg-bg px-3 py-2 text-base outline-none focus:border-accent">
            <option value="">Все</option>
            <option value="ru">RU</option>
            <option value="en">EN</option>
          </select>
        </div>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
          <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/85">
            Применить
          </button>
          <Link href="/admin/testimonials" className="rounded-lg border border-white/15 px-4 py-2 text-sm text-secondary hover:text-white">
            Сбросить
          </Link>
        </div>
      </form>

      {testimonials.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 bg-surface/50 p-8 text-center text-sm text-secondary">
          Ничего не найдено. Добавляйте только реальные отзывы с согласием автора.
        </p>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-surface text-left text-xs text-secondary">
                  <tr>
                    <th className="px-4 py-3">Автор</th>
                    <th className="px-4 py-3">Язык</th>
                    <th className="px-4 py-3">Порядок</th>
                    <th className="px-4 py-3">Статус</th>
                    <th className="px-4 py-3">Согласие</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {testimonials.map((t) => {
                    const isPublic = t.approved && Boolean(t.consentAt);
                    return (
                      <tr key={t.id} className="border-t border-white/5">
                        <td className="px-4 py-3">
                          <span className="block font-medium">{t.authorName}</span>
                          {t.authorRole ? (
                            <span className="block text-xs text-secondary">{t.authorRole}</span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 uppercase text-secondary">{t.locale}</td>
                        <td className="px-4 py-3 text-secondary">{t.sort}</td>
                        <td className="px-4 py-3">
                          {isPublic ? (
                            <span className="text-emerald-300">опубликован</span>
                          ) : t.approved ? (
                            <span className="text-amber-300">нет согласия</span>
                          ) : (
                            <span className="text-secondary">черновик</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-secondary">
                          {t.consentAt ? new Date(t.consentAt).toLocaleDateString("ru-RU") : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/admin/testimonials/${t.id}`}
                            className="text-sm text-link hover:text-cyan"
                          >
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
                  <Link href={`/admin/testimonials${qs(filters, { page: String(page - 1) })}`} className="rounded-lg border border-white/15 px-4 py-2 hover:border-cyan">
                    ← Назад
                  </Link>
                ) : null}
                {page < totalPages ? (
                  <Link href={`/admin/testimonials${qs(filters, { page: String(page + 1) })}`} className="rounded-lg border border-white/15 px-4 py-2 hover:border-cyan">
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
