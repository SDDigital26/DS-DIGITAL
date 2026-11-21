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
 * Светлая тема вместо молнии: искры от движения мыши и «кометы данных» —
 * лёгкие 3D-подобные частицы, создающие ощущение потока данных на сайте.
 * На тёмной теме компонент сам отключается (там работает молния).
 */
export function CursorSparks() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;

    // Работаем только в светлой теме и только при точном указателе.
    const isLight = () => document.documentElement.dataset.theme === "light";
    if (!isLight() || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const fine = window.matchMedia("(pointer: fine) and (hover: hover)").matches;
    if (!fine) return;

    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let width = 0;
    let height = 0;
    let raf = 0;
    let lastMouse = { x: -100, y: -100, t: 0 };
    const sparks: Spark[] = [];
    const comets: Comet[] = [];
    const colors = ["23,107,255", "139,92,255", "53,216,255"];

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
        const speed = 0.4 + Math.random() * 1.4;
        const maxLife = 26 + Math.random() * 24;
        sparks.push({
          x,
          y,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed - 0.3,
          life: maxLife,
          maxLife,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 0.8 + Math.random() * 1.6,
        });
      }
    }

    function spawnComet() {
      const fromLeft = Math.random() > 0.5;
      const x = fromLeft ? -30 : width + 30;
      const y = Math.random() * height * 0.7;
      const vx = (fromLeft ? 1 : -1) * (0.6 + Math.random() * 0.9);
      const vy = (Math.random() - 0.3) * 0.5;
      const maxLife = 220 + Math.random() * 160;
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
      if (e.pointerType === "touch") return;
      const now = performance.now();
      const dx = e.clientX - lastMouse.x;
      const dy = e.clientY - lastMouse.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 6 && now - lastMouse.t > 16) {
        spawnSparks(e.clientX, e.clientY, Math.min(4, Math.ceil(dist / 14)));
        lastMouse = { x: e.clientX, y: e.clientY, t: now };
      }
    }

    function frame() {
      raf = 0;
      if (!isLight()) return; // тема переключена на тёмную — останавливаемся
      if (document.hidden) return;

      ctx!.clearRect(0, 0, width, height);
      ctx!.globalCompositeOperation = "source-over";

      // Кометы данных — появляются время от времени
      if (Math.random() < 0.004 && comets.length < 3) spawnComet();

      comets.forEach((c) => {
        c.x += c.vx;
        c.y += c.vy;
        c.life--;
        c.nodes.unshift({ x: c.x, y: c.y });
        if (c.nodes.length > 14) c.nodes.pop();
        const t = c.life / c.maxLife;
        const alpha = Math.sin(Math.min(1, t) * Math.PI) * 0.55;
        // Связка между узлами — «граф данных»
        ctx!.strokeStyle = `rgba(${c.color},${alpha * 0.5})`;
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        c.nodes.forEach((n, i) => (i ? ctx!.lineTo(n.x, n.y) : ctx!.moveTo(n.x, n.y)));
        ctx!.stroke();
        c.nodes.forEach((n, i) => {
          const a = alpha * (1 - i / c.nodes.length);
          ctx!.fillStyle = `rgba(${c.color},${a})`;
          ctx!.beginPath();
          ctx!.arc(n.x, n.y, Math.max(0.5, 2 - i * 0.1), 0, Math.PI * 2);
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
        s.vy += 0.012;
        s.life--;
        const a = Math.max(0, s.life / s.maxLife);
        ctx!.fillStyle = `rgba(${s.color},${a * 0.85})`;
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
      if (!raf && isLight() && !document.hidden) {
        raf = requestAnimationFrame(frame);
      }
    }

    window.addEventListener("resize", size);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    const onVisibility = () => (document.hidden ? (raf && cancelAnimationFrame(raf), (raf = 0)) : start());
    document.addEventListener("visibilitychange", onVisibility);
    const themeObserver = new MutationObserver(() => (isLight() ? start() : (raf && cancelAnimationFrame(raf), (raf = 0))));
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    size();
    start();

    return () => {
      if (raf) cancelAnimationFrame(raf);
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
