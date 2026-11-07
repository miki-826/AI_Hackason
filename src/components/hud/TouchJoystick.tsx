"use client";

import { useEffect, useRef, useState } from "react";
import { touchMove } from "@/components/game/inputState";

const RADIUS = 48;

/** Virtual movement stick for touch devices (bottom-left). */
export function TouchJoystick() {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const active = useRef<number | null>(null);

  useEffect(
    () => () => {
      touchMove.x = 0;
      touchMove.y = 0;
    },
    [],
  );

  const update = (clientX: number, clientY: number) => {
    const el = base.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let dx = clientX - (r.left + r.width / 2);
    let dy = clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy);
    if (d > RADIUS) {
      dx = (dx / d) * RADIUS;
      dy = (dy / d) * RADIUS;
    }
    setKnob({ x: dx, y: dy });
    touchMove.x = dx / RADIUS;
    touchMove.y = -dy / RADIUS;
  };
  const end = () => {
    active.current = null;
    setKnob({ x: 0, y: 0 });
    touchMove.x = 0;
    touchMove.y = 0;
  };

  return (
    <div
      ref={base}
      role="application"
      aria-label="移動スティック"
      className="pointer-events-auto absolute bottom-28 left-8 h-32 w-32 touch-none select-none rounded-full border border-brass/50 bg-ink/40"
      onPointerDown={(e) => {
        e.stopPropagation();
        active.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (active.current === e.pointerId) update(e.clientX, e.clientY);
      }}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 h-14 w-14 rounded-full border border-brass bg-night/80"
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
    </div>
  );
}
