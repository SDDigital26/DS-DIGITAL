import { notFound } from "next/navigation";
import { requirePagePermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { ServiceForm, type ServiceRecord } from "@/components/admin/ServiceForm";

export const metadata = { title: "Редактирование услуги" };

export default async function AdminEditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePagePermission("content");
  const { id } = await params;

  const service = await db.service.findUnique({
    where: { id },
    include: { translations: true },
  });
  if (!service) notFound();

  const record: ServiceRecord = {
    id: service.id,
    slug: service.slug,
    icon: service.icon,
    sort: service.sort,
    published: service.published,
    translations: service.translations.map((t) => ({
      id: t.id,
      locale: t.locale,
      title: t.title,
      hero: t.hero,
      problem: t.problem,
      solution: t.solution,
      benefits: Array.isArray(t.benefits) ? (t.benefits as string[]) : [],
      seoTitle: t.seoTitle,
      seoDesc: t.seoDesc,
    })),
  };

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Редактирование услуги</h1>
        <p className="mt-1 text-sm text-secondary">
          <code className="text-cyan">{service.slug}</code> · изменения применятся к
          публичным страницам без деплоя
        </p>
      </header>

      <ServiceForm service={record} />
    </div>
  );
}
