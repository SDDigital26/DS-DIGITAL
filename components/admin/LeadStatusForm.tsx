"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/leads";

export function LeadStatusForm({ leadId, current }: { leadId: string; current: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(current);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const dirty = status !== current;

  async function save() {
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setMessage("Статус сохранён.");
        router.refresh();
      } else {
        setMessage("Не удалось сохранить статус.");
      }
    } catch {
      setMessage("Ошибка сети. Попробуйте ещё раз.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="status" className="text-sm text-secondary">
        Статус заявки
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <select
          id="status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setMessage(null);
          }}
          className="rounded-lg border border-white/10 bg-surface px-3 py-2 text-base text-white outline-none focus:border-accent"
        >
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {LEAD_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={save}
          disabled={!dirty || pending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/85 disabled:opacity-50"
        >
          {pending ? "Сохраняем…" : "Сохранить"}
        </button>
      </div>
      {message ? <p className="text-sm text-secondary">{message}</p> : null}
    </div>
  );
}
