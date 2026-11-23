import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/permissions";
import {
  getEmailConfig,
  publicEmailConfig,
  saveEmailConfig,
} from "@/lib/integrations/email-config";

/** /api/admin/email-provider — email-уведомления о заявках. Право `settings`. */
const schema = z.object({
  endpoint: z
    .string()
    .trim()
    .max(300)
    .refine((v) => !v || /^https:\/\/[^\s]+$/i.test(v), "Нужен https:// URL")
    .default(""),
  from: z.string().trim().max(160).default(""),
  apiKey: z.string().trim().max(500).default(""),
  clearApiKey: z.boolean().default(false),
});

export async function GET() {
  const auth = await requirePermissionApi("settings");
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ ok: true, config: publicEmailConfig(await getEmailConfig()) });
}

export async function PUT(request: NextRequest) {
  const auth = await requirePermissionApi("settings");
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Проверьте поля" }, { status: 400 });
  }

  const current = await getEmailConfig();
  const saved = {
    endpoint: parsed.data.endpoint,
    from: parsed.data.from,
    apiKey: parsed.data.clearApiKey ? "" : parsed.data.apiKey || current.apiKey,
  };
  await saveEmailConfig(saved);
  await db.auditLog.create({
    data: {
      userId: auth.id,
      action: "site.email-provider.update",
      entity: "Setting",
      entityId: "email-provider",
    },
  });
  return NextResponse.json({ ok: true, config: publicEmailConfig(saved) });
}
