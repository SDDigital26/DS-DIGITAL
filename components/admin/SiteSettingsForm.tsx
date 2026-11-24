"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SiteSettings } from "@/lib/site-settings";

const input = "rounded-lg border border-white/10 bg-bg px-3 py-2 text-base outline-none focus:border-accent";
const label = "text-xs text-secondary";

/**
 * Настройки сайта из кабинета: контакты, режим эффектов, AI, тексты согласия, noindex.
 * Все изменения сохраняются в `Setting.site` и применяются на сайте без деплоя.
 */
export function SiteSettingsForm({ initial }: { initial: SiteSettings }) {
  const router = useRouter();
  const [form, setForm] = useState<SiteSettings>(initial);
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(null);

  function patch<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setNote(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { issues?: Array<{ path: (string | number)[]; message: string }> }
          | null;
        setNote({
          text: body?.issues?.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") ?? "Не удалось сохранить.",
          ok: false,
        });
        return;
      }
      setNote({ text: "Настройки сохранены.", ok: true });
      router.refresh();
    } catch {
      setNote({ text: "Ошибка сети.", ok: false });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-6">
      {note ? (
        <p
          role="status"
          className={`rounded-lg border px-3 py-2 text-sm ${
            note.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/30 bg-red-500/10 text-red-200"
          }`}
        >
          {note.text}
        </p>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-surface/40 p-4">
        <h2 className="text-lg font-semibold">Контакты</h2>
        <p className="mt-1 text-xs text-secondary">
          Пустое поле — канал не показывается на сайте. Telegram: ник или ссылка, WhatsApp: номер или ссылка.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label className={label} htmlFor="set-telegram">Telegram</label>
            <input
              id="set-telegram"
              className={input}
              value={form.telegram}
              maxLength={64}
              placeholder="@studio"
              onChange={(e) => patch("telegram", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={label} htmlFor="set-whatsapp">WhatsApp</label>
            <input
              id="set-whatsapp"
              className={input}
              value={form.whatsapp}
              maxLength={40}
              placeholder="+84..."
              onChange={(e) => patch("whatsapp", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={label} htmlFor="set-email">Email</label>
            <input
              id="set-email"
              className={input}
              type="email"
              value={form.email}
              maxLength={120}
              placeholder="hi@example.com"
              onChange={(e) => patch("email", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-surface/40 p-4">
        <h2 className="text-lg font-semibold">Поведение сайта</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className={label} htmlFor="set-effects">Режим эффектов</label>
            <select
              id="set-effects"
              className={input}
              value={form.effectsMode}
              onChange={(e) => patch("effectsMode", e.target.value as SiteSettings["effectsMode"])}
            >
              <option value="full">Full — матричный дождь на фоне + все эффекты</option>
              <option value="lite">Lite — спокойный режим без фонового кода</option>
              <option value="static">Static — только статика</option>
            </select>
          </div>
          <div className="flex flex-col justify-end gap-2">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                className="h-5 w-5 accent-[#176BFF]"
                checked={form.aiEnabled}
                onChange={(e) => patch("aiEnabled", e.target.checked)}
              />
              AI-консультант включён
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                className="h-5 w-5 accent-[#176BFF]"
                checked={form.noindex}
                onChange={(e) => patch("noindex", e.target.checked)}
              />
              Закрыть сайт от индексации (noindex)
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-surface/40 p-4">
        <h2 className="text-lg font-semibold">Текст согласия в формах</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className={label} htmlFor="set-consent-ru">RU</label>
            <input
              id="set-consent-ru"
              className={input}
              value={form.consentTextRu}
              maxLength={300}
              onChange={(e) => patch("consentTextRu", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={label} htmlFor="set-consent-en">EN</label>
            <input
              id="set-consent-en"
              className={input}
              value={form.consentTextEn}
              maxLength={300}
              onChange={(e) => patch("consentTextEn", e.target.value)}
            />
          </div>
        </div>
      </section>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent/85 disabled:opacity-60"
      >
        {pending ? "Сохраняем…" : "Сохранить настройки"}
      </button>
    </form>
  );
}
