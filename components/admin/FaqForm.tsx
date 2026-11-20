"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type FaqRecord = {
  id: string;
  locale: string;
  section: string;
  question: string;
  answer: string;
  sort: number;
  published: boolean;
};

export function FaqForm({ item }: { item?: FaqRecord }) {
  const router = useRouter();
  const [locale, setLocale] = useState(item?.locale ?? "ru");
  const [section, setSection] = useState(item?.section ?? "faq");
  const [question, setQuestion] = useState(item?.question ?? "");
  const [answer, setAnswer] = useState(item?.answer ?? "");
  const [sort, setSort] = useState(item?.sort ?? 0);
  const [published, setPublished] = useState(item?.published ?? true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(item);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const payload = {
      locale,
      section: section.trim() || "faq",
      question: question.trim(),
      answer: answer.trim(),
      sort: Number(sort) || 0,
      published,
    };

    try {
      const res = await fetch(isEdit ? `/api/admin/faq/${item!.id}` : "/api/admin/faq", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.replace("/admin/faq");
        router.refresh();
        return;
      }

      if (res.status === 403) {
        setError("Недостаточно прав для изменения FAQ.");
      } else {
        const body = (await res.json().catch(() => null)) as
          | { error?: string; issues?: Array<{ path: (string | number)[]; message: string }> }
          | null;
        const detail = body?.issues?.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
        setError(detail ?? body?.error ?? "Не удалось сохранить вопрос.");
      }
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз.");
    } finally {
      setPending(false);
    }
  }

  const inputClass =
    "rounded-lg border border-white/10 bg-bg px-3 py-2 text-base outline-none focus:border-accent";
  const labelClass = "text-xs text-secondary";

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="grid gap-4 rounded-2xl border border-white/10 bg-surface p-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="locale">Язык</label>
          <select
            id="locale"
            className={inputClass}
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
          >
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="section">Секция</label>
          <input
            id="section"
            className={inputClass}
            value={section}
            maxLength={40}
            onChange={(e) => setSection(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="sort">Порядок</label>
          <input
            id="sort"
            type="number"
            min={0}
            max={1000}
            className={inputClass}
            value={sort}
            onChange={(e) => setSort(Number(e.target.value))}
          />
        </div>

        <div className="flex flex-col gap-1 sm:col-span-3">
          <label className={labelClass} htmlFor="question">Вопрос</label>
          <input
            id="question"
            className={inputClass}
            value={question}
            required
            maxLength={300}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1 sm:col-span-3">
          <label className={labelClass} htmlFor="answer">Ответ</label>
          <textarea
            id="answer"
            className={inputClass}
            rows={6}
            required
            maxLength={4000}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 text-sm sm:col-span-3">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="h-5 w-5 accent-[#176BFF]"
          />
          Опубликован
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
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent/85 disabled:opacity-60"
        >
          {pending ? "Сохраняем…" : isEdit ? "Сохранить изменения" : "Создать вопрос"}
        </button>
        <button
          type="button"
          onClick={() => router.replace("/admin/faq")}
          className="rounded-lg border border-white/15 px-4 py-2.5 text-sm text-secondary hover:text-white"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
