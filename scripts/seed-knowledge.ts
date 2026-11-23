import "dotenv/config";
import { syncKnowledgeFromSite } from "../lib/ai/knowledge-sync";
import { db } from "../lib/db";

/**
 * Синхронизация единой базы знаний AI с контентом сайта:
 * услуги, статьи блога, FAQ, цены калькулятора, контакты, о компании и процесс.
 * Ручные факты из /admin/knowledge не затрагиваются.
 *
 * Запуск: npm run knowledge:sync (или кнопка в /admin/knowledge).
 */
async function main() {
  const result = await syncKnowledgeFromSite();
  console.log(
    `[knowledge] created ${result.created}, updated ${result.updated}, removed ${result.removed}`,
  );
  console.log("[knowledge] by source:", result.bySource);
}

main()
  .catch((err) => {
    console.error("[knowledge]", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
