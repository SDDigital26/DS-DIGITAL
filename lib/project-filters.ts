import { Prisma } from "@/lib/generated/prisma/client";
import { PROJECT_STATUSES } from "@/lib/validation/project";
import { parsePage } from "@/lib/lead-filters";

/**
 * Фильтры списка кейсов в админке: публикация, статус, язык, категория, поиск.
 * Используются и страницей, и API — результаты совпадают.
 */
export type ProjectFilters = {
  published?: string;
  status?: string;
  locale?: string;
  category?: string;
  q?: string;
  page?: string;
};

export const PROJECTS_PER_PAGE = 20;
export { parsePage };

function get(
  source: URLSearchParams | Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  if (source instanceof URLSearchParams) return source.get(key) ?? undefined;
  const value = source[key];
  return Array.isArray(value) ? value[0] : value;
}

export function parseProjectFilters(
  source: URLSearchParams | Record<string, string | string[] | undefined>,
): ProjectFilters {
  return {
    published: get(source, "published"),
    status: get(source, "status"),
    locale: get(source, "locale"),
    category: get(source, "category"),
    q: get(source, "q"),
    page: get(source, "page"),
  };
}

export function buildProjectWhere(filters: ProjectFilters): Prisma.ProjectWhereInput {
  const where: Prisma.ProjectWhereInput = {};

  if (filters.published === "1" || filters.published === "true") where.published = true;
  if (filters.published === "0" || filters.published === "false") where.published = false;

  if (filters.status && (PROJECT_STATUSES as readonly string[]).includes(filters.status)) {
    where.status = filters.status;
  }

  // Язык и категория могут быть в разных переводах — объединяем через AND.
  const and: Prisma.ProjectWhereInput[] = [];
  if (filters.locale === "ru" || filters.locale === "en") {
    and.push({ translations: { some: { locale: filters.locale } } });
  }
  const category = filters.category?.trim();
  if (category && category.length <= 80) {
    and.push({
      translations: { some: { category: { contains: category, mode: "insensitive" } } },
    });
  }
  if (and.length) where.AND = and;

  const q = filters.q?.trim();
  if (q && q.length <= 100) {
    where.OR = [
      { slug: { contains: q, mode: "insensitive" } },
      { translations: { some: { title: { contains: q, mode: "insensitive" } } } },
      { translations: { some: { summary: { contains: q, mode: "insensitive" } } } },
    ];
  }

  return where;
}
