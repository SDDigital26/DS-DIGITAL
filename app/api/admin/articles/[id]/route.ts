import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/permissions";

/** GET/PUT/DELETE /api/admin/articles/[id] — редактирование статьи (право content). */

const translationSchema = z.object({
  title: z.string().trim().max(300).default(""),
  excerpt: z.string().trim().max(1000).default(""),
  body: z.string().max(100_000).default(""),
  seoTitle: z.string().trim().max(120).default(""),
  seoDesc: z.string().trim().max(300).default(""),
  faq: z.array(z.object({ q: z.string().max(300), a: z.string().max(2000) })).max(10).default([]),
});

const updateSchema = z.object({
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  status: z.enum(["draft", "published"]).optional(),
  publishedAt: z.string().datetime().nullable().optional(),
  sort: z.number().int().optional(),
  translations: z.record(z.enum(["ru", "en"]), translationSchema).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const auth = await requirePermissionApi("content");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const article = await db.article.findUnique({ where: { id }, include: { translations: true } });
  if (!article) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true, article });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await requirePermissionApi("content");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation failed" }, { status: 400 });
  }
  const existing = await db.article.findUnique({
    where: { id },
    include: { translations: true },
  });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  const input = parsed.data;
  if (input.slug && input.slug !== existing.slug) {
    const conflict = await db.article.findUnique({ where: { slug: input.slug }, select: { id: true } });
    if (conflict) return NextResponse.json({ error: "slug already exists" }, { status: 409 });
  }

  const article = await db.article.update({
    where: { id },
    data: {
      ...(input.slug ? { slug: input.slug } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.publishedAt !== undefined
        ? { publishedAt: input.publishedAt ? new Date(input.publishedAt) : null }
        : {}),
      ...(input.sort !== undefined ? { sort: input.sort } : {}),
      ...(input.translations
        ? {
            translations: {
              upsert: Object.entries(input.translations).map(([locale, data]) => ({
                where: { articleId_locale: { articleId: id, locale } },
                create: { locale, ...data, faq: data.faq as never },
                update: { ...data, faq: data.faq as never },
              })),
            },
          }
        : {}),
    },
    include: { translations: true },
  });

  await db.auditLog.create({
    data: { userId: auth.id, action: "article.update", entity: "Article", entityId: id },
  });
  revalidatePath("/ru/blog");
  revalidatePath("/en/blog");
  revalidatePath(`/ru/blog/${article.slug}`);
  revalidatePath(`/en/blog/${article.slug}`);
  revalidatePath("/sitemap.xml");
  return NextResponse.json({ ok: true, article });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await requirePermissionApi("content");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  await db.article.delete({ where: { id } });
  await db.auditLog.create({
    data: { userId: auth.id, action: "article.delete", entity: "Article", entityId: id },
  });
  revalidatePath("/ru/blog");
  revalidatePath("/en/blog");
  return NextResponse.json({ ok: true });
}
