"use client";

import { useEffect, useRef, type RefObject } from "react";

export type PressName = "action" | "interact" | "left" | "right" | "up" | "down";

export interface WorldInputState {
  /** Tombol yang sedang ditahan (keyboard): w/a/s/d/space/e/shift/c. */
  held: Record<string, boolean>;
  /** Joystick sentuh, -1..1 (x = kanan, y = maju). */
  stick: { x: number; y: number };
  /** Penghitung ketukan; scene membandingkan dengan nilai terakhir yang ia baca. */
  presses: Record<PressName, number>;
}

export type WorldInput = RefObject<WorldInputState>;

const KEY_MAP: Record<string, string> = {
  KeyW: "w", ArrowUp: "w",
  KeyA: "a", ArrowLeft: "a",
  KeyS: "s", ArrowDown: "s",
  KeyD: "d", ArrowRight: "d",
  Space: "space",
  KeyE: "e", Enter: "e",
  ShiftLeft: "shift", ShiftRight: "shift",
  KeyC: "c",
};

const PRESS_FOR_KEY: Record<string, PressName> = {
  w: "up", a: "left", s: "down", d: "right", space: "action", e: "interact",
};

export function createInputState(): WorldInputState {
  return {
    held: {},
    stick: { x: 0, y: 0 },
    presses: { action: 0, interact: 0, left: 0, right: 0, up: 0, down: 0 },
  };
}

/** Input bersama untuk dunia misi: keyboard + tombol sentuh menulis ke ref yang sama. */
export function useWorldInput(enabled: boolean) {
  const input = useRef<WorldInputState>(createInputState());

  useEffect(() => {
    if (!enabled) return;
    const state = input.current;
    const down = (event: KeyboardEvent) => {
      const key = KEY_MAP[event.code];
      if (!key) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      event.preventDefault();
      const press = PRESS_FOR_KEY[key];
      if (press && !event.repeat) state.presses[press] += 1;
      state.held[key] = true;
    };
    const up = (event: KeyboardEvent) => {
      const key = KEY_MAP[event.code];
      if (key) state.held[key] = false;
    };
    const reset = () => {
      state.held = {};
      state.stick = { x: 0, y: 0 };
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", reset);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", reset);
      reset();
    };
  }, [enabled]);

  return input;
}

/** Gabungan arah keyboard + joystick, dibatasi panjang 1. */
export function readAxis(state: WorldInputState) {
  const x = (state.held.d ? 1 : 0) - (state.held.a ? 1 : 0) + state.stick.x;
  const y = (state.held.w ? 1 : 0) - (state.held.s ? 1 : 0) + state.stick.y;
  const length = Math.hypot(x, y);
  return length > 1 ? { x: x / length, y: y / length } : { x, y };
}

/** Membaca ketukan baru sejak pemanggilan terakhir (dipakai di dalam useFrame). */
export function usePressReader(input: WorldInput) {
  const seen = useRef<Record<PressName, number> | null>(null);
  return (name: PressName) => {
    const presses = input.current.presses;
    if (!seen.current) seen.current = { ...presses };
    const fresh = presses[name] - seen.current[name];
    seen.current[name] = presses[name];
    return fresh > 0;
  };
}

/**
 * Teks petunjuk sesuai perangkat: tombol keyboard di desktop, nama tombol
 * sentuh di HP/tablet (untuk string seperti toast; teks JSX memakai kelas
 * `hint-pointer` / `hint-touch`).
 */
export function controlHint(keyboard: string, touch: string) {
  if (typeof window === "undefined") return keyboard;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches ? keyboard : touch;
}
