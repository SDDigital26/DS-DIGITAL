import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/permissions";

/** GET/PUT /api/admin/seo — SEO-переопределения по страницам (право seo). */
const schema = z.object({
  locale: z.enum(["ru", "en"]),
  path: z.string().trim().min(1).max(200).regex(/^\//),
  title: z.string().trim().max(200),
  desc: z.string().trim().max(500).default(""),
  ogImage: z.string().trim().max(300).default(""),
  noindex: z.boolean().default(false),
});

export async function GET() {
  const auth = await requirePermissionApi("seo");
  if (auth instanceof NextResponse) return auth;
  const rows = await db.seoSetting.findMany({ orderBy: [{ locale: "asc" }, { path: "asc" }] });
  return NextResponse.json({ ok: true, rows });
}

export async function PUT(request: NextRequest) {
  const auth = await requirePermissionApi("seo");
  if (auth instanceof NextResponse) return auth;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation failed", issues: parsed.error.issues }, { status: 400 });
  const { locale, path, ...data } = parsed.data;
  const row = await db.seoSetting.upsert({
    where: { locale_path: { locale, path } },
    create: { locale, path, ...data },
    update: data,
  });
  await db.auditLog.create({ data: { userId: auth.id, action: "seo.update", entity: "SeoSetting", entityId: row.id } });
  revalidatePath(path);
  return NextResponse.json({ ok: true, row });
}

export async function DELETE(request: NextRequest) {
  const auth = await requirePermissionApi("seo");
  if (auth instanceof NextResponse) return auth;
  const locale = request.nextUrl.searchParams.get("locale");
  const path = request.nextUrl.searchParams.get("path");
  if (!locale || !path) return NextResponse.json({ error: "locale and path required" }, { status: 400 });
  await db.seoSetting.delete({ where: { locale_path: { locale, path } } }).catch(() => undefined);
  return NextResponse.json({ ok: true });
}
