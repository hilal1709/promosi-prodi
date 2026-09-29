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

/** Kualitas "auto" menjadi "hemat" pada perangkat lemah; pilihan manual tidak diubah. */
export function resolveQuality(setting: GameQuality, lowEnd: boolean): GameQuality {
  return setting === "auto" && lowEnd ? "hemat" : setting;
}
