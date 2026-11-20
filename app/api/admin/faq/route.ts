import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/permissions";
import { faqItemSchema } from "@/lib/validation/faq";
import { revalidateFaq } from "@/lib/revalidate";

/** GET /api/admin/faq — все вопросы (включая неопубликованные). Право: content. */
export async function GET() {
  const auth = await requirePermissionApi("content");
  if (auth instanceof NextResponse) return auth;

  const items = await db.faqItem.findMany({
    orderBy: [{ sort: "asc" }, { locale: "asc" }],
  });

  return NextResponse.json({ ok: true, items });
}

/** POST /api/admin/faq — добавить вопрос. Право: content. */
export async function POST(request: NextRequest) {
  const auth = await requirePermissionApi("content");
  if (auth instanceof NextResponse) return auth;

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

  const created = await db.faqItem.create({
    data: {
      locale: data.locale,
      section: data.section || "faq",
      question: data.question,
      answer: data.answer,
      sort: data.sort ?? 0,
      published: data.published ?? true,
    },
  });

  await db.auditLog.create({
    data: {
      userId: auth.id,
      action: "faq.create",
      entity: "FaqItem",
      entityId: created.id,
      diff: { locale: created.locale, published: created.published },
    },
  });

  revalidateFaq();
  return NextResponse.json({ ok: true, item: created }, { status: 201 });
}
