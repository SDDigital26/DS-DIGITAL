import "dotenv/config";
import { db } from "../lib/db";
import { TELEGRAM_SETTINGS_KEY } from "../lib/settings";
import { sendTelegramRaw } from "../lib/integrations/telegram";

/** Диагностика Telegram-конфига из кабинета: без печати токена. */
async function main() {
  const raw = await db.setting.findUnique({ where: { key: TELEGRAM_SETTINGS_KEY } });
  const config = (raw?.value ?? {}) as { botToken?: string; chatId?: string; enabled?: boolean; notifyOnLead?: boolean };
  const token = config.botToken ?? "";
  const chatId = config.chatId ?? "";

  console.log(`[tg] token length: ${token.length}`);
  console.log(`[tg] token format ok (digits:id): ${/^\d+:[A-Za-z0-9_-]{30,}$/.test(token)}`);
  console.log(`[tg] token prefix: ${token.split(":")[0] ?? "—"}`);
  console.log(`[tg] chatId: ${chatId || "—"} · enabled: ${Boolean(config.enabled)} · notifyOnLead: ${Boolean(config.notifyOnLead)}`);

  if (token && chatId) {
    const result = await sendTelegramRaw(token, chatId, "DS DIGITAL — диагностика из кабинета ✅");
    console.log(`[tg] sendMessage: ${result.ok ? "ok" : `failed → ${result.error}`}`);
  } else {
    console.log("[tg] token или chatId пуст — тест пропущен");
  }
}

main()
  .catch((err) => {
    console.error("[tg]", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
