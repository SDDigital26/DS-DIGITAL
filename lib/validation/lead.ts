import { z } from "zod";

/**
 * Публичная форма заявки (Док.2 §14.1).
 * Серверная валидация обязательна — клиенту не доверяем (ТЗ §21.1).
 * Минимум: один контакт + описание (Док.2 §14.1).
 */
export const leadSchema = z
  .object({
    name: z.string().trim().max(120, "name too long").optional(),
    email: z.string().trim().email("invalid email").max(200).optional(),
    whatsapp: z.string().trim().max(40).optional(),
    telegram: z.string().trim().max(64).optional(),
    country: z.string().trim().max(80).optional(),
    language: z.enum(["ru", "en"]).default("en"),
    service: z.string().trim().max(80).optional(),
    budget: z.string().trim().max(80).optional(),
    description: z
      .string()
      .trim()
      .min(10, "description too short")
      .max(5000, "description too long"),
    source: z.enum(["form", "calculator", "ai", "ai-consultant", "contact"]).default("form"),
    // UTM / кампании
    utmSource: z.string().trim().max(200).optional(),
    utmMedium: z.string().trim().max(200).optional(),
    utmCampaign: z.string().trim().max(200).optional(),
    utmContent: z.string().trim().max(200).optional(),
    utmTerm: z.string().trim().max(200).optional(),
    gclid: z.string().trim().max(200).optional(),
    fbclid: z.string().trim().max(200).optional(),
    landingPath: z.string().trim().max(300).optional(),
    // снимки
    calculatorSnapshot: z.unknown().optional(),
    aiTranscript: z.unknown().optional(),
    // honeypot + согласие (Док.2 §14.2, §25.4)
    // honeypot-поле: заполнено → роут отвечает тихим 202 и ничего не сохраняет.
    website: z.string().max(200).optional(),
    consent: z.literal(true, { message: "consent required" }),
    consentText: z.string().max(500).optional(),
  })
  .refine((v) => Boolean(v.email || v.whatsapp || v.telegram), {
    message: "at least one contact method is required",
    path: ["email"],
  });

export type LeadInput = z.input<typeof leadSchema>;
