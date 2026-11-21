import type { Locale } from "@/lib/i18n/config";
import type { CalcRule, RuleKind } from "@/lib/calculator";

/**
 * Стартовые правила калькулятора — ЧЕРНОВЫЕ цены для демонстрации, взятые
 * из прототипа первого экрана. Не являются коммерческим прайсом DS DIGITAL.
 *
 * В ТЗ стартовые цены помечены [С] (согласование). До согласования цены
 * редактируются в админке (`/admin/calculator`), БД — источник истины,
 * а этот список используется только скриптом первичного заполнения.
 */

type Seed = { key: string; ru: string; en: string; price: number; weight?: number };

const SERVICES: Seed[] = [
  { key: "website", ru: "Разработка сайта", en: "Website", price: 400 },
  { key: "webapp", ru: "Веб-приложение", en: "Web application", price: 900 },
  { key: "crm", ru: "CRM-система", en: "CRM system", price: 1200 },
  { key: "ai", ru: "AI-решение", en: "AI solution", price: 800 },
  { key: "automation", ru: "Автоматизация бизнеса", en: "Business automation", price: 600 },
  { key: "telegram", ru: "Telegram-бот / Mini App", en: "Telegram bot / Mini App", price: 350 },
  { key: "api", ru: "API-интеграция", en: "API integration", price: 300 },
];

const FEATURES: Seed[] = [
  { key: "i18n", ru: "Две языковые версии", en: "Two language versions", price: 150 },
  { key: "cms", ru: "Админка для контента", en: "Content admin", price: 300 },
  { key: "payments", ru: "Приём платежей", en: "Payments", price: 250 },
  { key: "account", ru: "Личный кабинет", en: "User cabinet", price: 400 },
  { key: "integration", ru: "Интеграция с внешним сервисом", en: "External service integration", price: 300 },
  { key: "telegramNotify", ru: "Telegram-уведомления", en: "Telegram notifications", price: 100 },
];

const COMPLEXITY: Seed[] = [
  { key: "simple", ru: "Простой", en: "Simple", price: 0, weight: 1 },
  { key: "medium", ru: "Средний", en: "Medium", price: 0, weight: 1.35 },
  { key: "complex", ru: "Сложный", en: "Complex", price: 0, weight: 1.9 },
];

const OPTIONS: Seed[] = [
  { key: "design", ru: "Дизайн под ключ", en: "Turnkey design", price: 300 },
  { key: "seo", ru: "SEO-настройка", en: "SEO setup", price: 200 },
  { key: "support", ru: "Поддержка 1 месяц", en: "One month support", price: 150 },
];

function rulesFor(kind: RuleKind, seeds: Seed[]): CalcRule[] {
  return seeds.map((seed, index) => ({
    kind,
    key: seed.key,
    label: seed.ru,
    price: seed.price,
    weight: seed.weight ?? 0,
    sort: index,
  }));
}

/** Полный стартовый набор (ru). */
export const DEFAULT_RULES: CalcRule[] = [
  ...rulesFor("service", SERVICES),
  ...rulesFor("feature", FEATURES),
  ...rulesFor("complexity", COMPLEXITY),
  ...rulesFor("option", OPTIONS),
];

/** Пары ru/en для двуязычного заполнения. */
export const DEFAULT_RULE_LABELS: Array<{ kind: RuleKind; key: string; ru: string; en: string; price: number; weight: number; sort: number }> =
  (
    [
      ["service", SERVICES, 0],
      ["feature", FEATURES, 100],
      ["complexity", COMPLEXITY, 200],
      ["option", OPTIONS, 300],
    ] as const
  ).flatMap(([kind, seeds, offset]) =>
    seeds.map((seed, index) => ({
      kind,
      key: seed.key,
      ru: seed.ru,
      en: seed.en,
      price: seed.price,
      weight: seed.weight ?? 0,
      sort: offset + index,
    })),
  );

export const DEFAULT_DISCLAIMER: Record<Locale, string> = {
  ru: "Расчёт предварительный. Окончательная стоимость и сроки определяются после обсуждения проекта.",
  en: "This is a preliminary estimate. The final cost and timeline are agreed after discussing the project.",
};
