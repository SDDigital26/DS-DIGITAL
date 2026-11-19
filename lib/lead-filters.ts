import { Prisma } from "@/lib/generated/prisma/client";
import { isLeadStatus } from "@/lib/leads";

/**
 * Фильтры списка заявок (ТЗ §17): статус, услуга, источник, поиск, даты.
 * Используется и страницей списка, и экспортом CSV — результат совпадает.
 * Все значения валидируются: клиенту не доверяем (ТЗ §21.1).
 */

export type LeadFilters = {
  status?: string;
  service?: string;
  source?: string;
  q?: string;
  from?: string;
  to?: string;
  page?: string;
};

export const LEAD_SOURCES = ["form", "calculator", "ai", "contact"] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

function isLeadSource(value: string): value is LeadSource {
  return (LEAD_SOURCES as readonly string[]).includes(value);
}

function parseDate(value: string | undefined, endOfDay: boolean): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return undefined;
  // «до» берём включая весь день (YYYY-MM-DD)
  if (endOfDay) date.setUTCHours(23, 59, 59, 999);
  return date;
}

export function buildLeadWhere(filters: LeadFilters): Prisma.LeadWhereInput {
  const where: Prisma.LeadWhereInput = {};

  if (filters.status && isLeadStatus(filters.status)) {
    where.status = filters.status;
  }
  if (filters.service && filters.service.length <= 80) {
    where.service = filters.service;
  }
  if (filters.source && isLeadSource(filters.source)) {
    where.source = filters.source;
  }

  const q = filters.q?.trim();
  if (q && q.length <= 100) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const from = parseDate(filters.from, false);
  const to = parseDate(filters.to, true);
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };
  }

  return where;
}

export function parseLeadFilters(searchParams: URLSearchParams | Record<string, string | string[] | undefined>): LeadFilters {
  const get = (key: string): string | undefined => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key) ?? undefined;
    }
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };

  return {
    status: get("status"),
    service: get("service"),
    source: get("source"),
    q: get("q"),
    from: get("from"),
    to: get("to"),
    page: get("page"),
  };
}

/** Номер страницы (1-based), по умолчанию 1. */
export function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 ? Math.min(n, 10_000) : 1;
}

export const LEADS_PER_PAGE = 20;
