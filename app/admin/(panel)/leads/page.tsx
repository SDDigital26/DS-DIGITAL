import Link from "next/link";
import { requirePagePermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { SERVICES } from "@/lib/services";
import { LEADS_PER_PAGE, LEAD_SOURCES, buildLeadWhere, parseLeadFilters, parsePage, type LeadFilters } from "@/lib/lead-filters";
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/leads";

// Динамический раздел: данные из cookies/БД (Next 16 cacheComponents)
export const instant = false;

export const metadata = { title: "Заявки" };

const SOURCE_LABELS: Record<string, string> = {
  form: "Форма",
  calculator: "Калькулятор",
  ai: "AI-консультант",
  contact: "Контакты",
};

function qs(filters: LeadFilters, patch: Partial<Record<string, string | undefined>> = {}): string {
  const merged: Record<string, string | undefined> = {
    status: filters.status,
    service: filters.service,
    source: filters.source,
    q: filters.q,
    from: filters.from,
    to: filters.to,
    page: filters.page,
    ...patch,
  };
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value) sp.set(key, value);
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePagePermission("leads");

  const params = await searchParams;
  const filters = parseLeadFilters(params);
  const where = buildLeadWhere(filters);
  const page = parsePage(filters.page);
  const skip = (page - 1) * LEADS_PER_PAGE;

  const [total, leads] = await Promise.all([
    db.lead.count({ where }),
    db.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: LEADS_PER_PAGE,
      select: {
        id: true,
        name: true,
        email: true,
        service: true,
        source: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / LEADS_PER_PAGE));
  const currentQuery = qs({ ...filters, page: undefined });

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Заявки</h1>
          <p className="mt-1 text-sm text-secondary">Всего по фильтру: {total}</p>
        </div>
        <a
          href={`/api/admin/leads/export${currentQuery}`}
          className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white hover:border-cyan"
        >
          Экспорт CSV
        </a>
      </header>

      <form method="get" className="grid gap-3 rounded-2xl border border-white/10 bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="q" className="text-xs text-secondary">Поиск (имя / email / описание)</label>
          <input
            id="q"
            name="q"
            type="search"
            maxLength={100}
            defaultValue={filters.q ?? ""}
            className="rounded-lg border border-white/10 bg-bg px-3 py-2 text-base outline-none focus:border-accent"
            placeholder="Найти заявку…"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-xs text-secondary">Статус</label>
          <select
            id="status"
            name="status"
            defaultValue={filters.status ?? ""}
            className="rounded-lg border border-white/10 bg-bg px-3 py-2 text-base outline-none focus:border-accent"
          >
            <option value="">Все</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="service" className="text-xs text-secondary">Услуга</label>
          <select
            id="service"
            name="service"
            defaultValue={filters.service ?? ""}
            className="rounded-lg border border-white/10 bg-bg px-3 py-2 text-base outline-none focus:border-accent"
          >
            <option value="">Все</option>
            {SERVICES.map((service) => (
              <option key={service.slug} value={service.slug}>{service.title.ru}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="source" className="text-xs text-secondary">Источник</label>
          <select
            id="source"
            name="source"
            defaultValue={filters.source ?? ""}
            className="rounded-lg border border-white/10 bg-bg px-3 py-2 text-base outline-none focus:border-accent"
          >
            <option value="">Все</option>
            {LEAD_SOURCES.map((s) => (
              <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="from" className="text-xs text-secondary">С даты</label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={filters.from ?? ""}
            className="rounded-lg border border-white/10 bg-bg px-3 py-2 text-base outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="to" className="text-xs text-secondary">По дату</label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={filters.to ?? ""}
            className="rounded-lg border border-white/10 bg-bg px-3 py-2 text-base outline-none focus:border-accent"
          />
        </div>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/85"
          >
            Применить
          </button>
          <Link
            href="/admin/leads"
            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-secondary hover:text-white"
          >
            Сбросить
          </Link>
        </div>
      </form>

      {leads.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 bg-surface/50 p-8 text-center text-sm text-secondary">
          По этому фильтру заявок нет.
        </p>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-surface text-left text-xs text-secondary">
                  <tr>
                    <th className="px-4 py-3">Дата</th>
                    <th className="px-4 py-3">Контакт</th>
                    <th className="px-4 py-3">Услуга</th>
                    <th className="px-4 py-3">Источник</th>
                    <th className="px-4 py-3">Статус</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-t border-white/5">
                      <td className="whitespace-nowrap px-4 py-3 text-secondary">
                        {lead.createdAt.toLocaleString("ru-RU")}
                      </td>
                      <td className="px-4 py-3">{lead.name ?? lead.email ?? "—"}</td>
                      <td className="px-4 py-3 text-secondary">{lead.service ?? "—"}</td>
                      <td className="px-4 py-3 text-secondary">{SOURCE_LABELS[lead.source] ?? lead.source}</td>
                      <td className="px-4 py-3">{LEAD_STATUS_LABELS[lead.status as keyof typeof LEAD_STATUS_LABELS] ?? lead.status}</td>
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

          {totalPages > 1 ? (
            <nav aria-label="Страницы" className="flex items-center justify-between gap-3 text-sm">
              <p className="text-secondary">
                Страница {page} из {totalPages}
              </p>
              <div className="flex gap-2">
                {page > 1 ? (
                  <Link
                    href={`/admin/leads${qs(filters, { page: String(page - 1) })}`}
                    className="rounded-lg border border-white/15 px-4 py-2 hover:border-cyan"
                  >
                    ← Назад
                  </Link>
                ) : null}
                {page < totalPages ? (
                  <Link
                    href={`/admin/leads${qs(filters, { page: String(page + 1) })}`}
                    className="rounded-lg border border-white/15 px-4 py-2 hover:border-cyan"
                  >
                    Вперёд →
                  </Link>
                ) : null}
              </div>
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
