import { NextRequest, NextResponse } from "next/server";
import { processDueNotifications } from "@/lib/notifications";
import { db } from "@/lib/db";

/**
 * /api/cron/notifications — добирает недоставленные уведомления.
 * Защита: Bearer-секрет (CRON_SECRET); без него — 401.
 * Vercel Cron вызывает GET с заголовком Authorization: Bearer <CRON_SECRET>,
 * ручной вызов из админки/скриптов может использовать POST или x-cron-secret.
 */

async function handle(request: NextRequest) {
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

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
