import { NextRequest, NextResponse } from "next/server";
import { LOCALE_COOKIE, defaultLocale, isLocale } from "@/lib/i18n/config";

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

export function middleware(request: NextRequest) {
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

  if (!knownLocale) {
    // Маршруты без префикса языка (favicon, robots, sitemap, api) пропускаем,
    // остальное — на язык по умолчанию
    const isStaticish =
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api") ||
      pathname.includes(".") ||
      pathname === "/robots.txt" ||
      pathname === "/sitemap.xml";
    if (isStaticish) return NextResponse.next();

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
