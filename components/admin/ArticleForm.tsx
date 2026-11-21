"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const input = "rounded-lg border border-white/10 bg-bg px-3 py-2 text-base outline-none focus:border-accent";
const area = `${input} min-h-[140px] font-mono text-sm`;
const label = "text-xs text-secondary";

type Translation = {
  title: string;
  excerpt: string;
  body: string;
  seoTitle: string;
  seoDesc: string;
  faq: { q: string; a: string }[];
};

export type ArticleData = {
  id: string;
  slug: string;
  status: string;
  sort: number;
  translations: (Translation & { locale: string; id: string })[];
};

const EMPTY_T: Translation = { title: "", excerpt: "", body: "", seoTitle: "", seoDesc: "", faq: [] };

/** Форма статьи: редактирование RU/EN прямо в админке, без деплоя. */
export function ArticleForm({ initial }: { initial: ArticleData | null }) {
  const router = useRouter();
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [status, setStatus] = useState(initial?.status ?? "draft");
  const [sort, setSort] = useState(initial?.sort ?? 0);
  const [lang, setLang] = useState<"ru" | "en">("ru");
  const [t, setT] = useState<Record<"ru" | "en", Translation>>(() => {
    const ru = initial?.translations.find((x) => x.locale === "ru");
    const en = initial?.translations.find((x) => x.locale === "en");
    const pick = (v?: Translation): Translation =>
      v ? { title: v.title, excerpt: v.excerpt, body: v.body, seoTitle: v.seoTitle, seoDesc: v.seoDesc, faq: v.faq } : EMPTY_T;
    return { ru: pick(ru), en: pick(en) };
  });
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(null);

  function patch(key: keyof Translation, value: Translation[typeof key]) {
    setT((cur) => ({ ...cur, [lang]: { ...cur[lang], [key]: value } }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setNote(null);
    try {
      const payload = {
        ...(initial ? {} : { slug, status, publishedAt: status === "published" ? new Date().toISOString() : null, sort }),
        ...(initial
          ? { slug, status, sort, translations: t }
          : {}),
      };
      const res = await fetch(initial ? `/api/admin/articles/${initial.id}` : "/api/admin/articles", {
        method: initial ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => null)) as { error?: string; article?: { id: string } } | null;
      if (!res.ok) {
        setNote({ text: body?.error ?? "Не удалось сохранить.", ok: false });
        return;
      }
      setNote({ text: "Статья сохранена.", ok: true });
      if (!initial && body?.article) {
        router.push(`/admin/articles/${body.article.id}`);
      } else {
        router.refresh();
      }
    } catch {
      setNote({ text: "Ошибка сети.", ok: false });
    } finally {
      setPending(false);
    }
  }

  const cur = t[lang];

  return (
    <form onSubmit={save} className="flex flex-col gap-5">
      {note ? (
        <p role="status" className={`rounded-lg border px-3 py-2 text-sm ${note.ok ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200"}`}>
          {note.text}
        </p>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-surface/40 p-4">
        <h2 className="text-lg font-semibold">Параметры</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label className={label} htmlFor="a-slug">URL-slug</label>
            <input id="a-slug" className={input} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="site-development-cost" />
          </div>
          <div className="flex flex-col gap-1">
            <label className={label} htmlFor="a-status">Статус</label>
            <select id="a-status" className={input} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="draft">Черновик</option>
              <option value="published">Опубликована</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className={label} htmlFor="a-sort">Порядок</label>
            <input id="a-sort" type="number" className={input} value={sort} onChange={(e) => setSort(Number(e.target.value))} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-surface/40 p-4">
        <div className="flex gap-2">
          {(["ru", "en"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`rounded-lg px-4 py-2 text-sm ${lang === l ? "bg-accent text-white" : "bg-bg text-secondary"}`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-3">
          <div className="flex flex-col gap-1">
            <label className={label} htmlFor="a-title">H1 / заголовок</label>
            <input id="a-title" className={input} value={cur.title} onChange={(e) => patch("title", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={label} htmlFor="a-excerpt">Краткое описание (анонс)</label>
            <textarea id="a-excerpt" className={area} value={cur.excerpt} onChange={(e) => patch("excerpt", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={label} htmlFor="a-body">Текст статьи (Markdown: ## H2, ### H3, - списки, [текст](ссылка))</label>
            <textarea id="a-body" className={`${area} min-h-[500px]`} value={cur.body} onChange={(e) => patch("body", e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className={label} htmlFor="a-seo-title">SEO Title (≤60)</label>
              <input id="a-seo-title" className={input} maxLength={60} value={cur.seoTitle} onChange={(e) => patch("seoTitle", e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={label} htmlFor="a-seo-desc">SEO Description (≤155)</label>
              <input id="a-seo-desc" className={input} maxLength={155} value={cur.seoDesc} onChange={(e) => patch("seoDesc", e.target.value)} />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-surface/40 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">FAQ ({lang.toUpperCase()})</h2>
          <button
            type="button"
            className="rounded border border-white/15 px-3 py-1 text-xs hover:bg-white/5"
            onClick={() => patch("faq", [...cur.faq, { q: "", a: "" }])}
          >
            + Вопрос
          </button>
        </div>
        <div className="mt-3 grid gap-3">
          {cur.faq.map((item, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-2">
              <input className={input} placeholder="Вопрос" value={item.q} onChange={(e) => {
                const next = [...cur.faq]; next[i] = { ...item, q: e.target.value }; patch("faq", next);
              }} />
              <input className={input} placeholder="Ответ" value={item.a} onChange={(e) => {
                const next = [...cur.faq]; next[i] = { ...item, a: e.target.value }; patch("faq", next);
              }} />
            </div>
          ))}
        </div>
      </section>

      <button type="submit" disabled={pending} className="self-start rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent/85 disabled:opacity-60">
        {pending ? "Сохраняем…" : "Сохранить статью"}
      </button>
    </form>
  );
}
