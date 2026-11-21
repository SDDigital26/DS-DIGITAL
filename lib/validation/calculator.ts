import { z } from "zod";

/**
 * Валидация запроса калькулятора (ТЗ §12.5, §21.1).
 * Сервер не доверяет клиентскому результату — принимает только выбор,
 * а цену считает заново по правилам из БД.
 */

const key = z.string().trim().max(60);

export const calculatorRequestSchema = z.object({
  selection: z.object({
    service: key,
    features: z.array(key).max(20).default([]),
    complexity: key,
    options: z.array(key).max(20).default([]),
  }),
  locale: z.enum(["ru", "en"]).default("ru"),
});

/** Админ-форма правила (RU/EN-подписи + числовые поля). */
export const calculatorRuleSchema = z.object({
  kind: z.enum(["service", "feature", "complexity", "option"], { message: "неизвестный вид правила" }),
  key: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_-]+$/, "только латиница, цифры, дефис и подчёркивание")
    .min(1)
    .max(60),
  price: z.number().int().min(0).max(1_000_000),
  weight: z.number().min(0).max(10).optional(),
  sort: z.number().int().min(0).max(100000).optional(),
  active: z.boolean().optional(),
  ru: z.string().trim().min(1, "подпись RU обязательна").max(120),
  en: z.string().trim().min(1, "подпись EN обязательна").max(120),
});

export const calculatorConfigSchema = z.object({
  disclaimerRu: z.string().trim().max(2000),
  disclaimerEn: z.string().trim().max(2000),
});

export type CalculatorRuleInput = z.input<typeof calculatorRuleSchema>;
