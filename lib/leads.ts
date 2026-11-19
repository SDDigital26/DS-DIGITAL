/** Статусы заявок (Док.2 §14) и их подписи на русском. */
export const LEAD_STATUSES = ["New", "In Progress", "Qualified", "Won", "Lost"] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  New: "Новые",
  "In Progress": "В работе",
  Qualified: "Квалифицированы",
  Won: "Выиграно",
  Lost: "Проиграно",
};

export function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === "string" && (LEAD_STATUSES as readonly string[]).includes(value);
}
