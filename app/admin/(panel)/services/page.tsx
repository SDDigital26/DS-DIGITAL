import Link from "next/link";
import { requirePagePermission } from "@/lib/permissions";
import { db } from "@/lib/db";

export const metadata = { title: "Услуги" };

export default async function AdminServicesPage() {
  await requirePagePermission("content");

  const services = await db.service.findMany({
    orderBy: [{ sort: "asc" }, { slug: "asc" }],
    include: { translations: true },
  });

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Услуги</h1>
          <p className="mt-1 text-sm text-secondary">Всего: {services.length}</p>
        </div>
        <Link
          href="/admin/services/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/85"
        >
          Новая услуга
        </Link>
      </header>

      {services.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 bg-surface/50 p-8 text-center text-sm text-secondary">
          Услуг пока нет. Запустите <code className="text-cyan">npm run seed:content</code> —
          он заведёт 7 направлений из брифа.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-surface text-left text-xs text-secondary">
                <tr>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Название RU</th>
                  <th className="px-4 py-3">Название EN</th>
                  <th className="px-4 py-3">Порядок</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => {
                  const ru = service.translations.find((t) => t.locale === "ru");
                  const en = service.translations.find((t) => t.locale === "en");
                  return (
                    <tr key={service.id} className="border-t border-white/5">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{service.slug}</td>
                      <td className="px-4 py-3">{ru?.title ?? "—"}</td>
                      <td className="px-4 py-3 text-secondary">{en?.title ?? "—"}</td>
                      <td className="px-4 py-3 text-secondary">{service.sort}</td>
                      <td className="px-4 py-3">
                        {service.published ? (
                          <span className="text-emerald-300">опубликована</span>
                        ) : (
                          <span className="text-secondary">черновик</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/services/${service.id}`}
                          className="text-sm text-link hover:text-cyan"
                        >
                          Редактировать
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
