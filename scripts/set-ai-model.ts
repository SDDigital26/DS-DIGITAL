import "dotenv/config";
import { db } from "../lib/db";
import { getAiProviderConfig, saveAiProviderConfig } from "../lib/ai/provider-config";
import { testAiProvider } from "../lib/ai/client";

/**
 * Смена модели AI-провайдера без правки кода:
 *   npx tsx scripts/set-ai-model.ts gemini-3.5-flash-lite
 * Скрипт проверяет реальный запрос к провайдеру перед сохранением.
 */
async function main() {
  const requested = process.argv[2]?.trim();
  const config = await getAiProviderConfig();

  if (!requested) {
    console.log(`[ai] текущая модель: ${config.model} (провайдер ${config.provider})`);
    console.log("[ai] указать новую: npx tsx scripts/set-ai-model.ts <model-id>");
    return;
  }

  const candidate = { ...config, model: requested };
  try {
    const test = await testAiProvider(candidate);
    console.log(`[ai] проверка модели ${requested}: ok ("${test.sample}")`);
    await saveAiProviderConfig(candidate);
    console.log(`[ai] модель сохранена: ${requested}`);
  } catch (err) {
    console.error(`[ai] модель ${requested} не отвечает:`, err instanceof Error ? err.message : err);
    process.exitCode = 1;
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
