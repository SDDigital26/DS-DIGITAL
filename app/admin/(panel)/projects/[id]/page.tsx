import { notFound } from "next/navigation";
import { requirePagePermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { ProjectForm, type ProjectRecord } from "@/components/admin/ProjectForm";

export const metadata = { title: "Редактирование кейса" };

export default async function AdminEditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePagePermission("content");
  const { id } = await params;

  const project = await db.project.findUnique({
    where: { id },
    include: { translations: true, images: { orderBy: { sort: "asc" } } },
  });
  if (!project) notFound();

  const record: ProjectRecord = {
    id: project.id,
    slug: project.slug,
    status: project.status,
    sort: project.sort,
    published: project.published,
    translations: project.translations.map((t) => ({
      locale: t.locale,
      title: t.title,
      summary: t.summary,
      description: t.description,
      task: t.task,
      solution: t.solution,
      features: Array.isArray(t.features) ? (t.features as string[]) : [],
      tech: Array.isArray(t.tech) ? (t.tech as string[]) : [],
      category: t.category,
      seoTitle: t.seoTitle ?? "",
      seoDesc: t.seoDesc ?? "",
      ogImage: t.ogImage ?? "",
    })),
    images: project.images.map((image) => ({
      id: image.id,
      url: image.url,
      altRu: image.altRu,
      altEn: image.altEn,
      type: image.type,
    })),
  };

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Редактирование кейса</h1>
        <p className="mt-1 text-sm text-secondary">
          <code className="text-cyan">{project.slug}</code> · изменения применятся без деплоя
        </p>
      </header>
      <ProjectForm project={record} />
    </div>
  );
}
