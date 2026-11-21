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
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/${l}/projects/${project.slug}`}
              className="group flex flex-col gap-4 rounded-2xl border border-white/10 bg-surface/60 p-6 transition-colors hover:border-violet"
            >
              <div>
                <span className="text-xs uppercase tracking-wider text-cyan">
                  {project.category || "Project"}
                </span>
                <h2 className="mt-2 text-2xl font-semibold group-hover:text-cyan">
                  {project.title}
                </h2>
                <p className="mt-3 text-secondary">{project.summary}</p>
              </div>
              {project.features.length > 0 ? (
                <ul className="flex flex-wrap gap-2 text-xs text-secondary">
                  {project.features.slice(0, 5).map((feature) => (
                    <li key={feature} className="rounded-full border border-white/10 px-3 py-1">
                      {feature}
                    </li>
                  ))}
                </ul>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
