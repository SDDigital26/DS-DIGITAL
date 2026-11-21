"use client";

import { useEffect, useRef } from "react";

type Ring = { r: number; a: number; b: number; s: number; al: number };
type Pt = { x: number; y: number; z: number; c: string; s: number };

/**
 * 3D-орбита из прототипа: 5 вращающихся колец + до 90 звёзд на canvas.
 * Пауза вне вьюпорта, упрощение на слабых устройствах, наклон за курсором.
 */
export function OrbitCanvas() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const g = cv.getContext("2d");
    if (!g) return;

    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const weak =
      (mem && mem <= 2) ||
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);
    const lite = rm || Boolean(weak);
    const fine = window.matchMedia("(pointer: fine) and (hover: hover)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    let w = 0;
    let hh = 0;
    let tx = 0;
    let ty = 0;
    let q = 2;
    let vis = true;
    let raf = 0;
    let slow = 0;
    let last = 0;
    const t0 = performance.now();

    const rings: Ring[] = [
      { r: 1, a: 0.9, b: 0.2, s: 0.11, al: 0.95 },
      { r: 0.86, a: 1.25, b: -0.5, s: -0.15, al: 0.7 },
      { r: 0.7, a: 0.5, b: 0.9, s: 0.2, al: 0.6 },
      { r: 0.52, a: 1.5, b: 0.3, s: -0.26, al: 0.5 },
      { r: 1.12, a: 0.2, b: 1.2, s: 0.07, al: 0.35 },
    ];

    const pts: Pt[] = Array.from({ length: lite ? 24 : fine ? 90 : 36 }, (_, i) => {
      const u = Math.acos(2 * Math.random() - 1);
      const v = Math.random() * 6.283;
      const rr = 0.55 + Math.random() * 0.75;
      return {
        x: rr * Math.sin(u) * Math.cos(v),
        y: rr * Math.sin(u) * Math.sin(v),
        z: rr * Math.cos(u),
        c: i % 3 ? "53,216,255" : "139,92,255",
        s: 0.6 + Math.random() * 1.4,
      };
    });

    function size() {
      const r = cv!.getBoundingClientRect();
      w = r.width;
      hh = r.height;
      cv!.width = Math.round(w * dpr);
      cv!.height = Math.round(hh * dpr);
      g!.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(performance.now());
    }

    function rot(p: number[], ax: number, ay: number) {
      const y = p[1] * Math.cos(ax) - p[2] * Math.sin(ax);
      const z = p[1] * Math.sin(ax) + p[2] * Math.cos(ax);
      const x = p[0] * Math.cos(ay) + z * Math.sin(ay);
      const z2 = -p[0] * Math.sin(ay) + z * Math.cos(ay);
      return [x, y, z2];
    }

    function draw(now: number) {
      const t = (now - t0) / 1000;
      const R = Math.min(w, hh) * 0.46;
      const cx = w / 2;
      const cy = hh / 2;
      const light = document.documentElement.dataset.theme === "light";
      g!.clearRect(0, 0, w, hh);
      // На светлом фоне аддитивная смесь «съедается» — рисуем обычной заливкой.
      g!.globalCompositeOperation = light ? "source-over" : "lighter";
      g!.lineCap = "round";

      const gr = g!.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
      if (light) {
        gr.addColorStop(0, "rgba(14,116,144,0.9)");
        gr.addColorStop(0.5, "rgba(23,107,255,0.8)");
        gr.addColorStop(1, "rgba(124,58,237,0.8)");
      } else {
        gr.addColorStop(0, "rgba(53,216,255,1)");
        gr.addColorStop(0.5, "rgba(23,107,255,1)");
        gr.addColorStop(1, "rgba(139,92,255,1)");
      }

      const proj = (p: number[], ax: number, ay: number) => {
        const o = rot(p, ax, ay);
        const f = 2.4 / (2.4 + o[2] * 0.55);
        return [cx + o[0] * R * f, cy + o[1] * R * f, o[2]];
      };

      rings.forEach((rg, i) => {
        const ax = rg.a + ty * 0.35 + (lite ? 0 : t * rg.s * 0.5);
        const ay = rg.b + tx * 0.5 + (lite ? 0 : t * rg.s);
        const n = q ? 110 : 60;
        g!.beginPath();
        for (let k = 0; k <= n; k++) {
          const th = (k / n) * 6.2832;
          const p = proj([rg.r * Math.cos(th), rg.r * Math.sin(th), 0], ax, ay);
          if (k) g!.lineTo(p[0], p[1]);
          else g!.moveTo(p[0], p[1]);
        }
        g!.strokeStyle = gr;
        if (q > 1) {
          g!.globalAlpha = (light ? 0.07 : 0.16) * rg.al;
          g!.lineWidth = 16;
          g!.stroke();
        }
        g!.globalAlpha = (light ? 0.62 : 1) * rg.al;
        g!.lineWidth = i === 0 ? 2.6 : 1.6;
        g!.stroke();
      });

      const ax = ty * 0.35 + t * 0.05;
      const ay = tx * 0.5 + t * 0.08;
      pts.forEach((p) => {
        const o = proj([p.x, p.y, p.z], ax, ay);
        const d = (o[2] + 1.4) / 2.8;
        g!.globalAlpha = Math.max(0.1, Math.min(1, 0.2 + d * 0.9)) * (light ? 0.75 : 1);
        g!.fillStyle = light ? "rgb(30,80,180)" : "rgb(" + p.c + ")";
        g!.beginPath();
        g!.arc(o[0], o[1], p.s, 0, 6.2832);
        g!.fill();
      });

      g!.globalAlpha = 1;
      g!.globalCompositeOperation = "source-over";
    }

    function loop(now: number) {
      raf = 0;
      if (!vis || document.hidden) return;
      if (last) {
        const d = now - last;
        slow = d > 26 ? slow + 1 : Math.max(0, slow - 1);
        if (slow > 40) {
          if (q > 0) {
            q--;
            slow = 0;
          } else {
            draw(now);
            return;
          }
        }
      }
      last = now;
      draw(now);
      raf = requestAnimationFrame(loop);
    }

    function start() {
      if (!raf && !lite && vis) {
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    }

    function onPointerMove(e: PointerEvent) {
      if (!fine || lite) return;
      tx += ((e.clientX / window.innerWidth - 0.5) * 2 - tx) * 0.12;
      ty += ((e.clientY / window.innerHeight - 0.5) * 2 - ty) * 0.12;
    }

    function onVisibility() {
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      } else start();
    }

    window.addEventListener("resize", size);
    size();
    if (fine && !lite) window.addEventListener("pointermove", onPointerMove, { passive: true });
    const io = new IntersectionObserver((es) => {
      vis = es[0]?.isIntersecting ?? true;
      if (vis) start();
      else {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    if (cv.parentElement) io.observe(cv.parentElement);
    document.addEventListener("visibilitychange", onVisibility);

    // При смене темы перерисовываем орбиту (особенно важно при отключённой анимации).
    const themeObserver = new MutationObserver(() => draw(performance.now()));
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    start();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibility);
      io.disconnect();
      themeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      id="orbit"
      aria-hidden="true"
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: "min(1100px, 100vw)",
        height: "min(780px, 115vw)",
        transform: "translate(-50%, -50%)",
        zIndex: 0,
        maxWidth: "none",
        pointerEvents: "none",
      }}
    />
  );
}