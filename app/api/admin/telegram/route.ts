import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/permissions";
import {
  getTelegramConfig,
  publicTelegramConfig,
  saveTelegramConfig,
} from "@/lib/integrations/telegram-config";

/**
 * /api/admin/telegram — подключение Telegram-бота для заявок из кабинета.
 * Токен хранится только на сервере, в ответах — маска.
 * Право: settings (OWNER/ADMIN).
 */

const schema = z.object({
  botToken: z.string().trim().max(200).default(""),
  chatId: z.string().trim().max(100).default(""),
  notifyOnLead: z.boolean().default(true),
  enabled: z.boolean().default(false),
  clearToken: z.boolean().default(false),
});

export async function GET() {
  const auth = await requirePermissionApi("settings");
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({
    ok: true,
    config: publicTelegramConfig(await getTelegramConfig()),
  });
}

export async function PUT(request: NextRequest) {
  const auth = await requirePermissionApi("settings");
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation failed" }, { status: 400 });
  }

  const input = parsed.data;
  const current = await getTelegramConfig();
  const saved = {
    botToken: input.clearToken ? "" : input.botToken || current.botToken,
    chatId: input.chatId,
    notifyOnLead: input.notifyOnLead,
    enabled: input.enabled,
  };
  await saveTelegramConfig(saved);
  await db.auditLog.create({
    data: {
      userId: auth.id,
      action: "site.telegram.update",
      entity: "Setting",
      entityId: "telegram",
    },
  });

  return NextResponse.json({ ok: true, config: publicTelegramConfig(saved) });
}
