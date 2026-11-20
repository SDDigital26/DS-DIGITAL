import { describe, expect, it } from "vitest";
import { faqItemSchema } from "@/lib/validation/faq";

const base = {
  locale: "ru" as const,
  section: "faq",
  question: "Сколько стоит сайт?",
  answer: "Зависит от объёма работ.",
  sort: 0,
  published: true,
};

describe("faqItemSchema", () => {
  it("принимает корректный вопрос", () => {
    expect(faqItemSchema.safeParse(base).success).toBe(true);
  });

  it("требует вопрос и ответ", () => {
    expect(faqItemSchema.safeParse({ ...base, question: "" }).success).toBe(false);
    expect(faqItemSchema.safeParse({ ...base, question: "   " }).success).toBe(false);
    expect(faqItemSchema.safeParse({ ...base, answer: "" }).success).toBe(false);
  });

  it("ограничивает длины", () => {
    expect(faqItemSchema.safeParse({ ...base, question: "x".repeat(301) }).success).toBe(false);
    expect(faqItemSchema.safeParse({ ...base, answer: "x".repeat(4001) }).success).toBe(false);
  });

  it("язык только ru/en", () => {
    expect(faqItemSchema.safeParse({ ...base, locale: "de" }).success).toBe(false);
    expect(faqItemSchema.safeParse({ ...base, locale: "en" }).success).toBe(true);
  });

  it("sort — целое неотрицательное", () => {
    expect(faqItemSchema.safeParse({ ...base, sort: -1 }).success).toBe(false);
    expect(faqItemSchema.safeParse({ ...base, sort: 1.5 }).success).toBe(false);
    expect(faqItemSchema.safeParse({ ...base, sort: 3 }).success).toBe(true);
  });
});
