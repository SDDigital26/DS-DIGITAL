"use client";

import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { SiteDictionary } from "@/lib/content/site-overrides";

export function SiteFooter({ locale, content }: { locale: Locale; content: SiteDictionary }) {
  const t = content;

  function openCookieSettings() {
    window.dispatchEvent(new Event("ds:cookie-settings"));
  }

  return (
    <footer>
      {t.footer}
      <Link href={`/${locale}/contact`}>{t.nav.contacts}</Link>
      <Link href={`/${locale}/privacy`}>{t.privacy}</Link>
      <Link href={`/${locale}/terms`}>{t.terms}</Link>
      <Link href={`/${locale}/cookies`} onClick={openCookieSettings}>
        {t.cookies.policyLink}
      </Link>
    </footer>
  );
}
