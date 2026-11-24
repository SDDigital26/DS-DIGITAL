import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/permissions";
import { calculatorRuleSchema, calculatorConfigSchema } from "@/lib/validation/calculator";
import { setSetting, getSetting, CALCULATOR_SETTING_KEY } from "@/lib/settings";
import { revalidateCalculator } from "@/lib/revalidate";

/**
 * Управление калькулятором из админки (ТЗ §12, §17).
 * Право: settings. Изменение цены меняет результат без деплоя.
 */

/** GET /api/admin/calculator — правила (RU+EN парами) + текст дисклеймера. */
export async function GET() {
  const auth = await requirePermissionApi("settings");
  if (auth instanceof NextResponse) return auth;

  const [rows, config] = await Promise.all([
    db.calculatorRule.findMany({ orderBy: [{ kind: "asc" }, { sort: "asc" }] }),
    getSetting<Record<string, unknown>>(CALCULATOR_SETTING_KEY),
  ]);

  // Группируем пары ru/en по (kind, key) — в админке одна строка на правило.
  const grouped = new Map<
    string,
    {
      kind: string;
      key: string;
      price: number;
      weight: number;
      weeksMin: number | null;
      weeksMax: number | null;
      sort: number;
      active: boolean;
      ru: string;
      en: string;
    }
  >();

  for (const row of rows) {
    const id = `${row.kind}:${row.key}`;
    const entry =
      grouped.get(id) ?? {
        kind: row.kind,
        key: row.key,
        price: row.price,
        weight: row.weight,
        weeksMin: row.weeksMin,
        weeksMax: row.weeksMax,
        sort: row.sort,
        active: row.active,
        ru: "",
        en: "",
      };
    if (row.locale === "ru") entry.ru = row.label;
    if (row.locale === "en") entry.en = row.label;
    entry.price = row.price;
    entry.weight = row.weight;
    entry.weeksMin = row.weeksMin;
    entry.weeksMax = row.weeksMax;
    entry.sort = row.sort;
    entry.active = row.active;
    grouped.set(id, entry);
  }

  return NextResponse.json({
    ok: true,
    rules: [...grouped.values()].sort((a, b) => a.sort - b.sort || a.key.localeCompare(b.key)),
    disclaimer: {
      ru: readString(config?.ru) ?? readString(config?.disclaimerRu) ?? "",
      en: readString(config?.en) ?? readString(config?.disclaimerEn) ?? "",
    },
  });
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/** POST /api/admin/calculator — upsert правила (обе локали) или дисклеймера. */
export async function POST(request: NextRequest) {
  const auth = await requirePermissionApi("settings");
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const asRecord = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;

  // Режим 1: сохранение текста дисклеймера.
  if (asRecord.disclaimer) {
    const parsed = calculatorConfigSchema.safeParse(asRecord.disclaimer);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation failed", issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })) },
        { status: 400 },
      );
    }
    await setSetting(CALCULATOR_SETTING_KEY, {
      ru: parsed.data.disclaimerRu,
      en: parsed.data.disclaimerEn,
    });
    await db.auditLog.create({
      data: { userId: auth.id, action: "calculator.disclaimer.update", entity: "Setting", entityId: CALCULATOR_SETTING_KEY },
    });
    revalidateCalculator();
    return NextResponse.json({ ok: true });
  }

  // Режим 2: правило.
  const parsed = calculatorRuleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation failed", issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })) },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const common = {
    price: data.price,
    weight: data.weight ?? 0,
    weeksMin: data.weeksMin ?? null,
    weeksMax: data.weeksMax ?? null,
    sort: data.sort ?? 0,
    active: data.active ?? true,
  };

  await db.$transaction([
    db.calculatorRule.upsert({
      where: { kind_key_locale: { kind: data.kind, key: data.key, locale: "ru" } },
      create: { kind: data.kind, key: data.key, locale: "ru", label: data.ru, ...common },
      update: { label: data.ru, ...common },
    }),
    db.calculatorRule.upsert({
      where: { kind_key_locale: { kind: data.kind, key: data.key, locale: "en" } },
      create: { kind: data.kind, key: data.key, locale: "en", label: data.en, ...common },
      update: { label: data.en, ...common },
    }),
  ]);

  await db.auditLog.create({
    data: {
      userId: auth.id,
      action: "calculator.rule.upsert",
      entity: "CalculatorRule",
      entityId: `${data.kind}:${data.key}`,
      diff: { price: data.price, weight: common.weight, weeksMin: common.weeksMin, weeksMax: common.weeksMax, active: common.active },
    },
  });

  revalidateCalculator();
  return NextResponse.json({ ok: true });
}

/** DELETE /api/admin/calculator?kind=…&key=… — удалить правило (обе локали). */
export async function DELETE(request: NextRequest) {
  const auth = await requirePermissionApi("settings");
  if (auth instanceof NextResponse) return auth;

  const kind = request.nextUrl.searchParams.get("kind")?.trim() ?? "";
  const key = request.nextUrl.searchParams.get("key")?.trim() ?? "";
  if (!kind || !key) return NextResponse.json({ error: "kind and key required" }, { status: 400 });

  const deleted = await db.calculatorRule.deleteMany({ where: { kind, key } });
  if (deleted.count === 0) return NextResponse.json({ error: "not found" }, { status: 404 });

  await db.auditLog.create({
    data: {
      userId: auth.id,
      action: "calculator.rule.delete",
      entity: "CalculatorRule",
      entityId: `${kind}:${key}`,
      diff: { rows: deleted.count },
    },
  });

  revalidateCalculator();
  return NextResponse.json({ ok: true, deleted: deleted.count });
}
