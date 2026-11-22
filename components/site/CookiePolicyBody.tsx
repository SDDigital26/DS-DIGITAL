"use client";

import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { SiteDictionary } from "@/lib/content/site-overrides";

export function CookiePolicyBody({
  locale,
  content,
}: {
  locale: Locale;
  content: SiteDictionary;
}) {
  const t = content;

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
