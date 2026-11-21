"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Translation = {
  title: string;
  summary: string;
  description: string;
  task: string;
  solution: string;
  features: string[];
  tech: string[];
  category: string;
  seoTitle: string;
  seoDesc: string;
  ogImage: string;
};

export type ProjectRecord = {
  id: string;
  slug: string;
  status: string;
  sort: number;
  published: boolean;
  translations: Array<{ locale: string } & Partial<Translation>>;
  images: Array<{ id: string; url: string; altRu: string; altEn: string; type: string }>;
};

const STATUSES = [
  { value: "draft", label: "Черновик" },
  { value: "live", label: "В работе" },
  { value: "in_development", label: "В разработке" },
  { value: "archived", label: "Архив" },
];

const EMPTY: Translation = {
  title: "",
  summary: "",
  description: "",
  task: "",
  solution: "",
  features: [],
  tech: [],
  category: "",
  seoTitle: "",
  seoDesc: "",
  ogImage: "",
};

function toTranslation(raw?: Partial<Translation>): Translation {
  return {
    ...EMPTY,
    ...raw,
    features: Array.isArray(raw?.features) ? (raw.features as string[]) : [],
    tech: Array.isArray(raw?.tech) ? (raw.tech as string[]) : [],
  };
}

const input = "rounded-lg border border-white/10 bg-bg px-3 py-2 text-base outline-none focus:border-accent";
const label = "text-xs text-secondary";

export function ProjectForm({ project }: { project?: ProjectRecord }) {
  const router = useRouter();
  const isEdit = Boolean(project);

  const [slug, setSlug] = useState(project?.slug ?? "");
  const [status, setStatus] = useState(project?.status ?? "draft");
  const [sort, setSort] = useState(project?.sort ?? 0);
  const [published, setPublished] = useState(project?.published ?? false);
  const [ru, setRu] = useState<Translation>(() =>
    toTranslation(project?.translations.find((t) => t.locale === "ru")),
  );
  const [en, setEn] = useState<Translation>(() =>
    toTranslation(project?.translations.find((t) => t.locale === "en")),
  );
  const [images, setImages] = useState(project?.images ?? []);
  const [newImage, setNewImage] = useState({ url: "", altRu: "", altEn: "" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const translations = {
      ru: { ...ru, ogImage: ru.ogImage || undefined },
      en: { ...en, ogImage: en.ogImage || undefined },
    };

    // Не отправляем пустой язык — валидатор требует хотя бы один.
    const payload = {
      slug: slug.trim(),
      status,
      sort: Number(sort) || 0,
      published,
      translations: {
        ...(ru.title.trim() ? { ru: translations.ru } : {}),
        ...(en.title.trim() ? { en: translations.en } : {}),
      },
      images: images.map((image, index) => ({
        url: image.url,
        altRu: image.altRu,
        altEn: image.altEn,
        type: index === 0 ? "cover" : "screenshot",
        sort: index,
      })),
    };

    try {
      const res = await fetch(isEdit ? `/api/admin/projects/${project!.id}` : "/api/admin/projects", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.replace("/admin/projects");
        router.refresh();
        return;
      }

      if (res.status === 409) setError("Кейс с таким slug уже существует.");
      else if (res.status === 403) setError("Недостаточно прав.");
      else {
        const body = (await res.json().catch(() => null)) as
          | { error?: string; issues?: Array<{ path: (string | number)[]; message: string }> }
          | null;
        setError(
          body?.issues?.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") ??
            body?.error ??
            "Не удалось сохранить кейс.",
        );
      }
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз.");
    } finally {
      setPending(false);
    }
  }

  function block(locale: "ru" | "en", value: Translation, onChange: (next: Translation) => void) {
    return (
      <fieldset className="rounded-2xl border border-white/10 bg-bg p-4">
        <legend className="px-2 text-sm font-semibold">{locale === "ru" ? "Русский" : "English"}</legend>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className={label} htmlFor={`${locale}-title`}>Название</label>
            <input id={`${locale}-title`} className={input} value={value.title} maxLength={120} required onChange={(e) => onChange({ ...value, title: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={label} htmlFor={`${locale}-summary`}>Краткое описание</label>
            <textarea id={`${locale}-summary`} className={input} rows={2} maxLength={500} value={value.summary} onChange={(e) => onChange({ ...value, summary: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={label} htmlFor={`${locale}-desc`}>Полное описание</label>
            <textarea id={`${locale}-desc`} className={input} rows={4} maxLength={8000} value={value.description} onChange={(e) => onChange({ ...value, description: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className={label} htmlFor={`${locale}-task`}>Задача</label>
              <textarea id={`${locale}-task`} className={input} rows={3} maxLength={4000} value={value.task} onChange={(e) => onChange({ ...value, task: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={label} htmlFor={`${locale}-solution`}>Решение</label>
              <textarea id={`${locale}-solution`} className={input} rows={3} maxLength={4000} value={value.solution} onChange={(e) => onChange({ ...value, solution: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className={label} htmlFor={`${locale}-features`}>Функции (по строке)</label>
              <textarea
                id={`${locale}-features`}
                className={input}
                rows={3}
                value={value.features.join("\n")}
                onChange={(e) => onChange({ ...value, features: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={label} htmlFor={`${locale}-tech`}>Технологии (по строке)</label>
              <textarea
                id={`${locale}-tech`}
                className={input}
                rows={3}
                value={value.tech.join("\n")}
                onChange={(e) => onChange({ ...value, tech: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className={label} htmlFor={`${locale}-cat`}>Категория</label>
              <input id={`${locale}-cat`} className={input} maxLength={80} value={value.category} onChange={(e) => onChange({ ...value, category: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={label} htmlFor={`${locale}-seoTitle`}>SEO title</label>
              <input id={`${locale}-seoTitle`} className={input} maxLength={70} value={value.seoTitle} onChange={(e) => onChange({ ...value, seoTitle: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={label} htmlFor={`${locale}-seoDesc`}>SEO description</label>
              <input id={`${locale}-seoDesc`} className={input} maxLength={200} value={value.seoDesc} onChange={(e) => onChange({ ...value, seoDesc: e.target.value })} />
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
            <label className={label} htmlFor="p-slug">Slug (URL)</label>
            <input id="p-slug" className={input} value={slug} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={80} onChange={(e) => setSlug(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={label} htmlFor="p-status">Статус</label>
            <select id="p-status" className={input} value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className={label} htmlFor="p-sort">Порядок</label>
            <input id="p-sort" type="number" min={0} className={input} value={sort} onChange={(e) => setSort(Number(e.target.value))} />
          </div>
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input type="checkbox" className="h-5 w-5 accent-[#176BFF]" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            Опубликован
          </label>
        </div>
        <p className="mt-2 text-xs text-secondary">
          Кейс публикуется только для реально существующего проекта (ТЗ §4). По умолчанию — черновик.
        </p>
      </div>

      {block("ru", ru, setRu)}
      {block("en", en, setEn)}

      <fieldset className="rounded-2xl border border-white/10 bg-surface p-4">
        <legend className="px-2 text-sm font-semibold">Изображения</legend>
        <p className="mb-2 text-xs text-secondary">Ссылки на изображения (URL). Первое станет обложкой.</p>
        <ul className="mb-3 flex flex-col gap-2">
          {images.map((image, index) => (
            <li key={`${image.url}-${index}`} className="flex items-center gap-2 text-sm">
              <span className="truncate font-mono text-xs text-secondary">{image.url}</span>
              <button type="button" className="ml-auto text-xs text-red-300" onClick={() => setImages(images.filter((_, i) => i !== index))}>
                удалить
              </button>
            </li>
          ))}
        </ul>
        <div className="grid gap-2 sm:grid-cols-3">
          <input className={input} placeholder="https://…" value={newImage.url} onChange={(e) => setNewImage({ ...newImage, url: e.target.value })} aria-label="URL изображения" />
          <input className={input} placeholder="alt RU" value={newImage.altRu} onChange={(e) => setNewImage({ ...newImage, altRu: e.target.value })} aria-label="Alt RU" />
          <input className={input} placeholder="alt EN" value={newImage.altEn} onChange={(e) => setNewImage({ ...newImage, altEn: e.target.value })} aria-label="Alt EN" />
        </div>
        <button
          type="button"
          className="mt-2 rounded-lg border border-white/15 px-3 py-2 text-sm text-secondary hover:text-white"
          onClick={() => {
            if (!/^https?:\/\//i.test(newImage.url.trim())) {
              setError("Ссылка на изображение должна начинаться с http(s)://");
              return;
            }
            setImages([...images, { id: "", url: newImage.url.trim(), altRu: newImage.altRu, altEn: newImage.altEn, type: "screenshot" }]);
            setNewImage({ url: "", altRu: "", altEn: "" });
          }}
        >
          Добавить изображение
        </button>
      </fieldset>

      {error ? (
        <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent/85 disabled:opacity-60">
          {pending ? "Сохраняем…" : isEdit ? "Сохранить изменения" : "Создать кейс"}
        </button>
        <button type="button" onClick={() => router.replace("/admin/projects")} className="rounded-lg border border-white/15 px-4 py-2.5 text-sm text-secondary hover:text-white">
          Отмена
        </button>
      </div>
    </form>
  );
}
