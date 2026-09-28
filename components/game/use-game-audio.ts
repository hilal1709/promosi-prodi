"use client";

import { useCallback, useEffect, useRef } from "react";
import type { AudioSettings } from "@/lib/types";

export type SoundName = "interact" | "success" | "step" | "error" | "pickup";

// [gelombang, frekuensi awal, frekuensi akhir, lama sapuan, volume, lama bunyi]
const SOUNDS: Record<SoundName, [OscillatorType, number, number, number, number, number]> = {
  success: ["triangle", 440, 880, 0.42, 0.12, 0.5],
  interact: ["sine", 260, 520, 0.1, 0.12, 0.14],
  step: ["sine", 95, 70, 0.1, 0.045, 0.14],
  error: ["sawtooth", 220, 110, 0.22, 0.06, 0.26],
  pickup: ["square", 660, 1320, 0.08, 0.05, 0.12],
};

export function useGameAudio(settings: AudioSettings) {
  const contextRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const ambientRef = useRef<OscillatorNode[]>([]);
  const lastStepRef = useRef(0);

  const syncVolume = useCallback(() => {
    const context = contextRef.current;
    const master = masterRef.current;
    if (!context || context.state === "closed" || !master) return;
    const value = settings.muted ? 0 : settings.volume * 0.22;
    master.gain.setTargetAtTime(value, context.currentTime, 0.04);
  }, [settings.muted, settings.volume]);

  const start = useCallback(async () => {
    let context = contextRef.current;
    if (!context || context.state === "closed") {
      const createdContext = new AudioContext();
      context = createdContext;
      contextRef.current = createdContext;
      const master = createdContext.createGain();
      master.gain.value = settings.muted ? 0 : settings.volume * 0.22;
      master.connect(createdContext.destination);

      const filter = createdContext.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 620;
      filter.Q.value = 0.7;
      filter.connect(master);

      const notes = [110, 164.81, 220];
      ambientRef.current = notes.map((frequency, index) => {
        const oscillator = createdContext.createOscillator();
        const gain = createdContext.createGain();
        oscillator.type = index === 1 ? "triangle" : "sine";
        oscillator.frequency.value = frequency;
        oscillator.detune.value = index * 3 - 3;
        gain.gain.value = index === 1 ? 0.035 : 0.025;
        oscillator.connect(gain).connect(filter);
        oscillator.start();
        return oscillator;
      });
      masterRef.current = master;
    }
    if (context.state === "suspended") {
      try {
        await context.resume();
      } catch {
        return;
      }
    }
    if (contextRef.current !== context || context.state === "closed") return;
    syncVolume();
  }, [settings.muted, settings.volume, syncVolume]);

  useEffect(() => {
    syncVolume();
  }, [syncVolume]);

  useEffect(() => {
    return () => {
      const context = contextRef.current;
      ambientRef.current.forEach((node) => {
        try {
          node.stop();
        } catch {
          // The context may already have stopped this oscillator during teardown.
        }
      });
      ambientRef.current = [];
      masterRef.current = null;
      contextRef.current = null;
      if (context && context.state !== "closed") {
        void context.close().catch(() => undefined);
      }
    };
  }, []);

  const play = useCallback(
    (name: SoundName) => {
      const context = contextRef.current;
      const master = masterRef.current;
      if (!context || context.state === "closed" || !master || settings.muted) return;
      if (name === "step" && context.currentTime - lastStepRef.current < 0.24) return;
      if (name === "step") lastStepRef.current = context.currentTime;

      const [type, from, to, sweep, volume, length] = SOUNDS[name];
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const now = context.currentTime;
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(from, now);
      oscillator.frequency.exponentialRampToValueAtTime(to, now + sweep);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + length);
      oscillator.connect(gain).connect(master);
      oscillator.start(now);
      oscillator.stop(now + length + 0.02);
    },
    [settings.muted]
  );

  return { startAudio: start, playSound: play };
}
