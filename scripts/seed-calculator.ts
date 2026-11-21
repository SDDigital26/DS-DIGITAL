import "dotenv/config";
import { db } from "../lib/db";
import { DEFAULT_RULE_LABELS, DEFAULT_DISCLAIMER } from "../lib/calculator-defaults";

/**
 * Первичное наполнение правил калькулятора (ТЗ §12).
 *
 * Цены — ЧЕРНОВЫЕ, из прототипа первого экрана; в ТЗ стартовые цены
 * помечены [С] (требуют согласования). Запуск: npm run seed:calculator
 *
 * Идемпотентно: каждое правило — upsert по (kind, key, locale),
 * уже изменённое вручную не перезаписывается ценой из списка.
 */
async function main() {
  for (const rule of DEFAULT_RULE_LABELS) {
    await db.calculatorRule.upsert({
      where: { kind_key_locale: { kind: rule.kind, key: rule.key, locale: "ru" } },
      create: {
        kind: rule.kind,
        key: rule.key,
        locale: "ru",
        label: rule.ru,
        price: rule.price,
        weight: rule.weight,
        sort: rule.sort,
        active: true,
      },
      update: {
        label: rule.ru,
        weight: rule.weight,
        sort: rule.sort,
      },
    });
    await db.calculatorRule.upsert({
      where: { kind_key_locale: { kind: rule.kind, key: rule.key, locale: "en" } },
      create: {
        kind: rule.kind,
        key: rule.key,
        locale: "en",
        label: rule.en,
        price: rule.price,
        weight: rule.weight,
        sort: rule.sort,
        active: true,
      },
      update: {
        label: rule.en,
        weight: rule.weight,
        sort: rule.sort,
      },
    });
  }

  const existing = await db.setting.findUnique({ where: { key: "calculator" } });
  if (!existing) {
    await db.setting.create({
      data: { key: "calculator", value: DEFAULT_DISCLAIMER },
    });
  }

  const count = await db.calculatorRule.count();
  console.log(`[seed] Калькулятор: правил в БД ${count} (RU+EN), дисклеймер задан.`);
}

main()
  .catch((err) => {
    console.error("[seed] Ошибка:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
