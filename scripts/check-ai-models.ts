import "dotenv/config";
import { db } from "../lib/db";
import { getAiProviderConfig } from "../lib/ai/provider-config";

/** Перебор моделей провайдера: какая отвечает без 503. */
async function main() {
  const config = await getAiProviderConfig();
  const base = config.baseUrl.replace(/\/+$/, "");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;

  const modelsRes = await fetch(`${base}/models`, { headers });
  const modelsBody = await modelsRes.json().catch(() => null);
  const ids: string[] = Array.isArray(modelsBody?.data)
    ? modelsBody.data.map((m: { id?: string }) => m.id ?? "").filter(Boolean)
    : [];
  console.log(`[models] status ${modelsRes.status}, count ${ids.length}`);
  console.log(ids.slice(0, 40).join(", "));

  const candidates = ids
    .filter((id) => /gemini/i.test(id))
    .map((id) => id.replace(/^models\//, ""))
    .filter((id) => !/image|tts|transcribe|lyria|omni|nano-banana/i.test(id))
    .slice(0, 14);
  for (const model of candidates) {
    const started = Date.now();
    try {
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "Reply with exactly: OK" }],
          max_tokens: 20,
          stream: false,
        }),
      });
      const body = await res.json().catch(() => null);
      const text = body?.choices?.[0]?.message?.content;
      console.log(
        `  ${model}: ${res.status} ${res.ok ? `"${String(text).slice(0, 40)}"` : String(body?.error?.message ?? "").slice(0, 80)} (${Date.now() - started} ms)`,
      );
    } catch (err) {
      console.log(`  ${model}: error ${err instanceof Error ? err.message : err}`);
    }
  }
}

main()
  .catch((err) => {
    console.error("[models]", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
