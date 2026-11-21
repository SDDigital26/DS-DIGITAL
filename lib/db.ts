import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

/**
 * Prisma singleton — один инстанс на процесс (иначе исчерпание пула, риск R-6).
 * Prisma 7 подключается через driver adapter (@prisma/adapter-pg),
 * строка берётся из DATABASE_URL (серверная переменная, ТЗ §21.5).
 *
 * Без DATABASE_URL (например, при сборке в CI) берём фиктивную строку:
 * клиент конструируется, но запросы не выполняются — сборка не падает,
 * а реальные запросы в проде всегда идут с настоящим URL из окружения.
 */

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@localhost:5432/ds_digital";

// Supabase-пулер в этой сети отдаёт самоподписанный сертификат: явно включаем
// TLS без проверки цепочки (аналог `sslmode=require` с rejectUnauthorized=false).
// Для локального PostgreSQL флаг не нужен и не включается.
const isSupabase = /supabase\.com/i.test(connectionString);
const adapter = new PrismaPg({
  connectionString,
  ...(isSupabase ? { ssl: { rejectUnauthorized: false } } : {}),
});

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
