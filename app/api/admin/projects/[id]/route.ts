import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/permissions";
import { projectSchema } from "@/lib/validation/project";
import { revalidateProject } from "@/lib/revalidate";

/** GET /api/admin/projects/[id] — карточка кейса. Право: content. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermissionApi("content");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    include: { translations: true, images: { orderBy: { sort: "asc" } } },
  });
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({ ok: true, project });
}

/** PATCH /api/admin/projects/[id] — правка кейса. Право: content. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermissionApi("content");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const existing = await db.project.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation failed", issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })) },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Slug мог измениться — проверяем уникальность на другой записи.
  if (data.slug !== existing.slug) {
    const taken = await db.project.findUnique({ where: { slug: data.slug } });
    if (taken) return NextResponse.json({ error: "slug already exists" }, { status: 409 });
  }

  const translations = (["ru", "en"] as const)
    .map((locale) => {
      const t = data.translations[locale];
      return t ? { locale, ...t, ogImage: t.ogImage || null } : null;
    })
    .filter((t): t is NonNullable<typeof t> => t !== null);

  const updated = await db.$transaction(async (tx) => {
    const project = await tx.project.update({
      where: { id },
      data: {
        slug: data.slug,
        status: data.status ?? existing.status,
        sort: data.sort ?? existing.sort,
        published: data.published ?? existing.published,
      },
      include: { translations: true, images: true },
    });

    // Переводы: upsert по (projectId, locale).
    for (const t of translations) {
      await tx.projectTranslation.upsert({
        where: { projectId_locale: { projectId: id, locale: t.locale } },
        create: {
          projectId: id,
          locale: t.locale,
          title: t.title,
          summary: t.summary ?? "",
          description: t.description ?? "",
          task: t.task ?? "",
          solution: t.solution ?? "",
          features: t.features ?? [],
          tech: t.tech ?? [],
          category: t.category ?? "",
          seoTitle: t.seoTitle || null,
          seoDesc: t.seoDesc || null,
          ogImage: t.ogImage || null,
        },
        update: {
          title: t.title,
          summary: t.summary ?? "",
          description: t.description ?? "",
          task: t.task ?? "",
          solution: t.solution ?? "",
          features: t.features ?? [],
          tech: t.tech ?? [],
          category: t.category ?? "",
          seoTitle: t.seoTitle || null,
          seoDesc: t.seoDesc || null,
          ogImage: t.ogImage || null,
        },
      });
    }

    return project;
  });

  await db.auditLog.create({
    data: {
      userId: auth.id,
      action: "project.update",
      entity: "Project",
      entityId: id,
      diff: { slug: updated.slug, status: updated.status, published: updated.published },
    },
  });

  revalidateProject(updated.slug);
  return NextResponse.json({ ok: true, project: updated });
}

/** DELETE /api/admin/projects/[id] — удалить кейс. Право: content. */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermissionApi("content");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const existing = await db.project.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  await db.project.delete({ where: { id } });

  await db.auditLog.create({
    data: {
      userId: auth.id,
      action: "project.delete",
      entity: "Project",
      entityId: id,
      diff: { slug: existing.slug },
    },
  });

  revalidateProject(existing.slug);
  return NextResponse.json({ ok: true });
}
