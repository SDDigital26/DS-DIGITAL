import { db } from "@/lib/db";

/**
 * Типизированный доступ к настройкам (таблица `Setting`, ключ → JSON).
 * Настройки — контент, который правится в админке, а не в коде (ТЗ §17).
 */

export const CALCULATOR_SETTING_KEY = "calculator";
export const SITE_SETTINGS_KEY = "site";
export const SEO_DEFAULTS_KEY = "seo";
/** Секретные настройки внешнего AI-провайдера (только сервер, см. lib/ai/provider-config). */
export const AI_PROVIDER_SETTINGS_KEY = "ai-provider";
/** Секретные настройки Telegram-бота (только сервер, см. lib/integrations/telegram-config). */
export const TELEGRAM_SETTINGS_KEY = "telegram";
/** Секретные настройки email-уведомлений (только сервер). */
export const EMAIL_PROVIDER_SETTINGS_KEY = "email-provider";

export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  const row = await db.setting.findUnique({ where: { key } });
  if (!row) return null;
  return row.value as T;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await db.setting.upsert({
    where: { key },
    create: { key, value: value as never },
    update: { value: value as never },
  });
}
