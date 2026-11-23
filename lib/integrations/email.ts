import { getEmailConfig } from "@/lib/integrations/email-config";

/**
 * Адаптер email-уведомлений о заявках (Док.2 §14.3).
 *
 * Правила:
 * - ключи/endpoint ТОЛЬКО на сервере (никогда NEXT_PUBLIC_*) — ТЗ §21.5;
 * - если провайдер не сконфигурирован — уведомление помечается failed,
 *   но ЗАЯВКА УЖЕ СОХРАНЕНА (приоритет — не терять лид).
 */

export type EmailPayload = {
  to: string;
  subject: string;
  text: string;
};

export type SendResult = {
  ok: boolean;
  /** Обезличенная причина — без PII (ТЗ §21.14). */
  error?: string;
};

export async function isEmailConfigured(): Promise<boolean> {
  const config = await getEmailConfig();
  return Boolean(
    config.endpoint || (process.env.SMTP_HOST && process.env.LEADS_NOTIFY_EMAIL),
  );
}

/**
 * Отправка письма о новой заявке.
 * Если провайдер не настроен — возвращаем ошибку конфигурации,
 * ретраи останавливаются, заявка остаётся в CRM.
 */
export async function sendEmail(payload: EmailPayload): Promise<SendResult> {
  const config = await getEmailConfig();
  const endpoint = config.endpoint || process.env.EMAIL_API_ENDPOINT;
  if (!endpoint) {
    return { ok: false, error: "email provider not configured" };
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: payload.to,
        from: config.from || process.env.LEADS_NOTIFY_EMAIL || undefined,
        subject: payload.subject,
        text: payload.text,
        apiKey: config.apiKey || process.env.EMAIL_API_KEY || undefined,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      // Статус без тела — в лог не пишем возможные PII из ответа.
      return { ok: false, error: `email endpoint status ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: describe(err) };
  }
}

function describe(err: unknown): string {
  if (err instanceof Error) {
    // Только имя/тип ошибки — без сообщения, которое может содержать адреса.
    return `email send error: ${err.name}`;
  }
  return "email send error: unknown";
}
