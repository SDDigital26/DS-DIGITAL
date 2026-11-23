import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/permissions";
import { getS3Config, publicS3Config, saveS3Config } from "@/lib/integrations/s3-config";

const schema = z.object({
  endpoint: z
    .string()
    .trim()
    .max(300)
    .refine((v) => !v || /^https?:\/\/[^\s]+$/i.test(v), "Нужен URL")
    .default(""),
  region: z.string().trim().max(60).default("auto"),
  bucket: z.string().trim().max(120).default(""),
  accessKey: z.string().trim().max(200).default(""),
  secretKey: z.string().trim().max(300).default(""),
  publicBaseUrl: z
    .string()
    .trim()
    .max(300)
    .refine((v) => !v || /^https?:\/\/[^\s]+$/i.test(v), "Нужен URL")
    .default(""),
  clearKeys: z.boolean().default(false),
});

/** /api/admin/s3-provider — настройка S3-хранилища. Право `media`. */
export async function GET() {
  const auth = await requirePermissionApi("media");
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ ok: true, config: publicS3Config(await getS3Config()) });
}

export async function PUT(request: NextRequest) {
  const auth = await requirePermissionApi("media");
  if (auth instanceof NextResponse) return auth;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation failed" }, { status: 400 });
  }
  const current = await getS3Config();
  const saved = {
    endpoint: parsed.data.endpoint,
    region: parsed.data.region,
    bucket: parsed.data.bucket,
    accessKey: parsed.data.clearKeys ? "" : parsed.data.accessKey || current.accessKey,
    secretKey: parsed.data.clearKeys ? "" : parsed.data.secretKey || current.secretKey,
    publicBaseUrl: parsed.data.publicBaseUrl,
  };
  await saveS3Config(saved);
  await db.auditLog.create({
    data: {
      userId: auth.id,
      action: "site.s3-provider.update",
      entity: "Setting",
      entityId: "s3-provider",
    },
  });
  return NextResponse.json({ ok: true, config: publicS3Config(saved) });
}
