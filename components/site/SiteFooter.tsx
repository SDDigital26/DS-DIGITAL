"use client";

import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { SITE } from "@/lib/content/site";

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = SITE[locale];

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
