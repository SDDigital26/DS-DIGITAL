import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { fallbackTurn, persistableUserMessage, replayFallbackState } from "@/lib/ai/fallback";
import { generateAssistantReply } from "@/lib/ai/client";
import { getAiProviderConfig } from "@/lib/ai/provider-config";
import { enqueueLeadNotifications } from "@/lib/notifications";
import { getSiteSettings } from "@/lib/site-settings";

/**
 * POST /api/ai/consult — бесплатный сценарий-консультант.
 * Состояние/согласие восстанавливаются по серверному transcript; данные клиента
 * history/state не принимаются. Внешних LLM/API-вызовов нет.
 */
const COOKIE_NAME = "ds_ai_session";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const RATE = { limit: 20, windowMs: 60_000 };

const requestSchema = z.object({
  locale: z.enum(["ru", "en"]).default("ru"),
  message: z.string().trim().min(1).max(2000),
});

type ChatMessage = { role: "user" | "assistant"; content: string };

function validToken(value: string | undefined): value is string {
  return Boolean(value && /^[A-Za-z0-9_-]{43}$/.test(value));
}

function sessionHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

function withSessionCookie(response: NextResponse, token: string, shouldSet: boolean) {
  if (shouldSet) {
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/ai",
      maxAge: SESSION_TTL_MS / 1000,
    });
  }
  return response;
}

/** Восстанавливает историю только из той же HttpOnly-сессии браузера. */
export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!validToken(token)) return noStoreJson({ ok: true, messages: [] });

  const conversation = await db.aiConversation.findUnique({
    where: { sessionKey: sessionHash(token) },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation || conversation.expiresAt <= new Date()) {
    return noStoreJson({ ok: true, messages: [] });
  }

  const messages: ChatMessage[] = conversation.messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .slice(-30)
    .map((message) => ({ role: message.role as ChatMessage["role"], content: message.content }));
  return noStoreJson({ ok: true, messages });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ error: "invalid json" }, 400);
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return noStoreJson(
      { error: "validation failed", issues: parsed.error.issues.map((issue) => ({ path: issue.path, message: issue.message })) },
      400,
    );
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const perIp = await checkRateLimit(`ai:${ip}`, RATE.limit, RATE.windowMs);
  if (!perIp.ok) {
    return noStoreJson(
      { error: "too many requests", retryAfterSec: perIp.retryAfterSec },
      429,
    );
  }

  let token = request.cookies.get(COOKIE_NAME)?.value;
  let shouldSetCookie = false;
  if (!validToken(token)) {
    token = randomBytes(32).toString("base64url");
    shouldSetCookie = true;
  }
  let digest = sessionHash(token);
  let conversation = await db.aiConversation.findUnique({
    where: { sessionKey: digest },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  // Истёкшая либо сменившая язык беседа никогда не переиспользуется.
  if (conversation && (conversation.expiresAt <= new Date() || conversation.locale !== parsed.data.locale)) {
    token = randomBytes(32).toString("base64url");
    digest = sessionHash(token);
    conversation = null;
    shouldSetCookie = true;
  } else if (conversation && conversation.expiresAt > new Date()) {
    // Для существующей сессии cookie уже есть и остаётся HttpOnly.
  } else if (conversation) {
    conversation = null;
  }

  const perSession = await checkRateLimit(`ai:session:${digest}`, RATE.limit, RATE.windowMs);
  if (!perSession.ok) {
    return withSessionCookie(
      noStoreJson({ error: "too many requests", retryAfterSec: perSession.retryAfterSec }, 429),
      token,
      shouldSetCookie,
    );
  }

  const settings = await getSiteSettings();
  if (!settings.aiEnabled) {
    return withSessionCookie(noStoreJson({ error: "assistant disabled" }, 503), token, shouldSetCookie);
  }

  if (conversation?.leadId) {
    return withSessionCookie(
      noStoreJson({
        ok: true,
        mode: "fallback",
        reply: parsed.data.locale === "ru" ? "Заявка уже отправлена. Спасибо!" : "Your request has already been submitted. Thank you!",
        leadId: conversation.leadId,
      }),
      token,
      shouldSetCookie,
    );
  }

  const previousMessages: ChatMessage[] = (conversation?.messages ?? [])
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({ role: message.role as ChatMessage["role"], content: message.content }));
  const state = replayFallbackState(
    parsed.data.locale,
    previousMessages.filter((message) => message.role === "user").map((message) => message.content),
  );
  const turn = fallbackTurn(state, parsed.data.message);
  const savedUserMessage = persistableUserMessage(state, turn.state, parsed.data.message);

  // Внешняя модель (если подключена в админке) только переформулирует ответ
  // детерминированного сценария. До согласия данные никуда не отправляются;
  // согласие/шаги/создание заявки остаются на сервере. При сбое — фолбэк.
  let reply = turn.reply;
  let mode: "fallback" | "ai" = "fallback";
  const provider = await getAiProviderConfig();
  if (provider.provider !== "scripted" && state.consent && turn.state.step !== "done") {
    const generated = await generateAssistantReply({
      config: provider,
      locale: parsed.data.locale,
      step: turn.state.step,
      scriptedReply: turn.reply,
      userMessage: parsed.data.message,
    });
    reply = generated.reply;
    mode = generated.usedAi ? "ai" : "fallback";
  }

  const transcript: ChatMessage[] = [
    ...previousMessages.slice(-18),
    { role: "user", content: savedUserMessage },
    { role: "assistant", content: reply },
  ];

  try {
    const result = await db.$transaction(async (tx) => {
      const active = conversation
        ? await tx.aiConversation.findUnique({ where: { id: conversation.id }, select: { leadId: true } })
        : null;
      if (active?.leadId) return { leadId: active.leadId, created: false };

      const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
      const session = conversation
        ? await tx.aiConversation.update({ where: { id: conversation.id }, data: { expiresAt } })
        : await tx.aiConversation.create({
            data: { sessionKey: digest, locale: parsed.data.locale, expiresAt },
          });

      let leadId: string | null = null;
      if (turn.lead) {
        const contact = turn.lead.contact.trim();
        const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact);
        const isPhone = /^[+\d][\d\s()\-]{6,}$/.test(contact);
        const telegram = contact
          .replace(/^https?:\/\/(t\.me|telegram\.me)\//i, "")
          .split(/[/?#]/, 1)[0]
          .replace(/^@/, "");
        const lead = await tx.lead.create({
          data: {
            name: turn.lead.name || null,
            email: isEmail ? contact : null,
            whatsapp: !isEmail && isPhone ? contact : null,
            telegram: !isEmail && !isPhone ? telegram : null,
            language: parsed.data.locale,
            service: turn.lead.service || null,
            description: turn.lead.description,
            source: "ai-consultant",
            aiTranscript: transcript as never,
            consentAt: new Date(),
            consentText:
              parsed.data.locale === "ru"
                ? "Согласие до ввода данных на обработку описания задачи и контактных данных, если они будут предоставлены, для подготовки заявки и передачи менеджеру DS DIGITAL"
                : "Consent given before entering data to process the task description and any contact details provided, prepare the request, and share it with a DS DIGITAL manager",
            idempotencyKey: `ai:${digest}`,
          },
          select: { id: true },
        });
        leadId = lead.id;
        await tx.aiConversation.update({ where: { id: session.id }, data: { leadId: lead.id } });
      }

      await tx.aiMessage.createMany({
        data: [
          { conversationId: session.id, role: "user", content: savedUserMessage },
          { conversationId: session.id, role: "assistant", content: turn.reply },
        ],
      });
      return { leadId, created: Boolean(leadId) };
    });

    if (result.created && result.leadId) {
      await enqueueLeadNotifications({
        leadId: result.leadId,
        language: parsed.data.locale,
        description: turn.lead?.description ?? "",
        service: turn.lead?.service,
      }).catch(() => undefined);
    }

    return withSessionCookie(
      noStoreJson({ ok: true, mode, reply, leadId: result.leadId }),
      token,
      shouldSetCookie,
    );
  } catch (error) {
    // Идемпотентность защищает от повторной отправки при параллельных вкладках.
    const existing = await db.lead.findUnique({ where: { idempotencyKey: `ai:${digest}` }, select: { id: true } }).catch(() => null);
    if (existing) {
      return withSessionCookie(
        noStoreJson({ ok: true, mode, reply, leadId: existing.id, duplicate: true }),
        token,
        shouldSetCookie,
      );
    }
    console.error("[ai-consult] request failed:", error instanceof Error ? error.name : "unknown");
    return withSessionCookie(
      noStoreJson({ error: "request failed" }, 500),
      token,
      shouldSetCookie,
    );
  }
}
