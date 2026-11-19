import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/permissions";
import { buildLeadWhere, parseLeadFilters } from "@/lib/lead-filters";
import { toCsv } from "@/lib/csv";

/**
 * GET /api/admin/leads/export — выгрузка заявок в CSV.
 * Право — leads_export (ТЗ §18): OWNER/ADMIN/MANAGER.
 * Фильтры совпадают со списком (тот же buildLeadWhere) — CSV = экспорт текущей выборки.
 */
export async function GET(request: NextRequest) {
  const auth = await requirePermissionApi("leads_export");
  if (auth instanceof NextResponse) return auth;
  const user = auth;

  const url = new URL(request.url);
  const filters = parseLeadFilters(url.searchParams);
  const where = buildLeadWhere(filters);

  const leads = await db.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 10_000,
  });

  const headers = [
    "ID",
    "Создана",
    "Имя",
    "Email",
    "WhatsApp",
    "Telegram",
    "Страна",
    "Язык",
    "Услуга",
    "Бюджет",
    "Статус",
    "Источник",
    "Описание",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "gclid",
    "fbclid",
    "Страница входа",
  ];

  const rows = leads.map((lead) => [
    lead.id,
    lead.createdAt.toISOString(),
    lead.name ?? "",
    lead.email ?? "",
    lead.whatsapp ?? "",
    lead.telegram ?? "",
    lead.country ?? "",
    lead.language,
    lead.service ?? "",
    lead.budget ?? "",
    lead.status,
    lead.source,
    lead.description.replace(/\r?\n/g, " "),
    lead.utmSource ?? "",
    lead.utmMedium ?? "",
    lead.utmCampaign ?? "",
    lead.utmContent ?? "",
    lead.utmTerm ?? "",
    lead.gclid ?? "",
    lead.fbclid ?? "",
    lead.landingPath ?? "",
  ]);

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: "leads.export",
      entity: "Lead",
      entityId: null,
      diff: { count: leads.length, filters: { ...filters, page: undefined } },
    },
  });

  const csv = toCsv(headers, rows);
  const filename = `leads-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
