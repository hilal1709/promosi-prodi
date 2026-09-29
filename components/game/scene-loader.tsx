"use client";

import { useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";
import { GameLoader } from "@/components/game/game-loader";
import { cn } from "@/lib/utils";

/**
 * Dipasang di dalam `<Suspense>` Canvas, bersebelahan dengan isi scene: ia baru
 * ter-mount setelah semua aset (model, tekstur) selesai dimuat.
 */
export function SceneReady({ onReady }: { onReady: () => void }) {
  useEffect(() => onReady(), [onReady]);
  return null;
}

/** Tirai muat di atas Canvas 3D yang memudar setelah scene siap. */
export function SceneLoader({ ready, label }: { ready: boolean; label: string }) {
  const { progress, total } = useProgress();
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => setGone(true), 450);
    return () => window.clearTimeout(timer);
  }, [ready]);

  if (gone) return null;
  return (
    <GameLoader
      label={label}
      progress={ready ? 100 : total > 0 ? progress : undefined}
      className={cn("is-overlay", ready && "is-done")}
    />
  );
}
