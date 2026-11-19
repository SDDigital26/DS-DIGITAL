import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/permissions";
import { isLeadStatus } from "@/lib/leads";

/**
 * PATCH /api/admin/leads/[id] — смена статуса заявки.
 * Пишет историю (LeadStatusHistory) и лог аудита (без PII).
 */
export async function PATCH(
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

  const status = (body as { status?: unknown })?.status;
  if (!isLeadStatus(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  const current = await db.lead.findUnique({ where: { id }, select: { status: true } });
  if (!current) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (current.status === status) {
    return NextResponse.json({ ok: true, id, status, unchanged: true });
  }

  const [updated] = await db.$transaction([
    db.lead.update({ where: { id }, data: { status } }),
    db.leadStatusHistory.create({
      data: { leadId: id, from: current.status, to: status, userId: user.id },
    }),
    db.auditLog.create({
      data: {
        userId: user.id,
        action: "lead.status",
        entity: "Lead",
        entityId: id,
        // в лог не пишем содержимое заявки — только переход статуса
        diff: { from: current.status, to: status },
      },
    }),
  ]);

  return NextResponse.json({ ok: true, id: updated.id, status: updated.status });
}
