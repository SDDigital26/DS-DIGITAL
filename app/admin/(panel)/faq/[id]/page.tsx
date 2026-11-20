import { notFound } from "next/navigation";
import { requirePagePermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { FaqForm, type FaqRecord } from "@/components/admin/FaqForm";

export const metadata = { title: "Редактирование вопроса" };

export default async function AdminEditFaqPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePagePermission("content");
  const { id } = await params;

  const item = await db.faqItem.findUnique({ where: { id } });
  if (!item) notFound();

  const record: FaqRecord = {
    id: item.id,
    locale: item.locale,
    section: item.section,
    question: item.question,
    answer: item.answer,
    sort: item.sort,
    published: item.published,
  };

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Редактирование вопроса</h1>
        <p className="mt-1 text-sm text-secondary">
          Изменения появятся на публичной странице FAQ сразу после сохранения.
        </p>
      </header>

      <FaqForm item={record} />
    </div>
  );
}
