import { NextResponse } from "next/server";
import { requirePermissionApi } from "@/lib/permissions";
import { getAiProviderConfig, publicAiProvider } from "@/lib/ai/provider-config";
import { testAiProvider } from "@/lib/ai/client";

/**
 * GET /api/admin/ai-provider/status — реальная проверка связи для индикатора
 * в кабинете. Ответ не кэшируется: кнопка «Обновить» и опрос раз в 60 с
 * показывают актуальное состояние, а не устаревший результат.
 */

export async function GET() {
  const auth = await requirePermissionApi("settings");
  if (auth instanceof NextResponse) return auth;

  const config = await getAiProviderConfig();
  const info = publicAiProvider(config);

  if (config.provider === "scripted") {
    return NextResponse.json({
      ok: true,
      connected: true,
      mode: "scripted",
      config: info,
      detail: "Локальный сценарий — внешний API не требуется",
      checkedAt: new Date().toISOString(),
    });
  }

  let connected = false;
  let detail = "Провайдер не настроен";
  if (info.hasApiKey && info.baseUrl && info.model) {
    try {
      const result = await testAiProvider(config);
      connected = result.ok;
      detail = result.ok ? `Ответ получен: «${result.sample}»` : "Нет ответа";
    } catch (error) {
      detail = error instanceof Error ? error.message.slice(0, 160) : "Ошибка подключения";
    }
  } else {
    detail = "Заполните базовый URL, модель и API-ключ";
  }

  return NextResponse.json({
    ok: true,
    connected,
    mode: "api",
    config: info,
    detail,
    checkedAt: new Date().toISOString(),
  });
}
