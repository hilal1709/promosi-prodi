import { useSyncExternalStore } from "react";
import { isTouchDevice } from "@/lib/device-quality";
import type { GameOrientation } from "@/lib/types";

type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: "portrait" | "landscape") => Promise<void>;
  unlock?: () => void;
};

let enteredFullscreen = false;

/**
 * Menerapkan orientasi pilihan pemain. Harus dipanggil dari aksi pengguna
 * (klik), karena layar penuh hanya boleh diminta saat itu. Android/Chrome
 * mengunci orientasi dalam mode layar penuh; iPhone tidak mendukung kunci
 * orientasi, jadi di sana `RotateOverlay` meminta pemain memutar HP-nya.
 */
export async function applyOrientation(preference: GameOrientation) {
  if (typeof window === "undefined") return;
  const orientation = screen.orientation as LockableOrientation | undefined;

  if (preference === "auto") {
    try {
      orientation?.unlock?.();
    } catch {}
    if (enteredFullscreen && document.fullscreenElement) await document.exitFullscreen().catch(() => {});
    enteredFullscreen = false;
    return;
  }

  if (!isTouchDevice() || !orientation?.lock) return;
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen({ navigationUI: "hide" });
      enteredFullscreen = true;
    }
    await orientation.lock(preference);
  } catch {
    // Tidak didukung (mis. iOS) atau ditolak: overlay "putar HP" yang menangani.
  }
}

const PORTRAIT = "(orientation: portrait)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(PORTRAIT);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** True bila orientasi layar saat ini tidak sesuai pilihan pemain (hanya perangkat sentuh). */
export function useOrientationMismatch(preference: GameOrientation) {
  const portrait = useSyncExternalStore(subscribe, () => window.matchMedia(PORTRAIT).matches, () => true);
  const touch = useSyncExternalStore(subscribe, isTouchDevice, () => false);
  if (preference === "auto" || !touch) return false;
  return (preference === "portrait") !== portrait;
}
