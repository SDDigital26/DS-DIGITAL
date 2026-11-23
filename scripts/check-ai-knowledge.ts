import "dotenv/config";
import { db } from "../lib/db";
import { findKnowledgeAnswer, loadKnowledgeFacts } from "../lib/ai/knowledge";
import { fallbackTurn, initialState } from "../lib/ai/fallback";

/** Ручная проверка: как агент отвечает по базе знаний и не ломает шаги. */
const QUESTIONS: Array<{ locale: "ru" | "en"; q: string }> = [
  { locale: "ru", q: "Сколько стоит сайт?" },
  { locale: "ru", q: "Какие услуги вы делаете?" },
  { locale: "ru", q: "Вы делаете CRM?" },
  { locale: "ru", q: "Как с вами связаться?" },
  { locale: "ru", q: "Как проходит работа?" },
  { locale: "ru", q: "Что такое AI-решение?" },
  { locale: "en", q: "How much does a website cost?" },
  { locale: "en", q: "What services do you offer?" },
  { locale: "en", q: "How can I contact you?" },
];

async function main() {
  const total = await db.aiKnowledgeItem.count();
  console.log(`[check] knowledge items: ${total}`);

  for (const { locale, q } of QUESTIONS) {
    const answer = await findKnowledgeAnswer(locale, q);
    console.log(`\n${locale.toUpperCase()} Q: ${q}`);
    console.log(
      answer
        ? `  → [${answer.source ?? "manual"}] ${answer.title} (score ${answer.score})\n    ${answer.answer.slice(0, 180)}…`
        : "  → нет ответа в базе (уйдёт в сценарий/LLM)",
    );
  }

  // Вопрос на шаге «задача» не должен засчитываться как описание задачи.
  const state = { ...initialState("ru"), consent: true, step: "task" as const };
  const turn = fallbackTurn(state, "Сколько стоит сайт?");
  console.log(`\n[check] step after question: ${turn.state.step} (ожидается task)`);

  const facts = await loadKnowledgeFacts("ru", "Сколько стоит сайт?");
  console.log(`[check] facts for prompt: ${facts.length}`);
  console.log(`  ${facts[0]?.slice(0, 160)}…`);
}

main()
  .catch((err) => {
    console.error("[check]", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
