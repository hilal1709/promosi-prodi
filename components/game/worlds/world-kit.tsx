"use client";

import { Suspense, useCallback, useState, useEffect, useRef, type ComponentProps, type ReactNode, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { IconPause } from "@/components/ui/icons";
import CharacterModel, { type CharacterMotion } from "@/components/game/character-model";
import { FeedbackToast, LevelComplete, type Feedback } from "@/components/game/missions/mission-kit";
import { AdaptiveResolution } from "@/components/game/adaptive-resolution";
import { ResponsiveCamera } from "@/components/game/responsive-camera";
import { SceneLoader, SceneReady } from "@/components/game/scene-loader";
import type { SoundName } from "@/components/game/use-game-audio";
import { cn } from "@/lib/utils";
import type { WorldLevelInfo } from "@/lib/data/worlds";
import type { GameAvatarId, GameQuality } from "@/lib/types";
import { useHudLayout } from "./hud-layout";
import { readAxis, type WorldInput } from "./world-controls";

export interface WorldLevelProps {
  levelIndex: number;
  info: WorldLevelInfo;
  paused: boolean;
  avatar: GameAvatarId;
  quality: GameQuality;
  input: WorldInput;
  sound: (name: SoundName) => void;
  onPause: () => void;
  onFinish: (score: number) => void;
}

/** Delta dibatasi agar lompatan frame (tab tersembunyi, jeda) tidak membuat objek "teleport". */
export const clampDelta = (delta: number) => Math.min(delta, 0.05);

/** setState yang dibatasi frekuensinya, untuk menyalin state useFrame ke HUD DOM. */
export function useThrottled<T>(set: (value: T) => void, hz = 12) {
  const last = useRef(0);
  return useCallback(
    (value: T, force = false) => {
      const now = performance.now();
      if (!force && now - last.current < 1000 / hz) return;
      last.current = now;
      set(value);
    },
    [set, hz]
  );
}

export function WorldStage({
  quality,
  paused,
  camera,
  background = "#10131a",
  children,
  overlay,
}: {
  quality: GameQuality;
  paused: boolean;
  camera?: { position?: [number, number, number]; fov?: number; near?: number; far?: number };
  background?: string;
  children: ReactNode;
  overlay: ReactNode;
}) {
  const dpr: [number, number] = quality === "hemat" ? [1, 1] : quality === "tinggi" ? [1.25, 1.75] : [1, 1.5];
  const [ready, setReady] = useState(false);
  const markReady = useCallback(() => setReady(true), []);
  const stageRef = useRef<HTMLDivElement>(null);
  useHudLayout(stageRef);
  return (
    <div ref={stageRef} className="world-stage">
      <Canvas
        frameloop={paused ? "demand" : "always"}
        shadows={quality !== "hemat" ? "percentage" : false}
        dpr={dpr}
        camera={{ fov: camera?.fov ?? 55, near: camera?.near ?? 0.1, far: camera?.far ?? 260, position: camera?.position ?? [0, 8, 10] }}
        gl={{ antialias: quality !== "hemat", powerPreference: "high-performance" }}
      >
        <color attach="background" args={[background]} />
        <ResponsiveCamera />
        <AdaptiveResolution max={dpr[1]} />
        <Suspense fallback={null}>
          {children}
          <SceneReady onReady={markReady} />
        </Suspense>
      </Canvas>
      {overlay}
      <SceneLoader ready={ready} label="Menyiapkan arena misi…" />
    </div>
  );
}

/** Tombol keyboard di desktop, nama tombol sentuh di HP/tablet (dalam prompt HUD). */
export function KeyHint({ keyboard, touch }: { keyboard: string; touch: string }) {
  return (
    <>
      <kbd className="hint-pointer">{keyboard}</kbd>
      <kbd className="hint-touch">{touch}</kbd>
    </>
  );
}

export function Label({
  position,
  children,
  className,
  distanceFactor = 10,
  fixed = false,
}: {
  position: [number, number, number];
  children: ReactNode;
  className?: string;
  distanceFactor?: number;
  /** Ukuran tetap di layar (tidak mengecil saat jauh), untuk teks yang wajib terbaca. */
  fixed?: boolean;
}) {
  return (
    <Html position={position} center distanceFactor={fixed ? undefined : distanceFactor} zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
      <div className={cn("world-label", className)}>{children}</div>
    </Html>
  );
}

/**
 * Avatar pemain yang berjalan di bidang XZ, dengan kamera mengikuti dari
 * belakang-atas. Arah gerak mengikuti sumbu dunia (atas = -Z) agar kontrol
 * joystick dan keyboard tetap intuitif.
 */
export function Walker({
  avatar,
  input,
  playerRef,
  start,
  frozen,
  blocked,
  speed = 4.2,
  cameraOffset = [0, 7.5, 8.5],
  onStep,
  crouch,
  onMove,
}: {
  avatar: GameAvatarId;
  input: WorldInput;
  playerRef: RefObject<THREE.Group | null>;
  start: [number, number];
  frozen: boolean;
  blocked?: (x: number, z: number) => boolean;
  /** Angka tetap, atau fungsi yang dibaca tiap frame (mis. lari/jongkok). */
  speed?: number | (() => number);
  cameraOffset?: [number, number, number];
  onStep?: () => void;
  /** Bila true, pemain tampak merunduk. */
  crouch?: () => boolean;
  onMove?: (moving: boolean) => void;
}) {
  const motion = useRef<CharacterMotion>({ phase: 0, moving: false });
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3());
  const placed = useRef(false);

  useFrame((_, raw) => {
    const player = playerRef.current;
    if (!player) return;
    const delta = clampDelta(raw);
    if (!placed.current) {
      player.position.set(start[0], 0, start[1]);
      camera.position.set(start[0] + cameraOffset[0], cameraOffset[1], start[1] + cameraOffset[2]);
      placed.current = true;
    }
    const axis = frozen ? { x: 0, y: 0 } : readAxis(input.current);
    const moving = Math.hypot(axis.x, axis.y) > 0.15;
    onMove?.(moving);
    const pace = typeof speed === "function" ? speed() : speed;
    const scaleY = THREE.MathUtils.damp(player.scale.y, crouch?.() ? 0.72 : 1, 12, delta);
    player.scale.set(1, scaleY, 1);
    if (moving) {
      const dx = axis.x * pace * delta;
      const dz = -axis.y * pace * delta;
      if (!blocked?.(player.position.x + dx, player.position.z)) player.position.x += dx;
      if (!blocked?.(player.position.x, player.position.z + dz)) player.position.z += dz;
      const target = Math.atan2(axis.x, -axis.y);
      const diff = Math.atan2(Math.sin(target - player.rotation.y), Math.cos(target - player.rotation.y));
      player.rotation.y += diff * Math.min(1, delta * 12);
      onStep?.();
    }
    motion.current.moving = moving;

    const desired = new THREE.Vector3(
      player.position.x + cameraOffset[0],
      cameraOffset[1],
      player.position.z + cameraOffset[2]
    );
    camera.position.lerp(desired, 1 - Math.exp(-delta * 5));
    look.current.lerp(new THREE.Vector3(player.position.x, 1, player.position.z - 1), 1 - Math.exp(-delta * 8));
    camera.lookAt(look.current);
  });

  return (
    <group ref={playerRef}>
      <CharacterModel avatar={avatar} motion={motion} />
    </group>
  );
}

export function HudChip({ children, tone = "dark", pulse }: { children: ReactNode; tone?: "dark" | "gold" | "red" | "green"; pulse?: boolean }) {
  return <span className={cn("world-chip", `is-${tone}`, pulse && "animate-pulse")}>{children}</span>;
}

export function HudMeter({ label, value, tone = "gold" }: { label: string; value: number; tone?: "gold" | "red" | "green" }) {
  return (
    <span className="world-meter">
      <small>{label}</small>
      <span><i className={`is-${tone}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></span>
    </span>
  );
}

export function WorldHud({
  levelIndex,
  info,
  stats,
  toast,
  prompt,
  onPause,
}: {
  levelIndex: number;
  info: WorldLevelInfo;
  stats?: ReactNode;
  toast?: Feedback;
  prompt?: ReactNode;
  onPause: () => void;
}) {
  return (
    <>
      <div className="world-hud-top">
        <div className="world-hud-title">
          <small>LEVEL {levelIndex + 1} / 3</small>
          <strong>{info.judul}</strong>
        </div>
        <div className="world-hud-stats">{stats}</div>
        <button className="world-hud-pause" onClick={onPause} aria-label="Jeda">
          <IconPause className="h-5 w-5" />
        </button>
      </div>
      {prompt && <div className="world-prompt">{prompt}</div>}
      <div className="world-toast"><FeedbackToast feedback={toast ?? null} silent /></div>
    </>
  );
}

/** Kamera diam yang menatap satu titik (level tanpa avatar berjalan). */
export function FixedCamera({ position, target }: { position: [number, number, number]; target: [number, number, number] }) {
  const { camera } = useThree();
  const [px, py, pz] = position;
  const [tx, ty, tz] = target;
  useEffect(() => {
    camera.position.set(px, py, pz);
    camera.lookAt(tx, ty, tz);
  }, [camera, px, py, pz, tx, ty, tz]);
  return null;
}

/** Pencahayaan standar dunia misi. `night` = suasana senja: langit ungu-biru dengan sisa cahaya matahari hangat. */
export function WorldLights({ night = false }: { night?: boolean }) {
  return (
    <>
      <ambientLight intensity={night ? 0.35 : 0.15} color={night ? "#ffe2c4" : "#ffffff"} />
      <hemisphereLight intensity={night ? 1.1 : 1.05} color={night ? "#c7d3ff" : "#e9f4ff"} groundColor={night ? "#5a4a45" : "#6b5a48"} />
      <directionalLight
        castShadow
        position={night ? [-14, 16, 10] : [12, 20, 10]}
        intensity={night ? 1.5 : 1.8}
        color={night ? "#ffc89a" : "#fff1d6"}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.0005}
      />
    </>
  );
}

/** Kartu akhir level yang melayang di tengah dunia. */
export function LevelEnd(props: ComponentProps<typeof LevelComplete>) {
  return (
    <div className="world-end">
      <LevelComplete {...props} />
    </div>
  );
}
