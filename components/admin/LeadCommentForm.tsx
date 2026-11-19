"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LeadCommentForm({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      if (res.ok) {
        setText("");
        setMessage("Комментарий добавлен.");
        router.refresh();
      } else {
        setMessage("Не удалось добавить комментарий.");
      }
    } catch {
      setMessage("Ошибка сети. Попробуйте ещё раз.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <label htmlFor="comment" className="text-sm text-secondary">
        Новый комментарий
      </label>
      <textarea
        id="comment"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setMessage(null);
        }}
        maxLength={2000}
        rows={3}
        className="rounded-lg border border-white/10 bg-surface px-3 py-2 text-base text-white outline-none focus:border-accent"
        placeholder="Звонок назначен на завтра, 14:00…"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || text.trim().length === 0}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/85 disabled:opacity-50"
        >
          {pending ? "Добавляем…" : "Добавить"}
        </button>
        {message ? <span className="text-sm text-secondary">{message}</span> : null}
      </div>
    </form>
  );
}
