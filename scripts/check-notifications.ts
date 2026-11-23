import "dotenv/config";
import { db } from "../lib/db";

/** Диагностика доставки уведомлений по последним заявкам. */
async function main() {
  const leads = await db.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: 3,
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      notifications: {
        select: { channel: true, status: true, attempts: true, lastError: true, sentAt: true },
      },
    },
  });

  for (const lead of leads) {
    console.log(
      `\n#${lead.id.slice(-6)} ${lead.createdAt.toISOString()} — ${lead.name ?? "—"} — ${lead.description.slice(0, 40)}`,
    );
    for (const n of lead.notifications) {
      console.log(
        `  ${n.channel}: ${n.status} (attempts ${n.attempts})${n.sentAt ? ` at ${n.sentAt.toISOString()}` : ""}${n.lastError ? ` — ${n.lastError}` : ""}`,
      );
    }
  }
}

main()
  .catch((err) => {
    console.error("[check-notifications]", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
