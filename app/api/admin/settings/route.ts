import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/permissions";
import { setSetting, SITE_SETTINGS_KEY } from "@/lib/settings";
import { getSiteSettings } from "@/lib/site-settings";
import { revalidatePath } from "next/cache";

/**
 * /api/admin/settings — настройки сайта из кабинета (ТЗ §17).
 *
 * Меняются контакты, режим эффектов, AI-выключатель, тексты согласия и noindex.
 * Требуется право `settings` (OWNER/ADMIN).
 */

const settingsSchema = z.object({
  telegram: z.string().trim().max(64).default(""),
  whatsapp: z.string().trim().max(40).default(""),
  email: z.union([z.literal(""), z.string().trim().email("invalid email")]).default(""),
  effectsMode: z.enum(["full", "lite", "static"]).default("lite"),
  aiEnabled: z.boolean().default(true),
  consentTextRu: z.string().trim().max(300).default(""),
  consentTextEn: z.string().trim().max(300).default(""),
  noindex: z.boolean().default(false),
});

export async function GET() {
  const auth = await requirePermissionApi("settings");
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ ok: true, settings: await getSiteSettings() });
}

export async function PUT(request: NextRequest) {
  const auth = await requirePermissionApi("settings");
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "validation failed",
        issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
      },
      { status: 400 },
    );
  }

  await setSetting(SITE_SETTINGS_KEY, parsed.data);
  await db.auditLog.create({
    data: {
      userId: auth.id,
      action: "site.settings.update",
      entity: "Setting",
      entityId: SITE_SETTINGS_KEY,
    },
  });

  for (const path of ["/ru", "/en", "/ru/contact", "/en/contact"]) revalidatePath(path);
  return NextResponse.json({ ok: true, settings: parsed.data });
}
