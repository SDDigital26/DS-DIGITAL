"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

/**
 * Метрики Vercel загружаются только после согласия на аналитику (ТЗ §5.3).
 * CookieBanner пишет `ds_cookie_consent` и событие `ds:consent-change`.
 */
export function AnalyticsGate() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const check = () => {
      try {
        setAllowed(window.localStorage.getItem("ds_cookie_consent") === "all");
      } catch {
        setAllowed(false);
      }
    };
    check();
    window.addEventListener("ds:consent-change", check);
    window.addEventListener("storage", check);
    return () => {
      window.removeEventListener("ds:consent-change", check);
      window.removeEventListener("storage", check);
    };
  }, []);

  if (!allowed) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
