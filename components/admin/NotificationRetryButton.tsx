"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NotificationRetryButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function retry() {
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/notifications`, {
        method: "POST",
      });
      if (res.ok) {
        const body = (await res.json()) as { reset?: number };
        setMessage(`Поставлено в очередь на повтор: ${body.reset ?? 0}.`);
        router.refresh();
      } else if (res.status === 409) {
        setMessage("Провайдер уведомлений не настроен (email/Telegram).");
      } else {
        setMessage("Не удалось запустить повторную отправку.");
      }
    } catch {
      setMessage("Ошибка сети. Попробуйте ещё раз.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={retry}
        disabled={pending}
        className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white hover:border-cyan disabled:opacity-60"
      >
        {pending ? "Запускаем…" : "Отправить повторно"}
      </button>
      {message ? <p className="text-sm text-secondary">{message}</p> : null}
    </div>
  );
}
