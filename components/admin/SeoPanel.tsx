"use client";

import { useEffect, useState } from "react";

const input = "rounded-lg border border-white/10 bg-bg px-3 py-2 text-base outline-none focus:border-accent";
const label = "text-xs text-secondary";

type Row = { id: string; locale: string; path: string; title: string; desc: string | null; ogImage: string | null; noindex: boolean };

/** /admin/seo — SEO-переопределения Title/Description/noindex по путям RU/EN. */
export function SeoPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState({ locale: "ru", path: "/ru", title: "", desc: "", ogImage: "", noindex: false });
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(null);

  async function load() {
    const res = await fetch("/api/admin/seo", { cache: "no-store" });
    if (res.ok) setRows((await res.json()).rows);
  }
  useEffect(() => { queueMicrotask(() => { void load(); }); }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setNote(null);
    try {
      const res = await fetch("/api/admin/seo", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const b = await res.json().catch(() => null);
      if (!res.ok) { setNote({ text: b?.error ?? "Не удалось сохранить.", ok: false }); return; }
      setNote({ text: "Сохранено.", ok: true });
      await load();
    } catch { setNote({ text: "Ошибка сети.", ok: false }); }
  }

  async function remove(row: Row) {
    if (!confirm(`Удалить SEO-запись ${row.locale} ${row.path}?`)) return;
    await fetch(`/api/admin/seo?locale=${row.locale}&path=${encodeURIComponent(row.path)}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold">SEO</h1>
        <p className="mt-1 text-sm text-secondary">Переопределения Title/Description и noindex для страниц на RU и EN.</p>
      </header>
      {note ? <p role="status" className={`rounded-lg border px-3 py-2 text-sm ${note.ok ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200"}`}>{note.text}</p> : null}

      <form onSubmit={save} className="rounded-2xl border border-white/10 bg-surface/40 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1"><label className={label} htmlFor="seo-locale">Язык</label>
            <select id="seo-locale" className={input} value={form.locale} onChange={e => setForm({ ...form, locale: e.target.value })}><option value="ru">RU</option><option value="en">EN</option></select>
          </div>
          <div className="flex flex-col gap-1"><label className={label} htmlFor="seo-path">Путь (начинается с /)</label><input id="seo-path" className={input} value={form.path} onChange={e => setForm({ ...form, path: e.target.value })} placeholder="/ru/services/web-development" /></div>
          <div className="flex flex-col gap-1 sm:col-span-2"><label className={label} htmlFor="seo-title">Title</label><input id="seo-title" className={input} maxLength={200} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
          <div className="flex flex-col gap-1 sm:col-span-2"><label className={label} htmlFor="seo-desc">Description</label><textarea id="seo-desc" className={`${input} min-h-[80px]`} maxLength={500} value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} /></div>
          <div className="flex flex-col gap-1 sm:col-span-2"><label className={label} htmlFor="seo-og">OG Image URL</label><input id="seo-og" className={input} value={form.ogImage} onChange={e => setForm({ ...form, ogImage: e.target.value })} /></div>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5 accent-[#176BFF]" checked={form.noindex} onChange={e => setForm({ ...form, noindex: e.target.checked })} /> noindex</label>
        <button type="submit" className="mt-3 rounded-lg bg-accent px-5 py-2 text-sm text-white">Сохранить</button>
      </form>

      <section className="overflow-hidden rounded-2xl border border-white/10">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-surface text-left text-xs text-secondary"><tr><th className="px-4 py-3">Язык</th><th className="px-4 py-3">Путь</th><th className="px-4 py-3">Title</th><th className="px-4 py-3">noindex</th><th className="px-4 py-3"></th></tr></thead>
            <tbody>{rows.map(r => (
              <tr key={r.id} className="border-t border-white/5">
                <td className="px-4 py-3 uppercase">{r.locale}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.path}</td>
                <td className="px-4 py-3">{r.title}</td>
                <td className="px-4 py-3">{r.noindex ? "да" : "нет"}</td>
                <td className="px-4 py-3 text-right"><button type="button" onClick={() => void remove(r)} className="text-sm text-red-300 hover:text-red-200">Удалить</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
