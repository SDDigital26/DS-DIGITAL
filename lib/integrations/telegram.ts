/**
 * Адаптер Telegram-уведомлений о заявках (Док.2 §14.3).
 *
 * - токен и чат задаются в админке (`Setting.telegram`) или через env;
 * - без токена — деградация (failed + причина), заявка уже сохранена;
 * - токен в сообщение/логи не попадает.
 */

import { getTelegramConfig } from "@/lib/integrations/telegram-config";

export type TelegramPayload = {
  text: string;
  /** Переопределить чат (например, другой канал). */
  chatId?: string;
};

export type SendResult = {
  ok: boolean;
  error?: string;
};

/** Синхронная проверка для шедулера (.env); точная проверка — isTelegramReady(). */
export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

export async function isTelegramAvailable(): Promise<boolean> {
  const config = await getTelegramConfig();
  return config.enabled && Boolean(config.botToken && config.chatId);
}

export async function sendTelegram(payload: TelegramPayload): Promise<SendResult> {
  const config = await getTelegramConfig();
  return sendTelegramRaw(config.botToken, payload.chatId || config.chatId, payload.text);
}

/** Прямая отправка с явно заданными секретами (для теста до сохранения в БД). */
export async function sendTelegramRaw(
  token: string,
  chatId: string,
  text: string,
): Promise<SendResult> {
  if (!token || !chatId) {
    return { ok: false, error: "telegram not configured" };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      return { ok: false, error: `telegram status ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    if (err instanceof Error) {
      return { ok: false, error: `telegram error: ${err.name}` };
    }
    return { ok: false, error: "telegram error: unknown" };
  }
}
