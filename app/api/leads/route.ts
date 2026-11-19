import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { leadSchema } from "@/lib/validation/lead";
import { enqueueLeadNotifications } from "@/lib/notifications";

/**
 * POST /api/leads — приём публичной формы заявки (Док.2 §14).
 *
 * Порядок (ТЗ §21):
 * 1. валидация Zod (серверу не доверяем);
 * 2. honeypot-поле → тихо принимаем 202, ничего не сохраняя;
 * 3. rate limit на PostgreSQL (не in-memory);
 * 4. идемпотентность по idempotencyKey → повтор не создаёт дубль;
 * 5. ТРАНЗАКЦИОННО сохраняем лид, и только потом ставим уведомления;
 * 6. PII в логи не пишем.
 */

const RATE_LIMIT = { limit: 5, windowMs: 60_000 };

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation failed", issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })) },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Honeypot заполнен → бот. Не отвечаем деталями, ничего не сохраняем.
  if (data.website) {
    return NextResponse.json({ ok: true }, { status: 202 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await checkRateLimit(`leads:${ip}`, RATE_LIMIT.limit, RATE_LIMIT.windowMs);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "too many requests", retryAfterSec: rl.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  // Идемпотентность: клиент может повторить отправку при таймауте.
  const clientKey = request.headers.get("idempotency-key")?.trim();

  try {
    const lead = await createLead(data, clientKey);
    return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
  } catch (err) {
    if (isUniqueViolation(err)) {
      // Дубль по idempotency-key → успешный повтор без второго создания.
      const existing = await findExisting(clientKey);
      if (existing) return NextResponse.json({ ok: true, id: existing.id, duplicate: true }, { status: 200 });
    }
    console.error("[leads] create failed:", err instanceof Error ? err.name : "unknown");
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}

type LeadCreateInput = ReturnType<typeof leadSchema.parse>;

async function createLead(data: LeadCreateInput, idempotencyKey: string | null | undefined) {
  // Лид создаётся в транзакции; уведомления ставятся ПОСЛЕ её коммита —
  // сбой почты не должен терять заявку, а FK на Lead должен существовать.
  const lead = await db.$transaction(async (tx) =>
    tx.lead.create({
      data: {
        name: data.name || null,
        email: data.email || null,
        whatsapp: data.whatsapp || null,
        telegram: data.telegram || null,
        country: data.country || null,
        language: data.language,
        service: data.service || null,
        budget: data.budget || null,
        description: data.description,
        source: data.source,
        utmSource: data.utmSource || null,
        utmMedium: data.utmMedium || null,
        utmCampaign: data.utmCampaign || null,
        utmContent: data.utmContent || null,
        utmTerm: data.utmTerm || null,
        gclid: data.gclid || null,
        fbclid: data.fbclid || null,
        landingPath: data.landingPath || null,
        calculatorSnap: (data.calculatorSnapshot ?? undefined) as never,
        aiTranscript: (data.aiTranscript ?? undefined) as never,
        consentAt: new Date(),
        consentText: data.consentText || null,
        idempotencyKey: idempotencyKey || null,
      },
    }),
  );

  // Уведомления — best effort ПОСЛЕ коммита: заявка уже сохранена,
  // сбой очереди не критичен (пишем только тип ошибки, без PII).
  await enqueueLeadNotifications({
    leadId: lead.id,
    language: lead.language,
    name: lead.name ?? undefined,
    description: lead.description,
    service: lead.service ?? undefined,
  }).catch((e) => {
    console.error("[leads] enqueue notifications failed:", e instanceof Error ? e.name : "unknown");
  });

  return lead;
}

async function findExisting(key: string | null | undefined) {
  if (!key) return null;
  return db.lead.findUnique({ where: { idempotencyKey: key } });
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "P2002"
  );
}
