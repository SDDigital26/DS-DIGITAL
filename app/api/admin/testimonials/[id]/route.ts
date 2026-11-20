import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/permissions";
import { testimonialSchema } from "@/lib/validation/testimonial";
import { revalidateTestimonials } from "@/lib/revalidate";

type Params = { params: Promise<{ id: string }> };

/** GET /api/admin/testimonials/[id]. Право: content. */
export async function GET(_request: NextRequest, { params }: Params) {
  const auth = await requirePermissionApi("content");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const testimonial = await db.testimonial.findUnique({ where: { id } });
  if (!testimonial) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({ ok: true, testimonial });
}

/** PATCH /api/admin/testimonials/[id] — правка/одобрение. Право: content. */
export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requirePermissionApi("content");
  if (auth instanceof NextResponse) return auth;
  const user = auth;

  const { id } = await params;
  const existing = await db.testimonial.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = testimonialSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "validation failed",
        issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
      },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Нельзя снять согласие у уже опубликованного отзыва, оставив approved=true —
  // схема это ловит, но проверяем и на сервере, чтобы правило не зависело от формы.
  if (data.approved && !data.consentAt && !existing.consentAt) {
    return NextResponse.json(
      { error: "consent required", message: "для публикации нужно согласие автора" },
      { status: 400 },
    );
  }

  const updated = await db.testimonial.update({
    where: { id },
    data: {
      authorName: data.authorName,
      authorRole: data.authorRole || null,
      text: data.text,
      locale: data.locale,
      avatarUrl: data.avatarUrl || null,
      approved: data.approved ?? existing.approved,
      consentAt: data.consentAt === undefined
        ? existing.consentAt
        : data.consentAt
          ? new Date(data.consentAt)
          : null,
      sort: data.sort ?? existing.sort,
    },
  });

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: "testimonial.update",
      entity: "Testimonial",
      entityId: id,
      diff: {
        locale: updated.locale,
        approved: updated.approved,
        hasConsent: Boolean(updated.consentAt),
      },
    },
  });

  revalidateTestimonials();
  return NextResponse.json({ ok: true, testimonial: updated });
}

/** DELETE /api/admin/testimonials/[id]. Право: content. */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await requirePermissionApi("content");
  if (auth instanceof NextResponse) return auth;
  const user = auth;

  const { id } = await params;
  const existing = await db.testimonial.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  await db.$transaction([
    db.testimonial.delete({ where: { id } }),
    db.auditLog.create({
      data: {
        userId: user.id,
        action: "testimonial.delete",
        entity: "Testimonial",
        entityId: id,
        diff: { locale: existing.locale },
      },
    }),
  ]);

  revalidateTestimonials();
  return NextResponse.json({ ok: true, deleted: id });
}
