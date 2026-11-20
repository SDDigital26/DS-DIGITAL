import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import { LocaleSwitcher } from "./LocaleSwitcher";

const NAV_PATHS = [
  { key: "services", path: "/services" },
  { key: "projects", path: "/projects" },
  { key: "about", path: "/about" },
  { key: "process", path: "/process" },
  { key: "reviews", path: "/reviews" },
  { key: "faq", path: "/faq" },
  { key: "contacts", path: "/contact" },
] as const;

export function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href={`/${locale}`}
          className="text-xl font-bold tracking-tight"
        >
          DS<span className="text-accent"> DIGITAL</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          {NAV_PATHS.map((item) => (
            <Link
              key={item.key}
              href={`/${locale}${item.path}`}
              className="text-sm text-secondary transition-colors hover:text-white"
            >
              {dict.nav[item.key]}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LocaleSwitcher locale={locale} />
          <Link
            href={`/${locale}/contact`}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/85"
          >
            {dict.nav.letsTalk}
          </Link>
        </div>
      </div>
    </header>
  );
}
