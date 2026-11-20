import { requirePagePermission } from "@/lib/permissions";
import { FaqForm } from "@/components/admin/FaqForm";

export const metadata = { title: "Новый вопрос FAQ" };

export default async function AdminNewFaqPage() {
  await requirePagePermission("content");

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Новый вопрос</h1>
        <p className="mt-1 text-sm text-secondary">
          Вопрос и ответ добавляются отдельно для каждого языка.
        </p>
      </header>

      <FaqForm />
    </div>
  );
}
