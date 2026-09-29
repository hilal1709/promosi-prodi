"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { AdaptiveResolution } from "@/components/game/adaptive-resolution";
import type { QualityProfile } from "@/lib/device-quality";

/**
 * Membatasi render ke `fps` frame per detik. Canvas harus memakai
 * `frameloop="demand"`; komponen ini memicu `invalidate()` dengan jeda tetap,
 * sehingga GPU HP bekerja separuh lebih sedikit (lebih dingin dan hemat baterai).
 */
export function FrameLimiter({ fps }: { fps: number }) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    const interval = 1000 / fps;
    let last = 0;
    let frame = requestAnimationFrame(function tick(now) {
      frame = requestAnimationFrame(tick);
      // Toleransi kecil agar layar 60/120 Hz tetap tepat di kelipatan frame-nya.
      if (now - last < interval - 2) return;
      last = now;
      invalidate();
    });
    return () => cancelAnimationFrame(frame);
  }, [fps, invalidate]);
  return null;
}

type Snapshot = { color: number; emissive: number; emissiveIntensity: number; opacity: number; visible: boolean; transparent: boolean; map: THREE.Texture | null };

type Pair = { source: THREE.MeshStandardMaterial; lite: THREE.MeshLambertMaterial; snap: Snapshot };

function snapshot(material: THREE.MeshStandardMaterial): Snapshot {
  return {
    color: material.color.getHex(),
    emissive: material.emissive.getHex(),
    emissiveIntensity: material.emissiveIntensity,
    opacity: material.opacity,
    visible: material.visible,
    transparent: material.transparent,
    map: material.map,
  };
}

function createLite(source: THREE.MeshStandardMaterial) {
  const lite = new THREE.MeshLambertMaterial();
  lite.name = source.name;
  lite.color.copy(source.color);
  lite.emissive.copy(source.emissive);
  lite.emissiveIntensity = source.emissiveIntensity;
  lite.map = source.map;
  lite.emissiveMap = source.emissiveMap;
  lite.alphaMap = source.alphaMap;
  lite.alphaTest = source.alphaTest;
  lite.transparent = source.transparent;
  lite.opacity = source.opacity;
  lite.side = source.side;
  lite.vertexColors = source.vertexColors;
  lite.flatShading = source.flatShading;
  lite.wireframe = source.wireframe;
  lite.depthWrite = source.depthWrite;
  lite.depthTest = source.depthTest;
  lite.blending = source.blending;
  lite.toneMapped = source.toneMapped;
  lite.fog = source.fog;
  lite.visible = source.visible;
  lite.polygonOffset = source.polygonOffset;
  lite.polygonOffsetFactor = source.polygonOffsetFactor;
  lite.polygonOffsetUnits = source.polygonOffsetUnits;
  return lite;
}

/**
 * Mode hemat: mengganti material PBR (`MeshStandardMaterial`) dengan
 * `MeshLambertMaterial` yang shader-nya jauh lebih ringan untuk GPU mobile.
 *
 * Material asli tetap dipegang React/kode game, jadi perubahan warna, emisi,
 * atau opasitas yang ditulis ke material asli disalin ke versi ringannya
 * setiap frame. Scene dipindai ulang berkala untuk objek yang baru muncul.
 */
export function LiteMaterials() {
  const scene = useThree((state) => state.scene);
  const cache = useRef(new Map<THREE.Material, Pair>());
  const tick = useRef(0);

  const liteFor = (material: THREE.Material) => {
    if (!(material instanceof THREE.MeshStandardMaterial)) return material;
    let pair = cache.current.get(material);
    if (!pair) {
      pair = { source: material, lite: createLite(material), snap: snapshot(material) };
      cache.current.set(material, pair);
    }
    return pair.lite;
  };

  const scan = () => {
    scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) return;
      if (Array.isArray(mesh.material)) {
        if (mesh.material.some((m) => m instanceof THREE.MeshStandardMaterial)) mesh.material = mesh.material.map(liteFor);
      } else if (mesh.material instanceof THREE.MeshStandardMaterial) {
        mesh.material = liteFor(mesh.material);
      }
    });
  };

  useFrame(() => {
    // Pindai saat mulai lalu kira-kira tiap detik (objek baru, level berganti).
    if (tick.current++ % 30 === 0) scan();
    for (const { source, lite, snap } of cache.current.values()) {
      const color = source.color.getHex();
      if (color !== snap.color) lite.color.setHex((snap.color = color));
      const emissive = source.emissive.getHex();
      if (emissive !== snap.emissive) lite.emissive.setHex((snap.emissive = emissive));
      if (source.emissiveIntensity !== snap.emissiveIntensity) lite.emissiveIntensity = snap.emissiveIntensity = source.emissiveIntensity;
      if (source.opacity !== snap.opacity) lite.opacity = snap.opacity = source.opacity;
      if (source.visible !== snap.visible) lite.visible = snap.visible = source.visible;
      if (source.transparent !== snap.transparent) {
        lite.transparent = snap.transparent = source.transparent;
        lite.needsUpdate = true;
      }
      if (source.map !== snap.map) {
        lite.map = snap.map = source.map;
        lite.needsUpdate = true;
      }
    }
  });

  useEffect(() => {
    const materials = cache.current;
    return () => {
      materials.forEach(({ lite }) => lite.dispose());
      materials.clear();
    };
  }, []);

  return null;
}

/** Props `<Canvas>` bersama untuk kampus dan dunia misi, menurut profil kualitas. */
export function canvasSettings(profile: QualityProfile, paused: boolean) {
  return {
    // Diam saat jeda; mode ringan selalu "demand" dan digerakkan FrameLimiter.
    frameloop: paused || profile.lite ? "demand" : "always",
    shadows: profile.shadows ? "percentage" : false,
    dpr: profile.dpr,
    gl: { antialias: profile.antialias, powerPreference: profile.powerPreference, stencil: false },
  } as const;
}

/** Pengatur performa di dalam Canvas: resolusi adaptif, batas FPS, dan material ringan. */
export function QualityRig({ profile, paused, onFallback }: { profile: QualityProfile; paused: boolean; onFallback?: () => void }) {
  return (
    <>
      <AdaptiveResolution dpr={profile.dpr} fps={profile.fps} onFallback={onFallback} />
      {profile.lite && !paused && <FrameLimiter fps={profile.fps} />}
      {profile.lite && <LiteMaterials />}
    </>
  );
}
