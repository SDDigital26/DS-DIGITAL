import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/permissions";

/** PATCH/DELETE /api/admin/users/[id] — смена роли/активности и удаление (только OWNER). */
const patchSchema = z.object({
  role: z.enum(["OWNER", "ADMIN", "EDITOR", "MANAGER"]).optional(),
  active: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requirePermissionApi("users");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation failed" }, { status: 400 });
  const target = await db.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!target) return NextResponse.json({ error: "not found" }, { status: 404 });
  // Не даём снять роль OWNER с последнего владельца.
  if (target.role === "OWNER" && (parsed.data.role && parsed.data.role !== "OWNER" || parsed.data.active === false)) {
    const owners = await db.user.count({ where: { role: "OWNER", active: true } });
    if (owners <= 1) return NextResponse.json({ error: "cannot change the last active owner" }, { status: 409 });
  }
  const user = await db.user.update({
    where: { id },
    data: parsed.data,
    select: { id: true, email: true, name: true, role: true, active: true },
  });
  await db.auditLog.create({ data: { userId: auth.id, action: "user.update", entity: "User", entityId: id } });
  return NextResponse.json({ ok: true, user });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await requirePermissionApi("users");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  if (id === auth.id) return NextResponse.json({ error: "cannot delete yourself" }, { status: 409 });
  const target = await db.user.findUnique({ where: { id }, select: { role: true } });
  if (!target) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (target.role === "OWNER") {
    const owners = await db.user.count({ where: { role: "OWNER", active: true } });
    if (owners <= 1) return NextResponse.json({ error: "cannot delete the last owner" }, { status: 409 });
  }
  await db.user.delete({ where: { id } });
  await db.auditLog.create({ data: { userId: auth.id, action: "user.delete", entity: "User", entityId: id } });
  return NextResponse.json({ ok: true });
}
