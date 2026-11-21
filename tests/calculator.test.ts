import { describe, expect, it } from "vitest";
import { calculate, normalizeRules, isValidSelection, describeCalculation, type CalcRule } from "@/lib/calculator";

/**
 * Математика калькулятора (ТЗ §12, этап 7): цены, сроки, устойчивость
 * к мусорным правилам и к подделанному запросу.
 */

const rules: CalcRule[] = [
  { kind: "service", key: "website", label: "Сайт", price: 400, weight: 0, sort: 0 },
  { kind: "service", key: "crm", label: "CRM", price: 1200, weight: 0, sort: 1 },
  { kind: "feature", key: "i18n", label: "Два языка", price: 150, weight: 0, sort: 0 },
  { kind: "feature", key: "cms", label: "Админка", price: 300, weight: 0, sort: 1 },
  { kind: "complexity", key: "simple", label: "Простой", price: 0, weight: 1, sort: 0 },
  { kind: "complexity", key: "medium", label: "Средний", price: 0, weight: 1.5, sort: 1 },
  { kind: "option", key: "design", label: "Дизайн", price: 300, weight: 0, sort: 0 },
];

describe("calculate", () => {
  it("базовая цена без добавок: диапазон вокруг базовой", () => {
    const result = calculate({ service: "website", features: [], complexity: "simple", options: [] }, rules);
    expect(result).not.toBeNull();
    expect(result!.min).toBe(350); // 400 * 0.85 = 340 → округление до 50
    expect(result!.max).toBe(500); // 400 * 1.2 = 480 → 500
    expect(result!.weeksMin).toBeGreaterThanOrEqual(1);
    expect(result!.weeksMax).toBeGreaterThan(result!.weeksMin);
  });

  it("функции и опции прибавляются к базе", () => {
    const result = calculate(
      { service: "website", features: ["i18n", "cms"], complexity: "simple", options: ["design"] },
      rules,
    );
    // (400 + 150 + 300 + 300) = 1150 → 977 … 1380
    expect(result!.min).toBe(1000);
    expect(result!.max).toBe(1400);
    expect(result!.selectedLabels).toContain("Админка");
    expect(result!.selectedLabels).toContain("Дизайн");
  });

  it("сложность умножает итог", () => {
    const simple = calculate({ service: "crm", features: [], complexity: "simple", options: [] }, rules)!;
    const medium = calculate({ service: "crm", features: [], complexity: "medium", options: [] }, rules)!;
    expect(medium.min).toBeGreaterThan(simple.min);
    expect(medium.max).toBeGreaterThan(simple.max);
  });

  it("неизвестная услуга → null (не угадываем)", () => {
    expect(calculate({ service: "nope", features: [], complexity: "simple", options: [] }, rules)).toBeNull();
  });

  it("неизвестные функции игнорируются и не завышают цену", () => {
    const result = calculate(
      { service: "website", features: ["hacked", "i18n"], complexity: "simple", options: ["nope"] },
      rules,
    )!;
    expect(result.min).toBe(450); // (400+150)=550*0.85=467 → 450
  });

  it("подделанный ключ сложности не ломает расчёт", () => {
    const result = calculate({ service: "website", features: [], complexity: "<script>", options: [] }, rules)!;
    // Берётся первая сложность как фолбэк.
    expect(result).not.toBeNull();
    expect(result.min).toBe(350);
  });
});

describe("normalizeRules", () => {
  it("отбрасывает неизвестные виды и мусорные значения", () => {
    const normalized = normalizeRules([
      { kind: "service", key: "a", label: "A", price: -50, weight: 0, sort: 0 },
      { kind: "bogus", key: "b", label: "B", price: 10, weight: 0, sort: 0 },
      { kind: "feature", key: "", label: "C", price: 10, weight: 0, sort: 0 },
      { kind: "option", key: "d", label: "", price: 12.7, weight: 0, sort: 1 },
    ]);
    expect(normalized).toHaveLength(2);
    expect(normalized[0].price).toBe(0); // отрицательная цена → 0
    expect(normalized[1].label).toBe("d"); // пустая подпись → ключ
    expect(normalized[1].price).toBe(13); // округление
  });
});

describe("isValidSelection", () => {
  it("принимает корректный выбор", () => {
    expect(isValidSelection({ service: "a", features: ["b"], complexity: "c", options: [] })).toBe(true);
  });

  it("отклоняет не-объекты и массивы с мусором", () => {
    expect(isValidSelection(null)).toBe(false);
    expect(isValidSelection("x")).toBe(false);
    expect(isValidSelection({ service: "a", features: [1], complexity: "c", options: [] })).toBe(false);
    expect(isValidSelection({ service: "a", features: [], options: [] })).toBe(false);
  });
});

describe("describeCalculation", () => {
  it("формирует понятный текст для CRM на обоих языках", () => {
    const result = calculate({ service: "website", features: ["i18n"], complexity: "simple", options: [] }, rules)!;
    const ru = describeCalculation("ru", { service: "website", features: ["i18n"], complexity: "simple", options: [] }, result);
    const en = describeCalculation("en", { service: "website", features: ["i18n"], complexity: "simple", options: [] }, result);
    expect(ru).toContain("калькулятора");
    expect(ru).toContain("Два языка");
    expect(en).toContain("website calculator");
    expect(en).toContain("weeks");
  });
});
