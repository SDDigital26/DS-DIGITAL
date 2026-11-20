import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/permissions";
import { testimonialSchema } from "@/lib/validation/testimonial";
import { revalidateTestimonials } from "@/lib/revalidate";

/** GET /api/admin/testimonials — все отзывы (включая неодобренные). Право: content. */
export async function GET() {
  const auth = await requirePermissionApi("content");
  if (auth instanceof NextResponse) return auth;

  const testimonials = await db.testimonial.findMany({
    orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ ok: true, testimonials });
}

/** POST /api/admin/testimonials — создать отзыв. Право: content. */
export async function POST(request: NextRequest) {
  const auth = await requirePermissionApi("content");
  if (auth instanceof NextResponse) return auth;

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

  const created = await db.testimonial.create({
    data: {
      authorName: data.authorName,
      authorRole: data.authorRole || null,
      text: data.text,
      locale: data.locale,
      avatarUrl: data.avatarUrl || null,
      approved: data.approved ?? false,
      consentAt: data.consentAt ? new Date(data.consentAt) : null,
      sort: data.sort ?? 0,
    },
  });

  await db.auditLog.create({
    data: {
      userId: auth.id,
      action: "testimonial.create",
      entity: "Testimonial",
      entityId: created.id,
      // Без имени автора и текста — только служебные признаки (ТЗ §21).
      diff: { locale: created.locale, approved: created.approved, hasConsent: Boolean(created.consentAt) },
    },
  });

  revalidateTestimonials();
  return NextResponse.json({ ok: true, testimonial: created }, { status: 201 });
}
