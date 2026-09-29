"use client";

import { memo, useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import * as THREE from "three";
import CharacterModel, { type CharacterMotion } from "@/components/game/character-model";
import type { ChartKind, GameAvatarId } from "@/lib/types";
import { clampDelta } from "../world-kit";
import { canvasTexture, fitText } from "../erp/race-scenery";
import {
  channelLat,
  FORKS,
  GATE_LAT,
  HAZARDS,
  headingAt,
  L,
  MONTH_GATES,
  ORBS,
  PAIR_LAT,
  SHOP_HOUSES,
  SHOPS,
  SLICES,
  toWorld,
  waterY,
  widthAt,
  type Hazard,
} from "./river-layout";
import { Near, StiltHouse } from "./river-scenery";

/* ------------------------------------------------------------------ */
/* State simulasi bersama (dibaca model tiap frame, tanpa re-render)     */
/* ------------------------------------------------------------------ */

export type PairState = "open" | "clean" | "dirty" | "miss";

export interface RaftSim {
  s: number;
  lat: number;
  y: number;
  vy: number;
  speed: number;
  latVel: number;
  yaw: number;
  roll: number;
  pitch: number;
  hp: number;
  stamina: number;
  tired: boolean;
  stroke: number;
  paddling: number;
  airborne: boolean;
  spin: number;
  bump: number;
}

export interface RiverSim {
  raft: RaftSim;
  time: number;
  shops: PairState[];
  /** -2 = belum, -1 = terlewat, 0..2 = celah yang dilewati. */
  gates: number[];
  slices: PairState[];
  /** -1 = belum, 0..2 = kanal yang dipilih. */
  forks: number[];
  orbs: boolean[];
  hazardCd: number[];
  finale: number;
  ended: boolean;
  checkpoint: number;
  repairs: number;
  combo: number;
  bestCombo: number;
  orbCount: number;
  lastZone: string;
}

export type RiverSimRef = RefObject<RiverSim>;

export const OK_COLOR = "#2fae66";
export const BAD_COLOR = "#e54b4b";
export const CHART_LABEL: Record<ChartKind, string> = { bar: "Batang", line: "Garis", pie: "Lingkaran" };
const CHART_COLOR: Record<ChartKind, string> = { bar: "#5b8def", line: "#ffc857", pie: "#b36bd6" };

const tmp = new THREE.Vector3();

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
    fitText(g, big, 224, 70, 900);
    g.fillText(big, 128, 108);
  });
}

function chartIcon(kind: ChartKind) {
  return canvasTexture(256, 256, (g) => {
    g.fillStyle = "#10131a";
    g.beginPath();
    g.roundRect(6, 6, 244, 244, 30);
    g.fill();
    g.lineWidth = 10;
    g.strokeStyle = CHART_COLOR[kind];
    g.stroke();
    g.fillStyle = CHART_COLOR[kind];
    g.strokeStyle = CHART_COLOR[kind];
    if (kind === "bar") {
      [70, 120, 95, 150].forEach((h, k) => g.fillRect(44 + k * 44, 190 - h, 30, h));
    } else if (kind === "line") {
      g.lineWidth = 12;
      g.lineJoin = "round";
      g.beginPath();
      [[40, 170], [90, 140], [130, 150], [175, 95], [215, 60]].forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.stroke();
      [[40, 170], [90, 140], [130, 150], [175, 95], [215, 60]].forEach(([x, y]) => {
        g.beginPath();
        g.arc(x, y, 12, 0, Math.PI * 2);
        g.fill();
      });
    } else {
      const parts = [0.55, 0.3, 0.15];
      const cols = [CHART_COLOR.pie, "#ffc857", "#7ee8fa"];
      let a = -Math.PI / 2;
      parts.forEach((p, k) => {
        g.fillStyle = cols[k];
        g.beginPath();
        g.moveTo(128, 118);
        g.arc(128, 118, 78, a, a + p * Math.PI * 2);
        g.closePath();
        g.fill();
        a += p * Math.PI * 2;
      });
    }
    g.fillStyle = "#ffffff";
    g.font = "900 34px system-ui, sans-serif";
    g.textAlign = "center";
    g.fillText(CHART_LABEL[kind].toUpperCase(), 128, 232);
  });
}

/* ------------------------------------------------------------------ */
/* Rakit bambu + avatar + dayung                                        */
/* ------------------------------------------------------------------ */

export const Raft = memo(function Raft({ simRef, avatar, groupRef }: { simRef: RiverSimRef; avatar: GameAvatarId; groupRef: RefObject<THREE.Group | null> }) {
  const paddle = useRef<THREE.Group>(null);
  const wake = useRef<THREE.Mesh>(null);
  const body = useRef<THREE.Group>(null);
  const motion = useRef<CharacterMotion>({ phase: 0, moving: false });
  useFrame(() => {
    const r = simRef.current.raft;
    const g = groupRef.current;
    if (!g) return;
    toWorld(r.s, r.lat, tmp);
    g.position.set(tmp.x, r.y, tmp.z);
    g.rotation.set(r.pitch, headingAt(r.s) + r.yaw + r.spin, r.roll, "YXZ");
    if (paddle.current) {
      const side = Math.sin(r.stroke * 0.5) > 0 ? 1 : -1;
      paddle.current.position.x = side * 0.55;
      paddle.current.rotation.set(Math.sin(r.stroke) * 0.9 * r.paddling, 0, side * (0.35 + 0.25 * r.paddling));
    }
    if (body.current) body.current.rotation.x = Math.sin(r.stroke) * 0.08 * r.paddling;
    if (wake.current) {
      const m = wake.current.material as THREE.MeshStandardMaterial;
      m.opacity = r.airborne ? 0 : Math.min(0.75, r.speed / 14);
      wake.current.scale.set(1 + r.speed * 0.03, 1 + r.speed * 0.08, 1);
    }
  });
  const logs = [-1.2, -0.8, -0.4, 0, 0.4, 0.8, 1.2];
  return (
    <group ref={groupRef}>
      {logs.map((x, k) => (
        <mesh key={x} position={[x, 0.12, (k % 2) * 0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.2, 0.2, 3.6, 8]} />
          <meshStandardMaterial color={k % 3 === 0 ? "#b8a05a" : "#c9b36a"} roughness={0.7} />
        </mesh>
      ))}
      {[-1.2, 1.2].map((z) => (
        <mesh key={z} position={[0, 0.34, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, 2.8, 6]} />
          <meshStandardMaterial color="#7a5a3a" />
        </mesh>
      ))}
      {/* Tiang bendera data */}
      <group position={[-1, 0.3, -1.4]}>
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 2.4, 5]} />
          <meshStandardMaterial color="#e9ecef" />
        </mesh>
        <mesh position={[0, 2.2, 0.35]}>
          <boxGeometry args={[0.03, 0.45, 0.7]} />
          <meshStandardMaterial color="#7ee8fa" emissive="#35c7ef" emissiveIntensity={0.5} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <mesh position={[1.05, 0.55, -1.3]}>
        <boxGeometry args={[0.6, 0.45, 0.5]} />
        <meshStandardMaterial color="#8a6a45" />
      </mesh>
      <group ref={body} position={[0, 0.32, 0.1]}>
        <CharacterModel avatar={avatar} motion={motion} />
        <group ref={paddle} position={[0.55, 1.5, 0.35]}>
          <mesh position={[0, -0.7, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 2.2, 5]} />
            <meshStandardMaterial color="#8a6a45" />
          </mesh>
          <mesh position={[0, -1.85, 0]}>
            <boxGeometry args={[0.06, 0.6, 0.26]} />
            <meshStandardMaterial color="#6b4a2f" />
          </mesh>
        </group>
      </group>
      <mesh ref={wake} position={[0, 0.03, -2.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.6, 3, -Math.PI / 2 - 0.5, 1]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.5} depthWrite={false} />
      </mesh>
    </group>
  );
});

/* ------------------------------------------------------------------ */
/* Pelampung data                                                       */
/* ------------------------------------------------------------------ */

function Buoy({ s, lat, top, big, state, chosen, style }: { s: number; lat: number; top: string; big: string; state: () => PairState; chosen: boolean; style: "pelampung" | "karung" }) {
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => labelTexture(top, big), [top, big]);
  const pos = useMemo(() => toWorld(s, lat), [s, lat]);
  const wy = waterY(s);
  const phase = useMemo(() => (s * 0.37 + lat) % 6, [s, lat]);
  const clock = useRef(phase);
  useFrame((_, raw) => {
    const delta = clampDelta(raw);
    clock.current += delta;
    const g = group.current;
    if (!g) return;
    const st = state();
    const target = st === "open" ? wy + Math.sin(clock.current * 2) * 0.12 : chosen ? wy + 2.6 : wy - 2.4;
    g.position.y = THREE.MathUtils.damp(g.position.y, target, st === "open" ? 10 : 3, delta);
    g.rotation.z = Math.sin(clock.current * 1.3) * 0.08;
    const scale = st === "open" ? 1 : chosen ? Math.max(0.001, g.scale.x - delta * 0.9) : Math.max(0.001, g.scale.x - delta * 1.4);
    g.scale.setScalar(scale);
    if (ring.current) {
      const m = ring.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 0.5 + Math.sin(clock.current * 4) * 0.3;
    }
  });
  return (
    <group ref={group} position={[pos.x, wy, pos.z]}>
      {style === "pelampung" ? (
        <>
          <mesh position={[0, 0.25, 0]} castShadow>
            <cylinderGeometry args={[0.75, 0.9, 0.9, 12]} />
            <meshStandardMaterial color="#f4f1de" />
          </mesh>
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.93, 0.93, 0.3, 12]} />
            <meshStandardMaterial color="#e76f51" />
          </mesh>
          <mesh position={[0, 1.2, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 1.6, 5]} />
            <meshStandardMaterial color="#adb5bd" />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0, 0.2, 0]} castShadow>
            <boxGeometry args={[1.8, 0.4, 1.4]} />
            <meshStandardMaterial color="#8a6a45" />
          </mesh>
          {[-0.45, 0.45].map((x) => (
            <mesh key={x} position={[x, 0.65, 0]} castShadow>
              <boxGeometry args={[0.8, 0.5, 1.1]} />
              <meshStandardMaterial color="#e9e2d0" />
            </mesh>
          ))}
        </>
      )}
      <mesh ref={ring} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.25, 1.45, 24]} />
        <meshStandardMaterial color="#7ee8fa" emissive="#7ee8fa" emissiveIntensity={0.6} transparent opacity={0.8} />
      </mesh>
      <Billboard position={[0, 2.8, 0]}>
        <mesh>
          <planeGeometry args={[2.6, 1.625]} />
          <meshBasicMaterial map={texture} transparent toneMapped={false} />
        </mesh>
      </Billboard>
    </group>
  );
}

export const ShopBuoys = memo(function ShopBuoys({ simRef }: { simRef: RiverSimRef }) {
  return (
    <>
      {SHOPS.map((shop) => {
        const cleanLat = shop.cleanLeft ? -PAIR_LAT : PAIR_LAT;
        const state = () => simRef.current.shops[shop.index];
        return (
          <Near key={shop.index} s0={shop.s}>
            <Buoy s={shop.s} lat={cleanLat} top={shop.label} big={String(shop.nilai)} state={state} chosen={false} style="pelampung" />
            <Buoy s={shop.s} lat={-cleanLat} top={shop.label} big={shop.dirtyText} state={state} chosen={false} style="pelampung" />
          </Near>
        );
      })}
    </>
  );
});

export const SliceBuoys = memo(function SliceBuoys({ simRef }: { simRef: RiverSimRef }) {
  return (
    <>
      {SLICES.map((slice) => {
        const cleanLat = slice.cleanLeft ? -PAIR_LAT : PAIR_LAT;
        const state = () => simRef.current.slices[slice.index];
        return (
          <Near key={slice.index} s0={slice.s}>
            <Buoy s={slice.s} lat={cleanLat} top={slice.label} big={`${slice.nilai}%`} state={state} chosen={false} style="karung" />
            <Buoy s={slice.s} lat={-cleanLat} top={slice.label} big={`${slice.dirtyValue}%`} state={state} chosen={false} style="karung" />
          </Near>
        );
      })}
    </>
  );
});

/* --------------------------- toko di tepi -------------------------- */

const SHOP_WALLS = ["#f1e3c6", "#e6ccb2", "#cfe1b9", "#f4d6cc", "#e9d8a6", "#d8e2dc", "#ffe5b4"];

export const Shops = memo(function Shops({ simRef }: { simRef: RiverSimRef }) {
  const signs = useMemo(() => SHOP_HOUSES.map((house) => labelTexture("TOKO", house.shop.label, "#1e1e24", "#ffffff", "#ffc857")), []);
  const lamps = useRef<(THREE.Mesh | null)[]>([]);
  const color = useMemo(() => new THREE.Color(), []);
  useFrame(() => {
    lamps.current.forEach((lamp, k) => {
      if (!lamp) return;
      const st = simRef.current.shops[k];
      const m = lamp.material as THREE.MeshStandardMaterial;
      color.set(st === "clean" ? OK_COLOR : st === "dirty" ? BAD_COLOR : st === "miss" ? "#8d99ae" : "#ffc857");
      m.color.copy(color);
      m.emissive.copy(color);
    });
  });
  return (
    <>
      {SHOP_HOUSES.map((house, k) => (
        <Near key={k} s0={house.shop.s}>
        <group position={[house.x, house.y - 0.3, house.z]} rotation={[0, house.rot, 0]}>
          <StiltHouse wall={SHOP_WALLS[k % SHOP_WALLS.length]} roof={["#9c3d2e", "#2a9d8f", "#bc6c25", "#6d597a"][k % 4]}>
            <mesh position={[0, 4.95, 1.35]}>
              <planeGeometry args={[2.6, 1.625]} />
              <meshBasicMaterial map={signs[k]} toneMapped={false} />
            </mesh>
            <mesh ref={(node) => { lamps.current[k] = node; }} position={[0, 6.35, -0.2]}>
              <sphereGeometry args={[0.4, 12, 10]} />
              <meshStandardMaterial color="#ffc857" emissive="#ffc857" emissiveIntensity={0.8} />
            </mesh>
            {/* Dermaga kecil ke sungai */}
            <mesh position={[0, 0.75, 4.2]} receiveShadow>
              <boxGeometry args={[1.6, 0.12, 4]} />
              <meshStandardMaterial color="#9a7a52" />
            </mesh>
            {["#e63946", "#ffd166", "#2a9d8f"].map((c, i) => (
              <mesh key={c} position={[-1.6 + i * 0.5, 2.45, 1.4]} castShadow>
                <boxGeometry args={[0.4, 0.5, 0.4]} />
                <meshStandardMaterial color={c} />
              </mesh>
            ))}
          </StiltHouse>
        </group>
        </Near>
      ))}
    </>
  );
});

/* --------------------------- gerbang bulan ------------------------- */

export const MonthGates = memo(function MonthGates({ simRef }: { simRef: RiverSimRef }) {
  const data = useMemo(
    () =>
      MONTH_GATES.map((gate) => ({
        gate,
        heading: headingAt(gate.s),
        pos: toWorld(gate.s, 0),
        wy: waterY(gate.s),
        textures: gate.options.map((v) => labelTexture(gate.label, v.toLocaleString("id-ID"), "#fffaf0", "#1e1e24", "#c8a24a")),
      })),
    []
  );
  const lanterns = useRef<(THREE.Mesh | null)[]>([]);
  const color = useMemo(() => new THREE.Color(), []);
  useFrame(() => {
    lanterns.current.forEach((lamp, i) => {
      if (!lamp) return;
      const g = Math.floor(i / 3);
      const k = i % 3;
      const chosen = simRef.current.gates[g];
      const m = lamp.material as THREE.MeshStandardMaterial;
      if (chosen === k) color.set(k === MONTH_GATES[g].correct ? OK_COLOR : BAD_COLOR);
      else if (chosen === -1 && k === MONTH_GATES[g].correct) color.set("#8d99ae");
      else color.set("#ff9f4a");
      m.color.copy(color);
      m.emissive.copy(color);
      m.emissiveIntensity = chosen === k ? 1.2 : 0.5;
    });
  });
  return (
    <>
      {data.map(({ gate, heading, pos, wy, textures }) => (
        <Near key={gate.index} s0={gate.s}>
        <group position={[pos.x, wy, pos.z]} rotation={[0, heading, 0]}>
          {[-1.5, -0.5, 0.5, 1.5].map((u) => (
            <mesh key={u} position={[-u * GATE_LAT, 2.2, 0]} castShadow>
              <cylinderGeometry args={[0.22, 0.28, 5.4, 7]} />
              <meshStandardMaterial color="#a3c24c" />
            </mesh>
          ))}
          <mesh position={[0, 4.9, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.18, 0.18, GATE_LAT * 3.2, 7]} />
            <meshStandardMaterial color="#8a6a45" />
          </mesh>
          {[0, 1, 2].map((k) => (
            <group key={k} position={[-(k - 1) * GATE_LAT, 3.65, 0]}>
              <mesh rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[3.4, 2.1]} />
                <meshBasicMaterial map={textures[k]} toneMapped={false} side={THREE.DoubleSide} />
              </mesh>
              <mesh ref={(node) => { lanterns.current[gate.index * 3 + k] = node; }} position={[0, 1.6, 0]}>
                <sphereGeometry args={[0.32, 10, 8]} />
                <meshStandardMaterial color="#ff9f4a" emissive="#ff9f4a" emissiveIntensity={0.5} />
              </mesh>
            </group>
          ))}
        </group>
        </Near>
      ))}
    </>
  );
});

/* ---------------------------- gapura cabang ------------------------ */

export const ForkGates = memo(function ForkGates({ simRef }: { simRef: RiverSimRef }) {
  const data = useMemo(
    () =>
      FORKS.map((fork) => {
        const s = fork.s + 10;
        return {
          fork,
          s,
          wy: waterY(s),
          channels: fork.channels.map((kind, k) => ({ kind, texture: chartIcon(kind), pos: toWorld(s, channelLat(k)), heading: headingAt(s) })),
        };
      }),
    []
  );
  const boards = useRef<(THREE.Mesh | null)[]>([]);
  const color = useMemo(() => new THREE.Color(), []);
  useFrame(() => {
    boards.current.forEach((board, i) => {
      if (!board) return;
      const f = Math.floor(i / 3);
      const k = i % 3;
      const chosen = simRef.current.forks[f];
      const m = board.material as THREE.MeshStandardMaterial;
      color.set(chosen === -1 ? "#6b4a2f" : k === FORKS[f].correct ? OK_COLOR : chosen === k ? BAD_COLOR : "#6b4a2f");
      m.color.copy(color);
      m.emissive.copy(chosen === -1 ? color.set("#000000") : color);
      m.emissiveIntensity = 0.4;
    });
  });
  return (
    <>
      {data.map(({ fork, wy, channels, s }) =>
        channels.map((ch, k) => (
          <Near key={`${fork.id}-${k}`} s0={s}>
          <group position={[ch.pos.x, wy, ch.pos.z]} rotation={[0, ch.heading, 0]}>
            {[-1, 1].map((side) => (
              <mesh key={side} position={[side * 4.2, 2.9, 0]} castShadow>
                <boxGeometry args={[0.55, 6.4, 0.55]} />
                <meshStandardMaterial color="#6b4a2f" />
              </mesh>
            ))}
            <mesh ref={(node) => { boards.current[fork.id * 3 + k] = node; }} position={[0, 6.2, 0]} castShadow>
              <boxGeometry args={[9.4, 0.7, 0.6]} />
              <meshStandardMaterial color="#6b4a2f" />
            </mesh>
            <mesh position={[0, 4.4, -0.05]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[3.2, 3.2]} />
              <meshBasicMaterial map={ch.texture} toneMapped={false} side={THREE.DoubleSide} />
            </mesh>
          </group>
          </Near>
        ))
      )}
    </>
  );
});

/* ------------------------------ rintangan -------------------------- */

function Rock({ hz }: { hz: Hazard }) {
  const pos = useMemo(() => toWorld(hz.s, hz.lat), [hz]);
  const wy = waterY(hz.s);
  return (
    <group position={[pos.x, wy, pos.z]} rotation={[0, hz.id * 1.7, 0]}>
      <mesh position={[0, 0.2, 0]} scale={[hz.r, hz.r * 0.9, hz.r]} castShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={hz.id % 2 ? "#7c7a6e" : "#8f8b7c"} flatShading />
      </mesh>
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[hz.r * 0.95, hz.r * 1.5, 14]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.55} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Log({ hz }: { hz: Hazard }) {
  const group = useRef<THREE.Group>(null);
  const pos = useMemo(() => toWorld(hz.s, hz.lat), [hz]);
  const heading = useMemo(() => headingAt(hz.s), [hz]);
  const wy = waterY(hz.s);
  const clock = useRef(hz.id);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    if (group.current) {
      group.current.position.y = wy + 0.12 + Math.sin(clock.current * 1.8) * 0.08;
      group.current.rotation.z = Math.sin(clock.current * 1.1) * 0.05;
    }
  });
  return (
    <group ref={group} position={[pos.x, wy, pos.z]} rotation={[0, heading, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.38, 0.45, hz.r * 2, 9]} />
        <meshStandardMaterial color="#6d4c33" />
      </mesh>
      {[-0.5, 0.35].map((u) => (
        <mesh key={u} position={[u * hz.r, 0.5, 0.2]} rotation={[0.5, 0, u]}>
          <cylinderGeometry args={[0.07, 0.1, 1.2, 5]} />
          <meshStandardMaterial color="#5a3f28" />
        </mesh>
      ))}
      <mesh position={[hz.r * 0.3, 0.5, 0]}>
        <icosahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial color="#4f8f3a" flatShading />
      </mesh>
    </group>
  );
}

function useSpiralTexture() {
  return useMemo(
    () =>
      canvasTexture(256, 256, (g) => {
        g.clearRect(0, 0, 256, 256);
        g.translate(128, 128);
        for (let arm = 0; arm < 4; arm++) {
          g.beginPath();
          for (let t = 0; t < 1; t += 0.01) {
            const a = arm * (Math.PI / 2) + t * Math.PI * 3;
            const r = 8 + t * 116;
            const x = Math.cos(a) * r;
            const y = Math.sin(a) * r;
            if (t === 0) g.moveTo(x, y);
            else g.lineTo(x, y);
          }
          g.strokeStyle = "rgba(255,255,255,0.75)";
          g.lineWidth = 9;
          g.stroke();
        }
        const grad = g.createRadialGradient(0, 0, 4, 0, 0, 128);
        grad.addColorStop(0, "rgba(20,40,70,0.85)");
        grad.addColorStop(1, "rgba(20,40,70,0)");
        g.fillStyle = grad;
        g.fillRect(-128, -128, 256, 256);
      }),
    []
  );
}

function Whirlpool({ hz, texture }: { hz: Hazard; texture: THREE.Texture }) {
  const disc = useRef<THREE.Mesh>(null);
  const pos = useMemo(() => toWorld(hz.s, hz.lat), [hz]);
  const wy = waterY(hz.s);
  useFrame((_, raw) => {
    if (disc.current) disc.current.rotation.z -= clampDelta(raw) * 2.4;
  });
  return (
    <group position={[pos.x, wy + 0.05, pos.z]}>
      <mesh ref={disc} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[hz.r * 1.2, 32]} />
        <meshStandardMaterial map={texture} transparent depthWrite={false} emissive="#9fdcf0" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0, 2.6, 0]}>
        <octahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial color="#e54b4b" emissive="#e54b4b" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

function makeChevronTexture() {
  {
    const t = canvasTexture(128, 128, (g) => {
      g.clearRect(0, 0, 128, 128);
      g.strokeStyle = "rgba(126,232,250,0.95)";
      g.lineWidth = 16;
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(24, 40);
      g.lineTo(64, 84);
      g.lineTo(104, 40);
      g.stroke();
    });
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, 3);
    return t;
  }
}

function Rapid({ hz, texture }: { hz: Hazard; texture: THREE.Texture }) {
  const pos = useMemo(() => toWorld(hz.s, hz.lat), [hz]);
  const heading = useMemo(() => headingAt(hz.s), [hz]);
  const wy = waterY(hz.s);
  return (
    <mesh position={[pos.x, wy + 0.06, pos.z]} rotation={[-Math.PI / 2, 0, heading + Math.PI]}>
      <planeGeometry args={[hz.r * 2, 7]} />
      <meshStandardMaterial map={texture} transparent depthWrite={false} emissive="#7ee8fa" emissiveIntensity={0.9} />
    </mesh>
  );
}

export const Hazards = memo(function Hazards() {
  const spiral = useSpiralTexture();
  const chevron = useMemo(() => makeChevronTexture(), []);
  const scroll = useRef(chevron);
  const clock = useRef(0);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    scroll.current.offset.y = clock.current * 1.8;
  });
  return (
    <>
      {HAZARDS.map((hz) => (
        <Near key={hz.id} s0={hz.s}>
          {hz.kind === "batu" ? <Rock hz={hz} /> : hz.kind === "kayu" ? <Log hz={hz} /> : hz.kind === "pusaran" ? <Whirlpool hz={hz} texture={spiral} /> : <Rapid hz={hz} texture={chevron} />}
        </Near>
      ))}
    </>
  );
});

/* ------------------------------ tetes data ------------------------- */

export const Orbs = memo(function Orbs({ simRef }: { simRef: RiverSimRef }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const base = useMemo(() => ORBS.map((orb) => ({ p: toWorld(orb.s, orb.lat), y: waterY(orb.s) + 1.1 })), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const clock = useRef(0);
  useLayoutEffect(() => {
    mesh.current?.computeBoundingSphere();
  }, []);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    const m = mesh.current;
    if (!m) return;
    const s = simRef.current;
    base.forEach((b, i) => {
      dummy.position.set(b.p.x, b.y + Math.sin(clock.current * 3 + i) * 0.2, b.p.z);
      dummy.rotation.set(0, clock.current * 2 + i, 0);
      dummy.scale.setScalar(s.orbs[i] ? 0.0001 : 1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, ORBS.length]} frustumCulled={false}>
      <octahedronGeometry args={[0.38, 0]} />
      <meshStandardMaterial color="#7ee8fa" emissive="#35c7ef" emissiveIntensity={1.1} />
    </instancedMesh>
  );
});

/* ------------------------------------------------------------------ */
/* Finale: Galeri Dasbor — grafik hasil pemain muncul raksasa           */
/* ------------------------------------------------------------------ */

export const FINALE_CENTER = (() => {
  const p = toWorld(L - 8, 0);
  return { x: p.x, z: p.z, y: waterY(L), heading: headingAt(L - 8) };
})();

export const DashboardFinale = memo(function DashboardFinale({ simRef, bars, line, pie }: { simRef: RiverSimRef; bars: { value: number; state: PairState }[]; line: { value: number; ok: boolean | null }[]; pie: { value: number; state: PairState }[] }) {
  const root = useRef<THREE.Group>(null);
  const barRefs = useRef<(THREE.Mesh | null)[]>([]);
  const clock = useRef(0);
  const pieSlices = useMemo(() => {
    const total = pie.reduce((sum, p) => sum + Math.max(0, p.value), 0) || 1;
    const lens = pie.map((p) => (Math.max(0, p.value) / total) * Math.PI * 2);
    return pie.map((p, k) => {
      const len = lens[k];
      const start = lens.slice(0, k).reduce((sum, v) => sum + v, 0);
      return { start, len, color: p.state === "clean" ? ["#b36bd6", "#ffc857", "#7ee8fa"][k] : p.state === "dirty" ? BAD_COLOR : "#8d99ae" };
    });
  }, [pie]);
  const linePts = useMemo(
    () => line.flatMap((p, k) => (p.ok === null ? [] : [{ pos: new THREE.Vector3((k - 2.5) * 4.2, 8 + (Math.min(1000, p.value) - 560) * 0.045, 0), ok: p.ok }])),
    [line]
  );
  useFrame((_, raw) => {
    const s = simRef.current;
    const g = root.current;
    if (!g) return;
    g.visible = s.finale >= 0;
    if (s.finale < 0) return;
    clock.current += clampDelta(raw);
    const t = clock.current;
    barRefs.current.forEach((bar, k) => {
      if (!bar) return;
      const h = Math.max(0.2, Math.min(240, Math.abs(bars[k].value)) * 0.07);
      const grow = THREE.MathUtils.clamp((t - k * 0.18) / 1.2, 0, 1);
      bar.scale.y = Math.max(0.01, h * grow);
      bar.position.y = (h * grow) / 2;
    });
    g.rotation.y = FINALE_CENTER.heading;
    const pieGroup = g.getObjectByName("pie");
    if (pieGroup) pieGroup.rotation.y = t * 0.3;
  });
  const barX = (k: number) => (k - 3) * 2.4;
  return (
    <group ref={root} position={[FINALE_CENTER.x, FINALE_CENTER.y, FINALE_CENTER.z]} visible={false}>
      {/* Panggung apung */}
      <mesh position={[0, 0.2, 38]} receiveShadow>
        <cylinderGeometry args={[24, 24, 0.4, 40]} />
        <meshStandardMaterial color="#e9e2d0" />
      </mesh>
      <group position={[-10, 0.4, 36]}>
        {bars.map((bar, k) => (
          <mesh key={k} ref={(node) => { barRefs.current[k] = node; }} position={[barX(k), 0.5, 0]} castShadow>
            <boxGeometry args={[1.8, 1, 1.8]} />
            <meshStandardMaterial color={bar.state === "clean" ? "#5b8def" : bar.state === "dirty" ? BAD_COLOR : "#8d99ae"} emissive={bar.state === "clean" ? "#5b8def" : "#000000"} emissiveIntensity={0.25} />
          </mesh>
        ))}
      </group>
      <group position={[0, 2, 50]}>
        {linePts.map((p, k) => (
          <mesh key={k} position={p.pos}>
            <sphereGeometry args={[0.55, 12, 10]} />
            <meshStandardMaterial color={p.ok ? "#ffc857" : BAD_COLOR} emissive={p.ok ? "#ffc857" : "#000000"} emissiveIntensity={0.8} />
          </mesh>
        ))}
        {linePts.slice(1).map(({ pos: p }, k) => {
          const a = linePts[k].pos;
          const mid = a.clone().add(p).multiplyScalar(0.5);
          const len = a.distanceTo(p);
          const ang = Math.atan2(p.y - a.y, p.x - a.x);
          return (
            <mesh key={`l${k}`} position={mid} rotation={[0, 0, ang]}>
              <boxGeometry args={[len, 0.22, 0.22]} />
              <meshStandardMaterial color="#ffc857" emissive="#ffc857" emissiveIntensity={0.6} />
            </mesh>
          );
        })}
      </group>
      <group name="pie" position={[12, 1.2, 36]}>
        {pieSlices.map((slice, k) => (
          <mesh key={k} position={[0, k * 0.05, 0]} castShadow>
            <cylinderGeometry args={[5.5, 5.5, 1.2, 32, 1, false, slice.start, slice.len]} />
            <meshStandardMaterial color={slice.color} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </group>
  );
});

/** Lebar sungai di posisi s, diekspor ulang untuk HUD. */
export const riverHalf = (s: number) => widthAt(s) / 2;
