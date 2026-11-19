import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

/**
 * Заголовок страницы + честная заглушка «контент готовится».
 * Правило ТЗ §4: пустые разделы не имитируем контентом.
 */
export function PageHeader({
  title,
  subtitle,
}: {
  /** Язык страницы — резерв для будущей локализации заголовка. */
  locale?: Locale;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
      <p className="mt-4 max-w-2xl text-lg text-secondary">{subtitle}</p>
    </div>
  );
}

export function PendingBlock({ text }: { text: string }) {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
      <div className="rounded-2xl border border-dashed border-white/15 bg-surface/50 p-8 text-center text-sm text-secondary">
        {text}
      </div>
    </div>
  );
}

export function PendingSection({ dict }: { dict: Dictionary }) {
  return <PendingBlock text={dict.home.contentPending} />;
}
