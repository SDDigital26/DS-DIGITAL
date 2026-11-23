import "dotenv/config";
import { db } from "../lib/db";
import { getSetting, setSetting, SITE_SETTINGS_KEY } from "../lib/settings";
import type { SiteSettings } from "../lib/site-settings";

/**
 * ТЕСТОВЫЕ ДАННЫЕ ДЛЯ ПРИЁМКИ (23.11.2026).
 * Всё помечено как демо — заказчик заменяет это в кабинете.
 * Скрипт идемпотентен: обновляет только свои записи по slug/признаку.
 */

type ProjectSeed = {
  slug: string;
  sort: number;
  category: string;
  ru: { title: string; summary: string; description: string; task: string; solution: string; features: string[]; tech: string[] };
  en: { title: string; summary: string; description: string; task: string; solution: string; features: string[]; tech: string[] };
};

const NOTE_RU = "Тестовые данные для приёмки интерфейса. Заменить реальным кейсом в админке /admin/projects.";
const NOTE_EN = "Acceptance test data. Replace with a real case in /admin/projects.";

const PROJECTS: ProjectSeed[] = [
  {
    slug: "demo-corporate-site",
    sort: 1,
    category: "Сайты",
    ru: {
      title: "Корпоративный сайт [ДЕМО]",
      summary: "Демонстрационный кейс: адаптивный сайт с формой заявки и двумя языками.",
      description: NOTE_RU,
      task: "Проверить вывод карточки кейса, тегов и короткого описания.",
      solution: "Тестовая запись создана для проверки сетки, фильтров и страницы проекта.",
      features: ["Адаптивная вёрстка", "Форма заявки", "RU/EN", "Админка контента"],
      tech: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
    },
    en: {
      title: "Corporate website [DEMO]",
      summary: "Demo case: responsive website with a contact form and two languages.",
      description: NOTE_EN,
      task: "Check the project card, tags and short summary layout.",
      solution: "Test entry created to verify the grid, filters and project page.",
      features: ["Responsive layout", "Contact form", "RU/EN", "Content admin"],
      tech: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
    },
  },
  {
    slug: "demo-crm-orders",
    sort: 2,
    category: "CRM",
    ru: {
      title: "CRM для заказов [ДЕМО]",
      summary: "Демонстрационный кейс: учёт заявок, клиентов и статусов.",
      description: NOTE_RU,
      task: "Проверить компактные карточки проектов и фильтры в админке.",
      solution: "Тестовая запись для проверки интерфейса и карточек.",
      features: ["Заявки", "Клиенты", "Статусы", "Уведомления"],
      tech: ["Next.js", "PostgreSQL", "Prisma", "REST API"],
    },
    en: {
      title: "Order CRM [DEMO]",
      summary: "Demo case: leads, clients and statuses tracking.",
      description: NOTE_EN,
      task: "Check compact project cards and admin filters.",
      solution: "Test entry for verifying the UI and cards.",
      features: ["Leads", "Clients", "Statuses", "Notifications"],
      tech: ["Next.js", "PostgreSQL", "Prisma", "REST API"],
    },
  },
  {
    slug: "demo-telegram-bot",
    sort: 3,
    category: "Telegram-боты",
    ru: {
      title: "Telegram-бот записи [ДЕМО]",
      summary: "Демонстрационный кейс: бот для записи и уведомлений.",
      description: NOTE_RU,
      task: "Проверить отображение категории и стека технологий в карточке.",
      solution: "Тестовая запись для приёмки карточек и блока проектов.",
      features: ["Запись", "Уведомления", "Админка", "Логи"],
      tech: ["Node.js", "Telegram Bot API", "PostgreSQL"],
    },
    en: {
      title: "Booking Telegram bot [DEMO]",
      summary: "Demo case: booking and notification bot.",
      description: NOTE_EN,
      task: "Check category and technology chips on the card.",
      solution: "Test entry for project card acceptance.",
      features: ["Booking", "Notifications", "Admin panel", "Logs"],
      tech: ["Node.js", "Telegram Bot API", "PostgreSQL"],
    },
  },
  {
    slug: "demo-ai-assistant",
    sort: 4,
    category: "AI",
    ru: {
      title: "AI-ассистент [ДЕМО]",
      summary: "Демонстрационный кейс: консультант на сайте с базой знаний.",
      description: NOTE_RU,
      task: "Проверить блок AI и связь с базой знаний.",
      solution: "Тестовая запись для проверки виджета и сценария.",
      features: ["Диалог", "База знаний", "Заявки", "Фолбэк"],
      tech: ["Next.js", "LLM API", "n8n", "PostgreSQL"],
    },
    en: {
      title: "AI assistant [DEMO]",
      summary: "Demo case: website consultant backed by a knowledge base.",
      description: NOTE_EN,
      task: "Check the AI block and knowledge base connection.",
      solution: "Test entry for widget and scenario verification.",
      features: ["Chat", "Knowledge base", "Leads", "Fallback"],
      tech: ["Next.js", "LLM API", "n8n", "PostgreSQL"],
    },
  },
];

const TESTIMONIALS = [
  {
    authorName: "Тестовый клиент [ДЕМО]",
    authorRole: "Для проверки вёрстки",
    text: "Демонстрационный отзыв для приёмки блока отзывов. Заменить реальным отзывом после согласия автора.",
    locale: "ru",
  },
  {
    authorName: "Demo client [DEMO]",
    authorRole: "Layout check only",
    text: "Acceptance test review. Replace with a real approved testimonial.",
    locale: "en",
  },
];

async function main() {
  for (const seed of PROJECTS) {
    const existing = await db.project.findUnique({ where: { slug: seed.slug }, select: { id: true } });
    const data = {
      slug: seed.slug,
      status: "live",
      published: true,
      sort: seed.sort,
      translations: {
        upsert: (["ru", "en"] as const).map((locale) => {
          const value = seed[locale];
          return {
            where: { projectId_locale: { projectId: existing?.id ?? "", locale } },
            create: { locale, ...value, category: seed.category, seoTitle: value.title, seoDesc: value.summary },
            update: { ...value, category: seed.category, seoTitle: value.title, seoDesc: value.summary },
          };
        }),
      },
    };
    if (existing) {
      await db.project.update({
        where: { id: existing.id },
        data: { status: data.status, published: true, sort: seed.sort, translations: data.translations },
      });
      console.log(`[demo] обновлён проект: ${seed.slug}`);
    } else {
      const created = await db.project.create({
        data: {
          slug: seed.slug,
          status: "live",
          published: true,
          sort: seed.sort,
          translations: {
            create: (["ru", "en"] as const).map((locale) => {
              const value = seed[locale];
              return { locale, ...value, category: seed.category, seoTitle: value.title, seoDesc: value.summary };
            }),
          },
        },
      });
      await db.projectImage.create({
        data: {
          projectId: created.id,
          url: "/cases/rideflow/calendar.webp",
          altRu: "Тестовое изображение",
          altEn: "Test image",
          type: "cover",
          sort: 0,
        },
      });
      console.log(`[demo] создан проект: ${seed.slug}`);
    }
  }

  for (const [index, item] of TESTIMONIALS.entries()) {
    const existing = await db.testimonial.findFirst({
      where: { authorName: item.authorName, locale: item.locale },
      select: { id: true },
    });
    const data = { ...item, approved: true, consentAt: new Date(), sort: 20 + index };
    if (existing) {
      await db.testimonial.update({ where: { id: existing.id }, data });
      console.log(`[demo] обновлён отзыв: ${item.authorName}`);
    } else {
      await db.testimonial.create({ data });
      console.log(`[demo] создан отзыв: ${item.authorName}`);
    }
  }

  // Тестовые контакты — заменяются владельцем в /admin/settings.
  const current = (await getSetting<Partial<SiteSettings>>(SITE_SETTINGS_KEY)) ?? {};
  await setSetting(SITE_SETTINGS_KEY, {
    ...current,
    telegram: "DEMO_DO_NOT_USE",
    email: "demo@example.com",
    whatsapp: "",
  });
  console.log("[demo] контакты: тестовые значения (заменить в /admin/settings)");
}

main()
  .catch((err) => {
    console.error("[seed:demo]", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
