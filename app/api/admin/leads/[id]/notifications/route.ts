import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/permissions";
import { isEmailConfigured } from "@/lib/integrations/email";
import { isTelegramConfigured } from "@/lib/integrations/telegram";

/**
 * POST /api/admin/leads/[id]/notifications — ручной ретрай уведомлений.
 *
 * Сброс всех failed/pending на pending с nextRetryAt = сейчас.
 * Если ни один провайдер не настроен — 409, чтобы сотрудник видел причину,
 * а не молча «retry», который снова упадёт.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requirePermissionApi("leads");
  if (auth instanceof NextResponse) return auth;
  const user = auth;

  const { id } = await params;

  const lead = await db.lead.findUnique({ where: { id }, select: { id: true } });
  if (!lead) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (!(await isEmailConfigured()) && !isTelegramConfigured()) {
    return NextResponse.json(
      { error: "notification provider not configured" },
      { status: 409 },
    );
  }

  const notifications = await db.notificationLog.findMany({
    where: { leadId: id, status: { in: ["failed", "pending"] } },
    select: { id: true, channel: true },
  });

  if (notifications.length === 0) {
    return NextResponse.json({ ok: true, reset: 0 });
  }

  await db.$transaction([
    ...notifications.map((n) =>
      db.notificationLog.update({
        where: { id: n.id },
        data: { status: "pending", nextRetryAt: new Date(), lastError: null },
      }),
    ),
    db.auditLog.create({
      data: {
        userId: user.id,
        action: "lead.notification.retry",
        entity: "Lead",
        entityId: id,
        // только каналы, без содержимого уведомлений
        diff: { channels: notifications.map((n) => n.channel) },
      },
    }),
  ]);

  return NextResponse.json({ ok: true, reset: notifications.length });
}
