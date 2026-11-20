import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/permissions";
import { faqItemSchema } from "@/lib/validation/faq";
import { revalidateFaq } from "@/lib/revalidate";

type Params = { params: Promise<{ id: string }> };

/** GET /api/admin/faq/[id]. Право: content. */
export async function GET(_request: NextRequest, { params }: Params) {
  const auth = await requirePermissionApi("content");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const item = await db.faqItem.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({ ok: true, item });
}

/** PATCH /api/admin/faq/[id]. Право: content. */
export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requirePermissionApi("content");
  if (auth instanceof NextResponse) return auth;
  const user = auth;

  const { id } = await params;
  const existing = await db.faqItem.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = faqItemSchema.safeParse(body);
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

  const updated = await db.faqItem.update({
    where: { id },
    data: {
      locale: data.locale,
      section: data.section || existing.section,
      question: data.question,
      answer: data.answer,
      sort: data.sort ?? existing.sort,
      published: data.published ?? existing.published,
    },
  });

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: "faq.update",
      entity: "FaqItem",
      entityId: id,
      diff: { locale: updated.locale, published: updated.published },
    },
  });

  revalidateFaq();
  return NextResponse.json({ ok: true, item: updated });
}

/** DELETE /api/admin/faq/[id]. Право: content. */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await requirePermissionApi("content");
  if (auth instanceof NextResponse) return auth;
  const user = auth;

  const { id } = await params;
  const existing = await db.faqItem.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  await db.$transaction([
    db.faqItem.delete({ where: { id } }),
    db.auditLog.create({
      data: {
        userId: user.id,
        action: "faq.delete",
        entity: "FaqItem",
        entityId: id,
        diff: { locale: existing.locale },
      },
    }),
  ]);

  revalidateFaq();
  return NextResponse.json({ ok: true, deleted: id });
}
