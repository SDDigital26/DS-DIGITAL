import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/permissions";

/** GET/POST /api/admin/media — библиотека медиа (право media). */
const schema = z.object({
  key: z.string().trim().min(1).max(300),
  url: z.string().trim().url().max(1000),
  mimeType: z.string().trim().max(100).default("image/webp"),
  altRu: z.string().trim().max(300).default(""),
  altEn: z.string().trim().max(300).default(""),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  sizeBytes: z.number().int().default(0),
});

export async function GET() {
  const auth = await requirePermissionApi("media");
  if (auth instanceof NextResponse) return auth;
  const assets = await db.mediaAsset.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ ok: true, assets });
}

export async function POST(request: NextRequest) {
  const auth = await requirePermissionApi("media");
  if (auth instanceof NextResponse) return auth;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation failed" }, { status: 400 });
  const existing = await db.mediaAsset.findUnique({ where: { key: parsed.data.key }, select: { id: true } });
  if (existing) return NextResponse.json({ error: "key already exists" }, { status: 409 });
  const asset = await db.mediaAsset.create({ data: { ...parsed.data, uploadedById: auth.id } });
  await db.auditLog.create({ data: { userId: auth.id, action: "media.create", entity: "MediaAsset", entityId: asset.id } });
  return NextResponse.json({ ok: true, asset }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const auth = await requirePermissionApi("media");
  if (auth instanceof NextResponse) return auth;
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.mediaAsset.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
