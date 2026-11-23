"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { S3ProviderForm } from "@/components/admin/S3ProviderForm";

const input = "rounded-lg border border-white/10 bg-bg px-3 py-2 text-base outline-none focus:border-accent";
const label = "text-xs text-secondary";

type Asset = { id: string; key: string; url: string; mimeType: string; altRu: string; altEn: string; width: number | null; height: number | null; sizeBytes: number };

/** /admin/media — библиотека медиа (метаданные; загрузка файлов — по S3, ТЗ этап 0 [С]). */
export function MediaPanel() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [form, setForm] = useState({ key: "", url: "", mimeType: "image/webp", altRu: "", altEn: "" });
  const [uploadForm, setUploadForm] = useState({ file: null as File | null, altRu: "", altEn: "" });
  const [uploading, setUploading] = useState(false);
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(null);

  async function load() {
    const res = await fetch("/api/admin/media", { cache: "no-store" });
    if (res.ok) setAssets((await res.json()).assets);
  }
  useEffect(() => { queueMicrotask(() => { void load(); }); }, []);

  async function add(event: React.FormEvent) {
    event.preventDefault();
    setNote(null);
    try {
      const res = await fetch("/api/admin/media", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const b = await res.json().catch(() => null);
      if (!res.ok) { setNote({ text: b?.error ?? "Не удалось добавить.", ok: false }); return; }
      setForm({ key: "", url: "", mimeType: "image/webp", altRu: "", altEn: "" });
      setNote({ text: "Добавлено.", ok: true });
      await load();
    } catch { setNote({ text: "Ошибка сети.", ok: false }); }
  }

  async function uploadFile(event: React.FormEvent) {
    event.preventDefault();
    if (!uploadForm.file) return;
    setUploading(true);
    setNote(null);
    try {
      const body = new FormData();
      body.set("file", uploadForm.file);
      body.set("altRu", uploadForm.altRu);
      body.set("altEn", uploadForm.altEn);
      const res = await fetch("/api/admin/media/upload", { method: "POST", body });
      const b = await res.json().catch(() => null);
      if (!res.ok) {
        setNote({ text: b?.error ?? "Не удалось загрузить файл.", ok: false });
      } else {
        setNote({ text: "Файл загружен в хранилище.", ok: true });
        setUploadForm({ file: null, altRu: "", altEn: "" });
        await load();
      }
    } catch {
      setNote({ text: "Ошибка сети.", ok: false });
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Удалить запись?")) return;
    await fetch(`/api/admin/media?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Медиа</h1>
        <p className="mt-1 text-sm text-secondary">Библиотека изображений: загрузка в S3, метаданные и alt RU/EN.</p>
      </header>
      {note ? <p role="status" className={`rounded-lg border px-3 py-2 text-sm ${note.ok ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200"}`}>{note.text}</p> : null}

      <S3ProviderForm onSaved={() => void load()} />

      <form onSubmit={uploadFile} className="rounded-2xl border border-white/10 bg-surface/40 p-4">
        <h2 className="text-lg font-semibold">Загрузить изображение</h2>
        <p className="mt-1 text-xs text-secondary">Только изображения (JPEG, PNG, WebP, AVIF, GIF), до 10 МБ. Исполняемые расширения отклоняются.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className={label} htmlFor="upload-file">Файл</label>
            <input id="upload-file" type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" className={input} onChange={e => setUploadForm({ ...uploadForm, file: e.target.files?.[0] ?? null })} />
          </div>
          <div className="flex flex-col gap-1"><label className={label} htmlFor="upload-alt-ru">Alt RU</label><input id="upload-alt-ru" className={input} value={uploadForm.altRu} onChange={e => setUploadForm({ ...uploadForm, altRu: e.target.value })} /></div>
          <div className="flex flex-col gap-1"><label className={label} htmlFor="upload-alt-en">Alt EN</label><input id="upload-alt-en" className={input} value={uploadForm.altEn} onChange={e => setUploadForm({ ...uploadForm, altEn: e.target.value })} /></div>
        </div>
        <button type="submit" disabled={uploading || !uploadForm.file} className="mt-3 rounded-lg bg-accent px-5 py-2 text-sm text-white disabled:opacity-50">{uploading ? "Загружаем…" : "Загрузить"}</button>
      </form>

      <h2 className="text-lg font-semibold">Добавить запись вручную</h2>
      <form onSubmit={add} className="rounded-2xl border border-white/10 bg-surface/40 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1"><label className={label} htmlFor="m-key">Ключ</label><input id="m-key" className={input} value={form.key} onChange={e => setForm({ ...form, key: e.target.value })} placeholder="cases/rideflow/calendar" /></div>
          <div className="flex flex-col gap-1"><label className={label} htmlFor="m-url">URL</label><input id="m-url" className={input} type="url" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://…" /></div>
          <div className="flex flex-col gap-1"><label className={label} htmlFor="m-alt-ru">Alt RU</label><input id="m-alt-ru" className={input} value={form.altRu} onChange={e => setForm({ ...form, altRu: e.target.value })} /></div>
          <div className="flex flex-col gap-1"><label className={label} htmlFor="m-alt-en">Alt EN</label><input id="m-alt-en" className={input} value={form.altEn} onChange={e => setForm({ ...form, altEn: e.target.value })} /></div>
        </div>
        <button type="submit" className="mt-3 rounded-lg bg-accent px-5 py-2 text-sm text-white">Добавить</button>
      </form>

      <h2 className="text-lg font-semibold">Записи библиотеки</h2>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {assets.length === 0 ? <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-secondary sm:col-span-3">Записей пока нет.</p> : null}
        {assets.map(a => (
          <article key={a.id} className="rounded-xl border border-white/10 bg-surface p-3">
            {a.mimeType.startsWith("image/") ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                <Image src={a.url} alt={a.altRu || a.key} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" unoptimized />
              </div>
            ) : null}
            <p className="mt-2 truncate font-mono text-xs">{a.key}</p>
            <p className="mt-1 text-xs text-secondary">{a.altRu || "—"}</p>
            <button type="button" onClick={() => void remove(a.id)} className="mt-2 text-xs text-red-300 hover:text-red-200">Удалить</button>
          </article>
        ))}
      </section>
    </div>
  );
}
