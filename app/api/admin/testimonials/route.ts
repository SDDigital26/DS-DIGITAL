import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/permissions";
import { testimonialSchema } from "@/lib/validation/testimonial";
import { revalidateTestimonials } from "@/lib/revalidate";
import {
  TESTIMONIALS_PER_PAGE,
  buildTestimonialWhere,
  parsePage,
  parseTestimonialFilters,
} from "@/lib/testimonial-filters";

/** GET /api/admin/testimonials — отзывы с фильтрами и пагинацией. Право: content. */
export async function GET(request: NextRequest) {
  const auth = await requirePermissionApi("content");
  if (auth instanceof NextResponse) return auth;

  const filters = parseTestimonialFilters(new URL(request.url).searchParams);
  const where = buildTestimonialWhere(filters);
  const page = parsePage(filters.page);
  const skip = (page - 1) * TESTIMONIALS_PER_PAGE;

  const [total, testimonials] = await Promise.all([
    db.testimonial.count({ where }),
    db.testimonial.findMany({
      where,
      orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
      skip,
      take: TESTIMONIALS_PER_PAGE,
    }),
  ]);

  return NextResponse.json({
    ok: true,
    testimonials,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / TESTIMONIALS_PER_PAGE)),
  });
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
