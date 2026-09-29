"use client";

import { createPortal } from "react-dom";
import { IconPhone } from "@/components/ui/icons";
import { applyOrientation, useOrientationMismatch } from "@/lib/orientation";
import { cn } from "@/lib/utils";
import type { GameOrientation } from "@/lib/types";

const OPTIONS: Array<{ id: GameOrientation; label: string }> = [
  { id: "auto", label: "Otomatis" },
  { id: "portrait", label: "Potret" },
  { id: "landscape", label: "Lanskap" },
];

/** Pilihan orientasi layar; hanya tampil di perangkat sentuh (`hint-touch`). */
export function OrientationPicker({
  value,
  onChange,
  className,
}: {
  value: GameOrientation;
  onChange: (value: GameOrientation) => void;
  className?: string;
}) {
  return (
    <div className={cn("orientation-picker hint-touch", className)}>
      <span>Orientasi layar</span>
      <div role="radiogroup" aria-label="Orientasi layar">
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={value === option.id}
            className={cn(value === option.id && "is-active")}
            onClick={() => {
              onChange(option.id);
              void applyOrientation(option.id);
            }}
          >
            <IconPhone className={cn("h-4 w-4", option.id === "landscape" && "rotate-90")} />
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Menutup layar saat HP dipegang tidak sesuai orientasi pilihan (iPhone tidak
 * bisa dikunci; Android bisa lepas kunci saat keluar layar penuh).
 */
export function RotateOverlay({ preference, onAuto }: { preference: GameOrientation; onAuto: () => void }) {
  const mismatch = useOrientationMismatch(preference);
  if (!mismatch) return null;
  const landscape = preference === "landscape";
  // Portal ke <body> agar selalu di atas dialog dan dunia misi.
  return createPortal(
    <div className="rotate-overlay" role="alertdialog" aria-live="assertive" aria-label="Putar perangkat">
      <span className={cn("rotate-overlay-phone", landscape ? "to-landscape" : "to-portrait")} aria-hidden="true"><IconPhone /></span>
      <strong>Putar HP-mu ke mode {landscape ? "lanskap" : "potret"}</strong>
      <p>Kamu memilih tampilan {landscape ? "mendatar" : "tegak"}. Permainan dijeda sampai layar diputar.</p>
      <div className="rotate-overlay-actions">
        <button type="button" onClick={() => void applyOrientation(preference)}>Coba kunci otomatis</button>
        <button type="button" onClick={() => { onAuto(); void applyOrientation("auto"); }}>Pakai otomatis</button>
      </div>
    </div>,
    document.body,
  );
}

export { useOrientationMismatch };
