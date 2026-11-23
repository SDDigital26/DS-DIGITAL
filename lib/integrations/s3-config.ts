import { getSetting, setSetting, S3_PROVIDER_SETTINGS_KEY } from "@/lib/settings";

/**
 * S3-совместимое хранилище медиа настраивается в кабинете (ТЗ N3/R7).
 * Ключи — только на сервере, в публичных ответах отдаётся маска.
 */
export type S3Config = {
  /** Endpoint без bucket, например https://s3.eu-central-1.amazonaws.com */
  endpoint: string;
  region: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  /** Публичный базовый URL для сформированных ссылок (CDN). */
  publicBaseUrl: string;
};

export type S3Public = Omit<S3Config, "accessKey" | "secretKey"> & {
  hasAccessKey: boolean;
  hasSecretKey: boolean;
  keyHint: string;
};

export const DEFAULT_S3_CONFIG: S3Config = {
  endpoint: "",
  region: "auto",
  bucket: "",
  accessKey: "",
  secretKey: "",
  publicBaseUrl: "",
};

export async function getS3Config(): Promise<S3Config> {
  const raw = await getSetting<Partial<S3Config>>(S3_PROVIDER_SETTINGS_KEY).catch(() => null);
  return { ...DEFAULT_S3_CONFIG, ...(raw ?? {}) };
}

export async function saveS3Config(config: S3Config): Promise<void> {
  await setSetting(S3_PROVIDER_SETTINGS_KEY, config);
}

export function publicS3Config(config: S3Config): S3Public {
  const { accessKey, secretKey, ...rest } = config;
  return {
    ...rest,
    hasAccessKey: Boolean(accessKey),
    hasSecretKey: Boolean(secretKey),
    keyHint: accessKey ? `${"•".repeat(Math.max(0, accessKey.length - 4))}${accessKey.slice(-4)}` : "",
  };
}

export function isS3Configured(config: S3Config): boolean {
  return Boolean(
    config.endpoint && config.bucket && config.accessKey && config.secretKey && config.publicBaseUrl,
  );
}
