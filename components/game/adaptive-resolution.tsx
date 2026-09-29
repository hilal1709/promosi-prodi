"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Menurunkan resolusi render bertahap saat FPS turun (dan menaikkannya lagi
 * bila kembali lancar), agar game tetap bisa dimainkan di HP lemah tanpa
 * mengorbankan ketajaman di perangkat kuat. `dpr` adalah rentang [min, max]
 * dari profil kualitas. `onFallback` dipanggil bila FPS terus naik-turun,
 * tanda perangkat sebaiknya pindah ke mode hemat.
 */
export function AdaptiveResolution({ dpr: [min, max], fps = 60, onFallback }: { dpr: [number, number]; fps?: number; onFallback?: () => void }) {
  const setDpr = useThree((state) => state.setDpr);
  const apply = (factor: number) => {
    const ceiling = Math.min(max, window.devicePixelRatio || 1);
    setDpr(THREE.MathUtils.lerp(Math.min(min, ceiling), ceiling, factor));
  };
  // Dengan batas 30 FPS, ambang "lancar" ikut diturunkan agar resolusi tidak terus turun.
  const bounds = fps < 60 ? () => [22, 28] as [number, number] : undefined;
  return (
    <PerformanceMonitor
      factor={1}
      flipflops={3}
      bounds={bounds}
      onChange={({ factor }) => apply(factor)}
      // Terlalu sering naik-turun: kunci di resolusi terendah supaya stabil.
      onFallback={() => {
        apply(0);
        onFallback?.();
      }}
    />
  );
}
