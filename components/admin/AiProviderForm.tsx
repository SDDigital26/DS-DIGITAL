"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AiProvider, AiProviderPublic } from "@/lib/ai/provider-config";

const input = "rounded-lg border border-white/10 bg-bg px-3 py-2 text-base outline-none focus:border-accent";
const label = "text-xs text-secondary";

type ProviderStatus = {
  connected: boolean;
  mode: "scripted" | "api";
  detail: string;
  checkedAt?: string;
};

type Prefill = { baseUrl: string; model: string; hint: string };

const PRESETS: Record<Exclude<AiProvider, "scripted">, Prefill> = {
  google: {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    model: "gemini-3-flash-preview",
    hint: "Бесплатный ключ Google AI Studio: aistudio.google.com/apikey",
  },
  "openai-compatible": {
    baseUrl: "http://127.0.0.1:11434/v1",
    model: "llama3.2",
    hint: "Локальный Ollama/LM Studio на вашем ПК или любой OpenAI-совместимый сервис",
  },
};

const EMPTY: AiProviderPublic = {
  provider: "scripted",
  baseUrl: "",
  model: "",
  temperature: 0.3,
  hasApiKey: false,
  keyHint: "",
};

/**
 * Подключение AI-ассистента по API прямо из кабинета (ТЗ §6.14).
 * Ключ отправляется только на сервер и в ответах админки заменяется маской.
 */
export function AiProviderForm() {
  const router = useRouter();
  const [form, setForm] = useState<AiProviderPublic>(EMPTY);
  const [apiKey, setApiKey] = useState("");
  const [clearApiKey, setClearApiKey] = useState(false);
  const [pending, setPending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/ai-provider", { cache: "no-store", signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.config) setForm(data.config as AiProviderPublic);
        setLoaded(true);
        void fetch("/api/admin/ai-provider/status", { cache: "no-store" })
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (data) setStatus(data as ProviderStatus);
          })
          .catch(() => undefined);
      })
      .catch(() => setLoaded(true));
    return () => controller.abort();
  }, []);

  function patch<K extends keyof AiProviderPublic>(key: K, value: AiProviderPublic[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setNote(null);
  }

  function chooseProvider(provider: AiProvider) {
    setForm((current) => {
      if (provider === "scripted") return { ...current, provider };
      const preset = PRESETS[provider];
      return {
        ...current,
        provider,
        baseUrl: current.baseUrl || preset.baseUrl,
        model: current.model || preset.model,
      };
    });
    setNote(null);
  }

  function payload() {
    return {
      provider: form.provider,
      baseUrl: form.baseUrl,
      model: form.model,
      temperature: form.temperature,
      apiKey,
      clearApiKey,
    };
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setNote(null);
    try {
      const res = await fetch("/api/admin/ai-provider", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload()),
      });
      const body = (await res.json().catch(() => null)) as
        | { config?: AiProviderPublic; error?: string }
        | null;
      if (!res.ok || !body?.config) {
        setNote({ text: body?.error ?? "Не удалось сохранить.", ok: false });
        return;
      }
      setForm(body.config);
      setApiKey("");
      setClearApiKey(false);
      setNote({ text: "Провайдер сохранён.", ok: true });
      router.refresh();
    } catch {
      setNote({ text: "Ошибка сети.", ok: false });
    } finally {
      setPending(false);
    }
  }

  async function checkStatus() {
    setChecking(true);
    try {
      const res = await fetch("/api/admin/ai-provider/status", { cache: "no-store" });
      if (res.ok) setStatus((await res.json()) as ProviderStatus);
    } catch {
      /* оставляем последний статус */
    } finally {
      setChecking(false);
    }
  }

  async function test() {
    setTesting(true);
    setNote(null);
    try {
      const res = await fetch("/api/admin/ai-provider/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload()),
      });
      const body = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string; sample?: string; mode?: string }
        | null;
      setNote({
        text: body?.ok
          ? body.mode === "scripted"
            ? "Локальный сценарий активен — внешний API не нужен."
            : `Подключение работает. Ответ модели: «${body.sample ?? "OK"}»`
          : body?.error ?? "Проверка не удалась.",
        ok: Boolean(body?.ok),
      });
    } catch {
      setNote({ text: "Ошибка сети при проверке.", ok: false });
    } finally {
      setTesting(false);
    }
  }

  const presetHint = form.provider === "scripted" ? "" : PRESETS[form.provider].hint;

  return (
    <section className="rounded-2xl border border-white/10 bg-surface/40 p-4">
      <h2 className="text-lg font-semibold">AI-ассистент: подключение API</h2>
      <p className="mt-1 text-xs text-secondary">
        По умолчанию работает бесплатный пошаговый сценарий без внешних сервисов. Можно подключить Google
        Gemini, бесплатный провайдер или свой сервер на ПК — модель будет только переформулировать ответы
        сценария; согласие и заявки остаются на сервере. Ключ хранится только на сервере и не показывается
        на сайте.
      </p>

      <div
        className={`mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${
          status?.connected
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
            : status
              ? "border-red-500/30 bg-red-500/10 text-red-200"
              : "border-white/10 bg-bg text-secondary"
        }`}
      >
        <span className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              status?.connected ? "bg-emerald-400" : status ? "bg-red-400" : "bg-slate-400"
            }`}
            aria-hidden="true"
          />
          <strong>
            {status === null
              ? "Проверяем связь…"
              : status.connected
                ? "Связь с AI установлена"
                : "Нет связи с AI"}
          </strong>
          {status?.detail ? <span className="text-xs opacity-80">— {status.detail}</span> : null}
        </span>
        <button
          type="button"
          onClick={() => void checkStatus()}
          disabled={checking}
          className="rounded border border-white/15 px-2 py-1 text-xs hover:bg-white/5 disabled:opacity-60"
        >
          {checking ? "Проверяем…" : "Обновить статус"}
        </button>
      </div>

      {note ? (
        <p
          role="status"
          className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
            note.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/30 bg-red-500/10 text-red-200"
          }`}
        >
          {note.text}
        </p>
      ) : null}

      <form onSubmit={save} className="mt-3 grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className={label} htmlFor="ai-provider">Провайдер</label>
            <select
              id="ai-provider"
              className={input}
              value={form.provider}
              disabled={!loaded}
              onChange={(e) => chooseProvider(e.target.value as AiProvider)}
            >
              <option value="scripted">Сценарий без внешнего AI (бесплатно)</option>
              <option value="google">Google Gemini (бесплатный ключ)</option>
              <option value="openai-compatible">Свой / OpenAI-совместимый API</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className={label} htmlFor="ai-model">Модель</label>
            <input
              id="ai-model"
              className={input}
              value={form.model}
              placeholder={form.provider === "scripted" ? "не требуется" : "gemini-3-flash-preview"}
              onChange={(e) => patch("model", e.target.value)}
            />
          </div>
        </div>

        {form.provider !== "scripted" ? (
          <>
            <div className="flex flex-col gap-1">
              <label className={label} htmlFor="ai-base-url">Базовый URL API</label>
              <input
                id="ai-base-url"
                className={input}
                value={form.baseUrl}
                placeholder="https://…/v1beta/openai"
                onChange={(e) => patch("baseUrl", e.target.value)}
              />
              {presetHint ? <span className="text-xs text-secondary">{presetHint}</span> : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className={label} htmlFor="ai-key">
                  API-ключ {form.hasApiKey ? `(сохранён: ${form.keyHint})` : ""}
                </label>
                <input
                  id="ai-key"
                  className={input}
                  type="password"
                  value={apiKey}
                  autoComplete="off"
                  placeholder={form.hasApiKey ? "Оставьте пустым, чтобы не менять" : "Вставьте ключ"}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setClearApiKey(false);
                  }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className={label} htmlFor="ai-temp">Температура: {form.temperature.toFixed(1)}</label>
                <input
                  id="ai-temp"
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={form.temperature}
                  onChange={(e) => patch("temperature", Number(e.target.value))}
                />
              </div>
            </div>
            {form.hasApiKey ? (
              <label className="flex items-center gap-2 text-xs text-secondary">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#176BFF]"
                  checked={clearApiKey}
                  onChange={(e) => setClearApiKey(e.target.checked)}
                />
                Удалить сохранённый ключ
              </label>
            ) : null}
          </>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pending || !loaded}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent/85 disabled:opacity-60"
          >
            {pending ? "Сохраняем…" : "Сохранить провайдер"}
          </button>
          <button
            type="button"
            onClick={() => void test()}
            disabled={testing || !loaded || (form.provider !== "scripted" && !form.baseUrl && !form.model)}
            className="rounded-lg border border-white/15 px-5 py-2.5 text-sm text-white hover:bg-white/5 disabled:opacity-60"
          >
            {testing ? "Проверяем…" : "Проверить подключение"}
          </button>
        </div>
      </form>
    </section>
  );
}
