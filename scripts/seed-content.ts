import "dotenv/config";
import { db } from "../lib/db";
import { SERVICES } from "../lib/services";

/**
 * Первичное наполнение БД услугами из утверждённого списка направлений
 * (lib/services.ts — структурные данные из брифа, не «контент»).
 *
 * Идемпотентно: при наличии хотя бы одной услуги ничего не меняет.
 * Дальше источник истины — БД: правки делаются в админке.
 *
 * Запуск: npm run seed:content
 */
async function main() {
  const count = await db.service.count();
  if (count > 0) {
    console.log(`[seed] Услуг в БД уже ${count} — пропускаем (источник истины — БД).`);
    return;
  }

  for (let i = 0; i < SERVICES.length; i += 1) {
    const service = SERVICES[i];
    await db.service.create({
      data: {
        slug: service.slug,
        sort: i,
        published: true,
        translations: {
          create: [
            {
              locale: "ru",
              title: service.title.ru,
              hero: service.short.ru,
              problem: "",
              solution: "",
              benefits: [],
            },
            {
              locale: "en",
              title: service.title.en,
              hero: service.short.en,
              problem: "",
              solution: "",
              benefits: [],
            },
          ],
        },
      },
    });
  }

  console.log(`[seed] Создано услуг: ${SERVICES.length} (RU + EN).`);
}

main()
  .catch((err) => {
    console.error("[seed] Ошибка:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
