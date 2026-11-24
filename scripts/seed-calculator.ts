import "dotenv/config";
import { db } from "../lib/db";
import { DEFAULT_RULE_KEYS, DEFAULT_RULE_LABELS, DEFAULT_DISCLAIMER } from "../lib/calculator-defaults";

/**
 * Цены владельца в калькуляторе (24.11.2026, ТЗ §12).
 *
 * Идемпотентно:
 * - upsert каждого правила по (kind, key, locale);
 * - черновые правила старого набора (услуги со старыми ключами, «Функции»
 *   и «Сложность» с несогласованными ценами) удаляются — их цены владелец
 *   не подтверждал;
 * - дисклеймер «Расчёт предварительный…» сохраняется, если уже задан.
 *
 * Запуск: npm run seed:calculator
 */
async function main() {
  for (const rule of DEFAULT_RULE_LABELS) {
    const common = {
      label: rule.ru,
      price: rule.price,
      weight: rule.weight,
      weeksMin: rule.weeksMin,
      weeksMax: rule.weeksMax,
      sort: rule.sort,
      active: true,
    };
    await db.calculatorRule.upsert({
      where: { kind_key_locale: { kind: rule.kind, key: rule.key, locale: "ru" } },
      create: { kind: rule.kind, key: rule.key, locale: "ru", ...common },
      update: common,
    });
    const commonEn = { ...common, label: rule.en };
    await db.calculatorRule.upsert({
      where: { kind_key_locale: { kind: rule.kind, key: rule.key, locale: "en" } },
      create: { kind: rule.kind, key: rule.key, locale: "en", ...commonEn },
      update: commonEn,
    });
  }

  // Черновые правила, которых больше нет в наборе владельца, — удалить.
  const staleKinds: string[] = ["feature", "complexity"];
  const removedFeature = await db.calculatorRule.deleteMany({ where: { kind: { in: staleKinds } } });

  const keepKeys = DEFAULT_RULE_KEYS.service;
  const removedServices = await db.calculatorRule.deleteMany({
    where: { kind: "service", key: { notIn: keepKeys } },
  });
  const removedOptions = await db.calculatorRule.deleteMany({
    where: { kind: "option", key: { notIn: DEFAULT_RULE_KEYS.option } },
  });

  const existingConfig = await db.setting.findUnique({ where: { key: "calculator" } });
  if (!existingConfig) {
    await db.setting.create({
      data: { key: "calculator", value: DEFAULT_DISCLAIMER },
    });
  }

  const count = await db.calculatorRule.count();
  console.log(
    `[seed] Калькулятор: правил в БД ${count} (RU+EN), дисклеймер сохранён. Удалено черновых: услуги ${removedServices.count}, опции ${removedOptions.count}, функции/сложность ${removedFeature.count}.`,
  );
}

main()
  .catch((err) => {
    console.error("[seed] Ошибка:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
