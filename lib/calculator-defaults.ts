import type { Locale } from "@/lib/i18n/config";
import type { CalcRule, RuleKind } from "@/lib/calculator";

/**
 * Цены владельца DS DIGITAL (24.11.2026) — источник для первичного заполнения
 * БД (`npm run seed:calculator`). Дальше всё правится в кабинете
 * (`/admin/calculator`), БД — источник истины.
 *
 * Формат: услуга — «от $X» — срок в неделях. Своих цен и сроков здесь
 * не придумано: список передан владельцем.
 */

type Seed = {
  key: string;
  ru: string;
  en: string;
  price: number;
  weeksMin?: number;
  weeksMax?: number;
  sort: number;
};

/** Услуги (чекбоксы, можно несколько: цена = сумма, срок = максимум). */
const SERVICES: Seed[] = [
  { key: "website-landing", ru: "Сайты: лендинг", en: "Websites: landing page", price: 800, weeksMin: 1, weeksMax: 2, sort: 0 },
  { key: "website-cms", ru: "Сайты: 5–15 страниц + CMS", en: "Websites: 5–15 pages + CMS", price: 2250, weeksMin: 3, weeksMax: 6, sort: 1 },
  { key: "website-turnkey", ru: "Сайт «под ключ» (аналитика, дизайн, CRM)", en: "Turnkey website (analytics, design, CRM)", price: 5000, weeksMin: 8, weeksMax: 12, sort: 2 },
  { key: "webapp", ru: "Веб-приложения", en: "Web applications", price: 6000, weeksMin: 8, weeksMax: 12, sort: 3 },
  { key: "crm", ru: "CRM-системы", en: "CRM systems", price: 7000, weeksMin: 6, weeksMax: 12, sort: 4 },
  { key: "telegram", ru: "Telegram-боты", en: "Telegram bots", price: 750, weeksMin: 1, weeksMax: 2, sort: 5 },
  { key: "ai", ru: "ИИ-решения", en: "AI solutions", price: 1500, weeksMin: 2, weeksMax: 4, sort: 6 },
  { key: "automation", ru: "Автоматизация", en: "Automation", price: 500, weeksMin: 1, weeksMax: 2, sort: 7 },
  { key: "api", ru: "Интеграции API", en: "API integrations", price: 400, weeksMin: 1, weeksMax: 2, sort: 8 },
];

/** Опции (прибавляются к сумме). */
const OPTIONS: Seed[] = [
  { key: "support", ru: "Поддержка после запуска ($100/мес)", en: "Post-launch support ($100/mo)", price: 100, sort: 20 },
];

function rulesFor(kind: RuleKind, seeds: Seed[]): CalcRule[] {
  return seeds.map((seed) => ({
    kind,
    key: seed.key,
    label: seed.ru,
    price: seed.price,
    weight: 0,
    weeksMin: seed.weeksMin ?? null,
    weeksMax: seed.weeksMax ?? null,
    sort: seed.sort,
  }));
}

/** Полный набор (для утилит и тестов). */
export const DEFAULT_RULES: CalcRule[] = [...rulesFor("service", SERVICES), ...rulesFor("option", OPTIONS)];

/** Ключи текущего набора — для очистки устаревших черновых правил в БД. */
export const DEFAULT_RULE_KEYS: Record<RuleKind, string[]> = {
  service: SERVICES.map((s) => s.key),
  option: OPTIONS.map((s) => s.key),
  feature: [],
  complexity: [],
};

/** Пары ru/en для двуязычного заполнения (seed). */
export const DEFAULT_RULE_LABELS: Array<{
  kind: RuleKind;
  key: string;
  ru: string;
  en: string;
  price: number;
  weight: number;
  weeksMin: number | null;
  weeksMax: number | null;
  sort: number;
}> = [
  ...SERVICES.map((seed) => ({ kind: "service" as const, ...seed, weight: 0, weeksMin: seed.weeksMin ?? null, weeksMax: seed.weeksMax ?? null })),
  ...OPTIONS.map((seed) => ({ kind: "option" as const, ...seed, weight: 0, weeksMin: seed.weeksMin ?? null, weeksMax: seed.weeksMax ?? null })),
];

/** Дисклеймер «Расчёт предварительный…» — оставлен по требованию владельца. */
export const DEFAULT_DISCLAIMER: Record<Locale, string> = {
  ru: "Расчёт предварительный. Окончательная стоимость и сроки определяются после обсуждения проекта.",
  en: "This is a preliminary estimate. The final cost and timeline are agreed after discussing the project.",
};
