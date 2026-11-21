"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import type { Locale } from "@/lib/i18n/config";
import { SERVICES, type DemoKind, type VizKind } from "@/lib/content/site";

function Viz({ kind, count }: { kind: VizKind; count: number }) {
  return (
    <div className="viz" data-v={kind} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <i key={index} style={{ "--k": index } as CSSProperties} />
      ))}
    </div>
  );
}

function Demo({ kind }: { kind: DemoKind }) {
  switch (kind) {
    case "bars":
      return (
        <>
          <b>site</b>
          <div className="bar" style={{ "--w": "90%" } as CSSProperties} />
          <div className="bar" style={{ "--w": "60%" } as CSSProperties} />
          <div className="bar" style={{ "--w": "75%" } as CSSProperties} />
        </>
      );
    case "messages":
      return (
        <>
          <b>app</b>
          <div className="smsg">Login</div>
          <div className="smsg me">Dashboard</div>
        </>
      );
    case "crm":
      return (
        <>
          <b>CRM</b>
          <div className="bar" style={{ "--w": "85%" } as CSSProperties} />
          <div className="bar" style={{ "--w": "55%" } as CSSProperties} />
          <div className="bar" style={{ "--w": "70%" } as CSSProperties} />
        </>
      );
    case "ai":
      return (
        <>
          <b>AI</b>
          <div className="smsg me">?</div>
          <div className="smsg">
            …<code> answer</code>
          </div>
        </>
      );
    case "flow":
      return (
        <>
          <b>flow</b>
          <div className="flow">
            <span className="dot" />
            <span className="l" />
            <span className="dot" />
            <span className="l" />
            <span className="dot" />
          </div>
          <div>form → table → Telegram</div>
        </>
      );
    case "bot":
      return (
        <>
          <b>bot</b>
          <div className="smsg me">/start</div>
          <div className="smsg">Hello! What do you need?</div>
        </>
      );
    case "api":
      return (
        <>
          <b>api</b>
          <code>POST /lead</code>
          <code>200 OK</code>
        </>
      );
  }
}

/** Карточки услуг с mini-демо, 3D-наклоном и появлением при прокрутке. */
export function ServiceCards({ locale }: { locale: Locale }) {
  const gridRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const cards = Array.from(grid.querySelectorAll<HTMLElement>(".scard"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const fallback = window.setTimeout(() => cards.forEach((card) => card.classList.add("in")), 3500);

    const observer =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                const card = entry.target as HTMLElement;
                if (entry.isIntersecting) card.classList.add("in", "live");
                else card.classList.remove("live");
              });
            },
            { threshold: 0.15 },
          )
        : null;

    if (observer) cards.forEach((card) => observer.observe(card));
    else cards.forEach((card) => card.classList.add("in", "live"));

    let frame = 0;
    let pending: { card: HTMLElement; event: PointerEvent } | null = null;

    function applyTilt() {
      frame = 0;
      if (!pending) return;
      const { card, event } = pending;
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      card.style.setProperty("--mx", `${x}px`);
      card.style.setProperty("--my", `${y}px`);
      card.style.setProperty("--cx", `${((0.5 - y / rect.height) * 8).toFixed(1)}deg`);
      card.style.setProperty("--cy", `${((x / rect.width - 0.5) * 10).toFixed(1)}deg`);
    }

    function onPointerMove(event: PointerEvent) {
      const target = event.target instanceof Element ? event.target : null;
      const card = target?.closest<HTMLElement>(".scard");
      if (!card) return;
      pending = { card, event };
      if (!frame) frame = requestAnimationFrame(applyTilt);
    }

    function onPointerOut(event: PointerEvent) {
      const target = event.target instanceof Element ? event.target : null;
      const card = target?.closest<HTMLElement>(".scard");
      const related = event.relatedTarget instanceof Node ? event.relatedTarget : null;
      if (card && !(related && card.contains(related))) {
        card.style.setProperty("--cx", "0deg");
        card.style.setProperty("--cy", "0deg");
      }
    }

    const fine = window.matchMedia("(pointer: fine)").matches;
    if (fine && !reduced) {
      grid.addEventListener("pointermove", onPointerMove, { passive: true });
      grid.addEventListener("pointerout", onPointerOut);
    }

    return () => {
      window.clearTimeout(fallback);
      observer?.disconnect();
      if (frame) cancelAnimationFrame(frame);
      grid.removeEventListener("pointermove", onPointerMove);
      grid.removeEventListener("pointerout", onPointerOut);
    };
  }, []);

  function toggle(card: HTMLElement) {
    const wasOn = card.classList.contains("on");
    gridRef.current?.querySelectorAll(".scard.on").forEach((item) => item.classList.remove("on"));
    if (!wasOn) card.classList.add("on");
  }

  return (
    <div className="sgrid rv" id="services-grid" ref={gridRef}>
      {SERVICES[locale].map((service, index) => (
        <button
          type="button"
          className="scard"
          key={service.title}
          onClick={(event) => toggle(event.currentTarget)}
          style={{ "--d": `${(index % 4) * 0.08}s` } as CSSProperties}
        >
          <Viz kind={service.viz.kind} count={service.viz.count} />
          <svg viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: service.icon }} />
          <h3>{service.title}</h3>
          <p>{service.description}</p>
          <div className="demo" aria-hidden="true">
            <Demo kind={service.demo} />
          </div>
        </button>
      ))}
    </div>
  );
}
