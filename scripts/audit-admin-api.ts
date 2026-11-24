import "dotenv/config";

/**
 * Аудит API кабинета: логин и проверка основных разделов ответов.
 * Запуск: npx tsx scripts/audit-admin-api.ts <email> <пароль>
 */

const BASE = process.env.AUDIT_BASE_URL ?? "https://ds-digital-ebon.vercel.app";

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error("[audit] использование: npx tsx scripts/audit-admin-api.ts <email> <пароль>");
    process.exitCode = 1;
    return;
  }

  const login = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const setCookie = login.headers.getSetCookie?.() ?? [];
  const cookie = setCookie.map((c) => c.split(";")[0]).join("; ");
  console.log(`[audit] login: ${login.status} ${login.ok ? "ok" : "FAIL"} (${BASE})`);
  if (!login.ok) {
    console.error("[audit] неверный логин/пароль — дальше не идём");
    process.exitCode = 1;
    return;
  }

  const get = async (path: string) => {
    const res = await fetch(`${BASE}${path}`, { headers: { cookie } });
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    const summary =
      body && typeof body === "object"
        ? Object.keys(body as Record<string, unknown>).slice(0, 6).join(",")
        : "";
    return { path, status: res.status, keys: summary };
  };

  const checks = [
    "/api/admin/leads",
    "/api/admin/settings",
    "/api/admin/telegram",
    "/api/admin/email-provider",
    "/api/admin/s3-provider",
    "/api/admin/ai-provider",
    "/api/admin/ai-provider/status",
    "/api/admin/knowledge",
    "/api/admin/site-texts",
    "/api/admin/seo",
    "/api/admin/projects",
    "/api/admin/testimonials",
    "/api/admin/faq",
    "/api/admin/articles",
    "/api/admin/media",
    "/api/admin/users",
  ];

  const results: Array<{ path: string; status: number; keys: string }> = [];
  for (const path of checks) {
    results.push(await get(path));
  }
  for (const r of results) {
    console.log(`  ${r.status}  ${r.path}  [${r.keys}]`);
  }

  const bad = results.filter((r) => r.status >= 400);
  console.log(`[audit] проверено ${results.length}, проблемных: ${bad.length}`);
  for (const r of bad) console.log(`  ⚠ ${r.status} ${r.path}`);
}

main().catch((err) => {
  console.error("[audit]", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
