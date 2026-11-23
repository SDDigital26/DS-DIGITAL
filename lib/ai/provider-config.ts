import { getSetting, setSetting, AI_PROVIDER_SETTINGS_KEY } from "@/lib/settings";

/**
 * Настройки внешнего AI-провайдера (ТЗ §6.14, §17).
 *
 * Хранятся отдельно от `Setting.site` в ключе `ai-provider`: API-ключ — секрет
 * и никогда не должен попадать в`getSiteSettings()`, который уходит в публичные
 * страницы. Читать этот модуль можно только на сервере.
 */

export type AiProvider = "scripted" | "google" | "openai-compatible";

export type AiProviderConfig = {
  /** `scripted` — бесплатный детерминированный сценарий без внешних вызовов. */
  provider: AiProvider;
  /** Базовый URL OpenAI-совместимого API (для Google — по умолчанию). */
  baseUrl: string;
  /** Идентификатор модели. */
  model: string;
  /** Секрет. Пустая строка = ключ не задан. */
  apiKey: string;
  /** Температура ответа 0…1. */
  temperature: number;
  /** Свой сценарий продаж/ответов (дополнительные инструкции агенту). */
  scenario: string;
  /** Webhook n8n: если задан, сценарий выполняется там. */
  webhookUrl: string;
};

/** Что безопасно отдать в админку/клиент (без секрета). */
export type AiProviderPublic = {
  provider: AiProvider;
  baseUrl: string;
  model: string;
  temperature: number;
  hasApiKey: boolean;
  keyHint: string;
  scenario: string;
  webhookUrl: string;
};

export const DEFAULT_AI_PROVIDER_CONFIG: AiProviderConfig = {
  provider: "scripted",
  baseUrl: "",
  model: "",
  apiKey: "",
  temperature: 0.3,
  scenario: "",
  webhookUrl: "",
};

/** Пресеты для всех поддерживаемых вариантов, включая бесплатные и локальные. */
export const AI_PROVIDER_PRESETS: Record<
  Exclude<AiProvider, "scripted">,
  { label: string; baseUrl: string; model: string; hint: string }
> = {
  google: {
    label: "Google Gemini (OpenAI-совместимый API)",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    model: "gemini-3.5-flash-lite",
    hint: "Бесплатный уровень Google AI Studio: создайте ключ в aistudio.google.com/apikey. При 429/503 система сама переключается на резервные модели.",
  },
  "openai-compatible": {
    label: "Свой / OpenAI-совместимый API",
    baseUrl: "http://127.0.0.1:11434/v1",
    model: "llama3.2",
    hint: "Подойдут Ollama, LM Studio, vLLM, LocalAI на вашем ПК или любой OpenAI-совместимый сервис.",
  },
};

export function publicAiProvider(config: AiProviderConfig): AiProviderPublic {
  return {
    provider: config.provider,
    baseUrl: config.baseUrl,
    model: config.model,
    temperature: config.temperature,
    hasApiKey: Boolean(config.apiKey),
    keyHint: config.apiKey
      ? `${"•".repeat(Math.max(0, config.apiKey.length - 4))}${config.apiKey.slice(-4)}`
      : "",
    scenario: config.scenario,
    webhookUrl: config.webhookUrl,
  };
}

export async function getAiProviderConfig(): Promise<AiProviderConfig> {
  const raw = await getSetting<Partial<AiProviderConfig>>(AI_PROVIDER_SETTINGS_KEY).catch(() => null);
  return { ...DEFAULT_AI_PROVIDER_CONFIG, ...(raw ?? {}) };
}

export async function saveAiProviderConfig(config: AiProviderConfig): Promise<void> {
  await setSetting(AI_PROVIDER_SETTINGS_KEY, config);
}

/** Эффективный адрес запроса чата (базовый URL + /chat/completions). */
export function chatCompletionsUrl(config: AiProviderConfig): string {
  const base = (
    config.baseUrl || AI_PROVIDER_PRESETS[config.provider as Exclude<AiProvider, "scripted">]?.baseUrl || ""
  ).replace(/\/+$/, "");
  if (!base) throw new Error("Не задан базовый URL провайдера");
  return `${base}/chat/completions`;
}

/** Эффективная модель с учётом пресета провайдера. */
export function effectiveModel(config: AiProviderConfig): string {
  return (
    config.model || AI_PROVIDER_PRESETS[config.provider as Exclude<AiProvider, "scripted">]?.model || ""
  ).trim();
}
