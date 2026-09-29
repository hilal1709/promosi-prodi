"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { IconCoins, IconFire, IconFlag, IconGauge, IconPackage, IconTimer } from "@/components/ui/icons";
import { clampPercent, type Feedback } from "@/components/game/missions/mission-kit";
import { ERP_MODULES } from "@/lib/data/missions";
import { TouchControls } from "../touch-controls";
import { controlHint } from "../world-controls";
import { clampDelta, HudChip, HudMeter, Label, LevelEnd, WorldHud, WorldStage, useThrottled, type WorldLevelProps } from "../world-kit";
import { crossed, headingAt, indexAt, pointAt, sampleTrack, SAMPLES, seeded, TRACK } from "./race-track";
import {
  ConeModel,
  Countdown,
  DroneModel,
  Effects,
  HintCard,
  PaperPile,
  PuddleModel,
  RAMP_HEIGHT,
  RAMP_LENGTH,
  RAMP_WIDTH,
  RampModel,
  ScreenFlash,
  SpeedLines,
  type FxApi,
} from "./race-fx";
import {
  createTruck,
  GATE_OFFSETS,
  GateRow,
  MiniMap,
  pickGate,
  PlayerTruck,
  RaceWorld,
  STAGE_CAMERA,
  type MapMarker,
  type NitroTank,
  type TruckState,
} from "./race-world";

/* ------------------------------------------------------------------ */
/* Tata letak level (deterministik)                                   */
/* ------------------------------------------------------------------ */

export const ROUTE = ERP_MODULES.map((module, k) => {
  const distractors = [ERP_MODULES[(k + 1) % 6], ERP_MODULES[(k + 3) % 6]];
  const options = [module, ...distractors];
  const shift = k % 3;
  const ordered = [...options.slice(shift), ...options.slice(0, shift)];
  return { t: 0.1 + k * 0.135, options: ordered, correct: ordered.indexOf(module) };
});

const START_TIME = 60;
const GATE_BONUS = 15;
const WRONG_BONUS = 5;
const PACKET_FUEL = 6;
const LANES3 = [-4.3, 0, 4.3];

const nearGate = (t: number) => ROUTE.some((row) => Math.abs(row.t - t) < 0.028) || t < 0.035 || t > 0.965;

const RAMPS = [1, 3, 5].map((k, i) => {
  const t = ROUTE[k].t - 0.055;
  const offset = [0, -3.4, 3.4][i];
  const p = pointAt(t, offset);
  return { t, offset, x: p.x, z: p.z, heading: headingAt(indexAt(t)) };
});
const nearRamp = (t: number) => RAMPS.some((ramp) => t > ramp.t - 0.012 && t < ramp.t + 0.04);

type Packet = { x: number; y: number; z: number };

const PACKETS: Packet[] = (() => {
  const rand = seeded(404);
  const list: Packet[] = [];
  for (let t = 0.04; t < 0.96; t += 0.03) {
    if (nearGate(t) || nearRamp(t)) continue;
    const pattern = Math.floor(rand() * 3);
    const base = LANES3[Math.floor(rand() * 3)];
    for (let k = 0; k < 6; k++) {
      const tt = t + k * 0.0035;
      if (nearGate(tt) || nearRamp(tt)) break;
      const lateral = pattern === 0 ? base : pattern === 1 ? THREE.MathUtils.clamp(base + Math.sin(k * 1.1) * 3, -5, 5) : -4.5 + k * 1.8;
      const p = pointAt(tt, lateral);
      list.push({ x: p.x, y: 1.3, z: p.z });
    }
  }
  // Paket melayang mengikuti busur lompatan di atas tiap ramp.
  RAMPS.forEach((ramp) => {
    [4, 7, 10, 13, 16].forEach((d) => {
      const p = pointAt(ramp.t + (RAMP_LENGTH + d) / TRACK.length, ramp.offset);
      const tau = d / 22;
      list.push({ x: p.x, y: RAMP_HEIGHT + 13 * tau - 15 * tau * tau + 1.6, z: p.z });
    });
  });
  return list;
})();

type HazardKind = "cone" | "paper" | "puddle";
type Hazard = { kind: HazardKind; x: number; z: number; heading: number };

const HAZARDS: Hazard[] = (() => {
  const rand = seeded(909);
  const list: Hazard[] = [];
  for (let t = 0.06; t < 0.95; t += 0.042) {
    if (nearGate(t) || nearRamp(t)) continue;
    const roll = rand();
    const lateral = LANES3[Math.floor(rand() * 3)];
    const heading = headingAt(indexAt(t));
    if (roll < 0.45) {
      [0, 1, 2].forEach((i) => {
        const p = pointAt(t + i * 0.004, lateral + (i - 1) * 1.3);
        list.push({ kind: "cone", x: p.x, z: p.z, heading });
      });
    } else {
      const p = pointAt(t, lateral);
      list.push({ kind: roll < 0.72 ? "paper" : "puddle", x: p.x, z: p.z, heading });
    }
  }
  return list;
})();

const DRONE_TS = [0.24, 0.51, 0.78];
const PUDDLE_POOL = 8;

/* ------------------------------------------------------------------ */
/* Arena aksi: paket, rintangan, ramp, drone bug                      */
/* ------------------------------------------------------------------ */

export interface ActionEvents {
  packet: (x: number, y: number, z: number) => void;
  hazard: (kind: HazardKind, x: number, z: number) => void;
  drone: (x: number, y: number, z: number) => void;
  launch: () => void;
}

type HazardLive = { hit: boolean; x: number; y: number; z: number; vx: number; vy: number; vz: number; spin: number; cooldown: number };
type DroneLive = { mode: "idle" | "lead" | "flee" | "dead"; dist: number; lat: number; y: number; timer: number; drop: number };
type PuddleLive = { x: number; z: number; life: number; cooldown: number };

function createLive() {
  const L = TRACK.length;
  return {
    clock: 0,
    taken: PACKETS.map(() => false),
    hazards: HAZARDS.map<HazardLive>((h) => ({ hit: false, x: h.x, y: 0, z: h.z, vx: 0, vy: 0, vz: 0, spin: 0, cooldown: 0 })),
    ramps: RAMPS.map(() => ({ on: false })),
    drones: DRONE_TS.map<DroneLive>((t) => ({ mode: "idle", dist: t * L, lat: 0, y: 7, timer: 0, drop: 0 })),
    puddles: Array.from({ length: PUDDLE_POOL }, (): PuddleLive => ({ x: 0, z: 0, life: 0, cooldown: 0 })),
    nextPuddle: 0,
  };
}

const tmp = new THREE.Vector3();

function ActionField({
  truck,
  running,
  on,
}: {
  truck: RefObject<TruckState>;
  running: boolean;
  on: ActionEvents;
}) {
  const live = useRef(createLive());
  const packetMesh = useRef<THREE.InstancedMesh>(null);
  const hazardRefs = useRef<(THREE.Group | null)[]>([]);
  const droneRefs = useRef<(THREE.Group | null)[]>([]);
  const puddleRefs = useRef<(THREE.Group | null)[]>([]);
  const packetGeometry = useMemo(() => new THREE.OctahedronGeometry(0.6, 0), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, raw) => {
    const delta = clampDelta(raw);
    const w = live.current;
    const s = truck.current;
    w.clock += delta;
    const L = TRACK.length;
    const playerDist = (s.index / SAMPLES) * L;
    const cy = s.y + 1.4;

    // Paket data: berputar & mengambang; yang sudah diambil disembunyikan.
    const mesh = packetMesh.current;
    if (mesh) {
      PACKETS.forEach((packet, i) => {
        if (running && !w.taken[i]) {
          const dx = packet.x - s.pos.x;
          const dz = packet.z - s.pos.z;
          if (dx * dx + dz * dz < 6.5 && Math.abs(packet.y - cy) < 2.2) {
            w.taken[i] = true;
            on.packet(packet.x, packet.y, packet.z);
          }
        }
        dummy.position.set(packet.x, packet.y + Math.sin(w.clock * 3 + i) * 0.2, packet.z);
        dummy.rotation.set(0.4, w.clock * 2.4 + i, 0);
        dummy.scale.setScalar(w.taken[i] ? 0.0001 : 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    }

    // Rintangan statis.
    HAZARDS.forEach((hazard, i) => {
      const h = w.hazards[i];
      h.cooldown = Math.max(0, h.cooldown - delta);
      if (running && !h.hit && h.cooldown === 0) {
        const dx = h.x - s.pos.x;
        const dz = h.z - s.pos.z;
        const d2 = dx * dx + dz * dz;
        const reach = hazard.kind === "cone" ? 2.4 : hazard.kind === "paper" ? 2.6 : 2.5;
        if (d2 < reach * reach && s.y < (hazard.kind === "puddle" ? 0.3 : 1.4)) {
          if (hazard.kind === "puddle") h.cooldown = 2;
          else {
            h.hit = true;
            const fx = Math.sin(s.heading);
            const fz = Math.cos(s.heading);
            h.vx = fx * Math.max(6, s.speed * 0.8) + (Math.random() - 0.5) * 6;
            h.vz = fz * Math.max(6, s.speed * 0.8) + (Math.random() - 0.5) * 6;
            h.vy = 7 + Math.random() * 3;
            h.spin = 6 + Math.random() * 6;
          }
          on.hazard(hazard.kind, h.x, h.z);
        }
      }
      if (h.hit && h.y > -5) {
        h.vy -= 22 * delta;
        h.x += h.vx * delta;
        h.y += h.vy * delta;
        h.z += h.vz * delta;
      }
      const g = hazardRefs.current[i];
      if (g) {
        g.position.set(h.x, Math.max(-6, h.y), h.z);
        if (h.hit) {
          g.rotation.x += h.spin * delta;
          g.rotation.z += h.spin * 0.6 * delta;
        }
        g.visible = h.y > -3;
      }
    });

    // Ramp: truk mengikuti kemiringan, lalu meluncur di ujungnya.
    if (running) {
      RAMPS.forEach((ramp, i) => {
        const r = w.ramps[i];
        const dx = s.pos.x - ramp.x;
        const dz = s.pos.z - ramp.z;
        const along = dx * Math.sin(ramp.heading) + dz * Math.cos(ramp.heading);
        const lat = dx * Math.cos(ramp.heading) - dz * Math.sin(ramp.heading);
        const onRamp = Math.abs(lat) < RAMP_WIDTH / 2 + 0.4 && along >= 0 && along <= RAMP_LENGTH && s.vy <= 0.5 && s.y <= RAMP_HEIGHT + 0.25 && s.speed > 2;
        if (onRamp) {
          s.y = (RAMP_HEIGHT * along) / RAMP_LENGTH;
          s.vy = 0;
          r.on = true;
        } else if (r.on) {
          r.on = false;
          if (along > RAMP_LENGTH - 0.5) {
            s.y = RAMP_HEIGHT;
            s.vy = 5 + Math.max(0, s.speed) * 0.38;
            on.launch();
          }
        }
      });
    }

    // Genangan error dari drone.
    w.puddles.forEach((p, i) => {
      p.life = Math.max(0, p.life - delta);
      p.cooldown = Math.max(0, p.cooldown - delta);
      if (running && p.life > 0 && p.cooldown === 0 && s.y < 0.3) {
        const dx = p.x - s.pos.x;
        const dz = p.z - s.pos.z;
        if (dx * dx + dz * dz < 6) {
          p.cooldown = 2;
          on.hazard("puddle", p.x, p.z);
        }
      }
      const g = puddleRefs.current[i];
      if (g) {
        g.visible = p.life > 0;
        g.position.set(p.x, 0, p.z);
        g.scale.setScalar(Math.min(1, p.life * 2, (16 - p.life) * 4 + 0.1));
      }
    });

    // Drone bug: terbang di depan truk sambil menjatuhkan genangan; tabrak untuk bonus.
    w.drones.forEach((d, i) => {
      const gap = (((d.dist - playerDist) % L) + L) % L;
      if (d.mode === "idle") {
        d.y = 7 + Math.sin(w.clock * 2 + i) * 0.5;
        if (running && gap < 75) d.mode = "lead";
      } else if (d.mode === "lead") {
        d.timer += delta;
        const speed = gap > 45 ? 11 : 17;
        d.dist += speed * delta;
        d.lat = Math.sin(w.clock * 1.1 + i * 2) * 4.2;
        d.y = THREE.MathUtils.damp(d.y, 2.5 + Math.sin(w.clock * 3 + i) * 0.35, 2, delta);
        d.drop -= delta;
        if (d.drop <= 0 && gap > 12) {
          d.drop = 1.7;
          const pool = w.puddles[w.nextPuddle];
          w.nextPuddle = (w.nextPuddle + 1) % PUDDLE_POOL;
          sampleTrack(d.dist / L, d.lat, tmp);
          Object.assign(pool, { x: tmp.x, z: tmp.z, life: 16, cooldown: 0 });
        }
        if (d.timer > 17 || gap > L / 2) d.mode = "flee";
        sampleTrack(d.dist / L, d.lat, tmp);
        const dx = tmp.x - s.pos.x;
        const dz = tmp.z - s.pos.z;
        if (running && dx * dx + dz * dz < 9 && d.y < s.y + 3.8) {
          d.mode = "dead";
          on.drone(tmp.x, d.y, tmp.z);
        }
      } else if (d.mode === "flee") {
        d.dist += 22 * delta;
        d.y += 9 * delta;
        if (d.y > 40) d.mode = "dead";
      }
      const g = droneRefs.current[i];
      if (g) {
        const heading = sampleTrack(d.dist / L, d.lat, tmp);
        g.visible = d.mode !== "dead";
        g.position.set(tmp.x, d.y, tmp.z);
        g.rotation.set(d.mode === "lead" ? 0.25 : 0, heading, Math.sin(w.clock * 2 + i) * 0.2);
      }
    });
  });

  return (
    <>
      <instancedMesh ref={packetMesh} args={[packetGeometry, undefined, PACKETS.length]} frustumCulled={false}>
        <meshStandardMaterial color="#5ce1ff" emissive="#2bc8ff" emissiveIntensity={1.1} roughness={0.2} metalness={0.3} flatShading />
      </instancedMesh>
      {HAZARDS.map((hazard, i) => (
        <group key={i} ref={(node) => { hazardRefs.current[i] = node; }} position={[hazard.x, 0, hazard.z]} rotation={[0, hazard.heading, 0]}>
          {hazard.kind === "cone" ? <ConeModel /> : hazard.kind === "paper" ? <PaperPile /> : <PuddleModel />}
        </group>
      ))}
      {RAMPS.map((ramp, i) => (
        <group key={i} position={[ramp.x, 0, ramp.z]} rotation={[0, ramp.heading, 0]}>
          <RampModel />
          <Label position={[0, 3.2, 0]} className="is-gold" distanceFactor={22}>⤴ LOMPAT</Label>
        </group>
      ))}
      {DRONE_TS.map((_, i) => (
        <group key={i} ref={(node) => { droneRefs.current[i] = node; }}>
          <DroneModel />
        </group>
      ))}
      {Array.from({ length: PUDDLE_POOL }, (_, i) => (
        <group key={i} ref={(node) => { puddleRefs.current[i] = node; }} visible={false}>
          <PuddleModel radius={1.9} />
        </group>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Level 1 · Rute order-to-cash (arkade)                              */
/* ------------------------------------------------------------------ */

const NITRO_TOUCH = [
  { press: "up" as const, label: "Gas", holdKey: "w" },
  { press: "down" as const, label: "Rem", holdKey: "s", tone: "light" as const },
  { press: "action" as const, label: "Nitro", holdKey: "space" },
];

type Floater = { id: number; text: string; tone: "gold" | "green" | "red" | "light"; x: number; y: number; z: number };

type Game = {
  time: number;
  elapsed: number;
  points: number;
  combo: number;
  bestCombo: number;
  packets: number;
  drones: number;
  results: number[];
  over: boolean;
  airborne: boolean;
  launchedAt: number;
};

const createGame = (): Game => ({ time: START_TIME, elapsed: 0, points: 0, combo: 0, bestCombo: 0, packets: 0, drones: 0, results: [], over: false, airborne: false, launchedAt: 0 });

export function RouteLevel({ levelIndex, info, paused, quality, input, sound, onPause, onFinish }: WorldLevelProps) {
  const truck = useRef<TruckState>(createTruck());
  const nitro = useRef<NitroTank>({ fuel: 40 });
  const fx = useRef<FxApi | null>(null);
  const game = useRef<Game>(createGame());
  const [results, setResults] = useState<number[]>([]);
  const [hud, setHud] = useState({ time: START_TIME, points: 0, combo: 0, speed: 0, fuel: 40, nitro: false, packets: 0, gap: 999 });
  const push = useThrottled(setHud, 10);
  const [count, setCount] = useState(3);
  const [playing, setPlaying] = useState(false);
  const [ending, setEnding] = useState<null | { timeout: boolean; score: number; detail: string }>(null);
  const [toast, setToast] = useState<Feedback>(null);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [flash, setFlash] = useState<{ tone: "good" | "bad"; id: number } | null>(null);
  const ids = useRef(0);
  const lastPacketSound = useRef(0);

  // Hitung mundur 3-2-1-GO (berhenti saat jeda).
  useEffect(() => {
    if (paused || count < 0) return;
    const timer = window.setTimeout(() => {
      if (count > 1) {
        setCount(count - 1);
        sound("interact");
      } else if (count === 1) {
        setCount(0);
        setPlaying(true);
        sound("success");
      } else setCount(-1);
    }, count === 0 ? 650 : 800);
    return () => window.clearTimeout(timer);
  }, [paused, count, sound]);

  const float = (text: string, tone: Floater["tone"], x: number, y: number, z: number) => {
    const id = ++ids.current;
    setFloaters((current) => [...current.slice(-5), { id, text, tone, x, y, z }]);
    window.setTimeout(() => setFloaters((current) => current.filter((f) => f.id !== id)), 1100);
  };
  const flashScreen = (tone: "good" | "bad") => setFlash({ tone, id: ++ids.current });

  const breakCombo = () => {
    game.current.combo = 0;
  };

  const snapshot = () => {
    const g = game.current;
    const s = truck.current;
    const next = g.results.length;
    const gap = next < ROUTE.length ? ((((indexAt(ROUTE[next].t) - s.index) % SAMPLES) + SAMPLES) % SAMPLES) * (TRACK.length / SAMPLES) : 999;
    return { time: g.time, points: g.points, combo: g.combo, speed: s.speed, fuel: nitro.current.fuel, nitro: s.nitro, packets: g.packets, gap };
  };

  const finish = (timeout: boolean) => {
    const g = game.current;
    if (g.over) return;
    g.over = true;
    const correct = g.results.filter((picked, k) => picked === ROUTE[k].correct).length;
    const score = clampPercent((correct / ROUTE.length) * 60 + Math.min(25, g.points / 120) + (timeout ? 0 : Math.min(15, g.time * 0.5)));
    setEnding({
      timeout,
      score,
      detail: `${correct}/${ROUTE.length} gerbang benar · ${g.points} poin · ${g.packets} paket data · combo terbaik ×${g.bestCombo}${timeout ? "" : ` · sisa waktu ${g.time.toFixed(1)}s`}`,
    });
    push({ ...snapshot(), speed: 0 }, true);
    sound(timeout ? "error" : "success");
  };

  const events: ActionEvents = {
    packet: (x, y, z) => {
      const g = game.current;
      g.points += 10;
      g.packets += 1;
      nitro.current.fuel = Math.min(100, nitro.current.fuel + PACKET_FUEL);
      fx.current?.burst(x, y, z, "#5ce1ff", 6, 4);
      if (g.elapsed - lastPacketSound.current > 0.12) {
        lastPacketSound.current = g.elapsed;
        sound("pickup");
      }
    },
    hazard: (kind, x, z) => {
      const s = truck.current;
      breakCombo();
      if (kind === "cone") {
        s.speed *= 0.72;
        fx.current?.burst(x, 0.8, z, "#ff7a1a", 12, 6);
        fx.current?.shake(0.5);
        sound("boom");
        float("Kerucut! combo putus", "red", x, 3, z);
      } else if (kind === "paper") {
        s.slow = 1.4;
        s.speed *= 0.6;
        fx.current?.burst(x, 1, z, "#fffdf5", 22, 7);
        fx.current?.shake(0.35);
        sound("error");
        float("Proses manual! lambat", "red", x, 3, z);
      } else {
        s.wobble = 1.4;
        fx.current?.burst(x, 0.4, z, "#b14bff", 14, 5);
        sound("error");
        float("Data error! setir licin", "red", x, 3, z);
      }
    },
    drone: (x, y, z) => {
      const g = game.current;
      g.points += 50;
      g.drones += 1;
      nitro.current.fuel = Math.min(100, nitro.current.fuel + 20);
      fx.current?.burst(x, y, z, "#d7263d", 30, 10);
      fx.current?.burst(x, y, z, "#fff36b", 14, 8);
      fx.current?.shake(0.6);
      sound("boom");
      float("+50 Bug dibasmi!", "green", x, y + 2, z);
    },
    launch: () => {
      const g = game.current;
      g.airborne = true;
      g.launchedAt = g.elapsed;
      sound("interact");
    },
  };

  const onLand = () => {
    const g = game.current;
    const s = truck.current;
    if (!g.airborne) return;
    g.airborne = false;
    if (g.elapsed - g.launchedAt < 0.35) return;
    g.points += 30;
    fx.current?.burst(s.pos.x, 0.3, s.pos.z, "#c8b48a", 18, 5);
    fx.current?.shake(0.4);
    sound("step");
    float("+30 Lompatan!", "gold", s.pos.x, 5, s.pos.z);
  };

  const onNearMiss = () => {
    const s = truck.current;
    game.current.points += 25;
    float("+25 Nyaris!", "light", s.pos.x, 5, s.pos.z);
  };

  const onMove = (from: number, to: number, lapDone: boolean, delta: number) => {
    const g = game.current;
    if (g.over) return;
    g.time -= delta;
    g.elapsed += delta;
    if (g.time <= 0) {
      g.time = 0;
      finish(true);
      return;
    }
    const next = g.results.length;
    if (next < ROUTE.length && crossed(from, to, indexAt(ROUTE[next].t))) {
      const row = ROUTE[next];
      const s = truck.current;
      const picked = pickGate(s.lateral, 3);
      const ok = picked === row.correct;
      const target = row.options[row.correct];
      const gatePos = pointAt(row.t, GATE_OFFSETS[picked]);
      g.results = [...g.results, picked];
      setResults(g.results);
      if (ok) {
        g.combo += 1;
        g.bestCombo = Math.max(g.bestCombo, g.combo);
        const gained = 100 * g.combo;
        g.points += gained;
        g.time += GATE_BONUS;
        nitro.current.fuel = Math.min(100, nitro.current.fuel + 15);
        fx.current?.burst(gatePos.x, 2.5, gatePos.z, "#2fae66", 34, 11);
        fx.current?.burst(gatePos.x, 3.5, gatePos.z, "#ffc857", 16, 9);
        float(`+${gained} ×${g.combo}  +${GATE_BONUS}s`, "green", gatePos.x, 6, gatePos.z);
        flashScreen("good");
        sound("success");
      } else {
        breakCombo();
        g.time += WRONG_BONUS;
        s.speed *= 0.6;
        s.slow = 0.8;
        fx.current?.burst(gatePos.x, 2.5, gatePos.z, "#e54b4b", 30, 10);
        fx.current?.shake(0.8);
        float(`Salah modul!  +${WRONG_BONUS}s`, "red", gatePos.x, 6, gatePos.z);
        flashScreen("bad");
        sound("error");
      }
      setToast({
        ok,
        judul: ok ? `${target.label}` : `Harusnya: ${target.label}`,
        teks: target.aliranData,
        konsep: `Modul ${target.divisi}`,
      });
    }
    if (lapDone && truck.current.lap >= 1 && g.results.length >= ROUTE.length) {
      finish(false);
      return;
    }
    push(snapshot());
  };

  const next = results.length;
  const showHint = playing && !ending && next < ROUTE.length && hud.gap < 110;
  const markers: MapMarker[] = ROUTE.map((row, k) => ({
    t: row.t,
    big: k === next,
    color: k < next ? (results[k] === row.correct ? "#2fae66" : "#e54b4b") : k === next ? "#ffc857" : "#8a8f98",
  }));
  const running = !paused && playing && !ending;

  return (
    <WorldStage
      quality={quality}
      paused={paused || Boolean(ending)}
      camera={STAGE_CAMERA}
      overlay={
        <>
          <SpeedLines active={hud.nitro && running} />
          <ScreenFlash flash={flash} />
          <WorldHud
            levelIndex={levelIndex}
            info={info}
            onPause={onPause}
            toast={toast}
            stats={
              <>
                <HudChip tone={hud.time <= 10 ? "red" : "dark"} pulse={hud.time <= 10 && running}><IconTimer />{Math.ceil(hud.time)}s</HudChip>
                <HudChip tone="gold"><IconCoins />{hud.points}</HudChip>
                {hud.combo > 1 && <HudChip tone="green"><IconFire />×{hud.combo}</HudChip>}
                <HudChip><IconFlag />{next}/{ROUTE.length}</HudChip>
                <HudChip><IconPackage />{hud.packets}</HudChip>
                <HudMeter label={hud.nitro ? "NITRO AKTIF!" : controlHint("NITRO · SPASI", "NITRO")} value={hud.fuel} tone={hud.fuel > 30 ? "green" : "red"} />
                <HudChip><IconGauge />{Math.round(Math.abs(hud.speed) * 5)} km/j</HudChip>
              </>
            }
            prompt={next >= ROUTE.length && !ending ? <>Semua modul terlewati, ngebut ke garis finis!</> : undefined}
          />
          {showHint && (
            <HintCard>
              <small>GERBANG {next + 1}/{ROUTE.length} · {Math.round(hud.gap)} m</small>
              <strong>{next === 0 ? "Alur dimulai dari mana?" : <>Setelah <em>{ROUTE[next - 1].options[ROUTE[next - 1].correct].label}</em>, lalu apa?</>}</strong>
            </HintCard>
          )}
          <Countdown count={count} />
          <MiniMap truckRef={truck} markers={markers} />
          <TouchControls inputRef={input} mode="stick" buttons={NITRO_TOUCH} />
          {ending && (
            <LevelEnd
              score={ending.score}
              reason={ending.timeout ? "Waktu habis!" : "Alur order-to-cash tuntas"}
              detail={ending.detail}
              onNext={() => onFinish(ending.score)}
            />
          )}
        </>
      }
    >
      <RaceWorld quality={quality} truck={truck}>
        {ROUTE.map((row, k) => (
          <GateRow
            key={k}
            t={row.t}
            labels={row.options.map((module) => module.label)}
            status={k < next ? { picked: results[k], correct: row.correct } : null}
            active={k === next}
            showLabels={k === next || k === next - 1}
          />
        ))}
        <PlayerTruck
          input={input}
          running={running}
          truckRef={truck}
          onMove={onMove}
          onBump={() => {
            breakCombo();
            sound("boom");
            fx.current?.shake(0.45);
          }}
          nitroRef={nitro}
          onNearMiss={onNearMiss}
          onLand={onLand}
        />
        <ActionField truck={truck} running={running} on={events} />
        {floaters.map((f) => (
          <Label key={f.id} position={[f.x, f.y, f.z]} className={`race-float is-${f.tone}`} distanceFactor={18}>
            {f.text}
          </Label>
        ))}
        <Effects apiRef={fx} />
      </RaceWorld>
    </WorldStage>
  );
}
