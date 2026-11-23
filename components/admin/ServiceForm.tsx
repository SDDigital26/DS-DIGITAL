"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Translation = {
  locale: string;
  title: string;
  hero: string;
  problem: string;
  solution: string;
  benefits: string[];
  result: string;
  audience: string;
  timeline: string;
  seoTitle: string;
  seoDesc: string;
};

export type ServiceRecord = {
  id: string;
  slug: string;
  icon: string | null;
  sort: number;
  published: boolean;
  translations: Array<{
    id?: string;
    locale: string;
    title: string;
    hero: string;
    problem: string;
    solution: string;
    benefits: string[];
    result?: string | null;
    audience?: string | null;
    timeline?: string | null;
    seoTitle?: string | null;
    seoDesc?: string | null;
  }>;
};

const EMPTY: Translation = {
  locale: "ru",
  title: "",
  hero: "",
  problem: "",
  solution: "",
  benefits: [],
  result: "",
  audience: "",
  timeline: "",
  seoTitle: "",
  seoDesc: "",
};

function toTranslation(locale: string, raw?: ServiceRecord["translations"][number]): Translation {
  if (!raw) return { ...EMPTY, locale };
  return {
    locale,
    title: raw.title ?? "",
    hero: raw.hero ?? "",
    problem: raw.problem ?? "",
    solution: raw.solution ?? "",
    benefits: Array.isArray(raw.benefits) ? (raw.benefits as string[]) : [],
    result: raw.result ?? "",
    audience: raw.audience ?? "",
    timeline: raw.timeline ?? "",
    seoTitle: raw.seoTitle ?? "",
    seoDesc: raw.seoDesc ?? "",
  };
}

export function ServiceForm({ service }: { service?: ServiceRecord }) {
  const router = useRouter();
  const [slug, setSlug] = useState(service?.slug ?? "");
  const [icon, setIcon] = useState(service?.icon ?? "");
  const [sort, setSort] = useState(service?.sort ?? 0);
  const [published, setPublished] = useState(service?.published ?? true);
  const [ru, setRu] = useState<Translation>(() =>
    toTranslation("ru", service?.translations.find((t) => t.locale === "ru")),
  );
  const [en, setEn] = useState<Translation>(() =>
    toTranslation("en", service?.translations.find((t) => t.locale === "en")),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(service);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const payload = {
      slug: slug.trim(),
      icon: icon.trim() || null,
      sort: Number(sort) || 0,
      published,
      translations: {
        ru: { ...ru, benefits: ru.benefits },
        en: { ...en, benefits: en.benefits },
      },
    };

    try {
      const res = await fetch(
        isEdit ? `/api/admin/services/${service!.id}` : "/api/admin/services",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (res.ok) {
        router.replace("/admin/services");
        router.refresh();
        return;
      }

      if (res.status === 409) {
        setError("Услуга с таким slug уже существует.");
      } else if (res.status === 403) {
        setError("Недостаточно прав для изменения услуг.");
      } else {
        const body = (await res.json().catch(() => null)) as
          | { error?: string; issues?: Array<{ path: (string | number)[]; message: string }> }
          | null;
        const detail = body?.issues?.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
        setError(detail ?? body?.error ?? "Не удалось сохранить услугу.");
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

  function languageBlock(
    locale: "ru" | "en",
    value: Translation,
    onChange: (next: Translation) => void,
  ) {
    return (
      <fieldset className="rounded-2xl border border-white/10 bg-bg p-4">
        <legend className="px-2 text-sm font-semibold">
          {locale === "ru" ? "Русский" : "English"}
        </legend>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor={`${locale}-title`}>Заголовок</label>
            <input
              id={`${locale}-title`}
              className={inputClass}
              value={value.title}
              maxLength={120}
              required
              onChange={(e) => onChange({ ...value, title: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor={`${locale}-hero`}>
              Краткое описание (hero)
            </label>
            <textarea
              id={`${locale}-hero`}
              className={inputClass}
              rows={3}
              maxLength={2000}
              value={value.hero}
              onChange={(e) => onChange({ ...value, hero: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor={`${locale}-problem`}>
              Проблема клиента
            </label>
            <textarea
              id={`${locale}-problem`}
              className={inputClass}
              rows={4}
              maxLength={4000}
              value={value.problem}
              onChange={(e) => onChange({ ...value, problem: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor={`${locale}-solution`}>
              Наше решение
            </label>
            <textarea
              id={`${locale}-solution`}
              className={inputClass}
              rows={4}
              maxLength={4000}
              value={value.solution}
              onChange={(e) => onChange({ ...value, solution: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor={`${locale}-result`}>
              Результат для клиента
            </label>
            <textarea
              id={`${locale}-result`}
              className={inputClass}
              rows={3}
              maxLength={2000}
              value={value.result}
              onChange={(e) => onChange({ ...value, result: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor={`${locale}-audience`}>
              Кому подходит услуга
            </label>
            <textarea
              id={`${locale}-audience`}
              className={inputClass}
              rows={3}
              maxLength={2000}
              value={value.audience}
              onChange={(e) => onChange({ ...value, audience: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor={`${locale}-benefits`}>
              Преимущества (по одному пункту на строку)
            </label>
            <textarea
              id={`${locale}-benefits`}
              className={inputClass}
              rows={4}
              maxLength={2000}
              value={value.benefits.join("\n")}
              onChange={(e) =>
                onChange({
                  ...value,
                  benefits: e.target.value
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor={`${locale}-timeline`}>
              Сроки (только подтверждённые; иначе блок скрыт)
            </label>
            <textarea
              id={`${locale}-timeline`}
              className={inputClass}
              rows={2}
              maxLength={1000}
              value={value.timeline}
              onChange={(e) => onChange({ ...value, timeline: e.target.value })}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor={`${locale}-seoTitle`}>SEO title</label>
              <input
                id={`${locale}-seoTitle`}
                className={inputClass}
                maxLength={70}
                value={value.seoTitle}
                onChange={(e) => onChange({ ...value, seoTitle: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor={`${locale}-seoDesc`}>SEO description</label>
              <input
                id={`${locale}-seoDesc`}
                className={inputClass}
                maxLength={200}
                value={value.seoDesc}
                onChange={(e) => onChange({ ...value, seoDesc: e.target.value })}
              />
            </div>
          </div>
        </div>
      </fieldset>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="rounded-2xl border border-white/10 bg-surface p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="slug">Slug (URL)</label>
            <input
              id="slug"
              className={inputClass}
              value={slug}
              required
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              maxLength={80}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="icon">Иконка (код)</label>
            <input
              id="icon"
              className={inputClass}
              value={icon}
              maxLength={40}
              onChange={(e) => setIcon(e.target.value)}
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
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="h-5 w-5 accent-[#176BFF]"
            />
            Опубликована
          </label>
        </div>
        <p className="mt-2 text-xs text-secondary">
          Slug используется в адресе: /ru/services/{slug || "…"} · /en/services/{slug || "…"}.
          После сохранения публичные страницы обновятся без деплоя.
        </p>
      </div>

      {languageBlock("ru", ru, setRu)}
      {languageBlock("en", en, setEn)}

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
          {pending ? "Сохраняем…" : isEdit ? "Сохранить изменения" : "Создать услугу"}
        </button>
        <button
          type="button"
          onClick={() => router.replace("/admin/services")}
          className="rounded-lg border border-white/15 px-4 py-2.5 text-sm text-secondary hover:text-white"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
