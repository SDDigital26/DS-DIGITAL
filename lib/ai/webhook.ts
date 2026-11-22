/**
 * Вызов внешнего сценария n8n для AI-агента.
 * Возвращает только текстовый ответ; при любой ошибке — null (работает фолбэк).
 */

type Payload = {
  locale: string;
  step: string;
  message: string;
  scriptedReply: string;
  history: { role: string; content: string }[];
  facts: string[];
  scenario: string;
};

export async function askScenarioWebhook(url: string, payload: Payload): Promise<string | null> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = (await response.json()) as Record<string, unknown>;
    const raw = data.reply ?? data.answer ?? data.message;
    if (typeof raw !== "string") return null;
    return raw.trim().slice(0, 600) || null;
  } catch (error) {
    console.error(
      "[ai-webhook] scenario call failed:",
      error instanceof Error ? error.message : "unknown",
    );
    return null;
  }
}
