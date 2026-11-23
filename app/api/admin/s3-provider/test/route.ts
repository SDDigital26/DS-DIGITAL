import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { requirePermissionApi } from "@/lib/permissions";
import { getS3Config, isS3Configured } from "@/lib/integrations/s3-config";

/** POST /api/admin/s3-provider/test — проверка доступа к buckets. */
export async function POST() {
  const auth = await requirePermissionApi("media");
  if (auth instanceof NextResponse) return auth;
  const config = await getS3Config();
  if (!isS3Configured(config)) {
    return NextResponse.json({ ok: false, error: "s3 provider not configured" }, { status: 400 });
  }
  try {
    const client = new S3Client({
      endpoint: config.endpoint,
      region: config.region || "auto",
      forcePathStyle: true,
      credentials: { accessKeyId: config.accessKey, secretAccessKey: config.secretKey },
    });
    await client.send(new HeadBucketCommand({ Bucket: config.bucket }));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "bucket unavailable" }, { status: 502 });
  }
}
