"use client";

import { useCallback, useEffect, useRef } from "react";
import type { AudioSettings } from "@/lib/types";

type SoundName = "interact" | "success" | "step";

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

      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const now = context.currentTime;
      oscillator.type = name === "success" ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(name === "success" ? 440 : name === "interact" ? 260 : 95, now);
      oscillator.frequency.exponentialRampToValueAtTime(
        name === "success" ? 880 : name === "interact" ? 520 : 70,
        now + (name === "success" ? 0.42 : 0.1)
      );
      gain.gain.setValueAtTime(name === "step" ? 0.045 : 0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (name === "success" ? 0.5 : 0.14));
      oscillator.connect(gain).connect(master);
      oscillator.start(now);
      oscillator.stop(now + (name === "success" ? 0.52 : 0.16));
    },
    [settings.muted]
  );

  return { startAudio: start, playSound: play };
}
