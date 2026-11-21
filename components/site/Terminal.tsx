"use client";

import { useEffect, useRef, useState } from "react";
import { TERMINAL_LINES } from "@/lib/content/site";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Подсветка строк терминала — como в прототипе (только наш статичный текст). */
function highlight(value: string) {
  const s = escapeHtml(value);
  if (s.indexOf("//") === 0) return `<i class="c">${s}</i>`;
  if (s.charAt(0) === "$") return `<i class="p">$</i>${s.slice(1)}`;
  if (s.indexOf("✓") === 0) return `<i class="o">${s}</i>`;
  if (s.indexOf("&gt;") === 0) return `<i class="d">${s}</i>`;
  return s
    .replace(/"[^"]*"/g, '<i class="s">$&</i>')
    .replace(/(const|await|async|return)(?=[ (])/g, '<i class="k">$1</i>');
}

/** Печатающийся терминал в центре орбиты (декорация, aria-hidden). */
export function Terminal() {
  const [done, setDone] = useState<string[]>(() => TERMINAL_LINES.slice(0, 14).map(highlight));
  const [current, setCurrent] = useState("");
  const preRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    const pre = preRef.current;
    if (!pre) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Отложенный setState: в эффекте нельзя менять состояние синхронно.
      const timer = window.setTimeout(() => {
        setDone(TERMINAL_LINES.slice(0, 21).map(highlight));
        setCurrent("");
      }, 0);
      return () => window.clearTimeout(timer);
    }

    let paused = false;
    let timer = 0;
    let lineIndex = 14;
    let charIndex = 0;

    const observer = new IntersectionObserver((entries) => {
      paused = !entries[0]?.isIntersecting;
    });
    const hero = document.querySelector(".hero");
    if (hero) observer.observe(hero);

    function step() {
      if (paused || document.hidden) {
        timer = window.setTimeout(step, 400);
        return;
      }

      const line = TERMINAL_LINES[lineIndex];
      const first = line.charAt(0);

      if (charIndex < line.length) {
        charIndex += first === "$" ? 2 : 4;
        setCurrent(line.slice(0, charIndex));
        const delay =
          (first === "$" ? 55 : first === ">" || first === "✓" || first === "/" ? 14 : 32) +
          Math.random() * 35 +
          45;
        timer = window.setTimeout(step, delay);
      } else {
        setDone((previous) => {
          const next = [...previous, highlight(line)];
          return next.length > 21 ? next.slice(next.length - 21) : next;
        });
        setCurrent("");
        charIndex = 0;
        lineIndex = (lineIndex + 1) % TERMINAL_LINES.length;
        timer = window.setTimeout(step, first === "$" ? 420 : 130);
      }
    }

    timer = window.setTimeout(step, 150);

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="term" aria-hidden="true">
      <pre ref={preRef}>
        {done.map((html, index) => (
          <span key={index} dangerouslySetInnerHTML={{ __html: `${html}<br>` }} />
        ))}
        <span dangerouslySetInnerHTML={{ __html: highlight(current) }} />
        <b className="cr" />
      </pre>
    </div>
  );
}
