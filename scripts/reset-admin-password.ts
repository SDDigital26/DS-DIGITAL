import "dotenv/config";
import { db } from "../lib/db";
import { hashPassword } from "../lib/password";

/**
 * Сброс пароля администратора без деплоя:
 *   npx tsx scripts/reset-admin-password.ts <email> "<новый пароль>"
 * Пароль в лог не печатается; все активные сессии пользователя отзываются.
 */
async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password || password.length < 8) {
    console.error("[reset] использование: npx tsx scripts/reset-admin-password.ts <email> \"пароль (мин. 8 символов)\"");
    process.exitCode = 1;
    return;
  }

  const user = await db.user.findUnique({ where: { email: email.toLowerCase() }, select: { id: true, role: true } });
  if (!user) {
    console.error(`[reset] пользователь ${email} не найден`);
    process.exitCode = 1;
    return;
  }

  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashPassword(password),
        failedAttempts: 0,
        lockedUntil: null,
      },
    }),
    db.session.deleteMany({ where: { userId: user.id } }),
  ]);

  console.log(`[reset] пароль обновлён для ${email} (${user.role}); активные сессии отозваны.`);
}

main()
  .catch((err) => {
    console.error("[reset]", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
