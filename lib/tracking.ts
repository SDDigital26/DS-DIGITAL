import type { Locale } from "@/lib/i18n/config";

/**
 * События рекламы (ТЗ §16): только после согласия на аналитику.
 * Счётчики подключаются в `components/site/AdCounters.tsx` через env:
 * NEXT_PUBLIC_YM_ID (Яндекс Метрика), NEXT_PUBLIC_META_PIXEL_ID (Meta Pixel),
 * NEXT_PUBLIC_VK_PIXEL_ID (VK Pixel). Нет ID или нет согласия — тихий no-op.
 */

export type TrackEvent = "lead_submit" | "calc_used" | "contact_click";

type Counters = {
  ymId?: string;
  metaId?: string;
  vkId?: boolean;
};

declare global {
  interface Window {
    __dsCounters?: Counters;
    ym?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    VK?: { Retargeting?: { Init?: (id: string) => void; Hit?: (path?: string) => void; Event?: (name: string) => void } };
    dataLayer?: unknown[];
  }
}

function consentGiven(): boolean {
  try {
    return window.localStorage.getItem("ds_cookie_consent") === "all";
  } catch {
    return false;
  }
}

/** Отправить событие во все подключённые счётчики (каждый сам решает, как назвать). */
export function trackEvent(name: TrackEvent): void {
  if (typeof window === "undefined" || !consentGiven()) return;

  const counters = window.__dsCounters ?? {};
  try {
    if (counters.ymId && typeof window.ym === "function") {
      window.ym(Number(counters.ymId), "reachGoal", name);
    }
  } catch {
    /* счётчик не готов — молча пропускаем */
  }
  try {
    if (counters.metaId && typeof window.fbq === "function") {
      window.fbq("trackCustom", name);
    }
  } catch {
    /* ignore */
  }
  try {
    if (counters.vkId && window.VK?.Retargeting?.Event) {
      window.VK.Retargeting.Event(name);
    }
  } catch {
    /* ignore */
  }
  try {
    // Vercel Analytics — уже согласие-gated в AnalyticsGate.
    void import("@vercel/analytics").then(({ track }) => track(name));
  } catch {
    /* ignore */
  }
}

/** Читает UTM из текущего URL и запоминает первое посещение (sessionStorage). */
export type UtmSnapshot = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  gclid?: string;
  fbclid?: string;
  landingPath?: string;
};

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"] as const;
const UTM_STORAGE_KEY = "ds_utm";

/** Зафиксировать UTM и посадочную страницу (первое посещение в сессии). */
export function captureUtm(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const fromUrl: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key)?.trim();
    if (value) fromUrl[key] = value.slice(0, 200);
  }

  try {
    const existing = readUtm();
    // Первый источник важнее последующего — UTM не перезаписываем, а посадочную
    // страницу фиксируем один раз за сессию.
    const merged = {
      ...(hasKeys(fromUrl) ? { ...fromUrl, ...pickUtm(existing) } : pickUtm(existing)),
      landingPath: existing.landingPath ?? window.location.pathname,
    };
    if (!hasKeys(merged)) return;
    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(merged));
  } catch {
    /* приватный режим — пропускаем */
  }
}

function hasKeys(record: Record<string, unknown>): boolean {
  return Object.keys(record).length > 0;
}

function pickUtm(snapshot: UtmSnapshot): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(snapshot)) {
    if (value) out[key] = value;
  }
  return out;
}

/** UTM из памяти (для отправки вместе с заявкой). */
export function readUtm(): UtmSnapshot {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const pick = (key: string): string | undefined =>
      typeof parsed[key] === "string" && (parsed[key] as string).length > 0
        ? (parsed[key] as string).slice(0, 200)
        : undefined;
    return {
      utmSource: pick("utm_source"),
      utmMedium: pick("utm_medium"),
      utmCampaign: pick("utm_campaign"),
      utmContent: pick("utm_content"),
      utmTerm: pick("utm_term"),
      gclid: pick("gclid"),
      fbclid: pick("fbclid"),
      landingPath: pick("landingPath"),
    };
  } catch {
    return {};
  }
}

/** Текст локали для сообщений (удобно в компонентах). */
export function localeTag(locale: Locale): string {
  return locale === "ru" ? "ru-RU" : "en-US";
}
