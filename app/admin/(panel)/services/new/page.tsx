import { requirePagePermission } from "@/lib/permissions";
import { ServiceForm } from "@/components/admin/ServiceForm";

export const metadata = { title: "Новая услуга" };

export default async function AdminNewServicePage() {
  await requirePagePermission("content");

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Новая услуга</h1>
        <p className="mt-1 text-sm text-secondary">
          Заполните RU и EN-версии — они попадут на публичные страницы после сохранения.
        </p>
      </header>

      <ServiceForm />
    </div>
  );
}
