import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/permissions";
import { getS3Config, isS3Configured } from "@/lib/integrations/s3-config";
import { isAllowedImage, MAX_UPLOAD_BYTES, objectKey } from "@/lib/media-upload";

/** POST /api/admin/media/upload — загрузка изображения в S3 (право media). */
export async function POST(request: NextRequest) {
  const auth = await requirePermissionApi("media");
  if (auth instanceof NextResponse) return auth;

  const config = await getS3Config();
  if (!isS3Configured(config)) {
    return NextResponse.json({ error: "s3 provider not configured" }, { status: 409 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid form data" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }
  if (!isAllowedImage(file)) {
    return NextResponse.json({ error: "unsupported file type" }, { status: 415 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "file too large" }, { status: 413 });
  }

  const key = objectKey(file.type, randomUUID().replace(/-/g, ""));
  if (!key) return NextResponse.json({ error: "unsupported mime" }, { status: 415 });

  try {
    const client = new S3Client({
      endpoint: config.endpoint,
      region: config.region || "auto",
      forcePathStyle: true,
      credentials: { accessKeyId: config.accessKey, secretAccessKey: config.secretKey },
    });
    const bytes = Buffer.from(await file.arrayBuffer());
    await client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: bytes,
        ContentType: file.type,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );

    const base = config.publicBaseUrl.replace(/\/+$/, "");
    const url = `${base}/${key}`;
    const asset = await db.mediaAsset.create({
      data: {
        key,
        url,
        mimeType: file.type,
        altRu: String(form.get("altRu") ?? "").slice(0, 300),
        altEn: String(form.get("altEn") ?? "").slice(0, 300),
        sizeBytes: file.size,
        uploadedById: auth.id,
      },
    });
    await db.auditLog.create({
      data: { userId: auth.id, action: "media.upload", entity: "MediaAsset", entityId: asset.id },
    });
    return NextResponse.json({ ok: true, asset }, { status: 201 });
  } catch {
    // Не отдаём детали провайдера (могут содержать ключи/URL).
    return NextResponse.json({ error: "upload failed" }, { status: 502 });
  }
}
