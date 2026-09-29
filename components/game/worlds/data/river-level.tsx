"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Droplets, Flame, Timer } from "lucide-react";
import { clampPercent, type Feedback } from "@/components/game/missions/mission-kit";
import type { SoundName } from "@/components/game/use-game-audio";
import { cn } from "@/lib/utils";
import type { ChartKind } from "@/lib/types";
import { Effects, ScreenFlash, type FxApi } from "../erp/race-fx";
import { TouchControls } from "../touch-controls";
import { readAxis, usePressReader, type WorldInput } from "../world-controls";
import { clampDelta, HudChip, HudMeter, LevelEnd, WorldHud, WorldStage, useThrottled, type WorldLevelProps } from "../world-kit";
import {
  channelLat,
  CHECKPOINTS,
  currentAt,
  FORK_LEN,
  forkAt,
  FORKS,
  GATE_LAT,
  HAZARDS,
  headingAt,
  ISLAND_LAT,
  islandHalf,
  L,
  MONTH_GATES,
  ORBS,
  PAIR_LAT,
  PAR_TIME,
  RAFT_START,
  sampanAt,
  SAMPANS,
  scatterFlora,
  SHOPS,
  SLICES,
  terrainHeight,
  toWorld,
  VIEW,
  WATERFALLS,
  waterY,
  widthAt,
  zoneAt,
  ZONES,
} from "./river-layout";
import {
  CHART_LABEL,
  DashboardFinale,
  FINALE_CENTER,
  ForkGates,
  Hazards,
  MonthGates,
  Orbs,
  Raft,
  ShopBuoys,
  Shops,
  SliceBuoys,
  type PairState,
  type RiverSim,
} from "./river-models";
import { RiverNature, RIVER_HORIZON } from "./river-scenery";

/* ------------------------------------------------------------------ */
/* Level 2 · Arung Jeram Data                                          */
/* ------------------------------------------------------------------ */

const FINALE_AT = L - 55;
const FINALE_TIME = 7;
const HIT_RADIUS = 2.3;

type Phase = "bar" | "line" | "pie";

interface Hud {
  s: number;
  hp: number;
  stamina: number;
  tired: boolean;
  time: number;
  boost: boolean;
  whirl: boolean;
  logAhead: boolean;
  airborne: boolean;
  fork: number;
  finale: boolean;
}

interface Events {
  sound: (name: SoundName) => void;
  hud: (hud: Hud, force?: boolean) => void;
  shop: (index: number, state: PairState) => void;
  gate: (index: number, pick: number) => void;
  slice: (index: number, state: PairState) => void;
  fork: (index: number, pick: number) => void;
  orb: (count: number, combo: number) => void;
  hit: (judul: string, teks: string) => void;
  repair: () => void;
  zone: (name: string) => void;
  toast: (feedback: Feedback) => void;
  end: () => void;
}

function createSim(): RiverSim {
  return {
    raft: { s: RAFT_START, lat: -2, y: waterY(RAFT_START), vy: 0, speed: 0, latVel: 0, yaw: 0, roll: 0, pitch: 0, hp: 100, stamina: 1, tired: false, stroke: 0, paddling: 0, airborne: false, spin: 0, bump: 0 },
    time: 0,
    shops: SHOPS.map(() => "open"),
    gates: MONTH_GATES.map(() => -2),
    slices: SLICES.map(() => "open"),
    forks: FORKS.map(() => -1),
    orbs: ORBS.map(() => false),
    hazardCd: HAZARDS.map(() => 0),
    finale: -1,
    ended: false,
    checkpoint: RAFT_START,
    repairs: 0,
    combo: 0,
    bestCombo: 0,
    orbCount: 0,
    lastZone: "",
  };
}

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const tmp = new THREE.Vector3();
const desired = new THREE.Vector3();
const lookTarget = new THREE.Vector3();

/* ------------------------------------------------------------------ */
/* Seret layar untuk melihat sekeliling                                 */
/* ------------------------------------------------------------------ */

interface View {
  yaw: number;
  pitch: number;
  idle: number;
}

function CameraDrag({ view }: { view: RefObject<View> }) {
  const { gl } = useThree();
  useEffect(() => {
    const el = gl.domElement;
    let dragging: number | null = null;
    let lastX = 0;
    let lastY = 0;
    const down = (event: PointerEvent) => {
      dragging = event.pointerId;
      lastX = event.clientX;
      lastY = event.clientY;
    };
    const move = (event: PointerEvent) => {
      if (dragging !== event.pointerId) return;
      const v = view.current;
      v.yaw -= (event.clientX - lastX) * 0.006;
      v.pitch = THREE.MathUtils.clamp(v.pitch + (event.clientY - lastY) * 0.003, 0.1, 0.9);
      v.idle = 0;
      lastX = event.clientX;
      lastY = event.clientY;
    };
    const up = (event: PointerEvent) => {
      if (dragging === event.pointerId) dragging = null;
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    el.style.setProperty("touch-action", "none");
    el.style.setProperty("cursor", "grab");
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [gl, view]);
  return null;
}

/* ------------------------------------------------------------------ */
/* Simulasi                                                             */
/* ------------------------------------------------------------------ */

function RiverController({
  input,
  running,
  simRef,
  focus,
  view,
  events,
  fx,
}: {
  input: WorldInput;
  running: boolean;
  simRef: RefObject<RiverSim>;
  focus: RefObject<{ pos: THREE.Vector3; s: number }>;
  view: RefObject<View>;
  events: Events;
  fx: RefObject<FxApi | null>;
}) {
  const pressed = usePressReader(input);
  const look = useRef(new THREE.Vector3());
  const camHeading = useRef(headingAt(RAFT_START));
  const placed = useRef(false);
  const boost = useRef(0);
  const whirlWarned = useRef(false);
  const fallSeen = useRef<boolean[]>(WATERFALLS.map(() => false));
  const hitOnce = useRef<Record<string, boolean>>({});

  useFrame((state, raw) => {
    const camera = state.camera as THREE.PerspectiveCamera;
    const delta = clampDelta(raw);
    const sim = simRef.current;
    const r = sim.raft;
    const ev = events;
    const finale = sim.finale >= 0;
    const active = running && !sim.ended && !finale;
    const jumpPressed = pressed("action");

    if (active) sim.time += delta;

    /* ---------- dayung & arus ---------- */
    const held = input.current.held;
    const axis = active ? readAxis(input.current) : { x: 0, y: 0 };
    const strong = active && !!held.shift && !r.tired;
    r.stamina = THREE.MathUtils.clamp(r.stamina + (strong ? -delta / 3.6 : delta / 5.5), 0, 1);
    if (r.stamina <= 0.001) r.tired = true;
    if (r.tired && r.stamina > 0.35) r.tired = false;

    const fork = forkAt(r.s);
    let current = currentAt(r.s);
    if (fork && r.s > fork.s + 14) {
      const channel = nearestChannel(r.lat);
      if (channel !== fork.correct) current *= 0.62;
    }
    let target = current + (axis.y > 0 ? axis.y * 3.4 : axis.y * current * 0.6) + (strong ? 4.2 : 0);
    boost.current = Math.max(0, boost.current - delta);
    if (boost.current > 0) target += 6;

    /* ---------- pusaran outlier ---------- */
    let whirl = false;
    for (const hz of HAZARDS) {
      if (hz.kind !== "pusaran" || Math.abs(hz.s - r.s) > hz.r * 1.6) continue;
      const d = Math.hypot(hz.s - r.s, hz.lat - r.lat);
      if (d < hz.r * 1.35 && active) {
        whirl = true;
        r.lat += (hz.lat - r.lat) * delta * 1.1;
        target = Math.min(target, strong ? 7 : 1.6);
        r.spin += delta * 3.2;
        if (!whirlWarned.current) {
          whirlWarned.current = true;
          ev.toast({ ok: false, judul: "Terseret Pusaran Outlier!", teks: "Outlier (nilai ekstrem) bisa 'menyeret' kesimpulan. Tahan Shift untuk mendayung kuat keluar dari pusaran.", konsep: "Outlier" });
        }
      }
    }
    if (!whirl) r.spin = THREE.MathUtils.damp(wrap(r.spin), 0, 2.5, delta);

    if (finale) {
      target = r.s < L - 14 ? 2.2 : 0;
      r.lat = THREE.MathUtils.damp(r.lat, 0, 1.5, delta);
    }
    r.speed = THREE.MathUtils.damp(r.speed, active || finale ? target : 0, 1.6, delta);
    const prevS = r.s;
    r.s = Math.min(L - 10, r.s + r.speed * delta);

    /* ---------- kemudi ---------- */
    const latTarget = active ? axis.x * (strong ? 9 : 7.5) : 0;
    r.latVel = THREE.MathUtils.damp(r.latVel, latTarget, 5, delta);
    r.lat += r.latVel * delta;
    const half = widthAt(r.s) / 2 - 1.5;
    if (Math.abs(r.lat) > half) {
      const hard = Math.abs(r.latVel) > 4.5;
      r.lat = Math.sign(r.lat) * half;
      if (hard && active) {
        r.hp -= 4;
        r.bump = 0.6;
        fx.current?.shake(0.25);
        ev.sound("error");
      }
      r.latVel *= -0.35;
    }
    // Pulau pemisah kanal.
    if (fork) {
      const u = (r.s - fork.s) / FORK_LEN;
      const ih = islandHalf(u) + 1.3;
      for (const side of [-1, 1]) {
        const d = r.lat - side * ISLAND_LAT;
        if (ih > 1.35 && Math.abs(d) < ih) {
          const hard = Math.abs(r.latVel) > 4 || u > 0.08;
          r.lat = side * ISLAND_LAT + (Math.sign(d) || 1) * ih;
          if (hard && active && r.bump <= 0) {
            r.hp -= 5;
            r.bump = 0.6;
            r.speed *= 0.6;
            fx.current?.shake(0.2);
            ev.sound("error");
          }
          r.latVel *= -0.3;
        }
      }
    }
    r.bump = Math.max(0, r.bump - delta);

    /* ---------- vertikal: lompat & air terjun ---------- */
    const wave = Math.sin(sim.time * 1.8 + r.s * 0.1) * 0.06;
    const wy = waterY(r.s) + wave;
    if (active && jumpPressed && !r.airborne) {
      r.vy = 6.4;
      r.airborne = true;
      ev.sound("interact");
    }
    if (r.airborne || r.y > wy + 0.08) {
      r.airborne = true;
      r.vy -= 17 * delta;
      r.y += r.vy * delta;
      if (r.y <= wy) {
        if (r.vy < -7) {
          toWorld(r.s, r.lat, tmp);
          fx.current?.burst(tmp.x, wy + 0.3, tmp.z, "#e8f8ff", 26, 6);
          fx.current?.shake(Math.min(0.6, -r.vy * 0.04));
          ev.sound("boom");
        }
        r.y = wy;
        r.vy = 0;
        r.airborne = false;
      }
    } else {
      r.y = wy;
    }
    WATERFALLS.forEach((fall, k) => {
      if (!fallSeen.current[k] && prevS < fall.s && r.s >= fall.s) {
        fallSeen.current[k] = true;
        ev.toast({ ok: true, judul: k ? "Air terjun besar — WUUUSH!" : "Air terjun kecil!", teks: k ? "Pegangan! Arus di ngarai paling deras." : "Selamat datang di Sawah Terasering: tren penjualan dari bulan ke bulan.", konsep: undefined });
      }
    });

    /* ---------- tampilan rakit ---------- */
    const t = sim.time;
    r.yaw = THREE.MathUtils.damp(r.yaw, THREE.MathUtils.clamp(r.latVel * 0.055, -0.5, 0.5), 5, delta);
    r.roll = THREE.MathUtils.damp(r.roll, -r.latVel * 0.035 + Math.sin(t * 2.1) * 0.035 + (r.bump > 0 ? Math.sin(t * 40) * 0.08 : 0), 6, delta);
    r.pitch = THREE.MathUtils.damp(r.pitch, r.airborne ? THREE.MathUtils.clamp(-r.vy * 0.025, -0.3, 0.2) : Math.sin(t * 1.6) * 0.03, 6, delta);
    const paddlingNow = active && (axis.y > 0.1 || strong || Math.abs(axis.x) > 0.3);
    r.paddling = THREE.MathUtils.damp(r.paddling, paddlingNow ? 1 : 0.2, 4, delta);
    r.stroke += delta * (2.5 + r.paddling * 3 + (strong ? 3 : 0));

    /* ---------- tabrakan & pengumpulan ---------- */
    const high = r.y - wy;
    if (active) {
      // Babak 1: pelampung toko.
      SHOPS.forEach((shop) => {
        if (sim.shops[shop.index] !== "open") return;
        if (Math.abs(r.s - shop.s) < 2.4 && high < 2) {
          const clean = shop.cleanLeft ? -PAIR_LAT : PAIR_LAT;
          if (Math.abs(r.lat - clean) < HIT_RADIUS) resolvePair(sim.shops, shop.index, "clean", ev.shop, fx, shop.s, clean);
          else if (Math.abs(r.lat + clean) < HIT_RADIUS) resolvePair(sim.shops, shop.index, "dirty", ev.shop, fx, shop.s, -clean);
        } else if (r.s > shop.s + 3) resolvePair(sim.shops, shop.index, "miss", ev.shop, fx, shop.s, 0);
      });
      // Babak 2: gerbang bulan.
      MONTH_GATES.forEach((gate) => {
        if (sim.gates[gate.index] !== -2) return;
        if (prevS < gate.s && r.s >= gate.s) {
          let pick = 0;
          let best = Infinity;
          for (let k = 0; k < 3; k++) {
            const d = Math.abs(r.lat - (k - 1) * GATE_LAT);
            if (d < best) {
              best = d;
              pick = k;
            }
          }
          const post = [-1.5, -0.5, 0.5, 1.5].some((u) => Math.abs(r.lat - u * GATE_LAT) < 0.8);
          if (post) {
            r.hp -= 6;
            r.speed *= 0.5;
            r.bump = 0.6;
            fx.current?.shake(0.3);
          }
          sim.gates[gate.index] = pick;
          ev.gate(gate.index, pick);
          toWorld(gate.s, (pick - 1) * GATE_LAT, tmp);
          fx.current?.burst(tmp.x, waterY(gate.s) + 3, tmp.z, pick === gate.correct ? "#2fae66" : "#e54b4b", 22, 5);
        }
      });
      // Babak 3: porsi produk.
      SLICES.forEach((slice) => {
        if (sim.slices[slice.index] !== "open") return;
        if (Math.abs(r.s - slice.s) < 2.4 && high < 2) {
          const clean = slice.cleanLeft ? -PAIR_LAT : PAIR_LAT;
          if (Math.abs(r.lat - clean) < HIT_RADIUS) resolvePair(sim.slices, slice.index, "clean", ev.slice, fx, slice.s, clean);
          else if (Math.abs(r.lat + clean) < HIT_RADIUS) resolvePair(sim.slices, slice.index, "dirty", ev.slice, fx, slice.s, -clean);
        } else if (r.s > slice.s + 3) resolvePair(sim.slices, slice.index, "miss", ev.slice, fx, slice.s, 0);
      });
      // Percabangan.
      FORKS.forEach((f) => {
        if (sim.forks[f.id] !== -1) return;
        if (prevS < f.s + 12 && r.s >= f.s + 12) {
          const pick = nearestChannel(r.lat);
          sim.forks[f.id] = pick;
          ev.fork(f.id, pick);
          if (pick === f.correct) boost.current = 2.5;
        }
      });
      // Tetes data.
      ORBS.forEach((orb, i) => {
        if (sim.orbs[i] || Math.abs(orb.s - r.s) > 1.8 || Math.abs(orb.lat - r.lat) > 1.9) return;
        sim.orbs[i] = true;
        sim.orbCount += 1;
        sim.combo += 1;
        sim.bestCombo = Math.max(sim.bestCombo, sim.combo);
        r.speed += 0.5;
        toWorld(orb.s, orb.lat, tmp);
        fx.current?.burst(tmp.x, waterY(orb.s) + 1.1, tmp.z, "#7ee8fa", 8, 3);
        ev.sound("pickup");
        ev.orb(sim.orbCount, sim.combo);
      });
      // Rintangan.
      HAZARDS.forEach((hz, i) => {
        sim.hazardCd[i] = Math.max(0, sim.hazardCd[i] - delta);
        if (Math.abs(hz.s - r.s) > 8 || sim.hazardCd[i] > 0) return;
        const ds = hz.s - r.s;
        const dl = hz.lat - r.lat;
        if (hz.kind === "batu" && Math.hypot(ds, dl) < hz.r + 1.35 && high < hz.r * 0.9) {
          sim.hazardCd[i] = 1.5;
          r.hp -= 16;
          r.speed *= 0.3;
          r.latVel = -Math.sign(dl || 1) * 6;
          r.bump = 0.8;
          sim.combo = 0;
          fx.current?.shake(0.45);
          toWorld(r.s, r.lat, tmp);
          fx.current?.burst(tmp.x, r.y + 0.5, tmp.z, "#c9b36a", 12, 4);
          ev.sound("error");
          if (!hitOnce.current.batu) {
            hitOnce.current.batu = true;
            ev.hit("Braak! Rakit menabrak batu", "Arahkan rakit dengan A/D. Batu yang kecil bisa dilompati dengan Spasi.");
          } else ev.hit("", "");
        } else if (hz.kind === "kayu" && Math.abs(ds) < 1.1 && Math.abs(dl) < hz.r + 0.8) {
          if (high < 0.7) {
            sim.hazardCd[i] = 1.4;
            r.hp -= 12;
            r.speed = 0.5;
            r.s -= 0.6;
            r.bump = 0.8;
            sim.combo = 0;
            fx.current?.shake(0.4);
            ev.sound("error");
            if (!hitOnce.current.kayu) {
              hitOnce.current.kayu = true;
              ev.hit("Tersangkut kayu hanyut!", "Tekan Spasi sesaat sebelum kayu untuk melompatinya.");
            } else ev.hit("", "");
          } else {
            sim.hazardCd[i] = 3;
            sim.combo += 1;
            sim.bestCombo = Math.max(sim.bestCombo, sim.combo);
            ev.orb(sim.orbCount, sim.combo);
          }
        } else if (hz.kind === "arus" && Math.abs(ds) < 3.5 && Math.abs(dl) < hz.r + 0.6) {
          sim.hazardCd[i] = 2;
          boost.current = 1.6;
          ev.sound("pickup");
        }
      });
      // Sampan warga.
      SAMPANS.forEach((_, k) => {
        const b = sampanAt(k, sim.time);
        if (Math.abs(b.s - r.s) < 2.8 && Math.abs(b.lat - r.lat) < 1.8 && r.bump <= 0 && high < 1) {
          r.hp -= 5;
          r.bump = 0.7;
          r.latVel = -Math.sign(b.lat - r.lat || 1) * 6;
          r.speed *= 0.6;
          fx.current?.shake(0.25);
          ev.sound("error");
          ev.hit("Awas sampan warga!", "");
        }
      });
      // Titik simpan.
      for (const cp of CHECKPOINTS) if (r.s >= cp && cp > sim.checkpoint) sim.checkpoint = cp;
      // Zona.
      const zone = zoneAt(r.s).nama;
      if (zone !== sim.lastZone) {
        sim.lastZone = zone;
        ev.zone(zone);
      }
      // Rakit rusak → perbaiki di titik simpan terakhir.
      if (r.hp <= 0) {
        sim.repairs += 1;
        r.s = sim.checkpoint;
        r.lat = 0;
        r.latVel = 0;
        r.speed = 1;
        r.hp = 100;
        r.y = waterY(r.s);
        r.vy = 0;
        r.airborne = false;
        sim.combo = 0;
        ev.repair();
      }
      if (r.s >= FINALE_AT) {
        sim.finale = 0;
        ev.sound("success");
      }
    }

    /* ---------- finale ---------- */
    if (finale && !sim.ended) {
      sim.finale += delta;
      if (sim.finale >= FINALE_TIME) {
        sim.ended = true;
        ev.end();
      }
    }

    /* ---------- kamera ---------- */
    toWorld(r.s, r.lat, tmp);
    tmp.y = r.y;
    focus.current.pos.copy(tmp);
    focus.current.s = r.s;
    VIEW.s = r.s;
    const v = view.current;
    v.idle += delta;
    if (v.idle > 1.6) {
      v.yaw *= Math.exp(-delta * 1.2);
      v.pitch = THREE.MathUtils.damp(v.pitch, 0.34, 1.2, delta);
    }
    camHeading.current += wrap(headingAt(r.s + 6) - camHeading.current) * Math.min(1, delta * 2.4);
    if (!placed.current) {
      camHeading.current = headingAt(r.s + 6);
      camera.position.set(tmp.x - Math.sin(camHeading.current) * 11, tmp.y + 5, tmp.z - Math.cos(camHeading.current) * 11);
      placed.current = true;
    }
    if (finale) {
      const a = FINALE_CENTER.heading + Math.PI + 0.9 - sim.finale * 0.28;
      const cx = FINALE_CENTER.x + Math.sin(FINALE_CENTER.heading) * 40;
      const cz = FINALE_CENTER.z + Math.cos(FINALE_CENTER.heading) * 40;
      desired.set(cx + Math.sin(a) * 46, FINALE_CENTER.y + 18, cz + Math.cos(a) * 46);
      camera.position.lerp(desired, 1 - Math.exp(-delta * 1.6));
      lookTarget.set(cx, FINALE_CENTER.y + 6, cz);
      look.current.lerp(lookTarget, 1 - Math.exp(-delta * 2.5));
    } else {
      const yaw = camHeading.current + v.yaw;
      let dist = r.airborne ? 12.5 : 11;
      let cy = 0;
      for (; dist > 4; dist -= 0.8) {
        const flat = Math.cos(v.pitch) * dist;
        desired.set(tmp.x - Math.sin(yaw) * flat, 0, tmp.z - Math.cos(yaw) * flat);
        cy = tmp.y + 1.8 + Math.sin(v.pitch) * dist;
        if (terrainHeight(desired.x, desired.z) < cy - 1.2) break;
      }
      desired.y = Math.max(cy, terrainHeight(desired.x, desired.z) + 1.4);
      camera.position.lerp(desired, 1 - Math.exp(-delta * 5));
      lookTarget.set(tmp.x + Math.sin(yaw) * 6, tmp.y + 1.8, tmp.z + Math.cos(yaw) * 6);
      look.current.lerp(lookTarget, 1 - Math.exp(-delta * 8));
    }
    camera.lookAt(look.current);
    const fov = finale ? 55 : boost.current > 0 || strong ? 68 : 60;
    if (Math.abs(camera.fov - fov) > 0.05) {
      camera.fov = THREE.MathUtils.damp(camera.fov, fov, 4, delta);
      camera.updateProjectionMatrix();
    }

    /* ---------- HUD ---------- */
    const nextFork = FORKS.find((f) => sim.forks[f.id] === -1 && r.s > f.s - 150 && r.s < f.s + 14);
    const logAhead = HAZARDS.some((hz) => hz.kind === "kayu" && hz.s - r.s > 2 && hz.s - r.s < 16 && Math.abs(hz.lat - r.lat) < hz.r + 1);
    ev.hud({
      s: r.s,
      hp: r.hp,
      stamina: r.stamina,
      tired: r.tired,
      time: sim.time,
      boost: boost.current > 0,
      whirl,
      logAhead,
      airborne: r.airborne,
      fork: nextFork ? nextFork.id : -1,
      finale,
    });
  });

  return null;
}

function nearestChannel(lat: number) {
  let pick = 0;
  let best = Infinity;
  for (let k = 0; k < 3; k++) {
    const d = Math.abs(lat - channelLat(k));
    if (d < best) {
      best = d;
      pick = k;
    }
  }
  return pick;
}

function resolvePair(list: PairState[], index: number, state: PairState, emit: (index: number, state: PairState) => void, fx: RefObject<FxApi | null>, s: number, lat: number) {
  if (list[index] !== "open") return;
  list[index] = state;
  emit(index, state);
  if (state === "miss") return;
  toWorld(s, lat, tmp);
  fx.current?.burst(tmp.x, waterY(s) + 1.2, tmp.z, state === "clean" ? "#2fae66" : "#e54b4b", 22, 5);
}

/* ------------------------------------------------------------------ */
/* Overlay DOM                                                          */
/* ------------------------------------------------------------------ */

const PHASE_OF = (s: number): Phase => (s < MONTH_GATES[0].s - 60 ? "bar" : s < SLICES[0].s - 60 ? "line" : "pie");

interface Results {
  shops: PairState[];
  gates: number[];
  slices: PairState[];
  forks: number[];
}

function ChartPanel({ phase, results }: { phase: Phase; results: Results }) {
  if (phase === "bar") {
    const W = 220;
    const H = 110;
    const max = 240;
    return (
      <div className="river-chart">
        <small>GRAFIK BATANG · penjualan per toko</small>
        <svg viewBox={`0 0 ${W} ${H + 22}`} aria-hidden>
          <line x1={4} y1={H} x2={W - 4} y2={H} stroke="rgb(255 255 255 / .35)" />
          {SHOPS.map((shop, k) => {
            const st = results.shops[k];
            const value = st === "clean" ? shop.nilai : st === "dirty" ? shop.dirtyValue : 0;
            const h = (Math.max(0, Math.min(max, value)) / max) * (H - 14);
            const x = 8 + k * 30;
            return (
              <g key={k}>
                {st === "open" || st === "miss" ? (
                  <rect x={x} y={H - 40} width={20} height={40} fill="none" stroke={st === "miss" ? "#8d99ae" : "rgb(255 255 255 / .35)"} strokeDasharray="3 3" rx={3} />
                ) : (
                  <rect x={x} y={H - h} width={20} height={Math.max(2, h)} rx={3} fill={st === "clean" ? "#5b8def" : "#e54b4b"} />
                )}
                {st === "dirty" && value < 0 && <text x={x + 10} y={H - 4} textAnchor="middle" fontSize={11} fill="#ffb3b3" fontWeight={900}>−5</text>}
                {st !== "open" && st !== "miss" && value >= 0 && (
                  <text x={x + 10} y={H - h - 3} textAnchor="middle" fontSize={9} fill="white" fontWeight={800}>
                    {st === "dirty" ? "!" : shop.nilai}
                  </text>
                )}
                <text x={x + 10} y={H + 14} textAnchor="middle" fontSize={8.5} fill="rgb(255 255 255 / .75)">
                  {shop.label.slice(0, 5)}
                </text>
              </g>
            );
          })}
        </svg>
        <p>Tabrak pelampung berisi <b>data bersih</b>. Hindari nilai negatif, kosong, duplikat & salah format.</p>
      </div>
    );
  }
  if (phase === "line") {
    const W = 220;
    const H = 100;
    const y = (v: number) => H - ((Math.max(500, Math.min(900, v)) - 500) / 400) * (H - 12);
    const pts = MONTH_GATES.map((gate, k) => {
      const pick = results.gates[k];
      if (pick < 0) return null;
      const v = gate.options[pick];
      return { x: 14 + k * 38, y: y(v), ok: pick === gate.correct, v };
    });
    return (
      <div className="river-chart">
        <small>GRAFIK GARIS · tren Jan–Jun</small>
        <svg viewBox={`0 0 ${W} ${H + 22}`} aria-hidden>
          <line x1={4} y1={H} x2={W - 4} y2={H} stroke="rgb(255 255 255 / .35)" />
          <polyline points={pts.filter(Boolean).map((p) => `${p!.x},${p!.y}`).join(" ")} fill="none" stroke="#ffc857" strokeWidth={3} strokeLinejoin="round" />
          {pts.map((p, k) =>
            p ? <circle key={k} cx={p.x} cy={p.y} r={5} fill={p.ok ? "#ffc857" : "#e54b4b"} stroke="#10131a" strokeWidth={1.5} /> : null
          )}
          {MONTH_GATES.map((gate, k) => (
            <text key={gate.label} x={14 + k * 38} y={H + 14} textAnchor="middle" fontSize={9} fill="rgb(255 255 255 / .75)">
              {gate.label}
            </text>
          ))}
        </svg>
        <ul className="river-ledger">
          {MONTH_GATES.map((gate, k) => (
            <li key={gate.label} className={cn(results.gates[k] >= 0 && (results.gates[k] === gate.correct ? "is-ok" : "is-bad"))}>
              <span>{gate.label}</span>
              <b>{gate.nilai}</b>
            </li>
          ))}
        </ul>
        <p>Catatan penjualan bersih di atas. Lewati celah gerbang yang angkanya <b>sama</b>.</p>
      </div>
    );
  }
  const values = SLICES.map((slice, k) => (results.slices[k] === "clean" ? slice.nilai : results.slices[k] === "dirty" ? slice.dirtyValue : 0));
  const total = values.reduce((sum, v) => sum + v, 0);
  const colors = ["#b36bd6", "#ffc857", "#7ee8fa"];
  const R = 44;
  const lens = values.map((v) => (Math.max(0, v) / Math.max(100, total)) * Math.PI * 2);
  const starts = lens.map((_, k) => -Math.PI / 2 + lens.slice(0, k).reduce((sum, v) => sum + v, 0));
  const cx = 56;
  const cy = 56;
  return (
    <div className="river-chart">
      <small>GRAFIK LINGKARAN · komposisi produk</small>
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 112 112" className="!w-24 shrink-0" aria-hidden>
          <circle cx={cx} cy={cy} r={R} fill="rgb(255 255 255 / .08)" stroke="rgb(255 255 255 / .3)" strokeDasharray="4 4" />
          {values.map((v, k) => {
            if (v <= 0) return null;
            const len = lens[k];
            const x1 = cx + Math.cos(starts[k]) * R;
            const y1 = cy + Math.sin(starts[k]) * R;
            const x2 = cx + Math.cos(starts[k] + len) * R;
            const y2 = cy + Math.sin(starts[k] + len) * R;
            const large = len > Math.PI ? 1 : 0;
            return <path key={k} d={`M${cx} ${cy} L${x1.toFixed(2)} ${y1.toFixed(2)} A${R} ${R} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`} fill={results.slices[k] === "clean" ? colors[k] : "#e54b4b"} stroke="#10131a" strokeWidth={1.5} />;
          })}
        </svg>
        <ul className="river-ledger is-col">
          {SLICES.map((slice, k) => (
            <li key={slice.label} className={cn(results.slices[k] === "clean" && "is-ok", results.slices[k] === "dirty" && "is-bad")}>
              <i style={{ background: colors[k] }} />
              <span>{slice.label}</span>
              <b>{results.slices[k] === "open" ? "?" : `${values[k]}%`}</b>
            </li>
          ))}
          <li className={cn(total === 100 ? "is-ok" : total > 100 ? "is-bad" : "")}>
            <span>Total</span>
            <b>{total}%</b>
          </li>
        </ul>
      </div>
      <p>Porsi grafik lingkaran harus berjumlah <b>100%</b>.</p>
    </div>
  );
}

function RiverProgress({ simRef }: { simRef: RefObject<RiverSim> }) {
  const dot = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let frame = 0;
    const loop = () => {
      const s = simRef.current?.raft.s ?? 0;
      if (dot.current) dot.current.style.left = `${((s / L) * 100).toFixed(2)}%`;
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [simRef]);
  return (
    <div className="river-progress" aria-hidden>
      <div className="river-progress-track">
        {ZONES.map((zone) => (
          <i key={zone.id} style={{ left: `${(zone.from / L) * 100}%`, width: `${((Math.min(L, zone.to) - zone.from) / L) * 100}%`, background: zone.color }} />
        ))}
        {FORKS.map((fork) => (
          <b key={fork.id} style={{ left: `${(fork.s / L) * 100}%` }} />
        ))}
        <span ref={dot} />
      </div>
    </div>
  );
}

function ForkQuestion({ index, results }: { index: number; results: Results }) {
  const fork = FORKS[index];
  const labels = ["KIRI", "TENGAH", "KANAN"];
  return (
    <div className="river-question">
      <small>PERCABANGAN {index + 1}/3 · pilih kanal dengan grafik yang tepat</small>
      <strong>“{fork.question.pertanyaan}”</strong>
      <div>
        {fork.channels.map((kind: ChartKind, k) => (
          <span key={kind} className={cn(results.forks[index] === k && (k === fork.correct ? "is-ok" : "is-bad"))}>
            <em>{labels[k]}</em>
            {CHART_LABEL[kind]}
          </span>
        ))}
      </div>
    </div>
  );
}

const clock = (time: number) => {
  const secs = Math.floor(time);
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
};

const EMPTY_HUD: Hud = { s: RAFT_START, hp: 100, stamina: 1, tired: false, time: 0, boost: false, whirl: false, logAhead: false, airborne: false, fork: -1, finale: false };

/* ------------------------------------------------------------------ */
/* Level                                                                */
/* ------------------------------------------------------------------ */

export function RiverLevel({ levelIndex, info, paused, avatar, quality, input, sound, onPause, onFinish }: WorldLevelProps) {
  const simRef = useRef<RiverSim>(createSim());
  useEffect(() => {
    VIEW.s = RAFT_START;
  }, []);
  const focus = useRef({ pos: toWorld(RAFT_START, 0), s: RAFT_START });
  const view = useRef<View>({ yaw: 0, pitch: 0.34, idle: 0 });
  const fx = useRef<FxApi | null>(null);
  const raftGroup = useRef<THREE.Group>(null);
  const flora = useMemo(() => scatterFlora(quality), [quality]);

  const [hud, setHud] = useState<Hud>(EMPTY_HUD);
  const pushHud = useThrottled(setHud, 10);
  const [results, setResults] = useState<Results>(() => ({ shops: SHOPS.map(() => "open"), gates: MONTH_GATES.map(() => -2), slices: SLICES.map(() => "open"), forks: FORKS.map(() => -1) }));
  const [toast, setToast] = useState<Feedback>(null);
  const [zone, setZone] = useState<{ name: string; n: number } | null>(null);
  const [flash, setFlash] = useState<{ tone: "good" | "bad"; id: number } | null>(null);
  const [orbs, setOrbs] = useState({ count: 0, combo: 0 });
  const [ended, setEnded] = useState<{ time: number; repairs: number } | null>(null);

  const shopsOk = results.shops.filter((st) => st === "clean").length;
  const gatesOk = results.gates.filter((pick, k) => pick === MONTH_GATES[k].correct).length;
  const slicesOk = results.slices.filter((st) => st === "clean").length;
  const forksOk = results.forks.filter((pick, k) => pick === FORKS[k].correct).length;
  const bonus = ended ? (ended.time <= PAR_TIME ? 3 : ended.time <= PAR_TIME * 1.3 ? 1.5 : 0) + (ended.repairs === 0 ? 2 : 0) : 0;
  const score = clampPercent((shopsOk / SHOPS.length) * 35 + (gatesOk / MONTH_GATES.length) * 20 + (slicesOk / SLICES.length) * 10 + (forksOk / FORKS.length) * 30 + bonus);

  const events = useMemo<Events>(() => {
    const flashOf = (tone: "good" | "bad") => setFlash({ tone, id: performance.now() });
    return {
      sound,
      hud: pushHud,
      shop: (index, state) => {
        setResults((prev) => ({ ...prev, shops: prev.shops.map((st, k) => (k === index ? state : st)) }));
        const shop = SHOPS[index];
        if (state === "clean") {
          sound("success");
          flashOf("good");
          setToast({ ok: true, judul: `Toko ${shop.label}: ${shop.nilai} unit ✓`, teks: index === 2 ? "Tepat! Penjualan negatif (−5) sudah dibersihkan menjadi 0." : "Data bersih — batangnya akurat di grafik.", konsep: "Data bersih" });
        } else if (state === "dirty") {
          sound("error");
          flashOf("bad");
          setToast({ ok: false, judul: `Toko ${shop.label}: “${shop.dirtyText}” itu data kotor`, teks: `${shop.alasan} Nilai bersihnya ${shop.nilai}.`, konsep: "Data kotor → grafik menyesatkan" });
        } else {
          setToast({ ok: false, judul: `Toko ${shop.label} terlewat`, teks: "Batangnya kosong di grafik. Arahkan rakit ke salah satu pelampung.", konsep: undefined });
        }
      },
      gate: (index, pick) => {
        setResults((prev) => ({ ...prev, gates: prev.gates.map((g, k) => (k === index ? pick : g)) }));
        const gate = MONTH_GATES[index];
        const ok = pick === gate.correct;
        sound(ok ? "success" : "error");
        flashOf(ok ? "good" : "bad");
        setToast(
          ok
            ? { ok: true, judul: `${gate.label}: ${gate.nilai} ✓`, teks: "Titik tren tergambar tepat di grafik garis.", konsep: "Grafik garis" }
            : { ok: false, judul: `${gate.label}: seharusnya ${gate.nilai}`, teks: `Kamu melewati ${gate.options[pick]}. Satu titik yang salah bisa membuat tren terlihat naik/turun drastis.`, konsep: "Grafik garis" }
        );
      },
      slice: (index, state) => {
        setResults((prev) => ({ ...prev, slices: prev.slices.map((st, k) => (k === index ? state : st)) }));
        const slice = SLICES[index];
        if (state === "clean") {
          sound("success");
          flashOf("good");
          setToast({ ok: true, judul: `${slice.label}: ${slice.nilai}% ✓`, teks: "Porsi yang tepat — totalnya tetap 100%.", konsep: "Grafik lingkaran" });
        } else if (state === "dirty") {
          sound("error");
          flashOf("bad");
          setToast({ ok: false, judul: `${slice.label}: ${slice.dirtyValue}% tidak masuk akal`, teks: `Dengan nilai itu total porsi tidak lagi 100%. Porsi yang benar ${slice.nilai}%.`, konsep: "Grafik lingkaran" });
        } else {
          setToast({ ok: false, judul: `${slice.label} terlewat`, teks: "Irisan pie-nya hilang.", konsep: undefined });
        }
      },
      fork: (index, pick) => {
        setResults((prev) => ({ ...prev, forks: prev.forks.map((f, k) => (k === index ? pick : f)) }));
        const fork = FORKS[index];
        const ok = pick === fork.correct;
        sound(ok ? "success" : "error");
        flashOf(ok ? "good" : "bad");
        setToast({
          ok,
          judul: ok ? `Grafik ${CHART_LABEL[fork.channels[pick]]} — tepat! Arus lancar` : `Kurang tepat: lebih cocok grafik ${CHART_LABEL[fork.question.jawaban]}`,
          teks: fork.question.penjelasan,
          konsep: "Memilih visualisasi",
        });
      },
      orb: (count, combo) => setOrbs({ count, combo }),
      hit: (judul, teks) => {
        flashOf("bad");
        if (judul) setToast({ ok: false, judul, teks });
      },
      repair: () => {
        sound("boom");
        flashOf("bad");
        setToast({ ok: false, judul: "Rakit rusak — diperbaiki!", teks: "Kamu kembali ke titik simpan terakhir. Hindari batu, kayu, dan tepi sungai." });
      },
      zone: (name) => setZone((prev) => ({ name, n: (prev?.n ?? 0) + 1 })),
      toast: setToast,
      end: () => setEnded({ time: simRef.current.time, repairs: simRef.current.repairs }),
    };
  }, [sound, pushHud]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), toast.konsep ? 6500 : 3600);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (!zone) return;
    const id = setTimeout(() => setZone((prev) => (prev?.n === zone.n ? null : prev)), 2600);
    return () => clearTimeout(id);
  }, [zone]);

  const phase = PHASE_OF(hud.s);
  const finaleData = useMemo(
    () => ({
      bars: SHOPS.map((shop, k) => ({ value: results.shops[k] === "clean" ? shop.nilai : results.shops[k] === "dirty" ? shop.dirtyValue : 0, state: results.shops[k] })),
      line: MONTH_GATES.map((gate, k) => ({ value: results.gates[k] >= 0 ? gate.options[results.gates[k]] : 0, ok: results.gates[k] >= 0 ? results.gates[k] === gate.correct : null })),
      pie: SLICES.map((slice, k) => ({ value: results.slices[k] === "clean" ? slice.nilai : results.slices[k] === "dirty" ? slice.dirtyValue : 0, state: results.slices[k] })),
    }),
    [results]
  );

  let prompt: ReactNode;
  if (!ended && !hud.finale) {
    if (hud.whirl) prompt = <>Pusaran outlier! Tahan <kbd>Shift</kbd> untuk mendayung kuat</>;
    else if (hud.logAhead && !hud.airborne) prompt = <>Kayu di depan — tekan <kbd>Spasi</kbd> untuk melompat!</>;
    else if (hud.tired) prompt = <>Tenaga habis… tunggu pulih</>;
    else if (hud.time < 9) prompt = <><kbd>A/D</kbd>belok · <kbd>W</kbd>dayung · <kbd>Shift</kbd>dayung kuat · <kbd>Spasi</kbd>lompat</>;
  }

  return (
    <WorldStage
      quality={quality}
      paused={paused || !!ended}
      camera={{ position: [0, 8, 10], fov: 60, near: 0.3, far: 1800 }}
      background={RIVER_HORIZON}
      overlay={
        <>
          <WorldHud
            levelIndex={levelIndex}
            info={info}
            onPause={onPause}
            toast={toast}
            prompt={prompt}
            stats={
              <>
                <HudChip tone={hud.time > PAR_TIME ? "red" : "dark"}>
                  <Timer />
                  {clock(hud.time)}
                </HudChip>
                <HudChip tone="green">
                  <Droplets />
                  {orbs.count}
                </HudChip>
                {orbs.combo >= 3 && (
                  <HudChip tone="gold">
                    <Flame />×{orbs.combo}
                  </HudChip>
                )}
                <HudMeter label="RAKIT" value={hud.hp} tone={hud.hp < 35 ? "red" : hud.hp < 65 ? "gold" : "green"} />
                <HudMeter label="TENAGA" value={hud.stamina * 100} tone={hud.tired ? "red" : "gold"} />
              </>
            }
          />
          {!ended && !hud.finale && <RiverProgress simRef={simRef} />}
          {!ended && !hud.finale && <ChartPanel phase={phase} results={results} />}
          {!ended && hud.fork >= 0 && <ForkQuestion index={hud.fork} results={results} />}
          {!ended && zone && hud.fork < 0 && (
            <div key={zone.n} className="hunt-zone">
              <small>MEMASUKI</small>
              {zone.name}
            </div>
          )}
          {!ended && hud.finale && (
            <div className="hunt-zone is-finale">
              <small>GALERI DASBOR</small>
              Grafikmu siap dipresentasikan!
            </div>
          )}
          <ScreenFlash flash={flash} />
          {!ended && (
            <TouchControls
              inputRef={input}
              mode="stick"
              buttons={[
                { label: "Kuat", holdKey: "shift", tone: "light" },
                { press: "action", label: "Lompat" },
              ]}
            />
          )}
          {ended && (
            <LevelEnd
              score={score}
              reason="Galeri Dasbor terisi"
              detail={`Batang ${shopsOk}/${SHOPS.length} · garis ${gatesOk}/${MONTH_GATES.length} · pie ${slicesOk}/${SLICES.length} · pilihan grafik ${forksOk}/${FORKS.length} · waktu ${clock(ended.time)}${ended.repairs ? ` · ${ended.repairs}× perbaikan` : ""}.`}
              onNext={() => onFinish(score)}
            />
          )}
        </>
      }
    >
      <RiverNature quality={quality} focus={focus} flora={flora} />
      <CameraDrag view={view} />
      <RiverController input={input} running={!paused && !ended} simRef={simRef} focus={focus} view={view} events={events} fx={fx} />
      <Raft simRef={simRef} avatar={avatar} groupRef={raftGroup} />
      <Shops simRef={simRef} />
      <ShopBuoys simRef={simRef} />
      <MonthGates simRef={simRef} />
      <SliceBuoys simRef={simRef} />
      <ForkGates simRef={simRef} />
      <Hazards />
      <Orbs simRef={simRef} />
      <DashboardFinale simRef={simRef} bars={finaleData.bars} line={finaleData.line} pie={finaleData.pie} />
      <Effects apiRef={fx} />
    </WorldStage>
  );
}
