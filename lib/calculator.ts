import type { Locale } from "@/lib/i18n/config";

/**
 * Калькулятор стоимости (ТЗ §12) — ЧИСТЫЙ модуль без зависимостей от Next/Prisma.
 *
 * Модель цен владельца (24.11.2026):
 * - каждая услуга — «от $X» (floor), без коридоров и множителей;
 * - выбрано несколько услуг → цена = сумма, срок = максимальный из выбранных;
 * - «Другое» → «Обсудим индивидуально» (только на клиенте, в расчёт не входит);
 * - свои цены и сроки не придумываются — всё хранится в БД (`CalculatorRule`),
 *   правится в кабинете (`/admin/calculator`).
 */

export type RuleKind = "service" | "feature" | "complexity" | "option";

export type CalcRule = {
  kind: RuleKind;
  key: string;
  label: string;
  /** «От», USD. */
  price: number;
  /** Множитель (legacy для вида «Сложность»); в новой модели не используется. */
  weight: number;
  /** Срок в неделях (для услуг). */
  weeksMin: number | null;
  weeksMax: number | null;
  sort: number;
};

export type CalcSelection = {
  services: string[];
  options: string[];
};

export type CalcResult = {
  /** Сумма «от», USD. */
  price: number;
  weeksMin: number | null;
  weeksMax: number | null;
  /** Подписи выбранного — для карточки итога и лида. */
  selectedLabels: string[];
};

function isRuleKind(value: string): value is RuleKind {
  return value === "service" || value === "feature" || value === "complexity" || value === "option";
}

function clampWeeks(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(520, Math.round(n)));
}

/** Нормализует произвольные строки из БД в правила (устойчиво к мусору). */
export function normalizeRules(
  rows: Array<Omit<CalcRule, "kind"> & { kind: string; weeksMin?: number | null; weeksMax?: number | null }>,
): CalcRule[] {
  return rows
    .filter((row) => isRuleKind(row.kind) && typeof row.key === "string" && row.key.length > 0)
    .map((row) => ({
      kind: row.kind as RuleKind,
      key: row.key,
      label: row.label || row.key,
      price: Number.isFinite(row.price) ? Math.max(0, Math.round(row.price)) : 0,
      weight: Number.isFinite(row.weight) ? Math.max(0, Math.min(10, row.weight)) : 0,
      weeksMin: clampWeeks(row.weeksMin),
      weeksMax: clampWeeks(row.weeksMax),
      sort: Number.isFinite(row.sort) ? row.sort : 0,
    }))
    .sort((a, b) => a.sort - b.sort || a.label.localeCompare(b.label));
}

/**
 * Расчёт по выбору владельца:
 * - цена = сумма «от»-цен выбранных услуг и опций;
 * - срок = максимальный из сроков выбранных услуг;
 * - неизвестные ключи игнорируются — подделанный запрос не меняет цену.
 */
export function calculate(selection: CalcSelection, rules: CalcRule[]): CalcResult | null {
  const services = rules.filter((r) => r.kind === "service" && selection.services.includes(r.key));
  if (!services.length) return null;

  const options = rules.filter((r) => r.kind === "option" && selection.options.includes(r.key));
  const price = [...services, ...options].reduce((sum, rule) => sum + rule.price, 0);

  const weeksMinValues = services.map((r) => r.weeksMin).filter((w): w is number => w !== null);
  const weeksMaxValues = services.map((r) => r.weeksMax).filter((w): w is number => w !== null);

  return {
    price,
    weeksMin: weeksMinValues.length ? Math.max(...weeksMinValues) : null,
    weeksMax: weeksMaxValues.length ? Math.max(...weeksMaxValues) : null,
    selectedLabels: [...services.map((r) => r.label), ...options.map((r) => r.label)],
  };
}

/** «от $800» (RU) / «from $800» (EN), разделитель тысяч — пробел. */
export function formatFromPrice(locale: Locale, price: number): string {
  const formatted = Math.round(price).toLocaleString("ru-RU").replace(/\u00A0/g, " ");
  return locale === "ru" ? `от $${formatted}` : `from $${formatted}`;
}

/** Срок «1–2 нед.» (RU) / «1–2 weeks» (EN); месяцы — как дал их владелец (в неделях). */
export function formatWeeks(locale: Locale, weeksMin: number | null, weeksMax: number | null): string {
  if (weeksMin === null && weeksMax === null) return "";
  const unit = locale === "ru" ? "нед." : "weeks";
  if (weeksMin !== null && weeksMax !== null) {
    return weeksMin === weeksMax ? `${weeksMin} ${unit}` : `${weeksMin}–${weeksMax} ${unit}`;
  }
  const single = weeksMin ?? weeksMax;
  return `${single} ${unit}`;
}

/** Валидация выбора — zod-схема живёт в lib/validation/calculator.ts. */
export function isValidSelection(value: unknown): value is CalcSelection {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  const keys = (x: unknown): x is string[] =>
    Array.isArray(x) && x.length <= 12 && x.every((item) => typeof item === "string" && item.length <= 60);
  return keys(v.services) && keys(v.options ?? []);
}

/**
 * Человекочитаемая строка для передачи в лид (снимок расчёта, ТЗ §12.5).
 * Локализуется на сервере, чтобы менеджер в CRM видел понятный текст.
 */
export function describeCalculation(
  locale: Locale,
  selection: CalcSelection,
  result: CalcResult,
): string {
  const head =
    locale === "ru"
      ? "Расчёт из калькулятора на сайте"
      : "Estimate from the website calculator";
  const chosen = result.selectedLabels.join(", ");
  const price = formatFromPrice(locale, result.price);
  const weeks = formatWeeks(locale, result.weeksMin, result.weeksMax);
  const timeline = weeks
    ? `${locale === "ru" ? "срок" : "timeline"}: ${weeks}`
    : locale === "ru"
      ? "срок обсудим индивидуально"
      : "timeline discussed individually";

  return `${head}\n${chosen}\n${price} · ${timeline}`;
}
