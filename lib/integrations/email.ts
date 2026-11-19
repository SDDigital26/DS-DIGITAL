/**
 * Адаптер email-уведомлений о заявках (Док.2 §14.3).
 *
 * Правила:
 * - ключи/SMTP-данные ТОЛЬКО на сервере (никогда NEXT_PUBLIC_*) — ТЗ §21.5;
 * - если провайдер не сконфигурирован — деградация: уведомление помечается
 *   failed с причиной, но ЗАЯВКА УЖЕ СОХРАНЕНА (приоритет — не терять лид);
 * - без платных SDK: используется SMTP-совместимый вызов через fetch-эндпоинт
 *   или просто отчёт о неготовности. Реальный SMTP-провайдер — пункт на
 *   согласовании [С] (Док.1 §7), поэтому хардкодить его нельзя.
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

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.LEADS_NOTIFY_EMAIL);
}

/**
 * Отправка письма о новой заявке.
 * Сейчас: если SMTP не настроен — возвращаем ошибку конфигурации,
 * ретраи останавливаются, заявка остаётся в CRM.
 */
export async function sendEmail(payload: EmailPayload): Promise<SendResult> {
  if (!isEmailConfigured()) {
    return { ok: false, error: "email provider not configured" };
  }

  try {
    // Интеграция с выбранным провайдером [С] добавляется здесь.
    // Формат — универсальный webhook/SMTP-мост; до согласования провайдера
    // явно сообщаем о неготовности, не имитируя отправку.
    const endpoint = process.env.EMAIL_API_ENDPOINT;
    if (!endpoint) {
      return { ok: false, error: "email endpoint missing" };
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        apiKey: process.env.EMAIL_API_KEY,
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
