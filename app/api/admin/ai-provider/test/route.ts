import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermissionApi } from "@/lib/permissions";
import { getAiProviderConfig, type AiProviderConfig } from "@/lib/ai/provider-config";
import { testAiProvider } from "@/lib/ai/client";

/** POST /api/admin/ai-provider/test — проверка ключа/адреса до сохранения. */

const testSchema = z.object({
  provider: z.enum(["scripted", "google", "openai-compatible"]),
  baseUrl: z.string().trim().max(300).default(""),
  model: z.string().trim().max(120).default(""),
  apiKey: z.string().trim().max(500).default(""),
  temperature: z.number().min(0).max(1).default(0.3),
});

export async function POST(request: NextRequest) {
  const auth = await requirePermissionApi("settings");
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const parsed = testSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation failed" }, { status: 400 });
  }

  const input = parsed.data;
  const current = await getAiProviderConfig();
  const config: AiProviderConfig = {
    ...current,
    ...input,
    apiKey: input.apiKey || current.apiKey,
  };

  if (config.provider === "scripted") {
    return NextResponse.json({
      ok: true,
      mode: "scripted",
      sample: "Локальный сценарий — внешнего API не требуется.",
    });
  }

  try {
    const result = await testAiProvider(config);
    return NextResponse.json({ mode: "api", ...result });
  } catch (error) {
    // Не логируем ключ и не возвращаем тело ошибки провайдера целиком.
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message.slice(0, 200) : "connection failed" },
      { status: 502 },
    );
  }
}
