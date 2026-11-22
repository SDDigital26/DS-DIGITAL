import { Prisma } from "@/lib/generated/prisma/client";
import { db } from "@/lib/db";
import { parsePage } from "@/lib/lead-filters";

/**
 * База знаний внутреннего AI-агента.
 * В промпт попадают только опубликованные факты нужного языка,
 * ограниченного объёма — модель не должна «думать» за бизнес (ТЗ §4).
 */
export type KnowledgeFilters = {
  locale?: string;
  published?: string;
  q?: string;
  page?: string;
};

export const KNOWLEDGE_PER_PAGE = 20;
export const AI_KNOWLEDGE_MAX_FACTS = 6;
export const AI_KNOWLEDGE_FACT_CHARS = 420;
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

/** Короткие факты для системного промпта (не более 6 × 420 символов). */
export async function loadKnowledgeFacts(locale: "ru" | "en"): Promise<string[]> {
  const items = await db.aiKnowledgeItem.findMany({
    where: buildKnowledgeWhere({ locale }, true),
    orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
    take: AI_KNOWLEDGE_MAX_FACTS,
    select: { title: true, content: true, category: true },
  });

  return items.map((item) => {
    const head = item.category ? `[${item.category}] ${item.title}` : item.title;
    const body = item.content.trim().slice(0, AI_KNOWLEDGE_FACT_CHARS);
    return `${head}: ${body}`;
  });
}
