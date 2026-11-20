"use client";

import { useState } from "react";

export type ShowcaseItem = {
  slug: string;
  title: string;
  hero: string;
};

/**
 * «Что мы создаём» (прототип первого экрана): карточки услуг + панель примера.
 * Наведение/фокус/нажатие выбирают карточку. Сами интерактивные примеры —
 * этап 5/6 плана, поэтому вместо выдуманного контента честная заглушка.
 */
export function ServicesShowcase({
  items,
  hint,
  emptyTitle,
  emptyText,
}: {
  items: ShowcaseItem[];
  hint: string;
  emptyTitle: string;
  emptyText: string;
}) {
  const [activeSlug, setActiveSlug] = useState<string>(items[0]?.slug ?? "");
  const current = items.find((item) => item.slug === activeSlug) ?? items[0];

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-secondary">{hint}</p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* Карточки */}
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => {
            const isActive = item.slug === current?.slug;
            return (
              <button
                key={item.slug}
                type="button"
                aria-pressed={isActive}
                onMouseEnter={() => setActiveSlug(item.slug)}
                onFocus={() => setActiveSlug(item.slug)}
                onClick={() => setActiveSlug(item.slug)}
                className={`rounded-2xl border p-5 text-left transition-colors ${
                  isActive
                    ? "border-accent/70 bg-surface"
                    : "border-white/10 bg-surface/60 hover:border-white/25"
                }`}
              >
                <span className="block text-base font-semibold">{item.title}</span>
                <span className="mt-2 block text-sm text-secondary">{item.hero}</span>
              </button>
            );
          })}
        </div>

        {/* Панель примера */}
        <div
          aria-live="polite"
          className="flex min-h-56 flex-col justify-center rounded-2xl border border-white/10 bg-surface/60 p-6"
        >
          {current ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-widest text-cyan">
                {current.title}
              </p>
              <p className="mt-3 text-lg font-semibold">{emptyTitle}</p>
              <p className="mt-2 text-sm text-secondary">{emptyText}</p>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
