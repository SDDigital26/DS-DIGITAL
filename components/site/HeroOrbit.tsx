"use client";

import { useEffect } from "react";

/**
 * Наклон орбиты за курсором + пауза вращения колец, когда герой ушёл
 * из видимости. На тач-устройствах и при reduced-motion эффект отключён.
 */
export function HeroOrbit() {
  useEffect(() => {
    const orbitEl = document.getElementById("orbit");
    const heroEl = document.querySelector<HTMLElement>(".hero");
    if (!orbitEl || !heroEl) return;

    const orbit: HTMLElement = orbitEl;
    const hero: HTMLElement = heroEl;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;

    let tx = 0;
    let ty = 0;
    let pending = false;
    let frame = 0;
    let heroTop = 0;
    let heroHeight = 1;

    function measure() {
      const rect = hero.getBoundingClientRect();
      heroTop = rect.top;
      heroHeight = rect.height || 1;
    }

    function apply() {
      pending = false;
      orbit.style.setProperty("--rx", `${tx.toFixed(2)}deg`);
      orbit.style.setProperty("--ry", `${ty.toFixed(2)}deg`);
    }

    function onPointerMove(event: PointerEvent) {
      if (!fine || reduced) return;
      const rx = (event.clientY - heroTop - heroHeight / 2) / heroHeight;
      const ry = (event.clientX - window.innerWidth / 2) / window.innerWidth;
      tx = -rx * 8;
      ty = ry * 10;
      if (!pending) {
        pending = true;
        frame = requestAnimationFrame(apply);
      }
    }

    const visibility = new IntersectionObserver((entries) => {
      document.body.classList.toggle("hero-off", !entries[0]?.isIntersecting);
    });
    visibility.observe(hero);

    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    if (fine && !reduced) window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      document.body.classList.remove("hero-off");
      visibility.disconnect();
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      window.removeEventListener("pointermove", onPointerMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="orbit" id="orbit" aria-hidden="true">
      <div className="ring g" />
      <div className="ring" />
      <div className="ring b" />
    </div>
  );
}
