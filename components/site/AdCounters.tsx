"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { captureUtm, trackEvent } from "@/lib/tracking";

/**
 * Рекламные счётчики (ТЗ §16) — грузятся ТОЛЬКО после согласия на аналитику
 * и ТОЛЬКО если соответствующий ID задан через env:
 * - NEXT_PUBLIC_YM_ID          → Яндекс Метрика
 * - NEXT_PUBLIC_META_PIXEL_ID  → Meta Pixel
 * - NEXT_PUBLIC_VK_PIXEL_ID    → VK Pixel
 * Согласие: localStorage `ds_cookie_consent === "all"` (как в AnalyticsGate).
 * События: lead_submit / calc_used / contact_click (см. lib/tracking.ts).
 */

type Props = {
  ymId?: string;
  metaId?: string;
  vkId?: string;
};

declare global {
  interface Window {
    fbqQueue?: unknown[][];
    __dsCountersLoaded?: boolean;
  }
}

function consentGiven(): boolean {
  try {
    return window.localStorage.getItem("ds_cookie_consent") === "all";
  } catch {
    return false;
  }
}

function loadYandex(id: string) {
  if (document.getElementById("ds-ym")) return;
  const name = "yandex_metrika_callbacks";
  const w = window as unknown as Record<string, unknown>;
  w[name] = w[name] || [];
  w[name] = [() => {
    try {
      window.ym?.(Number(id), "init", {
        clickmap: true,
        trackLinks: true,
        accurateTrackBounce: true,
        webvisor: false,
        defer: true,
      });
    } catch {
      /* ignore */
    }
  }];
  const script = document.createElement("script");
  script.id = "ds-ym";
  script.async = true;
  script.src = "https://mc.yandex.ru/metrika/tag.js";
  document.head.appendChild(script);
}

function loadMeta(id: string) {
  if (document.getElementById("ds-meta")) return;
  const w = window as unknown as Record<string, unknown>;
  if (!w.fbq) {
    const queue: unknown[][] = (w.fbqQueue as unknown[][] | undefined) ?? [];
    const fbq = (...args: unknown[]) => queue.push(args);
    w.fbqQueue = queue;
    w.fbq = fbq;
  }
  const script = document.createElement("script");
  script.id = "ds-meta";
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  script.onload = () => {
    try {
      window.fbq?.("init", id);
      window.fbq?.("track", "PageView");
    } catch {
      /* ignore */
    }
  };
  document.head.appendChild(script);
}

function loadVk(id: string) {
  if (document.getElementById("ds-vk")) return;
  const script = document.createElement("script");
  script.id = "ds-vk";
  script.async = true;
  script.src = "https://vk.com/js/api/openapi.js?169";
  script.onload = () => {
    try {
      window.VK?.Retargeting?.Init?.(id);
      window.VK?.Retargeting?.Hit?.(window.location.pathname);
    } catch {
      /* ignore */
    }
  };
  document.head.appendChild(script);
}

export function AdCounters({ ymId, metaId, vkId }: Props) {
  const pathname = usePathname();

  // Захват UTM при первом заходе (клиентская навигация не перезаписывает).
  useEffect(() => {
    captureUtm();
  }, [pathname]);

  // Загрузка счётчиков при согласии.
  useEffect(() => {
    const check = () => {
      if (!consentGiven()) return;
      if (window.__dsCountersLoaded) return;
      window.__dsCountersLoaded = true;
      window.__dsCounters = {
        ymId: ymId || undefined,
        metaId: metaId || undefined,
        vkId: Boolean(vkId),
      };
      if (ymId) loadYandex(ymId);
      if (metaId) loadMeta(metaId);
      if (vkId) loadVk(vkId);
    };
    check();
    window.addEventListener("ds:consent-change", check);
    window.addEventListener("storage", check);
    return () => {
      window.removeEventListener("ds:consent-change", check);
      window.removeEventListener("storage", check);
    };
  }, [ymId, metaId, vkId]);

  // Клики по контактам (mailto/tel/Telegram/WhatsApp) — событие contact_click.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest("a") : null;
      if (!target) return;
      const href = target.getAttribute("href") ?? "";
      const contact =
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        /(^|\/\/)(t\.me|telegram\.me)/i.test(href) ||
        /(^|\/\/)(wa\.me|api\.whatsapp\.com)/i.test(href);
      if (contact) trackEvent("contact_click");
    }
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true } as EventListenerOptions);
  }, []);

  return null;
}
