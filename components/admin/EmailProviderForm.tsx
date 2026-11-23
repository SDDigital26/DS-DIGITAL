"use client";

import { useEffect, useState } from "react";
import type { EmailProviderPublic } from "@/lib/integrations/email-config";

const input = "rounded-lg border border-white/10 bg-bg px-3 py-2 text-base outline-none focus:border-accent";
const label = "text-xs text-secondary";

const EMPTY: EmailProviderPublic = { endpoint: "", from: "", hasApiKey: false, keyHint: "" };

/** Настройка email-уведомлений о заявках прямо из кабинета. */
export function EmailProviderForm() {
  const [form, setForm] = useState<EmailProviderPublic>(EMPTY);
  const [apiKey, setApiKey] = useState("");
  const [clearApiKey, setClearApiKey] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/email-provider", { cache: "no-store", signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.config) setForm(data.config as EmailProviderPublic);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => controller.abort();
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setNote(null);
    try {
      const res = await fetch("/api/admin/email-provider", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: form.endpoint,
          from: form.from,
          apiKey,
          clearApiKey,
        }),
      });
      const body = (await res.json().catch(() => null)) as { ok?: boolean; config?: EmailProviderPublic; error?: string } | null;
      if (res.ok && body?.config) {
        setForm(body.config);
        setApiKey("");
        setNote({ text: "Сохранено.", ok: true });
      } else {
        setNote({ text: body?.error ?? "Не удалось сохранить.", ok: false });
      }
    } catch {
      setNote({ text: "Ошибка сети.", ok: false });
    } finally {
      setPending(false);
    }
  }

  async function test() {
    setPending(true);
    setNote(null);
    try {
      const res = await fetch("/api/admin/email-provider/test", { method: "POST" });
      const body = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      setNote({
        text: body?.ok ? "Тестовое письмо отправлено." : (body?.error ?? "Отправка не удалась — заявка всё равно сохраняется."),
        ok: Boolean(body?.ok),
      });
    } catch {
      setNote({ text: "Ошибка сети.", ok: false });
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-surface p-4">
      <h2 className="text-lg font-semibold">Email-уведомления о заявках</h2>
      <p className="mt-1 text-xs text-secondary">
        Универсальный webhook/SMTP-мост. Если отправка не удалась — заявка остаётся в CRM, а статус
        уведомления виден в разделе «Заявки». Ключ хранится только на сервере.
      </p>
      <form onSubmit={save} className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className={label} htmlFor="email-endpoint">Endpoint (https://)</label>
          <input
            id="email-endpoint"
            className={input}
            type="url"
            maxLength={300}
            value={form.endpoint}
            onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
            placeholder="https://hooks.example.com/send-email"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className={label} htmlFor="email-from">Отправитель / получатель уведомлений</label>
          <input
            id="email-from"
            className={input}
            maxLength={160}
            value={form.from}
            onChange={(e) => setForm({ ...form, from: e.target.value })}
            placeholder="notify@example.com"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className={label} htmlFor="email-key">
            API-ключ {form.hasApiKey ? `(сохранён: ${form.keyHint})` : ""}
          </label>
          <input
            id="email-key"
            className={input}
            type="password"
            autoComplete="off"
            maxLength={500}
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setClearApiKey(false);
            }}
            placeholder={form.hasApiKey ? "Оставьте пустым, чтобы не менять" : "Вставьте ключ"}
          />
        </div>
        {form.hasApiKey ? (
          <label className="flex items-center gap-2 text-xs text-secondary sm:col-span-2">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#176BFF]"
              checked={clearApiKey}
              onChange={(e) => setClearApiKey(e.target.checked)}
            />
            Удалить сохранённый ключ
          </label>
        ) : null}
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <button
            type="submit"
            disabled={pending || !loaded}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent/85 disabled:opacity-60"
          >
            {pending ? "Сохраняем…" : "Сохранить"}
          </button>
          <button
            type="button"
            onClick={() => void test()}
            disabled={pending || !loaded || !form.endpoint}
            className="rounded-lg border border-white/15 px-5 py-2.5 text-sm text-white hover:bg-white/5 disabled:opacity-60"
          >
            Проверить отправку
          </button>
        </div>
      </form>
      {note ? <p className="mt-3 text-sm text-secondary">{note.text}</p> : null}
    </section>
  );
}
