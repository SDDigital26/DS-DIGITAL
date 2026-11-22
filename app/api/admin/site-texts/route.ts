import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/permissions";
import {
  clearSiteOverrides,
  flattenSiteContent,
  getSiteContent,
  saveSiteOverrides,
} from "@/lib/content/site-overrides";

/** GET /api/admin/site-texts — все редактируемые тексты сайта RU/EN. */
export async function GET() {
  const auth = await requirePermissionApi("content");
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({
    ok: true,
    texts: {
      ru: flattenSiteContent(await getSiteContent("ru")),
      en: flattenSiteContent(await getSiteContent("en")),
    },
  });
}

/** PUT /api/admin/site-texts — сохранить правки одного языка. */
export async function PUT(request: NextRequest) {
  const auth = await requirePermissionApi("content");
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }
  const input = body as { locale?: string; values?: unknown };
  if (input.locale !== "ru" && input.locale !== "en") {
    return NextResponse.json({ error: "Нужен язык ru или en" }, { status: 400 });
  }
  if (!input.values || typeof input.values !== "object" || Array.isArray(input.values)) {
    return NextResponse.json({ error: "Некорректные значения" }, { status: 400 });
  }
  const values: Record<string, string> = {};
  for (const [key, value] of Object.entries(input.values as Record<string, unknown>)) {
    if (typeof value === "string" && value.length <= 8000) values[key] = value;
  }
  await saveSiteOverrides({ [input.locale]: values });
  await db.auditLog.create({
    data: { userId: auth.id, action: "site.texts.update", entity: "Setting", entityId: "site-content" },
  });
  return NextResponse.json({ ok: true, saved: Object.keys(values).length });
}

/** DELETE /api/admin/site-texts?locale=ru — вернуть язык к значениям по умолчанию. */
export async function DELETE(request: NextRequest) {
  const auth = await requirePermissionApi("content");
  if (auth instanceof NextResponse) return auth;
  const locale = new URL(request.url).searchParams.get("locale");
  if (locale !== "ru" && locale !== "en") {
    return NextResponse.json({ error: "Нужен язык ru или en" }, { status: 400 });
  }
  await clearSiteOverrides(locale);
  return NextResponse.json({ ok: true });
}
