"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Result = { created: number; updated: number; removed: number };

/** Кнопка «Синхронизировать с сайтом» в разделе базы знаний AI. */
export function KnowledgeSyncButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(null);

  async function run() {
    setPending(true);
    setNote(null);
    try {
      const res = await fetch("/api/admin/knowledge/sync", { method: "POST" });
      const body = (await res.json().catch(() => null)) as
        | (Result & { ok?: boolean; error?: string })
        | null;
      if (res.ok && body?.ok) {
        setNote({
          text: `Готово: добавлено ${body.created}, обновлено ${body.updated}, удалено ${body.removed}.`,
          ok: true,
        });
        router.refresh();
      } else {
        setNote({ text: body?.error ?? "Синхронизация не удалась.", ok: false });
      }
    } catch {
      setNote({ text: "Ошибка сети.", ok: false });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => void run()}
        disabled={pending}
        className="rounded-lg border border-cyan/40 bg-cyan/10 px-4 py-2 text-sm font-medium text-cyan hover:bg-cyan/20 disabled:opacity-60"
      >
        {pending ? "Синхронизируем…" : "Синхронизировать с сайтом"}
      </button>
      {note ? (
        <p className={`text-xs ${note.ok ? "text-emerald-300" : "text-red-300"}`}>{note.text}</p>
      ) : null}
    </div>
  );
}
