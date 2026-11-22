import Link from "next/link";
import { requirePagePermission } from "@/lib/permissions";
import { KnowledgeForm } from "@/components/admin/KnowledgeForm";

export const metadata = { title: "Новый факт базы знаний" };

export default async function NewKnowledgePage() {
  await requirePagePermission("settings");
  return (
    <div className="flex flex-col gap-5">
      <header>
        <Link href="/admin/knowledge" className="text-sm text-secondary hover:text-white">
          ← База знаний
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Новый факт</h1>
      </header>
      <KnowledgeForm />
    </div>
  );
}
