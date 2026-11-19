import { db } from "@/lib/db";

/**
 * Rate limit с фиксированным окном на PostgreSQL-таблице RateLimitEntry
 * (Док.2 §21.3). Не in-memory — иначе не работает при нескольких инстансах (риск R-7).
 *
 * Схема таблицы: составной PK [bucket, windowStart], счётчик count.
 * Гонка конкурентных запросов в границах окна допустима (±1): это публичные
 * формы, а не денежные операции — критических последствий нет.
 */

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
};

export async function checkRateLimit(
  bucket: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = new Date(windowStartMs(windowMs, now));
  const key = { bucket_windowStart: { bucket, windowStart } };

  // Пробуем зафиксировать счётчик атомарно.
  const entry = await db.rateLimitEntry
    .upsert({
      where: key,
      create: { bucket, windowStart, count: 1 },
      update: { count: { increment: 1 } },
      select: { count: true },
    })
    .catch(() => null);

  // Если запись не создалась (гонка или БД недоступна) — не блокируем форму,
  // но считаем лимит по фактическому счётчику, если он есть.
  if (!entry) {
    const existing = await db.rateLimitEntry
      .findUnique({ where: key, select: { count: true } })
      .catch(() => null);
    if (existing && existing.count >= limit) {
      return { ok: false, remaining: 0, retryAfterSec: retryAfter(windowMs, now) };
    }
    return { ok: true, remaining: Math.max(0, limit - (existing?.count ?? 0)), retryAfterSec: 0 };
  }

  if (entry.count > limit) {
    return { ok: false, remaining: 0, retryAfterSec: retryAfter(windowMs, now) };
  }

  return {
    ok: true,
    remaining: Math.max(0, limit - entry.count),
    retryAfterSec: 0,
  };
}

function windowStartMs(windowMs: number, now: number): number {
  return Math.floor(now / windowMs) * windowMs;
}

function retryAfter(windowMs: number, now: number): number {
  const start = windowStartMs(windowMs, now);
  return Math.max(1, Math.ceil((start + windowMs - now) / 1000));
}

/** Очистка старых окон (вызывать периодически, не в горячем пути). */
export async function cleanupRateLimit(windowMs: number): Promise<number> {
  const cutoff = new Date(Date.now() - windowMs * 2);
  const res = await db.rateLimitEntry
    .deleteMany({ where: { windowStart: { lt: cutoff } } })
    .catch(() => ({ count: 0 }));
  return res.count;
}
