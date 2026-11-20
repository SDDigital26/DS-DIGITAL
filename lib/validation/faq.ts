import { z } from "zod";

/**
 * Валидация вопроса FAQ (ТЗ §17). Вопросы хранятся построчно по языкам —
 * так редактор может обновить один язык, не переписывая второй.
 */

const trimmed = (max: number) => z.string().trim().max(max);

export const faqItemSchema = z.object({
  locale: z.enum(["ru", "en"], { message: "язык: ru или en" }),
  section: trimmed(40).optional(),
  question: trimmed(300).min(1, "вопрос обязателен"),
  answer: trimmed(4000).min(1, "ответ обязателен"),
  sort: z.number().int().min(0).max(1000).optional(),
  published: z.boolean().optional(),
});

export type FaqItemInput = z.input<typeof faqItemSchema>;
