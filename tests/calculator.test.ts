import { describe, expect, it } from "vitest";
import {
  calculate,
  normalizeRules,
  isValidSelection,
  describeCalculation,
  formatFromPrice,
  formatWeeks,
  type CalcRule,
} from "@/lib/calculator";

/**
 * Математика калькулятора по модели владельца (24.11.2026):
 * цена = сумма «от»-цен выбранных услуг, срок = максимальный из выбранных.
 * Никаких коридоров и множителей; «от $800» — точное значение из БД.
 */

const rules: CalcRule[] = [
  { kind: "service", key: "website-landing", label: "Сайты: лендинг", price: 800, weight: 0, weeksMin: 1, weeksMax: 2, sort: 0 },
  { kind: "service", key: "website-cms", label: "Сайты: 5–15 страниц + CMS", price: 2250, weight: 0, weeksMin: 3, weeksMax: 6, sort: 1 },
  { kind: "service", key: "telegram", label: "Telegram-боты", price: 750, weight: 0, weeksMin: 1, weeksMax: 2, sort: 2 },
  { kind: "service", key: "crm", label: "CRM-системы", price: 7000, weight: 0, weeksMin: 6, weeksMax: 12, sort: 3 },
  { kind: "option", key: "support", label: "Поддержка после запуска ($100/мес)", price: 100, weight: 0, weeksMin: null, weeksMax: null, sort: 20 },
];

describe("calculate", () => {
  it("одна услуга: цена = «от», срок из правила", () => {
    const result = calculate({ services: ["website-landing"], options: [] }, rules);
    expect(result).not.toBeNull();
    expect(result!.price).toBe(800);
    expect(result!.weeksMin).toBe(1);
    expect(result!.weeksMax).toBe(2);
    expect(result!.selectedLabels).toEqual(["Сайты: лендинг"]);
  });

  it("несколько услуг: цена = сумма, срок = максимальный", () => {
    const result = calculate({ services: ["website-landing", "crm"], options: [] }, rules);
    expect(result!.price).toBe(7800); // 800 + 7000
    expect(result!.weeksMin).toBe(6); // max(1, 6)
    expect(result!.weeksMax).toBe(12); // max(2, 12)
  });

  it("опции прибавляются к сумме и не влияют на срок", () => {
    const result = calculate({ services: ["telegram"], options: ["support"] }, rules);
    expect(result!.price).toBe(850); // 750 + 100
    expect(result!.weeksMin).toBe(1);
    expect(result!.weeksMax).toBe(2);
    expect(result!.selectedLabels).toContain("Поддержка после запуска ($100/мес)");
  });

  it("тысячи в цене клиента не округляются коридором — ровно как в прайсе", () => {
    const result = calculate({ services: ["website-cms"], options: [] }, rules);
    expect(result!.price).toBe(2250);
  });

  it("ничего не выбрано из известных услуг → null (не угадываем)", () => {
    expect(calculate({ services: ["nope"], options: [] }, rules)).toBeNull();
    expect(calculate({ services: [], options: ["support"] }, rules)).toBeNull();
  });

  it("подделанные ключи игнорируются и не завышают цену", () => {
    const result = calculate({ services: ["website-landing", "<script>", "hacked"], options: ["nope"] }, rules)!;
    expect(result.price).toBe(800);
  });

  it("услуга без срока → срок null (не придумываем)", () => {
    const noWeeks: CalcRule[] = [
      { kind: "service", key: "custom", label: "Custom", price: 100, weight: 0, weeksMin: null, weeksMax: null, sort: 0 },
    ];
    const result = calculate({ services: ["custom"], options: [] }, noWeeks)!;
    expect(result.price).toBe(100);
    expect(result.weeksMin).toBeNull();
    expect(result.weeksMax).toBeNull();
  });
});

describe("formatting", () => {
  it("«от $800» на русском и «from $800» на английском", () => {
    expect(formatFromPrice("ru", 800)).toBe("от $800");
    expect(formatFromPrice("en", 800)).toBe("from $800");
    expect(formatFromPrice("ru", 2250)).toBe("от $2 250");
    expect(formatFromPrice("en", 2250)).toBe("from $2 250");
  });

  it("срок «1–2 нед.» / «1–2 weeks»; пустой срок — пустая строка", () => {
    expect(formatWeeks("ru", 1, 2)).toBe("1–2 нед.");
    expect(formatWeeks("en", 1, 2)).toBe("1–2 weeks");
    expect(formatWeeks("ru", 8, 12)).toBe("8–12 нед.");
    expect(formatWeeks("ru", null, null)).toBe("");
    expect(formatWeeks("en", 3, 3)).toBe("3 weeks");
  });
});

describe("normalizeRules", () => {
  it("отбрасывает неизвестные виды, мусор и нормализует срок", () => {
    const normalized = normalizeRules([
      { kind: "service", key: "a", label: "A", price: -50, weight: 0, weeksMin: -5, weeksMax: 999, sort: 0 },
      { kind: "bogus", key: "b", label: "B", price: 10, weight: 0, weeksMin: null, weeksMax: null, sort: 0 },
      { kind: "option", key: "", label: "C", price: 10, weight: 0, weeksMin: null, weeksMax: null, sort: 1 },
    ]);
    expect(normalized).toHaveLength(1);
    expect(normalized[0].price).toBe(0); // отрицательная цена → 0
    expect(normalized[0].weeksMin).toBe(0); // отрицательный срок → 0
    expect(normalized[0].weeksMax).toBe(520); // верхняя граница
  });
});

describe("isValidSelection", () => {
  it("принимает корректный выбор (services + options)", () => {
    expect(isValidSelection({ services: ["a", "b"], options: ["c"] })).toBe(true);
    expect(isValidSelection({ services: [], options: [] })).toBe(true);
  });

  it("отклоняет не-объекты, мусор и старый формат с service/features", () => {
    expect(isValidSelection(null)).toBe(false);
    expect(isValidSelection("x")).toBe(false);
    expect(isValidSelection({ services: [1] })).toBe(false);
    expect(isValidSelection({ service: "a", features: [], complexity: "c", options: [] })).toBe(false);
  });
});

describe("describeCalculation", () => {
  it("формирует понятный текст для CRM: «от $…» и срок", () => {
    const selection = { services: ["website-cms", "telegram"], options: [] };
    const result = calculate(selection, rules)!;
    const ru = describeCalculation("ru", selection, result);
    const en = describeCalculation("en", selection, result);
    expect(ru).toContain("Расчёт из калькулятора");
    expect(ru).toContain("от $3 000");
    expect(ru).toContain("3–6 нед.");
    expect(en).toContain("website calculator");
    expect(en).toContain("from $3 000");
    expect(en).toContain("3–6 weeks");
  });

  it("без срока пишет, что обсудим индивидуально", () => {
    const noWeeks: CalcRule[] = [
      { kind: "service", key: "custom", label: "Custom", price: 500, weight: 0, weeksMin: null, weeksMax: null, sort: 0 },
    ];
    const selection = { services: ["custom"], options: [] };
    const result = calculate(selection, noWeeks)!;
    expect(describeCalculation("ru", selection, result)).toContain("срок обсудим индивидуально");
  });
});
