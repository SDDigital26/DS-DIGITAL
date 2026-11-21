import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cache } from "react";
import { connection } from "next/server";
import { defaultLocale, isLocale, locales, type Locale } from "@/lib/i18n/config";
import { db } from "@/lib/db";

export const instant = false;

const loadProject = cache(async (locale: Locale, slug: string) => {
  const project = await db.project.findFirst({
    where: { slug, published: true },
    include: { translations: true, images: { orderBy: { sort: "asc" } } },
  });
  if (!project) return null;

  const t =
    project.translations.find((item) => item.locale === locale) ?? project.translations[0] ?? null;
  return {
    slug: project.slug,
    locales: project.translations.map((item) => item.locale),
    t,
    images: project.images,
  };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const l = isLocale(locale) ? locale : defaultLocale;
  await connection();
  const loaded = await loadProject(l, slug);
  const t = loaded?.t;
  if (!t) return {};
  return {
    title: t.seoTitle || t.title,
    description: t.seoDesc || t.summary || t.title,
    alternates: {
      canonical: `/${l}/projects/${slug}`,
      languages: Object.fromEntries(
        (loaded?.locales ?? []).filter(isLocale).map((loc) => [loc, `/${loc}/projects/${slug}`]),
      ),
    },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const l = isLocale(locale) ? locale : defaultLocale;
  await connection();
  const loaded = await loadProject(l, slug);
  if (!loaded?.t) notFound();

  const t = loaded.t;
  const features = Array.isArray(t.features) ? (t.features as string[]) : [];
  const tech = Array.isArray(t.tech) ? (t.tech as string[]) : [];
  const cover = loaded.images.find((image) => image.type === "cover") ?? loaded.images[0];

  return (
    <article className="mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6">
      <Link href={`/${l}/projects`} className="text-sm text-secondary hover:text-white">
        ← {l === "ru" ? "Все проекты" : "All projects"}
      </Link>

      <header className="mt-6">
        <span className="text-xs uppercase tracking-wider text-cyan">
          {t.category || "Project"}
        </span>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">{t.title}</h1>
        {t.summary ? (
          <p className="mt-4 max-w-3xl text-lg text-secondary">{t.summary}</p>
        ) : null}
      </header>

      {cover ? (
        <figure className="mt-10 overflow-hidden rounded-2xl border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover.url}
            alt={l === "ru" ? cover.altRu : cover.altEn}
            className="w-full object-cover"
            loading="lazy"
          />
        </figure>
      ) : null}

      {t.description ? (
        <section className="mt-12 max-w-3xl">
          <h2 className="text-2xl font-semibold">{l === "ru" ? "О проекте" : "About"}</h2>
          <p className="mt-3 whitespace-pre-wrap text-secondary">{t.description}</p>
        </section>
      ) : null}

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        {t.task ? (
          <section>
            <h2 className="text-2xl font-semibold">{l === "ru" ? "Задача" : "Task"}</h2>
            <p className="mt-3 whitespace-pre-wrap text-secondary">{t.task}</p>
          </section>
        ) : null}
        {t.solution ? (
          <section>
            <h2 className="text-2xl font-semibold">{l === "ru" ? "Решение" : "Solution"}</h2>
            <p className="mt-3 whitespace-pre-wrap text-secondary">{t.solution}</p>
          </section>
        ) : null}
      </div>

      {features.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">{l === "ru" ? "Функции" : "Features"}</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <li key={feature} className="rounded-xl border border-white/10 bg-surface p-4 text-sm">
                {feature}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tech.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">{l === "ru" ? "Технологии" : "Stack"}</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {tech.map((item) => (
              <li key={item} className="rounded-full border border-white/10 px-3 py-1 text-xs text-secondary">
                {item}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {loaded.locales.length > 1 ? (
        <nav aria-label="Languages" className="mt-12 flex gap-3">
          {locales
            .filter((loc) => loaded.locales.includes(loc))
            .map((loc) => (
              <Link
                key={loc}
                href={`/${loc}/projects/${slug}`}
                hrefLang={loc}
                aria-current={loc === l ? "true" : undefined}
                className="rounded px-2 py-1 text-sm uppercase text-secondary hover:text-white"
              >
                {loc}
              </Link>
            ))}
        </nav>
      ) : null}

      <section className="mt-16 rounded-2xl border border-white/10 bg-surface p-8">
        <h2 className="text-2xl font-semibold">{l === "ru" ? "Обсудим ваш проект?" : "Let's talk"}</h2>
        <Link
          href={`/${l}/contact`}
          className="mt-6 inline-block rounded-full bg-accent px-6 py-3 font-medium text-white hover:bg-accent/85"
        >
          {l === "ru" ? "Обсудить проект" : "Let's talk"}
        </Link>
      </section>
    </article>
  );
}
