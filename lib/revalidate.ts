import { revalidatePath } from "next/cache";

/**
 * Сброс кэша публичных страниц после правок контента в админке (ТЗ §17:
 * изменения применяются без деплоя).
 */

export function revalidateTestimonials() {
  revalidatePath("/ru");
  revalidatePath("/en");
}

export function revalidateService(slug: string) {
  revalidatePath("/ru/services");
  revalidatePath("/en/services");
  revalidatePath(`/ru/services/${slug}`);
  revalidatePath(`/en/services/${slug}`);
}

export function revalidateFaq() {
  revalidatePath("/ru/faq");
  revalidatePath("/en/faq");
}

export function revalidateCalculator() {
  revalidatePath("/ru");
  revalidatePath("/en");
  revalidatePath("/ru/calculator");
  revalidatePath("/en/calculator");
}

export function revalidateProject(slug?: string) {
  revalidatePath("/ru/projects");
  revalidatePath("/en/projects");
  if (slug) {
    revalidatePath(`/ru/projects/${slug}`);
    revalidatePath(`/en/projects/${slug}`);
  }
}
