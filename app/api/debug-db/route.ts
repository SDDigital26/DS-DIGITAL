import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/** ВРЕМЕННАЯ диагностика подключения к БД (удалить после проверки). */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      name: e instanceof Error ? e.name : "unknown",
      message: e instanceof Error ? e.message.slice(0, 300) : String(e),
      code: (e as { code?: string })?.code ?? null,
    });
  }
}
