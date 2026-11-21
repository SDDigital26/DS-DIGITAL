import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/permissions";
import { projectSchema } from "@/lib/validation/project";
import { revalidateProject } from "@/lib/revalidate";

/** GET /api/admin/projects — все кейсы с переводами и изображениями. Право: content. */
export async function GET() {
  const auth = await requirePermissionApi("content");
  if (auth instanceof NextResponse) return auth;

  const projects = await db.project.findMany({
    orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
    include: { translations: true, images: { orderBy: { sort: "asc" } } },
  });

  return NextResponse.json({ ok: true, projects });
}

/** POST /api/admin/projects — создать кейс. Право: content. */
export async function POST(request: NextRequest) {
  const auth = await requirePermissionApi("content");
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "validation failed",
        issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
      },
      { status: 400 },
    );
  }

  const data = parsed.data;

  const existing = await db.project.findUnique({ where: { slug: data.slug } });
  if (existing) {
    return NextResponse.json({ error: "slug already exists" }, { status: 409 });
  }

  const translations = (["ru", "en"] as const)
    .map((locale) => {
      const t = data.translations[locale];
      return t ? { locale, ...t, ogImage: t.ogImage || null } : null;
    })
    .filter((t): t is NonNullable<typeof t> => t !== null);

  const created = await db.project.create({
    data: {
      slug: data.slug,
      status: data.status ?? "draft",
      sort: data.sort ?? 0,
      published: data.published ?? false,
      translations: { create: translations },
      images: {
        create: (data.images ?? []).map((img, index) => ({
          url: img.url,
          altRu: img.altRu ?? "",
          altEn: img.altEn ?? "",
          type: img.type ?? (index === 0 ? "cover" : "screenshot"),
          sort: img.sort ?? index,
        })),
      },
    },
    include: { translations: true, images: true },
  });

  await db.auditLog.create({
    data: {
      userId: auth.id,
      action: "project.create",
      entity: "Project",
      entityId: created.id,
      diff: {
        slug: created.slug,
        status: created.status,
        published: created.published,
        locales: translations.map((t) => t.locale),
        images: created.images.length,
      },
    },
  });

  revalidateProject(created.slug);
  return NextResponse.json({ ok: true, project: created }, { status: 201 });
}
