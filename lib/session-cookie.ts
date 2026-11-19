/**
 * Имя сессионной cookie админки.
 * Вынесено в чистый модуль: middleware не может импортировать lib/auth
 * (он тянет next/headers и Prisma), но имя cookie нужно обоим.
 */
export const SESSION_COOKIE = "ds_session";
