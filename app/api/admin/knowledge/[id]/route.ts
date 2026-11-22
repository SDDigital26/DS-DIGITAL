import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/permissions";

const itemSchema = z.object({
  locale: z.enum(["ru", "en"]),
  title: z.string().trim().min(1).max(160),
  content: z.string().trim().min(1).max(4000),
  category: z.string().trim().max(80).optional().nullable(),
  published: z.boolean().default(true),
  sort: z.number().int().min(0).max(10000).default(0),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
  const auth = await requirePermissionApi("settings");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const item = await db.aiKnowledgeItem.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  return NextResponse.json({ ok: true, item });
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const auth = await requirePermissionApi("settings");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

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

  const existing = await db.aiKnowledgeItem.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Не найдено" }, { status: 404 });

  const item = await db.aiKnowledgeItem.update({ where: { id }, data: parsed.data });
  await db.auditLog.create({
    data: {
      userId: auth.id,
      action: "site.knowledge.update",
      entity: "AiKnowledgeItem",
      entityId: id,
    },
  });
  return NextResponse.json({ ok: true, item });
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const auth = await requirePermissionApi("settings");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  await db.aiKnowledgeItem.delete({ where: { id } });
  await db.auditLog.create({
    data: {
      userId: auth.id,
      action: "site.knowledge.delete",
      entity: "AiKnowledgeItem",
      entityId: id,
    },
  });
  return NextResponse.json({ ok: true });
}
