import type { Locale } from "@/lib/i18n/config";

/**
 * Калькулятор стоимости (ТЗ §12) — ЧИСТЫЙ модуль без зависимостей от Next/Prisma.
 *
 * Одна и та же функция считает и на клиенте (предпросмотр), и на сервере
 * (`POST /api/calculator` — источник истины, клиенту не доверяем, ТЗ §21.1).
 * Правила хранятся в БД (`CalculatorRule`), поэтому цены меняются из админки
 * без деплоя. Здесь — только математика и типы.
 */

export type RuleKind = "service" | "feature" | "complexity" | "option";

export type CalcRule = {
  kind: RuleKind;
  key: string;
  label: string;
  /** Добавка к базовой цене, USD. */
  price: number;
  /** Множитель для сложности (1 = без изменений); для остальных видов не используется. */
  weight: number;
  sort: number;
};

export type CalcSelection = {
  service: string;
  features: string[];
  complexity: string;
  options: string[];
};

export type CalcResult = {
  /** Диапазон цены, USD (нижняя и верхняя граница коридора). */
  min: number;
  max: number;
  /** Диапазон сроков, недели. */
  weeksMin: number;
  weeksMax: number;
  /** Подписи выбранного — для карточки итога. */
  selectedLabels: string[];
  /** Оценка в неделях до округления (для расчёта лида). */
  weeks: number;
};

/** Коридор цены и перевод «человеко-часов» в сроки. */
const CORRIDOR = 0.85; // нижняя граница = −15%
const CORRIDOR_UP = 1.2; // верхняя граница = +20%
const HOURS_PER_WEEK = 30;
/** Базовая ставка, USD/час. */
const RATE_PER_HOUR = 30;

function isRuleKind(value: string): value is RuleKind {
  return value === "service" || value === "feature" || value === "complexity" || value === "option";
}

/** Нормализует произвольные строки из БД в правила (устойчиво к мусору). */
export function normalizeRules(
  rows: Array<Omit<CalcRule, "kind"> & { kind: string }>,
): CalcRule[] {
  return rows
    .filter((row) => isRuleKind(row.kind) && typeof row.key === "string" && row.key.length > 0)
    .map((row) => ({
      kind: row.kind as RuleKind,
      key: row.key,
      label: row.label || row.key,
      price: Number.isFinite(row.price) ? Math.max(0, Math.round(row.price)) : 0,
      weight: Number.isFinite(row.weight) ? Math.max(1, Math.min(10, row.weight)) : 0,
      sort: Number.isFinite(row.sort) ? row.sort : 0,
    }))
    .sort((a, b) => a.sort - b.sort || a.label.localeCompare(b.label));
}

/**
 * Расчёт.
 *
 * База = цена выбранной услуги. Функции и опции прибавляются. Сложность
 * умножает итог на `weight` (1.0 / 1.35 / 1.9 — задаётся в админке).
 * Сроки: (база + добавки) / ставка / часы-в-неделю, с тем же коридором.
 *
 * Неизвестные ключи игнорируются — подделанный запрос не завышает цену
 * и не вызывает ошибку (валидатor не пропустит `<script>`-ключи, а здесь
 * просто нет совпадения).
 */
export function calculate(selection: CalcSelection, rules: CalcRule[]): CalcResult | null {
  const byKind = (kind: RuleKind) => rules.filter((r) => r.kind === kind);

  const service = byKind("service").find((r) => r.key === selection.service);
  if (!service) return null;

  const features = byKind("feature").filter((r) => selection.features.includes(r.key));
  const options = byKind("option").filter((r) => selection.options.includes(r.key));
  const complexity =
    byKind("complexity").find((r) => r.key === selection.complexity) ?? byKind("complexity")[0] ?? null;

  const additions = [...features, ...options].reduce((sum, rule) => sum + rule.price, 0);
  const base = service.price + additions;
  const factor = complexity && complexity.weight > 0 ? complexity.weight : 1;

  const price = base * factor;
  const hours = price / RATE_PER_HOUR;
  const weeks = hours / HOURS_PER_WEEK;

  const selectedLabels = [service.label, ...features.map((r) => r.label), ...options.map((r) => r.label)];
  if (complexity && complexity.label) selectedLabels.push(complexity.label);

  return {
    min: round50(price * CORRIDOR),
    max: round50(price * CORRIDOR_UP),
    weeksMin: Math.max(1, Math.floor(weeks)),
    weeksMax: Math.max(2, Math.ceil(weeks * 1.3)),
    selectedLabels,
    weeks,
  };
}

/** Округление до 50 USD — ценник не выглядит «сырым». */
function round50(value: number): number {
  return Math.round(value / 50) * 50;
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
  const range = `$${result.min} – $${result.max}`;
  const weeks =
    locale === "ru" ? `${result.weeksMin}–${result.weeksMax} нед.` : `${result.weeksMin}–${result.weeksMax} weeks`;

  return `${head}\n${chosen}\n${range} · ${weeks}`;
}

/** Валидация выбора — zod-схема живёт в lib/validation/calculator.ts; набор ключей сверяется с БД. */
export function isValidSelection(value: unknown): value is CalcSelection {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  const strings = (x: unknown): x is string[] =>
    Array.isArray(x) && x.length <= 20 && x.every((item) => typeof item === "string" && item.length <= 60);
  return (
    typeof v.service === "string" &&
    v.service.length <= 60 &&
    strings(v.features) &&
    strings(v.options) &&
    typeof v.complexity === "string" &&
    v.complexity.length <= 60
  );
}
