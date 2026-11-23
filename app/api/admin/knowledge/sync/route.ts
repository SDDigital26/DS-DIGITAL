import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/permissions";
import { syncKnowledgeFromSite } from "@/lib/ai/knowledge-sync";

/**
 * POST /api/admin/knowledge/sync — переносит знания сайта в единую базу AI:
 * услуги, статьи блога, FAQ, цены калькулятора и контакты.
 * Право `settings` (OWNER/ADMIN). Ручные факты не затрагиваются.
 */
export async function POST() {
  const auth = await requirePermissionApi("settings");
  if (auth instanceof NextResponse) return auth;

  try {
    const result = await syncKnowledgeFromSite();
    await db.auditLog.create({
      data: {
        userId: auth.id,
        action: "site.knowledge.sync",
        entity: "AiKnowledgeItem",
        entityId: "sync",
      },
    });
    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json({ error: "Не удалось синхронизировать базу знаний" }, { status: 500 });
  }
}
