import "dotenv/config";
import { db } from "../lib/db";
import { generatePassword, hashPassword } from "../lib/password";

/**
 * Создание первого владельца (OWNER) админки.
 *
 * Запуск: npm run seed:owner
 *
 * Учётные данные НЕ выдумываются:
 * - OWNER_EMAIL читается из переменных окружения (обязателен);
 * - OWNER_PASSWORD — из окружения, либо генерируется случайно
 *   и показывается ОДИН раз в терминале (не сохраняется в файлы/логи).
 *
 * Скрипт идемпотентен: при наличии OWNER ничего не меняет.
 */
async function main() {
  const ownerCount = await db.user.count({ where: { role: "OWNER" } });
  if (ownerCount > 0) {
    console.log("[seed] OWNER уже существует — ничего не меняем.");
    return;
  }

  const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
  if (!email) {
    console.error(
      "[seed] Не задан OWNER_EMAIL.\n" +
        "Пример: OWNER_EMAIL=you@example.com OWNER_PASSWORD=... npm run seed:owner",
    );
    process.exitCode = 1;
    return;
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    console.log(
      `[seed] Пользователь ${email} уже существует (роль ${existing.role}) — не перезаписываем. Задайте другой OWNER_EMAIL или смените роль вручную.`,
    );
    return;
  }

  const envPassword = process.env.OWNER_PASSWORD?.trim();
  const password = envPassword || generatePassword();

  await db.user.create({
    data: {
      email,
      passwordHash: hashPassword(password),
      role: "OWNER",
      active: true,
      name: process.env.OWNER_NAME?.trim() || null,
    },
  });

  console.log(`[seed] Создан OWNER: ${email}`);
  if (envPassword) {
    console.log("[seed] Пароль взят из OWNER_PASSWORD.");
  } else {
    console.log("[seed] Сгенерированный пароль (показан один раз, сохраните сейчас):");
    console.log(`        ${password}`);
  }
}

main()
  .catch((err) => {
    console.error("[seed] Ошибка:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
