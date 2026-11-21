import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermissionApi } from "@/lib/permissions";
import { getTelegramConfig } from "@/lib/integrations/telegram-config";
import { sendTelegramRaw } from "@/lib/integrations/telegram";

/** POST /api/admin/telegram/test — отправить тестовое сообщение в бот/канал. */

const schema = z.object({
  botToken: z.string().trim().max(200).default(""),
  chatId: z.string().trim().max(100).default(""),
});

export async function POST(request: NextRequest) {
  const auth = await requirePermissionApi("settings");
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation failed" }, { status: 400 });

  const current = await getTelegramConfig();
  const token = parsed.data.botToken || current.botToken;
  const chatId = parsed.data.chatId || current.chatId;

  if (!token || !chatId) {
    return NextResponse.json(
      { ok: false, error: "Укажите токен бота и chat_id" },
      { status: 400 },
    );
  }

  const result = await sendTelegramRaw(
    token,
    chatId,
    "DS DIGITAL — тест подключения Telegram-бота ✅\nТестовое уведомление, заявка не создавалась.",
  );
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  }
  return NextResponse.json({ ok: true, sample: "Тестовое сообщение отправлено" });
}
