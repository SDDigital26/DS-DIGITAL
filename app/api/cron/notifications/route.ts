import { NextRequest, NextResponse } from "next/server";
import { processDueNotifications } from "@/lib/notifications";
import { db } from "@/lib/db";

/**
 * POST /api/cron/notifications — обработка очереди уведомлений.
 * Защищена общим секретом (CRON_SECRET); без него — 401.
 * Роль/tenant не применимы: служебный роут, не публичный.
 */

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    request.headers.get("x-cron-secret");

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const expiredAiSessions = await db.aiConversation.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });
    const result = await processDueNotifications();
    return NextResponse.json({ ok: true, expiredAiSessions: expiredAiSessions.count, ...result });
  } catch {
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}
