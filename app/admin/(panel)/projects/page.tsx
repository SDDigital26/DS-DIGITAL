import Link from "next/link";
import { requirePagePermission } from "@/lib/permissions";
import { db } from "@/lib/db";

export const metadata = { title: "Проекты" };

export default async function AdminProjectsPage() {
  await requirePagePermission("content");

  const projects = await db.project.findMany({
    orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
    include: { translations: true },
  });

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Проекты</h1>
          <p className="mt-1 text-sm text-secondary">Всего: {projects.length}</p>
        </div>
        <Link href="/admin/projects/new" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/85">
          Новый кейс
        </Link>
      </header>

      {projects.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 bg-surface/50 p-8 text-center text-sm text-secondary">
          Кейсов пока нет. Публикуйте только реально существующие проекты (ТЗ §4).
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-surface text-left text-xs text-secondary">
                <tr>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Название RU</th>
                  <th className="px-4 py-3">Название EN</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3">Публикация</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => {
                  const ru = project.translations.find((t) => t.locale === "ru");
                  const en = project.translations.find((t) => t.locale === "en");
                  return (
                    <tr key={project.id} className="border-t border-white/5">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{project.slug}</td>
                      <td className="px-4 py-3">{ru?.title ?? "—"}</td>
                      <td className="px-4 py-3 text-secondary">{en?.title ?? "—"}</td>
                      <td className="px-4 py-3 text-secondary">{project.status}</td>
                      <td className="px-4 py-3">
                        {project.published ? (
                          <span className="text-emerald-300">опубликован</span>
                        ) : (
                          <span className="text-secondary">черновик</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/projects/${project.id}`} className="text-sm text-link hover:text-cyan">
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
