import { NextResponse } from "next/server";
import { connection } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/health — для Docker healthcheck и мониторинга.
 * Проверяет реальную доступность PostgreSQL (не только процесс).
 * Не раскрывает версии/конфигурацию.
 * connection() — вычисление на запросе, иначе cacheComponents закеширует ответ.
 */

export async function GET() {
  await connection();
  const started = Date.now();

  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: "ok", db: "ok", latencyMs: Date.now() - started },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { status: "degraded", db: "unavailable" },
      { status: 503 },
    );
  }
}
