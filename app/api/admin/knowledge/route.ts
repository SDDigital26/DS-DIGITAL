import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/permissions";
import { parsePage, buildKnowledgeWhere, parseKnowledgeFilters, KNOWLEDGE_PER_PAGE } from "@/lib/ai/knowledge";

/**
 * /api/admin/knowledge — база знаний внутреннего AI-агента.
 * Право `settings` (OWNER/ADMIN). Содержимое — только согласованные факты (ТЗ §4).
 */
const itemSchema = z.object({
  locale: z.enum(["ru", "en"]),
  title: z.string().trim().min(1).max(160),
  content: z.string().trim().min(1).max(4000),
  category: z.string().trim().max(80).optional().nullable(),
  published: z.boolean().default(true),
  sort: z.number().int().min(0).max(10000).default(0),
});

export async function GET(request: NextRequest) {
  const auth = await requirePermissionApi("settings");
  if (auth instanceof NextResponse) return auth;

  const filters = parseKnowledgeFilters(new URL(request.url).searchParams);
  const where = buildKnowledgeWhere(filters, false);
  const page = parsePage(filters.page);

  const [total, items] = await Promise.all([
    db.aiKnowledgeItem.count({ where }),
    db.aiKnowledgeItem.findMany({
      where,
      orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * KNOWLEDGE_PER_PAGE,
      take: KNOWLEDGE_PER_PAGE,
    }),
  ]);

  return NextResponse.json({
    ok: true,
    items,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / KNOWLEDGE_PER_PAGE)),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requirePermissionApi("settings");
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }
  const parsed = itemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Проверьте поля", issues: parsed.error.flatten() }, { status: 400 });
  }

  const item = await db.aiKnowledgeItem.create({ data: parsed.data });
  await db.auditLog.create({
    data: {
      userId: auth.id,
      action: "site.knowledge.create",
      entity: "AiKnowledgeItem",
      entityId: item.id,
    },
  });
  return NextResponse.json({ ok: true, item }, { status: 201 });
}
