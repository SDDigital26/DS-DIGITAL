import { describe, expect, it } from "vitest";
import { leadSchema } from "@/lib/validation/lead";

/** Минимально валидная заявка для негативных тестов. */
const base = {
  email: "user@example.com",
  description: "Нужен интернет-магазин на 500 товаров с оплатой онлайн.",
  consent: true as const,
  language: "en" as const,
};

describe("leadSchema", () => {
  it("принимает валидную заявку с email", () => {
    const result = leadSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("принимает заявку без email, но с Telegram", () => {
    const result = leadSchema.safeParse({
      ...base,
      email: undefined,
      telegram: "@handle",
    });
    expect(result.success).toBe(true);
  });

  it("отклоняет заявку без единого контакта", () => {
    const result = leadSchema.safeParse({ ...base, email: undefined });
    expect(result.success).toBe(false);
  });

  it("отклоняет заявку без согласия (ТЗ §25.4)", () => {
    const result = leadSchema.safeParse({ ...base, consent: false });
    expect(result.success).toBe(false);
  });

  it("отклоняет слишком короткое описание (< 3 символов)", () => {
    const result = leadSchema.safeParse({ ...base, description: "Хм" });
    expect(result.success).toBe(false);
  });

  it("принимает короткое, но осмысленное описание (от 3 символов)", () => {
    expect(leadSchema.safeParse({ ...base, description: "Сайт" }).success).toBe(true);
  });

  it("honeypot-поле website: непустое значение — признак бота", () => {
    expect(leadSchema.safeParse({ ...base, website: "http://spam" }).success).toBe(true);
    // пустая строка тоже допустима — обычные браузеры шлют пустое значение;
    // факт заполнения обрабатывает роут (тихий 202 без сохранения)
    expect(leadSchema.safeParse({ ...base, website: "" }).success).toBe(true);
    expect(leadSchema.safeParse({ ...base, website: "x".repeat(201) }).success).toBe(false);
  });

  it("отклоняет невалидный email", () => {
    expect(leadSchema.safeParse({ ...base, email: "not-an-email" }).success).toBe(false);
  });

  it("нормализует длину: слишком длинное описание отклоняется", () => {
    expect(leadSchema.safeParse({ ...base, description: "x".repeat(5001) }).success).toBe(false);
  });

  it("по умолчанию source = form, language = en", () => {
    const parsed = leadSchema.parse(base);
    expect(parsed.source).toBe("form");
    expect(parsed.language).toBe("en");
  });
});
