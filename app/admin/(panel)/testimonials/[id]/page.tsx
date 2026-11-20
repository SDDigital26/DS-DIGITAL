import { notFound } from "next/navigation";
import { requirePagePermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { TestimonialForm, type TestimonialRecord } from "@/components/admin/TestimonialForm";

export const metadata = { title: "Редактирование отзыва" };

export default async function AdminEditTestimonialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePagePermission("content");
  const { id } = await params;

  const testimonial = await db.testimonial.findUnique({ where: { id } });
  if (!testimonial) notFound();

  const record: TestimonialRecord = {
    id: testimonial.id,
    authorName: testimonial.authorName,
    authorRole: testimonial.authorRole,
    text: testimonial.text,
    locale: testimonial.locale,
    avatarUrl: testimonial.avatarUrl,
    approved: testimonial.approved,
    consentAt: testimonial.consentAt ? testimonial.consentAt.toISOString() : null,
    sort: testimonial.sort,
  };

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Редактирование отзыва</h1>
        <p className="mt-1 text-sm text-secondary">
          Изменения появятся на сайте сразу после сохранения.
        </p>
      </header>

      <TestimonialForm testimonial={record} />
    </div>
  );
}
