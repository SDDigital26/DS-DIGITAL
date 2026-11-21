import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/permissions";

/** PUT/DELETE /api/admin/pages/[id] — редактирование страницы (право content). */
const translation = z.object({
  title: z.string().trim().max(300).default(""),
  content: z.string().max(100_000).default(""),
  seoTitle: z.string().trim().max(200).default(""),
  seoDesc: z.string().trim().max(500).default(""),
});
const schema = z.object({
  published: z.boolean().optional(),
  ru: translation.optional(),
  en: translation.optional(),
});
type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await requirePermissionApi("content");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation failed" }, { status: 400 });
  const existing = await db.page.findUnique({ where: { id }, select: { path: true } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
  const input = parsed.data;
  const upserts = (["ru", "en"] as const).filter((l) => input[l]).map((locale) => {
    const data = input[locale]!;
    return {
      where: { pageId_locale: { pageId: id, locale } },
      create: { locale, ...data, content: data.content as never },
      update: { ...data, content: data.content as never },
    };
  });
  const page = await db.page.update({
    where: { id },
    data: {
      ...(input.published !== undefined ? { published: input.published } : {}),
      ...(upserts.length ? { translations: { upsert: upserts } } : {}),
    },
    include: { translations: true },
  });
  await db.auditLog.create({ data: { userId: auth.id, action: "page.update", entity: "Page", entityId: id } });
  revalidatePath(existing.path);
  return NextResponse.json({ ok: true, page });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await requirePermissionApi("content");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const page = await db.page.findUnique({ where: { id }, select: { path: true } });
  if (!page) return NextResponse.json({ error: "not found" }, { status: 404 });
  await db.page.delete({ where: { id } });
  await db.auditLog.create({ data: { userId: auth.id, action: "page.delete", entity: "Page", entityId: id } });
  revalidatePath(page.path);
  return NextResponse.json({ ok: true });
}
