import { requirePagePermission } from "@/lib/permissions";
import { ProjectForm } from "@/components/admin/ProjectForm";

export const metadata = { title: "Новый кейс" };

export default async function AdminNewProjectPage() {
  await requirePagePermission("content");

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Новый кейс</h1>
        <p className="mt-1 text-sm text-secondary">
          Заполните хотя бы один язык. Публикация — отдельным флажком.
        </p>
      </header>
      <ProjectForm />
    </div>
  );
}
