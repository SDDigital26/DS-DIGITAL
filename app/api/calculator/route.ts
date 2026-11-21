import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizeRules, calculate, isValidSelection } from "@/lib/calculator";
import { calculatorRequestSchema } from "@/lib/validation/calculator";
import { getSetting, CALCULATOR_SETTING_KEY } from "@/lib/settings";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";

/**
 * GET /api/calculator?locale=ru — публичные данные для калькулятора.
 * Возвращаем только правила запрошенного языка: иначе в расчёт попадают
 * подписи RU и EN одновременно (и в итоге смешиваются).
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("locale") ?? defaultLocale;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;

  const rows = await db.calculatorRule.findMany({
    where: { active: true, locale },
    orderBy: [{ sort: "asc" }],
  });

  return NextResponse.json({
    ok: true,
    locale,
    rules: normalizeRules(rows.map((r) => ({ ...r }))),
    disclaimer: await getDisclaimer(),
  });
}

/**
 * POST /api/calculator — расчёт.
 *
 * Клиент присылает только выбор (услуга, функции, сложность, опции):
 * цены и коэффициенты берутся из БД, поэтому подменить сумму в запросе нельзя.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = calculatorRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "validation failed",
        issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
      },
      { status: 400 },
    );
  }

  const { selection, locale } = parsed.data;
  if (!isValidSelection(selection)) {
    return NextResponse.json({ error: "invalid selection" }, { status: 400 });
  }

  const rows = await db.calculatorRule.findMany({
    where: { active: true, locale },
    orderBy: [{ sort: "asc" }],
  });
  const rules = normalizeRules(rows.map((r) => ({ ...r })));

  const result = calculate(selection, rules);
  if (!result) {
    return NextResponse.json({ error: "unknown service" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, result, disclaimer: await getDisclaimer() });
}

/**
 * Дисклеймер хранится в `Setting.calculator`. Исторически использовались два
 * формата ключей: { ru, en } (seed) и { disclaimerRu, disclaimerEn } (админка).
 * Читаем оба, чтобы правки из кабинета всегда применялись.
 */
async function getDisclaimer(): Promise<Record<Locale, string>> {
  const config = await getSetting(CALCULATOR_SETTING_KEY);
  const empty = { ru: "", en: "" };
  if (!config || typeof config !== "object") return empty;

  const raw = config as Record<string, unknown>;
  const pick = (a: unknown, b: unknown) =>
    typeof a === "string" ? a : typeof b === "string" ? b : undefined;

  return {
    ru: pick(raw.ru, raw.disclaimerRu) ?? "",
    en: pick(raw.en, raw.disclaimerEn) ?? "",
  };
}
