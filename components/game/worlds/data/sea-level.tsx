"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Crosshair, Flame, Package, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clampPercent, type Feedback } from "@/components/game/missions/mission-kit";
import type { SoundName } from "@/components/game/use-game-audio";
import { cn } from "@/lib/utils";
import { Effects, ScreenFlash, type FxApi } from "../erp/race-fx";
import { TouchControls } from "../touch-controls";
import { readAxis, usePressReader, type WorldInput } from "../world-controls";
import { clampDelta, HudChip, HudMeter, LevelEnd, WorldHud, WorldStage, useThrottled, type WorldLevelProps } from "../world-kit";
import {
  ANOMALY_TOTAL,
  BOTTLES,
  DOCK_RADIUS,
  FORECASTS,
  HARD_RADIUS,
  ISLANDS,
  JELLIES,
  KEEL,
  LIGHTHOUSE_DOCK,
  PLAY_RADIUS,
  pointOfSail,
  rockHit,
  sailEfficiency,
  scatterFlora,
  SEA_QUIZ,
  SEA_TIME,
  SHOP_DOCKS,
  START,
  terrainHeight,
  TREND,
  WHIRLPOOLS,
  windDir,
  WRECK,
} from "./sea-layout";
import { Bottles, DockMarkers, IslandShops, Jellies, Lighthouse, MAX_SHOTS, Pinisi, Rocks, Shots, Wake, Whirlpools, Wreck, type SeaSim } from "./sea-models";
import { SEA_HORIZON, SeaNature } from "./sea-scenery";

/* ------------------------------------------------------------------ */
/* Level 3 · Armada Prediksi                                            */
/* ------------------------------------------------------------------ */

const MAX_SPEED = 17;
const BOOST = 8;
const SHOT_SPEED = 62;
const SHOT_LIFE = 1.3;
const SHOT_COOLDOWN = 0.42;
const MIN_DELIVERIES = 5;
const DOCKS = [...SHOP_DOCKS, LIGHTHOUSE_DOCK];
const LIGHTHOUSE_INDEX = DOCKS.length - 1;

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const clock = (time: number) => {
  const t = Math.max(0, Math.ceil(time));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};

interface Hud {
  left: number;
  hull: number;
  stamina: number;
  tired: boolean;
  near: number;
  boundary: boolean;
  whirl: boolean;
  grounded: boolean;
}

const EMPTY_HUD: Hud = { left: SEA_TIME, hull: 100, stamina: 1, tired: false, near: -1, boundary: false, whirl: false, grounded: false };

interface View {
  yaw: number;
  pitch: number;
  idle: number;
  /** Arah pandang kamera (untuk kompas). */
  heading: number;
}

interface Events {
  sound: (name: SoundName) => void;
  hud: (hud: Hud, force?: boolean) => void;
  jelly: (index: number) => void;
  sting: () => void;
  crash: (hard: boolean) => void;
  bottle: () => void;
  evidence: () => void;
  dock: (index: number) => void;
  repair: () => void;
  timeout: () => void;
  zone: (name: string) => void;
  fire: () => void;
}

function createSim(): SeaSim {
  return {
    time: 0,
    wind: windDir(0),
    ship: { x: START.x, z: START.z, heading: START.heading, speed: 0, sail: 0.55, rudder: 0, roll: 0, pitch: 0, y: -0.35, stamina: 1, tired: false, boost: false, hull: 100, hurt: 9 },
    jellies: JELLIES.map((jelly, k) => ({ x: jelly.x, z: jelly.z, alive: true, pop: 0, phase: k * 1.37, vx: 0, vz: 0, cool: 0 })),
    shots: Array.from({ length: MAX_SHOTS }, () => ({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, target: -1 })),
    bottles: BOTTLES.map(() => false),
    deliveries: FORECASTS.map(() => null),
    evidence: false,
  };
}

/* ------------------------------------------------------------------ */
/* Kamera: seret untuk memutar                                          */
/* ------------------------------------------------------------------ */

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
      v.pitch = THREE.MathUtils.clamp(v.pitch + (event.clientY - lastY) * 0.003, 0.08, 0.95);
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

const fwd = new THREE.Vector3();
const camTarget = new THREE.Vector3();
const lookTarget = new THREE.Vector3();

function blockedAt(x: number, z: number) {
  return terrainHeight(x, z) > KEEL || !!rockHit(x, z, 1.4);
}

function SeaController({
  input,
  running,
  simRef,
  focus,
  viewRef,
  events,
  fx,
}: {
  input: WorldInput;
  running: boolean;
  simRef: RefObject<SeaSim>;
  focus: RefObject<{ pos: THREE.Vector3 }>;
  viewRef: RefObject<View>;
  events: Events;
  fx: RefObject<FxApi | null>;
}) {
  const { camera } = useThree();
  const pressed = usePressReader(input);
  const left = useRef(SEA_TIME);
  const cooldown = useRef(0);
  const crashCool = useRef(0);
  const zoneId = useRef("");
  const timedOut = useRef(false);
  const look = useRef(new THREE.Vector3(START.x, 2, START.z - 10));
  const placed = useRef(false);

  useFrame((_, raw) => {
    const dt = clampDelta(raw);
    const sim = simRef.current;
    const ship = sim.ship;
    const hud: Hud = { left: left.current, hull: ship.hull, stamina: ship.stamina, tired: ship.tired, near: -1, boundary: false, whirl: false, grounded: false };

    if (running) {
      sim.time += dt;
      sim.wind = windDir(sim.time);
      const axis = readAxis(input.current);
      const held = input.current.held;

      /* ---- layar, mesin, kemudi ---- */
      ship.sail = THREE.MathUtils.clamp(ship.sail + axis.y * dt * 0.75, 0, 1);
      const wantBoost = !!held.shift && !ship.tired;
      ship.boost = wantBoost && ship.stamina > 0;
      ship.stamina = THREE.MathUtils.clamp(ship.stamina + (ship.boost ? -dt * 0.3 : dt * 0.13), 0, 1);
      if (ship.stamina <= 0) ship.tired = true;
      if (ship.tired && ship.stamina > 0.35) ship.tired = false;
      const rel = wrap(sim.wind - ship.heading);
      const eff = sailEfficiency(rel);
      const gust = 1 + Math.sin(sim.time * 0.7) * 0.08;
      const target = ship.sail * MAX_SPEED * eff * gust + (ship.boost ? BOOST : 0);
      ship.speed = THREE.MathUtils.damp(ship.speed, target, target > ship.speed ? 0.7 : 1.3, dt);
      ship.rudder = THREE.MathUtils.damp(ship.rudder, axis.x, 5, dt);
      const turn = (0.35 + Math.min(1, Math.abs(ship.speed) / 10) * 0.55) * 0.95;
      ship.heading -= ship.rudder * turn * dt * (ship.speed < -0.5 ? -1 : 1);

      fwd.set(Math.sin(ship.heading), 0, Math.cos(ship.heading));
      let vx = fwd.x * ship.speed;
      let vz = fwd.z * ship.speed;

      /* ---- pusaran ---- */
      for (const w of WHIRLPOOLS) {
        const dx = w.x - ship.x;
        const dz = w.z - ship.z;
        const d = Math.hypot(dx, dz);
        if (d > w.r * 1.7) continue;
        const k = 1 - d / (w.r * 1.7);
        vx += (dx / d) * k * 7 + (-dz / d) * k * 6;
        vz += (dz / d) * k * 7 + (dx / d) * k * 6;
        ship.heading += k * dt * 0.9;
        hud.whirl = true;
        if (d < w.r * 0.4) {
          ship.hull -= dt * 14;
          ship.hurt = 0;
        }
      }

      /* ---- arus balik di tepi dunia ---- */
      const R = Math.hypot(ship.x, ship.z);
      if (R > PLAY_RADIUS) {
        const k = (R - PLAY_RADIUS) / (HARD_RADIUS - PLAY_RADIUS);
        vx -= (ship.x / R) * k * 16;
        vz -= (ship.z / R) * k * 16;
        const home = Math.atan2(-ship.x, -ship.z);
        ship.heading += wrap(home - ship.heading) * Math.min(1, dt * k * 0.9);
        hud.boundary = true;
      }

      /* ---- gerak & tabrakan ---- */
      const nx = ship.x + vx * dt;
      const nz = ship.z + vz * dt;
      const bowX = nx + fwd.x * 5.2;
      const bowZ = nz + fwd.z * 5.2;
      const hit = blockedAt(bowX, bowZ) || blockedAt(nx, nz) || blockedAt(nx + fwd.z * 1.7, nz - fwd.x * 1.7) || blockedAt(nx - fwd.z * 1.7, nz + fwd.x * 1.7);
      crashCool.current -= dt;
      if (hit) {
        const impact = Math.abs(ship.speed);
        ship.speed = -Math.sign(ship.speed || 1) * Math.min(3, impact * 0.35);
        ship.x -= fwd.x * 0.25;
        ship.z -= fwd.z * 0.25;
        hud.grounded = true;
        if (crashCool.current <= 0 && impact > 4.5) {
          crashCool.current = 0.8;
          ship.hull -= (impact - 3.5) * 2.4;
          ship.hurt = 0;
          fx.current?.shake(0.5);
          fx.current?.burst(bowX, 0.6, bowZ, "#ffffff", 14, 5);
          events.crash(impact > 9);
        }
      } else {
        ship.x = nx;
        ship.z = nz;
      }
      const R2 = Math.hypot(ship.x, ship.z);
      if (R2 > HARD_RADIUS) {
        ship.x *= HARD_RADIUS / R2;
        ship.z *= HARD_RADIUS / R2;
      }

      /* ---- goyangan ombak ---- */
      const heel = Math.sign(rel || 1) * ship.sail * eff * 0.05;
      ship.y = -0.35 + Math.sin(sim.time * 1.3) * 0.16 + Math.sin(sim.time * 0.7 + 1) * 0.08;
      ship.pitch = Math.sin(sim.time * 1.1) * 0.035 + Math.min(0.05, ship.speed * 0.002);
      ship.roll = -ship.rudder * Math.min(1, ship.speed / 12) * 0.12 + Math.sin(sim.time * 0.9) * 0.035 + heel;
      ship.hurt += dt;

      /* ---- meriam sonar ---- */
      cooldown.current -= dt;
      if (pressed("action") && cooldown.current <= 0) {
        cooldown.current = SHOT_COOLDOWN;
        let slotIndex = 0;
        for (let k = 0; k < sim.shots.length; k++) {
          if (sim.shots[k].life <= 0) {
            slotIndex = k;
            break;
          }
        }
        let best = -1;
        let bestScore = Infinity;
        sim.jellies.forEach((j, k) => {
          if (!j.alive) return;
          const dx = j.x - ship.x;
          const dz = j.z - ship.z;
          const d = Math.hypot(dx, dz);
          if (d > 75 || d < 2) return;
          const ang = Math.abs(wrap(Math.atan2(dx, dz) - ship.heading));
          if (ang > 0.38) return;
          const score = ang * 60 + d;
          if (score < bestScore) {
            bestScore = score;
            best = k;
          }
        });
        const sx = ship.x + fwd.x * 6.2;
        const sz = ship.z + fwd.z * 6.2;
        Object.assign(sim.shots[slotIndex], { x: sx, y: 2.4, z: sz, vx: fwd.x * SHOT_SPEED + vx * 0.3, vy: 0, vz: fwd.z * SHOT_SPEED + vz * 0.3, life: SHOT_LIFE, target: best });
        fx.current?.burst(sx, 2.4, sz, "#7ee8fa", 6, 3);
        events.fire();
      }
      sim.shots.forEach((shot) => {
        if (shot.life <= 0) return;
        shot.life -= dt;
        if (shot.target >= 0 && sim.jellies[shot.target].alive) {
          const j = sim.jellies[shot.target];
          const dx = j.x - shot.x;
          const dy = 1.6 - shot.y;
          const dz = j.z - shot.z;
          const d = Math.hypot(dx, dy, dz) || 1;
          const k = Math.min(1, dt * 7);
          shot.vx += (dx / d * SHOT_SPEED - shot.vx) * k;
          shot.vy += (dy / d * SHOT_SPEED - shot.vy) * k;
          shot.vz += (dz / d * SHOT_SPEED - shot.vz) * k;
        }
        shot.x += shot.vx * dt;
        shot.y += shot.vy * dt;
        shot.z += shot.vz * dt;
        if (terrainHeight(shot.x, shot.z) > shot.y) {
          shot.life = 0;
          fx.current?.burst(shot.x, shot.y, shot.z, "#e0d6b8", 8, 3);
          return;
        }
        for (let k = 0; k < sim.jellies.length; k++) {
          const j = sim.jellies[k];
          if (!j.alive) continue;
          if (Math.hypot(j.x - shot.x, j.z - shot.z) < 2.3 && Math.abs(shot.y - 1.6) < 3) {
            j.alive = false;
            j.pop = 0;
            shot.life = 0;
            const def = JELLIES[k];
            fx.current?.burst(j.x, 1.6, j.z, def.anomali ? "#ff5d5d" : def.color, 22, 7);
            events.jelly(k);
            break;
          }
        }
      });

      /* ---- ubur-ubur data ---- */
      sim.jellies.forEach((j, k) => {
        if (!j.alive) {
          j.pop = Math.min(1, j.pop + dt * 2.5);
          return;
        }
        const def = JELLIES[k];
        j.cool -= dt;
        const t = sim.time + j.phase;
        // Mengapung pelan mengelilingi titik asalnya.
        const hx = def.x + Math.sin(t * 0.15) * (def.anomali ? 7 : 3);
        const hz = def.z + Math.cos(t * 0.12) * (def.anomali ? 7 : 3);
        let ax = (hx - j.x) * 0.4;
        let az = (hz - j.z) * 0.4;
        const dx = ship.x - j.x;
        const dz = ship.z - j.z;
        const d = Math.hypot(dx, dz);
        // Anomali agresif: mengejar kapal bila dekat.
        if (def.anomali && d < 34 && j.cool <= 0) {
          ax = (dx / d) * 4.2;
          az = (dz / d) * 4.2;
        }
        j.vx = THREE.MathUtils.damp(j.vx, ax, 2, dt);
        j.vz = THREE.MathUtils.damp(j.vz, az, 2, dt);
        const jx = j.x + j.vx * dt;
        const jz = j.z + j.vz * dt;
        if (terrainHeight(jx, jz) < -1.5) {
          j.x = jx;
          j.z = jz;
        }
        if (def.anomali && d < 4.4 && j.cool <= 0) {
          j.cool = 2.5;
          j.vx = (-dx / d) * 14;
          j.vz = (-dz / d) * 14;
          ship.hull -= 10;
          ship.hurt = 0;
          fx.current?.shake(0.35);
          fx.current?.burst(j.x, 1.4, j.z, "#ff5d5d", 12, 5);
          events.sting();
        }
      });

      /* ---- botol emas ---- */
      BOTTLES.forEach((b, k) => {
        if (sim.bottles[k]) return;
        if (Math.hypot(b.x - ship.x, b.z - ship.z) < 4.2) {
          sim.bottles[k] = true;
          left.current += 5;
          fx.current?.burst(b.x, 0.8, b.z, "#ffc857", 14, 5);
          events.bottle();
        }
      });

      /* ---- bukti kapal kandas ---- */
      if (!sim.evidence && Math.hypot(WRECK.x - ship.x, WRECK.z - ship.z) < WRECK.radius) {
        sim.evidence = true;
        events.evidence();
      }

      /* ---- zona pulau ---- */
      let zone = "";
      let closest = 1;
      for (const island of ISLANDS) {
        if (island.shop === undefined && island.id !== "pelabuhan" && island.id !== "mercusuar") continue;
        const k = Math.hypot(island.x - ship.x, island.z - ship.z) / (island.r * 2.1 + 12);
        if (k < closest) {
          closest = k;
          zone = island.id;
        }
      }
      if (zone !== zoneId.current) {
        zoneId.current = zone;
        const island = ISLANDS.find((item) => item.id === zone);
        if (island) events.zone(island.nama);
      }

      /* ---- labuh ---- */
      DOCKS.forEach((dock, k) => {
        if (Math.hypot(dock.x - ship.x, dock.z - ship.z) < DOCK_RADIUS + 4) {
          const shop = dock.island.shop;
          if (shop === undefined || sim.deliveries[shop] === null) hud.near = k;
        }
      });
      if (pressed("interact") && hud.near >= 0) {
        ship.speed = 0;
        events.dock(hud.near);
      }

      /* ---- waktu & lambung ---- */
      left.current -= dt;
      if (left.current <= 0 && !timedOut.current) {
        timedOut.current = true;
        events.timeout();
      }
      if (ship.hull <= 0) {
        ship.hull = 100;
        ship.x = START.x;
        ship.z = START.z;
        ship.heading = START.heading;
        ship.speed = 0;
        left.current = Math.max(1, left.current - 20);
        fx.current?.shake(0.8);
        events.repair();
      }
      hud.left = left.current;
      hud.hull = ship.hull;
      hud.stamina = ship.stamina;
      hud.tired = ship.tired;
      events.hud(hud);
    } else {
      // Buang ketukan yang terjadi saat panel terbuka agar tidak memicu aksi saat lanjut.
      pressed("interact");
      pressed("action");
    }

    /* ---- kamera ---- */
    const v = viewRef.current;
    v.idle += dt;
    if (v.idle > 2.5) v.yaw = THREE.MathUtils.damp(v.yaw, 0, 1.2, dt);
    const camAngle = ship.heading + Math.PI + v.yaw;
    // Layar potret (ponsel): kamera sedikit lebih jauh agar kapal tidak memenuhi layar.
    const dist = (camera as THREE.PerspectiveCamera).aspect < 1 ? 23 : 17;
    camTarget.set(ship.x + Math.sin(camAngle) * dist * Math.cos(v.pitch), 3 + dist * Math.sin(v.pitch), ship.z + Math.cos(camAngle) * dist * Math.cos(v.pitch));
    const ground = terrainHeight(camTarget.x, camTarget.z);
    camTarget.y = Math.max(camTarget.y, ground + 2.5, 1.2);
    fwd.set(Math.sin(ship.heading), 0, Math.cos(ship.heading));
    lookTarget.set(ship.x + fwd.x * 5, 3.2, ship.z + fwd.z * 5);
    if (!placed.current) {
      camera.position.copy(camTarget);
      look.current.copy(lookTarget);
      placed.current = true;
    }
    camera.position.lerp(camTarget, 1 - Math.exp(-dt * 4));
    look.current.lerp(lookTarget, 1 - Math.exp(-dt * 7));
    camera.lookAt(look.current);
    v.heading = camAngle + Math.PI;
    focus.current.pos.set(ship.x, 0, ship.z);
  });
  return null;
}

/* ------------------------------------------------------------------ */
/* Overlay DOM: kompas, peta mini, angin                                */
/* ------------------------------------------------------------------ */

function Compass({ simRef, view }: { simRef: RefObject<SeaSim>; view: RefObject<View> }) {
  const strip = useRef<HTMLDivElement>(null);
  const ticks = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const loop = () => {
      const sim = simRef.current;
      const el = strip.current;
      if (el && sim) {
        const width = el.clientWidth;
        const ship = sim.ship;
        const shops = SHOP_DOCKS.filter((dock) => sim.deliveries[dock.island.shop!] === null)
          .map((dock) => ({ x: dock.x, z: dock.z, d: Math.hypot(dock.x - ship.x, dock.z - ship.z), label: `Toko ${FORECASTS[dock.island.shop!].toko}`, color: dock.island.color }))
          .sort((a, b) => a.d - b.d)
          .slice(0, 2);
        const done = sim.deliveries.filter((d) => d !== null).length;
        const targets = [...shops];
        if (done >= MIN_DELIVERIES) targets.push({ x: LIGHTHOUSE_DOCK.x, z: LIGHTHOUSE_DOCK.z, d: Math.hypot(LIGHTHOUSE_DOCK.x - ship.x, LIGHTHOUSE_DOCK.z - ship.z), label: "Mercusuar", color: "#ffffff" });
        if (!sim.evidence) targets.push({ x: WRECK.x, z: WRECK.z, d: Math.hypot(WRECK.x - ship.x, WRECK.z - ship.z), label: "Kapal suplai hilang?", color: "#e76f51" });
        el.querySelectorAll<HTMLElement>("[data-marker]").forEach((node, k) => {
          const t = targets[k];
          if (!t) {
            node.style.display = "none";
            return;
          }
          const b = wrap(Math.atan2(t.x - ship.x, t.z - ship.z) - view.current.heading);
          const clamped = THREE.MathUtils.clamp(b, -Math.PI / 2, Math.PI / 2);
          node.style.display = "flex";
          node.style.left = `${((0.5 - clamped / Math.PI) * width).toFixed(1)}px`;
          node.style.setProperty("--marker", t.color);
          node.dataset.edge = Math.abs(b) > Math.PI / 2 ? (b > 0 ? "left" : "right") : "";
          const label = node.querySelector("span");
          if (label) label.textContent = `${t.label} · ${Math.round(t.d)} m`;
        });
        if (ticks.current) {
          const offset = ((view.current.heading / (Math.PI * 2)) * width * 2) % (width / 2);
          ticks.current.style.backgroundPosition = `${offset.toFixed(1)}px 0`;
        }
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [simRef, view]);
  return (
    <div className="drone-compass hunt-compass" ref={strip} aria-hidden>
      <div className="drone-compass-ticks" ref={ticks} />
      <div className="drone-compass-center" />
      {[0, 1, 2, 3].map((k) => (
        <div key={k} className="drone-compass-marker" data-marker>
          <b />
          <span />
        </div>
      ))}
    </div>
  );
}

const MAP_R = 280;
const MAP_SIZE = 200;
const mx = (x: number) => ((x + MAP_R) / (MAP_R * 2)) * MAP_SIZE;
const ms = (r: number) => (r / (MAP_R * 2)) * MAP_SIZE;
const rotDeg = (h: number) => ((Math.PI - h) * 180) / Math.PI;

function MiniMap({ simRef }: { simRef: RefObject<SeaSim> }) {
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    let frame = 0;
    const loop = () => {
      const sim = simRef.current;
      const root = svg.current;
      if (root && sim) {
        const ship = sim.ship;
        root.querySelector("[data-player]")?.setAttribute("transform", `translate(${mx(ship.x).toFixed(1)} ${mx(ship.z).toFixed(1)}) rotate(${rotDeg(ship.heading).toFixed(1)})`);
        root.querySelector("[data-wind]")?.setAttribute("transform", `translate(${MAP_SIZE - 22} 22) rotate(${rotDeg(sim.wind).toFixed(1)})`);
        root.querySelectorAll<SVGCircleElement>("[data-jelly]").forEach((node, k) => {
          const j = sim.jellies[k];
          node.setAttribute("visibility", j?.alive ? "visible" : "hidden");
          if (j) {
            node.setAttribute("cx", mx(j.x).toFixed(1));
            node.setAttribute("cy", mx(j.z).toFixed(1));
          }
        });
        root.querySelectorAll<SVGCircleElement>("[data-dock]").forEach((node, k) => {
          const st = sim.deliveries[k];
          node.setAttribute("fill", st === true ? "#2fae66" : st === false ? "#e54b4b" : "#ffc857");
        });
        root.querySelector("[data-wreck]")?.setAttribute("visibility", sim.evidence ? "hidden" : "visible");
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [simRef]);
  return (
    <div className="race-minimap hunt-minimap" aria-hidden>
      <svg ref={svg} viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}>
        <defs>
          <clipPath id="sea-map-clip">
            <circle cx={MAP_SIZE / 2} cy={MAP_SIZE / 2} r={MAP_SIZE / 2 - 2} />
          </clipPath>
        </defs>
        <g clipPath="url(#sea-map-clip)">
          <rect width={MAP_SIZE} height={MAP_SIZE} fill="#2f7d95" />
          <circle cx={MAP_SIZE / 2} cy={MAP_SIZE / 2} r={ms(PLAY_RADIUS)} fill="#3a8fa8" />
          {ISLANDS.map((island) => (
            <circle key={island.id} cx={mx(island.x)} cy={mx(island.z)} r={Math.max(2, ms(island.r * 1.05))} fill={island.kind === "vulkanik" ? "#5c5552" : island.kind === "atol" ? "#e6dcae" : "#6ea64c"} stroke="#eedfae" strokeWidth={1} />
          ))}
          {WHIRLPOOLS.map((w, k) => (
            <circle key={k} cx={mx(w.x)} cy={mx(w.z)} r={ms(w.r)} fill="none" stroke="#dff6ff" strokeWidth={1} strokeDasharray="2 2" />
          ))}
          {JELLIES.map((jelly) => (
            <circle key={jelly.id} data-jelly r={2.2} cx={mx(jelly.x)} cy={mx(jelly.z)} fill="#7ee8fa" />
          ))}
          {SHOP_DOCKS.map((dock, k) => (
            <circle key={k} data-dock r={4} cx={mx(dock.x)} cy={mx(dock.z)} fill="#ffc857" stroke="#10131a" strokeWidth={1.2} />
          ))}
          <rect x={mx(LIGHTHOUSE_DOCK.x) - 4} y={mx(LIGHTHOUSE_DOCK.z) - 4} width={8} height={8} fill="#ffffff" stroke="#d62828" strokeWidth={1.5} transform={`rotate(45 ${mx(LIGHTHOUSE_DOCK.x)} ${mx(LIGHTHOUSE_DOCK.z)})`} />
          <text data-wreck x={mx(WRECK.x)} y={mx(WRECK.z) + 4} textAnchor="middle" fontSize={12} fontWeight={900} fill="#e76f51">?</text>
          <g data-player>
            <path d="M0 -7 L5 5 L0 2 L-5 5 Z" fill="#ffffff" stroke="#10131a" strokeWidth={1.2} />
          </g>
        </g>
        <circle cx={MAP_SIZE - 22} cy={22} r={15} fill="rgb(16 19 26 / .7)" />
        <g data-wind>
          <path d="M0 -10 L5 2 L1.5 0 L1.5 9 L-1.5 9 L-1.5 0 L-5 2 Z" fill="#ffffff" />
        </g>
      </svg>
    </div>
  );
}

function WindGauge({ simRef }: { simRef: RefObject<SeaSim> }) {
  const arrow = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const sail = useRef<HTMLElement>(null);
  const eff = useRef<HTMLElement>(null);
  useEffect(() => {
    let frame = 0;
    const loop = () => {
      const sim = simRef.current;
      if (sim) {
        const rel = wrap(sim.wind - sim.ship.heading);
        // Panah menunjuk arah angin bertiup relatif terhadap haluan (atas = depan).
        if (arrow.current) arrow.current.style.transform = `rotate(${(-rel * 180) / Math.PI + 180}deg)`;
        if (label.current) label.current.textContent = pointOfSail(rel);
        if (sail.current) sail.current.style.width = `${Math.round(sim.ship.sail * 100)}%`;
        if (eff.current) eff.current.textContent = `${Math.round(sailEfficiency(rel) * sim.ship.sail * 100)}%`;
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [simRef]);
  return (
    <div className="sea-wind" aria-hidden>
      <div className="sea-wind-dial">
        <i className="sea-wind-boat" />
        <div ref={arrow} className="sea-wind-arrow" />
      </div>
      <div className="sea-wind-info">
        <small>ANGIN</small>
        <span ref={label}>—</span>
        <div className="sea-wind-bar"><i ref={sail} /></div>
        <p>Layar · tenaga <b ref={eff}>0%</b></p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Panel pengiriman (prediksi stok)                                     */
/* ------------------------------------------------------------------ */

function TrendSpark() {
  const w = 220;
  const h = 64;
  const max = 900;
  const min = 550;
  const pts = TREND.map((item, k) => ({ x: 12 + k * 32, y: h - 8 - ((item.nilai - min) / (max - min)) * (h - 16), label: item.label }));
  const last = pts[pts.length - 1];
  const july = { x: last.x + 32, y: h - 8 - ((TREND[TREND.length - 1].nilai * 1.05 - min) / (max - min)) * (h - 16) };
  return (
    <svg viewBox={`0 0 ${w} ${h + 12}`} className="sea-trend">
      <polyline points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="#2a6f97" strokeWidth={3} strokeLinejoin="round" />
      <line x1={last.x} y1={last.y} x2={july.x} y2={july.y} stroke="#e76f51" strokeWidth={3} strokeDasharray="4 3" />
      {pts.map((p) => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r={3.5} fill="#2a6f97" />
          <text x={p.x} y={h + 10} fontSize={9} textAnchor="middle" fill="currentColor">{p.label}</text>
        </g>
      ))}
      <circle cx={july.x} cy={july.y} r={4.5} fill="#e76f51" />
      <text x={july.x} y={h + 10} fontSize={9} fontWeight={800} textAnchor="middle" fill="#e76f51">Jul?</text>
    </svg>
  );
}

function DeliveryPanel({ shop, evidence, picked, onPick, onClose }: { shop: number; evidence: boolean; picked: number | null; onPick: (k: number) => void; onClose: () => void }) {
  const f = FORECASTS[shop];
  const dock = SHOP_DOCKS[shop];
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (picked === null && ["Digit1", "Digit2", "Digit3", "Numpad1", "Numpad2", "Numpad3"].includes(event.code)) {
        onPick(Number(event.code.slice(-1)) - 1);
      } else if (picked !== null && (event.code === "KeyE" || event.code === "Enter" || event.code === "Space")) {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [picked, onPick, onClose]);
  const option = picked !== null ? f.opsi[picked] : null;
  return (
    <div className="world-overlay-card mission-pop sea-deliver">
      <p className="text-xs font-black tracking-[0.15em] text-muted-foreground">{dock.island.nama.toUpperCase()} · PREDIKSI STOK</p>
      <p className="mt-1 font-black">Toko {f.toko}: berapa sak semen yang kamu turunkan untuk bulan Juli?</p>
      <div className="sea-deliver-data">
        <div>
          <small>Penjualan bulan lalu</small>
          <strong>{f.nilai} sak</strong>
          {f.toko === "Barokah" && <em className={evidence ? "is-ok" : undefined}>{evidence ? "📌 Bukti: kapal suplai kandas di karang — kiriman terputus 3 minggu." : "Kabar warga: kapal suplai Barokah hilang di dekat karang…"}</em>}
          {f.toko === "Berkah" && <em>Catatan: ada transaksi Rp650.000/sak di data lama.</em>}
        </div>
        <div>
          <small>Tren total Jan–Jun (+5%/bln)</small>
          <TrendSpark />
        </div>
      </div>
      <div className="mt-3 grid gap-2">
        {f.opsi.map((opt, k) => (
          <button
            key={k}
            disabled={picked !== null}
            onClick={() => onPick(k)}
            className={cn(
              "flex items-center gap-2 rounded-2xl border-2 p-3 text-left text-sm font-semibold transition",
              picked === null && "border-border hover:border-track-data hover:bg-track-data-soft",
              picked !== null && opt.benar && "border-emerald-500 bg-emerald-50",
              picked === k && !opt.benar && "border-track-audit bg-track-audit-soft"
            )}
          >
            <kbd className="rounded-md bg-foreground px-1.5 text-xs font-black text-background">{k + 1}</kbd>
            {opt.label}
          </button>
        ))}
      </div>
      {option && (
        <>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{option.penjelasan}</p>
          <Button className="mt-3 w-full" onClick={onClose}>
            Lanjut berlayar (E)
          </Button>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Level                                                                */
/* ------------------------------------------------------------------ */

export function SeaLevel({ levelIndex, info, paused, avatar, quality, input, sound, onPause, onFinish }: WorldLevelProps) {
  const simRef = useRef<SeaSim>(createSim());
  const focus = useRef({ pos: new THREE.Vector3(START.x, 0, START.z) });
  const view = useRef<View>({ yaw: 0, pitch: 0.3, idle: 0, heading: START.heading });
  const fx = useRef<FxApi | null>(null);
  const shipGroup = useRef<THREE.Group>(null);
  const flora = useMemo(() => scatterFlora(quality), [quality]);

  const [hud, setHud] = useState<Hud>(EMPTY_HUD);
  const pushHud = useThrottled(setHud, 10);
  const [toast, setToast] = useState<Feedback>(null);
  const [zone, setZone] = useState<{ name: string; n: number } | null>(null);
  const [flash, setFlash] = useState<{ tone: "good" | "bad"; id: number } | null>(null);
  const [anomHit, setAnomHit] = useState(0);
  const [wrongShots, setWrongShots] = useState(0);
  const [bottles, setBottles] = useState({ count: 0, combo: 0 });
  const [deliveries, setDeliveries] = useState<(boolean | null)[]>(() => FORECASTS.map(() => null));
  const [evidence, setEvidence] = useState(false);
  const [repairs, setRepairs] = useState(0);
  const [panel, setPanel] = useState<number | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [asking, setAsking] = useState(false);
  const [question, setQuestion] = useState(0);
  const [quizPick, setQuizPick] = useState<string | null>(null);
  const [quizCorrect, setQuizCorrect] = useState(0);
  const [ended, setEnded] = useState(false);
  const lastBottle = useRef(-99);

  const delivered = deliveries.filter((d) => d !== null).length;
  const deliveredOk = deliveries.filter((d) => d === true).length;
  const score = clampPercent(
    Math.max(0, Math.min(1, (anomHit - wrongShots * 0.5) / ANOMALY_TOTAL)) * 25 +
      (deliveredOk / FORECASTS.length) * 35 +
      (evidence ? 10 : 0) +
      (quizCorrect / SEA_QUIZ.length) * 30 +
      (repairs === 0 ? 2 : 0)
  );

  const events = useMemo<Events>(() => {
    const flashOf = (tone: "good" | "bad") => setFlash({ tone, id: performance.now() });
    return {
      sound,
      hud: pushHud,
      fire: () => sound("shoot"),
      jelly: (index) => {
        const def = JELLIES[index];
        if (def.anomali) {
          sound("success");
          flashOf("good");
          setAnomHit((n) => n + 1);
          setToast({ ok: true, judul: `Anomali dibersihkan: ${def.judul}`, teks: `Toko ${def.toko} · ${def.teks} — ${def.penjelasan}`, konsep: def.konsep });
        } else {
          sound("error");
          flashOf("bad");
          setWrongShots((n) => n + 1);
          setToast({ ok: false, judul: "Itu data normal!", teks: `Toko ${def.toko} · ${def.teks} masih wajar & berada di klasternya. Membuang data valid = false positive.`, konsep: "False positive" });
        }
      },
      sting: () => {
        sound("boom");
        flashOf("bad");
        setToast({ ok: false, judul: "Disengat anomali!", teks: "Data janggal yang dibiarkan merusak analisis. Tembak dengan sonar (Spasi) sebelum mendekat." });
      },
      crash: (hard) => {
        sound("boom");
        flashOf("bad");
        if (hard) setToast({ ok: false, judul: "Lambung membentur karang!", teks: "Perhatikan air dangkal berwarna toska dan batu karang. Turunkan layar (S) saat mendekati pulau." });
      },
      bottle: () => {
        sound("pickup");
        const now = simRef.current.time;
        setBottles((prev) => ({ count: prev.count + 1, combo: now - lastBottle.current < 12 ? prev.combo + 1 : 1 }));
        lastBottle.current = now;
      },
      evidence: () => {
        sound("success");
        flashOf("good");
        setEvidence(true);
        setToast({ ok: true, judul: "Bukti ditemukan: kapal suplai kandas!", teks: "KM Suplai Semen tersangkut di karang sejak 3 minggu lalu. Penjualan Barokah nol karena stoknya kosong — bukan karena tidak laku!", konsep: "Investigasi akar masalah" });
      },
      dock: (index) => {
        sound("interact");
        if (index === LIGHTHOUSE_INDEX) {
          const done = simRef.current.deliveries.filter((d) => d !== null).length;
          if (done < MIN_DELIVERIES) {
            setToast({ ok: false, judul: "Mercusuar belum bisa menyimpulkan", teks: `Kirim ke minimal ${MIN_DELIVERIES} pulau dulu (baru ${done}). Kesimpulan butuh data yang cukup!` });
            return;
          }
          setAsking(true);
          return;
        }
        setPicked(null);
        setPanel(DOCKS[index].island.shop!);
      },
      repair: () => {
        sound("boom");
        flashOf("bad");
        setRepairs((n) => n + 1);
        setToast({ ok: false, judul: "Kapal ditarik ke pelabuhan", teks: "Lambung bocor! Kapal diperbaiki di Pelabuhan Gresik (−20 detik). Hindari karang, pusaran, dan anomali." });
      },
      timeout: () => {
        sound("error");
        setToast({ ok: false, judul: "Waktu habis!", teks: "Mercusuar mengirim sinyal — saatnya menarik kesimpulan dari data yang sudah terkumpul." });
        setPanel(null);
        setAsking(true);
      },
      zone: (name) => setZone((prev) => ({ name, n: (prev?.n ?? 0) + 1 })),
    };
  }, [sound, pushHud]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), toast.konsep ? 6500 : 3800);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (!zone) return;
    const id = setTimeout(() => setZone((prev) => (prev?.n === zone.n ? null : prev)), 2600);
    return () => clearTimeout(id);
  }, [zone]);

  const pickDelivery = (k: number) => {
    if (panel === null || picked !== null) return;
    const opt = FORECASTS[panel].opsi[k];
    setPicked(k);
    simRef.current.deliveries[panel] = opt.benar;
    setDeliveries([...simRef.current.deliveries]);
    const dock = SHOP_DOCKS[panel];
    fx.current?.burst(dock.x, 2, dock.z, opt.benar ? "#2fae66" : "#e54b4b", 26, 7);
    sound(opt.benar ? "success" : "error");
    setFlash({ tone: opt.benar ? "good" : "bad", id: performance.now() });
  };

  const closePanel = () => {
    if (picked === null) return;
    setPanel(null);
    setPicked(null);
    const done = simRef.current.deliveries.filter((d) => d !== null).length;
    if (done === MIN_DELIVERIES) setToast({ ok: true, judul: "Mercusuar Insight terbuka!", teks: "Data cukup untuk ditarik kesimpulan. Kirim sisa muatan atau langsung berlayar ke mercusuar di utara." });
    if (done === FORECASTS.length) setToast({ ok: true, judul: "Semua muatan terkirim!", teks: "Berlayarlah ke Mercusuar Insight untuk menyusun kesimpulan." });
  };

  const q = SEA_QUIZ[question];
  const quizDone = question >= SEA_QUIZ.length;
  const answerQuiz = (id: string) => {
    if (quizPick) return;
    const opt = q.opsi.find((item) => item.id === id)!;
    setQuizPick(id);
    sound(opt.benar ? "success" : "error");
    if (opt.benar) setQuizCorrect((n) => n + 1);
  };

  const running = !paused && !ended && panel === null && !asking;

  let prompt: ReactNode;
  if (running) {
    if (hud.near >= 0) prompt = <><kbd>E</kbd>{hud.near === LIGHTHOUSE_INDEX ? "Labuh di Mercusuar — tarik kesimpulan" : `Labuh & kirim ke Toko ${FORECASTS[SHOP_DOCKS[hud.near].island.shop!].toko}`}</>;
    else if (hud.boundary) prompt = <>Arus balik terlalu kuat — kembali ke kepulauan</>;
    else if (hud.whirl) prompt = <>Pusaran! Tahan <kbd>Shift</kbd> untuk menyalakan mesin</>;
    else if (hud.grounded) prompt = <>Kandas! Mundur & putar haluan · <kbd>S</kbd> turunkan layar</>;
    else if (hud.tired) prompt = <>Mesin kepanasan… tunggu dingin</>;
    else if (hud.left > SEA_TIME - 12)
      prompt = (
        <>
          <span className="sea-keys"><kbd>A/D</kbd>kemudi · <kbd>W/S</kbd>layar · <kbd>Shift</kbd>mesin · <kbd>Spasi</kbd>sonar</span>
          <span className="sea-touch">Joystick: kemudi & layar</span>
        </>
      );
  }

  return (
    <WorldStage
      quality={quality}
      paused={paused || ended}
      camera={{ position: [START.x, 8, START.z + 16], fov: 60, near: 0.3, far: 1800 }}
      background={SEA_HORIZON}
      overlay={
        <>
          <WorldHud
            levelIndex={levelIndex}
            info={info}
            onPause={onPause}
            toast={panel !== null || asking ? null : toast}
            prompt={prompt}
            stats={
              <>
                <HudChip tone={hud.left < 60 ? "red" : "dark"} pulse={hud.left < 30}>
                  <Timer />
                  {clock(hud.left)}
                </HudChip>
                <HudChip tone="gold">
                  <Crosshair />
                  {anomHit}/{ANOMALY_TOTAL}
                </HudChip>
                <HudChip tone="green">
                  <Package />
                  {delivered}/{FORECASTS.length}
                </HudChip>
                {bottles.combo >= 3 && (
                  <HudChip tone="gold">
                    <Flame />×{bottles.combo}
                  </HudChip>
                )}
                <HudMeter label="LAMBUNG" value={hud.hull} tone={hud.hull < 35 ? "red" : hud.hull < 65 ? "gold" : "green"} />
                <HudMeter label="MESIN" value={hud.stamina * 100} tone={hud.tired ? "red" : "gold"} />
              </>
            }
          />
          {!ended && !asking && <Compass simRef={simRef} view={view} />}
          {!ended && !asking && <MiniMap simRef={simRef} />}
          {!ended && !asking && <WindGauge simRef={simRef} />}
          {!ended && zone && panel === null && !asking && (
            <div key={zone.n} className="hunt-zone">
              <small>MENDEKATI</small>
              {zone.name}
            </div>
          )}
          {panel !== null && <DeliveryPanel shop={panel} evidence={evidence} picked={picked} onPick={pickDelivery} onClose={closePanel} />}
          {asking && !quizDone && (
            <div className="world-overlay-card mission-pop">
              <p className="text-xs font-black tracking-[0.15em] text-muted-foreground">MERCUSUAR INSIGHT · KESIMPULAN {question + 1}/{SEA_QUIZ.length}</p>
              <p className="mt-1 font-black">{q.pertanyaan}</p>
              <div className="mt-3 grid gap-2">
                {q.opsi.map((option) => (
                  <button
                    key={option.id}
                    disabled={Boolean(quizPick)}
                    onClick={() => answerQuiz(option.id)}
                    className={cn(
                      "rounded-2xl border-2 p-3 text-left text-sm font-semibold transition",
                      !quizPick && "border-border hover:border-track-data hover:bg-track-data-soft",
                      quizPick && option.benar && "border-emerald-500 bg-emerald-50",
                      quizPick === option.id && !option.benar && "border-track-audit bg-track-audit-soft"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {quizPick && (
                <>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{q.opsi.find((item) => item.id === quizPick)?.penjelasan}</p>
                  <Button
                    className="mt-3 w-full"
                    onClick={() => {
                      setQuizPick(null);
                      setQuestion((n) => n + 1);
                      if (question + 1 >= SEA_QUIZ.length) setEnded(true);
                    }}
                  >
                    {question + 1 < SEA_QUIZ.length ? "Pertanyaan berikutnya" : "Selesai"}
                  </Button>
                </>
              )}
            </div>
          )}
          <ScreenFlash flash={flash} />
          {running && (
            <TouchControls
              inputRef={input}
              mode="stick"
              buttons={[
                { label: "Mesin", holdKey: "shift", tone: "light" },
                { press: "interact", label: "Labuh", tone: "light" },
                { press: "action", label: "Sonar" },
              ]}
            />
          )}
          {ended && (
            <LevelEnd
              score={score}
              reason="Armada kembali ke pelabuhan"
              detail={`Anomali ${anomHit}/${ANOMALY_TOTAL}${wrongShots ? ` (${wrongShots} salah tembak)` : ""} · prediksi tepat ${deliveredOk}/${FORECASTS.length} · bukti Barokah ${evidence ? "✓" : "✗"} · kesimpulan ${quizCorrect}/${SEA_QUIZ.length}${repairs ? ` · ${repairs}× perbaikan` : ""}.`}
              isLast
              onNext={() => onFinish(score)}
            />
          )}
        </>
      }
    >
      <SeaNature quality={quality} focus={focus} flora={flora} />
      <CameraDrag view={view} />
      <SeaController input={input} running={running} simRef={simRef} focus={focus} viewRef={view} events={events} fx={fx} />
      <Pinisi simRef={simRef} avatar={avatar} groupRef={shipGroup} />
      <Wake simRef={simRef} />
      <Jellies simRef={simRef} />
      <Shots simRef={simRef} />
      <Bottles simRef={simRef} />
      <Whirlpools />
      <Rocks />
      <IslandShops simRef={simRef} />
      <DockMarkers simRef={simRef} />
      <Lighthouse />
      <Wreck simRef={simRef} />
      <Effects apiRef={fx} />
    </WorldStage>
  );
}
