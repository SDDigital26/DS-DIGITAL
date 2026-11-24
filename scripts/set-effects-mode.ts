import "dotenv/config";
import { db } from "../lib/db";
import { getSetting, setSetting, SITE_SETTINGS_KEY } from "../lib/settings";
import type { SiteSettings } from "../lib/site-settings";

/**
 * Режим эффектов сайта (ТЗ §7.4): full | lite | static.
 * Запуск: npx tsx scripts/set-effects-mode.ts full
 * Тот же параметр меняется в кабинете: /admin/settings → «Режим эффектов».
 */
async function main() {
  const mode = process.argv[2]?.trim();
  if (mode !== "full" && mode !== "lite" && mode !== "static") {
    const current = await getSetting<Partial<SiteSettings>>(SITE_SETTINGS_KEY);
    console.log(`[effects] текущий режим: ${current?.effectsMode ?? "lite (по умолчанию)"}`);
    console.log("[effects] указать новый: npx tsx scripts/set-effects-mode.ts <full|lite|static>");
    return;
  }

  const current = (await getSetting<Partial<SiteSettings>>(SITE_SETTINGS_KEY)) ?? {};
  await setSetting(SITE_SETTINGS_KEY, { ...current, effectsMode: mode });
  console.log(`[effects] режим установлен: ${mode}`);
}

main()
  .catch((err) => {
    console.error("[effects]", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
