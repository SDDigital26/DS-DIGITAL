import "dotenv/config";
import { db } from "../lib/db";
import { getAiProviderConfig } from "../lib/ai/provider-config";
import { testAiProvider } from "../lib/ai/client";

/** Проверка подключённого AI-провайдера (без вывода секрета). */
async function main() {
  const config = await getAiProviderConfig();
  console.log("[ai] provider:", config.provider);
  console.log("[ai] baseUrl:", config.baseUrl);
  console.log("[ai] model:", config.model);
  console.log("[ai] apiKey set:", Boolean(config.apiKey), config.apiKey ? `(${config.apiKey.length} chars)` : "");
  console.log("[ai] webhook:", config.webhookUrl ? "set" : "not set");
  console.log("[ai] scenario:", config.scenario ? `${config.scenario.length} chars` : "not set");

  if (config.provider !== "scripted" && config.apiKey) {
    try {
      const result = await testAiProvider(config);
      console.log("[ai] test:", result.ok ? `ok — "${result.sample}"` : "failed");
    } catch (err) {
      console.log("[ai] test failed:", err instanceof Error ? err.message : err);
    }
  }
}

main()
  .catch((err) => {
    console.error("[ai]", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
