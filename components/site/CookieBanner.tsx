"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { SITE } from "@/lib/content/site";

const STORAGE_KEY = "ds_cookie_consent";

type Consent = "all" | "essential";

/**
 * Уведомление о cookie (ТЗ §5.3, чек-лист S3/P5).
 * До согласия работают только необходимые cookie; аналитика не подключается.
 * Выбор хранится в localStorage, поэтому баннер не появляется повторно.
 */
export function CookieBanner({ locale }: { locale: Locale }) {
  const t = SITE[locale].cookies;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      saved = null;
    }
    // Читаем выбор после гидратации, чтобы не было расхождения с SSR-разметкой.
    const frame = requestAnimationFrame(() => setVisible(!saved));

    function onOpen() {
      setVisible(true);
    }
    window.addEventListener("ds:cookie-settings", onOpen);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("ds:cookie-settings", onOpen);
    };
  }, []);

  useEffect(() => {
    if (visible) document.documentElement.dataset.cookieBanner = "open";
    else delete document.documentElement.dataset.cookieBanner;
  }, [visible]);

  function choose(consent: Consent) {
    try {
      window.localStorage.setItem(STORAGE_KEY, consent);
    } catch {
      // Приватный режим: выбор не сохранится, но сайт продолжит работать.
    }
    document.documentElement.dataset.cookieConsent = consent;
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="cookie"
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-lead"
    >
      <div className="cookie-body">
        <strong id="cookie-title">{t.title}</strong>
        <p id="cookie-lead">{t.lead}</p>
        <p className="cookie-note">{t.note}</p>
        <Link href={`/${locale}/cookies`}>{t.policyLink}</Link>
      </div>
      <div className="cookie-actions">
        <button type="button" className="sbtn p s" onClick={() => choose("all")}>
          {t.accept}
        </button>
        <button type="button" className="sbtn s" onClick={() => choose("essential")}>
          {t.essentialOnly}
        </button>
      </div>
    </div>
  );
}
