"use client";

import { useEffect, useRef } from "react";

/**
 * Матричный дождь из «стекающего кода» на фоне всего сайта (ТЗ §7.4, режим full).
 *
 * Принципы (по опыту жалоб на «рябь»):
 * - слой под контентом (z-index 0, .ds поднят выше), карточки и текст читаются;
 * - медленный шаг (~90 мс) вместо 60 fps — глаз не ломается;
 * - палитра от темы: тёмная — спокойный cyan, светлая — очень бледный синий;
 * - пауза при скрытой вкладке и prefers-reduced-motion, DPR ≤ 1.
 */

const GLYPHS = "アカサタナハマヤラワエキソ0123456789{}[]<>=/;#$&+*%_";

type Column = {
  /** Текущая строка (в клетках), может быть отрицательной — колонка ещё «не вытекла». */
  y: number;
  /** Шаг за тик в клетках (1 = обычная скорость, 2 = быстрее). */
  speed: number;
  /** Колонка активна в этом цикле. */
  active: boolean;
};

export function MatrixRain({ mode }: { mode?: "full" | "lite" | "static" }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (mode !== "full") return;
    const canvasEl = ref.current;
    if (!canvasEl) return;
    const context = canvasEl.getContext("2d");
    if (!context) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas: HTMLCanvasElement = canvasEl;
    const ctx: CanvasRenderingContext2D = context;

    const CELL = 18;
    const TICK_MS = 90;
    const FADE_DARK = 0.055;
    const FADE_LIGHT = 0.045;

    let width = 0;
    let height = 0;
    let columns: Column[] = [];
    let timer = 0;
    let last = 0;
    let disposed = false;

    const isLight = () => document.documentElement.dataset.theme === "light";

    function palette() {
      return isLight()
        ? { head: "rgba(23, 107, 255, 0.30)", body: "rgba(23, 107, 255, 0.13)", fade: FADE_LIGHT, skip: 0.45 }
        : { head: "rgba(53, 216, 255, 0.42)", body: "rgba(53, 216, 255, 0.16)", fade: FADE_DARK, skip: 0.32 };
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = '13px ui-monospace, "SF Mono", Menlo, Consolas, monospace';
      ctx.textBaseline = "top";

      const count = Math.ceil(width / CELL);
      columns = Array.from({ length: count }, () => spawn(-1));
      ctx.clearRect(0, 0, width, height);
    }

    function spawn(atRow?: number): Column {
      return {
        y: atRow ?? -Math.floor(Math.random() * 40),
        speed: Math.random() < 0.2 ? 2 : 1,
        active: Math.random() > palette().skip,
      };
    }

    function step() {
      const colors = palette();
      // Шлейф: плавно стираем предыдущие кадры, сохраняя прозрачность фона.
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = `rgba(0, 0, 0, ${colors.fade})`;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "source-over";

      const rows = Math.ceil(height / CELL);
      for (let i = 0; i < columns.length; i += 1) {
        const column = columns[i];
        if (!column.active) {
          // Часть колонок «спит», чтобы дождь был редким и спокойным.
          if (Math.random() < 0.02) column.active = true;
          continue;
        }
        column.y += column.speed;
        const x = i * CELL + 2;

        if (column.y > rows + 6) {
          columns[i] = spawn();
          continue;
        }
        if (column.y < 0) continue;

        const glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        ctx.fillStyle = colors.body;
        ctx.fillText(glyph, x, column.y * CELL);
        // «Голова» капли чуть ярче.
        if (column.y > 1) {
          ctx.fillStyle = colors.head;
          ctx.fillText(GLYPHS[Math.floor(Math.random() * GLYPHS.length)], x, (column.y - 1) * CELL);
        }
      }

      // Иногда гасим колонку, чтобы картинка не была равномерной.
      if (Math.random() < 0.06) {
        const index = Math.floor(Math.random() * columns.length);
        columns[index].active = false;
      }
    }

    function frame(now: number) {
      if (disposed) return;
      if (!last) last = now;
      if (now - last >= TICK_MS) {
        last = now;
        step();
      }
      timer = requestAnimationFrame(frame);
    }

    function start() {
      if (disposed || timer) return;
      last = 0;
      timer = requestAnimationFrame(frame);
    }

    function stop() {
      if (timer) {
        cancelAnimationFrame(timer);
        timer = 0;
      }
    }

    function onVisibility() {
      if (document.hidden) stop();
      else start();
    }

    // Смена темы — перерисовать палитру с чистого листа.
    const themeObserver = new MutationObserver(() => {
      ctx.clearRect(0, 0, width, height);
      columns = columns.map((column) => ({ ...column }));
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      disposed = true;
      stop();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      themeObserver.disconnect();
    };
  }, [mode]);

  if (mode !== "full") return null;
  return <canvas id="ds-matrix" ref={ref} aria-hidden="true" />;
}
