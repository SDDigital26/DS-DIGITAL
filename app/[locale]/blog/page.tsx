import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { db } from "@/lib/db";

export const instant = false;

const TEXT = {
  ru: { title: "Блог", lead: "Практические статьи о разработке, автоматизации и выбора подрядчика. Только проверенные факты.", empty: "Статьи готовятся и будут опубликованы после проверки фактов.", read: "Читать" },
  en: { title: "Blog", lead: "Practical articles on development, automation and choosing a vendor. Verified facts only.", empty: "Articles are being prepared and will be published once the facts are checked.", read: "Read" },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : defaultLocale;
  await connection();
  return {
    title: l === "ru" ? "Блог DS DIGITAL — статьи о разработке и автоматизации" : "DS DIGITAL Blog — development & automation articles",
    description: TEXT[l].lead,
    alternates: {
      canonical: `/${l}/blog`,
      languages: { ru: "/ru/blog", en: "/en/blog", "x-default": "/ru/blog" },
    },
  };
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale;
  const dict = getDictionary(l);
  await connection();

  const articles = await db.article.findMany({
    where: { status: "published" },
    orderBy: [{ sort: "asc" }, { publishedAt: "desc" }],
    include: { translations: true },
  });

  const t = TEXT[l];
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <nav aria-label={l === "ru" ? "Навигационная цепочка" : "Breadcrumb"} className="mb-6 text-sm text-secondary">
        <Link href={`/${l}`}>{l === "ru" ? "Главная" : "Home"}</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page" className="text-white">{t.title}</span>
      </nav>
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t.title}</h1>
      <p className="mt-4 max-w-2xl text-lg text-secondary">{t.lead}</p>

      {articles.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-white/10 bg-surface/50 p-6 text-center text-sm text-secondary">
          {t.empty}
        </p>
      ) : (
        <div className="mt-10 grid gap-4">
          {articles.map((article) => {
            const tr = article.translations.find((x) => x.locale === l);
            if (!tr?.title) return null;
            return (
              <article key={article.id} className="rounded-2xl border border-white/10 bg-surface p-6">
                <h2 className="text-xl font-semibold">
                  <Link href={`/${l}/blog/${article.slug}`} className="hover:text-cyan">{tr.title}</Link>
                </h2>
                <p className="mt-2 text-sm text-secondary">{tr.excerpt}</p>
                <Link href={`/${l}/blog/${article.slug}`} className="mt-4 inline-block text-sm text-link hover:text-cyan">
                  {t.read} →
                </Link>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-12 rounded-2xl border border-white/10 bg-surface p-6">
        <Link href={`/${l}/contact`} className="text-sm text-link hover:text-cyan">{dict.nav.contacts} →</Link>
      </div>
    </div>
  );
}
