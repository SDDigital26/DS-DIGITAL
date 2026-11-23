import Link from "next/link";
import { requirePagePermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import {
  KNOWLEDGE_PER_PAGE,
  buildKnowledgeWhere,
  parseKnowledgeFilters,
  parsePage,
  type KnowledgeFilters,
} from "@/lib/ai/knowledge";
import { KnowledgeDeleteButton } from "@/components/admin/KnowledgeDeleteButton";
import { KnowledgeSyncButton } from "@/components/admin/KnowledgeSyncButton";

// Динамический раздел: данные из БД и searchParams (Next 16 cacheComponents)
export const instant = false;

export const metadata = { title: "База знаний AI" };

function qs(filters: KnowledgeFilters, patch: Partial<Record<string, string | undefined>> = {}): string {
  const merged: Record<string, string | undefined> = {
    locale: filters.locale,
    published: filters.published,
    q: filters.q,
    page: filters.page,
    ...patch,
  };
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) if (value) sp.set(key, value);
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export default async function AdminKnowledgePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePagePermission("settings");
  const filters = parseKnowledgeFilters(await searchParams);
  const where = buildKnowledgeWhere(filters);
  const page = parsePage(filters.page);

  const [total, items] = await Promise.all([
    db.aiKnowledgeItem.count({ where }),
    db.aiKnowledgeItem.findMany({
      where,
      orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * KNOWLEDGE_PER_PAGE,
      take: KNOWLEDGE_PER_PAGE,
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / KNOWLEDGE_PER_PAGE));

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">База знаний AI</h1>
          <p className="mt-1 text-sm text-secondary">
            Единая база знаний агента · всего: {total}. Сюда же переносятся услуги, статьи блога,
            FAQ, цены и контакты с сайта. Ключ API — в «Настройках».
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <KnowledgeSyncButton />
          <Link href="/admin/knowledge/new" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/85">
            Добавить факт
          </Link>
        </div>
      </header>

      <form method="get" className="grid gap-3 rounded-2xl border border-white/10 bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="q" className="text-xs text-secondary">Поиск (заголовок / факт)</label>
          <input
            id="q"
            name="q"
            type="search"
            maxLength={100}
            defaultValue={filters.q ?? ""}
            className="rounded-lg border border-white/10 bg-bg px-3 py-2 text-base outline-none focus:border-accent"
            placeholder="Найти факт…"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="locale" className="text-xs text-secondary">Язык</label>
          <select id="locale" name="locale" defaultValue={filters.locale ?? ""} className="rounded-lg border border-white/10 bg-bg px-3 py-2 text-base outline-none focus:border-accent">
            <option value="">Все</option>
            <option value="ru">RU</option>
            <option value="en">EN</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="published" className="text-xs text-secondary">Использование</label>
          <select id="published" name="published" defaultValue={filters.published ?? ""} className="rounded-lg border border-white/10 bg-bg px-3 py-2 text-base outline-none focus:border-accent">
            <option value="">Все</option>
            <option value="1">Активные</option>
            <option value="0">Отключённые</option>
          </select>
        </div>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
          <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/85">
            Применить
          </button>
          <Link href="/admin/knowledge" className="rounded-lg border border-white/15 px-4 py-2 text-sm text-secondary hover:text-white">
            Сбросить
          </Link>
        </div>
      </form>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 bg-surface/50 p-8 text-center text-sm text-secondary">
          Фактов пока нет. Добавьте согласованные сведения — агент сможет использовать их в ответах.
        </p>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-surface text-left text-xs text-secondary">
                  <tr>
                    <th className="px-4 py-3">Факт</th>
                    <th className="px-4 py-3">Категория</th>
                    <th className="px-4 py-3">Язык</th>
                    <th className="px-4 py-3">Порядок</th>
                    <th className="px-4 py-3">В ответах</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t border-white/5">
                      <td className="max-w-md px-4 py-3">
                        <span className="block font-medium">{item.title}</span>
                        <span className="block truncate text-xs text-secondary">{item.content}</span>
                      </td>
                      <td className="px-4 py-3 text-secondary">{item.category ?? "—"}</td>
                      <td className="px-4 py-3 uppercase text-secondary">{item.locale}</td>
                      <td className="px-4 py-3 text-secondary">{item.sort}</td>
                      <td className="px-4 py-3">
                        {item.published ? (
                          <span className="text-emerald-300">да</span>
                        ) : (
                          <span className="text-secondary">нет</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-3">
                          <Link href={`/admin/knowledge/${item.id}`} className="text-link hover:text-cyan">
                            Изменить
                          </Link>
                          <KnowledgeDeleteButton id={item.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 ? (
            <nav aria-label="Страницы" className="flex items-center justify-between gap-3 text-sm">
              <p className="text-secondary">Страница {page} из {totalPages}</p>
              <div className="flex gap-2">
                {page > 1 ? (
                  <Link href={`/admin/knowledge${qs(filters, { page: String(page - 1) })}`} className="rounded-lg border border-white/15 px-4 py-2 hover:border-cyan">
                    ← Назад
                  </Link>
                ) : null}
                {page < totalPages ? (
                  <Link href={`/admin/knowledge${qs(filters, { page: String(page + 1) })}`} className="rounded-lg border border-white/15 px-4 py-2 hover:border-cyan">
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
