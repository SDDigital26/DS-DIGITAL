import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/permissions";
import { serviceSchema } from "@/lib/validation/service";
import { revalidateService } from "@/lib/revalidate";

type Params = { params: Promise<{ id: string }> };

/** GET /api/admin/services/[id] — карточка услуги с переводами. Право: content. */
export async function GET(_request: NextRequest, { params }: Params) {
  const auth = await requirePermissionApi("content");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const service = await db.service.findUnique({
    where: { id },
    include: { translations: true },
  });
  if (!service) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({ ok: true, service });
}

/** PATCH /api/admin/services/[id] — обновление (включая RU/EN-переводы). Право: content. */
export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requirePermissionApi("content");
  if (auth instanceof NextResponse) return auth;
  const user = auth;

  const { id } = await params;
  const existing = await db.service.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

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

  // Смена slug на занятый — отказ
  if (data.slug !== existing.slug) {
    const taken = await db.service.findUnique({ where: { slug: data.slug } });
    if (taken) return NextResponse.json({ error: "slug already exists" }, { status: 409 });
  }

  const locales: Array<"ru" | "en"> = ["ru", "en"];
  await db.$transaction(async (tx) => {
    await tx.service.update({
      where: { id },
      data: {
        slug: data.slug,
        icon: data.icon ?? null,
        sort: data.sort ?? existing.sort,
        published: data.published ?? existing.published,
      },
    });

    for (const locale of locales) {
      const translation = data.translations[locale];
      if (!translation) continue;
      await tx.serviceTranslation.upsert({
        where: { serviceId_locale: { serviceId: id, locale } },
        create: { serviceId: id, locale, ...translation },
        update: { ...translation },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "service.update",
        entity: "Service",
        entityId: id,
        diff: { slug: data.slug, locales, published: data.published ?? existing.published },
      },
    });
  });

  // Читаем после коммита: в ответе должны быть актуальные переводы,
  // а не снимок до upsert.
  const updated = await db.service.findUnique({
    where: { id },
    include: { translations: true },
  });
  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });

  revalidateService(updated.slug);
  return NextResponse.json({ ok: true, service: updated });
}

/** DELETE /api/admin/services/[id]. Право: content. */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await requirePermissionApi("content");
  if (auth instanceof NextResponse) return auth;
  const user = auth;

  const { id } = await params;
  const existing = await db.service.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  await db.$transaction([
    db.service.delete({ where: { id } }),
    db.auditLog.create({
      data: {
        userId: user.id,
        action: "service.delete",
        entity: "Service",
        entityId: id,
        diff: { slug: existing.slug },
      },
    }),
  ]);

  revalidateService(existing.slug);
  return NextResponse.json({ ok: true, deleted: existing.slug });
}
