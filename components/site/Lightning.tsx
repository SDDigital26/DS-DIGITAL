"use client";

import { useEffect, useRef } from "react";

type Point = { x: number; y: number };
type Bolt = { points: Point[]; life: number; violet: number };

/**
 * Молния за курсором из прототипа: толстая цветная линия + тонкая белая,
 * случайные ответвления, автоупрощение при медленных кадрах.
 * Только desktop; на тач-устройствах — короткие импульсы по касанию.
 */
export function Lightning({ mode = "full" }: { mode?: "full" | "lite" | "static" }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Static: эффекты выключены в настройках кабинета (ТЗ §7.4).
    if (mode === "static") return;
    const canvasEl = ref.current;
    if (!canvasEl) return;
    const context = canvasEl.getContext("2d");
    if (!context) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas: HTMLCanvasElement = canvasEl;
    const ctx: CanvasRenderingContext2D = context;
    const touch = window.matchMedia("(pointer: coarse)").matches;

    let width = 0;
    let height = 0;
    const bolts: Bolt[] = [];
    let last: Point | null = null;
    let running = false;
    let slow = 0;
    let frame = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function addBolt(a: Point, b: Point, power: number) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const length = Math.hypot(dx, dy) || 1;
      const segments = Math.max(4, Math.min(16, Math.round(length / 14)));
      const nx = -dy / length;
      const ny = dx / length;
      const points: Point[] = [{ x: a.x, y: a.y }];

      for (let i = 1; i < segments; i++) {
        const t = i / segments;
        const offset = (Math.random() - 0.5) * (14 + power * 26);
        points.push({ x: a.x + dx * t + nx * offset, y: a.y + dy * t + ny * offset });
      }
      points.push({ x: b.x, y: b.y });
      bolts.push({ points, life: 1, violet: Math.random() < 0.5 ? 0 : 1 });

      if (Math.random() < 0.35 + power * 0.3) {
        const middle = points[Math.floor(segments / 2)];
        const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 2.2;
        const branchLength = 18 + Math.random() * 50 * (1 + power);
        bolts.push({
          points: [
            middle,
            {
              x: middle.x + Math.cos(angle) * branchLength * 0.5 + (Math.random() - 0.5) * 10,
              y: middle.y + Math.sin(angle) * branchLength * 0.5 + (Math.random() - 0.5) * 10,
            },
            {
              x: middle.x + Math.cos(angle) * branchLength,
              y: middle.y + Math.sin(angle) * branchLength,
            },
          ],
          life: 0.8,
          violet: 1,
        });
      }

      if (bolts.length > 26) bolts.splice(0, bolts.length - 26);
      if (!running) {
        running = true;
        frame = requestAnimationFrame(draw);
      }
    }

    function draw() {
      const started = performance.now();
      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (let i = bolts.length - 1; i >= 0; i--) {
        const bolt = bolts[i];
        bolt.life -= 0.075;
        if (bolt.life <= 0) {
          bolts.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.moveTo(bolt.points[0].x, bolt.points[0].y);
        for (let k = 1; k < bolt.points.length; k++) {
          ctx.lineTo(bolt.points[k].x, bolt.points[k].y);
        }

        ctx.globalAlpha = bolt.life;
        ctx.strokeStyle = bolt.violet ? "#8B5CFF" : "#176BFF";
        ctx.lineWidth = 5;
        if (!slow) {
          ctx.shadowBlur = 22;
          ctx.shadowColor = bolt.violet ? "#8B5CFF" : "#35D8FF";
        }
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#bfeaff";
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      if (performance.now() - started > 9) slow = 1;
      if (bolts.length) frame = requestAnimationFrame(draw);
      else running = false;
    }

    function onPointerMove(event: PointerEvent) {
      const point = { x: event.clientX, y: event.clientY };
      if (last) {
        const distance = Math.hypot(point.x - last.x, point.y - last.y);
        if (distance > 10) {
          addBolt(last, point, Math.min(distance / 60, 1));
          last = point;
        }
      } else {
        last = point;
      }
    }

    function onPointerLeave() {
      last = null;
    }

    function onPointerDown(event: PointerEvent) {
      for (let i = 0; i < 3; i++) {
        const angle = Math.random() * 6.28;
        const radius = 28 + Math.random() * 26;
        addBolt(
          { x: event.clientX, y: event.clientY },
          {
            x: event.clientX + Math.cos(angle) * radius,
            y: event.clientY + Math.sin(angle) * radius,
          },
          0.3,
        );
      }
    }

    resize();
    window.addEventListener("resize", resize);

    // Пауза, когда вкладка неактивна (ТЗ п.3) — не держим rAF в фоне.
    document.addEventListener("visibilitychange", onVisibility);
    function onVisibility() {
      if (document.hidden && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
        running = false;
      }
    }

    if (!touch) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.addEventListener("pointerleave", onPointerLeave);
    } else {
      window.addEventListener("pointerdown", onPointerDown, { passive: true });
    }

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [mode]);

  return <canvas id="ds-fx" ref={ref} aria-hidden="true" />;
}
