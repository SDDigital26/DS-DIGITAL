import { requirePagePermission } from "@/lib/permissions";
import { TestimonialForm } from "@/components/admin/TestimonialForm";

export const metadata = { title: "Новый отзыв" };

export default async function AdminNewTestimonialPage() {
  await requirePagePermission("content");

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Новый отзыв</h1>
        <p className="mt-1 text-sm text-secondary">
          Только реальные отзывы реальных клиентов с их согласием на публикацию.
        </p>
      </header>

      <TestimonialForm />
    </div>
  );
}
