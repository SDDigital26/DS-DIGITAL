import Link from "next/link";
import { requirePagePermission } from "@/lib/permissions";
import { db } from "@/lib/db";

export const metadata = { title: "FAQ" };

export default async function AdminFaqPage() {
  await requirePagePermission("content");

  const items = await db.faqItem.findMany({
    orderBy: [{ sort: "asc" }, { locale: "asc" }],
  });

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">FAQ</h1>
          <p className="mt-1 text-sm text-secondary">
            Всего: {items.length} · опубликовано: {items.filter((i) => i.published).length}
          </p>
        </div>
        <Link
          href="/admin/faq/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/85"
        >
          Новый вопрос
        </Link>
      </header>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 bg-surface/50 p-8 text-center text-sm text-secondary">
          Вопросов пока нет. Публичная страница FAQ показывает честную заглушку, пока вы не
          добавите реальные вопросы.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-surface text-left text-xs text-secondary">
                <tr>
                  <th className="px-4 py-3">Вопрос</th>
                  <th className="px-4 py-3">Язык</th>
                  <th className="px-4 py-3">Порядок</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-white/5">
                    <td className="max-w-md px-4 py-3">
                      <span className="block truncate">{item.question}</span>
                      <span className="block truncate text-xs text-secondary">{item.answer}</span>
                    </td>
                    <td className="px-4 py-3 uppercase text-secondary">{item.locale}</td>
                    <td className="px-4 py-3 text-secondary">{item.sort}</td>
                    <td className="px-4 py-3">
                      {item.published ? (
                        <span className="text-emerald-300">опубликован</span>
                      ) : (
                        <span className="text-secondary">черновик</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/faq/${item.id}`}
                        className="text-sm text-link hover:text-cyan"
                      >
                        Редактировать
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
