import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";

export { hashPassword, verifyPassword };

/**
 * Сессии и роли админки (Док.2 §16, ТЗ §21).
 *
 * - пароль: scrypt + уникальная соль (без bcrypt-зависимости);
 * - сессия: opaque-токен в HttpOnly cookie, хранится в Session (не JWT) —
 *   позволяет немедленно отозвать выходом;
 * - PII/секреты в логи не пишем.
 */

export const SESSION_COOKIE = "ds_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 дней

export type Role = "OWNER" | "ADMIN" | "EDITOR" | "MANAGER";

export const ROLE_RANK: Record<Role, number> = {
  MANAGER: 1,
  EDITOR: 2,
  ADMIN: 3,
  OWNER: 4,
};

export function isRole(value: unknown): value is Role {
  return value === "OWNER" || value === "ADMIN" || value === "EDITOR" || value === "MANAGER";
}

/** Проверка пароля и создание сессии. */
export async function login(email: string, password: string): Promise<boolean> {
  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !user.active) {
    // Одинаковый ответ и для несуществующего, и для неверного — без enumeration.
    return false;
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return false;
  }

  if (!verifyPassword(password, user.passwordHash)) {
    const failed = user.failedAttempts + 1;
    await db.user.update({
      where: { id: user.id },
      data: {
        failedAttempts: failed,
        // блокировка после 5 неудачных попыток на 15 минут
        lockedUntil: failed >= 5 ? new Date(Date.now() + 15 * 60_000) : null,
      },
    });
    return false;
  }

  const token = randomBytes(32).toString("base64url");
  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    }),
    db.session.create({
      data: {
        id: token,
        userId: user.id,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        ipHash: hashIp(null),
      },
    }),
  ]);

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });

  return true;
}

export async function logout(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { id: token } }).catch(() => undefined);
  }
  jar.delete(SESSION_COOKIE);
}

export type SessionUser = { id: string; email: string; role: Role; name: string | null };

/** Текущий пользователь из cookie-сессии или null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { id: token },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  if (!session.user.active) return null;
  if (!isRole(session.user.role)) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role,
    name: session.user.name,
  };
}

/** Требует роль не ниже minRole; иначе null (роут сам отдаёт 401/403). */
export async function requireRole(minRole: Role): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return ROLE_RANK[user.role] >= ROLE_RANK[minRole] ? user : null;
}

// ─────────────────────── Хеши паролей ───────────────────────
// Реализация — в lib/password.ts (используется и скриптами вне Next).

/** IP хешируется — в логах/БД не храним сырой адрес (ТЗ §21.14). */
function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}
