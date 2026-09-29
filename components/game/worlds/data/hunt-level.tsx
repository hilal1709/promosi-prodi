"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { IconFire, IconScan, IconTimer } from "@/components/ui/icons";
import CharacterModel, { type CharacterMotion } from "@/components/game/character-model";
import { clampPercent, type Feedback } from "@/components/game/missions/mission-kit";
import type { SoundName } from "@/components/game/use-game-audio";
import { cn } from "@/lib/utils";
import { DATA_ISSUE_LABELS, DATA_TABLE } from "@/lib/data/missions";
import { DATA_BINS, DATA_CUBES, type DataCube } from "@/lib/data/worlds";
import type { GameAvatarId } from "@/lib/types";
import { Effects, type FxApi } from "../erp/race-fx";
import { TouchControls } from "../touch-controls";
import { readAxis, type WorldInput } from "../world-controls";
import { clampDelta, HudChip, HudMeter, LevelEnd, WorldHud, WorldStage, useThrottled, type WorldLevelProps } from "../world-kit";
import {
  BIOMES,
  biomeAt,
  buildSolidGrid,
  groundAt,
  HARD_RADIUS,
  LAKE,
  PATHS,
  PLAY_RADIUS,
  scatterVegetation,
  SPRITE_SPAWNS,
  START,
  terrainHeight,
  TOWER,
  WATER_Y,
  type Personality,
  type Solid,
} from "./hunt-layout";
import { DataLakeTower, DataSprite, ScannerBeam, TOWER_TOP_Y, type BeamSim, type SpriteShape, type SpriteSim, type TowerSim } from "./hunt-models";
import { HuntNature } from "./hunt-scenery";

/* ------------------------------------------------------------------ */
/* Level 1 · Pemburu Data Liar                                          */
/* ------------------------------------------------------------------ */

const HUNT_TIME = 300;
const TOTAL = DATA_CUBES.length;
const SCAN_RANGE = 8.5;
const CAPTURE_TIME = 1.15;
const WALK = 5.4;
const SPRINT = 9.6;
const CAM_DIST = 9.5;
const FLIGHT_TIME = 1.9;
const FINALE_TIME = 5;

const SHAPE_BY_COLUMN: Record<string, SpriteShape> = {
  Toko: "kubus",
  Kota: "oktahedron",
  "Unit Terjual": "limas",
  "Harga (Rp)": "dodeka",
};

const BIN_HINT: Record<string, string> = {
  format: "penulisan / tipe tak seragam",
  invalid: "nilai mustahil / janggal",
  bersih: "wajar & rapi",
  duplikat: "baris tercatat ganda",
  kosong: "nilainya hilang",
};

const PERSONA_LABEL: Record<Personality, string> = {
  melayang: "Santai",
  berkelana: "Pengembara",
  pemalu: "Pemalu",
  teleport: "Teleporter",
};

/* ------------------------------ state ------------------------------ */

interface PlayerSim {
  pos: THREE.Vector3;
  heading: number;
  yaw: number;
  yawTarget: number;
  pitch: number;
  stamina: number;
  tired: boolean;
  moving: boolean;
  sprinting: boolean;
}

interface SpriteAi {
  personality: Personality;
  homeX: number;
  homeZ: number;
  tx: number;
  tz: number;
  wait: number;
  energy: number;
  rest: number;
  cooldown: number;
  blinks: number;
  bob: number;
}

interface Sim {
  time: number;
  sprites: SpriteSim[];
  ai: SpriteAi[];
  beam: BeamSim;
  tower: TowerSim;
  classifying: number;
  finale: number;
  ended: boolean;
  elapsed: number;
  trail: number;
  tick: number;
  lastBiome: string;
}

interface Hud {
  time: number;
  stamina: number;
  tired: boolean;
  near: { index: number; dist: number; persona: Personality; fleeing: boolean } | null;
  scan: number;
  scanning: boolean;
  warn: boolean;
  finale: boolean;
}

interface Events {
  sound: (name: SoundName) => void;
  hud: (hud: Hud, force?: boolean) => void;
  caught: (index: number) => void;
  arrived: (index: number) => void;
  zone: (name: string) => void;
  toast: (feedback: Feedback) => void;
  end: (reason: "selesai" | "waktu") => void;
}

function createPlayer(): PlayerSim {
  return {
    pos: new THREE.Vector3(START.x, groundAt(START.x, START.z), START.z),
    heading: Math.PI,
    yaw: 0,
    yawTarget: 0,
    pitch: 0.36,
    stamina: 1,
    tired: false,
    moving: false,
    sprinting: false,
  };
}

function createSim(): Sim {
  return {
    time: HUNT_TIME,
    sprites: SPRITE_SPAWNS.map((spawn) => ({
      index: spawn.index,
      x: spawn.x,
      y: groundAt(spawn.x, spawn.z) + 1.4,
      z: spawn.z,
      heading: 0,
      mode: "bebas",
      capture: 0,
      scanned: false,
      tint: "#ffffff",
      blink: 0,
      flight: 0,
      fromX: 0,
      fromY: 0,
      fromZ: 0,
      lookX: spawn.x,
      lookZ: spawn.z + 1,
    })),
    ai: SPRITE_SPAWNS.map((spawn, k) => ({
      personality: spawn.personality,
      homeX: spawn.x,
      homeZ: spawn.z,
      tx: spawn.x,
      tz: spawn.z,
      wait: k * 0.4,
      energy: 3.2,
      rest: 0,
      cooldown: 0,
      blinks: 0,
      bob: k * 1.7,
    })),
    beam: { active: false, power: 0, from: new THREE.Vector3(), to: new THREE.Vector3() },
    tower: { rings: [], finale: 0, pulse: 0 },
    classifying: -1,
    finale: -1,
    ended: false,
    elapsed: 0,
    trail: 0,
    tick: 0,
    lastBiome: "",
  };
}

const tmp = new THREE.Vector3();
const desired = new THREE.Vector3();

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
/** Sudut arah target relatif terhadap arah pandang kamera (positif = kiri). */
function bearing(player: PlayerSim, x: number, z: number) {
  const forward = Math.atan2(-Math.sin(player.yaw), -Math.cos(player.yaw));
  return wrap(Math.atan2(x - player.pos.x, z - player.pos.z) - forward);
}

function walkable(x: number, z: number) {
  return terrainHeight(x, z) > -1.4;
}

/* ------------------------------------------------------------------ */
/* Kontrol kamera: seret layar untuk memutar                            */
/* ------------------------------------------------------------------ */

function CameraDrag({ player }: { player: RefObject<PlayerSim> }) {
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
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      const p = player.current;
      p.yawTarget -= dx * 0.006;
      p.pitch = THREE.MathUtils.clamp(p.pitch + dy * 0.003, 0.12, 0.85);
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
  }, [gl, player]);
  return null;
}

/* ------------------------------------------------------------------ */
/* Simulasi utama                                                       */
/* ------------------------------------------------------------------ */

function HuntController({
  avatar,
  input,
  running,
  playerRef,
  simRef,
  focus,
  events,
  fx,
  solidsAt,
}: {
  avatar: GameAvatarId;
  input: WorldInput;
  running: boolean;
  playerRef: RefObject<PlayerSim>;
  simRef: RefObject<Sim>;
  focus: RefObject<{ pos: THREE.Vector3 }>;
  events: Events;
  fx: RefObject<FxApi | null>;
  solidsAt: (x: number, z: number) => Solid[];
}) {
  const body = useRef<THREE.Group>(null);
  const motion = useRef<CharacterMotion>({ phase: 0, moving: false });
  const look = useRef(new THREE.Vector3(START.x, 2, START.z - 4));
  const placed = useRef(false);
  const camDist = useRef(CAM_DIST);

  useFrame((state, raw) => {
    const camera = state.camera as THREE.PerspectiveCamera;
    const delta = clampDelta(raw);
    const p = playerRef.current;
    const s = simRef.current;
    const ev = events;

    if (!placed.current) {
      camera.position.set(p.pos.x, p.pos.y + 6, p.pos.z + CAM_DIST);
      placed.current = true;
    }

    const active = running && !s.ended;
    const classifying = s.classifying >= 0;
    const finale = s.finale >= 0;
    if (active && !classifying && !finale) {
      s.time = Math.max(0, s.time - delta);
      if (s.time <= 0) {
        s.ended = true;
        ev.end("waktu");
      }
    }
    if (active) s.elapsed += delta;

    /* ---------- pemain ---------- */
    const held = input.current.held;
    const axis = active && !classifying && !finale ? readAxis(input.current) : { x: 0, y: 0 };
    const moving = Math.hypot(axis.x, axis.y) > 0.15;
    const wantSprint = moving && !!held.shift && !p.tired;
    p.sprinting = wantSprint;
    p.stamina = THREE.MathUtils.clamp(p.stamina + (wantSprint ? -delta / 4.5 : delta / (moving ? 5 : 3)), 0, 1);
    if (p.stamina <= 0.001) p.tired = true;
    if (p.tired && p.stamina > 0.35) p.tired = false;
    p.yaw += wrap(p.yawTarget - p.yaw) * Math.min(1, delta * 10);

    let warn = false;
    if (moving) {
      const pace = (wantSprint ? SPRINT : WALK) * (p.tired ? 0.8 : 1);
      const fx0 = -Math.sin(p.yaw);
      const fz0 = -Math.cos(p.yaw);
      const rx = Math.cos(p.yaw);
      const rz = -Math.sin(p.yaw);
      const mx = rx * axis.x + fx0 * axis.y;
      const mz = rz * axis.x + fz0 * axis.y;
      const nx = p.pos.x + mx * pace * delta;
      const nz = p.pos.z + mz * pace * delta;
      if (walkable(nx, p.pos.z)) p.pos.x = nx;
      if (walkable(p.pos.x, nz)) p.pos.z = nz;
      const target = Math.atan2(mx, mz);
      p.heading += wrap(target - p.heading) * Math.min(1, delta * 12);
    }
    // Tabrakan lingkaran (pohon, batu, tenda, menara).
    for (const solid of solidsAt(p.pos.x, p.pos.z)) {
      const dx = p.pos.x - solid.x;
      const dz = p.pos.z - solid.z;
      const d = Math.hypot(dx, dz);
      const min = solid.r + 0.45;
      if (d < min && d > 0.0001) {
        p.pos.x = solid.x + (dx / d) * min;
        p.pos.z = solid.z + (dz / d) * min;
      }
    }
    // Batas lunak: sinyal melemah, pemain didorong kembali ke lembah.
    const r = Math.hypot(p.pos.x, p.pos.z);
    if (r > PLAY_RADIUS) {
      warn = true;
      const push = Math.min(r - PLAY_RADIUS, 12) * 1.6 * delta;
      p.pos.x -= (p.pos.x / r) * push;
      p.pos.z -= (p.pos.z / r) * push;
      const r2 = Math.hypot(p.pos.x, p.pos.z);
      if (r2 > HARD_RADIUS) {
        p.pos.x *= HARD_RADIUS / r2;
        p.pos.z *= HARD_RADIUS / r2;
      }
    }
    const ground = Math.max(terrainHeight(p.pos.x, p.pos.z), WATER_Y - 0.45);
    p.pos.y = THREE.MathUtils.damp(p.pos.y, ground, 18, delta);
    p.moving = moving;
    focus.current.pos.copy(p.pos);

    /* ---------- zona ---------- */
    if (active) {
      const { biome, strength } = biomeAt(p.pos.x, p.pos.z);
      const zone = Math.hypot(p.pos.x - TOWER.x, p.pos.z - TOWER.z) < 40 ? "Kemah Data Lake" : strength > 0.72 ? biome.nama : "";
      if (zone && zone !== s.lastBiome) {
        s.lastBiome = zone;
        ev.zone(zone);
      }
    }

    /* ---------- sprite ---------- */
    const scanHeld = active && !classifying && !finale && (!!held.e || !!held.space);
    let nearest = -1;
    let nearestD = Infinity;
    s.sprites.forEach((sp, k) => {
      if (sp.mode !== "bebas") return;
      const d = Math.hypot(sp.x - p.pos.x, sp.z - p.pos.z);
      if (d < nearestD) {
        nearestD = d;
        nearest = k;
      }
    });
    const target = scanHeld && nearest >= 0 && nearestD < SCAN_RANGE ? nearest : -1;

    s.sprites.forEach((sp, k) => {
      const ai = s.ai[k];
      ai.bob += delta;
      sp.blink = Math.max(0, sp.blink - delta * 2.5);
      sp.scanned = k === target;
      if (sp.mode === "bebas") {
        if (!active || finale) return;
        const d = Math.hypot(sp.x - p.pos.x, sp.z - p.pos.z);
        const slow = sp.scanned ? 0.35 : 1;
        let speed = 0;
        let gx = sp.x;
        let gz = sp.z;
        ai.cooldown = Math.max(0, ai.cooldown - delta);
        switch (ai.personality) {
          case "melayang": {
            const a = ai.bob * 0.35;
            gx = ai.homeX + Math.cos(a) * 3;
            gz = ai.homeZ + Math.sin(a) * 3;
            speed = 1.4;
            break;
          }
          case "berkelana": {
            if (Math.hypot(ai.tx - sp.x, ai.tz - sp.z) < 1) {
              ai.wait -= delta;
              if (ai.wait <= 0) {
                ai.tx = ai.homeX + (Math.random() - 0.5) * 40;
                ai.tz = ai.homeZ + (Math.random() - 0.5) * 40;
                ai.wait = 1 + Math.random() * 2;
              }
            }
            gx = ai.tx;
            gz = ai.tz;
            speed = 2.4;
            break;
          }
          case "pemalu": {
            if (ai.rest > 0) {
              ai.rest -= delta;
              speed = 0.6;
              ai.energy = Math.min(3.2, ai.energy + delta * 0.6);
            } else if (d < 11 && ai.energy > 0) {
              ai.energy -= delta;
              if (ai.energy <= 0) {
                ai.rest = 3.2;
                ev.toast({ ok: true, judul: "Sprite pemalu kelelahan!", teks: "Sekarang kesempatanmu, tahan scan sebelum ia pulih." });
              }
              const ax = (sp.x - p.pos.x) / (d || 1);
              const az = (sp.z - p.pos.z) / (d || 1);
              // Kabur menjauh; bila terlalu jauh dari rumah, belok menyamping.
              const leash = Math.hypot(sp.x - ai.homeX, sp.z - ai.homeZ) > 34;
              gx = sp.x + (leash ? -az : ax) * 10 + (leash ? (ai.homeX - sp.x) * 0.2 : 0);
              gz = sp.z + (leash ? ax : az) * 10 + (leash ? (ai.homeZ - sp.z) * 0.2 : 0);
              speed = 7.2;
            } else {
              ai.energy = Math.min(3.2, ai.energy + delta * 0.4);
              gx = ai.homeX + Math.cos(ai.bob * 0.5) * 4;
              gz = ai.homeZ + Math.sin(ai.bob * 0.5) * 4;
              speed = 1.6;
            }
            break;
          }
          case "teleport": {
            gx = ai.homeX + Math.cos(ai.bob * 0.4) * 5;
            gz = ai.homeZ + Math.sin(ai.bob * 0.6) * 5;
            speed = 1.8;
            if (d < 6.5 && ai.cooldown <= 0 && ai.blinks < 3 && sp.capture < 0.8) {
              for (let tries = 0; tries < 8; tries++) {
                const a = Math.atan2(sp.x - p.pos.x, sp.z - p.pos.z) + (Math.random() - 0.5) * 2.4;
                const dist = 10 + Math.random() * 5;
                const nx = sp.x + Math.sin(a) * dist;
                const nz = sp.z + Math.cos(a) * dist;
                if (terrainHeight(nx, nz) > 0.3 && Math.hypot(nx, nz) < PLAY_RADIUS - 12) {
                  fx.current?.burst(sp.x, sp.y, sp.z, "#7ee8fa", 14, 4);
                  sp.x = nx;
                  sp.z = nz;
                  sp.y = groundAt(nx, nz) + 1.4;
                  sp.capture *= 0.4;
                  sp.blink = 1;
                  ai.homeX = nx;
                  ai.homeZ = nz;
                  ai.blinks += 1;
                  ai.cooldown = 3.2;
                  fx.current?.burst(sp.x, sp.y, sp.z, "#7ee8fa", 14, 4);
                  ev.sound("shoot");
                  if (ai.blinks === 1) ev.toast({ ok: true, judul: "Wush! Sprite teleport!", teks: "Sprite ini melompat saat didekati. Setelah beberapa kali, ia kehabisan tenaga." });
                  break;
                }
              }
            }
            break;
          }
        }
        const dx = gx - sp.x;
        const dz = gz - sp.z;
        const dl = Math.hypot(dx, dz);
        if (dl > 0.05) {
          const step = Math.min(dl, speed * slow * delta);
          const nx = sp.x + (dx / dl) * step;
          const nz = sp.z + (dz / dl) * step;
          if (terrainHeight(nx, nz) > -0.6 && Math.hypot(nx, nz) < PLAY_RADIUS - 6) {
            sp.x = nx;
            sp.z = nz;
          } else if (ai.personality === "berkelana") {
            ai.tx = ai.homeX;
            ai.tz = ai.homeZ;
          }
        }
        sp.y = THREE.MathUtils.damp(sp.y, groundAt(sp.x, sp.z) + 1.4 + Math.sin(ai.bob * 2) * 0.25, 6, delta);
        if (d < 26) {
          sp.lookX = p.pos.x;
          sp.lookZ = p.pos.z;
        } else {
          sp.lookX = gx;
          sp.lookZ = gz;
        }
        // Progres tangkapan.
        if (sp.scanned) {
          sp.capture = Math.min(1, sp.capture + delta / CAPTURE_TIME);
          if (sp.capture >= 1) {
            sp.mode = "tertangkap";
            sp.scanned = false;
            s.classifying = k;
            fx.current?.burst(sp.x, sp.y, sp.z, "#ffc857", 26, 6);
            fx.current?.shake(0.25);
            ev.sound("pickup");
            ev.caught(k);
          }
        } else {
          sp.capture = Math.max(0, sp.capture - delta * 0.5);
        }
      } else if (sp.mode === "tertangkap") {
        // Melayang di depan pemain selama klasifikasi.
        const fx0 = -Math.sin(p.yaw);
        const fz0 = -Math.cos(p.yaw);
        sp.x = THREE.MathUtils.damp(sp.x, p.pos.x + fx0 * 2.4, 6, delta);
        sp.z = THREE.MathUtils.damp(sp.z, p.pos.z + fz0 * 2.4, 6, delta);
        sp.y = THREE.MathUtils.damp(sp.y, p.pos.y + 2.2 + Math.sin(ai.bob * 3) * 0.1, 6, delta);
        sp.lookX = camera.position.x;
        sp.lookZ = camera.position.z;
      } else if (sp.mode === "terbang") {
        sp.flight = Math.min(1, sp.flight + delta / FLIGHT_TIME);
        const t = sp.flight;
        const e = t * t * (3 - 2 * t);
        const topY = TOWER_TOP_Y();
        sp.x = THREE.MathUtils.lerp(sp.fromX, TOWER.x, e);
        sp.z = THREE.MathUtils.lerp(sp.fromZ, TOWER.z, e);
        sp.y = THREE.MathUtils.lerp(sp.fromY, topY, e) + Math.sin(t * Math.PI) * (10 + Math.hypot(sp.fromX - TOWER.x, sp.fromZ - TOWER.z) * 0.15);
        sp.lookX = TOWER.x;
        sp.lookZ = TOWER.z;
        s.trail += delta;
        if (s.trail > 0.06) {
          s.trail = 0;
          fx.current?.burst(sp.x, sp.y, sp.z, sp.tint, 2, 1.2);
        }
        if (t >= 1) {
          sp.mode = "selesai";
          s.tower.rings.push(sp.tint);
          s.tower.pulse = 1;
          fx.current?.burst(TOWER.x, topY, TOWER.z, sp.tint, 30, 8);
          ev.sound("success");
          ev.arrived(k);
          if (s.sprites.every((other) => other.mode === "selesai") && s.finale < 0) {
            s.finale = 0;
            ev.sound("boom");
          }
        }
      }
    });

    /* ---------- sinar scanner ---------- */
    const beam = s.beam;
    const handY = p.pos.y + 1.35;
    if (scanHeld) {
      beam.active = true;
      beam.from.set(p.pos.x + Math.sin(p.heading) * 0.5, handY, p.pos.z + Math.cos(p.heading) * 0.5);
      if (target >= 0) {
        const sp = s.sprites[target];
        beam.to.set(sp.x, sp.y, sp.z);
        beam.power = sp.capture;
        p.heading += wrap(Math.atan2(sp.x - p.pos.x, sp.z - p.pos.z) - p.heading) * Math.min(1, delta * 14);
        s.tick += delta;
        if (s.tick > 0.28) {
          s.tick = 0;
          ev.sound("step");
        }
      } else {
        // Tidak ada target: sinar pendek "mencari".
        tmp.set(Math.sin(p.heading), 0, Math.cos(p.heading)).multiplyScalar(5);
        beam.to.set(beam.from.x + tmp.x, handY - 0.4 + Math.sin(s.elapsed * 12) * 0.15, beam.from.z + tmp.z);
        beam.power = 0.05;
      }
    } else {
      beam.active = false;
    }

    /* ---------- finale ---------- */
    if (finale && !s.ended) {
      s.finale = Math.min(FINALE_TIME, s.finale + delta);
      s.tower.finale = Math.min(1, s.finale / 2);
      if (s.finale >= FINALE_TIME) {
        s.ended = true;
        ev.end("selesai");
      }
    }

    /* ---------- avatar ---------- */
    if (body.current) {
      body.current.position.copy(p.pos);
      body.current.rotation.y = p.heading;
    }
    motion.current.moving = moving;

    /* ---------- kamera ---------- */
    if (finale) {
      const a = 0.6 + s.finale * 0.35;
      const base = groundAt(TOWER.x, TOWER.z);
      desired.set(TOWER.x + Math.sin(a) * 40, base + 18 + s.finale * 2, TOWER.z + Math.cos(a) * 40);
      camera.position.lerp(desired, 1 - Math.exp(-delta * 2));
      look.current.lerp(tmp.set(TOWER.x, base + 14, TOWER.z), 1 - Math.exp(-delta * 3));
    } else {
      // Kamera maju mendekati pemain bila tajuk pohon menghalangi.
      let dist = classifying ? CAM_DIST * 0.62 : CAM_DIST;
      for (; dist > 2.6; dist -= 0.6) {
        const flat = Math.cos(p.pitch) * dist;
        const cx = p.pos.x + Math.sin(p.yaw) * flat;
        const cz = p.pos.z + Math.cos(p.yaw) * flat;
        const cy = p.pos.y + 1.6 + Math.sin(p.pitch) * dist;
        const hit = solidsAt(cx, cz).some((solid) => solid.f !== undefined && Math.hypot(cx - solid.x, cz - solid.z) < solid.f + 0.4 && cy > (solid.bottom ?? 0) - 0.5 && cy < (solid.top ?? 0) + 0.5);
        if (!hit) break;
      }
      camDist.current = dist < camDist.current ? dist : THREE.MathUtils.damp(camDist.current, dist, 2.5, delta);
      const flat = Math.cos(p.pitch) * camDist.current;
      desired.set(p.pos.x + Math.sin(p.yaw) * flat, p.pos.y + 1.6 + Math.sin(p.pitch) * camDist.current, p.pos.z + Math.cos(p.yaw) * flat);
      desired.y = Math.max(desired.y, groundAt(desired.x, desired.z) + 1.3);
      camera.position.lerp(desired, 1 - Math.exp(-delta * 6));
      const lead = classifying ? 1.2 : 3.5;
      tmp.set(p.pos.x - Math.sin(p.yaw) * lead, p.pos.y + (classifying ? 2 : 1.7), p.pos.z - Math.cos(p.yaw) * lead);
      look.current.lerp(tmp, 1 - Math.exp(-delta * 8));
    }
    camera.lookAt(look.current);
    const fov = finale ? 55 : p.sprinting ? 66 : 58;
    if (Math.abs(camera.fov - fov) > 0.05) {
      camera.fov = THREE.MathUtils.damp(camera.fov, fov, 4, delta);
      camera.updateProjectionMatrix();
    }

    /* ---------- HUD ---------- */
    const near = nearest >= 0 && nearestD < 40 ? { index: nearest, dist: nearestD, persona: s.ai[nearest].personality, fleeing: s.ai[nearest].personality === "pemalu" && nearestD < 11 && s.ai[nearest].energy > 0 && s.ai[nearest].rest <= 0 } : null;
    ev.hud({
      time: s.time,
      stamina: p.stamina,
      tired: p.tired,
      near,
      scan: target >= 0 ? s.sprites[target].capture : 0,
      scanning: scanHeld,
      warn,
      finale,
    });
  });

  return (
    <group ref={body}>
      <CharacterModel avatar={avatar} motion={motion} />
      {/* Scanner genggam */}
      <group position={[0.32, 1.25, 0.35]}>
        <mesh castShadow>
          <boxGeometry args={[0.16, 0.14, 0.42]} />
          <meshStandardMaterial color="#2b3440" metalness={0.5} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0, 0.23]}>
          <cylinderGeometry args={[0.06, 0.08, 0.06, 10]} />
          <meshBasicMaterial color="#ffc857" toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Overlay DOM: kompas, peta mini, panel klasifikasi                   */
/* ------------------------------------------------------------------ */

function Compass({ playerRef, simRef }: { playerRef: RefObject<PlayerSim>; simRef: RefObject<Sim> }) {
  const strip = useRef<HTMLDivElement>(null);
  const ticks = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const loop = () => {
      const p = playerRef.current;
      const s = simRef.current;
      const el = strip.current;
      if (el && p && s) {
        const width = el.clientWidth;
        const free = s.sprites
          .filter((sp) => sp.mode === "bebas")
          .map((sp) => ({ x: sp.x, z: sp.z, d: Math.hypot(sp.x - p.pos.x, sp.z - p.pos.z), label: "Data liar", color: "#7ee8fa" }))
          .sort((a, b) => a.d - b.d)
          .slice(0, 3);
        const tower = { x: TOWER.x, z: TOWER.z, d: Math.hypot(TOWER.x - p.pos.x, TOWER.z - p.pos.z), label: "Menara", color: "#ffc857" };
        const targets = [...free, tower];
        el.querySelectorAll<HTMLElement>("[data-marker]").forEach((node, k) => {
          const t = targets[k];
          if (!t) {
            node.style.display = "none";
            return;
          }
          const b = bearing(p, t.x, t.z);
          const clamped = THREE.MathUtils.clamp(b, -Math.PI / 2, Math.PI / 2);
          node.style.display = "flex";
          node.style.left = `${((0.5 - clamped / Math.PI) * width).toFixed(1)}px`;
          node.style.setProperty("--marker", t.color);
          node.dataset.edge = Math.abs(b) > Math.PI / 2 ? (b > 0 ? "left" : "right") : "";
          // Hanya target terdekat & menara yang diberi label agar tidak saling menumpuk.
          const label = node.querySelector("span");
          if (label) {
            const named = k === 0 || t.label === "Menara";
            label.style.display = named ? "" : "none";
            label.textContent = `${t.label} · ${Math.round(t.d)} m`;
          }
        });
        if (ticks.current) {
          const offset = ((p.yaw / (Math.PI * 2)) * width * 2) % (width / 2);
          ticks.current.style.backgroundPosition = `${offset.toFixed(1)}px 0`;
        }
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [playerRef, simRef]);
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

const MAP_R = 200;
const MAP_SIZE = 200;
const mx = (x: number) => ((x + MAP_R) / (MAP_R * 2)) * MAP_SIZE;

function MiniMap({ playerRef, simRef }: { playerRef: RefObject<PlayerSim>; simRef: RefObject<Sim> }) {
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    let frame = 0;
    const loop = () => {
      const p = playerRef.current;
      const s = simRef.current;
      const root = svg.current;
      if (root && p && s) {
        const me = root.querySelector<SVGGElement>("[data-player]");
        me?.setAttribute("transform", `translate(${mx(p.pos.x).toFixed(1)} ${mx(p.pos.z).toFixed(1)}) rotate(${(-p.heading * 180) / Math.PI + 180})`);
        const view = root.querySelector<SVGPathElement>("[data-view]");
        view?.setAttribute("transform", `translate(${mx(p.pos.x).toFixed(1)} ${mx(p.pos.z).toFixed(1)}) rotate(${(-p.yaw * 180) / Math.PI})`);
        root.querySelectorAll<SVGCircleElement>("[data-sprite]").forEach((node, k) => {
          const sp = s.sprites[k];
          if (!sp || sp.mode !== "bebas") {
            node.setAttribute("visibility", "hidden");
            return;
          }
          node.setAttribute("visibility", "visible");
          node.setAttribute("cx", mx(sp.x).toFixed(1));
          node.setAttribute("cy", mx(sp.z).toFixed(1));
        });
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [playerRef, simRef]);
  const pathD = useMemo(() => PATHS.map((path) => path.map((pt, i) => `${i ? "L" : "M"}${mx(pt.x).toFixed(1)} ${mx(pt.z).toFixed(1)}`).join(" ")).join(" "), []);
  return (
    <div className="race-minimap hunt-minimap" aria-hidden>
      <svg ref={svg} viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}>
        <defs>
          <clipPath id="hunt-map-clip">
            <circle cx={MAP_SIZE / 2} cy={MAP_SIZE / 2} r={MAP_SIZE / 2 - 2} />
          </clipPath>
        </defs>
        <g clipPath="url(#hunt-map-clip)">
          <rect width={MAP_SIZE} height={MAP_SIZE} fill="#4f7d3c" />
          {BIOMES.map((biome) => (
            <circle key={biome.id} cx={mx(biome.x)} cy={mx(biome.z)} r={30} fill={biome.color} opacity={0.35} />
          ))}
          <circle cx={mx(LAKE.x)} cy={mx(LAKE.z)} r={(LAKE.r / (MAP_R * 2)) * MAP_SIZE} fill="#4aa3c4" />
          <path d={pathD} stroke="#d9c49a" strokeWidth={2} fill="none" opacity={0.8} />
          <circle cx={MAP_SIZE / 2} cy={MAP_SIZE / 2} r={(PLAY_RADIUS / (MAP_R * 2)) * MAP_SIZE} fill="none" stroke="rgb(255 255 255 / .35)" strokeDasharray="4 4" />
          <rect x={mx(TOWER.x) - 4} y={mx(TOWER.z) - 4} width={8} height={8} fill="#ffc857" transform={`rotate(45 ${mx(TOWER.x)} ${mx(TOWER.z)})`} />
          {SPRITE_SPAWNS.map((spawn) => (
            <circle key={spawn.index} data-sprite r={3.6} cx={mx(spawn.x)} cy={mx(spawn.z)} fill="#7ee8fa" stroke="#10131a" strokeWidth={1} className="drone-radar-pulse" />
          ))}
          <path data-view d="M0 0 L-16 -30 L16 -30 Z" fill="rgb(255 255 255 / .18)" />
          <g data-player>
            <path d="M0 -7 L5 5 L0 2 L-5 5 Z" fill="#ffffff" stroke="#10131a" strokeWidth={1.2} />
          </g>
        </g>
      </svg>
    </div>
  );
}

function rowOf(cube: DataCube) {
  const [rowId, column] = cube.id.split(":");
  const rowNumber = Number(rowId.replace("r", ""));
  const others =
    column && column !== "*"
      ? DATA_TABLE.baris
          .filter((row) => row.id !== rowId)
          .map((row) => String(row.data[column] === "" ? "(kosong)" : row.data[column]))
          .filter((value, i, list) => list.indexOf(value) === i)
          .slice(0, 5)
      : [];
  return { rowNumber, others };
}

function ClassifyPanel({ index, onPick }: { index: number; onPick: (bin: number) => void }) {
  const cube = DATA_CUBES[index];
  const [cursor, setCursorState] = useState(2);
  const cursorRef = useRef(2);
  const setCursor = useCallback((update: (c: number) => number) => {
    cursorRef.current = update(cursorRef.current);
    setCursorState(cursorRef.current);
  }, []);
  const opened = useRef(0);
  const { rowNumber, others } = rowOf(cube);
  const spawn = SPRITE_SPAWNS[index];

  useEffect(() => {
    opened.current = performance.now();
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const digit = /^(Digit|Numpad)([1-5])$/.exec(event.code);
      if (digit) {
        onPick(Number(digit[2]) - 1);
        return;
      }
      if (event.code === "KeyA" || event.code === "ArrowLeft") setCursor((c) => (c + DATA_BINS.length - 1) % DATA_BINS.length);
      if (event.code === "KeyD" || event.code === "ArrowRight") setCursor((c) => (c + 1) % DATA_BINS.length);
      if ((event.code === "KeyE" || event.code === "Enter" || event.code === "Space") && performance.now() - opened.current > 450) {
        onPick(cursorRef.current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onPick, setCursor]);

  return (
    <div className="hunt-classify" role="dialog" aria-label="Klasifikasi data">
      <div className="hunt-classify-head">
        <small>
          <IconScan className="inline h-3.5 w-3.5" /> DATA TERTANGKAP · {PERSONA_LABEL[spawn.personality]}
        </small>
        <span className="hunt-classify-cell">
          <em>{cube.id.endsWith(":*") ? `Seluruh ${cube.kolom}` : `Baris ${rowNumber} · kolom ${cube.kolom}`}</em>
          <strong>{cube.nilai}</strong>
        </span>
        {others.length > 0 && (
          <p>
            Nilai lain di kolom ini: {others.map((value) => <b key={value}>{value}</b>)}
          </p>
        )}
      </div>
      <p className="hunt-classify-ask">Apa masalah data ini?</p>
      <div className="hunt-classify-grid">
        {DATA_BINS.map((bin, k) => (
          <button
            key={bin.id}
            type="button"
            className={cn("hunt-bin", cursor === k && "is-cursor")}
            style={{ ["--bin" as string]: bin.color }}
            onClick={() => onPick(k)}
            onPointerEnter={() => setCursor(() => k)}
          >
            <kbd>{k + 1}</kbd>
            <strong>{bin.label}</strong>
            <small>{BIN_HINT[bin.id]}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Level                                                                */
/* ------------------------------------------------------------------ */

const clock = (time: number) => {
  const secs = Math.ceil(time);
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
};

const EMPTY_HUD: Hud = { time: HUNT_TIME, stamina: 1, tired: false, near: null, scan: 0, scanning: false, warn: false, finale: false };

export function HuntLevel({ levelIndex, info, paused, avatar, quality, input, sound, onPause, onFinish }: WorldLevelProps) {
  const playerRef = useRef<PlayerSim>(createPlayer());
  const simRef = useRef<Sim>(createSim());
  const focus = useRef({ pos: new THREE.Vector3(START.x, 0, START.z) });
  const fx = useRef<FxApi | null>(null);
  const veg = useMemo(() => scatterVegetation(quality), [quality]);
  const solidsAt = useMemo(() => buildSolidGrid(veg.solids), [veg]);

  const [hud, setHud] = useState<Hud>(EMPTY_HUD);
  const pushHud = useThrottled(setHud, 10);
  const [classify, setClassify] = useState<number | null>(null);
  const [toast, setToast] = useState<Feedback>(null);
  const [zone, setZone] = useState<{ name: string; n: number } | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(0);
  const [combo, setCombo] = useState(0);
  const comboRef = useRef(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [caughtOnce, setCaughtOnce] = useState(false);
  const [ended, setEnded] = useState<"selesai" | "waktu" | null>(null);
  const score = clampPercent((correct / TOTAL) * 100);

  const events = useMemo<Events>(
    () => ({
      sound,
      hud: pushHud,
      caught: (index) => {
        setClassify(index);
        setCaughtOnce(true);
      },
      arrived: () => setDone((value) => value + 1),
      zone: (name) => setZone((prev) => ({ name, n: (prev?.n ?? 0) + 1 })),
      toast: setToast,
      end: (reason) => setEnded(reason),
    }),
    [sound, pushHud]
  );

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

  const pick = useCallback(
    (binIndex: number) => {
      const s = simRef.current;
      const index = s.classifying;
      if (index < 0) return;
      const cube = DATA_CUBES[index];
      const bin = DATA_BINS[binIndex];
      const ok = bin.id === cube.jenis;
      const right = DATA_BINS.find((item) => item.id === cube.jenis)!;
      const sp = s.sprites[index];
      sp.mode = "terbang";
      sp.flight = 0;
      sp.fromX = sp.x;
      sp.fromY = sp.y;
      sp.fromZ = sp.z;
      sp.tint = ok ? bin.color : "#8d99ae";
      s.classifying = -1;
      sound(ok ? "success" : "error");
      if (ok) {
        fx.current?.burst(sp.x, sp.y, sp.z, bin.color, 24, 5);
        setCorrect((value) => value + 1);
        comboRef.current += 1;
        setCombo(comboRef.current);
        setBestCombo((best) => Math.max(best, comboRef.current));
      } else {
        fx.current?.shake(0.35);
        comboRef.current = 0;
        setCombo(0);
      }
      const label = cube.jenis === "bersih" ? "Bersih" : DATA_ISSUE_LABELS[cube.jenis];
      setToast({
        ok,
        judul: ok ? `Tepat! ${cube.kolom}: ${cube.nilai}` : `Seharusnya: ${right.label}`,
        teks: cube.penjelasan,
        konsep: label,
      });
      setClassify(null);
    },
    [sound]
  );

  const near = hud.near;
  let prompt: ReactNode;
  if (!ended && classify === null && !hud.finale) {
    if (hud.scanning && hud.scan > 0) prompt = <>Menangkap data… {Math.round(hud.scan * 100)}%</>;
    else if (near && near.dist < SCAN_RANGE) prompt = <><kbd>E</kbd>Tahan untuk scan sprite data</>;
    else if (near?.fleeing) prompt = <><kbd>Shift</kbd>Dia kabur! Lari untuk mengejar</>;
    else if (hud.tired) prompt = <>Napasmu habis… tunggu stamina pulih</>;
    else if (!caughtOnce && hud.time > HUNT_TIME - 20) prompt = <>Ikuti <b className="text-[#7ee8fa]">pilar cahaya biru</b>, itu data liar!</>;
  }

  return (
    <WorldStage
      quality={quality}
      paused={paused || !!ended}
      camera={{ position: [START.x, 8, START.z + 10], fov: 58, near: 0.3, far: 1800 }}
      background="#e4e6da"
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
                <HudChip tone={hud.time <= 30 ? "red" : "dark"} pulse={hud.time <= 30}>
                  <IconTimer />
                  {clock(hud.time)}
                </HudChip>
                <HudChip tone="green">{done}/{TOTAL} bersih</HudChip>
                {combo >= 2 && (
                  <HudChip tone="gold">
                    <IconFire />×{combo}
                  </HudChip>
                )}
                <HudMeter label="STAMINA" value={hud.stamina * 100} tone={hud.tired ? "red" : hud.stamina < 0.3 ? "gold" : "green"} />
              </>
            }
          />
          {!ended && !hud.finale && <Compass playerRef={playerRef} simRef={simRef} />}
          {!ended && !hud.finale && <MiniMap playerRef={playerRef} simRef={simRef} />}
          {!ended && hud.warn && <div className="hunt-warn">Sinyal scanner melemah, kembali ke lembah!</div>}
          {!ended && zone && classify === null && (
            <div key={zone.n} className="hunt-zone">
              <small>MEMASUKI</small>
              {zone.name}
            </div>
          )}
          {!ended && hud.finale && (
            <div className="hunt-zone is-finale">
              <small>DATA LAKE PENUH</small>
              Semua data siap dianalisis!
            </div>
          )}
          {classify !== null && !ended && <ClassifyPanel index={classify} onPick={pick} />}
          {classify === null && !ended && (
            <TouchControls
              inputRef={input}
              mode="stick"
              buttons={[
                { label: "Lari", holdKey: "shift", tone: "light" },
                { label: "Scan", holdKey: "e" },
              ]}
            />
          )}
          {ended && (
            <LevelEnd
              score={score}
              reason={ended === "selesai" ? "Data Lake terisi data bersih" : "Waktu habis"}
              detail={`${correct} dari ${TOTAL} data diklasifikasi tepat · ${done}/${TOTAL} tertangkap · combo terbaik ×${bestCombo}.`}
              onNext={() => onFinish(score)}
            />
          )}
        </>
      }
    >
      <HuntNature quality={quality} focus={focus} veg={veg} />
      <CameraDrag player={playerRef} />
      <HuntController
        avatar={avatar}
        input={input}
        running={!paused && !ended}
        playerRef={playerRef}
        simRef={simRef}
        focus={focus}
        events={events}
        fx={fx}
        solidsAt={solidsAt}
      />
      <DataLakeTower simRef={simRef} total={TOTAL} />
      {SPRITE_SPAWNS.map((spawn) => (
        <DataSprite key={spawn.index} simRef={simRef} index={spawn.index} shape={SHAPE_BY_COLUMN[DATA_CUBES[spawn.index].kolom] ?? "kubus"} />
      ))}
      <ScannerBeam simRef={simRef} />
      <Effects apiRef={fx} />
    </WorldStage>
  );
}
