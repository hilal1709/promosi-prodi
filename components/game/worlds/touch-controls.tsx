"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PressName, WorldInput } from "./world-controls";

export type TouchButton = { press?: PressName; label: ReactNode; holdKey?: string; tone?: "gold" | "light" };

function Joystick({ inputRef }: { inputRef: WorldInput }) {
  const knob = useRef<HTMLSpanElement>(null);
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const radius = rect.width / 2;
    let dx = event.clientX - (rect.left + radius);
    let dy = event.clientY - (rect.top + radius);
    const length = Math.hypot(dx, dy);
    if (length > radius) {
      dx = (dx / length) * radius;
      dy = (dy / length) * radius;
    }
    inputRef.current.stick = { x: dx / radius, y: -dy / radius };
    if (knob.current) knob.current.style.transform = `translate(${dx * 0.6}px, ${dy * 0.6}px)`;
  };
  const release = () => {
    inputRef.current.stick = { x: 0, y: 0 };
    if (knob.current) knob.current.style.transform = "";
  };
  return (
    <div
      className="world-joystick"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        move(event);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) move(event);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      aria-label="Joystick gerak"
      role="application"
    >
      <span ref={knob} />
    </div>
  );
}

function PressButton({ inputRef, button }: { inputRef: WorldInput; button: TouchButton }) {
  const down = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (button.press) inputRef.current.presses[button.press] += 1;
    if (button.holdKey) inputRef.current.held[button.holdKey] = true;
  };
  const up = () => {
    if (button.holdKey) inputRef.current.held[button.holdKey] = false;
  };
  return (
    <button
      className={button.tone === "light" ? "world-touch-btn is-light" : "world-touch-btn"}
      onPointerDown={down}
      onPointerUp={up}
      onPointerLeave={up}
      onPointerCancel={up}
    >
      {button.label}
    </button>
  );
}

/** Kontrol layar sentuh. Disembunyikan lewat CSS pada perangkat dengan mouse. */
export function TouchControls({
  inputRef,
  mode,
  buttons = [],
}: {
  inputRef: WorldInput;
  mode: "stick" | "lanes" | "none";
  buttons?: TouchButton[];
}) {
  return (
    <div className="world-touch" aria-hidden={mode === "none" && buttons.length === 0}>
      <div className="world-touch-left">
        {mode === "stick" && <Joystick inputRef={inputRef} />}
        {mode === "lanes" && (
          <>
            <PressButton inputRef={inputRef} button={{ press: "left", label: <ChevronLeft className="h-7 w-7" />, holdKey: "a", tone: "light" }} />
            <PressButton inputRef={inputRef} button={{ press: "right", label: <ChevronRight className="h-7 w-7" />, holdKey: "d", tone: "light" }} />
          </>
        )}
      </div>
      <div className="world-touch-right">
        {buttons.map((button) => (
          <PressButton key={button.holdKey ?? button.press} inputRef={inputRef} button={button} />
        ))}
      </div>
    </div>
  );
}
