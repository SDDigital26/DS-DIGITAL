import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { defaultLocale, isLocale, locales } from "@/lib/i18n/config";
import { db } from "@/lib/db";
import { articleJsonLd, faqJsonLd, renderArticleBody } from "@/lib/blog";

export const instant = false;

const load = cache(async (slug: string) => {
  const article = await db.article.findFirst({
    where: { slug, status: "published" },
    include: { translations: true },
  });
  if (!article) return null;
  return article;
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3013";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const l = isLocale(locale) ? locale : defaultLocale;
  await connection();
  const article = await load(slug);
  const tr = article?.translations.find((x) => x.locale === l);
  if (!article || !tr) return {};
  const url = `${SITE_URL}/${l}/blog/${slug}`;
  return {
    title: tr.seoTitle || tr.title,
    description: tr.seoDesc || tr.excerpt,
    alternates: {
      canonical: `/${l}/blog/${slug}`,
      languages: Object.fromEntries([
        ...article.translations.filter((x) => locales.includes(x.locale as never)).map((x) => [x.locale, `/${x.locale}/blog/${slug}`]),
        ["x-default", `/${defaultLocale}/blog/${slug}`],
      ]),
    },
    openGraph: {
      title: tr.seoTitle || tr.title,
      description: tr.seoDesc || tr.excerpt,
      url,
      locale: l,
      type: "article",
      siteName: "DS DIGITAL",
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale;
  await connection();
  const article = await load(slug);
  const tr = article?.translations.find((x) => x.locale === l);
  if (!article || !tr?.title) notFound();

  const faq = Array.isArray(tr.faq)
    ? (tr.faq as unknown as { q: string; a: string }[]).filter((x) => x.q && x.a)
    : [];
  const url = `${SITE_URL}/${l}/blog/${slug}`;
  const jsonLd: Record<string, unknown>[] = [articleJsonLd({
    title: tr.title,
    description: tr.seoDesc || tr.excerpt,
    url,
    datePublished: article.publishedAt?.toISOString() ?? null,
    locale: l,
    siteUrl: SITE_URL,
  })];
  if (faq.length) jsonLd.push(faqJsonLd(faq, l, url));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <nav aria-label={l === "ru" ? "Навигационная цепочка" : "Breadcrumb"} className="mb-6 text-sm text-secondary">
          <Link href={`/${l}`}>{l === "ru" ? "Главная" : "Home"}</Link>
          <span aria-hidden="true"> / </span>
          <Link href={`/${l}/blog`}>{l === "ru" ? "Блог" : "Blog"}</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page" className="text-white">{tr.title}</span>
        </nav>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{tr.title}</h1>
        {tr.excerpt ? <p className="mt-4 text-lg text-secondary">{tr.excerpt}</p> : null}
        {article.publishedAt ? (
          <p className="mt-3 text-xs text-secondary">
            {article.publishedAt.toLocaleDateString(l === "ru" ? "ru-RU" : "en-GB", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        ) : null}

        <article
          className="article-body mt-10 space-y-5 text-[15px] leading-7 text-secondary"
          dangerouslySetInnerHTML={{ __html: renderArticleBody(tr.body) }}
        />

        {faq.length ? (
          <section className="mt-14">
            <h2 className="text-2xl font-semibold text-white">{l === "ru" ? "Частые вопросы" : "FAQ"}</h2>
            <div className="mt-4 grid gap-3">
              {faq.map((item, i) => (
                <details key={i} className="rounded-xl border border-white/10 bg-surface p-4">
                  <summary className="cursor-pointer font-medium text-white">{item.q}</summary>
                  <p className="mt-2 text-sm text-secondary">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-14 rounded-2xl border border-white/10 bg-surface p-6">
          <h2 className="text-xl font-semibold">{l === "ru" ? "Обсудим вашу задачу" : "Let’s discuss your project"}</h2>
          <p className="mt-2 text-sm text-secondary">
            {l === "ru"
              ? "Опишите задачу — поможем выбрать формат и подготовим предложение."
              : "Describe your task — we’ll help you choose the format and prepare an offer."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={`/${l}/calculator`} className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent/85">
              {l === "ru" ? "Рассчитать стоимость" : "Estimate the cost"}
            </Link>
            <Link href={`/${l}/contact`} className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-white hover:bg-white/5">
              {l === "ru" ? "Написать нам" : "Contact us"}
            </Link>
          </div>
        </section>

        <nav className="mt-10 text-sm text-secondary">
          <Link href={`/${l}/blog`} className="text-link hover:text-cyan">← {l === "ru" ? "Все статьи" : "All articles"}</Link>
        </nav>
      </div>
    </>
  );
}
