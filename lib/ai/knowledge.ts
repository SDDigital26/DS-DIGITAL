import { Prisma } from "@/lib/generated/prisma/client";
import { db } from "@/lib/db";
import { parsePage } from "@/lib/lead-filters";

/**
 * База знаний AI-агента.
 *
 * Одна таблица `AiKnowledgeItem` — единственный источник фактов для ответов.
 * В неё попадают ручные факты из `/admin/knowledge` и автоматическая
 * синхронизация с сайта (`lib/ai/knowledge-sync.ts`): услуги, статьи блога,
 * FAQ, цены и контакты.
 *
 * Ответ строится так: сначала поиск по базе (retrieval), затем — если факт
 * найден — прямой ответ из базы; LLM подключается только для переформулировки
 * или когда в базе нет ответа (ТЗ §4: никаких выдуманных фактов).
 */
export type KnowledgeFilters = {
  locale?: string;
  published?: string;
  q?: string;
  page?: string;
};

export const KNOWLEDGE_PER_PAGE = 20;
export const AI_KNOWLEDGE_MAX_FACTS = 6;
export const AI_KNOWLEDGE_FACT_CHARS = 700;
export { parsePage };

function get(
  source: URLSearchParams | Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  if (source instanceof URLSearchParams) return source.get(key) ?? undefined;
  const value = source[key];
  return Array.isArray(value) ? value[0] : value;
}

export function parseKnowledgeFilters(
  source: URLSearchParams | Record<string, string | string[] | undefined>,
): KnowledgeFilters {
  return {
    locale: get(source, "locale"),
    published: get(source, "published"),
    q: get(source, "q"),
    page: get(source, "page"),
  };
}

export function buildKnowledgeWhere(
  filters: KnowledgeFilters,
  forPrompt = false,
): Prisma.AiKnowledgeItemWhereInput {
  const where: Prisma.AiKnowledgeItemWhereInput = {};

  if (forPrompt) {
    where.published = true;
    if (filters.locale === "ru" || filters.locale === "en") where.locale = filters.locale;
    return where;
  }

  if (filters.published === "1" || filters.published === "true") where.published = true;
  if (filters.published === "0" || filters.published === "false") where.published = false;
  if (filters.locale === "ru" || filters.locale === "en") where.locale = filters.locale;

  const q = filters.q?.trim();
  if (q && q.length <= 100) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { content: { contains: q, mode: "insensitive" } },
      { category: { contains: q, mode: "insensitive" } },
    ];
  }
  return where;
}

type KnowledgeRow = {
  id: string;
  title: string;
  content: string;
  category: string | null;
  source: string | null;
  sort: number;
};

type Intent = "services" | "process" | "contacts" | "pricing" | null;

/** Намерение вопроса — помогает выбрать правильный тип факта. */
function detectIntent(query: string): Intent {
  const q = query.toLowerCase();
  if (/(услуг|направлен|что вы делаете|services|what do you (do|offer))/.test(q)) return "services";
  if (/(как.*работ|процесс|этап|process|how do you work|workflow)/.test(q)) return "process";
  if (/(контакт|связаться|написать|почт|телефон|contact|reach|email)/.test(q)) return "contacts";
  if (/(цен|стоит|стоимость|бюджет|price|cost|budget)/.test(q)) return "pricing";
  return null;
}

const STOP_WORDS = new Set([
  "что", "как", "для", "или", "мне", "это", "его", "она", "они", "есть", "можно",
  "нужен", "нужна", "нужно", "хочу", "надо", "вас", "ваш", "ваши", "про", "при",
  "чем", "кто", "где", "когда", "почему", "зачем", "какой", "какие", "какая",
  "подскажите", "пожалуйста", "скажите", "расскажите", "делаете", "делать",
  "the", "and", "for", "you", "your", "can", "what", "how", "with", "need",
  "does", "are", "have", "would", "could", "please", "tell", "about",
]);

/** Грубая нормализация: первые 5 символов ловят большинство словоформ RU/EN. */
function stem(word: string): string {
  return word.length > 5 ? word.slice(0, 5) : word;
}

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word))
    .map(stem)
    .slice(0, 24);
}

function scoreRow(
  row: KnowledgeRow,
  queryTokens: string[],
  phrase: string,
  intent: Intent,
): number {
  const title = row.title.toLowerCase();
  const category = (row.category ?? "").toLowerCase();
  const content = row.content.toLowerCase();
  let score = 0;

  if (phrase.length >= 6 && title.includes(phrase)) score += 6;

  for (const token of queryTokens) {
    if (title.includes(token)) score += 4;
    if (category.includes(token)) score += 2;
    const first = content.indexOf(token);
    if (first >= 0) {
      score += 1;
      if (content.indexOf(token, first + 1) >= 0) score += 1;
    }
  }

  // Подсказка по намерению: процесс, контакты, цены, услуги.
  if (intent === "process" && row.source === "process") score += 8;
  if (intent === "contacts" && row.source === "contacts") score += 8;
  if (intent === "pricing" && (row.source === "pricing" || row.source === "faq")) score += 4;
  if (intent === "services" && row.source === "service") score += 4;

  // Свежие/важные факты чуть выше при равенстве очков.
  return score + Math.max(0, 5 - row.sort / 100);
}

/** Ранжированный поиск по базе знаний (без внешних вызовов). */
export async function searchKnowledge(
  locale: "ru" | "en",
  query: string,
  limit = AI_KNOWLEDGE_MAX_FACTS,
): Promise<Array<KnowledgeRow & { score: number }>> {
  const rows = await db.aiKnowledgeItem
    .findMany({
      where: { locale, published: true },
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        source: true,
        sort: true,
      },
    })
    .catch(() => []);

  if (!rows.length) return [];

  const queryTokens = tokens(query);
  const phrase = query.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, " ").trim();
  const intent = detectIntent(query);
  if (!queryTokens.length) {
    return rows
      .slice()
      .sort((a, b) => a.sort - b.sort)
      .slice(0, limit)
      .map((row) => ({ ...row, score: 0 }));
  }

  const scored = rows
    .map((row) => ({ ...row, score: scoreRow(row, queryTokens, phrase, intent) }))
    .filter((row) => row.score >= 4)
    .sort((a, b) => b.score - a.score);

  if (scored.length) return scored.slice(0, limit);

  // Нет совпадений — отдаём базовые факты о компании, чтобы агент не молчал.
  return rows
    .filter((row) => row.sort <= 10)
    .sort((a, b) => a.sort - b.sort)
    .slice(0, Math.min(3, limit))
    .map((row) => ({ ...row, score: 0 }));
}

/** Готовый ответ из базы знаний, если совпадение достаточно уверенное. */
export async function findKnowledgeAnswer(
  locale: "ru" | "en",
  query: string,
): Promise<{ title: string; answer: string; source: string | null; score: number } | null> {
  // «Какие услуги вы делаете?» — отвечаем списком всех услуг, а не одной.
  if (detectIntent(query) === "services") {
    const services = await db.aiKnowledgeItem
      .findMany({
        where: { locale, published: true, source: "service" },
        orderBy: { sort: "asc" },
        select: { title: true, content: true },
        take: 12,
      })
      .catch(() => []);
    if (services.length) {
      const list = services
        .map((service) => {
          const name = service.title.replace(/^(Услуга|Service):\s*/i, "");
          return `• ${name} — ${firstSentence(service.content)}`;
        })
        .join("\n")
        .slice(0, 900);
      return {
        title: locale === "ru" ? "Услуги DS DIGITAL" : "DS DIGITAL services",
        answer: list,
        source: "service",
        score: 10,
      };
    }
  }

  const [best] = await searchKnowledge(locale, query, 1);
  if (!best || best.score < 4) return null;

  const content = best.content.trim();
  const answer =
    content.length <= 700
      ? content
      : `${content.slice(0, 700).replace(/\s+\S*$/, "")}…`;

  return { title: best.title, answer, source: best.source, score: best.score };
}

/** Первое предложение факта — для компактных списков услуг. */
function firstSentence(text: string, max = 110): string {
  const trimmed = text.trim();
  const end = trimmed.search(/[.!?](\s|$)/);
  const sentence = end > 20 ? trimmed.slice(0, end + 1) : trimmed;
  return sentence.length > max ? `${sentence.slice(0, max).replace(/\s+\S*$/, "")}…` : sentence;
}

/** Факты для промпта LLM: при наличии вопроса — релевантные, иначе базовые. */
export async function loadKnowledgeFacts(
  locale: "ru" | "en",
  query?: string,
): Promise<string[]> {
  const items = query?.trim()
    ? await searchKnowledge(locale, query)
    : await searchKnowledge(locale, "", AI_KNOWLEDGE_MAX_FACTS);

  return items.map((item) => {
    const head = item.category ? `[${item.category}] ${item.title}` : item.title;
    const body = item.content.trim().slice(0, AI_KNOWLEDGE_FACT_CHARS);
    return `${head}: ${body}`;
  });
}

/**
 * Цены из калькулятора — всегда актуальные значения из БД.
 * Формат — ориентир, не публичная оферта; дисклеймер добавляется отдельным фактом.
 */
export async function loadPricingFacts(locale: "ru" | "en"): Promise<string[]> {
  const [rules, config] = await Promise.all([
    db.calculatorRule.findMany({
      where: { active: true, locale },
      orderBy: [{ sort: "asc" }],
      select: { kind: true, label: true, price: true },
    }),
    db.calculatorConfig.findFirst({ select: { formula: true, disclaimer: true } }),
  ]);
  if (!rules.length) return [];

  const formula = (config?.formula ?? {}) as { basePrice?: number };
  const list = rules
    .map((r) => `${r.label}: $${r.price}`)
    .join("; ")
    .slice(0, 900);
  const base = typeof formula.basePrice === "number" ? ` Base: $${formula.basePrice}.` : "";

  const prefix =
    locale === "ru"
      ? `Цены из калькулятора (USD, ориентир, не финальная смета):${base} ${list}.`
      : `Prices from the calculator (USD, estimate only):${base} ${list}.`;

  const disclaimer = (config?.disclaimer ?? "").trim().slice(0, 240);
  return disclaimer ? [prefix, `Important caveat: ${disclaimer}`] : [prefix];
}
