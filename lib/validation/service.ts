import { z } from "zod";

/**
 * Валидация услуги в админке (ТЗ §17: формы с валидацией, оба языка).
 * Серверу не доверяем (ТЗ §21.1).
 */

const text = (max: number) => z.string().trim().max(max);

export const serviceTranslationSchema = z.object({
  title: text(120).min(1, "заголовок обязателен"),
  hero: text(2000),
  problem: text(4000),
  solution: text(4000),
  benefits: z.array(text(200)).max(10, "максимум 10 пунктов"),
  result: text(2000).optional(),
  audience: text(2000).optional(),
  timeline: text(1000).optional(),
  seoTitle: text(70).optional(),
  seoDesc: text(200).optional(),
});

export const serviceSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "только латиница, цифры и дефисы")
      .min(2)
      .max(80),
    icon: text(40).nullable().optional(),
    sort: z.number().int().min(0).max(1000).optional(),
    published: z.boolean().optional(),
    translations: z
      .object({
        ru: serviceTranslationSchema.optional(),
        en: serviceTranslationSchema.optional(),
      })
      .refine((v) => v.ru || v.en, { message: "нужен хотя бы один язык (ru или en)" }),
  })
  .refine((v) => v.slug !== "", { message: "slug обязателен" });

export type ServiceInput = z.input<typeof serviceSchema>;
