"use client";

import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { SITE } from "@/lib/content/site";

export function CookiePolicyBody({ locale }: { locale: Locale }) {
  const t = SITE[locale];

  function openSettings() {
    window.dispatchEvent(new Event("ds:cookie-settings"));
  }

  return (
    <div className="policy">
      <h1>{t.cookies.policyLink}</h1>
      <p>{t.cookies.lead}</p>

      {t.cookies.sections.map((section) => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          <p>{section.text}</p>
        </section>
      ))}

      <button type="button" className="sbtn p s" onClick={openSettings}>
        {t.cookies.accept}
      </button>

      <p>
        <Link href={`/${locale}/privacy`}>{t.privacy}</Link>
      </p>
    </div>
  );
}
