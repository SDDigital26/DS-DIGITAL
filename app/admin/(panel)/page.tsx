import Link from "next/link";
import { requirePagePermission } from "@/lib/permissions";
import { db } from "@/lib/db";

// Динамический раздел: данные из cookies/БД (Next 16 cacheComponents)
export const instant = false;

export const metadata = { title: "Дашборд" };

const STATUS_LABELS: Record<string, string> = {
  New: "Новые",
  "In Progress": "В работе",
  Qualified: "Квалифицированы",
  Won: "Выиграно",
  Lost: "Проиграно",
};

const STATUS_ORDER = ["New", "In Progress", "Qualified", "Won", "Lost"] as const;

export default async function DashboardPage() {
  await requirePagePermission("dashboard");

  const [byStatus, total, recent, failedNotifications] = await Promise.all([
    db.lead.groupBy({ by: ["status"], _count: { _all: true } }),
    db.lead.count(),
    db.lead.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        service: true,
        status: true,
        createdAt: true,
      },
    }),
    db.notificationLog.count({ where: { status: "failed" } }),
  ]);

  const counts = new Map(byStatus.map((row) => [row.status, row._count._all]));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Дашборд</h1>
          <p className="mt-1 text-sm text-secondary">Сводка по заявкам DS DIGITAL</p>
        </div>
        <Link
          href="/admin/leads"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/85"
        >
          Все заявки
        </Link>
      </header>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-secondary">
          Заявки по статусам
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-2xl border border-white/10 bg-surface p-4">
            <p className="text-2xl font-bold">{total}</p>
            <p className="mt-1 text-xs text-secondary">Всего</p>
          </div>
          {STATUS_ORDER.map((status) => (
            <div key={status} className="rounded-2xl border border-white/10 bg-surface p-4">
              <p className="text-2xl font-bold">{counts.get(status) ?? 0}</p>
              <p className="mt-1 text-xs text-secondary">{STATUS_LABELS[status]}</p>
            </div>
          ))}
        </div>
      </section>

      {failedNotifications > 0 ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          <p className="font-semibold">Уведомлений не доставлено: {failedNotifications}</p>
          <p className="mt-1 text-amber-100/80">
            Каналы не настроены или недоступны. Заявки сохранены — настройте провайдера
            (email/Telegram) в переменных окружения.
          </p>
        </div>
      ) : null}

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-secondary">
          Последние заявки
        </h2>
        {recent.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-white/10 bg-surface/50 p-6 text-center text-sm text-secondary">
            Заявок пока нет (или они очищены).
          </p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
            {/* overflow-x-auto — таблица скроллится внутри, страница не получает горизонтальный скролл */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-surface text-left text-xs text-secondary">
                  <tr>
                    <th className="px-4 py-3">Дата</th>
                    <th className="px-4 py-3">Контакт</th>
                    <th className="px-4 py-3">Услуга</th>
                    <th className="px-4 py-3">Статус</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((lead) => (
                    <tr key={lead.id} className="border-t border-white/5">
                      <td className="whitespace-nowrap px-4 py-3 text-secondary">
                        {lead.createdAt.toLocaleString("ru-RU")}
                      </td>
                      <td className="px-4 py-3">{lead.name ?? lead.email ?? "—"}</td>
                      <td className="px-4 py-3 text-secondary">{lead.service ?? "—"}</td>
                      <td className="px-4 py-3">{STATUS_LABELS[lead.status] ?? lead.status}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/leads/${lead.id}`} className="text-sm text-link hover:text-cyan">
                          Открыть
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
