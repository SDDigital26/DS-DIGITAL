import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/permissions";
import { publicAiProvider, getAiProviderConfig, saveAiProviderConfig } from "@/lib/ai/provider-config";

/**
 * /api/admin/ai-provider — подключение AI-ассистента по API из кабинета.
 * API-ключ хранится только на сервере: GET возвращает маску (`••••abcd`).
 * Требуется право `settings` (OWNER/ADMIN).
 */

const configSchema = z.object({
  provider: z.enum(["scripted", "google", "openai-compatible"]),
  baseUrl: z.string().trim().max(300).default(""),
  model: z.string().trim().max(120).default(""),
  /** Пусто = оставить ранее сохранённый ключ. */
  apiKey: z.string().trim().max(500).default(""),
  clearApiKey: z.boolean().default(false),
  temperature: z.number().min(0).max(1).default(0.3),
});

function bad(message: string, issues?: unknown) {
  return NextResponse.json({ error: message, ...(issues ? { issues } : {}) }, { status: 400 });
}

export async function GET() {
  const auth = await requirePermissionApi("settings");
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ ok: true, config: publicAiProvider(await getAiProviderConfig()) });
}

export async function PUT(request: NextRequest) {
  const auth = await requirePermissionApi("settings");
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return bad("invalid json");
  }

  const parsed = configSchema.safeParse(body);
  if (!parsed.success) {
    return bad("validation failed", parsed.error.issues.map((i) => ({ path: i.path, message: i.message })));
  }

  const current = await getAiProviderConfig();
  const input = parsed.data;
  // Разрешаем только http(s): админ задаёт свой адрес (в т.ч. локальный сервер на ПК).
  if (input.baseUrl && !/^https?:\/\/[^\s/]+/i.test(input.baseUrl)) {
    return bad("baseUrl must start with http:// or https://");
  }

  const saved = {
    provider: input.provider,
    baseUrl: input.baseUrl,
    model: input.model,
    apiKey: input.clearApiKey ? "" : input.apiKey || current.apiKey,
    temperature: input.temperature,
  };
  await saveAiProviderConfig(saved);
  await db.auditLog.create({
    data: {
      userId: auth.id,
      action: "site.ai-provider.update",
      entity: "Setting",
      entityId: "ai-provider",
    },
  });

  return NextResponse.json({ ok: true, config: publicAiProvider(saved) });
}
