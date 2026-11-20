"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type TestimonialRecord = {
  id: string;
  authorName: string;
  authorRole: string | null;
  text: string;
  locale: string;
  avatarUrl: string | null;
  approved: boolean;
  consentAt: string | null;
  sort: number;
};

function toDateInput(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function TestimonialForm({ testimonial }: { testimonial?: TestimonialRecord }) {
  const router = useRouter();
  const [authorName, setAuthorName] = useState(testimonial?.authorName ?? "");
  const [authorRole, setAuthorRole] = useState(testimonial?.authorRole ?? "");
  const [text, setText] = useState(testimonial?.text ?? "");
  const [locale, setLocale] = useState(testimonial?.locale ?? "ru");
  const [avatarUrl, setAvatarUrl] = useState(testimonial?.avatarUrl ?? "");
  const [sort, setSort] = useState(testimonial?.sort ?? 0);
  const [approved, setApproved] = useState(testimonial?.approved ?? false);
  const [consentDate, setConsentDate] = useState(toDateInput(testimonial?.consentAt ?? null));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(testimonial);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (approved && !consentDate) {
      setError("Для публикации нужно зафиксировать дату согласия автора.");
      return;
    }

    setPending(true);

    const payload = {
      authorName: authorName.trim(),
      authorRole: authorRole.trim() || undefined,
      text: text.trim(),
      locale,
      avatarUrl: avatarUrl.trim() || "",
      approved,
      consentAt: consentDate ? new Date(`${consentDate}T00:00:00.000Z`).toISOString() : null,
      sort: Number(sort) || 0,
    };

    try {
      const res = await fetch(
        isEdit ? `/api/admin/testimonials/${testimonial!.id}` : "/api/admin/testimonials",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (res.ok) {
        router.replace("/admin/testimonials");
        router.refresh();
        return;
      }

      if (res.status === 403) {
        setError("Недостаточно прав для изменения отзывов.");
      } else {
        const body = (await res.json().catch(() => null)) as
          | { error?: string; message?: string; issues?: Array<{ path: (string | number)[]; message: string }> }
          | null;
        const detail = body?.issues?.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
        setError(detail ?? body?.message ?? body?.error ?? "Не удалось сохранить отзыв.");
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
      <div className="grid gap-4 rounded-2xl border border-white/10 bg-surface p-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="authorName">Имя автора</label>
          <input
            id="authorName"
            className={inputClass}
            value={authorName}
            required
            maxLength={80}
            onChange={(e) => setAuthorName(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="authorRole">Должность / компания (необязательно)</label>
          <input
            id="authorRole"
            className={inputClass}
            value={authorRole}
            maxLength={80}
            onChange={(e) => setAuthorRole(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="locale">Язык отзыва</label>
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

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className={labelClass} htmlFor="text">Текст отзыва</label>
          <textarea
            id="text"
            className={inputClass}
            rows={5}
            required
            maxLength={2000}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className={labelClass} htmlFor="avatarUrl">URL аватара (необязательно)</label>
          <input
            id="avatarUrl"
            className={inputClass}
            value={avatarUrl}
            maxLength={500}
            placeholder="https://…"
            onChange={(e) => setAvatarUrl(e.target.value)}
          />
        </div>
      </div>

      <fieldset className="rounded-2xl border border-white/10 bg-surface p-4">
        <legend className="px-2 text-sm font-semibold">Публикация</legend>

        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={approved}
              onChange={(e) => setApproved(e.target.checked)}
              className="h-5 w-5 accent-[#176BFF]"
            />
            Отзыв одобрен
          </label>

          <div className="flex flex-col gap-1 sm:max-w-xs">
            <label className={labelClass} htmlFor="consentAt">Дата согласия автора на публикацию</label>
            <input
              id="consentAt"
              type="date"
              className={inputClass}
              value={consentDate}
              onChange={(e) => setConsentDate(e.target.value)}
            />
          </div>

          <p className="text-xs text-secondary">
            Отзыв появится на сайте только при одновременно выполненных условиях: «одобрен» и есть
            дата согласия. Без согласия автора публикация запрещена (ТЗ §4.6).
          </p>

          {approved && !consentDate ? (
            <p className="text-xs text-amber-300">
              Отзыв не будет опубликован: не указана дата согласия.
            </p>
          ) : null}
        </div>
      </fieldset>

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
          {pending ? "Сохраняем…" : isEdit ? "Сохранить изменения" : "Создать отзыв"}
        </button>
        <button
          type="button"
          onClick={() => router.replace("/admin/testimonials")}
          className="rounded-lg border border-white/15 px-4 py-2.5 text-sm text-secondary hover:text-white"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
