import Link from "next/link";
import { requirePagePermission } from "@/lib/permissions";
import { db } from "@/lib/db";

export const metadata = { title: "Отзывы" };

export default async function AdminTestimonialsPage() {
  await requirePagePermission("content");

  const testimonials = await db.testimonial.findMany({
    orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
  });

  const published = testimonials.filter((t) => t.approved && t.consentAt).length;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Отзывы</h1>
          <p className="mt-1 text-sm text-secondary">
            Всего: {testimonials.length} · опубликовано: {published}
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

      {testimonials.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 bg-surface/50 p-8 text-center text-sm text-secondary">
          Отзывов пока нет. Добавляйте только реальные отзывы с согласием автора.
        </p>
      ) : (
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
      )}
    </div>
  );
}
