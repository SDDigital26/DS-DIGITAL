import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/permissions";

/**
 * POST /api/admin/leads/[id]/comments — комментарий к заявке.
 * Текст видят только авторизованные сотрудники (ТЗ §17).
 * В аудит текст не пишется — только факт добавления.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requirePermissionApi("leads");
  if (auth instanceof NextResponse) return auth;
  const user = auth;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const text = typeof (body as { text?: unknown })?.text === "string"
    ? (body as { text: string }).text.trim()
    : "";

  if (text.length < 1 || text.length > 2000) {
    return NextResponse.json({ error: "text must be 1-2000 characters" }, { status: 400 });
  }

  const lead = await db.lead.findUnique({ where: { id }, select: { id: true } });
  if (!lead) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const [comment] = await db.$transaction([
    db.leadComment.create({
      data: { leadId: id, authorId: user.id, text },
      select: { id: true, text: true, createdAt: true },
    }),
    db.auditLog.create({
      data: {
        userId: user.id,
        action: "lead.comment.add",
        entity: "Lead",
        entityId: id,
      },
    }),
  ]);

  return NextResponse.json({ ok: true, comment }, { status: 201 });
}
