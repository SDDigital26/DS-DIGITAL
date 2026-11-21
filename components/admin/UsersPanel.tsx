"use client";

import { useEffect, useState } from "react";

const input = "rounded-lg border border-white/10 bg-bg px-3 py-2 text-base outline-none focus:border-accent";
const label = "text-xs text-secondary";

type User = { id: string; email: string; name: string | null; role: string; active: boolean; lastLoginAt: string | null; createdAt: string };

/** /admin/users — пользователи и роли (только OWNER). */
export function UsersPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({ email: "", password: "", name: "", role: "EDITOR" });
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(null);
  const [pending, setPending] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/users", { cache: "no-store" });
    if (res.ok) setUsers((await res.json()).users);
  }
  useEffect(() => { queueMicrotask(() => { void load(); }); }, []);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setNote(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      const b = await res.json().catch(() => null);
      if (!res.ok) { setNote({ text: b?.error ?? "Не удалось создать.", ok: false }); return; }
      setForm({ email: "", password: "", name: "", role: "EDITOR" });
      setNote({ text: "Пользователь создан.", ok: true });
      await load();
    } catch { setNote({ text: "Ошибка сети.", ok: false }); }
    finally { setPending(false); }
  }

  async function patch(id: string, data: Partial<User>) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    const b = await res.json().catch(() => null);
    if (!res.ok) { setNote({ text: b?.error ?? "Не удалось обновить.", ok: false }); return; }
    setNote({ text: "Обновлено.", ok: true });
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Удалить пользователя?")) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const b = await res.json().catch(() => null);
    if (!res.ok) { setNote({ text: b?.error ?? "Не удалось удалить.", ok: false }); return; }
    setNote({ text: "Удалено.", ok: true });
    await load();
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Пользователи</h1>
        <p className="mt-1 text-sm text-secondary">Роли и доступы к админке. Матрица прав описана в ТЗ §18.</p>
      </header>
      {note ? <p role="status" className={`rounded-lg border px-3 py-2 text-sm ${note.ok ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200"}`}>{note.text}</p> : null}

      <form onSubmit={create} className="rounded-2xl border border-white/10 bg-surface/40 p-4">
        <h2 className="text-lg font-semibold">Новый пользователь</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          <div className="flex flex-col gap-1"><label className={label} htmlFor="u-email">Email</label><input id="u-email" className={input} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div className="flex flex-col gap-1"><label className={label} htmlFor="u-name">Имя</label><input id="u-name" className={input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="flex flex-col gap-1"><label className={label} htmlFor="u-pass">Пароль</label><input id="u-pass" className={input} type="password" minLength={8} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
          <div className="flex flex-col gap-1"><label className={label} htmlFor="u-role">Роль</label>
            <select id="u-role" className={input} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="OWNER">OWNER</option><option value="ADMIN">ADMIN</option><option value="EDITOR">EDITOR</option><option value="MANAGER">MANAGER</option>
            </select>
          </div>
        </div>
        <button type="submit" disabled={pending} className="mt-3 rounded-lg bg-accent px-5 py-2 text-sm text-white disabled:opacity-60">{pending ? "Создаём…" : "Создать"}</button>
      </form>

      <section className="overflow-hidden rounded-2xl border border-white/10">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-surface text-left text-xs text-secondary"><tr><th className="px-4 py-3">Email</th><th className="px-4 py-3">Роль</th><th className="px-4 py-3">Активен</th><th className="px-4 py-3">Последний вход</th><th className="px-4 py-3"></th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t border-white/5">
                  <td className="px-4 py-3">{u.email}{u.name ? <span className="block text-xs text-secondary">{u.name}</span> : null}</td>
                  <td className="px-4 py-3"><select className={input} value={u.role} onChange={e => void patch(u.id, { role: e.target.value })}><option>OWNER</option><option>ADMIN</option><option>EDITOR</option><option>MANAGER</option></select></td>
                  <td className="px-4 py-3"><input type="checkbox" className="h-5 w-5 accent-[#176BFF]" checked={u.active} onChange={e => void patch(u.id, { active: e.target.checked })} /></td>
                  <td className="px-4 py-3 text-secondary">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("ru-RU") : "—"}</td>
                  <td className="px-4 py-3 text-right"><button type="button" onClick={() => void remove(u.id)} className="text-sm text-red-300 hover:text-red-200">Удалить</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
