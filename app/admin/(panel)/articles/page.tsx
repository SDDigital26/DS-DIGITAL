import Link from "next/link";
import { requirePagePermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { ArticleForm } from "@/components/admin/ArticleForm";

export const instant = false;
export const metadata = { title: "SEO-статьи" };

/** /admin/articles — список статей и создание новых (этап 9). */
export default async function AdminArticlesPage() {
  await requirePagePermission("content");
  const articles = await db.article.findMany({
    orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
    include: { translations: true },
  });

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold">SEO-статьи</h1>
        <p className="mt-1 text-sm text-secondary">
          Статьи блога на RU и EN. Меняйте тексты здесь — на сайте они обновятся без деплоя. Пустой раздел
          означает, что фактов для него пока нет.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-surface/40 p-4">
        <h2 className="text-lg font-semibold">Новая статья</h2>
        <div className="mt-3">
          <ArticleForm initial={null} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Опубликованные и черновики ({articles.length})</h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-surface text-left text-xs text-secondary">
                <tr>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">RU</th>
                  <th className="px-4 py-3">EN</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {articles.map((a) => {
                  const ru = a.translations.find((x) => x.locale === "ru");
                  const en = a.translations.find((x) => x.locale === "en");
                  return (
                    <tr key={a.id} className="border-t border-white/5">
                      <td className="px-4 py-3 font-mono text-xs">{a.slug}</td>
                      <td className="px-4 py-3">{ru?.title || "—"}</td>
                      <td className="px-4 py-3">{en?.title || "—"}</td>
                      <td className="px-4 py-3">{a.status === "published" ? "Опубликована" : "Черновик"}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/articles/${a.id}`} className="text-link hover:text-cyan">Открыть</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
