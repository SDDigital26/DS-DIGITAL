"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { SITE, type NavKey } from "@/lib/content/site";
import { ThemeToggle } from "@/components/site/ThemeToggle";

const NAV: { key: NavKey; href: string }[] = [
  { key: "services", href: "#services" },
  { key: "projects", href: "#projects" },
  { key: "about", href: "/about" },
  { key: "blog", href: "/blog" },
  { key: "calculator", href: "#calc" },
  { key: "process", href: "#process" },
  { key: "reviews", href: "#reviews" },
  { key: "faq", href: "#faq" },
  { key: "contacts", href: "#contact" },
];

export function SiteHeader({ locale }: { locale: Locale }) {
  const t = SITE[locale];
  const pathname = usePathname();
  const hrefFor = (target: Locale) => pathname.replace(/^\/(ru|en)(?=\/|$)/, `/${target}`);
  const [menuOpen, setMenuOpen] = useState(false);
  const home = `/${locale}`;

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className="nav">
      <Link className="logo" href={home}>
        DS<i>.</i> DIGITAL
      </Link>

      <nav aria-label={t.navLabel}>
        {NAV.map((item) => (
          <Link key={item.key} href={`${home}${item.href}`}>
            {t.nav[item.key]}
          </Link>
        ))}
      </nav>

      <div className="tools">
        <div className="lang" role="group" aria-label={t.languageLabel}>
          <Link href={hrefFor("ru")} aria-current={locale === "ru" ? "true" : undefined} hrefLang="ru">
            RU
          </Link>
          <Link href={hrefFor("en")} aria-current={locale === "en" ? "true" : undefined} hrefLang="en">
            EN
          </Link>
        </div>
        <ThemeToggle />
        <Link className="sbtn p s" href={`${home}#contact`}>
          {t.nav.letsTalk}
        </Link>
        <button
          type="button"
          className="menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? t.closeMenu : t.menu}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span aria-hidden="true">{menuOpen ? "✕" : "☰"}</span>
        </button>
      </div>

      {menuOpen ? (
        <nav className="mobile-menu" id="mobile-menu" aria-label={t.navLabel}>
          {NAV.map((item) => (
            <Link key={item.key} href={`${home}${item.href}`} onClick={() => setMenuOpen(false)}>
              {t.nav[item.key]}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
