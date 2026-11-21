"use client";

import { useEffect, useRef, useState } from "react";

type NodeKind = "core" | "frontend" | "backend" | "ai" | "integrations" | "infra";

type GNode = {
  id: string;
  label: string;
  detail: string;
  kind: NodeKind;
  x: number; // 0..100 (%)
  y: number; // 0..100 (%)
  r: number; // радиус в px
};

type GLink = { from: string; to: string; label?: string };

type ThemeText = Record<NodeKind, { name: string; note: string }>;

const TEXT: Record<"ru" | "en", ThemeText> = {
  ru: {
    core: { name: "DS DIGITAL", note: "Продукт" },
    frontend: { name: "Frontend", note: "Next.js · React · TypeScript · Tailwind CSS" },
    backend: { name: "Backend", note: "Node.js · PostgreSQL · Prisma · REST API" },
    ai: { name: "AI", note: "Пошаговые AI-сценарии · LLM-провайдер" },
    integrations: { name: "Интеграции", note: "Telegram Bot API · Email · внешние API" },
    infra: { name: "Infra", note: "Docker · GitHub Actions · PostgreSQL" },
  },
  en: {
    core: { name: "DS DIGITAL", note: "Product" },
    frontend: { name: "Frontend", note: "Next.js · React · TypeScript · Tailwind CSS" },
    backend: { name: "Backend", note: "Node.js · PostgreSQL · Prisma · REST API" },
    ai: { name: "AI", note: "Step-by-step AI flows · LLM provider" },
    integrations: { name: "Integrations", note: "Telegram Bot API · Email · external APIs" },
    infra: { name: "Infra", note: "Docker · GitHub Actions · PostgreSQL" },
  },
};

const KINDS: NodeKind[] = ["frontend", "backend", "ai", "integrations", "infra"];

/** Раскладка: центр + 5 узлов по кругу. */
const NODES: GNode[] = [
  { id: "core", label: "core", detail: "", kind: "core", x: 50, y: 50, r: 34 },
  { id: "frontend", label: "frontend", detail: "", kind: "frontend", x: 20, y: 26, r: 24 },
  { id: "backend", label: "backend", detail: "", kind: "backend", x: 78, y: 20, r: 24 },
  { id: "ai", label: "ai", detail: "", kind: "ai", x: 86, y: 62, r: 24 },
  { id: "integrations", label: "integrations", detail: "", kind: "integrations", x: 60, y: 86, r: 24 },
  { id: "infra", label: "infra", detail: "", kind: "infra", x: 16, y: 72, r: 24 },
];

// Под-узлы «данные» вокруг каждой группы — как на референсе Code Visual.
const SUBNODES: { id: string; parent: NodeKind; label: string; x: number; y: number }[] = [
  { id: "s1", parent: "frontend", label: "Next.js", x: 7, y: 10 },
  { id: "s2", parent: "frontend", label: "React", x: 34, y: 8 },
  { id: "s3", parent: "backend", label: "Prisma", x: 92, y: 8 },
  { id: "s4", parent: "backend", label: "REST API", x: 90, y: 34 },
  { id: "s5", parent: "ai", label: "LLM", x: 95, y: 82 },
  { id: "s6", parent: "integrations", label: "Telegram", x: 76, y: 95 },
  { id: "s7", parent: "infra", label: "Docker", x: 5, y: 90 },
  { id: "s8", parent: "infra", label: "CI/CD", x: 26, y: 94 },
];

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

/**
 * Интерактивный граф данных (в стиле Code Visual): узлы-контейнеры соединены
 * пунктиром, по связям идут «пакеты данных», узел мигает и показывает,
 * какие данные он держит. Работает в обеих темах, адаптивен.
 */
export function DataGraph({ locale }: { locale: "ru" | "en" }) {
  const t = TEXT[locale];
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [active, setActive] = useState<NodeKind | null>(null);
  const [packet, setPacket] = useState(0);

  // Движущиеся «пакеты данных» по линиям — просто сдвиг dash-анимации через CSS.
  // Дополнительно меняем активный узел, чтобы подсветка «перетекала».
  useEffect(() => {
    const id = window.setInterval(() => {
      setPacket((p) => (p + 1) % KINDS.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, []);

  const nodeById = (id: string) => NODES.find((n) => n.id === id)!;

  return (
    <div className="dg-wrap" aria-label={locale === "ru" ? "Граф данных стека" : "Stack data graph"}>
      <svg
        ref={svgRef}
        className="dg-svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="dgLine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--cyan)" />
            <stop offset="50%" stopColor="var(--blue)" />
            <stop offset="100%" stopColor="var(--violet)" />
          </linearGradient>
        </defs>

        {/* Пунктирные связи */}
        {LINKS.map((l, i) => {
          const a = nodeById(l.from);
          const b = nodeById(l.to);
          return (
            <g key={`${l.from}-${l.to}-${i}`}>
              <line
                className="dg-link"
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                style={{ animationDelay: `${i * 0.3}s` }}
              />
              <circle className="dg-packet" r="1.1" style={{ animationDelay: `${i * 0.7}s` }}>
                <animateMotion dur={`${3 + (i % 3)}s`} repeatCount="indefinite" path={`M ${a.x} ${a.y} L ${b.x} ${b.y}`} />
              </circle>
            </g>
          );
        })}

        {/* Под-узлы — «данные» */}
        {SUBNODES.map((s) => {
          const parent = NODES.find((n) => n.kind === s.parent)!;
          return (
            <g key={s.id} className={`dg-sub dg-sub-${s.parent}`}>
              <line x1={parent.x} y1={parent.y} x2={s.x} y2={s.y} className="dg-link dg-sub-link" />
              <circle cx={s.x} cy={s.y} r="2.6" className={`dg-dot dg-${s.parent}`} />
              <text x={s.x} y={s.y - 4.5} className="dg-sub-label" textAnchor="middle">
                {s.label}
              </text>
            </g>
          );
        })}

        {/* Основные узлы-контейнеры */}
        {NODES.map((n) => (
          <g key={n.id} className={`dg-node dg-node-${n.kind} ${active === n.kind ? "is-active" : ""}`} onMouseEnter={() => setActive(n.kind)} onMouseLeave={() => setActive(null)}>
            {/* ping-кольцо «мигания» */}
            <circle cx={n.x} cy={n.y} r={n.r / 4} className={`dg-halo dg-${n.kind}`} />
            <circle cx={n.x} cy={n.y} r={n.r / 6} className={`dg-center dg-${n.kind}`} />
            <text x={n.x} y={n.y + n.r / 4 + 4.5} className="dg-label" textAnchor="middle">
              {t[n.kind].name}
            </text>
          </g>
        ))}
      </svg>

      {/* Легенда / карточка активного узла */}
      <div className="dg-readout" role="status">
        {(active ?? KINDS[packet])
          ? (() => {
              const k = active ?? KINDS[packet];
              return (
                <>
                  <span className={`dg-badge dg-${k}`} />
                  <strong>{t[k].name}</strong>
                  <span className="dg-note">{t[k].note}</span>
                </>
              );
            })()
          : null}
      </div>
    </div>
  );
}
