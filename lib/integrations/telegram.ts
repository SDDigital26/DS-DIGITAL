/**
 * Адаптер Telegram-уведомлений о заявках (Док.2 §14.3).
 *
 * Правила:
 * - TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID — только серверные переменные (ТЗ §21.5);
 * - без токена — деградация (failed + причина), заявка уже сохранена;
 * - токен в сообщение/логи не попадает.
 */

export type TelegramPayload = {
  text: string;
};

export type SendResult = {
  ok: boolean;
  error?: string;
};

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

export async function sendTelegram(payload: TelegramPayload): Promise<SendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return { ok: false, error: "telegram not configured" };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: payload.text,
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
