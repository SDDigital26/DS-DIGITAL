"use client";

import { useEffect } from "react";
import { GHOST_SNIPPETS } from "@/lib/content/site";

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlight(value: string) {
  const s = escapeHtml(value);
  if (s.indexOf("//") === 0) return `<i class="c">${s}</i>`;
  if (s.charAt(0) === "$") return `<i class="p">$</i>${s.slice(1)}`;
  if (s.indexOf("✓") === 0) return `<i class="o">${s}</i>`;
  if (s.indexOf("&gt;") === 0) return `<i class="d">${s}</i>`;
  return s
    .replace(/"[^"]*"/g, '<i class="s">$&</i>')
    .replace(/(const|await|async|return|SELECT|FROM|WHERE)(?=[ (])/g, '<i class="k">$1</i>');
}

type Ghost = {
  el: HTMLElement;
  text: string;
  n: number;
  phase: "type" | "hold" | "exit";
  hold: number;
  ex: number;
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
  kind: "fade" | "erase" | "glitch";
  scrollY: number;
};

/**
 * Декоративные «призраки» кода на фоне — как в прототипе.
 * Ничего не сохраняют и не отправляют, aria-hidden, отключаются при
 * reduced-motion и на слабых устройствах.
 */
export function GhostCode() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const main = document.getElementById("main");
    if (!main) return;

    const host = document.createElement("div");
    host.className = "ghosts";
    host.setAttribute("aria-hidden", "true");
    main.insertBefore(host, main.firstChild);

    const NL = String.fromCharCode(10);
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const low =
      (nav.hardwareConcurrency || 8) <= 4 ||
      (nav.deviceMemory || 8) <= 2 ||
      Boolean(nav.connection?.saveData);
    // На тач/слабых устройствах не гоняем DOM-анимацию — заметно тормозит прокрутку.
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (low || !fine) return;
    const MAX = 2;
    const kinds = ["fade", "erase", "glitch"] as const;
    const ghosts: Ghost[] = [];
    let nextSpawn = Date.now() + 700;

    function okElement(element: Element | null) {
      if (!element) return false;
      // Призраки живут под контентом (z-index:-1), поэтому достаточно,
      // чтобы точка попадала в блок-контейнер, а не в сам текст/кнопку.
      return ["BODY", "MAIN", "SECTION", "HTML", "DIV", "PRE"].includes(element.tagName);
    }

    function render(ghost: Ghost) {
      ghost.el.innerHTML =
        ghost.text
          .slice(0, ghost.n)
          .split(NL)
          .map(highlight)
          .join("<br>") + (ghost.phase === "type" ? '<b class="cr"></b>' : "");
    }

    function kill(index: number) {
      const ghost = ghosts[index];
      if (ghost?.el.parentNode) ghost.el.parentNode.removeChild(ghost.el);
      ghosts.splice(index, 1);
    }

    function spawn() {
      if (ghosts.length >= MAX || document.hidden) return;
      const snippet = GHOST_SNIPPETS[Math.floor(Math.random() * GHOST_SNIPPETS.length)];
      const el = document.createElement("pre");
      el.className = "gh";
      el.style.visibility = "hidden";
      el.innerHTML = snippet.map(highlight).join("<br>");
      host.appendChild(el);

      const width = el.offsetWidth;
      const height = el.offsetHeight;
      const W = window.innerWidth;
      const H = window.innerHeight;
      if (width > W - 16 || height > H - 120) {
        host.removeChild(el);
        return;
      }
      el.style.width = `${width}px`;
      el.style.height = `${height}px`;

      const hostRect = host.getBoundingClientRect();
      const points = [
        [0, 0],
        [width, 0],
        [0, height],
        [width, height],
        [width / 2, height / 2],
        [width / 2, 0],
        [width / 2, height],
        [0, height / 2],
        [width, height / 2],
      ];
      let x = 0;
      let y = 0;
      let ok = false;

      for (let attempt = 0; attempt < 10 && !ok; attempt++) {
        x = 8 + Math.random() * (W - width - 16);
        y = 84 + Math.random() * (H - height - 100);
        let good = true;
        // Не закрываем центральную колонку с заголовком и кнопками hero.
        const cx0 = W * 0.33;
        const cx1 = W * 0.67;
        if (y < H * 0.9 && x + width > cx0 && x < cx1) good = false;
        for (let p = 0; p < points.length && good; p++) {
          good = okElement(document.elementFromPoint(x + points[p][0], y + points[p][1]));
        }
        for (let i = 0; i < ghosts.length && good; i++) {
          const other = ghosts[i];
          if (
            !(
              x - hostRect.left + width + 14 < other.x ||
              x - hostRect.left > other.x + other.w + 14 ||
              y - hostRect.top + height + 14 < other.y ||
              y - hostRect.top > other.y + other.h + 14
            )
          ) {
            good = false;
          }
        }
        ok = good;
      }

      if (!ok) {
        host.removeChild(el);
        return;
      }

      const left = x - hostRect.left;
      const top = y - hostRect.top;
      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
      el.style.visibility = "";

      const ghost: Ghost = {
        el,
        text: snippet.join(NL),
        n: 0,
        phase: "type",
        hold: 0,
        ex: 0,
        x: left,
        y: top,
        w: width,
        h: height,
        speed: 2 + Math.floor(Math.random() * 3),
        kind: kinds[Math.floor(Math.random() * kinds.length)],
        scrollY: window.scrollY,
      };
      ghosts.push(ghost);
      requestAnimationFrame(() => el.classList.add("on"));
      render(ghost);
    }

    function tick() {
      if (document.hidden) return;
      const now = Date.now();
      if (ghosts.length < MAX && now > nextSpawn) {
        spawn();
        nextSpawn = now + (low ? 4200 : 1800) + Math.random() * 2400;
      }

      for (let i = ghosts.length - 1; i >= 0; i--) {
        const ghost = ghosts[i];
        if (ghost.phase !== "exit" && Math.abs(window.scrollY - ghost.scrollY) > 160) {
          ghost.kind = "fade";
          ghost.phase = "hold";
          ghost.hold = 0;
        }

        if (ghost.phase === "type") {
          ghost.n = Math.min(ghost.text.length, ghost.n + ghost.speed);
          if (ghost.n >= ghost.text.length) {
            ghost.phase = "hold";
            ghost.hold = Math.round((1600 + Math.random() * 1800) / 70);
          }
          render(ghost);
        } else if (ghost.phase === "hold") {
          if (--ghost.hold <= 0) {
            ghost.phase = "exit";
            ghost.ex = 0;
            if (ghost.kind === "glitch") ghost.el.classList.add("gl");
            else if (ghost.kind === "fade") ghost.el.classList.remove("on");
          }
        } else if (ghost.kind === "erase") {
          ghost.n = Math.max(0, ghost.n - 7);
          render(ghost);
          if (ghost.n <= 0) kill(i);
        } else if (++ghost.ex > 9) {
          kill(i);
        }
      }
    }

    // Пауза, когда основная область не видна (ТЗ п.3 производительность).
    let visible = true;
    const visibility = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? true;
      },
      { threshold: 0 },
    );
    visibility.observe(main);

    // 110 мс вместо 70 — меньше перерисовок DOM, плавнее прокрутка.
    const timer = window.setInterval(() => {
      if (visible) tick();
    }, 110);

    return () => {
      window.clearInterval(timer);
      visibility.disconnect();
      host.remove();
    };
  }, []);

  return null;
}
