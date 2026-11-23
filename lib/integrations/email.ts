import nodemailer from "nodemailer";
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
    (config.smtpHost && config.smtpUser && config.smtpPassword) ||
      config.endpoint ||
      (process.env.SMTP_HOST && process.env.LEADS_NOTIFY_EMAIL),
  );
}

/**
 * Отправка письма о новой заявке.
 * Если провайдер не настроен — возвращаем ошибку конфигурации,
 * ретраи останавливаются, заявка остаётся в CRM.
 */
export async function sendEmail(payload: EmailPayload): Promise<SendResult> {
  const config = await getEmailConfig();

  // 1) Прямая SMTP-отправка (Gmail App Password и др.) — без внешнего сервиса.
  if (config.smtpHost && config.smtpUser && config.smtpPassword) {
    try {
      const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort || 587,
        secure: Boolean(config.smtpSecure),
        auth: { user: config.smtpUser, pass: config.smtpPassword },
        connectionTimeout: 10_000,
        socketTimeout: 10_000,
      });
      await transporter.sendMail({
        from: config.from || config.smtpUser,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: describe(err) };
    }
  }

  // 2) Универсальный webhook/SMTP-мост.
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
