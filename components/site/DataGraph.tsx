"use client";

import { useEffect, useRef } from "react";

type Kind = "core" | "frontend" | "backend" | "ai" | "integrations" | "infra";

type GNode = {
  id: Kind;
  label: string;
  x: number;
  y: number;
  r: number;
};

/** Основные узлы-«звёзды» (координаты в системе viewBox 160×90). */
const NODES: GNode[] = [
  { id: "core", label: "DS DIGITAL", x: 80, y: 45, r: 2.4 },
  { id: "frontend", label: "FRONTEND", x: 24, y: 21, r: 1.5 },
  { id: "backend", label: "BACKEND", x: 131, y: 16, r: 1.5 },
  { id: "ai", label: "AI", x: 149, y: 53, r: 1.5 },
  { id: "integrations", label: "INTEGRATIONS", x: 106, y: 80, r: 1.5 },
  { id: "infra", label: "INFRA", x: 22, y: 74, r: 1.5 },
];

/** Под-узлы — конкретные технологии/данные. */
const SUBNODES: { parent: Kind; label: string; x: number; y: number }[] = [
  { parent: "frontend", label: "Next.js", x: 9, y: 10 },
  { parent: "frontend", label: "React", x: 39, y: 8 },
  { parent: "backend", label: "Prisma", x: 147, y: 7 },
  { parent: "backend", label: "REST API", x: 153, y: 30 },
  { parent: "ai", label: "LLM", x: 140, y: 70 },
  { parent: "integrations", label: "Telegram", x: 126, y: 87 },
  { parent: "infra", label: "Docker", x: 8, y: 87 },
  { parent: "infra", label: "CI/CD", x: 40, y: 87 },
];

type GLink = { from: Kind; to: Kind; label?: string };

const LINKS: GLink[] = [
  { from: "core", to: "frontend", label: "RENDER" },
  { from: "core", to: "backend", label: "API" },
  { from: "core", to: "ai", label: "PROMPT" },
  { from: "core", to: "integrations", label: "EVENT" },
  { from: "core", to: "infra", label: "DEPLOY" },
  { from: "frontend", to: "backend", label: "FETCH" },
  { from: "backend", to: "ai", label: "CONTEXT" },
  { from: "backend", to: "integrations", label: "SYNC" },
  { from: "infra", to: "frontend", label: "BUILD" },
];

const byId = (id: Kind) => NODES.find((n) => n.id === id)!;

/**
 * Фоновый граф данных на всю страницу (ПК) — ненавязчивый, но с «wow».
 * Узлы-звёзды пульсируют, по пунктирным связям бегут пакеты данных,
 * рядом подписаны контейнеры и типы передаваемых данных.
 * На мобильных/тач и при reduced-motion скрыт (см. CSS).
 */
export function DataGraph() {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine) and (hover: hover)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    const svg = svgRef.current;
    if (!svg) return;

    const halos = Array.from(svg.querySelectorAll<SVGCircleElement>(".dg-halo"));
    const cores = Array.from(svg.querySelectorAll<SVGCircleElement>(".dg-core"));
    const phases = halos.map(() => Math.random() * Math.PI * 2);
    const speeds = halos.map(() => 0.35 + Math.random() * 0.7);

    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e?.isIntersecting ?? true));
    io.observe(document.documentElement);

    function loop() {
      raf = 0;
      if (!visible || document.hidden) return;
      const now = performance.now() / 1000;
      halos.forEach((h, i) => {
        const s = Math.abs(Math.sin(now * speeds[i] + phases[i]));
        const base = i === 0 ? 0.22 : 0.14;
        h.style.opacity = String(base + s * 0.22);
      });
      cores.forEach((c, i) => {
        const s = Math.abs(Math.sin(now * speeds[i] * 1.6 + phases[i]));
        c.style.opacity = String(0.45 + s * 0.45);
      });
      raf = requestAnimationFrame(loop);
    }

    raf = requestAnimationFrame(loop);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      className="dg-bg"
      viewBox="0 0 160 90"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="dgLine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#35d8ff" />
          <stop offset="50%" stopColor="#176bff" />
          <stop offset="100%" stopColor="#8b5cff" />
        </linearGradient>
        {/* Для светлой темы — насыщеннее, иначе линии теряются на светлом фоне */}
        <linearGradient id="dgLineLight" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0e7490" />
          <stop offset="50%" stopColor="#176bff" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>

      {/* Пунктирные связи + пакеты данных */}
      {LINKS.map((l, i) => {
        const a = byId(l.from);
        const b = byId(l.to);
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        return (
          <g key={`${l.from}-${l.to}`}>
            <line className="dg-link" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
            <circle className="dg-packet" r="0.45">
              <animateMotion
                dur={`${5 + (i % 4) * 1.4}s`}
                begin={`${(i * 0.6).toFixed(1)}s`}
                repeatCount="indefinite"
                path={`M ${a.x} ${a.y} L ${b.x} ${b.y}`}
              />
            </circle>
            {l.label ? (
              <text className="dg-link-label" x={mx} y={my - 0.8} textAnchor="middle">
                {l.label}
              </text>
            ) : null}
          </g>
        );
      })}

      {/* Под-узлы технологий */}
      {SUBNODES.map((s) => {
        const p = byId(s.parent);
        return (
          <g key={s.label}>
            <line className="dg-sub-link" x1={p.x} y1={p.y} x2={s.x} y2={s.y} />
            <circle className={`dg-sub-dot dg-${s.parent}`} cx={s.x} cy={s.y} r="0.5" />
            <text className="dg-sub-label" x={s.x} y={s.y - 1.1} textAnchor="middle">
              {s.label}
            </text>
          </g>
        );
      })}

      {/* Узлы-звёзды: ореол + ядро + подпись */}
      {NODES.map((n) => (
        <g key={n.id} className={`dg-node dg-${n.id}`}>
          <circle
            className={`dg-halo dg-${n.id}`}
            cx={n.x}
            cy={n.y}
            r={n.r * (n.id === "core" ? 2.5 : 3.2)}
          />
          <circle className={`dg-core dg-${n.id}`} cx={n.x} cy={n.y} r={n.r} />
          <text
            className="dg-label"
            x={n.x}
            y={n.y + n.r * 2.9}
            textAnchor="middle"
          >
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
