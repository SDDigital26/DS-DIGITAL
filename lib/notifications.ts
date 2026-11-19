import { db } from "@/lib/db";
import { isEmailConfigured, sendEmail } from "@/lib/integrations/email";
import { isTelegramConfigured, sendTelegram } from "@/lib/integrations/telegram";

/**
 * Очередь уведомлений о заявках на таблице NotificationLog (Док.2 §14.3).
 *
 * Принцип: заявка сохраняется ТРАНЗАКЦИОННО ДО постановки уведомлений.
 * Уведомления — best effort: сбой почты/Telegram не должен терять лид.
 * Retry: exponential backoff, максимум MAX_ATTEMPTS, дальше failed.
 */

const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 60_000; // 1 минута, дальше 2, 4, 8, 16 минут

export type LeadNotificationData = {
  leadId: string;
  language: string;
  name?: string;
  description: string;
  service?: string;
};

/** Поставить уведомления в очередь (вызывается после успешного создания лида). */
export async function enqueueLeadNotifications(data: LeadNotificationData): Promise<void> {
  const channels = ["email", "telegram"] as const;

  // Фиксируем ВСЕ каналы: настроенный — pending (будет отправлен),
  // ненастроенный — failed с причиной (чтобы в CRM было видно, что команда
  // не получила уведомление). Заявка при этом уже сохранена.
  await db.notificationLog.createMany({
    data: channels.map((channel) => {
      const configured = channel === "email" ? isEmailConfigured() : isTelegramConfigured();
      return {
        leadId: data.leadId,
        channel,
        status: configured ? ("pending" as const) : ("failed" as const),
        attempts: 0,
        lastError: configured ? null : "notification provider not configured",
        nextRetryAt: configured ? new Date() : null,
      };
    }),
  });
}

/**
 * Обработать один due-батч уведомлений.
 * Вызывается из cron-ish эндпоинта /api/cron/notifications (защищён секретом).
 */
export async function processDueNotifications(limit = 20): Promise<{ sent: number; failed: number }> {
  const due = await db.notificationLog.findMany({
    where: {
      status: "pending",
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: new Date() } }],
    },
    take: limit,
    orderBy: { createdAt: "asc" },
    include: { lead: true },
  });

  let sent = 0;
  let failed = 0;

  for (const item of due) {
    const result = await deliver(item.channel, item.leadId, item.lead);

    if (result.ok) {
      await db.notificationLog.update({
        where: { id: item.id },
        data: { status: "sent", attempts: { increment: 1 }, sentAt: new Date(), lastError: null, nextRetryAt: null },
      });
      sent += 1;
      continue;
    }

    const attempts = item.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      await db.notificationLog.update({
        where: { id: item.id },
        data: { status: "failed", attempts, lastError: result.error ?? "unknown", nextRetryAt: null },
      });
      failed += 1;
    } else {
      const delay = BASE_DELAY_MS * 2 ** (attempts - 1);
      await db.notificationLog.update({
        where: { id: item.id },
        data: { attempts, lastError: result.error ?? "unknown", nextRetryAt: new Date(Date.now() + delay) },
      });
    }
  }

  return { sent, failed };
}

async function deliver(
  channel: string,
  _leadId: string,
  lead: {
    name: string | null;
    description: string;
    service: string | null;
    language: string;
    email: string | null;
  },
): Promise<{ ok: boolean; error?: string }> {
  // Сообщение без лишних PII: имя/контакт нужен только для email-ответа,
  // в Telegram уведомлении идём по номеру заявки (ТЗ §21.14).
  const summary = [
    `New lead #${_leadId.slice(-6)}`,
    lead.name ? `Name: ${lead.name}` : null,
    lead.service ? `Service: ${lead.service}` : null,
    `Language: ${lead.language}`,
    `Description: ${lead.description.slice(0, 500)}`,
  ]
    .filter(Boolean)
    .join("\n");

  if (channel === "email") {
    if (!lead.email) return { ok: false, error: "lead has no email" };
    return sendEmail({
      to: process.env.LEADS_NOTIFY_EMAIL || lead.email,
      subject: "DS DIGITAL — new lead",
      text: summary,
    });
  }

  if (channel === "telegram") {
    return sendTelegram({ text: summary });
  }

  return { ok: false, error: "unknown channel" };
}
