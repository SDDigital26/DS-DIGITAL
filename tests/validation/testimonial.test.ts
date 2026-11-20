import { describe, expect, it } from "vitest";
import { testimonialSchema } from "@/lib/validation/testimonial";

const base = {
  authorName: "Иван",
  authorRole: "CEO",
  text: "Хорошая работа",
  locale: "ru" as const,
  avatarUrl: "",
  approved: false,
  consentAt: null,
  sort: 0,
};

describe("testimonialSchema", () => {
  it("принимает черновик без согласия", () => {
    expect(testimonialSchema.safeParse(base).success).toBe(true);
  });

  it("принимает опубликованный отзыв с согласием", () => {
    const result = testimonialSchema.safeParse({
      ...base,
      approved: true,
      consentAt: "2026-11-20T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("запрещает публикацию без согласия автора", () => {
    const result = testimonialSchema.safeParse({ ...base, approved: true, consentAt: null });
    expect(result.success).toBe(false);
  });

  it("запрещает публикацию без поля consentAt", () => {
    const withoutConsent = { ...base };
    delete (withoutConsent as { consentAt?: unknown }).consentAt;
    expect(testimonialSchema.safeParse({ ...withoutConsent, approved: true }).success).toBe(false);
  });

  it("требует имя и текст", () => {
    expect(testimonialSchema.safeParse({ ...base, authorName: "" }).success).toBe(false);
    expect(testimonialSchema.safeParse({ ...base, text: "   " }).success).toBe(false);
  });

  it("ограничивает длины", () => {
    expect(testimonialSchema.safeParse({ ...base, authorName: "x".repeat(81) }).success).toBe(false);
    expect(testimonialSchema.safeParse({ ...base, text: "x".repeat(2001) }).success).toBe(false);
    expect(testimonialSchema.safeParse({ ...base, authorRole: "x".repeat(81) }).success).toBe(false);
  });

  it("язык только ru/en", () => {
    expect(testimonialSchema.safeParse({ ...base, locale: "de" }).success).toBe(false);
    expect(testimonialSchema.safeParse({ ...base, locale: "en" }).success).toBe(true);
  });

  it("avatarUrl — пусто или корректный URL", () => {
    expect(testimonialSchema.safeParse({ ...base, avatarUrl: "" }).success).toBe(true);
    expect(testimonialSchema.safeParse({ ...base, avatarUrl: "not-a-url" }).success).toBe(false);
    expect(
      testimonialSchema.safeParse({ ...base, avatarUrl: "https://example.com/a.png" }).success,
    ).toBe(true);
  });

  it("отклоняет некорректную дату согласия", () => {
    expect(
      testimonialSchema.safeParse({ ...base, approved: true, consentAt: "вчера" }).success,
    ).toBe(false);
  });
});
