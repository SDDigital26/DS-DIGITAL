"use client";

import { useEffect, useState } from "react";

/** Переключатель светлой/тёмной темы. Тёмная — по умолчанию (ТЗ палитра). */
export function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("ds-theme");
    const isLight = stored === "light";
    document.documentElement.dataset.theme = isLight ? "light" : "dark";
    // Синхронизируем состояние и фон .ds асинхронно (без каскадного ре-рендера)
    queueMicrotask(() => {
      setLight(isLight);
      const ds = document.querySelector('.ds') as HTMLElement;
      if (ds) {
        ds.style.background = isLight ? '#ffffff' : 'transparent';
      }
    });
  }, []);

  function toggle() {
    const next = !light;
    setLight(next);
    document.documentElement.dataset.theme = next ? "light" : "dark";
    localStorage.setItem("ds-theme", next ? "light" : "dark");
    // Синхронизируем фон .ds при клике
    queueMicrotask(() => {
      const ds = document.querySelector('.ds') as HTMLElement;
      if (ds) {
        ds.style.background = next ? '#ffffff' : 'transparent';
      }
    });
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