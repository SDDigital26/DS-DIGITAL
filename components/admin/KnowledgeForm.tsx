"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type KnowledgeRecord = {
  id: string;
  locale: string;
  title: string;
  content: string;
  category: string | null;
  published: boolean;
  sort: number;
};

/** Форма факта базы знаний внутреннего AI-агента. */
export function KnowledgeForm({ item }: { item?: KnowledgeRecord }) {
  const router = useRouter();
  const [locale, setLocale] = useState(item?.locale ?? "ru");
  const [title, setTitle] = useState(item?.title ?? "");
  const [content, setContent] = useState(item?.content ?? "");
  const [category, setCategory] = useState(item?.category ?? "");
  const [sort, setSort] = useState(item?.sort ?? 0);
  const [published, setPublished] = useState(item?.published ?? true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(item);

  const inputClass =
    "rounded-lg border border-white/10 bg-bg px-3 py-2 text-base outline-none focus:border-accent";
  const labelClass = "text-xs text-secondary";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch(isEdit ? `/api/admin/knowledge/${item!.id}` : "/api/admin/knowledge", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          title: title.trim(),
          content: content.trim(),
          category: category.trim() || null,
          published,
          sort: Number(sort) || 0,
        }),
      });
      if (res.ok) {
        router.push("/admin/knowledge");
        router.refresh();
        return;
      }
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Не удалось сохранить факт.");
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <p className="rounded-xl border border-white/10 bg-surface/50 px-4 py-3 text-xs text-secondary">
        Вносите только согласованные факты о компании, услугах и процессах. В промпт попадают
        опубликованные записи нужного языка (не более 6 коротких фактов). Цены, сроки и кейсы —
        только если они подтверждены.
      </p>

      <div className="grid gap-4 rounded-2xl border border-white/10 bg-surface p-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="locale">Язык</label>
          <select id="locale" className={inputClass} value={locale} onChange={(e) => setLocale(e.target.value)}>
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="category">Категория</label>
          <input
            id="category"
            className={inputClass}
            value={category}
            maxLength={80}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Услуги, процессы, контакты"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="sort">Порядок</label>
          <input
            id="sort"
            type="number"
            min={0}
            max={10000}
            className={inputClass}
            value={sort}
            onChange={(e) => setSort(Number(e.target.value))}
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-3">
          <label className={labelClass} htmlFor="title">Название факта</label>
          <input
            id="title"
            className={inputClass}
            value={title}
            required
            maxLength={160}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Направления разработки"
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-3">
          <label className={labelClass} htmlFor="content">Факт для агента</label>
          <textarea
            id="content"
            className={inputClass}
            rows={8}
            required
            maxLength={4000}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Коротко и по делу: что агент может сказать посетителю"
          />
        </div>
        <label className="flex items-center gap-2 text-sm sm:col-span-3">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="h-5 w-5 accent-[#176BFF]"
          />
          Использовать в ответах агента
        </label>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/85 disabled:opacity-50"
        >
          {pending ? "Сохраняем…" : "Сохранить"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-white/15 px-4 py-2 text-sm text-secondary hover:text-white"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
