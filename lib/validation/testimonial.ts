import { z } from "zod";

/**
 * Валидация отзыва (ТЗ §17, §4.6, C-2).
 *
 * Жёсткое правило: отзыв публикуется только при `approved = true` И наличии
 * согласия автора (`consentAt`). Согласие нельзя «подразумевать» — его
 * фиксирует сотрудник, подтверждая, что автор разрешил публикацию.
 */

const trimmed = (max: number) => z.string().trim().max(max);

export const testimonialSchema = z
  .object({
    authorName: trimmed(80).min(1, "имя автора обязательно"),
    authorRole: trimmed(80).optional(),
    text: trimmed(2000).min(1, "текст отзыва обязателен"),
    locale: z.enum(["ru", "en"], { message: "язык: ru или en" }),
    avatarUrl: z
      .union([z.literal(""), z.string().trim().url("нужен корректный URL")])
      .optional(),
    approved: z.boolean().optional(),
    /** ISO-дата согласия автора на публикацию; null — согласия нет. */
    consentAt: z.string().datetime({ offset: true }).nullable().optional(),
    sort: z.number().int().min(0).max(1000).optional(),
  })
  .refine((v) => !v.approved || Boolean(v.consentAt), {
    message: "публикация возможна только при зафиксированном согласии автора",
    path: ["consentAt"],
  });

export type TestimonialInput = z.input<typeof testimonialSchema>;

/** Публичный отзыв: одобрен и есть согласие (ТЗ C-2). */
export const PUBLIC_TESTIMONIAL_WHERE = {
  approved: true,
  consentAt: { not: null },
} as const;
