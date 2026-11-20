import { describe, expect, it } from "vitest";
import { serviceSchema, serviceTranslationSchema } from "@/lib/validation/service";

const baseTranslation = {
  title: "Web Development",
  hero: "Разработка сайтов",
  problem: "",
  solution: "",
  benefits: ["Сайт", "Магазин"],
  seoTitle: "",
  seoDesc: "",
};

const base = {
  slug: "web-development",
  sort: 0,
  published: true,
  translations: { ru: baseTranslation, en: baseTranslation },
};

describe("serviceSchema", () => {
  it("принимает валидную услугу с двумя языками", () => {
    expect(serviceSchema.safeParse(base).success).toBe(true);
  });

  it("принимает услугу только с одним языком", () => {
    const result = serviceSchema.safeParse({
      ...base,
      translations: { ru: baseTranslation },
    });
    expect(result.success).toBe(true);
  });

  it("отклоняет отсутствие обоих языков", () => {
    expect(serviceSchema.safeParse({ ...base, translations: {} }).success).toBe(false);
  });

  it("slug: только латиница, цифры и дефисы", () => {
    for (const slug of ["Web-Development", "web dev", "web_dev", "веб", "a", ""]) {
      expect(serviceSchema.safeParse({ ...base, slug }).success).toBe(false);
    }
    for (const slug of ["web", "web-development", "crm2", "a1-b2"]) {
      expect(serviceSchema.safeParse({ ...base, slug }).success).toBe(true);
    }
  });

  it("title обязателен и не длиннее 120", () => {
    expect(
      serviceTranslationSchema.safeParse({ ...baseTranslation, title: "" }).success,
    ).toBe(false);
    expect(
      serviceTranslationSchema.safeParse({ ...baseTranslation, title: "x".repeat(121) }).success,
    ).toBe(false);
  });

  it("benefits — массив строк, максимум 10", () => {
    expect(
      serviceTranslationSchema.safeParse({ ...baseTranslation, benefits: ["a", "b"] }).success,
    ).toBe(true);
    expect(
      serviceTranslationSchema.safeParse({
        ...baseTranslation,
        benefits: Array.from({ length: 11 }, (_, i) => `p${i}`),
      }).success,
    ).toBe(false);
    expect(
      serviceTranslationSchema.safeParse({ ...baseTranslation, benefits: "не массив" }).success,
    ).toBe(false);
  });

  it("seoTitle/seoDesc ограничены по длине", () => {
    expect(
      serviceTranslationSchema.safeParse({ ...baseTranslation, seoTitle: "x".repeat(71) }).success,
    ).toBe(false);
    expect(
      serviceTranslationSchema.safeParse({ ...baseTranslation, seoDesc: "x".repeat(201) }).success,
    ).toBe(false);
  });

  it("published — булево", () => {
    expect(serviceSchema.safeParse({ ...base, published: "yes" }).success).toBe(false);
  });
});
