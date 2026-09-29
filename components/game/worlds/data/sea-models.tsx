"use client";

import { memo, useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import * as THREE from "three";
import CharacterModel, { type CharacterMotion } from "@/components/game/character-model";
import type { GameAvatarId } from "@/lib/types";
import { clampDelta } from "../world-kit";
import { canvasTexture, fitText } from "../erp/race-scenery";
import { StiltHouse } from "./river-scenery";
import {
  BOTTLES,
  DOCK_RADIUS,
  FORECASTS,
  JELLIES,
  LIGHTHOUSE_DOCK,
  LIGHTHOUSE_ISLAND,
  ROCKS,
  SHOP_DOCKS,
  terrainHeight,
  WHIRLPOOLS,
  WRECK,
  type Dock,
} from "./sea-layout";

/* ------------------------------------------------------------------ */
/* State simulasi bersama (dibaca model tiap frame, tanpa re-render)     */
/* ------------------------------------------------------------------ */

export interface ShipSim {
  x: number;
  z: number;
  heading: number;
  speed: number;
  /** Tinggi layar 0..1. */
  sail: number;
  rudder: number;
  roll: number;
  pitch: number;
  y: number;
  stamina: number;
  tired: boolean;
  boost: boolean;
  hull: number;
  /** Detik sejak tabrakan terakhir (untuk kedip kerusakan). */
  hurt: number;
}

export interface JellySim {
  x: number;
  z: number;
  alive: boolean;
  /** 0..1 animasi meletus setelah tertembak. */
  pop: number;
  phase: number;
  vx: number;
  vz: number;
  cool: number;
}

export interface ShotSim {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  target: number;
}

/** null = belum dikirim, true = prediksi tepat, false = meleset. */
export type DeliveryState = boolean | null;

export interface SeaSim {
  time: number;
  wind: number;
  ship: ShipSim;
  jellies: JellySim[];
  shots: ShotSim[];
  bottles: boolean[];
  deliveries: DeliveryState[];
  evidence: boolean;
}

export type SeaSimRef = RefObject<SeaSim>;

export const OK_COLOR = "#2fae66";
export const BAD_COLOR = "#e54b4b";
const GOLD = "#ffc857";

const tmpColor = new THREE.Color();

/* ------------------------------------------------------------------ */
/* Label kanvas                                                         */
/* ------------------------------------------------------------------ */

function labelTexture(top: string, big: string, bg = "#fff7e6", ink = "#1e1e24", accent = "#e76f51") {
  return canvasTexture(256, 160, (g) => {
    g.fillStyle = bg;
    g.beginPath();
    g.roundRect(4, 4, 248, 152, 26);
    g.fill();
    g.lineWidth = 8;
    g.strokeStyle = accent;
    g.stroke();
    g.fillStyle = ink;
    g.textAlign = "center";
    g.textBaseline = "middle";
    fitText(g, top, 220, 34, 800);
    g.fillText(top, 128, 46);
    fitText(g, big, 224, 64, 900);
    g.fillText(big, 128, 108);
  });
}

function sailTexture() {
  return canvasTexture(256, 256, (g) => {
    g.fillStyle = "#f3ead3";
    g.fillRect(0, 0, 256, 256);
    g.strokeStyle = "rgba(120,100,70,.18)";
    g.lineWidth = 3;
    for (let y = 20; y < 256; y += 36) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(256, y);
      g.stroke();
    }
    // Lambang grafik batang di layar utama.
    const bars = [60, 95, 75, 130];
    bars.forEach((h, k) => {
      g.fillStyle = ["#2a6f97", "#e76f51", "#2a9d8f", "#ffc857"][k];
      g.fillRect(58 + k * 38, 190 - h, 26, h);
    });
    g.fillStyle = "#1e1e24";
    g.fillRect(50, 192, 160, 5);
  });
}

/* ------------------------------------------------------------------ */
/* Kapal pinisi + avatar nakhoda                                        */
/* ------------------------------------------------------------------ */

function hullGeometry() {
  // Profil samping: haluan di u negatif (menjadi +z setelah diputar).
  const s = new THREE.Shape();
  s.moveTo(-6.4, 2.5);
  s.quadraticCurveTo(-5.4, 0.2, -3.6, -0.55);
  s.lineTo(3.6, -0.55);
  s.quadraticCurveTo(4.8, -0.2, 5, 1.1);
  s.lineTo(5.1, 2.3);
  s.quadraticCurveTo(0, 1.5, -6.4, 2.5);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 3.2, bevelEnabled: true, bevelThickness: 0.35, bevelSize: 0.3, bevelSegments: 2, curveSegments: 10 });
  geo.translate(0, 0, -1.6);
  geo.rotateY(Math.PI / 2);
  // Ramping ke haluan & buritan.
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i);
    const y = pos.getY(i);
    const taper = z > 2 ? 1 - ((z - 2) / 4.6) * 0.75 : z < -3 ? 1 - ((-3 - z) / 2.4) * 0.25 : 1;
    const keel = 1 - THREE.MathUtils.smoothstep(-y, -0.2, 0.9) * 0.45;
    pos.setX(i, pos.getX(i) * taper * keel);
  }
  geo.computeVertexNormals();
  return geo;
}

/** Layar melengkung (bidang YZ); skala X = besar kembungan. */
function sailGeometry(width: number, height: number, triangle = false) {
  const geo = new THREE.PlaneGeometry(width, height, 8, 8);
  geo.rotateY(Math.PI / 2);
  geo.translate(0, height / 2, -width / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const u = -pos.getZ(i) / width;
    const v = pos.getY(i) / height;
    // Jib: puncak di belakang-atas (tiang), kaki di sepanjang cucur.
    if (triangle) pos.setZ(i, -width + (pos.getZ(i) + width) * (1 - v));
    pos.setX(i, Math.sin(Math.PI * u) * Math.sin(Math.PI * (0.15 + v * 0.7)) * 0.9);
  }
  geo.computeVertexNormals();
  return geo;
}

export const Pinisi = memo(function Pinisi({ simRef, avatar, groupRef }: { simRef: SeaSimRef; avatar: GameAvatarId; groupRef: RefObject<THREE.Group | null> }) {
  const body = useRef<THREE.Group>(null);
  const booms = useRef<(THREE.Group | null)[]>([]);
  const jibs = useRef<(THREE.Group | null)[]>([]);
  const flag = useRef<THREE.Group>(null);
  const cargo = useRef<(THREE.Mesh | null)[]>([]);
  const cannon = useRef<THREE.Mesh>(null);
  const motion = useRef<CharacterMotion>({ phase: 0, moving: false });
  const geo = useMemo(() => ({ hull: hullGeometry(), main: sailGeometry(4.6, 6.4), fore: sailGeometry(3.8, 5.4), jib: sailGeometry(4.8, 6, true) }), []);
  const sailMap = useMemo(() => sailTexture(), []);
  useFrame(() => {
    const sim = simRef.current;
    const ship = sim.ship;
    const g = groupRef.current;
    if (!g) return;
    g.position.set(ship.x, ship.y, ship.z);
    g.rotation.set(0, ship.heading, 0);
    if (body.current) body.current.rotation.set(ship.pitch, 0, ship.roll, "YXZ");
    // Angin relatif terhadap kapal: layar dikembangkan ke sisi bawah angin.
    const rel = Math.atan2(Math.sin(sim.wind - ship.heading), Math.cos(sim.wind - ship.heading));
    const side = rel >= 0 ? 1 : -1;
    const swing = THREE.MathUtils.clamp(Math.abs(rel) * 0.55, 0.12, 1.25) * side;
    const billow = (0.2 + ship.sail * 0.9) * side;
    booms.current.forEach((boom) => {
      if (!boom) return;
      boom.rotation.y = THREE.MathUtils.lerp(boom.rotation.y, -swing, 0.06);
      boom.scale.set(billow, 0.3 + ship.sail * 0.7, 1);
    });
    jibs.current.forEach((jib) => {
      if (!jib) return;
      jib.rotation.y = THREE.MathUtils.lerp(jib.rotation.y, -swing * 0.35, 0.06);
      jib.scale.set(billow * 0.8, 0.3 + ship.sail * 0.7, 1);
    });
    if (flag.current) flag.current.rotation.y = rel + Math.PI + Math.sin(sim.time * 9) * 0.12;
    const loaded = FORECASTS.length - sim.deliveries.filter((d) => d !== null).length;
    cargo.current.forEach((box, k) => {
      if (box) box.visible = k < loaded;
    });
    if (cannon.current) {
      const m = cannon.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 0.8 + Math.sin(sim.time * 5) * 0.4;
    }
    motion.current.moving = false;
  });
  const cargoSlots = useMemo(() => Array.from({ length: FORECASTS.length }, (_, k) => [(k % 2 ? 0.55 : -0.55), 2.35 + Math.floor(k / 4) * 0.55, -0.4 + ((k >> 1) % 2) * 0.7] as [number, number, number]), []);
  return (
    <group ref={groupRef}>
      <group ref={body}>
        <mesh geometry={geo.hull} castShadow receiveShadow>
          <meshStandardMaterial color="#7a4a2a" roughness={0.65} />
        </mesh>
        {/* Garis cat & pagar dek */}
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh position={[side * 1.92, 1.35, -0.6]}>
              <boxGeometry args={[0.08, 0.28, 8.4]} />
              <meshStandardMaterial color="#f1ede4" />
            </mesh>
            <mesh position={[side * 1.95, 1.05, -0.6]}>
              <boxGeometry args={[0.08, 0.14, 8.2]} />
              <meshStandardMaterial color="#2a6f97" />
            </mesh>
            <mesh position={[side * 1.7, 2.55, -0.8]}>
              <boxGeometry args={[0.1, 0.1, 8.4]} />
              <meshStandardMaterial color="#5a3a22" />
            </mesh>
          </group>
        ))}
        {/* Dek papan */}
        <mesh position={[0, 2.03, -0.6]} receiveShadow>
          <boxGeometry args={[3.2, 0.12, 8.6]} />
          <meshStandardMaterial color="#c9a36b" />
        </mesh>
        {/* Rumah buritan */}
        <mesh position={[0, 2.75, -4.1]} castShadow>
          <boxGeometry args={[2.8, 1.3, 2]} />
          <meshStandardMaterial color="#f1ede4" />
        </mesh>
        <mesh position={[0, 3.5, -4.1]} castShadow>
          <boxGeometry args={[3.1, 0.18, 2.4]} />
          <meshStandardMaterial color="#9c3d2e" />
        </mesh>
        {[-0.8, 0.8].map((x) => (
          <mesh key={x} position={[x, 2.85, -3.08]}>
            <boxGeometry args={[0.55, 0.45, 0.05]} />
            <meshStandardMaterial color="#2e3a44" emissive="#ffcf7a" emissiveIntensity={0.5} />
          </mesh>
        ))}
        {/* Lentera buritan */}
        {[-1.3, 1.3].map((x) => (
          <mesh key={x} position={[x, 3.9, -5]}>
            <sphereGeometry args={[0.16, 8, 6]} />
            <meshStandardMaterial color="#ffd89a" emissive="#ffb347" emissiveIntensity={1.4} />
          </mesh>
        ))}
        {/* Nakhoda di atas rumah buritan */}
        <group position={[0, 3.6, -4]}>
          <CharacterModel avatar={avatar} motion={motion} />
        </group>
        <mesh position={[0, 4.3, -3.1]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.38, 0.05, 6, 14]} />
          <meshStandardMaterial color="#6b4a2f" />
        </mesh>
        {/* Muatan semen */}
        {cargoSlots.map((p, k) => (
          <mesh key={k} ref={(node) => { cargo.current[k] = node; }} position={p} castShadow>
            <boxGeometry args={[0.95, 0.5, 0.62]} />
            <meshStandardMaterial color={k % 3 === 0 ? "#d9d4c7" : "#c8c1b0"} />
          </mesh>
        ))}
        {/* Tiang */}
        {[
          { z: 1.9, h: 9.5 },
          { z: -1.6, h: 10.8 },
        ].map((mast, k) => (
          <group key={k} position={[0, 2, mast.z]}>
            <mesh position={[0, mast.h / 2, 0]} castShadow>
              <cylinderGeometry args={[0.1, 0.16, mast.h, 7]} />
              <meshStandardMaterial color="#5a3a22" />
            </mesh>
            <group ref={(node) => { booms.current[k] = node; }} position={[0, 1.4, 0]}>
              <mesh geometry={k ? geo.main : geo.fore} castShadow>
                <meshStandardMaterial map={k ? sailMap : undefined} color={k ? "#ffffff" : "#efe4c8"} side={THREE.DoubleSide} roughness={0.9} />
              </mesh>
            </group>
            {k === 1 && (
              <group ref={flag} position={[0, mast.h + 0.1, 0]}>
                <mesh position={[0, 0, 0.55]}>
                  <planeGeometry args={[0.04, 0.5]} />
                  <meshBasicMaterial color="#e63946" />
                </mesh>
                <mesh position={[0, 0.12, 0.55]} rotation={[0, Math.PI / 2, 0]}>
                  <planeGeometry args={[1.1, 0.24]} />
                  <meshBasicMaterial color="#e63946" side={THREE.DoubleSide} />
                </mesh>
                <mesh position={[0, -0.12, 0.55]} rotation={[0, Math.PI / 2, 0]}>
                  <planeGeometry args={[1.1, 0.24]} />
                  <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
                </mesh>
              </group>
            )}
          </group>
        ))}
        {/* Cucur (bowsprit) & layar jib */}
        <mesh position={[0, 2.9, 6.6]} rotation={[Math.PI / 2 - 0.25, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.1, 3.4, 6]} />
          <meshStandardMaterial color="#5a3a22" />
        </mesh>
        <group ref={(node) => { jibs.current[0] = node; }} position={[0, 3.2, 7.9]}>
          <mesh geometry={geo.jib} castShadow>
            <meshStandardMaterial color="#f7efdc" side={THREE.DoubleSide} roughness={0.9} />
          </mesh>
        </group>
        {/* Meriam sonar di haluan */}
        <group position={[0, 2.5, 4.6]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.22, 0.3, 1.4, 10]} />
            <meshStandardMaterial color="#2b2f36" metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh ref={cannon} position={[0, 0, 0.72]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.26, 0.06, 6, 14]} />
            <meshStandardMaterial color="#7ee8fa" emissive="#35c7ef" emissiveIntensity={1} />
          </mesh>
        </group>
      </group>
    </group>
  );
});

/* ------------------------------------------------------------------ */
/* Jejak buih                                                           */
/* ------------------------------------------------------------------ */

const WAKE = 90;

export function Wake({ simRef }: { simRef: SeaSimRef }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const parts = useMemo(() => Array.from({ length: WAKE }, () => ({ x: 0, z: 0, vx: 0, vz: 0, age: 9, life: 2, size: 1 })), []);
  const cursor = useRef(0);
  const timer = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const geometry = useMemo(() => new THREE.CircleGeometry(1, 10).rotateX(-Math.PI / 2), []);
  useFrame((_, raw) => {
    const delta = clampDelta(raw);
    const ship = simRef.current.ship;
    const m = mesh.current;
    if (!m) return;
    const fx = Math.sin(ship.heading);
    const fz = Math.cos(ship.heading);
    timer.current -= delta;
    if (timer.current <= 0 && Math.abs(ship.speed) > 1.2) {
      timer.current = 0.05;
      const spawn = (ox: number, oz: number, side: number, size: number) => {
        const p = parts[cursor.current];
        cursor.current = (cursor.current + 1) % WAKE;
        Object.assign(p, {
          x: ship.x + fx * oz + fz * ox,
          z: ship.z + fz * oz - fx * ox,
          vx: fz * side * 1.4,
          vz: -fx * side * 1.4,
          age: 0,
          life: 1.6 + Math.random() * 0.9,
          size: size * (0.6 + Math.min(1, ship.speed / 14) * 0.8),
        });
      };
      spawn(1.3, 4.6, 1, 0.55);
      spawn(-1.3, 4.6, -1, 0.55);
      spawn((Math.random() - 0.5) * 1.6, -5.6, 0, 0.8);
    }
    parts.forEach((p, i) => {
      p.age += delta;
      const k = p.age / p.life;
      if (k >= 1) {
        dummy.scale.setScalar(0.0001);
      } else {
        p.x += p.vx * delta;
        p.z += p.vz * delta;
        dummy.position.set(p.x, 0.07, p.z);
        dummy.scale.setScalar(p.size * (0.35 + k * 1.1) * (1 - k * k));
      }
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, WAKE]} frustumCulled={false} renderOrder={2}>
      <meshBasicMaterial color="#ffffff" transparent opacity={0.42} depthWrite={false} />
    </instancedMesh>
  );
}

/* ------------------------------------------------------------------ */
/* Ubur-ubur data (normal & anomali)                                    */
/* ------------------------------------------------------------------ */

function JellyOne({ simRef, index }: { simRef: SeaSimRef; index: number }) {
  const def = JELLIES[index];
  const group = useRef<THREE.Group>(null);
  const bell = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.Mesh>(null);
  const label = useRef<THREE.Group>(null);
  const tentacles = useRef<(THREE.Mesh | null)[]>([]);
  const texture = useMemo(() => labelTexture(`Toko ${def.toko}`, def.teks, "#10131a", "#ffffff", def.color), [def]);
  const base = useMemo(() => new THREE.Color(def.color), [def]);
  useFrame(() => {
    const sim = simRef.current;
    const j = sim.jellies[index];
    const g = group.current;
    if (!g) return;
    if (!j.alive && j.pop >= 1) {
      g.visible = false;
      return;
    }
    const dist = Math.hypot(j.x - sim.ship.x, j.z - sim.ship.z);
    g.visible = dist < 260;
    if (!g.visible) return;
    const t = sim.time + j.phase;
    const pulse = Math.sin(t * (def.anomali ? 3.4 : 2.2));
    g.position.set(j.x, 1.4 + pulse * 0.25, j.z);
    const pop = j.alive ? 0 : j.pop;
    const s = (1 - pop) * (1 + pulse * 0.08);
    g.scale.set(s * (1 + pop * 2), s, s * (1 + pop * 2));
    if (bell.current) {
      bell.current.scale.set(1 + pulse * 0.12, 1 - pulse * 0.1, 1 + pulse * 0.12);
      const m = bell.current.material as THREE.MeshStandardMaterial;
      // Anomali sesekali "glitch" — warna berkedip & bentuk tersentak.
      const glitch = def.anomali && Math.sin(t * 1.9) > 0.93;
      m.emissive.copy(glitch ? tmpColor.set("#ff3b3b") : base);
      m.emissiveIntensity = glitch ? 1.4 : 0.55;
      if (glitch) bell.current.position.x = (Math.random() - 0.5) * 0.25;
      else bell.current.position.x = 0;
    }
    if (core.current) core.current.rotation.y = t * 1.5;
    tentacles.current.forEach((tent, k) => {
      if (tent) tent.rotation.x = Math.sin(t * 2.4 + k) * 0.35;
    });
    if (label.current) label.current.visible = j.alive && dist < 75;
  });
  return (
    <group ref={group} position={[def.x, 1.4, def.z]}>
      <mesh ref={bell} castShadow>
        <sphereGeometry args={[1.25, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={def.color} emissive={def.color} emissiveIntensity={0.55} transparent opacity={0.72} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={core} position={[0, 0.45, 0]}>
        <octahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial color="#ffffff" emissive={def.color} emissiveIntensity={1.2} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((k) => {
        const a = (k / 6) * Math.PI * 2;
        return (
          <group key={k} position={[Math.sin(a) * 0.75, 0, Math.cos(a) * 0.75]}>
            <mesh ref={(node) => { tentacles.current[k] = node; }} position={[0, -0.9, 0]}>
              <cylinderGeometry args={[0.05, 0.02, 1.8, 4]} />
              <meshStandardMaterial color={def.color} emissive={def.color} emissiveIntensity={0.6} transparent opacity={0.7} />
            </mesh>
          </group>
        );
      })}
      <group ref={label}>
        <Billboard position={[0, 3.1, 0]}>
          <mesh>
            <planeGeometry args={[3.4, 2.125]} />
            <meshBasicMaterial map={texture} toneMapped={false} transparent />
          </mesh>
        </Billboard>
      </group>
    </group>
  );
}

export const Jellies = memo(function Jellies({ simRef }: { simRef: SeaSimRef }) {
  return (
    <>
      {JELLIES.map((jelly) => (
        <JellyOne key={jelly.id} simRef={simRef} index={jelly.id} />
      ))}
    </>
  );
});

/* ------------------------------------------------------------------ */
/* Tembakan sonar                                                       */
/* ------------------------------------------------------------------ */

export const MAX_SHOTS = 6;

export function Shots({ simRef }: { simRef: SeaSimRef }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  useFrame(() => {
    const shots = simRef.current.shots;
    refs.current.forEach((g, k) => {
      const shot = shots[k];
      if (!g) return;
      g.visible = !!shot && shot.life > 0;
      if (!g.visible) return;
      g.position.set(shot.x, shot.y, shot.z);
      g.rotation.y = Math.atan2(shot.vx, shot.vz);
      const s = 1 + Math.sin(shot.life * 40) * 0.15;
      g.scale.set(s, s, s);
    });
  });
  return (
    <>
      {Array.from({ length: MAX_SHOTS }, (_, k) => (
        <group key={k} ref={(node) => { refs.current[k] = node; }} visible={false}>
          <mesh>
            <sphereGeometry args={[0.45, 12, 10]} />
            <meshStandardMaterial color="#e0fbff" emissive="#35c7ef" emissiveIntensity={2} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0, -0.9]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.35, 1.6, 10, 1, true]} />
            <meshBasicMaterial color="#7ee8fa" transparent opacity={0.45} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[0, 0, 0]}>
            <torusGeometry args={[0.7, 0.05, 6, 20]} />
            <meshBasicMaterial color="#7ee8fa" transparent opacity={0.6} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Botol pesan emas                                                     */
/* ------------------------------------------------------------------ */

export const Bottles = memo(function Bottles({ simRef }: { simRef: SeaSimRef }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  useFrame(() => {
    const sim = simRef.current;
    refs.current.forEach((g, k) => {
      if (!g) return;
      g.visible = !sim.bottles[k];
      if (!g.visible) return;
      g.position.y = 0.35 + Math.sin(sim.time * 2 + k) * 0.18;
      g.rotation.set(0.5 + Math.sin(sim.time * 1.3 + k) * 0.2, sim.time * 0.8 + k, 0);
    });
  });
  return (
    <>
      {BOTTLES.map((b, k) => (
        <group key={k} ref={(node) => { refs.current[k] = node; }} position={[b.x, 0.35, b.z]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.3, 0.3, 1, 10]} />
            <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.9} transparent opacity={0.85} />
          </mesh>
          <mesh position={[0.65, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.12, 0.22, 0.4, 8]} />
            <meshStandardMaterial color="#c9a36b" />
          </mesh>
          <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1, 1.3, 20]} />
            <meshBasicMaterial color="#fff3c4" transparent opacity={0.5} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </>
  );
});

/* ------------------------------------------------------------------ */
/* Pusaran & batu karang                                                */
/* ------------------------------------------------------------------ */

function whirlTexture() {
  const t = canvasTexture(256, 256, (g) => {
    g.clearRect(0, 0, 256, 256);
    g.translate(128, 128);
    for (let arm = 0; arm < 4; arm++) {
      g.beginPath();
      for (let k = 0; k < 90; k++) {
        const a = arm * (Math.PI / 2) + k * 0.07;
        const r = 6 + k * 1.35;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (k) g.lineTo(x, y);
        else g.moveTo(x, y);
      }
      g.strokeStyle = "rgba(255,255,255,.75)";
      g.lineWidth = 7;
      g.stroke();
    }
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, 40);
    grad.addColorStop(0, "rgba(10,40,60,.9)");
    grad.addColorStop(1, "rgba(10,40,60,0)");
    g.fillStyle = grad;
    g.beginPath();
    g.arc(0, 0, 40, 0, Math.PI * 2);
    g.fill();
  });
  return t;
}

export function Whirlpools() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const texture = useMemo(() => whirlTexture(), []);
  useFrame((_, raw) => {
    const delta = clampDelta(raw);
    refs.current.forEach((m, k) => {
      if (m) m.rotation.z += delta * (1.6 + k * 0.2);
    });
  });
  return (
    <>
      {WHIRLPOOLS.map((w, k) => (
        <group key={k} position={[w.x, 0.1, w.z]}>
          <mesh ref={(node) => { refs.current[k] = node; }} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[w.r, 32]} />
            <meshBasicMaterial map={texture} transparent depthWrite={false} color="#dff6ff" />
          </mesh>
          <mesh position={[0, -0.6, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[w.r * 0.45, 2.4, 24, 1, true]} />
            <meshStandardMaterial color="#1d5f7a" transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </>
  );
}

export const Rocks = memo(function Rocks() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const foam = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => new THREE.DodecahedronGeometry(1, 0), []);
  const ring = useMemo(() => new THREE.RingGeometry(1, 1.45, 14).rotateX(-Math.PI / 2), []);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    ROCKS.forEach((rock, i) => {
      o.position.set(rock.x, rock.h * 0.3 - 0.4, rock.z);
      o.rotation.set(i * 0.7, i * 1.3, i * 0.4);
      o.scale.set(rock.r, rock.h, rock.r * 0.9);
      o.updateMatrix();
      mesh.current?.setMatrixAt(i, o.matrix);
      mesh.current?.setColorAt(i, col.set(i % 3 ? "#6f6c64" : "#857f73"));
      o.position.set(rock.x, 0.06, rock.z);
      o.rotation.set(0, i, 0);
      o.scale.setScalar(rock.r * 1.05);
      o.updateMatrix();
      foam.current?.setMatrixAt(i, o.matrix);
    });
    if (mesh.current) {
      mesh.current.instanceMatrix.needsUpdate = true;
      if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
      mesh.current.computeBoundingSphere();
    }
    if (foam.current) {
      foam.current.instanceMatrix.needsUpdate = true;
      foam.current.computeBoundingSphere();
    }
  }, []);
  return (
    <>
      <instancedMesh ref={mesh} args={[geometry, undefined, ROCKS.length]} castShadow receiveShadow>
        <meshStandardMaterial flatShading roughness={1} />
      </instancedMesh>
      <instancedMesh ref={foam} args={[ring, undefined, ROCKS.length]}>
        <meshBasicMaterial color="#ffffff" transparent opacity={0.5} depthWrite={false} />
      </instancedMesh>
    </>
  );
});

/* ------------------------------------------------------------------ */
/* Dermaga, toko pulau, penanda labuh                                   */
/* ------------------------------------------------------------------ */

export function Pier({ dock, width = 2.2 }: { dock: Dock; width?: number }) {
  const cx = (dock.x + dock.land.x) / 2;
  const cz = (dock.z + dock.land.z) / 2;
  const posts = Math.max(2, Math.round(dock.len / 3));
  return (
    <group position={[cx, 0, cz]} rotation={[0, dock.rot, 0]}>
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.16, dock.len + 1]} />
        <meshStandardMaterial color="#9a7a52" />
      </mesh>
      {Array.from({ length: posts + 1 }, (_, k) => {
        const z = -dock.len / 2 + (k / posts) * dock.len;
        return [-1, 1].map((side) => (
          <mesh key={`${k}${side}`} position={[side * (width / 2 - 0.1), 0, z]} castShadow>
            <cylinderGeometry args={[0.12, 0.14, 2.6, 6]} />
            <meshStandardMaterial color="#5a3f28" />
          </mesh>
        ));
      })}
    </group>
  );
}

const SHOP_WALLS = ["#f1e3c6", "#e6ccb2", "#cfe1b9", "#f4d6cc", "#e9d8a6", "#d8e2dc", "#ffe5b4"];
const SHOP_ROOFS = ["#9c3d2e", "#2a9d8f", "#bc6c25", "#6d597a"];

export const IslandShops = memo(function IslandShops({ simRef }: { simRef: SeaSimRef }) {
  const signs = useMemo(() => SHOP_DOCKS.map((dock) => labelTexture("TOKO", FORECASTS[dock.island.shop!].toko, "#1e1e24", "#ffffff", GOLD)), []);
  const lamps = useRef<(THREE.Mesh | null)[]>([]);
  const stacks = useRef<(THREE.Group | null)[]>([]);
  useFrame(() => {
    const sim = simRef.current;
    lamps.current.forEach((lamp, k) => {
      if (!lamp) return;
      const st = sim.deliveries[k];
      const m = lamp.material as THREE.MeshStandardMaterial;
      tmpColor.set(st === true ? OK_COLOR : st === false ? BAD_COLOR : GOLD);
      m.color.copy(tmpColor);
      m.emissive.copy(tmpColor);
      m.emissiveIntensity = st === null ? 0.6 + Math.sin(sim.time * 3) * 0.4 : 1.1;
    });
    stacks.current.forEach((stack, k) => {
      if (stack) stack.visible = sim.deliveries[k] !== null;
    });
  });
  return (
    <>
      {SHOP_DOCKS.map((dock, k) => (
        <group key={dock.island.id}>
          <Pier dock={dock} />
          <group position={[dock.house.x, dock.house.y - 0.3, dock.house.z]} rotation={[0, dock.rot + Math.PI, 0]}>
            <StiltHouse wall={SHOP_WALLS[k % SHOP_WALLS.length]} roof={SHOP_ROOFS[k % SHOP_ROOFS.length]}>
              <mesh position={[0, 4.95, 1.35]}>
                <planeGeometry args={[2.6, 1.625]} />
                <meshBasicMaterial map={signs[k]} toneMapped={false} />
              </mesh>
              <mesh ref={(node) => { lamps.current[k] = node; }} position={[0, 6.35, -0.2]}>
                <sphereGeometry args={[0.45, 12, 10]} />
                <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.8} />
              </mesh>
              <group ref={(node) => { stacks.current[k] = node; }} position={[2.9, 0.3, 1.2]} visible={false}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <mesh key={i} position={[(i % 3) * 0.7 - 0.7, 0.25 + Math.floor(i / 3) * 0.5, 0]} castShadow>
                    <boxGeometry args={[0.65, 0.45, 0.55]} />
                    <meshStandardMaterial color="#d9d4c7" />
                  </mesh>
                ))}
              </group>
            </StiltHouse>
          </group>
        </group>
      ))}
    </>
  );
});

/** Cincin pelampung penanda titik labuh. */
export const DockMarkers = memo(function DockMarkers({ simRef }: { simRef: SeaSimRef }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const docks = useMemo(() => [...SHOP_DOCKS, LIGHTHOUSE_DOCK], []);
  const labels = useMemo(() => docks.map((dock) => labelTexture(dock.island.nama, dock.island.shop !== undefined ? "LABUH · E" : "KESIMPULAN", "#fff7e6", "#1e1e24", dock.island.color === "#ffffff" ? GOLD : dock.island.color)), [docks]);
  useFrame(() => {
    const sim = simRef.current;
    refs.current.forEach((g, k) => {
      if (!g) return;
      const shop = docks[k].island.shop;
      const done = shop !== undefined && sim.deliveries[shop] !== null;
      g.visible = !done;
      g.rotation.y = sim.time * 0.4;
      g.position.y = Math.sin(sim.time * 1.6 + k) * 0.1;
    });
  });
  return (
    <>
      {docks.map((dock, k) => (
        <group key={dock.island.id} position={[dock.x, 0, dock.z]}>
          <group ref={(node) => { refs.current[k] = node; }}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]}>
              <ringGeometry args={[DOCK_RADIUS - 0.6, DOCK_RADIUS, 48]} />
              <meshBasicMaterial color={dock.island.shop !== undefined ? GOLD : "#7ee8fa"} transparent opacity={0.55} depthWrite={false} />
            </mesh>
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const a = (i / 6) * Math.PI * 2;
              return (
                <mesh key={i} position={[Math.sin(a) * DOCK_RADIUS, 0.3, Math.cos(a) * DOCK_RADIUS]}>
                  <sphereGeometry args={[0.4, 10, 8]} />
                  <meshStandardMaterial color={i % 2 ? "#ffffff" : "#e63946"} emissive={i % 2 ? "#000" : "#e63946"} emissiveIntensity={0.4} />
                </mesh>
              );
            })}
            <Billboard position={[0, 5, 0]}>
              <mesh>
                <planeGeometry args={[4.2, 2.625]} />
                <meshBasicMaterial map={labels[k]} toneMapped={false} transparent />
              </mesh>
            </Billboard>
          </group>
        </group>
      ))}
    </>
  );
});

/* ------------------------------------------------------------------ */
/* Mercusuar Insight                                                    */
/* ------------------------------------------------------------------ */

export function Lighthouse() {
  const beam = useRef<THREE.Group>(null);
  const x = LIGHTHOUSE_ISLAND.x;
  const z = LIGHTHOUSE_ISLAND.z;
  const y = useMemo(() => terrainHeight(x, z), [x, z]);
  useFrame((_, raw) => {
    if (beam.current) beam.current.rotation.y += clampDelta(raw) * 0.9;
  });
  const stripes = [0, 1, 2, 3, 4];
  return (
    <group>
      <Pier dock={LIGHTHOUSE_DOCK} />
      <group position={[x, y - 0.4, z]}>
        <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[4, 4.6, 1.4, 12]} />
          <meshStandardMaterial color="#b9b2a4" flatShading />
        </mesh>
        {stripes.map((k) => (
          <mesh key={k} position={[0, 2.6 + k * 3, 0]} castShadow>
            <cylinderGeometry args={[2.2 - k * 0.2 - 0.1, 2.4 - k * 0.2, 3, 16]} />
            <meshStandardMaterial color={k % 2 ? "#ffffff" : "#d62828"} />
          </mesh>
        ))}
        <mesh position={[0, 17.6, 0]}>
          <cylinderGeometry args={[1.8, 1.8, 0.3, 16]} />
          <meshStandardMaterial color="#2b2f36" />
        </mesh>
        <mesh position={[0, 18.8, 0]}>
          <cylinderGeometry args={[1.2, 1.2, 2, 12]} />
          <meshStandardMaterial color="#fff6d5" emissive="#ffd166" emissiveIntensity={1.6} transparent opacity={0.85} />
        </mesh>
        <mesh position={[0, 20.3, 0]}>
          <coneGeometry args={[1.6, 1.4, 12]} />
          <meshStandardMaterial color="#2b2f36" />
        </mesh>
        <pointLight position={[0, 18.8, 0]} color="#ffd89a" intensity={40} distance={60} />
        <group ref={beam} position={[0, 18.8, 0]}>
          {[1, -1].map((side) => (
            <mesh key={side} position={[0, 0, side * 22]} rotation={[side * Math.PI / 2, 0, 0]}>
              <coneGeometry args={[4, 44, 16, 1, true]} />
              <meshBasicMaterial color="#fff3c4" transparent opacity={0.13} depthWrite={false} side={THREE.DoubleSide} />
            </mesh>
          ))}
        </group>
        {/* Rumah penjaga */}
        <group position={[6, 0, 3]}>
          <mesh position={[0, 1.6, 0]} castShadow>
            <boxGeometry args={[4, 2.6, 3.2]} />
            <meshStandardMaterial color="#f1ede4" />
          </mesh>
          <mesh position={[0, 3.3, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <cylinderGeometry args={[0.01, 3, 1.3, 4]} />
            <meshStandardMaterial color="#d62828" flatShading />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Kapal suplai kandas (bukti misteri Barokah)                         */
/* ------------------------------------------------------------------ */

export function Wreck({ simRef }: { simRef: SeaSimRef }) {
  const marker = useRef<THREE.Group>(null);
  const texture = useMemo(() => labelTexture("KM Suplai Semen", "?", "#10131a", "#ffc857", "#e76f51"), []);
  const geo = useMemo(() => hullGeometry(), []);
  useFrame(() => {
    const sim = simRef.current;
    if (marker.current) {
      marker.current.visible = !sim.evidence;
      marker.current.position.y = 7 + Math.sin(sim.time * 2) * 0.3;
    }
  });
  return (
    <group position={[WRECK.x, -0.6, WRECK.z]} rotation={[0, WRECK.rot, 0]}>
      <group rotation={[0.12, 0, 0.32]} scale={1.15}>
        <mesh geometry={geo} castShadow receiveShadow>
          <meshStandardMaterial color="#5c4636" roughness={1} />
        </mesh>
        <mesh position={[0, 3.5, -1]} rotation={[0.2, 0, 0.9]} castShadow>
          <cylinderGeometry args={[0.1, 0.15, 7, 6]} />
          <meshStandardMaterial color="#4a3526" />
        </mesh>
        <mesh position={[1.8, 2.2, -1.4]} rotation={[0.3, 0.4, 1.2]}>
          <planeGeometry args={[3, 4]} />
          <meshStandardMaterial color="#cfc3a8" side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* Karung semen tumpah */}
      {[0, 1, 2, 3, 4, 5, 6].map((k) => (
        <mesh key={k} position={[3 + (k % 3) * 0.8, 0.5 + (k % 2) * 0.1, -2 + k * 0.7]} rotation={[0, k, 0.2]} castShadow>
          <boxGeometry args={[0.9, 0.45, 0.6]} />
          <meshStandardMaterial color="#c8c1b0" />
        </mesh>
      ))}
      <group ref={marker} position={[0, 7, 0]}>
        <Billboard>
          <mesh>
            <planeGeometry args={[4.4, 2.75]} />
            <meshBasicMaterial map={texture} toneMapped={false} transparent />
          </mesh>
        </Billboard>
      </group>
    </group>
  );
}

