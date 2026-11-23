import {
  getSetting,
  setSetting,
  EMAIL_PROVIDER_SETTINGS_KEY,
} from "@/lib/settings";

/**
 * Email-уведомления о заявках настраиваются в кабинете (ТЗ §17, M5).
 * Endpoint/секрет хранятся только на сервере; публично отдаётся маска.
 */
export type EmailProviderConfig = {
  /** URL webhook/SMTP-моста, принимающего {to, subject, text, apiKey}. */
  endpoint: string;
  /** обратный адрес / подпись отправителя. */
  from: string;
  /** Секрет (write-only). */
  apiKey: string;
};

export type EmailProviderPublic = {
  endpoint: string;
  from: string;
  hasApiKey: boolean;
  keyHint: string;
};

export const DEFAULT_EMAIL_CONFIG: EmailProviderConfig = {
  endpoint: "",
  from: "",
  apiKey: "",
};

export async function getEmailConfig(): Promise<EmailProviderConfig> {
  const raw = await getSetting<Partial<EmailProviderConfig>>(EMAIL_PROVIDER_SETTINGS_KEY).catch(
    () => null,
  );
  return { ...DEFAULT_EMAIL_CONFIG, ...(raw ?? {}) };
}

export async function saveEmailConfig(config: EmailProviderConfig): Promise<void> {
  await setSetting(EMAIL_PROVIDER_SETTINGS_KEY, config);
}

export function publicEmailConfig(config: EmailProviderConfig): EmailProviderPublic {
  const from = config.from || process.env.LEADS_NOTIFY_EMAIL || "";
  return {
    endpoint: config.endpoint || process.env.EMAIL_API_ENDPOINT || "",
    from,
    hasApiKey: Boolean(config.apiKey || process.env.EMAIL_API_KEY),
    keyHint: config.apiKey
      ? `${"•".repeat(Math.max(0, config.apiKey.length - 4))}${config.apiKey.slice(-4)}`
      : "",
  };
}
