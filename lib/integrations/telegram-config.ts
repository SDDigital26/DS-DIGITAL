import { getSetting, setSetting, TELEGRAM_SETTINGS_KEY } from "@/lib/settings";

/**
 * Настройки Telegram-бота (ТЗ §14.3) из кабинета.
 * Токен — секрет: хранится отдельно от `Setting.site` и не уходит в публичные страницы.
 * Приоритет: значение из БД > переменные окружения (для обратной совместимости).
 */

export type TelegramConfig = {
  botToken: string;
  chatId: string;
  /** Отправлять уведомление о каждой новой заявке. */
  notifyOnLead: boolean;
  /** Дублировать в канал (если chatId — канал, достаточно одного чата; флаг на будущее). */
  enabled: boolean;
};

export type TelegramConfigPublic = {
  configured: boolean;
  tokenHint: string;
  chatId: string;
  notifyOnLead: boolean;
  enabled: boolean;
  source: "database" | "env" | "none";
};

export const DEFAULT_TELEGRAM_CONFIG: TelegramConfig = {
  botToken: "",
  chatId: "",
  notifyOnLead: true,
  enabled: false,
};

function mask(value: string): string {
  return value ? `${"•".repeat(Math.max(0, value.length - 4))}${value.slice(-4)}` : "";
}

export async function getTelegramConfig(): Promise<TelegramConfig> {
  const stored = await getSetting<Partial<TelegramConfig>>(TELEGRAM_SETTINGS_KEY).catch(() => null);
  const envToken = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
  const envChat = process.env.TELEGRAM_CHAT_ID?.trim() ?? "";

  if (stored?.botToken || stored?.chatId) {
    return { ...DEFAULT_TELEGRAM_CONFIG, ...stored };
  }
  if (envToken || envChat) {
    return {
      ...DEFAULT_TELEGRAM_CONFIG,
      botToken: envToken,
      chatId: envChat,
      enabled: Boolean(envToken && envChat),
    };
  }
  return DEFAULT_TELEGRAM_CONFIG;
}

/** Синхронная проверка для адаптера (env или БД читаются отдельно). */
export async function isTelegramReady(): Promise<boolean> {
  const config = await getTelegramConfig();
  return config.enabled && Boolean(config.botToken && config.chatId);
}

export function publicTelegramConfig(config: TelegramConfig): TelegramConfigPublic {
  const fromDb = Boolean(config.botToken || config.chatId);
  return {
    configured: Boolean(config.botToken && config.chatId),
    tokenHint: mask(config.botToken),
    chatId: config.chatId,
    notifyOnLead: config.notifyOnLead,
    enabled: config.enabled,
    source: fromDb ? "database" : config.botToken || config.chatId ? "env" : "none",
  };
}

export async function saveTelegramConfig(config: TelegramConfig): Promise<void> {
  await setSetting(TELEGRAM_SETTINGS_KEY, config);
}
