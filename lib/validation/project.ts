import { z } from "zod";

/**
 * Валидация кейса (ТЗ §8, §17).
 *
 * Правило честности (ТЗ §4): кейс публикуется только для реально
 * существующего проекта. По умолчанию новый кейс — черновик (`published: false`),
 * публикация — осознанное действие сотрудника.
 */

const text = (max: number) => z.string().trim().max(max);

export const PROJECT_STATUSES = ["draft", "live", "in_development", "archived"] as const;

export const projectTranslationSchema = z.object({
  title: text(120).min(1, "заголовок обязателен"),
  summary: text(500),
  description: text(8000),
  task: text(4000),
  solution: text(4000),
  features: z.array(text(200)).max(20, "максимум 20 пунктов"),
  tech: z.array(text(60)).max(30, "максимум 30 технологий"),
  category: text(80),
  seoTitle: text(70).optional(),
  seoDesc: text(200).optional(),
  ogImage: z.union([z.literal(""), z.string().trim().url("нужен корректный URL")]).optional(),
});

export const projectImageSchema = z.object({
  id: z.string().optional(),
  url: z.string().trim().url("нужен корректный URL"),
  altRu: text(200).optional(),
  altEn: text(200).optional(),
  type: z.enum(["cover", "screenshot"], { message: "тип: cover или screenshot" }).optional(),
  sort: z.number().int().min(0).max(1000).optional(),
});

export const projectSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "только латиница, цифры и дефисы")
    .min(2)
    .max(80),
  status: z.enum(PROJECT_STATUSES, { message: "неизвестный статус" }).optional(),
  sort: z.number().int().min(0).max(1000).optional(),
  published: z.boolean().optional(),
  translations: z
    .object({
      ru: projectTranslationSchema.optional(),
      en: projectTranslationSchema.optional(),
    })
    .refine((v) => v.ru || v.en, { message: "нужен хотя бы один язык (ru или en)" }),
  images: z.array(projectImageSchema).max(20, "максимум 20 изображений").optional(),
});

export type ProjectInput = z.input<typeof projectSchema>;
