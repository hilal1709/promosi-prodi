"use client";

import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { clampDelta } from "../world-kit";
import { groundAt, TOWER } from "./hunt-layout";

/* ------------------------------------------------------------------ */
/* Status bersama (dimutasi oleh simulasi level, dibaca model tiap frame) */
/* ------------------------------------------------------------------ */

export type SpriteMode = "bebas" | "tertangkap" | "terbang" | "selesai";

export interface SpriteSim {
  index: number;
  x: number;
  y: number;
  z: number;
  heading: number;
  mode: SpriteMode;
  /** 0..1 progres tangkapan sinar scanner. */
  capture: number;
  /** Sedang disorot scanner (untuk getaran & warna). */
  scanned: boolean;
  /** Warna setelah diklasifikasi (warna keranjang / abu-abu bila salah). */
  tint: string;
  /** Kilatan teleport 0..1. */
  blink: number;
  /** Progres terbang ke menara 0..1. */
  flight: number;
  fromX: number;
  fromY: number;
  fromZ: number;
  lookX: number;
  lookZ: number;
}

export interface BeamSim {
  active: boolean;
  power: number;
  from: THREE.Vector3;
  to: THREE.Vector3;
}

export interface TowerSim {
  /** Warna tiap cincin yang sudah terisi (urutan kedatangan). */
  rings: string[];
  /** 0..1 animasi finale (sinar ke langit). */
  finale: number;
  /** Denyut singkat saat data tiba. */
  pulse: number;
}

/** Bagian simulasi level yang dibaca model. */
export interface HuntWorldSim {
  sprites: SpriteSim[];
  beam: BeamSim;
  tower: TowerSim;
}

export type HuntSimRef = RefObject<HuntWorldSim>;

export const TOWER_TOP_Y = () => groundAt(TOWER.x, TOWER.z) + TOWER.top;

/* ------------------------------------------------------------------ */
/* Data sprite: kristal data liar yang bermata                         */
/* ------------------------------------------------------------------ */

export type SpriteShape = "kubus" | "oktahedron" | "limas" | "dodeka";

const SPRITE_CORE = "#dff9ff";
const SPRITE_GLOW = "#35c7ef";
const RING_SEGMENTS = 14;

export function DataSprite({ simRef, index, shape }: { simRef: HuntSimRef; index: number; shape: SpriteShape }) {
  const root = useRef<THREE.Group>(null);
  const core = useRef<THREE.Group>(null);
  const bits = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Mesh>(null);
  const coreMat = useRef<THREE.MeshStandardMaterial>(null);
  const pillar = useRef<THREE.Mesh>(null);
  const clock = useRef(index * 1.37);
  const color = useMemo(() => new THREE.Color(), []);
  const gold = useMemo(() => new THREE.Color("#ffc857"), []);
  const base = useMemo(() => new THREE.Color(SPRITE_GLOW), []);

  useFrame((state, raw) => {
    const delta = clampDelta(raw);
    clock.current += delta;
    const t = clock.current;
    const g = root.current;
    const sim = simRef.current.sprites[index];
    if (!g || !sim) return;
    g.visible = sim.mode !== "selesai";
    if (!g.visible) return;
    g.position.set(sim.x, sim.y, sim.z);
    // Menghadap pemain (mata mengikuti), atau arah terbang.
    const face = Math.atan2(sim.lookX - sim.x, sim.lookZ - sim.z);
    g.rotation.y += Math.atan2(Math.sin(face - g.rotation.y), Math.cos(face - g.rotation.y)) * Math.min(1, delta * 6);

    const glitch = sim.mode === "bebas" && (Math.sin(t * 7.3) > 0.93 || sim.scanned);
    if (core.current) {
      core.current.rotation.y += delta * (sim.scanned ? 5 : 1.1);
      core.current.rotation.x = Math.sin(t * 0.8) * 0.3;
      const jitter = glitch ? (Math.random() - 0.5) * 0.18 : 0;
      core.current.position.set(jitter, Math.sin(t * 2.2) * 0.12, glitch ? (Math.random() - 0.5) * 0.12 : 0);
      const pop = 1 + sim.blink * 0.8 + (sim.mode === "terbang" ? -sim.flight * 0.45 : 0);
      core.current.scale.setScalar(pop * (glitch ? 0.92 + Math.random() * 0.16 : 1));
    }
    if (coreMat.current) {
      if (sim.mode === "terbang" || sim.mode === "tertangkap") color.set(sim.mode === "terbang" ? sim.tint : "#ffc857");
      else color.copy(base).lerp(gold, sim.capture);
      coreMat.current.emissive.copy(color);
      coreMat.current.emissiveIntensity = 0.7 + Math.sin(t * 4) * 0.2 + sim.capture * 0.8;
    }
    if (bits.current) {
      bits.current.rotation.y += delta * (1.6 + sim.capture * 8);
      bits.current.children.forEach((child, k) => {
        child.position.y = Math.sin(t * 3 + k * 2) * 0.25;
        child.visible = sim.mode !== "terbang";
      });
    }
    if (eyes.current) {
      // Berkedip sesekali.
      const blinkEye = Math.sin(t * 1.3 + sim.index) > 0.985 ? 0.1 : 1;
      eyes.current.scale.y = blinkEye;
      eyes.current.visible = sim.mode !== "terbang";
    }
    if (ring.current) {
      const lit = Math.round(sim.capture * RING_SEGMENTS);
      ring.current.visible = sim.capture > 0.01 && sim.mode === "bebas";
      ring.current.rotation.y -= delta * 2;
      ring.current.children.forEach((child, k) => {
        const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        mat.color.set(k < lit ? "#ffc857" : "#33404f");
      });
    }
    if (halo.current) {
      halo.current.position.y = groundAt(sim.x, sim.z) - sim.y + 0.06;
      halo.current.visible = sim.mode === "bebas";
      const s = 1.2 + Math.sin(t * 3) * 0.1 + sim.capture * 0.6;
      halo.current.scale.setScalar(s);
    }
    if (pillar.current) {
      const d = Math.hypot(state.camera.position.x - sim.x, state.camera.position.z - sim.z);
      pillar.current.visible = sim.mode === "bebas";
      const mat = pillar.current.material as THREE.MeshBasicMaterial;
      mat.opacity = THREE.MathUtils.clamp((d - 16) / 40, 0, 1) * 0.35;
    }
  });

  const geometry = useMemo(() => {
    switch (shape) {
      case "kubus":
        return new THREE.BoxGeometry(0.9, 0.9, 0.9);
      case "limas":
        return new THREE.TetrahedronGeometry(0.75, 0);
      case "dodeka":
        return new THREE.DodecahedronGeometry(0.6, 0);
      default:
        return new THREE.OctahedronGeometry(0.7, 0);
    }
  }, [shape]);

  return (
    <group ref={root}>
      <group ref={core}>
        <mesh geometry={geometry} castShadow>
          <meshStandardMaterial ref={coreMat} color={SPRITE_CORE} emissive={SPRITE_GLOW} emissiveIntensity={0.8} roughness={0.25} metalness={0.1} flatShading transparent opacity={0.95} />
        </mesh>
        <mesh geometry={geometry} scale={1.25}>
          <meshBasicMaterial color={SPRITE_GLOW} wireframe transparent opacity={0.35} />
        </mesh>
      </group>
      <group ref={eyes} position={[0, 0.12, 0.62]}>
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.18, 0, 0]}>
            <mesh>
              <sphereGeometry args={[0.12, 10, 8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0, 0, 0.08]}>
              <sphereGeometry args={[0.06, 8, 6]} />
              <meshBasicMaterial color="#10131a" />
            </mesh>
          </group>
        ))}
      </group>
      <group ref={bits}>
        {[0, 1, 2, 3].map((k) => (
          <mesh key={k} position={[Math.cos((k / 4) * Math.PI * 2) * 1.05, 0, Math.sin((k / 4) * Math.PI * 2) * 1.05]}>
            <boxGeometry args={[0.14, 0.14, 0.14]} />
            <meshBasicMaterial color={k % 2 ? "#7ee8fa" : "#ffffff"} />
          </mesh>
        ))}
      </group>
      <group ref={ring} visible={false}>
        {Array.from({ length: RING_SEGMENTS }, (_, k) => {
          const a = (k / RING_SEGMENTS) * Math.PI * 2;
          return (
            <mesh key={k} position={[Math.cos(a) * 1.55, 0, Math.sin(a) * 1.55]} rotation={[0, -a, 0]}>
              <boxGeometry args={[0.1, 0.1, 0.5]} />
              <meshBasicMaterial color="#33404f" toneMapped={false} />
            </mesh>
          );
        })}
      </group>
      <mesh ref={halo} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.7, 0.95, 32]} />
        <meshBasicMaterial color={SPRITE_GLOW} transparent opacity={0.5} depthWrite={false} />
      </mesh>
      {/* Pilar sinyal: terlihat dari jauh, memudar saat didekati. */}
      <mesh ref={pillar} position={[0, 20, 0]}>
        <cylinderGeometry args={[0.35, 0.6, 40, 8, 1, true]} />
        <meshBasicMaterial color="#7ee8fa" transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} fog={false} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Sinar scanner                                                        */
/* ------------------------------------------------------------------ */

export function ScannerBeam({ simRef }: { simRef: HuntSimRef }) {
  const mesh = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.Mesh>(null);
  const tip = useRef<THREE.Mesh>(null);
  const mid = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const clock = useRef(0);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    const beam = simRef.current.beam;
    const show = beam.active;
    [mesh.current, glow.current, tip.current].forEach((m) => {
      if (m) m.visible = show;
    });
    if (!show) return;
    mid.copy(beam.from).add(beam.to).multiplyScalar(0.5);
    dir.copy(beam.to).sub(beam.from);
    const length = dir.length();
    dir.normalize();
    const flicker = 0.8 + Math.sin(clock.current * 40) * 0.2;
    [mesh.current, glow.current].forEach((m, k) => {
      if (!m) return;
      m.position.copy(mid);
      m.quaternion.setFromUnitVectors(up, dir);
      const w = (k ? 3.2 : 1) * (0.6 + beam.power * 0.8) * flicker;
      m.scale.set(w, length, w);
    });
    if (tip.current) {
      tip.current.position.copy(beam.to);
      tip.current.scale.setScalar(0.6 + Math.sin(clock.current * 25) * 0.2 + beam.power * 0.6);
    }
  });
  return (
    <>
      <mesh ref={mesh} visible={false}>
        <cylinderGeometry args={[0.05, 0.05, 1, 6, 1, true]} />
        <meshBasicMaterial color="#fff6d6" toneMapped={false} />
      </mesh>
      <mesh ref={glow} visible={false}>
        <cylinderGeometry args={[0.05, 0.05, 1, 8, 1, true]} />
        <meshBasicMaterial color="#ffc857" transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={tip} visible={false}>
        <icosahedronGeometry args={[0.35, 1]} />
        <meshBasicMaterial color="#ffe29a" transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Menara Data Lake                                                    */
/* ------------------------------------------------------------------ */

export function DataLakeTower({ simRef, total }: { simRef: HuntSimRef; total: number }) {
  const ringRefs = useRef<(THREE.Mesh | null)[]>([]);
  const liquid = useRef<THREE.Mesh>(null);
  const dish = useRef<THREE.Group>(null);
  const beacon = useRef<THREE.MeshBasicMaterial>(null);
  const skyBeam = useRef<THREE.Mesh>(null);
  const shell = useRef<THREE.MeshStandardMaterial>(null);
  const clock = useRef(0);
  const base = groundAt(TOWER.x, TOWER.z);
  const columnH = TOWER.top - 5;
  const fill = useRef(0);

  useFrame((_, raw) => {
    const delta = clampDelta(raw);
    clock.current += delta;
    const t = clock.current;
    const tower = simRef.current.tower;
    tower.pulse = Math.max(0, tower.pulse - delta * 1.5);
    fill.current = THREE.MathUtils.damp(fill.current, tower.rings.length / total, 3, delta);
    ringRefs.current.forEach((ring, k) => {
      if (!ring) return;
      const mat = ring.material as THREE.MeshStandardMaterial;
      const on = k < tower.rings.length;
      mat.color.set(on ? tower.rings[k] : "#2c3440");
      mat.emissive.set(on ? tower.rings[k] : "#000000");
      mat.emissiveIntensity = on ? 0.9 + Math.sin(t * 3 + k) * 0.25 + tower.finale : 0;
      ring.rotation.z = on ? t * (k % 2 ? 0.6 : -0.6) : 0;
    });
    if (liquid.current) {
      const h = Math.max(0.01, fill.current) * columnH;
      liquid.current.scale.y = h;
      liquid.current.position.y = 3 + h / 2;
    }
    if (shell.current) shell.current.emissiveIntensity = 0.25 + tower.pulse * 1.2 + tower.finale * 0.8;
    if (dish.current) dish.current.rotation.y += delta * (0.4 + tower.finale * 3);
    if (beacon.current) beacon.current.color.setHSL(0.52, 0.9, 0.55 + Math.sin(t * 4) * 0.2);
    if (skyBeam.current) {
      skyBeam.current.visible = tower.finale > 0.01;
      skyBeam.current.scale.set(0.3 + tower.finale * 1.2, tower.finale, 0.3 + tower.finale * 1.2);
      skyBeam.current.position.y = TOWER.top + 2 + (tower.finale * 220) / 2;
    }
  });

  return (
    <group position={[TOWER.x, base, TOWER.z]}>
      {/* Alas batu bertingkat */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[6.2, 7, 1.2, 10]} />
        <meshStandardMaterial color="#b9b3a3" flatShading roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[4.6, 5.4, 1, 10]} />
        <meshStandardMaterial color="#d6d0c0" flatShading />
      </mesh>
      {/* Kaki penyangga */}
      {[0, 1, 2, 3].map((k) => {
        const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
        return (
          <mesh key={k} position={[Math.cos(a) * 2.6, 2 + columnH / 2, Math.sin(a) * 2.6]} castShadow>
            <boxGeometry args={[0.35, columnH + 2, 0.35]} />
            <meshStandardMaterial color="#e9ecef" metalness={0.5} roughness={0.35} />
          </mesh>
        );
      })}
      {/* Tabung kaca & cairan data */}
      <mesh position={[0, 3 + columnH / 2, 0]}>
        <cylinderGeometry args={[1.6, 1.6, columnH, 20, 1, true]} />
        <meshStandardMaterial ref={shell} color="#bfe9ff" emissive="#35c7ef" emissiveIntensity={0.25} transparent opacity={0.28} roughness={0.05} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh ref={liquid} position={[0, 3, 0]}>
        <cylinderGeometry args={[1.45, 1.45, 1, 20]} />
        <meshStandardMaterial color="#4cc9f0" emissive="#35c7ef" emissiveIntensity={0.9} transparent opacity={0.85} />
      </mesh>
      {/* Cincin progres: 1 per data yang dibersihkan */}
      {Array.from({ length: total }, (_, k) => (
        <mesh key={k} ref={(node) => { ringRefs.current[k] = node; }} position={[0, 3.4 + (k / (total - 1)) * (columnH - 1), 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.05, 0.13, 6, 24]} />
          <meshStandardMaterial color="#2c3440" metalness={0.4} roughness={0.4} />
        </mesh>
      ))}
      {/* Puncak: parabola & suar */}
      <mesh position={[0, TOWER.top - 1.6, 0]} castShadow>
        <cylinderGeometry args={[2.4, 1.8, 0.8, 12]} />
        <meshStandardMaterial color="#f1f3f5" metalness={0.4} roughness={0.3} />
      </mesh>
      <group ref={dish} position={[0, TOWER.top - 0.6, 0]}>
        <mesh position={[0.9, 0.9, 0]} rotation={[0, 0, -0.9]} castShadow>
          <sphereGeometry args={[1.1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.6]} />
          <meshStandardMaterial color="#ffffff" side={THREE.DoubleSide} metalness={0.3} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.1, 0.14, 1.4, 6]} />
          <meshStandardMaterial color="#adb5bd" />
        </mesh>
      </group>
      <mesh position={[0, TOWER.top + 1.3, 0]}>
        <sphereGeometry args={[0.45, 12, 10]} />
        <meshBasicMaterial ref={beacon} color="#4cc9f0" toneMapped={false} />
      </mesh>
      <mesh ref={skyBeam} visible={false}>
        <cylinderGeometry args={[1.2, 1.8, 220, 16, 1, true]} />
        <meshBasicMaterial color="#9bf6ff" transparent opacity={0.45} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} fog={false} />
      </mesh>
      {/* Pipa data ke tanah */}
      {[0, 1, 2].map((k) => {
        const a = (k / 3) * Math.PI * 2;
        return (
          <mesh key={k} position={[Math.cos(a) * 5.4, 0.35, Math.sin(a) * 5.4]} rotation={[0, -a, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 3, 8]} />
            <meshStandardMaterial color="#6c757d" metalness={0.6} roughness={0.3} emissive="#35c7ef" emissiveIntensity={0.15} />
          </mesh>
        );
      })}
    </group>
  );
}
