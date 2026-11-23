import { NextResponse } from "next/server";
import { requirePermissionApi } from "@/lib/permissions";
import { sendEmail } from "@/lib/integrations/email";
import { getEmailConfig } from "@/lib/integrations/email-config";

/** POST /api/admin/email-provider/test — тестовая отправка (без PII в ответе). */
export async function POST() {
  const auth = await requirePermissionApi("settings");
  if (auth instanceof NextResponse) return auth;

  const config = await getEmailConfig();
  const smtpReady = Boolean(config.smtpHost && config.smtpUser && config.smtpPassword);
  if (!smtpReady && !config.endpoint) {
    return NextResponse.json({ ok: false, error: "email provider not configured" }, { status: 400 });
  }
  const result = await sendEmail({
    to: config.from || "test@example.com",
    subject: "DS DIGITAL — test notification",
    text: "Test email notification. Ignore this message.",
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
