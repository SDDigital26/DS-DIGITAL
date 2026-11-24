import "dotenv/config";
import { db } from "../lib/db";

/** Кто есть в системе (без секретов) — для диагностики входа в кабинет. */
async function main() {
  const users = await db.user.findMany({
    select: { email: true, role: true, active: true, lastLoginAt: true },
    orderBy: { role: "asc" },
  });
  console.log(`[users] всего: ${users.length}`);
  for (const user of users) {
    console.log(
      `  ${user.email} · ${user.role} · ${user.active ? "активен" : "выключен"} · вход: ${
        user.lastLoginAt ? user.lastLoginAt.toISOString() : "никогда"
      }`,
    );
  }
}

main()
  .catch((err) => {
    console.error("[users]", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
