import { db } from "@/lib/db";
import { isEmailConfigured, sendEmail } from "@/lib/integrations/email";
import { isTelegramAvailable, sendTelegram } from "@/lib/integrations/telegram";
import { getTelegramConfig } from "@/lib/integrations/telegram-config";

/**
 * Очередь уведомлений о заявках на таблице NotificationLog (Док.2 §14.3).
 *
 * Принцип: заявка сохраняется ТРАНЗАКЦИОННО ДО постановки уведомлений.
 * Уведомления — best effort: сбой почты/Telegram не должен терять лид.
 * После постановки в очередь сразу пробуем доставить (flushLeadNotifications),
 * а cron добирает недоставленное с exponential backoff.
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
  const [telegramReady, telegramConfig, emailReady] = await Promise.all([
    isTelegramAvailable(),
    getTelegramConfig(),
    isEmailConfigured(),
  ]);

  // Фиксируем ВСЕ каналы: настроенный — pending (будет отправлен),
  // ненастроенный/выключенный — failed с причиной (в CRM видно, что команда
  // не получила уведомление). Заявка при этом уже сохранена.
  await db.notificationLog.createMany({
    data: channels.map((channel) => {
      const configured =
        channel === "email" ? emailReady : telegramReady && telegramConfig.notifyOnLead;
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
 * Сразу доставить уведомления по конкретной заявке, не дожидаясь cron.
 * Нужно, чтобы менеджер получал лид в Telegram/на почту в ту же секунду.
 * Ошибки не пробрасываются: заявка уже сохранена, остаток доберёт cron.
 */
export async function flushLeadNotifications(
  leadId: string,
): Promise<{ sent: number; failed: number }> {
  const pending = await db.notificationLog
    .findMany({ where: { leadId, status: "pending" }, include: { lead: true } })
    .catch(() => []);
  return deliverBatch(pending);
}

/** Обработать один due-батч уведомлений (вызывается из /api/cron/notifications). */
export async function processDueNotifications(
  limit = 20,
): Promise<{ sent: number; failed: number }> {
  const due = await db.notificationLog.findMany({
    where: {
      status: "pending",
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: new Date() } }],
    },
    take: limit,
    orderBy: { createdAt: "asc" },
    include: { lead: true },
  });
  return deliverBatch(due);
}

type PendingNotification = {
  id: string;
  channel: string;
  attempts: number;
  lead: {
    name: string | null;
    description: string;
    service: string | null;
    budget: string | null;
    language: string;
    source: string;
    email: string | null;
    whatsapp: string | null;
    telegram: string | null;
  };
};

async function deliverBatch(items: PendingNotification[]): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const item of items) {
    const result = await deliver(item.channel, item.lead);

    if (result.ok) {
      await db.notificationLog.update({
        where: { id: item.id },
        data: {
          status: "sent",
          attempts: { increment: 1 },
          sentAt: new Date(),
          lastError: null,
          nextRetryAt: null,
        },
      });
      sent += 1;
      continue;
    }

    const attempts = item.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      await db.notificationLog.update({
        where: { id: item.id },
        data: {
          status: "failed",
          attempts,
          lastError: result.error ?? "unknown",
          nextRetryAt: null,
        },
      });
      failed += 1;
    } else {
      const delay = BASE_DELAY_MS * 2 ** (attempts - 1);
      await db.notificationLog.update({
        where: { id: item.id },
        data: {
          attempts,
          lastError: result.error ?? "unknown",
          nextRetryAt: new Date(Date.now() + delay),
        },
      });
    }
  }

  return { sent, failed };
}

async function deliver(
  channel: string,
  lead: PendingNotification["lead"],
): Promise<{ ok: boolean; error?: string }> {
  const contacts = [
    lead.telegram ? `Telegram: @${lead.telegram.replace(/^@/, "")}` : null,
    lead.whatsapp ? `WhatsApp: ${lead.whatsapp}` : null,
    lead.email ? `Email: ${lead.email}` : null,
  ].filter(Boolean);

  // Внутреннее уведомление команде: контакты нужны, чтобы ответить клиенту.
  // В логи/аналитику эти данные не пишем (ТЗ §21.14).
  const summary = [
    "🔔 Новая заявка DS DIGITAL",
    lead.name ? `Имя: ${lead.name}` : null,
    lead.service ? `Услуга: ${lead.service}` : null,
    lead.budget ? `Бюджет: ${lead.budget}` : null,
    contacts.length ? `Связь: ${contacts.join(" · ")}` : null,
    `Язык: ${lead.language}`,
    `Источник: ${lead.source}`,
    "",
    lead.description.slice(0, 1200),
  ]
    .filter((line) => line !== null)
    .join("\n");

  if (channel === "email") {
    const to = process.env.LEADS_NOTIFY_EMAIL || lead.email;
    if (!to) return { ok: false, error: "lead has no email and LEADS_NOTIFY_EMAIL is empty" };
    return sendEmail({
      to,
      subject: `DS DIGITAL — новая заявка${lead.name ? `: ${lead.name}` : ""}`,
      text: summary,
    });
  }

  if (channel === "telegram") {
    return sendTelegram({ text: summary });
  }

  return { ok: false, error: "unknown channel" };
}
