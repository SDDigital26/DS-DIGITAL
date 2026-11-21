import { notFound } from "next/navigation";
import { requirePagePermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { ArticleForm, type ArticleData } from "@/components/admin/ArticleForm";

export const instant = false;
export const metadata = { title: "Редактирование статьи" };

/** /admin/articles/[id] — редактирование статьи RU/EN. */
export default async function AdminArticleEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission("content");
  const { id } = await params;
  const article = await db.article.findUnique({ where: { id }, include: { translations: true } });
  if (!article) notFound();

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Статья: {article.translations.find((t) => t.locale === "ru")?.title || article.slug}</h1>
          <p className="mt-1 text-sm text-secondary">Редактируйте RU и EN версии; FAQ используется и в микроразметке.</p>
        </div>
        <a href={`/ru/blog/${article.slug}`} target="_blank" rel="noopener noreferrer" className="text-sm text-link hover:text-cyan">
          Открыть на сайте ↗
        </a>
      </header>
      <ArticleForm
        initial={{
          id: article.id,
          slug: article.slug,
          status: article.status,
          sort: article.sort,
          translations: article.translations.map((t) => ({
            id: t.id,
            locale: t.locale,
            title: t.title,
            excerpt: t.excerpt,
            body: t.body,
            seoTitle: t.seoTitle ?? "",
            seoDesc: t.seoDesc ?? "",
            faq: Array.isArray(t.faq)
              ? (t.faq as unknown as { q: string; a: string }[])
              : [],
          })),
        } as ArticleData}
      />
    </div>
  );
}
