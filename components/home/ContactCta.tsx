import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";

/**
 * Финальный CTA «Готовы начать?» (прототип первого экрана).
 * Реальные контакты ещё не переданы [С], поэтому кнопки ведут на страницу
 * контактов, а честная пометка из прототипа остаётся на месте.
 */
export function ContactCta({
  locale,
  title,
  text,
  note,
  channels,
}: {
  locale: Locale;
  title: string;
  text: string;
  note: string;
  channels: string[];
}) {
  return (
    <section id="contact" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="rounded-3xl border border-white/10 bg-surface p-8 sm:p-12">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
        <p className="mt-3 max-w-2xl text-secondary">{text}</p>

        <div className="mt-8 flex flex-wrap gap-3">
          {channels.map((channel) => (
            <Link
              key={channel}
              href={`/${locale}/contact`}
              className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-cyan"
            >
              {channel}
            </Link>
          ))}
        </div>

        <p className="mt-6 text-xs text-secondary">{note}</p>
      </div>
    </section>
  );
}
