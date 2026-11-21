"use client";

import { useEffect, useState } from "react";

const input = "rounded-lg border border-white/10 bg-bg px-3 py-2 text-base outline-none focus:border-accent";
const label = "text-xs text-secondary";

type PageRow = { id: string; path: string; published: boolean; translations: { locale: string; title: string; content: unknown }[] };

/** /admin/pages — страницы контента RU/EN (право content). */
export function PagesPanel() {
  const [pages, setPages] = useState<PageRow[]>([]);
  const [form, setForm] = useState({ path: "", published: false, ruTitle: "", ruContent: "", enTitle: "", enContent: "" });
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(null);

  async function load() {
    const res = await fetch("/api/admin/pages", { cache: "no-store" });
    if (res.ok) setPages((await res.json()).pages);
  }
  useEffect(() => { queueMicrotask(() => { void load(); }); }, []);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setNote(null);
    try {
      const res = await fetch("/api/admin/pages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: form.path, published: form.published,
          ru: { title: form.ruTitle, content: form.ruContent },
          en: { title: form.enTitle, content: form.enContent },
        }),
      });
      const b = await res.json().catch(() => null);
      if (!res.ok) { setNote({ text: b?.error ?? "Не удалось создать.", ok: false }); return; }
      setForm({ path: "", published: false, ruTitle: "", ruContent: "", enTitle: "", enContent: "" });
      setNote({ text: "Страница создана.", ok: true });
      await load();
    } catch { setNote({ text: "Ошибка сети.", ok: false }); }
  }

  async function toggle(row: PageRow) {
    await fetch(`/api/admin/pages/${row.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ published: !row.published }),
    });
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Удалить страницу?")) return;
    await fetch(`/api/admin/pages/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Контент · страницы</h1>
        <p className="mt-1 text-sm text-secondary">Дополнительные страницы с переводами RU/EN. Публикация — без деплоя.</p>
      </header>
      {note ? <p role="status" className={`rounded-lg border px-3 py-2 text-sm ${note.ok ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200"}`}>{note.text}</p> : null}

      <form onSubmit={create} className="rounded-2xl border border-white/10 bg-surface/40 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1"><label className={label} htmlFor="p-path">Путь</label><input id="p-path" className={input} value={form.path} onChange={e => setForm({ ...form, path: e.target.value })} placeholder="/about-us" /></div>
          <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" className="h-5 w-5 accent-[#176BFF]" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })} /> Опубликована</label>
          <div className="flex flex-col gap-1"><label className={label} htmlFor="p-ru-t">RU Title</label><input id="p-ru-t" className={input} value={form.ruTitle} onChange={e => setForm({ ...form, ruTitle: e.target.value })} /></div>
          <div className="flex flex-col gap-1"><label className={label} htmlFor="p-en-t">EN Title</label><input id="p-en-t" className={input} value={form.enTitle} onChange={e => setForm({ ...form, enTitle: e.target.value })} /></div>
          <div className="flex flex-col gap-1"><label className={label} htmlFor="p-ru-c">RU Content</label><textarea id="p-ru-c" className={`${input} min-h-[100px]`} value={form.ruContent} onChange={e => setForm({ ...form, ruContent: e.target.value })} /></div>
          <div className="flex flex-col gap-1"><label className={label} htmlFor="p-en-c">EN Content</label><textarea id="p-en-c" className={`${input} min-h-[100px]`} value={form.enContent} onChange={e => setForm({ ...form, enContent: e.target.value })} /></div>
        </div>
        <button type="submit" className="mt-3 rounded-lg bg-accent px-5 py-2 text-sm text-white">Создать</button>
      </form>

      <section className="overflow-hidden rounded-2xl border border-white/10">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-surface text-left text-xs text-secondary"><tr><th className="px-4 py-3">Slug</th><th className="px-4 py-3">RU</th><th className="px-4 py-3">EN</th><th className="px-4 py-3">Статус</th><th className="px-4 py-3"></th></tr></thead>
            <tbody>{pages.map(p => (
              <tr key={p.id} className="border-t border-white/5">
                <td className="px-4 py-3 font-mono text-xs">{p.path}</td>
                <td className="px-4 py-3">{p.translations.find(t => t.locale === "ru")?.title || "—"}</td>
                <td className="px-4 py-3">{p.translations.find(t => t.locale === "en")?.title || "—"}</td>
                <td className="px-4 py-3"><button type="button" onClick={() => void toggle(p)} className={p.published ? "text-emerald-300" : "text-secondary"}>{p.published ? "Опубликована" : "Черновик"}</button></td>
                <td className="px-4 py-3 text-right"><button type="button" onClick={() => void remove(p.id)} className="text-sm text-red-300 hover:text-red-200">Удалить</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
