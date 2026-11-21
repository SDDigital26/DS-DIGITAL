"use client";

import { useEffect, useRef } from "react";

type Spark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
};

type Comet = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  nodes: { x: number; y: number }[];
};

/**
 * Светлая тема вместо молнии: искры от мыши и «кометы данных» —
 * частицы со связями между узлами, создающие ощущение потока данных.
 * Включается/выключается через data-theme (переключатель ставит его позже mount).
 */
export function CursorSparks() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const fine = window.matchMedia("(pointer: fine) and (hover: hover)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    let width = 0;
    let height = 0;
    let raf = 0;
    let running = false;
    let lastMouse = { x: -100, y: -100, t: 0 };
    const sparks: Spark[] = [];
    const comets: Comet[] = [];
    const colors = ["23,107,255", "139,92,255", "53,216,255"];

    const isLight = () =>
      document.documentElement.dataset.theme === "light" && !reduced && fine;

    function size() {
      width = window.innerWidth;
      height = window.innerHeight;
      cv!.width = Math.round(width * dpr);
      cv!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawnSparks(x: number, y: number, count: number) {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1.6;
        const maxLife = 30 + Math.random() * 28;
        sparks.push({
          x,
          y,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed - 0.35,
          life: maxLife,
          maxLife,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 1 + Math.random() * 1.8,
        });
      }
      if (sparks.length > 120) sparks.splice(0, sparks.length - 120);
    }

    function spawnComet() {
      const fromLeft = Math.random() > 0.5;
      const x = fromLeft ? -40 : width + 40;
      const y = height * (0.15 + Math.random() * 0.55);
      const vx = (fromLeft ? 1 : -1) * (0.9 + Math.random() * 1.1);
      const vy = (Math.random() - 0.35) * 0.6;
      const maxLife = 200 + Math.random() * 140;
      comets.push({
        x,
        y,
        vx,
        vy,
        life: maxLife,
        maxLife,
        color: colors[Math.floor(Math.random() * colors.length)],
        nodes: [],
      });
    }

    function onPointerMove(e: PointerEvent) {
      if (e.pointerType === "touch" || !running) return;
      const now = performance.now();
      const dx = e.clientX - lastMouse.x;
      const dy = e.clientY - lastMouse.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 5 && now - lastMouse.t > 14) {
        spawnSparks(e.clientX, e.clientY, Math.min(6, Math.ceil(dist / 10)));
        lastMouse = { x: e.clientX, y: e.clientY, t: now };
      }
    }

    function frame() {
      raf = 0;
      if (!running || !isLight()) return;
      if (document.hidden) {
        raf = requestAnimationFrame(frame);
        return;
      }

      ctx!.clearRect(0, 0, width, height);

      // Кометы данных — появляются часто, оставляют «граф»-связь между узлами
      if (Math.random() < 0.02 && comets.length < 4) spawnComet();

      comets.forEach((c) => {
        c.x += c.vx;
        c.y += c.vy;
        c.life--;
        c.nodes.unshift({ x: c.x, y: c.y });
        if (c.nodes.length > 18) c.nodes.pop();
        const t = c.life / c.maxLife;
        const alpha = Math.sin(Math.min(1, t) * Math.PI) * 0.8;

        // Линии между соседними узлами — «связь между звёздами»
        ctx!.lineWidth = 1.2;
        for (let i = 0; i < c.nodes.length - 1; i++) {
          const a = c.nodes[i];
          const b = c.nodes[i + 1];
          const segAlpha = alpha * (1 - i / c.nodes.length) * 0.7;
          ctx!.strokeStyle = `rgba(${c.color},${segAlpha})`;
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(b.x, b.y);
          ctx!.stroke();
        }
        // Узлы
        c.nodes.forEach((n, i) => {
          const a = alpha * (1 - i / c.nodes.length);
          ctx!.fillStyle = `rgba(${c.color},${a})`;
          ctx!.beginPath();
          ctx!.arc(n.x, n.y, Math.max(0.6, 2.6 - i * 0.12), 0, Math.PI * 2);
          ctx!.fill();
        });
      });
      for (let i = comets.length - 1; i >= 0; i--) {
        if (comets[i].life <= 0) comets.splice(i, 1);
      }

      // Искры от мыши
      sparks.forEach((s) => {
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.014;
        s.life--;
        const a = Math.max(0, s.life / s.maxLife);
        ctx!.fillStyle = `rgba(${s.color},${a * 0.9})`;
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.size * a, 0, Math.PI * 2);
        ctx!.fill();
      });
      for (let i = sparks.length - 1; i >= 0; i--) {
        if (sparks[i].life <= 0) sparks.splice(i, 1);
      }

      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (!running && isLight() && !document.hidden) {
        running = true;
        // сразу несколько комет, чтобы связь была видна сразу
        if (comets.length === 0) {
          spawnComet();
          spawnComet();
        }
        raf = requestAnimationFrame(frame);
      }
    }

    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      ctx!.clearRect(0, 0, width, height);
      sparks.length = 0;
      comets.length = 0;
    }

    window.addEventListener("resize", size);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    const themeObserver = new MutationObserver(() => (isLight() ? start() : stop()));
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    size();
    start(); // важно: тема может уже быть light (из localStorage)

    return () => {
      stop();
      window.removeEventListener("resize", size);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibility);
      themeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      id="ds-sparks"
      aria-hidden="true"
      ref={ref}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
}
