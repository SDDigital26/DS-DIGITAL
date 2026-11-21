"use client";

/**
 * Кнопка на главной открывает плавающий виджет AI-консультанта
 * (монтируется в layout). Связь — через событие окна, чтобы не
 * поднимать второе состояние диалога.
 */
export function OpenAiButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="sbtn p"
      onClick={() => window.dispatchEvent(new Event("ds:ai-open"))}
    >
      {label}
    </button>
  );
}
