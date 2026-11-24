import "dotenv/config";
import { db } from "../lib/db";

/** Какие картинки у кейсов (URL/alt) — проверка «добавлю фото/ссылку». */
async function main() {
  const rows = await db.projectImage.findMany({
    take: 8,
    select: { url: true, type: true, altRu: true, project: { select: { slug: true, published: true } } },
  });
  console.log(`[images] всего записей: ${rows.length}`);
  for (const row of rows) {
    console.log(`  ${row.project.slug} (${row.type}): ${row.url.slice(0, 90)}`);
  }
}

main()
  .catch((err) => {
    console.error("[images]", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
