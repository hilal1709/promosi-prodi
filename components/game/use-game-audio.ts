"use client";

import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import type { AudioSettings } from "@/lib/types";
import { createMusicPlayer, type MusicPlayer, type MusicThemeId } from "./game-music";

export type { MusicThemeId } from "./game-music";

export type SoundName =
  | "interact"
  | "success"
  | "step"
  | "error"
  | "pickup"
  | "shoot"
  | "boom"
  | "click"
  | "open"
  | "close"
  | "near"
  | "start"
  | "countdown"
  | "levelComplete"
  | "missionComplete"
  | "hit"
  | "jump"
  | "whoosh";

// [gelombang, frekuensi awal, frekuensi akhir, lama sapuan, volume, lama bunyi, jeda mulai]
type Blip = [OscillatorType, number, number, number, number, number, number?];

const SOUNDS: Record<SoundName, Blip[]> = {
  success: [["triangle", 440, 880, 0.42, 0.12, 0.5]],
  interact: [["sine", 260, 520, 0.1, 0.12, 0.14]],
  step: [["sine", 95, 70, 0.1, 0.045, 0.14]],
  error: [["sawtooth", 220, 110, 0.22, 0.06, 0.26]],
  pickup: [["square", 660, 1320, 0.08, 0.05, 0.12]],
  shoot: [["square", 900, 420, 0.05, 0.018, 0.06]],
  boom: [["sawtooth", 160, 40, 0.28, 0.07, 0.32]],
  click: [["triangle", 720, 520, 0.03, 0.07, 0.06]],
  open: [["sine", 420, 840, 0.08, 0.09, 0.14]],
  close: [["sine", 700, 350, 0.08, 0.08, 0.12]],
  near: [
    ["sine", 880, 880, 0.01, 0.07, 0.25, 0],
    ["sine", 1320, 1320, 0.01, 0.06, 0.35, 0.08],
  ],
  start: [
    ["square", 523, 523, 0.01, 0.04, 0.1, 0],
    ["square", 659, 659, 0.01, 0.04, 0.1, 0.09],
    ["square", 784, 784, 0.01, 0.05, 0.22, 0.18],
  ],
  countdown: [["square", 880, 880, 0.01, 0.04, 0.1]],
  levelComplete: [
    ["triangle", 523, 523, 0.01, 0.1, 0.16, 0],
    ["triangle", 659, 659, 0.01, 0.1, 0.16, 0.1],
    ["triangle", 784, 784, 0.01, 0.1, 0.16, 0.2],
    ["triangle", 1047, 1047, 0.01, 0.12, 0.5, 0.3],
  ],
  missionComplete: [
    ["square", 392, 392, 0.01, 0.05, 0.14, 0],
    ["square", 523, 523, 0.01, 0.05, 0.14, 0.13],
    ["square", 659, 659, 0.01, 0.05, 0.14, 0.26],
    ["square", 784, 784, 0.01, 0.05, 0.3, 0.39],
    ["triangle", 1047, 1047, 0.01, 0.12, 0.8, 0.6],
    ["triangle", 523, 523, 0.01, 0.08, 0.8, 0.6],
  ],
  hit: [["sawtooth", 300, 60, 0.12, 0.08, 0.16]],
  jump: [["square", 300, 700, 0.1, 0.035, 0.14]],
  whoosh: [["sine", 300, 900, 0.15, 0.05, 0.18]],
};

// Level dasar tiap bus pada slider 100%. Nada musik dibuat pelan (0.03–0.14),
// jadi bus musik diberi penguatan besar; kompresor di ujung rantai mencegah clipping.
const MASTER_GAIN = 0.9;
const MUSIC_GAIN = 2.2;
const SFX_GAIN = 0.5;

/** Pemutar SFX bersama agar komponen UI di dalam game bisa berbunyi tanpa prop drilling. */
export const GameSoundContext = createContext<(name: SoundName) => void>(() => undefined);

export function useGameSound() {
  return useContext(GameSoundContext);
}

export function useGameAudio(settings: AudioSettings) {
  const contextRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const musicBusRef = useRef<GainNode | null>(null);
  const sfxBusRef = useRef<GainNode | null>(null);
  const musicRef = useRef<MusicPlayer | null>(null);
  const musicStateRef = useRef<{ theme: MusicThemeId | null; intensity: number }>({ theme: null, intensity: 1 });
  const lastStepRef = useRef(0);
  const settingsRef = useRef(settings);

  const syncVolume = useCallback(() => {
    settingsRef.current = settings;
    const context = contextRef.current;
    if (!context || context.state === "closed" || !masterRef.current) return;
    const now = context.currentTime;
    masterRef.current.gain.setTargetAtTime(settings.muted ? 0 : settings.volume * MASTER_GAIN, now, 0.04);
    musicBusRef.current?.gain.setTargetAtTime(settings.music * MUSIC_GAIN, now, 0.04);
    sfxBusRef.current?.gain.setTargetAtTime(settings.sfx * SFX_GAIN, now, 0.04);
  }, [settings]);

  const start = useCallback(async () => {
    let context = contextRef.current;
    if (!context || context.state === "closed") {
      const createdContext = new AudioContext();
      const current = settingsRef.current;
      context = createdContext;
      contextRef.current = createdContext;
      const master = createdContext.createGain();
      master.gain.value = current.muted ? 0 : current.volume * MASTER_GAIN;
      // Kompresor meratakan puncak (kick, efek suara) lalu dinaikkan lagi,
      // sehingga musik terdengar keras di speaker HP tanpa pecah/clipping.
      const compressor = createdContext.createDynamicsCompressor();
      compressor.threshold.value = -14;
      compressor.knee.value = 8;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.004;
      compressor.release.value = 0.2;
      const makeup = createdContext.createGain();
      makeup.gain.value = 1.8;
      master.connect(compressor).connect(makeup).connect(createdContext.destination);
      const musicBus = createdContext.createGain();
      musicBus.gain.value = current.music * MUSIC_GAIN;
      musicBus.connect(master);
      const sfxBus = createdContext.createGain();
      sfxBus.gain.value = current.sfx * SFX_GAIN;
      sfxBus.connect(master);
      masterRef.current = master;
      musicBusRef.current = musicBus;
      sfxBusRef.current = sfxBus;

      const music = createMusicPlayer(createdContext, musicBus);
      music.setIntensity(musicStateRef.current.intensity);
      music.setTheme(musicStateRef.current.theme);
      musicRef.current = music;
    }
    if (context.state === "suspended") {
      try {
        await context.resume();
      } catch {
        return;
      }
    }
  }, []);

  useEffect(() => {
    syncVolume();
  }, [syncVolume]);

  useEffect(() => {
    // Browser hanya mengizinkan audio setelah interaksi; interaksi pertama apa pun menyalakan musik,
    // termasuk untuk pemain yang langsung melanjutkan progres tersimpan.
    const unlock = () => {
      if (document.visibilityState !== "visible") return;
      const context = contextRef.current;
      if (!context || context.state !== "running") void start();
    };
    const onVisibility = () => {
      const context = contextRef.current;
      if (!context || context.state === "closed") return;
      if (document.visibilityState === "hidden") void context.suspend().catch(() => undefined);
      else void context.resume().catch(() => undefined);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [start]);

  useEffect(() => {
    return () => {
      const context = contextRef.current;
      musicRef.current?.stop();
      musicRef.current = null;
      masterRef.current = null;
      musicBusRef.current = null;
      sfxBusRef.current = null;
      contextRef.current = null;
      if (context && context.state !== "closed") {
        void context.close().catch(() => undefined);
      }
    };
  }, []);

  const setMusic = useCallback((theme: MusicThemeId | null, intensity = 1) => {
    musicStateRef.current = { theme, intensity };
    musicRef.current?.setIntensity(intensity);
    musicRef.current?.setTheme(theme);
  }, []);

  const play = useCallback(
    (name: SoundName) => {
      const context = contextRef.current;
      const bus = sfxBusRef.current;
      if (!context || context.state !== "running" || !bus || settings.muted) return;
      if (name === "step" && context.currentTime - lastStepRef.current < 0.24) return;
      if (name === "step") lastStepRef.current = context.currentTime;

      SOUNDS[name].forEach(([type, from, to, sweep, volume, length, delay = 0]) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const now = context.currentTime + delay;
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(from, now);
        if (to !== from) oscillator.frequency.exponentialRampToValueAtTime(to, now + sweep);
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + length);
        oscillator.connect(gain).connect(bus);
        oscillator.start(now);
        oscillator.stop(now + length + 0.02);
      });
    },
    [settings.muted]
  );

  return { startAudio: start, playSound: play, setMusic };
}
