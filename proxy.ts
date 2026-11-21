import { NextRequest, NextResponse } from "next/server";
import { LOCALE_COOKIE, defaultLocale, isLocale } from "@/lib/i18n/config";
import { SESSION_COOKIE } from "@/lib/session-cookie";

function detectLocale(request: NextRequest): string {
  // 1. Сохранённый выбор пользователя — приоритет (ТЗ §15, без повторного авто-переключения)
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  if (saved && isLocale(saved)) return saved;

  // 2. Accept-Language только при первом посещении
  const header = request.headers.get("accept-language") ?? "";
  const preferred = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q)
    .map((entry) => entry.tag.split("-")[0]);

  for (const tag of preferred) {
    if (isLocale(tag)) return tag;
  }
  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Корень → редирект на определённый язык
  if (pathname === "/") {
    const locale = detectLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    const response = NextResponse.redirect(url);
    // Сохраняем выбор только если он уже был; при первом авто-определении тоже фиксируем,
    // чтобы следующие визиты не «дёргали» язык (ТЗ §15).
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  const firstSegment = pathname.split("/")[1];
  const knownLocale = isLocale(firstSegment);

  // Админка: без сессионной cookie — сразу 307 на страницу входа.
  // Это внешняя граница без обращения к БД; основной контроль — серверный гард
  // в layout (проверка сессии в PostgreSQL). API админки cookie не требует —
  // роуты отвечают 401/403 JSON.
  const isAdminPage =
    (pathname === "/admin" || pathname.startsWith("/admin/")) && pathname !== "/admin/login";
  if (isAdminPage) {
    const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!knownLocale) {
    // Маршруты без префикса языка пропускаем: статика, API и админка.
    // /admin нельзя отправлять на /en/admin — это другой маршрут (404).
    const isPrefixless =
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api") ||
      pathname === "/admin" ||
      pathname.startsWith("/admin/") ||
      pathname.includes(".") ||
      pathname === "/robots.txt" ||
      pathname === "/sitemap.xml";
    if (isPrefixless) return NextResponse.next();

    const locale = detectLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
