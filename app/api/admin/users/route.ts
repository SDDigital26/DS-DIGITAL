import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/permissions";
import { hashPassword } from "@/lib/password";

/** GET/POST /api/admin/users — пользователи и роли (право users, только OWNER). */
const createSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
  name: z.string().trim().max(120).default(""),
  role: z.enum(["OWNER", "ADMIN", "EDITOR", "MANAGER"]),
});

export async function GET() {
  const auth = await requirePermissionApi("users");
  if (auth instanceof NextResponse) return auth;
  const users = await db.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true, role: true, active: true, lastLoginAt: true, createdAt: true },
  });
  return NextResponse.json({ ok: true, users });
}

export async function POST(request: NextRequest) {
  const auth = await requirePermissionApi("users");
  if (auth instanceof NextResponse) return auth;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation failed", issues: parsed.error.issues.map(i => ({ path: i.path, message: i.message })) }, { status: 400 });
  const existing = await db.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  if (existing) return NextResponse.json({ error: "email already exists" }, { status: 409 });
  const user = await db.user.create({
    data: {
      email: parsed.data.email,
      passwordHash: hashPassword(parsed.data.password),
      name: parsed.data.name || null,
      role: parsed.data.role,
    },
    select: { id: true, email: true, name: true, role: true, active: true },
  });
  await db.auditLog.create({ data: { userId: auth.id, action: "user.create", entity: "User", entityId: user.id } });
  return NextResponse.json({ ok: true, user }, { status: 201 });
}
