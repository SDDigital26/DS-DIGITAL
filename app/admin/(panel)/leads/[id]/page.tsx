import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePagePermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { LEAD_STATUS_LABELS } from "@/lib/leads";
import { LeadStatusForm } from "@/components/admin/LeadStatusForm";
import { LeadCommentForm } from "@/components/admin/LeadCommentForm";
import { NotificationRetryButton } from "@/components/admin/NotificationRetryButton";

// Динамический раздел: данные из cookies/БД (Next 16 cacheComponents)
export const instant = false;

export const metadata = { title: "Карточка заявки" };

const SOURCE_LABELS: Record<string, string> = {
  form: "Форма",
  calculator: "Калькулятор",
  ai: "AI-консультант",
  contact: "Контакты",
};

const NOTIFICATION_STATUS: Record<string, string> = {
  pending: "в очереди",
  sent: "доставлено",
  failed: "не доставлено",
};

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs uppercase tracking-wide text-secondary">{label}</dt>
      <dd className="mt-0.5 break-words">{value && value.length > 0 ? value : "—"}</dd>
    </div>
  );
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePagePermission("leads");
  const { id } = await params;

  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      comments: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { email: true, name: true } } },
      },
      statusHistory: { orderBy: { at: "desc" } },
      notifications: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!lead) notFound();

  const calculatorJson = lead.calculatorSnap ? JSON.stringify(lead.calculatorSnap, null, 2) : null;
  const transcriptJson = lead.aiTranscript ? JSON.stringify(lead.aiTranscript, null, 2) : null;
  const hasActionableNotifications = lead.notifications.some((n) => n.status !== "sent");

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/leads" className="text-sm text-secondary hover:text-white">
            ← К списку заявок
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">Карточка заявки</h1>
          <p className="mt-1 text-xs text-secondary">ID: {lead.id}</p>
        </div>
        <time className="text-sm text-secondary">
          {lead.createdAt.toLocaleString("ru-RU")}
        </time>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Основные данные */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="rounded-2xl border border-white/10 bg-surface p-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-secondary">
              Контакты и параметры
            </h2>
            <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label="Имя" value={lead.name} />
              <Field label="Email" value={lead.email} />
              <Field label="WhatsApp" value={lead.whatsapp} />
              <Field label="Telegram" value={lead.telegram} />
              <Field label="Страна" value={lead.country} />
              <Field label="Язык" value={lead.language.toUpperCase()} />
              <Field label="Услуга" value={lead.service} />
              <Field label="Бюджет" value={lead.budget} />
              <Field label="Источник" value={SOURCE_LABELS[lead.source] ?? lead.source} />
              <Field label="Страница входа" value={lead.landingPath} />
              <Field label="utm_source" value={lead.utmSource} />
              <Field label="utm_medium" value={lead.utmMedium} />
              <Field label="utm_campaign" value={lead.utmCampaign} />
              <Field label="utm_content" value={lead.utmContent} />
              <Field label="utm_term" value={lead.utmTerm} />
              <Field label="gclid" value={lead.gclid} />
              <Field label="fbclid" value={lead.fbclid} />
            </dl>
          </section>

          <section className="rounded-2xl border border-white/10 bg-surface p-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-secondary">
              Описание задачи
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{lead.description}</p>
          </section>

          {calculatorJson ? (
            <section className="rounded-2xl border border-white/10 bg-surface p-5">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-secondary">
                Расчёт калькулятора
              </h2>
              <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-bg p-3 text-xs text-secondary">
                {calculatorJson}
              </pre>
            </section>
          ) : null}

          {transcriptJson ? (
            <section className="rounded-2xl border border-white/10 bg-surface p-5">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-secondary">
                Диалог с AI-консультантом
              </h2>
              <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-bg p-3 text-xs text-secondary">
                {transcriptJson}
              </pre>
            </section>
          ) : null}
        </div>

        {/* Действия и история */}
        <div className="flex flex-col gap-6">
          <section className="rounded-2xl border border-white/10 bg-surface p-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-secondary">
              Статус
            </h2>
            <div className="mt-3">
              <LeadStatusForm leadId={lead.id} current={lead.status} />
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-surface p-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-secondary">
              Уведомления
            </h2>
            {lead.notifications.length === 0 ? (
              <p className="mt-3 text-sm text-secondary">Нет попыток отправки.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2 text-sm">
                {lead.notifications.map((n) => (
                  <li
                    key={n.id}
                    className="flex flex-col rounded-lg border border-white/10 bg-bg p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium uppercase text-secondary">{n.channel}</span>
                      <span
                        className={
                          n.status === "sent"
                            ? "text-emerald-300"
                            : n.status === "pending"
                              ? "text-amber-200"
                              : "text-red-300"
                        }
                      >
                        {NOTIFICATION_STATUS[n.status] ?? n.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-secondary">
                      Попыток: {n.attempts}
                      {n.lastError ? ` · ${n.lastError}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {hasActionableNotifications ? (
              <div className="mt-3">
                <NotificationRetryButton leadId={lead.id} />
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-white/10 bg-surface p-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-secondary">
              Комментарии
            </h2>
            <div className="mt-3">
              <LeadCommentForm leadId={lead.id} />
            </div>
            {lead.comments.length > 0 ? (
              <ul className="mt-4 flex flex-col gap-2">
                {lead.comments.map((comment) => (
                  <li
                    key={comment.id}
                    className="rounded-lg border border-white/10 bg-bg p-3 text-sm"
                  >
                    <p className="whitespace-pre-wrap">{comment.text}</p>
                    <p className="mt-1 text-xs text-secondary">
                      {comment.author?.name ?? comment.author?.email ?? "—"} ·{" "}
                      {comment.createdAt.toLocaleString("ru-RU")}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-secondary">Комментариев пока нет.</p>
            )}
          </section>

          {lead.statusHistory.length > 0 ? (
            <section className="rounded-2xl border border-white/10 bg-surface p-5">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-secondary">
                История статусов
              </h2>
              <ul className="mt-3 flex flex-col gap-1 text-sm">
                {lead.statusHistory.map((h) => (
                  <li key={h.id} className="text-secondary">
                    {h.at.toLocaleString("ru-RU")}: {LEAD_STATUS_LABELS[h.from as keyof typeof LEAD_STATUS_LABELS] ?? h.from} →{" "}
                    {LEAD_STATUS_LABELS[h.to as keyof typeof LEAD_STATUS_LABELS] ?? h.to}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
