"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function KnowledgeDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function remove() {
    if (!window.confirm("Удалить этот факт из базы знаний?")) return;
    setPending(true);
    try {
      const res = await fetch(`/api/admin/knowledge/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={pending}
      className="text-sm text-secondary hover:text-red-300 disabled:opacity-50"
    >
      Удалить
    </button>
  );
}
