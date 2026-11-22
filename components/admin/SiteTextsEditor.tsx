"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Props = { texts: Record<"ru" | "en", Record<string, string>> };

/** Редактор всех текстов сайта: плоский список полей, сгруппированный по разделам. */
export function SiteTextsEditor({ texts }: Props) {
  const router = useRouter();
  const [locale, setLocale] = useState<"ru" | "en">("ru");
  const [values, setValues] = useState<Record<"ru" | "en", Record<string, string>>>(() =>
    structuredClone(texts),
  );
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const groups = useMemo(() => {
    const result: Record<string, [string, string][]> = {};
    for (const [key, value] of Object.entries(values[locale])) {
      if (query && !key.toLowerCase().includes(query.toLowerCase()) && !value.toLowerCase().includes(query.toLowerCase())) {
        continue;
      }
      const section = key.split(".")[0];
      (result[section] ??= []).push([key, value]);
    }
    return result;
  }, [values, locale, query]);

  async function save() {
    setPending(true);
    setNote(null);
    try {
      const res = await fetch("/api/admin/site-texts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, values: values[locale] }),
      });
      const body = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (res.ok && body?.ok) {
        setNote("Сохранено. Обновите страницу сайта (Ctrl+F5).");
        router.refresh();
      } else {
        setNote(body?.error ?? "Не удалось сохранить.");
      }
    } catch {
      setNote("Ошибка сети.");
    } finally {
      setPending(false);
    }
  }

  async function reset() {
    if (!window.confirm(`Вернуть все тексты ${locale.toUpperCase()} к значениям по умолчанию?`)) return;
    const res = await fetch(`/api/admin/site-texts?locale=${locale}`, { method: "DELETE" });
    if (res.ok) {
      const fresh = await fetch("/api/admin/site-texts").then((r) => r.json());
      setValues({ ru: fresh.texts.ru, en: fresh.texts.en });
      setNote("Тексты сброшены.");
      router.refresh();
    }
  }

  const input =
    "w-full rounded-lg border border-white/10 bg-bg px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setLocale("ru")}
          className={`rounded-lg px-4 py-2 text-sm ${locale === "ru" ? "bg-accent text-white" : "border border-white/15 text-secondary"}`}
        >
          Русский
        </button>
        <button
          type="button"
          onClick={() => setLocale("en")}
          className={`rounded-lg px-4 py-2 text-sm ${locale === "en" ? "bg-accent text-white" : "border border-white/15 text-secondary"}`}
        >
          English
        </button>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по полю или тексту"
          className={`${input} max-w-sm`}
        />
      </div>

      <p className="rounded-xl border border-white/10 bg-surface/50 px-4 py-3 text-xs text-secondary">
        Здесь редактируются все тексты и подписи сайта. Списки (например, шаги процесса) — по строке
        на элемент. Проекты, услуги, статьи, отзывы и FAQ правятся в своих разделах.
      </p>

      {Object.entries(groups).map(([section, fields]) => (
        <details key={section} className="rounded-2xl border border-white/10 bg-surface">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
            {section} <span className="text-xs text-secondary">({fields.length})</span>
          </summary>
          <div className="grid gap-3 border-t border-white/10 p-4 sm:grid-cols-2">
            {fields.map(([key, value]) => (
              <label key={key} className="flex flex-col gap-1">
                <span className="font-mono text-[11px] text-secondary">{key}</span>
                <textarea
                  className={input}
                  rows={value.length > 160 ? 4 : 2}
                  value={value}
                  onChange={(e) =>
                    setValues((current) => ({
                      ...current,
                      [locale]: { ...current[locale], [key]: e.target.value },
                    }))
                  }
                />
              </label>
            ))}
          </div>
        </details>
      ))}

      {note ? <p className="text-sm text-secondary">{note}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void save()}
          disabled={pending}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent/85 disabled:opacity-60"
        >
          {pending ? "Сохраняем…" : "Сохранить тексты"}
        </button>
        <button
          type="button"
          onClick={() => void reset()}
          className="rounded-lg border border-white/15 px-5 py-2.5 text-sm text-secondary hover:text-white"
        >
          Сбросить язык
        </button>
      </div>
    </div>
  );
}
