"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Status = {
  connected: boolean;
  mode: "scripted" | "api";
  detail: string;
  config?: { provider: string; model: string };
  checkedAt?: string;
};

/** Индикатор связи AI-ассистента в админке (опрос раз в 60 с, ТЗ §6.14). */
export function AiStatusBadge() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const res = await fetch("/api/admin/ai-provider/status", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (res.ok) setStatus((await res.json()) as Status);
      } catch {
        /* сеть/отмена — оставляем последний известный статус */
      }
    }
    void load();
    const timer = setInterval(() => void load(), 120_000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, []);

  const connected = status?.connected;
  const tone =
    connected === true
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      : connected === false
        ? "border-red-500/30 bg-red-500/10 text-red-200"
        : "border-white/10 bg-surface text-secondary";
  const dot =
    connected === true ? "bg-emerald-400" : connected === false ? "bg-red-400" : "bg-slate-400";

  return (
    <Link
      href="/admin/settings"
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${tone}`}
      title={status?.detail ?? "Проверка связи…"}
    >
      <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
      AI: {status === null ? "проверяем…" : connected ? "связь есть" : "нет связи"}
    </Link>
  );
}
