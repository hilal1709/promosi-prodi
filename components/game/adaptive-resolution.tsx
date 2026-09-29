"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

const MIN_DPR = 0.75;

/**
 * Menurunkan resolusi render bertahap saat FPS turun (dan menaikkannya lagi
 * bila kembali lancar), agar game tetap bisa dimainkan di HP lemah tanpa
 * mengorbankan ketajaman di perangkat kuat. `max` adalah batas DPR dari
 * pengaturan kualitas.
 */
export function AdaptiveResolution({ max }: { max: number }) {
  const setDpr = useThree((state) => state.setDpr);
  const apply = (factor: number) => {
    const ceiling = Math.min(max, window.devicePixelRatio || 1);
    setDpr(THREE.MathUtils.lerp(Math.min(MIN_DPR, ceiling), ceiling, factor));
  };
  return (
    <PerformanceMonitor
      factor={1}
      flipflops={3}
      onChange={({ factor }) => apply(factor)}
      // Terlalu sering naik-turun: kunci di resolusi terendah supaya stabil.
      onFallback={() => apply(0)}
    />
  );
}
