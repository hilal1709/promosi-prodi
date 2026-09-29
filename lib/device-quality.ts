import type { GameQuality } from "@/lib/types";

/**
 * Perkiraan kasar apakah perangkat tergolong lemah (RAM/CPU kecil).
 * `deviceMemory` hanya ada di browser Chromium; Safari & Firefox tidak
 * menyediakannya dan membatasi `hardwareConcurrency`, jadi di sana hanya
 * perangkat dengan ≤2 inti yang dianggap lemah agar iPhone tidak ikut turun.
 */
export function isLowEndDevice() {
  if (typeof navigator === "undefined") return false;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (memory !== undefined) return memory <= 4;
  const cores = navigator.hardwareConcurrency;
  return cores > 0 && cores <= 2;
}

/** HP/tablet: layar sentuh sebagai input utama. */
export function isTouchDevice() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

/**
 * Kualitas "auto" menjadi "hemat" pada perangkat lemah dan HP/tablet (GPU
 * mobile cepat panas dan tersendat); pilihan manual tidak diubah.
 */
export function resolveQuality(setting: GameQuality, lowEnd: boolean, touch = false): GameQuality {
  return setting === "auto" && (lowEnd || touch) ? "hemat" : setting;
}

export interface QualityProfile {
  /** Rentang DPR: [minimum saat FPS turun, maksimum]. */
  dpr: [number, number];
  shadows: boolean;
  antialias: boolean;
  /** Mode ringan: material sederhana, tanpa bayangan, dibatasi `fps`. */
  lite: boolean;
  fps: number;
  powerPreference: WebGLPowerPreference;
}

/** Pengaturan renderer untuk setiap tingkat kualitas, dipakai semua Canvas. */
export function qualityProfile(quality: GameQuality): QualityProfile {
  if (quality === "hemat") {
    return { dpr: [0.6, 1], shadows: false, antialias: false, lite: true, fps: 30, powerPreference: "default" };
  }
  if (quality === "tinggi") {
    return { dpr: [0.75, 1.75], shadows: true, antialias: true, lite: false, fps: 60, powerPreference: "high-performance" };
  }
  return { dpr: [0.75, 1.5], shadows: true, antialias: true, lite: false, fps: 60, powerPreference: "high-performance" };
}
