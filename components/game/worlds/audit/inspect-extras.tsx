"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { IconArrowDown, IconArrowLeft, IconArrowRight, IconArrowUp, IconLock } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import type { BonusKind } from "@/lib/data/worlds";
import { controlHint } from "../world-controls";

/* ------------------------------------------------------------------ */
/* Sorot pandang drone                                                */
/* ------------------------------------------------------------------ */

export const CONE_RANGE = 5;
export const CONE_RANGE_CROUCH = 2.5;
export const CONE_HALF = (32 * Math.PI) / 180;

export type DroneState = {
  x: number;
  z: number;
  leg: number;
  heading: number;
  baseHeading: number;
  wait: number;
  pause: number;
};

/** Sektor lingkaran di lantai searah `heading` drone (heading 0 = menghadap +Z). */
function sector(radius: number) {
  const geometry = new THREE.CircleGeometry(radius, 24, Math.PI / 2 - CONE_HALF, CONE_HALF * 2);
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

const CALM = new THREE.Color("#ffe08a");
const ALARM = new THREE.Color("#ff3b3b");

export function DroneCone({ droneRef, alertRef }: { droneRef: RefObject<DroneState>; alertRef: RefObject<{ alert: number }> }) {
  const group = useRef<THREE.Group>(null);
  const outer = useRef<THREE.MeshBasicMaterial>(null);
  const inner = useRef<THREE.MeshBasicMaterial>(null);
  const [far, near] = useMemo(() => [sector(CONE_RANGE), sector(CONE_RANGE_CROUCH)], []);
  useEffect(() => () => {
    far.dispose();
    near.dispose();
  }, [far, near]);
  useFrame(({ clock }) => {
    const d = droneRef.current;
    if (!group.current) return;
    group.current.position.set(d.x, 0.03, d.z);
    group.current.rotation.y = d.heading;
    const level = alertRef.current.alert / 100;
    const off = d.pause > 0;
    const flicker = level > 0.6 ? 0.08 * Math.sin(clock.elapsedTime * 30) : 0;
    if (outer.current) {
      outer.current.color.copy(CALM).lerp(ALARM, level);
      outer.current.opacity = off ? 0.05 : 0.2 + level * 0.2 + flicker;
    }
    if (inner.current) {
      inner.current.color.copy(CALM).lerp(ALARM, level);
      inner.current.opacity = off ? 0.05 : 0.18 + level * 0.2;
    }
  });
  return (
    <group ref={group}>
      <mesh geometry={far}>
        <meshBasicMaterial ref={outer} transparent depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh geometry={near} position={[0, 0.005, 0]}>
        <meshBasicMaterial ref={inner} transparent depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Item bonus                                                         */
/* ------------------------------------------------------------------ */

export type BonusItemData = { id: string; kind: BonusKind; x: number; z: number };

export const BONUS_INFO: Record<BonusKind, { nama: string; efek: string; warna: string }> = {
  baterai: { nama: "Baterai pemindai", efek: "+50 energi pemindai", warna: "#39e67a" },
  kopi: { nama: "Kopi panas", efek: "+10 detik", warna: "#ffb45c" },
  dokumen: { nama: "Dokumen log", efek: "+2 skor bukti", warna: "#6fb7ff" },
};

export function BonusItem({ item, index }: { item: BonusItemData; index: number }) {
  const spin = useRef<THREE.Group>(null);
  const color = BONUS_INFO[item.kind].warna;
  useFrame(({ clock }) => {
    if (!spin.current) return;
    spin.current.rotation.y = clock.elapsedTime * 1.6 + index;
    spin.current.position.y = 0.75 + Math.sin(clock.elapsedTime * 2.4 + index) * 0.12;
  });
  return (
    <group position={[item.x, 0, item.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.38, 0.5, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} toneMapped={false} />
      </mesh>
      <group ref={spin}>
        {item.kind === "baterai" && (
          <>
            <mesh castShadow><boxGeometry args={[0.28, 0.46, 0.18]} /><meshStandardMaterial color="#2a2f3a" /></mesh>
            <mesh position={[0, -0.06, 0.095]}><planeGeometry args={[0.2, 0.26]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
            <mesh position={[0, 0.27, 0]}><boxGeometry args={[0.12, 0.08, 0.1]} /><meshStandardMaterial color="#c9ccd1" /></mesh>
          </>
        )}
        {item.kind === "kopi" && (
          <>
            <mesh castShadow><cylinderGeometry args={[0.17, 0.13, 0.36, 16]} /><meshStandardMaterial color="#fbf8f2" /></mesh>
            <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.175, 0.16, 0.12, 16]} /><meshStandardMaterial color="#b8683a" /></mesh>
            <mesh position={[0, 0.19, 0]}><cylinderGeometry args={[0.18, 0.18, 0.04, 16]} /><meshStandardMaterial color="#5a3a24" /></mesh>
          </>
        )}
        {item.kind === "dokumen" && (
          <>
            <mesh castShadow rotation={[0, 0, 0.1]}><boxGeometry args={[0.36, 0.46, 0.05]} /><meshStandardMaterial color={color} /></mesh>
            <mesh position={[0.02, 0.02, 0.03]} rotation={[0, 0, 0.1]}><planeGeometry args={[0.3, 0.4]} /><meshStandardMaterial color="#fbfbf8" /></mesh>
          </>
        )}
      </group>
      <pointLight position={[0, 0.8, 0]} color={color} intensity={1.5} distance={2.2} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Kuis konsep                                                        */
/* ------------------------------------------------------------------ */

export function ConceptQuiz({ options, onPick }: { options: string[]; onPick: (value: string) => void }) {
  return (
    <div className="mt-3">
      <p className="text-sm font-bold">Bonus: kontrol apa yang dilanggar?</p>
      <div className="mt-2 grid gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onPick(option)}
            className="rounded-2xl bg-card px-4 py-2.5 text-left text-sm font-bold ring-1 ring-border transition hover:bg-track-audit hover:text-white"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tantangan amankan (urutan arah)                                    */
/* ------------------------------------------------------------------ */

type Dir = "up" | "down" | "left" | "right";
const DIRS: Dir[] = ["up", "down", "left", "right"];
const DIR_ICON = { up: IconArrowUp, down: IconArrowDown, left: IconArrowLeft, right: IconArrowRight };
const KEY_DIR: Record<string, Dir> = {
  KeyW: "up", ArrowUp: "up",
  KeyS: "down", ArrowDown: "down",
  KeyA: "left", ArrowLeft: "left",
  KeyD: "right", ArrowRight: "right",
};
export const SECURE_TIME = 5;
const SECURE_STEPS = 4;

export function SecureChallenge({ aksi, onDone }: { aksi: string; onDone: (success: boolean) => void }) {
  const [sequence] = useState<Dir[]>(() => Array.from({ length: SECURE_STEPS }, () => DIRS[Math.floor(Math.random() * DIRS.length)]));
  const [step, setStep] = useState(0);
  const [miss, setMiss] = useState(false);
  const [left, setLeft] = useState(SECURE_TIME);
  const done = useRef(false);
  const finish = useRef(onDone);
  useEffect(() => {
    finish.current = onDone;
  });

  const press = (dir: Dir) => {
    if (done.current) return;
    if (dir === sequence[step]) {
      const next = step + 1;
      setStep(next);
      setMiss(false);
      if (next >= sequence.length) {
        done.current = true;
        finish.current(true);
      }
    } else {
      setStep(0);
      setMiss(true);
    }
  };
  const pressRef = useRef(press);
  useEffect(() => {
    pressRef.current = press;
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const dir = KEY_DIR[event.code];
      if (dir && !event.repeat) pressRef.current(dir);
    };
    window.addEventListener("keydown", onKey);
    const started = performance.now();
    const timer = window.setInterval(() => {
      const remain = Math.max(0, SECURE_TIME - (performance.now() - started) / 1000);
      setLeft(remain);
      if (remain <= 0 && !done.current) {
        done.current = true;
        finish.current(false);
      }
    }, 50);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="mt-3">
      <p className="flex items-center gap-2 text-sm font-bold"><IconLock className="h-4 w-4 text-track-audit" /> {aksi}</p>
      <p className="mt-1 text-xs text-muted-foreground">{controlHint("Tekan urutan arah (WASD / panah)", "Ketuk tombol arah sesuai urutan")} sebelum waktu habis. Drone tetap patroli!</p>
      <div className="mt-3 flex justify-center gap-2">
        {sequence.map((dir, index) => {
          const Icon = DIR_ICON[dir];
          return (
            <span
              key={index}
              className={cn(
                "grid h-12 w-12 place-items-center rounded-2xl ring-2 transition",
                index < step ? "bg-emerald-600 text-white ring-emerald-600" : index === step ? "bg-brand-gold text-brand-navy ring-brand-gold" : "bg-card ring-border",
              )}
            >
              <Icon className="h-6 w-6" />
            </span>
          );
        })}
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", left < 1.5 ? "bg-track-audit" : "bg-brand-gold")} style={{ width: `${(left / SECURE_TIME) * 100}%` }} />
      </div>
      {miss && <p className="mt-2 text-center text-xs font-bold text-track-audit">Salah urutan, ulangi dari awal!</p>}
      <div className="mt-3 grid grid-cols-4 gap-2">
        {DIRS.map((dir) => {
          const Icon = DIR_ICON[dir];
          return (
            <button key={dir} onClick={() => press(dir)} className="grid h-11 place-items-center rounded-2xl bg-card ring-1 ring-border active:scale-95" aria-label={dir}>
              <Icon className="h-5 w-5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
