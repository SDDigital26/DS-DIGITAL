import { db } from "@/lib/db";
import { getSiteSettings } from "@/lib/site-settings";
import { SITE } from "@/lib/content/site";
import { SERVICES } from "@/lib/services";

/**
 * Единая база знаний AI (таблица AiKnowledgeItem).
 *
 * Владелец может вести факты вручную, но основные знания уже есть на сайте:
 * услуги, статьи блога, FAQ, цены калькулятора и контакты. Синхронизация
 * переносит их в ту же таблицу, чтобы агент отвечал из одного источника.
 *
 * Ручные факты (`source = null/manual`) синхронизация не трогает.
 */

export type KnowledgeSyncResult = {
  created: number;
  updated: number;
  removed: number;
  bySource: Record<string, number>;
};

type Fact = {
  locale: "ru" | "en";
  title: string;
  content: string;
  category: string;
  source: string;
  sourceKey: string;
  sort: number;
};

const LOCALES = ["ru", "en"] as const;

function clean(value: string, max = 3500): string {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

/** Markdown → читаемый текст для фактов (без разметки, ссылок и кода). */
function stripMarkdown(input: string): string {
  return input
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~`>|]/g, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function benefitsText(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const record = item as { title?: unknown; text?: unknown };
        return [record.title, record.text].filter((part) => typeof part === "string").join(" — ");
      }
      return "";
    })
    .filter(Boolean)
    .join("; ");
}

async function collectFacts(): Promise<Fact[]> {
  const facts: Fact[] = [];
  const [settings, services, articles, faqs, rules] = await Promise.all([
    getSiteSettings().catch(() => null),
    db.service
      .findMany({
        where: { published: true },
        include: { translations: true },
        orderBy: { sort: "asc" },
      })
      .catch(() => []),
    db.article
      .findMany({
        where: { status: "published" },
        include: { translations: true },
        orderBy: { sort: "asc" },
      })
      .catch(() => []),
    db.faqItem.findMany({ where: { published: true }, orderBy: { sort: "asc" } }).catch(() => []),
    db.calculatorRule
      .findMany({ where: { active: true }, orderBy: { sort: "asc" } })
      .catch(() => []),
  ]);

  // 1) Услуги: из БД (12 блоков), иначе — статический список.
  if (services.length) {
    for (const service of services) {
      for (const tr of service.translations) {
        if (tr.locale !== "ru" && tr.locale !== "en") continue;
        const content = clean(
          [
            tr.hero,
            tr.problem ? `Проблема: ${tr.problem}` : "",
            tr.solution ? `Решение: ${tr.solution}` : "",
            tr.result ? `Результат: ${tr.result}` : "",
            tr.audience ? `Кому подходит: ${tr.audience}` : "",
            tr.timeline ? `Сроки: ${tr.timeline}` : "",
            benefitsText(tr.benefits) ? `Преимущества: ${benefitsText(tr.benefits)}` : "",
          ]
            .filter(Boolean)
            .join(" "),
        );
        facts.push({
          locale: tr.locale,
          title: `${tr.locale === "ru" ? "Услуга" : "Service"}: ${tr.title}`.slice(0, 160),
          content,
          category: tr.locale === "ru" ? "Услуги" : "Services",
          source: "service",
          sourceKey: `service:${service.slug}`,
          sort: 10 + service.sort,
        });
      }
    }
  } else {
    for (const service of SERVICES) {
      for (const locale of LOCALES) {
        facts.push({
          locale,
          title: `${locale === "ru" ? "Услуга" : "Service"}: ${service.title[locale]}`.slice(0, 160),
          content: service.short[locale],
          category: locale === "ru" ? "Услуги" : "Services",
          source: "service",
          sourceKey: `service:${service.slug}`,
          sort: 10,
        });
      }
    }
  }

  // 2) Статьи блога: лучший источник готовых ответов на типовые вопросы.
  for (const article of articles) {
    for (const tr of article.translations) {
      if (tr.locale !== "ru" && tr.locale !== "en") continue;
      const body = stripMarkdown(tr.body);
      const content = clean(`${tr.excerpt} ${body}`, 3500);
      facts.push({
        locale: tr.locale,
        title: `${tr.locale === "ru" ? "Статья" : "Article"}: ${tr.title}`.slice(0, 160),
        content,
        category: tr.locale === "ru" ? "Блог" : "Blog",
        source: "article",
        sourceKey: `article:${article.slug}`,
        sort: 100 + article.sort,
      });
    }
  }

  // 3) FAQ сайта.
  for (const faq of faqs) {
    if (faq.locale !== "ru" && faq.locale !== "en") continue;
    facts.push({
      locale: faq.locale,
      title: faq.question.slice(0, 160),
      content: clean(faq.answer),
      category: faq.locale === "ru" ? "FAQ" : "FAQ",
      source: "faq",
      sourceKey: `faq:${faq.id}`,
      sort: 200 + faq.sort,
    });
  }

  // 4) Цены калькулятора — один сводный факт на язык.
  for (const locale of LOCALES) {
    const list = rules.filter((rule) => rule.locale === locale);
    if (!list.length) continue;
    const content = list.map((rule) => `${rule.label}: $${rule.price}`).join("; ");
    facts.push({
      locale,
      title: locale === "ru" ? "Цены и калькулятор" : "Pricing and calculator",
      content: clean(
        locale === "ru"
          ? `Ориентировочные цены (USD, не финальная смета): ${content}. Точная стоимость фиксируется после обсуждения задачи.`
          : `Estimated prices (USD, not a final quote): ${content}. The exact price is fixed after discussing the scope.`,
      ),
      category: locale === "ru" ? "Цены" : "Pricing",
      source: "pricing",
      sourceKey: "pricing",
      sort: 5,
    });
  }

  // 5) Контакты из кабинета.
  if (settings) {
    for (const locale of LOCALES) {
      const contacts = [
        settings.email ? `Email: ${settings.email}` : "",
        settings.telegram ? `Telegram: ${settings.telegram}` : "",
        settings.whatsapp ? `WhatsApp: ${settings.whatsapp}` : "",
      ].filter(Boolean);
      if (!contacts.length) continue;
      facts.push({
        locale,
        title: locale === "ru" ? "Как связаться с DS DIGITAL" : "How to contact DS DIGITAL",
        content: contacts.join(". "),
        category: locale === "ru" ? "Контакты" : "Contacts",
        source: "contacts",
        sourceKey: "contacts",
        sort: 6,
      });
    }
  }

  // 6) О компании и процессе — из контента сайта.
  for (const locale of LOCALES) {
    const site = SITE[locale];
    facts.push({
      locale,
      title: locale === "ru" ? "О DS DIGITAL" : "About DS DIGITAL",
      content: clean(site.hero.sub),
      category: locale === "ru" ? "О нас" : "About",
      source: "company",
      sourceKey: "company",
      sort: 1,
    });
    facts.push({
      locale,
      title: locale === "ru" ? "Как мы работаем" : "How we work",
      content: clean(site.process.steps.map((step) => `${step.title} — ${step.text}`).join(" ")),
      category: locale === "ru" ? "Процесс" : "Process",
      source: "process",
      sourceKey: "process",
      sort: 2,
    });
  }

  return facts.filter((fact) => fact.content.length > 0);
}

/** Переносит знания сайта в единую базу AI. Идемпотентно. */
export async function syncKnowledgeFromSite(): Promise<KnowledgeSyncResult> {
  const facts = await collectFacts();
  const result: KnowledgeSyncResult = { created: 0, updated: 0, removed: 0, bySource: {} };
  const keep: string[] = [];

  for (const fact of facts) {
    keep.push(fact.sourceKey);
    const existing = await db.aiKnowledgeItem.findUnique({
      where: { locale_sourceKey: { locale: fact.locale, sourceKey: fact.sourceKey } },
      select: { id: true },
    });

    if (existing) {
      await db.aiKnowledgeItem.update({
        where: { id: existing.id },
        data: {
          title: fact.title,
          content: fact.content,
          category: fact.category,
          sort: fact.sort,
          source: fact.source,
        },
      });
      result.updated += 1;
    } else {
      await db.aiKnowledgeItem.create({
        data: {
          locale: fact.locale,
          title: fact.title,
          content: fact.content,
          category: fact.category,
          sort: fact.sort,
          source: fact.source,
          sourceKey: fact.sourceKey,
          published: true,
        },
      });
      result.created += 1;
    }
    result.bySource[fact.source] = (result.bySource[fact.source] ?? 0) + 1;
  }

  // Удаляем только автоматические факты, которых больше нет на сайте.
  const removed = await db.aiKnowledgeItem.deleteMany({
    where: {
      source: { in: ["service", "article", "faq", "pricing", "contacts", "company", "process"] },
      sourceKey: { notIn: keep },
    },
  });
  result.removed = removed.count;

  return result;
}
