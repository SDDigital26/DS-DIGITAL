import { NextRequest, NextResponse } from "next/server";
import { processDueNotifications } from "@/lib/notifications";

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
    const result = await processDueNotifications();
    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}
