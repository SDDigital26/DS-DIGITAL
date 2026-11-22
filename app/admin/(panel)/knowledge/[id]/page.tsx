import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePagePermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { KnowledgeForm } from "@/components/admin/KnowledgeForm";

export const instant = false;
export const metadata = { title: "Факт базы знаний" };

export default async function EditKnowledgePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission("settings");
  const { id } = await params;
  const item = await db.aiKnowledgeItem.findUnique({ where: { id } });
  if (!item) notFound();

  return (
    <div className="flex flex-col gap-5">
      <header>
        <Link href="/admin/knowledge" className="text-sm text-secondary hover:text-white">
          ← База знаний
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Редактировать факт</h1>
      </header>
      <KnowledgeForm item={item} />
    </div>
  );
}
