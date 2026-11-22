"use client";

import { useEffect, useRef } from "react";

type Ring = { r: number; a: number; b: number; s: number; al: number };
type Pt = { x: number; y: number; z: number; c: string; s: number };

/** Названия «контейнеров» — звезда мигает и показывает, что держит. */
const NODE_LABELS = [
  "FRONTEND",
  "API",
  "DATABASE",
  "AI",
  "CACHE",
  "QUEUE",
  "STORAGE",
  "AUTH",
  "WORKER",
  "CDN",
];

/** Связи между узлами-звёздами (индексы в NODE_LABELS). */
const LINK_PAIRS: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [8, 9],
  [9, 0],
  [0, 4],
  [2, 6],
  [3, 8],
  [5, 9],
  [1, 7],
];

/**
 * 3D-орбита из прототипа: 5 вращающихся колец + до 90 звёзд.
 * Часть звёзд образует граф данных: пунктирные связи, летящие пакеты,
 * мигающая звезда с названием контейнера. Пауза вне вьюпорта, наклон за курсором.
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
    // Канвас — мягкий фон, 1.25 DPR достаточно и втрое дешевле, чем 1.5–2.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);

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

    const count = lite ? 24 : fine ? 72 : 36;
    const pts: Pt[] = Array.from({ length: count }, (_, i) => {
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

    // Узлы графа — равномерно выбранные звёзды.
    const nodeIdx = NODE_LABELS.map((_, k) =>
      Math.floor(((k + 0.5) * pts.length) / NODE_LABELS.length),
    );

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
        const n = q ? 84 : 48;
        g!.beginPath();
        for (let k = 0; k <= n; k++) {
          const th = (k / n) * 6.2832;
          const p = proj([rg.r * Math.cos(th), rg.r * Math.sin(th), 0], ax, ay);
          if (k) g!.lineTo(p[0], p[1]);
          else g!.moveTo(p[0], p[1]);
        }
        g!.strokeStyle = gr;
        if (q > 1) {
          g!.globalAlpha = (light ? 0.09 : 0.2) * rg.al;
          g!.lineWidth = 11;
          g!.stroke();
        }
        g!.globalAlpha = (light ? 0.62 : 1) * rg.al;
        g!.lineWidth = i === 0 ? 2.6 : 1.6;
        g!.stroke();
      });

      // Та же ротация, что у звёзд.
      const ax = ty * 0.35 + t * 0.05;
      const ay = tx * 0.5 + t * 0.08;

      // Проекции узлов-звёзд.
      const np = nodeIdx.map((i) => proj([pts[i].x, pts[i].y, pts[i].z], ax, ay));

      // --- Связи графа: пунктир, «бегущий» по направлению потока данных ---
      g!.setLineDash([4, 7]);
      g!.lineDashOffset = -((t * 12) % 11);
      g!.lineWidth = 1;
      LINK_PAIRS.forEach(([a, b]) => {
        const A = np[a];
        const B = np[b];
        const depth = Math.max(0, Math.min(1, ((A[2] + B[2]) / 2 + 1.2) / 2.4));
        g!.strokeStyle = light
          ? `rgba(23,107,255,${0.1 + depth * 0.2})`
          : `rgba(53,216,255,${0.08 + depth * 0.18})`;
        g!.beginPath();
        g!.moveTo(A[0], A[1]);
        g!.lineTo(B[0], B[1]);
        g!.stroke();
      });
      g!.setLineDash([]);

      // --- Пакеты данных, летящие по связям ---
      LINK_PAIRS.forEach(([a, b], li) => {
        const A = np[a];
        const B = np[b];
        const p = (t * 0.2 + li * 0.11) % 1;
        const x = A[0] + (B[0] - A[0]) * p;
        const y = A[1] + (B[1] - A[1]) * p;
        const z = A[2] + (B[2] - A[2]) * p;
        const d = Math.max(0, Math.min(1, (z + 1.2) / 2.4));
        g!.fillStyle = light
          ? `rgba(23,107,255,${0.35 + d * 0.45})`
          : `rgba(130,240,255,${0.3 + d * 0.55})`;
        g!.beginPath();
        g!.arc(x, y, 1.3 + d * 1.3, 0, 6.2832);
        g!.fill();
      });

      // --- Звёзды ---
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

      // --- Узлы графа: мигающая звезда + название контейнера ---
      const active = Math.floor(t / 2.4) % NODE_LABELS.length;
      const prev = (active + NODE_LABELS.length - 1) % NODE_LABELS.length;
      const next = (active + 1) % NODE_LABELS.length;
      const frac = (t % 2.4) / 2.4;
      np.forEach((P, k) => {
        const d = Math.max(0, Math.min(1, (P[2] + 1.2) / 2.4));
        const isActive = k === active;
        const isNear = k === prev || k === next;
        const blink = 0.5 + 0.5 * Math.sin(t * 3 + k);
        const size = isActive ? 2.4 + blink * 1.4 : 2;

        // Ядро узла
        g!.fillStyle = light
          ? `rgba(23,107,255,${0.4 + d * 0.5})`
          : `rgba(150,240,255,${0.35 + d * 0.55})`;
        g!.beginPath();
        g!.arc(P[0], P[1], size, 0, 6.2832);
        g!.fill();

        // Пульс активного узла
        if (isActive) {
          g!.strokeStyle = light
            ? `rgba(23,107,255,${(1 - frac) * 0.5})`
            : `rgba(53,216,255,${(1 - frac) * 0.55})`;
          g!.lineWidth = 1.1;
          g!.beginPath();
          g!.arc(P[0], P[1], 5 + frac * 18, 0, 6.2832);
          g!.stroke();
        }

        // Подпись: активная ярко, соседние — приглушённо, остальные не шумят.
        const alpha = isActive ? 0.62 + blink * 0.32 : isNear ? 0.2 : 0;
        if (alpha > 0.02) {
          g!.font = `700 ${isActive ? 11 : 9.5}px ui-monospace, Menlo, Consolas, monospace`;
          g!.textAlign = "center";
          g!.textBaseline = "bottom";
          g!.fillStyle = light
            ? `rgba(13,20,36,${alpha})`
            : `rgba(226,242,255,${alpha})`;
          g!.fillText(NODE_LABELS[k], P[0], P[1] - 8);
        }
      });

      g!.globalCompositeOperation = "source-over";
    }

    function loop(now: number) {
      raf = 0;
      if (!vis || document.hidden) return;
      // ~30 кадров/с: фону этого достаточно, а нагрузка вдвое ниже.
      if (now - last >= 30) {
        if (last) {
          const d = now - last;
          if (d > 48) slow += 1;
          else slow = Math.max(0, slow - 1);
          // Замедление — повод упростить картинку, но НЕ останавливать анимацию.
          if (slow > 60 && q > 0) {
            q -= 1;
            slow = 0;
          }
        }
        last = now;
        draw(now);
      }
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
        width: "min(1000px, 96vw)",
        height: "min(720px, 105vw)",
        transform: "translate(-50%, -50%)",
        zIndex: 0,
        maxWidth: "none",
        pointerEvents: "none",
      }}
    />
  );
}
