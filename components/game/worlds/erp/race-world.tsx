"use client";

import { useContext, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Flag, Timer, Trophy } from "lucide-react";
import { clampPercent, type Feedback } from "@/components/game/missions/mission-kit";
import type { GameQuality } from "@/lib/types";
import { ERP_BOARD_SCORES } from "@/lib/data/missions";
import { BOARD_GATES, RACE_PADS } from "@/lib/data/worlds";
import { TouchControls } from "../touch-controls";
import { readAxis, type WorldInput } from "../world-controls";
import {
  clampDelta,
  HudChip,
  Label,
  LevelEnd,
  WorldHud,
  WorldStage,
  useThrottled,
  type WorldLevelProps,
} from "../world-kit";
import {
  crossed,
  headingAt,
  indexAt,
  nearestIndex,
  pointAt,
  RAIL_OFFSET,
  ROAD_HALF,
  sampleTrack,
  SAMPLES,
  TRACK,
} from "./race-track";
import { RaceScenery, Traffic, TrafficContext, type TrafficCarState } from "./race-scenery";
import { CementTruck, RIVAL_LIVERY, TRAFFIC_SIZE } from "./truck-models";

/* ------------------------------------------------------------------ */
/* Fisika truk                                                        */
/* ------------------------------------------------------------------ */

const TOP_SPEED = 24;
const OFFROAD_SPEED = 13;
const TRUCK_HALF_LENGTH = 3.8;
const TRUCK_HALF_WIDTH = 1.3;
export const STAGE_CAMERA = { position: [0, 8, -14] as [number, number, number], fov: 60, near: 0.5, far: 1000 };

export type TruckState = {
  pos: THREE.Vector3;
  heading: number;
  speed: number;
  index: number;
  lap: number;
  lateral: number;
  boost: number;
  slow: number;
  /** Ketinggian & kecepatan vertikal saat melompat dari ramp. */
  y: number;
  vy: number;
  /** Sisa detik setir goyang (genangan data error). */
  wobble: number;
  /** Nitro sedang menyala (dibaca efek layar). */
  nitro: boolean;
};

/** Bahan bakar nitro 0..100 yang dikelola level. */
export type NitroTank = { fuel: number };

export function createTruck(offset = 0): TruckState {
  const t = TRACK.tangents[0];
  return {
    pos: TRACK.points[0].clone().addScaledVector(TRACK.normals[0], offset).addScaledVector(t, -4),
    heading: Math.atan2(t.x, t.z),
    speed: 0,
    index: SAMPLES - 7,
    lap: -1,
    lateral: offset,
    boost: 0,
    slow: 0,
    y: 0,
    vy: 0,
    wobble: 0,
    nitro: false,
  };
}

const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const forward = new THREE.Vector3();
const desired = new THREE.Vector3();
const lookTarget = new THREE.Vector3();

/**
 * Fisika truk, pagar pembatas, tabrakan dengan lalu lintas, dan kamera kejar.
 * `onMove(from, to, lapDone)` dipanggil setiap frame untuk deteksi gerbang.
 */
export function PlayerTruck({
  input,
  running,
  truckRef,
  onMove,
  onBump,
  nitroRef,
  onNearMiss,
  onLand,
}: {
  input: WorldInput;
  running: boolean;
  truckRef: RefObject<TruckState>;
  onMove: (from: number, to: number, lapDone: boolean, delta: number) => void;
  onBump?: () => void;
  /** Bila ada, tombol Spasi/Nitro menghabiskan bahan bakar untuk boost. */
  nitroRef?: RefObject<NitroTank>;
  /** Dipanggil sekali saat menyalip kendaraan dari jarak sangat dekat. */
  onNearMiss?: () => void;
  onLand?: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  const traffic = useContext(TrafficContext);
  const look = useRef(new THREE.Vector3());
  const placed = useRef(false);
  const bumpCooldown = useRef(0);
  const motion = useRef({ speed: 0, steer: 0, braking: false });
  const nearMissed = useRef(new Set<TrafficCarState>());
  const clock = useRef(0);

  useFrame((state, raw) => {
    const camera = state.camera as THREE.PerspectiveCamera;
    const s = truckRef.current;
    const delta = clampDelta(raw);
    bumpCooldown.current = Math.max(0, bumpCooldown.current - delta);
    const bump = () => {
      if (bumpCooldown.current > 0) return;
      bumpCooldown.current = 0.9;
      onBump?.();
    };
    let axis = { x: 0, y: 0 };

    if (running) {
      clock.current += delta;
      axis = readAxis(input.current);
      const airborne = s.y > 0.01 || s.vy > 0;
      s.nitro = Boolean(nitroRef && input.current.held.space && nitroRef.current.fuel > 0 && s.speed > 2);
      if (s.nitro && nitroRef) {
        nitroRef.current.fuel = Math.max(0, nitroRef.current.fuel - 34 * delta);
        s.boost = Math.max(s.boost, 0.15);
      }
      if (s.wobble > 0) {
        s.wobble = Math.max(0, s.wobble - delta);
        axis = { x: axis.x + Math.sin(clock.current * 11) * 0.9, y: axis.y };
      }
      if (airborne) {
        // Di udara: tidak ada gas/rem dan setir hampir tak berpengaruh.
        s.vy -= 30 * delta;
        s.y += s.vy * delta;
        if (s.y <= 0) {
          s.y = 0;
          s.vy = 0;
          onLand?.();
        }
        axis = { x: axis.x * 0.25, y: 0 };
      }
      const onRoad = Math.abs(s.lateral) < ROAD_HALF + 0.6;
      s.boost = Math.max(0, s.boost - delta);
      s.slow = Math.max(0, s.slow - delta);
      const maxSpeed = (onRoad ? TOP_SPEED : OFFROAD_SPEED) * (s.boost > 0 ? 1.4 : 1) * (s.slow > 0 ? 0.55 : 1);
      if (axis.y > 0.1) s.speed += 16 * axis.y * delta;
      else if (axis.y < -0.1) s.speed += (s.speed > 0.5 ? 30 : 12) * axis.y * delta;
      else if (!airborne) s.speed -= Math.sign(s.speed) * Math.min(Math.abs(s.speed), 6 * delta);
      if (s.boost > 0) s.speed += 12 * delta;
      if (s.speed > maxSpeed) s.speed = THREE.MathUtils.damp(s.speed, maxSpeed, 3, delta);
      s.speed = Math.max(-7, s.speed);
      const grip = THREE.MathUtils.clamp(s.speed / 6, -1, 1) * (1 - Math.min(0.3, Math.abs(s.speed) / 90));
      s.heading -= axis.x * 1.75 * delta * grip;
      s.pos.x += Math.sin(s.heading) * s.speed * delta;
      s.pos.z += Math.cos(s.heading) * s.speed * delta;

      // Tabrakan dengan kendaraan lain (didorong keluar dari kotak tabrakannya).
      traffic?.current.forEach((car: TrafficCarState) => {
        const dx = s.pos.x - car.pos.x;
        const dz = s.pos.z - car.pos.z;
        if (dx * dx + dz * dz > 120) return;
        const fx = Math.sin(car.heading);
        const fz = Math.cos(car.heading);
        const along = dx * fx + dz * fz;
        const side = dx * fz - dz * fx;
        const [halfLen, halfWidth] = TRAFFIC_SIZE[car.kind];
        const needA = halfLen + TRUCK_HALF_LENGTH;
        const needS = halfWidth + TRUCK_HALF_WIDTH;
        if (Math.abs(along) > needA + 4) nearMissed.current.delete(car);
        if (s.y > 2.2) return; // melayang di atas mobil
        if (Math.abs(along) < needA && Math.abs(side) >= needS && Math.abs(side) < needS + 1.6 && s.speed > car.speed + 4 && !nearMissed.current.has(car)) {
          nearMissed.current.add(car);
          onNearMiss?.();
        }
        if (Math.abs(along) >= needA || Math.abs(side) >= needS) return;
        nearMissed.current.add(car);
        const penA = needA - Math.abs(along);
        const penS = needS - Math.abs(side);
        if (penA < penS) {
          const push = Math.sign(along || 1) * penA;
          s.pos.x += fx * push;
          s.pos.z += fz * push;
          if (along < 0 && s.speed > car.speed) {
            if (s.speed - car.speed > 5) bump();
            s.speed = car.speed * 0.6;
          } else if (along > 0) s.speed = Math.max(s.speed, car.speed);
        } else {
          const push = Math.sign(side || 1) * penS;
          s.pos.x += fz * push;
          s.pos.z -= fx * push;
          s.speed *= 0.92;
          if (Math.abs(s.speed) > 8) bump();
        }
      });

      const from = s.index;
      s.index = nearestIndex(s.pos, s.index);
      const lapDone = s.index < from - SAMPLES / 2;
      if (lapDone) s.lap += 1;
      // Mundur melewati garis start tidak dihitung sebagai putaran.
      if (s.index > from + SAMPLES / 2) s.lap -= 1;

      // Pagar pembatas: truk tidak bisa keluar dari koridor jalan.
      const p = TRACK.points[s.index];
      const n = TRACK.normals[s.index];
      let lateral = (s.pos.x - p.x) * n.x + (s.pos.z - p.z) * n.z;
      const limit = RAIL_OFFSET - TRUCK_HALF_WIDTH - 0.2;
      if (Math.abs(lateral) > limit) {
        const target = Math.sign(lateral) * limit;
        s.pos.x += n.x * (target - lateral);
        s.pos.z += n.z * (target - lateral);
        lateral = target;
        if (Math.abs(s.speed) > 7) bump();
        s.speed *= 1 - Math.min(1, delta * 1.6);
        const along = headingAt(s.index) + (s.speed < 0 ? Math.PI : 0);
        s.heading += wrapAngle(along - s.heading) * Math.min(1, delta * 3);
      }
      s.lateral = lateral;
      onMove(from, s.index, lapDone, delta);
    }

    motion.current.speed = s.speed;
    motion.current.steer = axis.x;
    motion.current.braking = axis.y < -0.1 && s.speed > 0.5;
    if (group.current) {
      group.current.position.copy(s.pos).setY(s.y);
      group.current.rotation.y = s.heading;
      // Moncong sedikit terangkat saat naik, menunduk saat turun.
      group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, s.y > 0.01 ? -s.vy * 0.018 : 0, 8, delta);
    }

    forward.set(Math.sin(s.heading), 0, Math.cos(s.heading));
    desired.copy(s.pos).addScaledVector(forward, s.nitro ? -14.5 : -13).setY(6.4 + s.y * 0.7);
    lookTarget.copy(s.pos).addScaledVector(forward, 8).setY(1.8 + s.y * 0.8);
    if (!placed.current) {
      camera.position.copy(desired);
      look.current.copy(lookTarget);
      placed.current = true;
    }
    camera.position.lerp(desired, 1 - Math.exp(-delta * 4.5));
    look.current.lerp(lookTarget, 1 - Math.exp(-delta * 8));
    camera.lookAt(look.current);
    const fov = 58 + Math.min(14, Math.abs(s.speed) * 0.35) + (s.nitro ? 6 : 0);
    if (Math.abs(camera.fov - fov) > 0.05) {
      camera.fov = THREE.MathUtils.damp(camera.fov, fov, 3, delta);
      camera.updateProjectionMatrix();
    }
  });

  return (
    <group ref={group}>
      <CementTruck motion={motion} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Gerbang                                                            */
/* ------------------------------------------------------------------ */

export const GATE_OFFSETS = [-4.3, 0, 4.3];
const GATE_HALF = 1.75;

export function GateRow({
  t,
  labels,
  status,
  active = true,
  showLabels = true,
}: {
  t: number;
  labels: string[];
  status?: { picked: number; correct: number | null } | null;
  /** Gerbang yang sedang dituju: menyala terang. */
  active?: boolean;
  showLabels?: boolean;
}) {
  const index = indexAt(t);
  const rotation = headingAt(index);
  const offsets = labels.length === 1 ? [0] : GATE_OFFSETS;
  return (
    <group>
      {labels.map((label, k) => {
        const p = pointAt(t, offsets[k]);
        const isPicked = status?.picked === k;
        const isCorrect = status?.correct === k;
        const color = status ? (isCorrect ? "#2fae66" : isPicked ? "#e54b4b" : "#6b717b") : active ? "#ffa987" : "#b9b2ab";
        const glow = status ? 0.35 : active ? 0.55 : 0.08;
        return (
          <group key={k} position={[p.x, 0, p.z]} rotation={[0, rotation, 0]}>
            {[-GATE_HALF, GATE_HALF].map((x) => (
              <mesh key={x} position={[x, 2.1, 0]} castShadow>
                <boxGeometry args={[0.3, 4.2, 0.3]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow} />
              </mesh>
            ))}
            <mesh position={[0, 4.25, 0]} castShadow>
              <boxGeometry args={[GATE_HALF * 2 + 0.3, 0.45, 0.35]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow + 0.1} />
            </mesh>
            <mesh position={[0, 2.05, 0]}>
              <planeGeometry args={[GATE_HALF * 2 - 0.3, 3.9]} />
              <meshBasicMaterial color={color} transparent opacity={active || status ? 0.16 : 0.06} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
            <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[GATE_HALF * 2, 1.4]} />
              <meshBasicMaterial color={color} transparent opacity={0.75} polygonOffset polygonOffsetFactor={-6} polygonOffsetUnits={-6} />
            </mesh>
            {showLabels && (
              <Label position={[0, 5.3, 0]} className={status ? (isCorrect ? "is-green" : isPicked ? "is-red" : undefined) : "is-gold"} distanceFactor={20}>
                <span className="block max-w-[9rem] whitespace-normal">{label}</span>
              </Label>
            )}
          </group>
        );
      })}
    </group>
  );
}

export function pickGate(lateral: number, count: number) {
  if (count === 1) return 0;
  let best = 0;
  GATE_OFFSETS.forEach((offset, k) => {
    if (Math.abs(lateral - offset) < Math.abs(lateral - GATE_OFFSETS[best])) best = k;
  });
  return best;
}

export function RaceWorld({ quality, truck, children }: { quality: GameQuality; truck: RefObject<TruckState>; children: ReactNode }) {
  const traffic = useRef<TrafficCarState[]>([]);
  return (
    <TrafficContext.Provider value={traffic}>
      <RaceScenery quality={quality} focus={truck} />
      <Traffic trafficRef={traffic} quality={quality} player={truck} />
      {children}
    </TrafficContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* Minimap                                                            */
/* ------------------------------------------------------------------ */

const MAP_W = 150;

export type MapMarker = { t: number; color: string; big?: boolean; offset?: number; x?: number; z?: number };

export function MiniMap({ truckRef, markers, rival }: { truckRef: RefObject<TruckState>; markers: MapMarker[]; rival?: RefObject<number> }) {
  const arrow = useRef<SVGGElement>(null);
  const rivalDot = useRef<SVGCircleElement>(null);
  const map = useMemo(() => {
    const pad = 9;
    const { min, max } = TRACK.box;
    const scale = (MAP_W - pad * 2) / (max.x - min.x);
    const height = (max.z - min.z) * scale + pad * 2;
    const project = (x: number, z: number) => [pad + (x - min.x) * scale, pad + (z - min.z) * scale] as const;
    const d =
      TRACK.points
        .filter((_, i) => i % 8 === 0)
        .map((p, i) => {
          const [x, y] = project(p.x, p.z);
          return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
        })
        .join(" ") + "Z";
    return { project, d, height };
  }, []);

  useEffect(() => {
    let frame = 0;
    const tmp = new THREE.Vector3();
    const loop = () => {
      const s = truckRef.current;
      if (arrow.current && s) {
        const [x, y] = map.project(s.pos.x, s.pos.z);
        arrow.current.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(180 - (s.heading * 180) / Math.PI).toFixed(1)})`);
      }
      if (rival && rivalDot.current) {
        sampleTrack((rival.current / TRACK.length) % 1, 0, tmp);
        const [x, y] = map.project(tmp.x, tmp.z);
        rivalDot.current.setAttribute("cx", x.toFixed(1));
        rivalDot.current.setAttribute("cy", y.toFixed(1));
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [map, truckRef, rival]);

  const [sx, sy] = map.project(TRACK.points[0].x, TRACK.points[0].z);
  return (
    <div className="race-minimap" aria-hidden>
      <svg viewBox={`0 0 ${MAP_W} ${map.height.toFixed(0)}`}>
        <path d={map.d} fill="none" stroke="rgb(255 255 255 / .22)" strokeWidth={8} strokeLinejoin="round" />
        <path d={map.d} fill="none" stroke="#f4f1ea" strokeWidth={2.4} strokeLinejoin="round" />
        <rect x={sx - 3.5} y={sy - 3.5} width={7} height={7} fill="#111318" stroke="#fff" strokeWidth={1} />
        {markers.map((marker, k) => {
          const p = marker.x !== undefined && marker.z !== undefined ? { x: marker.x, z: marker.z } : pointAt(marker.t, marker.offset ?? 0);
          const [x, y] = map.project(p.x, p.z);
          return <circle key={k} cx={x} cy={y} r={marker.big ? 4.2 : 2.8} fill={marker.color} stroke="#10131a" strokeWidth={1} />;
        })}
        {rival && <circle ref={rivalDot} r={3.4} fill="#9aa0a8" stroke="#fff" strokeWidth={1} />}
        <g ref={arrow}>
          <path d="M0 -5.5 L4 4 L0 2 L-4 4 Z" fill="#f26b3a" stroke="#fff" strokeWidth={1.1} strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
}

export const DRIVE_TOUCH = [{ press: "up" as const, label: "Gas", holdKey: "w" }, { press: "down" as const, label: "Rem", holdKey: "s", tone: "light" as const }];

/* ------------------------------------------------------------------ */
/* Level 3 · Balapan vs Sistem Manual                                 */
/* ------------------------------------------------------------------ */

const LAPS = 2;
const BOARD_T = 0.5;
const RACE_LIMIT = 240;
const RIVAL_SPEED = 16.2;

function RivalTruck({ distanceRef }: { distanceRef: RefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const motion = useRef({ speed: 0, steer: 0, braking: false });
  const last = useRef(0);
  const pos = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, raw) => {
    if (!group.current) return;
    const delta = clampDelta(raw);
    const distance = distanceRef.current;
    motion.current.speed = delta > 0 ? (distance - last.current) / delta : 0;
    last.current = distance;
    const heading = sampleTrack((distance / TRACK.length) % 1, 0, pos);
    group.current.position.copy(pos);
    group.current.rotation.y = heading;
  });
  return (
    <group ref={group}>
      <CementTruck livery={RIVAL_LIVERY} motion={motion} label="Sistem Manual" paperwork />
    </group>
  );
}

export function RaceLevel({ levelIndex, info, paused, quality, input, sound, onPause, onFinish }: WorldLevelProps) {
  const truck = useRef<TruckState>(createTruck(-4.3));
  const rival = useRef(0);
  const clock = useRef(0);
  const [hud, setHud] = useState({ time: 0, lap: 0, ahead: true, rivalLap: 0 });
  const push = useThrottled(setHud, 6);
  const [board, setBoard] = useState<number | null>(null);
  const boardLive = useRef<number | null>(null);
  const padsLive = useRef<string[]>([]);
  const [padsHit, setPadsHit] = useState<string[]>([]);
  const [toast, setToast] = useState<Feedback>(null);
  const [result, setResult] = useState<null | { won: boolean; time: number }>(null);
  const resolved = useRef(false);
  const boardScore = board === null ? 0 : ERP_BOARD_SCORES[BOARD_GATES[board].id] ?? 0;
  const boosts = padsHit.filter((key) => RACE_PADS[Number(key.split(":")[1])].type === "boost").length;
  const score = clampPercent((result?.won ? 60 : 30) + boardScore * 0.3 + Math.min(10, boosts * 2));

  const onMove = (from: number, to: number, lapDone: boolean, delta: number) => {
    if (resolved.current) return;
    const s = truck.current;
    clock.current += delta;
    const lap = Math.max(0, s.lap);
    const playerDistance = lap * TRACK.length + (s.lap < 0 ? 0 : (to / SAMPLES) * TRACK.length);
    const gap = rival.current - playerDistance;
    const rivalSpeed = RIVAL_SPEED + (gap > 60 ? -2.2 : gap < -60 ? 2.2 : 0);
    if (rival.current < LAPS * TRACK.length) rival.current += rivalSpeed * delta;
    push({ time: clock.current, lap, ahead: playerDistance >= rival.current, rivalLap: Math.floor(rival.current / TRACK.length) });

    RACE_PADS.forEach((pad, k) => {
      const key = `${lap}:${k}`;
      if (!crossed(from, to, indexAt(pad.t)) || Math.abs(s.lateral - pad.offset) > 2.2 || padsLive.current.includes(key)) return;
      padsLive.current = [...padsLive.current, key];
      setPadsHit(padsLive.current);
      if (pad.type === "boost") {
        s.boost = 2.2;
        sound("pickup");
        setToast({ ok: true, judul: `Boost: ${pad.label}`, teks: "Proses otomatis di ERP memangkas pekerjaan manual.", konsep: "Sistem terintegrasi" });
      } else {
        s.slow = 1.5;
        sound("error");
        setToast({ ok: false, judul: `Terjebak: ${pad.label}`, teks: "Pekerjaan manual memperlambat alur dan rawan salah input.", konsep: "Proses manual" });
      }
    });

    if (lap === 0 && boardLive.current === null && crossed(from, to, indexAt(BOARD_T))) {
      const picked = pickGate(s.lateral, 3);
      const option = BOARD_GATES[picked];
      const value = ERP_BOARD_SCORES[option.id] ?? 0;
      boardLive.current = picked;
      setBoard(picked);
      if (value === 100) s.boost = 3.5;
      else s.slow = 1.5;
      sound(value === 100 ? "success" : "error");
      setToast({
        ok: value === 100,
        judul: value === 100 ? "Direksi terkesan — BOOST!" : "Laporan terlambat…",
        teks: value === 100 ? "Konsolidasi otomatis: cepat, seragam, bisa ditelusuri." : "Laporan manual lambat dan rawan salah. Konsolidasi otomatis di ERP jauh lebih cepat.",
        konsep: "Laporan terkonsolidasi",
      });
    }

    if ((lapDone && s.lap >= LAPS) || clock.current >= RACE_LIMIT) {
      resolved.current = true;
      const won = s.lap >= LAPS && rival.current < LAPS * TRACK.length;
      setResult({ won, time: clock.current });
      sound(won ? "success" : "error");
    }
  };

  const markers: MapMarker[] = [
    ...RACE_PADS.map((pad) => ({ t: pad.t, offset: pad.offset, color: pad.type === "boost" ? "#3fd0ff" : "#f5f1e8" })),
    ...(board === null && hud.lap === 0 ? [{ t: BOARD_T, big: true, color: "#ffc857" }] : []),
  ];

  return (
    <WorldStage
      quality={quality}
      paused={paused || Boolean(result)}
      camera={STAGE_CAMERA}
      overlay={
        <>
          <WorldHud
            levelIndex={levelIndex}
            info={info}
            onPause={onPause}
            toast={toast}
            stats={
              <>
                <HudChip><Timer />{hud.time.toFixed(1)}s</HudChip>
                <HudChip tone="gold"><Flag />Putaran {Math.min(hud.lap + 1, LAPS)}/{LAPS}</HudChip>
                <HudChip tone={hud.ahead ? "green" : "red"}><Trophy />{hud.ahead ? "Posisi 1" : "Posisi 2"}</HudChip>
              </>
            }
          />
          <MiniMap truckRef={truck} markers={markers} rival={rival} />
          <TouchControls inputRef={input} mode="stick" buttons={DRIVE_TOUCH} />
          {result && (
            <LevelEnd
              score={score}
              reason={result.won ? "Kamu menang!" : "Sistem Manual unggul"}
              detail={`${result.won ? "ERP terbukti lebih cepat." : "Coba ambil lebih banyak boost ERP."} Waktu ${result.time.toFixed(1)} detik · ${boosts} boost.`}
              isLast
              onNext={() => onFinish(score)}
            />
          )}
        </>
      }
    >
      <RaceWorld quality={quality} truck={truck}>
        {RACE_PADS.map((pad, k) => {
          const p = pointAt(pad.t, pad.offset);
          const boost = pad.type === "boost";
          return (
            <group key={k} position={[p.x, 0, p.z]} rotation={[0, headingAt(indexAt(pad.t)), 0]}>
              <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[3.6, 4.2]} />
                <meshStandardMaterial
                  color={boost ? "#3fd0ff" : "#f5f1e8"}
                  emissive={boost ? "#3fd0ff" : "#000"}
                  emissiveIntensity={boost ? 0.9 : 0}
                  polygonOffset
                  polygonOffsetFactor={-6}
                  polygonOffsetUnits={-6}
                />
              </mesh>
              {!boost && [0, 1, 2].map((i) => (
                <mesh key={i} position={[(i - 1) * 0.9, 0.3 + i * 0.12, 0]} rotation={[0, i * 0.4, 0]} castShadow>
                  <boxGeometry args={[0.9, 0.5, 1.2]} />
                  <meshStandardMaterial color="#fffdf5" />
                </mesh>
              ))}
              <Label position={[0, 2.2, 0]} className={boost ? "is-green" : "is-red"} distanceFactor={20}>{boost ? "⚡ " : ""}{pad.label}</Label>
            </group>
          );
        })}
        {board === null && hud.lap === 0 && <GateRow t={BOARD_T} labels={BOARD_GATES.map((gate) => gate.label)} />}
        <RivalTruck distanceRef={rival} />
        <PlayerTruck input={input} running={!paused && !result} truckRef={truck} onMove={onMove} onBump={() => sound("boom")} />
      </RaceWorld>
    </WorldStage>
  );
}

