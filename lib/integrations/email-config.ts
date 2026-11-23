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
  /** Секрет вебхука (write-only). */
  apiKey: string;
  /** Прямая SMTP-отправка (без внешнего webhook). */
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  /** SMTP App Password (write-only). */
  smtpPassword: string;
};

export type EmailProviderPublic = {
  endpoint: string;
  from: string;
  hasApiKey: boolean;
  keyHint: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  hasSmtpPassword: boolean;
  smtpPasswordHint: string;
  /** Какой способ отправки будет использован. */
  mode: "smtp" | "webhook" | "none";
};

export const DEFAULT_EMAIL_CONFIG: EmailProviderConfig = {
  endpoint: "",
  from: "",
  apiKey: "",
  smtpHost: "",
  smtpPort: 587,
  smtpSecure: false,
  smtpUser: "",
  smtpPassword: "",
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
  const smtpReady = Boolean(config.smtpHost && config.smtpUser && config.smtpPassword);
  const endpoint = config.endpoint || process.env.EMAIL_API_ENDPOINT || "";
  return {
    endpoint,
    from,
    hasApiKey: Boolean(config.apiKey || process.env.EMAIL_API_KEY),
    keyHint: config.apiKey
      ? `${"•".repeat(Math.max(0, config.apiKey.length - 4))}${config.apiKey.slice(-4)}`
      : "",
    smtpHost: config.smtpHost,
    smtpPort: config.smtpPort || 587,
    smtpSecure: Boolean(config.smtpSecure),
    smtpUser: config.smtpUser,
    hasSmtpPassword: Boolean(config.smtpPassword),
    smtpPasswordHint: config.smtpPassword
      ? `${"•".repeat(Math.max(0, config.smtpPassword.length - 4))}${config.smtpPassword.slice(-4)}`
      : "",
    mode: smtpReady ? "smtp" : endpoint ? "webhook" : "none",
  };
}
