import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/permissions";
import { serviceSchema } from "@/lib/validation/service";

/** GET /api/admin/services — список услуг со всеми переводами. Право: content. */
export async function GET() {
  const auth = await requirePermissionApi("content");
  if (auth instanceof NextResponse) return auth;

  const services = await db.service.findMany({
    orderBy: [{ sort: "asc" }, { slug: "asc" }],
    include: { translations: true },
  });

  return NextResponse.json({ ok: true, services });
}

/** POST /api/admin/services — создать услугу (RU/EN). Право: content. */
export async function POST(request: NextRequest) {
  const auth = await requirePermissionApi("content");
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = serviceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation failed", issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })) },
      { status: 400 },
    );
  }

  const data = parsed.data;

  const existing = await db.service.findUnique({ where: { slug: data.slug } });
  if (existing) {
    return NextResponse.json({ error: "slug already exists" }, { status: 409 });
  }

  const translations = Object.entries(data.translations)
    .filter((entry): entry is ["ru" | "en", NonNullable<(typeof data.translations)["ru"]>] => Boolean(entry[1]))
    .map(([locale, t]) => ({ locale, ...t }));

  const created = await db.service.create({
    data: {
      slug: data.slug,
      icon: data.icon ?? null,
      sort: data.sort ?? 0,
      published: data.published ?? true,
      translations: { create: translations },
    },
    include: { translations: true },
  });

  await db.auditLog.create({
    data: {
      userId: auth.id,
      action: "service.create",
      entity: "Service",
      entityId: created.id,
      diff: { slug: created.slug, locales: translations.map((t) => t.locale), published: created.published },
    },
  });

  return NextResponse.json({ ok: true, service: created }, { status: 201 });
}
