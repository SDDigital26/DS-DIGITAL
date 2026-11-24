"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const input = "rounded-lg border border-white/10 bg-bg px-3 py-2 text-base outline-none focus:border-accent";
const label = "text-xs text-secondary";

type Config = {
  configured: boolean;
  tokenHint: string;
  chatId: string;
  notifyOnLead: boolean;
  enabled: boolean;
  source: "database" | "env" | "none";
};

const EMPTY: Config = {
  configured: false,
  tokenHint: "",
  chatId: "",
  notifyOnLead: true,
  enabled: false,
  source: "none",
};

/** Подключение Telegram-бота для приёма заявок и отсылки в канал. */
export function TelegramBotForm() {
  const router = useRouter();
  const [form, setForm] = useState<Config>(EMPTY);
  const [token, setToken] = useState("");
  const [clearToken, setClearToken] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/telegram", { cache: "no-store", signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.config) setForm(data.config as Config);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => controller.abort();
  }, []);

  function payload() {
    return {
      botToken: token,
      chatId: form.chatId,
      notifyOnLead: form.notifyOnLead,
      enabled: form.enabled,
      clearToken,
    };
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setNote(null);
    try {
      const res = await fetch("/api/admin/telegram", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload()),
      });
      const body = (await res.json().catch(() => null)) as { config?: Config; error?: string } | null;
      if (!res.ok || !body?.config) {
        setNote({ text: body?.error ?? "Не удалось сохранить.", ok: false });
        return;
      }
      setForm(body.config);
      setToken("");
      setClearToken(false);
      setNote({ text: "Настройки Telegram сохранены.", ok: true });
      router.refresh();
    } catch {
      setNote({ text: "Ошибка сети.", ok: false });
    } finally {
      setPending(false);
    }
  }

  async function test() {
    setTesting(true);
    setNote(null);
    try {
      const res = await fetch("/api/admin/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken: token, chatId: form.chatId }),
      });
      const body = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string; sample?: string }
        | null;
      setNote({
        text: body?.ok ? body.sample ?? "Сообщение отправлено" : body?.error ?? "Проверка не удалась.",
        ok: Boolean(body?.ok),
      });
    } catch {
      setNote({ text: "Ошибка сети при проверке.", ok: false });
    } finally {
      setTesting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-surface/40 p-4">
      <h2 className="text-lg font-semibold">Telegram-бот для заявок</h2>
      <p className="mt-1 text-xs text-secondary">
        Бот отправляет уведомление о каждой новой заявке в чат или канал (приходит мгновенно).
        Кнопка «Отправить тест» проверяет токен из поля ниже; если поле пустое — уже сохранённый.
        Токен создаётся у{" "}
        <a className="text-link" href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer">
          @BotFather
        </a>
        . Chat ID можно узнать у @userinfobot; для канала — добавьте бота администратором и укажите
        `@имя_канала` или `-100...`. Токен хранится только на сервере.
      </p>

      <div
        className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
          form.configured && form.enabled
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
            : "border-white/10 bg-bg text-secondary"
        }`}
      >
        <span className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              form.configured && form.enabled ? "bg-emerald-400" : "bg-slate-400"
            }`}
            aria-hidden="true"
          />
          {form.configured && form.enabled
            ? "Бот подключён и включён"
            : form.configured
              ? "Данные есть, но бот выключен"
              : "Бот не подключён"}
          {form.source === "env" ? " (из переменных окружения)" : ""}
        </span>
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
            <label className={label} htmlFor="tg-token">
              Токен бота {form.tokenHint ? `(сохранён: ${form.tokenHint})` : ""}
            </label>
            <input
              id="tg-token"
              className={input}
              type="password"
              value={token}
              autoComplete="off"
              placeholder={form.tokenHint ? "Оставьте пустым, чтобы не менять" : "123456:ABC-..."}
              onChange={(e) => {
                setToken(e.target.value);
                setClearToken(false);
              }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={label} htmlFor="tg-chat">Chat ID / канал</label>
            <input
              id="tg-chat"
              className={input}
              value={form.chatId}
              placeholder="@mychannel или -1001234567890"
              onChange={(e) => setForm((c) => ({ ...c, chatId: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-5 w-5 accent-[#176BFF]"
              checked={form.enabled}
              onChange={(e) => setForm((c) => ({ ...c, enabled: e.target.checked }))}
            />
            Бот включён
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-5 w-5 accent-[#176BFF]"
              checked={form.notifyOnLead}
              onChange={(e) => setForm((c) => ({ ...c, notifyOnLead: e.target.checked }))}
            />
            Уведомлять о новых заявках
          </label>
          {form.tokenHint ? (
            <label className="flex items-center gap-2 text-xs text-secondary">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#176BFF]"
                checked={clearToken}
                onChange={(e) => setClearToken(e.target.checked)}
              />
              Удалить токен
            </label>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pending || !loaded}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent/85 disabled:opacity-60"
          >
            {pending ? "Сохраняем…" : "Сохранить Telegram"}
          </button>
          <button
            type="button"
            onClick={() => void test()}
            disabled={testing || !loaded}
            className="rounded-lg border border-white/15 px-5 py-2.5 text-sm text-white hover:bg-white/5 disabled:opacity-60"
          >
            {testing ? "Отправляем…" : "Отправить тест"}
          </button>
        </div>
      </form>
    </section>
  );
}
