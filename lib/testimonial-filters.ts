import { Prisma } from "@/lib/generated/prisma/client";
import { PUBLIC_TESTIMONIAL_WHERE } from "@/lib/validation/testimonial";
import { parsePage } from "@/lib/lead-filters";

/**
 * Фильтры списка отзывов в админке: статус публикации, язык, поиск.
 */
export type TestimonialFilters = {
  state?: string;
  locale?: string;
  q?: string;
  page?: string;
};

export const TESTIMONIALS_PER_PAGE = 20;
export { parsePage };

function get(
  source: URLSearchParams | Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  if (source instanceof URLSearchParams) return source.get(key) ?? undefined;
  const value = source[key];
  return Array.isArray(value) ? value[0] : value;
}

export function parseTestimonialFilters(
  source: URLSearchParams | Record<string, string | string[] | undefined>,
): TestimonialFilters {
  return {
    state: get(source, "state"),
    locale: get(source, "locale"),
    q: get(source, "q"),
    page: get(source, "page"),
  };
}

export function buildTestimonialWhere(
  filters: TestimonialFilters,
): Prisma.TestimonialWhereInput {
  const where: Prisma.TestimonialWhereInput = {};

  // published = одобрено И есть согласие (то же правило, что на сайте).
  if (filters.state === "published") Object.assign(where, PUBLIC_TESTIMONIAL_WHERE);
  if (filters.state === "no-consent") {
    where.approved = true;
    where.consentAt = null;
  }
  if (filters.state === "draft") where.approved = false;

  if (filters.locale === "ru" || filters.locale === "en") where.locale = filters.locale;

  const q = filters.q?.trim();
  if (q && q.length <= 100) {
    where.OR = [
      { authorName: { contains: q, mode: "insensitive" } },
      { authorRole: { contains: q, mode: "insensitive" } },
      { text: { contains: q, mode: "insensitive" } },
    ];
  }

  return where;
}
