"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={pending}
      className="rounded-lg border border-white/10 px-3 py-2 text-sm text-secondary transition-colors hover:border-white/25 hover:text-white disabled:opacity-60"
    >
      {pending ? "Выходим…" : "Выйти"}
    </button>
  );
}
