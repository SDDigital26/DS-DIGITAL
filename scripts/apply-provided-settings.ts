import "dotenv/config";
import { getSetting, setSetting, SITE_SETTINGS_KEY, EMAIL_PROVIDER_SETTINGS_KEY, S3_PROVIDER_SETTINGS_KEY, TELEGRAM_SETTINGS_KEY } from "../lib/settings";
import type { SiteSettings } from "../lib/site-settings";
import type { EmailProviderConfig } from "../lib/integrations/email-config";
import type { S3Config } from "../lib/integrations/s3-config";
import type { TelegramConfig } from "../lib/integrations/telegram-config";

/**
 * Применяет значения, переданные владельцем через локальный `.env`.
 * Секреты не попадают в репозиторий и не выводятся в лог.
 * Запуск: npm run settings:apply-provided
 */

function mask(value: string): string {
  return value ? `${"•".repeat(Math.max(0, value.length - 4))}${value.slice(-4)}` : "";
}

async function main() {
  const email = process.env.PROVIDED_EMAIL?.trim() ?? "";
  const telegramToken = process.env.PROVIDED_TELEGRAM_TOKEN?.trim() ?? "";
  const s3Secret = process.env.PROVIDED_S3_SECRET?.trim() ?? "";
  if (!email && !telegramToken && !s3Secret) {
    console.log("[settings] nothing to apply");
    return;
  }

  if (email) {
    const site = (await getSetting<Partial<SiteSettings>>(SITE_SETTINGS_KEY)) ?? {};
    await setSetting(SITE_SETTINGS_KEY, { ...site, email, whatsapp: "" });
    const mail = (await getSetting<Partial<EmailProviderConfig>>(EMAIL_PROVIDER_SETTINGS_KEY)) ?? {};
    await setSetting(EMAIL_PROVIDER_SETTINGS_KEY, { ...mail, from: email });
    console.log(`[settings] email applied: ${mask(email)}`);
  }

  if (telegramToken) {
    const site = (await getSetting<Partial<SiteSettings>>(SITE_SETTINGS_KEY)) ?? {};
    if (!site.telegram || site.telegram.includes("DEMO")) {
      await setSetting(SITE_SETTINGS_KEY, { ...site, telegram: "" });
    }
    const current = (await getSetting<Partial<TelegramConfig>>(TELEGRAM_SETTINGS_KEY)) ?? {};
    await setSetting(TELEGRAM_SETTINGS_KEY, {
      botToken: telegramToken,
      chatId: current.chatId ?? "",
      notifyOnLead: current.notifyOnLead ?? true,
      // Включаем только после указания chatId в кабинете.
      enabled: false,
    });
    console.log(`[settings] telegram token applied: ${mask(telegramToken)} (needs chatId)`);
  }

  if (s3Secret) {
    const current = (await getSetting<Partial<S3Config>>(S3_PROVIDER_SETTINGS_KEY)) ?? {};
    await setSetting(S3_PROVIDER_SETTINGS_KEY, { ...current, secretKey: s3Secret });
    console.log(`[settings] S3 secret applied: ${mask(s3Secret)} (needs endpoint/bucket/access key)`);
  }
}

main()
  .catch((err) => {
    console.error("[settings]", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await dbDisconnect();
  });

async function dbDisconnect() {
  const { db } = await import("../lib/db");
  await db.$disconnect();
}
