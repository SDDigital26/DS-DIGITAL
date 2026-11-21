import Link from "next/link";
import type { Metadata } from "next";
import { cache } from "react";
import { connection } from "next/server";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
import { db } from "@/lib/db";

export const instant = false;

const loadProjects = cache(async (locale: Locale) => {
  const projects = await db.project.findMany({
    where: { published: true },
    orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
    include: { translations: true },
  });

  return projects.flatMap((project) => {
    const t =
      project.translations.find((item) => item.locale === locale) ?? project.translations[0];
    if (!t) return [];
    return [
      {
        id: project.id,
        slug: project.slug,
        title: t.title,
        summary: t.summary || t.description.slice(0, 200),
        category: t.category,
        features: Array.isArray(t.features) ? (t.features as string[]) : [],
        locales: project.translations.map((item) => item.locale),
      },
    ];
  });
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : defaultLocale;
  await connection();
  const projects = await loadProjects(l);
  return {
    title: "Проекты",
    description:
      projects.length > 0
        ? projects.map((p) => p.title).join(", ")
        : "Кейсы публикуются только для реально существующих проектов.",
  };
}

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : defaultLocale;
  await connection();
  const projects = await loadProjects(l);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        {l === "ru" ? "Проекты" : "Projects"}
      </h1>
      <p className="mt-4 max-w-3xl text-lg text-secondary">
        {l === "ru"
          ? "Работы студии. Публикуем только реально существующие проекты."
          : "Our work. We publish only projects that actually exist."}
      </p>

      {projects.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-white/10 bg-surface/50 p-8 text-center text-sm text-secondary">
          {l === "ru"
            ? "Кейсы публикуются только для реально существующих проектов."
            : "Case studies are published only for projects that actually exist."}
        </p>
      ) : (
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* Компактные карточки: описание свёрнуто, чтобы много кейсов не растягивало страницу. */}
          {projects.map((project) => (
            <article
              key={project.id}
              className="group rounded-xl border border-white/10 bg-surface/50 p-4 transition-all hover:-translate-y-1 hover:border-violet"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-cyan">
                    {project.category || "Project"}
                  </span>
                  <h2 className="mt-1 truncate text-lg font-semibold group-hover:text-cyan">
                    {project.title}
                  </h2>
                </div>
              </div>
              <details className="mt-2 text-sm text-secondary">
                <summary className="cursor-pointer text-link">
                  {l === "ru" ? "Подробнее" : "Details"}
                </summary>
                <p className="mt-2">{project.summary}</p>
                {project.features.length > 0 ? (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {project.features.slice(0, 5).map((feature) => (
                      <li key={feature} className="rounded-full border border-white/10 px-2 py-0.5 text-xs">
                        {feature}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </details>
              <Link
                href={`/${l}/projects/${project.slug}`}
                className="mt-3 inline-block text-xs text-link hover:text-cyan"
              >
                {l === "ru" ? "Открыть кейс" : "Open case"} →
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
