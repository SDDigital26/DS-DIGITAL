import "dotenv/config";
import { db } from "../lib/db";
import { SITE } from "../lib/content/site";
import { SERVICES } from "../lib/services";

/**
 * Базовые факты для AI-агента — только с сайта, без выдуманных цифр и кейсов.
 * Редактируются в /admin/knowledge.
 */

type Fact = { locale: "ru" | "en"; title: string; content: string; category: string; sort: number };

const facts: Fact[] = [
  {
    locale: "ru",
    title: "Чем занимается DS DIGITAL",
    category: "О студии",
    sort: 1,
    content: SITE.ru.hero.sub,
  },
  {
    locale: "ru",
    title: "Направления работы",
    category: "Услуги",
    sort: 2,
    content: SERVICES.map((s) => `${s.title.ru}: ${s.short.ru}`).join(" "),
  },
  {
    locale: "ru",
    title: "Как мы работаем",
    category: "Процесс",
    sort: 3,
    content: SITE.ru.process.steps.map((s) => `${s.title} — ${s.text}`).join(" "),
  },
  {
    locale: "ru",
    title: "Стоимость и заявка",
    category: "Стоимость",
    sort: 4,
    content:
      "Точную стоимость фиксируем после обсуждения состава работ. Для ориентира на сайте есть калькулятор; оставить заявку можно через форму контакта.",
  },
  {
    locale: "en",
    title: "What DS DIGITAL does",
    category: "About",
    sort: 1,
    content: SITE.en.hero.sub,
  },
  {
    locale: "en",
    title: "Areas of work",
    category: "Services",
    sort: 2,
    content: SERVICES.map((s) => `${s.title.en}: ${s.short.en}`).join(" "),
  },
  {
    locale: "en",
    title: "How we work",
    category: "Process",
    sort: 3,
    content: SITE.en.process.steps.map((s) => `${s.title} — ${s.text}`).join(" "),
  },
  {
    locale: "en",
    title: "Pricing and enquiries",
    category: "Pricing",
    sort: 4,
    content:
      "The exact price is fixed after discussing the scope. The site has a calculator for an estimate; enquiries can be sent through the contact form.",
  },
];

async function main() {
  for (const fact of facts) {
    const existing = await db.aiKnowledgeItem.findFirst({
      where: { locale: fact.locale, title: fact.title },
      select: { id: true },
    });
    if (existing) {
      await db.aiKnowledgeItem.update({ where: { id: existing.id }, data: fact });
      console.log(`[knowledge] обновлён: ${fact.locale} — ${fact.title}`);
    } else {
      await db.aiKnowledgeItem.create({ data: fact });
      console.log(`[knowledge] создан: ${fact.locale} — ${fact.title}`);
    }
  }
}

main()
  .catch((err) => {
    console.error("[seed:knowledge]", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
