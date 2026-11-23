"use client";

import { useEffect, useState } from "react";
import type { S3Public } from "@/lib/integrations/s3-config";

const input = "rounded-lg border border-white/10 bg-bg px-3 py-2 text-base outline-none focus:border-accent";
const label = "text-xs text-secondary";

const EMPTY: S3Public = {
  endpoint: "",
  region: "auto",
  bucket: "",
  publicBaseUrl: "",
  hasAccessKey: false,
  hasSecretKey: false,
  keyHint: "",
};

/** Настройка S3-совместимого хранилища для загрузки медиа. */
export function S3ProviderForm({ onSaved }: { onSaved?: () => void }) {
  const [form, setForm] = useState<S3Public>(EMPTY);
  const [accessKey, setAccessKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [clearKeys, setClearKeys] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/s3-provider", { cache: "no-store", signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.config) setForm(data.config as S3Public);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => controller.abort();
  }, []);

  function patch<K extends keyof S3Public>(key: K, value: S3Public[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setNote(null);
    try {
      const res = await fetch("/api/admin/s3-provider", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: form.endpoint,
          region: form.region,
          bucket: form.bucket,
          publicBaseUrl: form.publicBaseUrl,
          accessKey,
          secretKey,
          clearKeys,
        }),
      });
      const body = (await res.json().catch(() => null)) as { ok?: boolean; config?: S3Public; error?: string } | null;
      if (res.ok && body?.config) {
        setForm(body.config);
        setAccessKey("");
        setSecretKey("");
        setNote("Настройки сохранены.");
        onSaved?.();
      } else {
        setNote(body?.error ?? "Не удалось сохранить.");
      }
    } catch {
      setNote("Ошибка сети.");
    } finally {
      setPending(false);
    }
  }

  async function test() {
    setPending(true);
    setNote(null);
    try {
      const res = await fetch("/api/admin/s3-provider/test", { method: "POST" });
      const body = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      setNote(body?.ok ? "Соединение с bucket установлено." : (body?.error ?? "Проверка не удалась."));
    } catch {
      setNote("Ошибка сети.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={save} className="rounded-2xl border border-white/10 bg-surface p-4">
      <h2 className="text-lg font-semibold">S3-хранилище медиа</h2>
      <p className="mt-1 text-xs text-secondary">
        S3-совместимый endpoint (AWS S3, Cloudflare R2, MinIO). Ключи хранятся только на сервере и не
        показываются после сохранения.
      </p>
      <p className="mt-2 rounded-lg border border-white/10 bg-bg/40 px-3 py-2 text-xs text-secondary">
        Supabase (текущая БД): Project Settings → Storage → «S3 access keys» → создать пару ключей.
        Endpoint: <code>https://&lt;project-ref&gt;.supabase.co/storage/v1/s3</code>, Region — регион
        проекта (например <code>ap-southeast-1</code>). Затем Storage → New bucket → включить
        «Public bucket», и в поле CDN указать{" "}
        <code>https://&lt;project-ref&gt;.supabase.co/storage/v1/object/public/&lt;bucket&gt;</code>.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className={label} htmlFor="s3-endpoint">Endpoint</label>
          <input id="s3-endpoint" className={input} value={form.endpoint} onChange={(e) => patch("endpoint", e.target.value)} placeholder="https://s3.eu-central-1.amazonaws.com" />
        </div>
        <div className="flex flex-col gap-1">
          <label className={label} htmlFor="s3-region">Region</label>
          <input id="s3-region" className={input} value={form.region} onChange={(e) => patch("region", e.target.value)} placeholder="auto" />
        </div>
        <div className="flex flex-col gap-1">
          <label className={label} htmlFor="s3-bucket">Bucket</label>
          <input id="s3-bucket" className={input} value={form.bucket} onChange={(e) => patch("bucket", e.target.value)} placeholder="ds-digital-media" />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className={label} htmlFor="s3-public">Публичный базовый URL (CDN)</label>
          <input id="s3-public" className={input} value={form.publicBaseUrl} onChange={(e) => patch("publicBaseUrl", e.target.value)} placeholder="https://cdn.example.com" />
        </div>
        <div className="flex flex-col gap-1">
          <label className={label} htmlFor="s3-key">Access key {form.hasAccessKey ? `(сохранён: ${form.keyHint})` : ""}</label>
          <input id="s3-key" className={input} type="password" autoComplete="off" value={accessKey} onChange={(e) => { setAccessKey(e.target.value); setClearKeys(false); }} placeholder="Оставьте пустым, чтобы не менять" />
        </div>
        <div className="flex flex-col gap-1">
          <label className={label} htmlFor="s3-secret">Secret key {form.hasSecretKey ? "(сохранён)" : ""}</label>
          <input id="s3-secret" className={input} type="password" autoComplete="off" value={secretKey} onChange={(e) => { setSecretKey(e.target.value); setClearKeys(false); }} placeholder="Оставьте пустым, чтобы не менять" />
        </div>
        {form.hasAccessKey || form.hasSecretKey ? (
          <label className="flex items-center gap-2 text-xs text-secondary sm:col-span-2">
            <input type="checkbox" className="h-4 w-4 accent-[#176BFF]" checked={clearKeys} onChange={(e) => setClearKeys(e.target.checked)} />
            Удалить сохранённые ключи
          </label>
        ) : null}
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <button type="submit" disabled={pending || !loaded} className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent/85 disabled:opacity-60">
            {pending ? "Сохраняем…" : "Сохранить"}
          </button>
          <button type="button" onClick={() => void test()} disabled={pending || !loaded || !form.bucket} className="rounded-lg border border-white/15 px-5 py-2.5 text-sm text-white hover:bg-white/5 disabled:opacity-60">
            Проверить bucket
          </button>
        </div>
      </div>
      {note ? <p className="mt-3 text-sm text-secondary">{note}</p> : null}
    </form>
  );
}
