import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/permissions";

/** GET/POST /api/admin/pages — страницы контента с переводами (право content). */
const translation = z.object({
  title: z.string().trim().max(300).default(""),
  content: z.string().max(100_000).default(""),
  seoTitle: z.string().trim().max(200).default(""),
  seoDesc: z.string().trim().max(500).default(""),
});
const createSchema = z.object({
  path: z.string().trim().min(1).max(200).regex(/^\//),
  type: z.string().trim().min(1).max(50).default("home_custom"),
  published: z.boolean().default(false),
  ru: translation.default({ title: "", content: "", seoTitle: "", seoDesc: "" }),
  en: translation.default({ title: "", content: "", seoTitle: "", seoDesc: "" }),
});

export async function GET() {
  const auth = await requirePermissionApi("content");
  if (auth instanceof NextResponse) return auth;
  const pages = await db.page.findMany({ orderBy: { path: "asc" }, include: { translations: true } });
  return NextResponse.json({ ok: true, pages });
}

export async function POST(request: NextRequest) {
  const auth = await requirePermissionApi("content");
  if (auth instanceof NextResponse) return auth;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation failed" }, { status: 400 });
  const exists = await db.page.findUnique({ where: { path: parsed.data.path }, select: { id: true } });
  if (exists) return NextResponse.json({ error: "path already exists" }, { status: 409 });
  const { path, type, published, ru, en } = parsed.data;
  const page = await db.page.create({
    data: {
      path, type, published,
      translations: {
        create: [
          { locale: "ru", ...ru, content: ru.content as never },
          { locale: "en", ...en, content: en.content as never },
        ],
      },
    },
    include: { translations: true },
  });
  await db.auditLog.create({ data: { userId: auth.id, action: "page.create", entity: "Page", entityId: page.id } });
  revalidatePath(path);
  return NextResponse.json({ ok: true, page }, { status: 201 });
}
