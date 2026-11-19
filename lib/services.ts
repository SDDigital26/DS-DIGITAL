import type { Locale } from "@/lib/i18n/config";

/**
 * Семь основных направлений (ТЗ Док.2 §8).
 * Названия — из утверждённого брифа. Описания — только фактические формулировки
 * без вымышленных кейсов/цифр (ТЗ §4).
 */
export type Service = {
  slug: string;
  title: Record<Locale, string>;
  short: Record<Locale, string>;
};

export const SERVICES: Service[] = [
  {
    slug: "web-development",
    title: { ru: "Web Development", en: "Web Development" },
    short: {
      ru: "Разработка сайтов: корпоративные сайты, лендинги, интернет-магазины.",
      en: "Website development: corporate sites, landing pages, online stores.",
    },
  },
  {
    slug: "web-applications",
    title: { ru: "Web Applications", en: "Web Applications" },
    short: {
      ru: "Разработка веб-приложений и сложных интерфейсных систем.",
      en: "Web application development and complex interface systems.",
    },
  },
  {
    slug: "crm-development",
    title: { ru: "CRM Development", en: "CRM Development" },
    short: {
      ru: "Разработка CRM-систем под бизнес-процессы компании.",
      en: "CRM systems tailored to your business processes.",
    },
  },
  {
    slug: "ai-solutions",
    title: { ru: "AI Solutions", en: "AI Solutions" },
    short: {
      ru: "Решения на основе искусственного интеллекта.",
      en: "Artificial intelligence based solutions.",
    },
  },
  {
    slug: "business-automation",
    title: { ru: "Business Automation", en: "Business Automation" },
    short: {
      ru: "Автоматизация бизнес-процессов и цифровизация.",
      en: "Business process automation and digitalization.",
    },
  },
  {
    slug: "telegram-bots",
    title: { ru: "Telegram Bots & Mini Apps", en: "Telegram Bots & Mini Apps" },
    short: {
      ru: "Telegram-боты и мини-приложения.",
      en: "Telegram bots and mini apps.",
    },
  },
  {
    slug: "api-integrations",
    title: { ru: "API Integrations", en: "API Integrations" },
    short: {
      ru: "Интеграция внешних сервисов и API.",
      en: "External services and API integration.",
    },
  },
];

export function getService(slug: string): Service | undefined {
  return SERVICES.find((s) => s.slug === slug);
}
