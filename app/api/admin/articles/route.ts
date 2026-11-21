import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/permissions";

/** GET/POST /api/admin/articles — список и создание SEO-статей (право content). */

const createSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "недопустимый slug"),
  status: z.enum(["draft", "published"]).default("draft"),
  publishedAt: z.string().datetime().nullable().default(null),
  sort: z.number().int().default(0),
});

export async function GET() {
  const auth = await requirePermissionApi("content");
  if (auth instanceof NextResponse) return auth;
  const articles = await db.article.findMany({
    orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
    include: { translations: true },
  });
  return NextResponse.json({ ok: true, articles });
}

export async function POST(request: NextRequest) {
  const auth = await requirePermissionApi("content");
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "validation failed",
        issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
      },
      { status: 400 },
    );
  }
  const exists = await db.article.findUnique({ where: { slug: parsed.data.slug }, select: { id: true } });
  if (exists) return NextResponse.json({ error: "slug already exists" }, { status: 409 });

  const article = await db.article.create({
    data: {
      slug: parsed.data.slug,
      status: parsed.data.status,
      publishedAt: parsed.data.publishedAt ? new Date(parsed.data.publishedAt) : null,
      sort: parsed.data.sort,
      translations: {
        create: [
          { locale: "ru", title: "", excerpt: "", body: "", seoTitle: "", seoDesc: "", faq: [] },
          { locale: "en", title: "", excerpt: "", body: "", seoTitle: "", seoDesc: "", faq: [] },
        ],
      },
    },
    include: { translations: true },
  });
  await db.auditLog.create({
    data: { userId: auth.id, action: "article.create", entity: "Article", entityId: article.id },
  });
  return NextResponse.json({ ok: true, article }, { status: 201 });
}
