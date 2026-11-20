import type { Locale } from "@/lib/i18n/config";

/**
 * Блок «KarmaRent CRM» (прототип первого экрана).
 * Демо — этап 5, поэтому вместо выдуманных скриншотов честная заглушка
 * с тем же текстом, что в прототипе.
 */
export function KarmaDemo({ locale, title, note }: { locale: Locale; title: string; note: string }) {
  return (
    <section id="projects" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <h2 className="text-2xl font-semibold sm:text-3xl">{title}</h2>

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
        {/* Постер-заглушка: без выдуманных скриншотов */}
        <div className="flex aspect-[16/9] w-full items-center justify-center bg-surface/40">
          <div className="max-w-xl px-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan">
              {title}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-secondary">{note}</p>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-secondary">
        {locale === "ru" ? "Демо-среда: изолированная база, синтетические данные, noindex." : "Demo environment: isolated database, synthetic data, noindex."}
      </p>
    </section>
  );
}
