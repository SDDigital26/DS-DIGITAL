import { NextResponse } from "next/server";
import { logout } from "@/lib/auth";

/** POST /api/auth/logout — отзыв текущей сессии. */

export async function POST() {
  await logout();
  return NextResponse.json({ ok: true });
}
