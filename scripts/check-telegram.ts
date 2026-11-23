import "dotenv/config";
import { getTelegramConfig, publicTelegramConfig } from "../lib/integrations/telegram-config";
import { sendTelegram } from "../lib/integrations/telegram";
import { db } from "../lib/db";

/** Разовая проверка: реальная отправка тестового сообщения в настроенный чат. */
async function main() {
  const config = await getTelegramConfig();
  const pub = publicTelegramConfig(config);
  console.log("[telegram] configured:", pub.configured, "chat:", pub.chatId, "source:", pub.source);
  if (!pub.configured) {
    console.log("[telegram] skip: token/chat missing");
    return;
  }
  const result = await sendTelegram({ text: "DS DIGITAL — проверка уведомлений. Это тест, заявка не создавалась." });
  console.log("[telegram] send:", result.ok ? "ok" : `failed (${result.error ?? "unknown"})`);
}

main()
  .catch((err) => console.error("[telegram]", err instanceof Error ? err.message : err))
  .finally(async () => db.$disconnect());
