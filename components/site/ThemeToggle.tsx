"use client";

import { useEffect, useState } from "react";

/** Переключатель светлой/тёмной темы. Тёмная — по умолчанию (ТЗ палитра). */
export function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("ds-theme");
    const isLight = stored === "light";
    queueMicrotask(() => setLight(isLight));
    document.documentElement.dataset.theme = isLight ? "light" : "dark";
  }, []);

  function toggle() {
    const next = !light;
    setLight(next);
    document.documentElement.dataset.theme = next ? "light" : "dark";
    localStorage.setItem("ds-theme", next ? "light" : "dark");
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={light ? "Тёмная тема" : "Светлая тема"}
      title={light ? "Тёмная тема" : "Светлая тема"}
    >
      <span aria-hidden="true">{light ? "☀" : "☾"}</span>
    </button>
  );
}
