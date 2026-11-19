import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { login } from "@/lib/auth";

/**
 * POST /api/auth/login — вход в админку.
 * Rate limit по IP: 5 попыток/мин (защита перебора, ТЗ §21.3).
 * Ошибки не уточняют, существует ли email.
 */

export async function POST(request: NextRequest) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password || email.length > 200 || password.length > 200) {
    return NextResponse.json({ error: "invalid credentials" }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await checkRateLimit(`login:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "too many requests", retryAfterSec: rl.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const ok = await login(email, password);
  if (!ok) {
    // Одинаковый ответ для любых причин — без перечисления причин.
    return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
