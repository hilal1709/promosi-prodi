"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { IconBolt, IconCheck, IconCrosshair, IconHeart, IconShield, IconSkull, IconThreat, IconUser, IconWind, IconX } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { clampPercent, type Feedback } from "@/components/game/missions/mission-kit";
import { cn } from "@/lib/utils";
import { AUDIT_FINDINGS } from "@/lib/data/missions";
import { ARENA_ENEMIES, ARENA_STAFF, type ArenaEnemyKind } from "@/lib/data/worlds";
import { TouchControls } from "../touch-controls";
import type { WorldInput } from "../world-controls";
import { clampDelta, HudChip, HudMeter, Label, LevelEnd, Walker, WorldHud, WorldStage, useThrottled, type WorldLevelProps } from "../world-kit";
import { DataCenterLights } from "./data-center";
import { ARENA_R, ArenaHall, BossModel, MalwareShots, PatchShots, SERVER, ServerCluster, StaffModel, ThreatModel } from "./arena-models";

/* ------------------------------------------------------------------ */
/* Level 3 · Serbuan Peretas                                           */
/* ------------------------------------------------------------------ */

const PLAYER_START: [number, number] = [0, 6];
const PLAYER_HEARTS = 4;
const WALK_SPEED = 5.4;
const DASH_SPEED = 18;
const DASH_TIME = 0.2;
const DASH_COOLDOWN = 1.1;
const FIRE_GAP = 0.2;
const FIRE_RANGE = 11;
const SHOT_SPEED = 17;
const WAVE1_END = 25;
const WAVE2_END = 55;
const BOSS_PHASE_HP = [28, 34, 40];
const BOSS_ORBIT = 7;
const BOSS_FINDINGS = ["l3", "l9", "l11"].map((id) => AUDIT_FINDINGS.find((finding) => finding.id === id)!);
const BOSS_PATTERNS: BossAttack[][] = [
  ["ring", "aimed", "summon"],
  ["ring", "charge", "aimed", "summon"],
  ["ring", "charge", "aimed", "ring", "summon", "charge"],
];
const BOSS_ATTACK_GAP = [2.2, 1.7, 1.3];

type UnitKind = ArenaEnemyKind | "staf";
type DropKind = "mfa" | "backup" | "overclock" | "kopi";
type BossAttack = "ring" | "aimed" | "summon" | "charge";

const DROP_INFO: Record<DropKind, { nama: string; efek: string; warna: string }> = {
  mfa: { nama: "Perisai MFA", efek: "kebal 6 detik", warna: "#3fd0ff" },
  backup: { nama: "Backup", efek: "server +20", warna: "#39e67a" },
  overclock: { nama: "Patch Overclock", efek: "tembakan 3 arah", warna: "#ffd166" },
  kopi: { nama: "Kopi", efek: "+1 nyawa", warna: "#c7835a" },
};

type Unit = { uid: number; kind: UnitKind; variant: number; label: string; x: number; z: number; hp: number; speed: number; t: number; flash: number };
type Shot = { x: number; z: number; vx: number; vz: number; life: number; on: boolean };
type Spark = { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; color: THREE.Color };
type Drop = { uid: number; kind: DropKind; x: number; z: number; life: number };
type Boss = {
  active: boolean;
  phase: number;
  hp: number;
  maxHp: number;
  x: number;
  z: number;
  mode: "enter" | "orbit" | "telegraph" | "charge" | "shield" | "dead";
  timer: number;
  attackIn: number;
  attackIdx: number;
  angle: number;
  vx: number;
  vz: number;
  flash: number;
  finalRetry: boolean;
};
type Sim = {
  elapsed: number;
  spawnIn: number;
  uid: number;
  fireIn: number;
  dashT: number;
  dashCd: number;
  prevShift: boolean;
  invuln: number;
  mfa: number;
  overclock: number;
  shake: number;
  serverFlash: number;
  serverHp: number;
  hearts: number;
  kills: number;
  wrongStaff: number;
  combo: number;
  bestCombo: number;
  wave: 1 | 2 | 3;
  seen: Set<string>;
  units: Unit[];
  drops: Drop[];
  shots: Shot[];
  bossShots: Shot[];
  sparks: Spark[];
  sparkNext: number;
  boss: Boss;
  ended: boolean;
};

type Hud = { serverHp: number; hearts: number; kills: number; combo: number; wave: number; bossHp: number; bossMax: number; bossPhase: number; bossShield: boolean; mfa: number; overclock: number; dashReady: boolean; wrongStaff: number; bestCombo: number };

const SHOT_POOL = 48;
const BOSS_SHOT_POOL = 110;
const SPARK_POOL = 160;

const makeShots = (count: number): Shot[] => Array.from({ length: count }, () => ({ x: 0, z: 0, vx: 0, vz: 0, life: 0, on: false }));

function createSim(): Sim {
  return {
    elapsed: 0,
    spawnIn: 1.2,
    uid: 0,
    fireIn: 0,
    dashT: 0,
    dashCd: 0,
    prevShift: false,
    invuln: 0,
    mfa: 0,
    overclock: 0,
    shake: 0,
    serverFlash: 0,
    serverHp: 100,
    hearts: PLAYER_HEARTS,
    kills: 0,
    wrongStaff: 0,
    combo: 0,
    bestCombo: 0,
    wave: 1,
    seen: new Set(),
    units: [],
    drops: [],
    shots: makeShots(SHOT_POOL),
    bossShots: makeShots(BOSS_SHOT_POOL),
    sparks: Array.from({ length: SPARK_POOL }, () => ({ x: 0, y: -10, z: 0, vx: 0, vy: 0, vz: 0, life: 0, color: new THREE.Color() })),
    sparkNext: 0,
    boss: { active: false, phase: 0, hp: BOSS_PHASE_HP[0], maxHp: BOSS_PHASE_HP[0], x: 0, z: -ARENA_R + 0.5, mode: "enter", timer: 0, attackIn: 2, attackIdx: 0, angle: Math.PI, vx: 0, vz: 0, flash: 0, finalRetry: false },
    ended: false,
  };
}

function hudOf(s: Sim): Hud {
  return {
    serverHp: s.serverHp,
    hearts: s.hearts,
    kills: s.kills,
    combo: s.combo,
    wave: s.wave,
    bossHp: s.boss.hp,
    bossMax: s.boss.maxHp,
    bossPhase: s.boss.phase,
    bossShield: s.boss.mode === "shield",
    mfa: s.mfa,
    overclock: s.overclock,
    dashReady: s.dashCd <= 0,
    wrongStaff: s.wrongStaff,
    bestCombo: s.bestCombo,
  };
}

function pickWeighted<T extends string>(weights: [T, number][]): T {
  let roll = Math.random() * weights.reduce((sum, [, w]) => sum + w, 0);
  for (const [value, w] of weights) {
    roll -= w;
    if (roll <= 0) return value;
  }
  return weights[0][0];
}

function emit(pool: Shot[], x: number, z: number, vx: number, vz: number, life: number) {
  const shot = pool.find((entry) => !entry.on);
  if (!shot) return;
  Object.assign(shot, { x, z, vx, vz, life, on: true });
}

function burst(s: Sim, x: number, y: number, z: number, color: string, count = 14, force = 5) {
  for (let i = 0; i < count; i++) {
    const spark = s.sparks[s.sparkNext];
    s.sparkNext = (s.sparkNext + 1) % s.sparks.length;
    const angle = Math.random() * Math.PI * 2;
    const speed = force * (0.4 + Math.random() * 0.8);
    spark.x = x;
    spark.y = y;
    spark.z = z;
    spark.vx = Math.cos(angle) * speed;
    spark.vz = Math.sin(angle) * speed;
    spark.vy = 2 + Math.random() * force;
    spark.life = 0.5 + Math.random() * 0.4;
    spark.color.set(color);
  }
}

function arenaBlocked(x: number, z: number) {
  return Math.hypot(x, z) > ARENA_R - 0.7 || Math.hypot(x - SERVER.x, z - SERVER.z) < SERVER.r + 0.6;
}

/* ---------------------------- visual pieces ---------------------------- */

function UnitNode({ unit }: { unit: Unit }) {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const dx = unit.x - g.position.x;
    const dz = unit.z - g.position.z;
    if (dx * dx + dz * dz > 0.00001) g.rotation.y = Math.atan2(dx, dz);
    g.position.set(unit.x, 0, unit.z);
    if (inner.current) inner.current.scale.setScalar(1 + unit.flash * 0.3);
  });
  const hostile = unit.kind !== "staf";
  return (
    <group ref={group} position={[unit.x, 0, unit.z]}>
      <group ref={inner}>{hostile ? <ThreatModel unit={unit} /> : <StaffModel unit={unit} />}</group>
      <Label position={[0, 2.3, 0]} className={cn("arena-tag", hostile ? "is-red" : "is-green")} distanceFactor={12}>
        {hostile ? <IconThreat className="mr-1 inline h-3 w-3 align-[-2px]" /> : <IconUser className="mr-1 inline h-3 w-3 align-[-2px]" />}
        {unit.label}
      </Label>
    </group>
  );
}

function DropNode({ drop }: { drop: Drop }) {
  const group = useRef<THREE.Group>(null);
  const info = DROP_INFO[drop.kind];
  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.position.y = 0.7 + Math.sin(clock.elapsedTime * 3 + drop.uid) * 0.15;
    group.current.rotation.y += 0.04;
    group.current.visible = drop.life > 2 || Math.floor(clock.elapsedTime * 8) % 2 === 0;
  });
  return (
    <group position={[drop.x, 0, drop.z]}>
      <group ref={group}>
        <mesh castShadow>
          <octahedronGeometry args={[0.38, 0]} />
          <meshStandardMaterial color={info.warna} emissive={info.warna} emissiveIntensity={0.8} />
        </mesh>
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[0.5, 0.62, 24]} />
        <meshBasicMaterial color={info.warna} toneMapped={false} />
      </mesh>
      <Label position={[0, 1.6, 0]} className="arena-tag is-gold" distanceFactor={12}>{info.nama}</Label>
    </group>
  );
}

function SparkLayer({ simRef }: { simRef: RefObject<Sim> }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame((_, raw) => {
    const m = mesh.current;
    if (!m) return;
    const delta = clampDelta(raw);
    simRef.current.sparks.forEach((spark, i) => {
      if (spark.life > 0) {
        spark.life -= delta;
        spark.vy -= 14 * delta;
        spark.x += spark.vx * delta;
        spark.y = Math.max(0.05, spark.y + spark.vy * delta);
        spark.z += spark.vz * delta;
      }
      dummy.position.set(spark.x, spark.y, spark.z);
      dummy.scale.setScalar(spark.life > 0 ? Math.min(1, spark.life * 2) : 0);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, spark.color);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, SPARK_POOL]} frustumCulled={false}>
      <boxGeometry args={[0.16, 0.16, 0.16]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

/** Gelembung perisai MFA & kedip kebal di sekitar pemain. */
function PlayerAura({ simRef, playerRef }: { simRef: RefObject<Sim>; playerRef: RefObject<THREE.Group | null> }) {
  const bubble = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const p = playerRef.current;
    const sim = simRef.current;
    if (!p) return;
    if (bubble.current) {
      bubble.current.position.set(p.position.x, 1, p.position.z);
      bubble.current.visible = sim.mfa > 0 && (sim.mfa > 1.5 || Math.floor(clock.elapsedTime * 8) % 2 === 0);
    }
    if (ring.current) {
      ring.current.position.set(p.position.x, 0.05, p.position.z);
      (ring.current.material as THREE.MeshBasicMaterial).color.set(sim.overclock > 0 ? "#ffd166" : "#3fd0ff");
    }
    p.visible = sim.invuln <= 0 || sim.mfa > 0 || sim.dashT > 0 || Math.floor(clock.elapsedTime * 16) % 2 === 0;
  });
  return (
    <>
      <mesh ref={bubble} visible={false}>
        <sphereGeometry args={[1.1, 20, 14]} />
        <meshBasicMaterial color="#3fd0ff" transparent opacity={0.25} toneMapped={false} />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.72, 32]} />
        <meshBasicMaterial color="#3fd0ff" toneMapped={false} />
      </mesh>
    </>
  );
}

/** Getaran layar; dipasang setelah Walker agar menggeser posisi kamera hasil ikutan. */
function CameraShake({ simRef }: { simRef: RefObject<Sim> }) {
  useFrame(({ camera }, raw) => {
    const sim = simRef.current;
    sim.shake = Math.max(0, sim.shake - clampDelta(raw) * 2.2);
    if (sim.shake <= 0) return;
    const power = sim.shake * sim.shake * 0.9;
    camera.position.x += (Math.random() - 0.5) * power;
    camera.position.y += (Math.random() - 0.5) * power;
  });
  return null;
}

/* ------------------------------ simulasi ------------------------------ */

type SceneEvents = {
  sound: WorldLevelProps["sound"];
  onUnits: (units: Unit[]) => void;
  onDrops: (drops: Drop[]) => void;
  onHud: (hud: Hud, force?: boolean) => void;
  onToast: (feedback: Feedback) => void;
  onBanner: (text: string, tone?: "gold" | "bad") => void;
  onQuiz: (phase: number) => void;
  onEnd: (win: boolean) => void;
};

/** Satu langkah simulasi arena (di luar komponen agar bebas mutasi). */
function stepArena(s: Sim, p: THREE.Group, held: Record<string, boolean>, delta: number, events: SceneEvents) {
  const px = p.position.x;
  const pz = p.position.z;
  let unitsDirty = false;
  let dropsDirty = false;

  s.elapsed += delta;
  s.fireIn -= delta;
  s.dashCd = Math.max(0, s.dashCd - delta);
  s.dashT = Math.max(0, s.dashT - delta);
  s.invuln = Math.max(0, s.invuln - delta);
  s.mfa = Math.max(0, s.mfa - delta);
  s.overclock = Math.max(0, s.overclock - delta);

  const end = (win: boolean) => {
    if (s.ended) return;
    s.ended = true;
    events.onHud(hudOf(s), true);
    events.onEnd(win);
  };

  const hurtPlayer = (fromX: number, fromZ: number) => {
    if (s.invuln > 0 || s.mfa > 0 || s.dashT > 0) return;
    s.hearts -= 1;
    s.invuln = 1.3;
    s.shake = 0.8;
    s.combo = 0;
    events.sound("error");
    burst(s, p.position.x, 1, p.position.z, "#ff2b6b", 12, 4);
    const away = new THREE.Vector2(p.position.x - fromX, p.position.z - fromZ);
    if (away.lengthSq() > 0.0001) away.normalize().multiplyScalar(1.6);
    if (!arenaBlocked(p.position.x + away.x, p.position.z + away.y)) p.position.set(p.position.x + away.x, 0, p.position.z + away.y);
    if (s.hearts <= 0) end(false);
  };

  const damageServer = (amount: number) => {
    s.serverHp = Math.max(0, s.serverHp - amount);
    s.serverFlash = 1;
    s.shake = Math.max(s.shake, 0.45);
    if (s.serverHp <= 0) end(false);
  };

  const spawnUnit = (kind: UnitKind, x: number, z: number) => {
    const info = kind === "staf" ? null : ARENA_ENEMIES[kind];
    s.units.push({
      uid: ++s.uid,
      kind,
      variant: Math.floor(Math.random() * 8),
      label: info ? info.nama : ARENA_STAFF[Math.floor(Math.random() * ARENA_STAFF.length)],
      x,
      z,
      hp: info ? info.hp : 1,
      speed: info ? info.speed * (s.wave === 2 ? 1.12 : 1) : 1.7,
      t: Math.random() * 10,
      flash: 0,
    });
    unitsDirty = true;
  };

  const removeUnit = (unit: Unit) => {
    s.units = s.units.filter((entry) => entry !== unit);
    unitsDirty = true;
  };

  const kill = (unit: Unit) => {
    removeUnit(unit);
    const info = ARENA_ENEMIES[unit.kind as ArenaEnemyKind];
    s.kills += 1;
    s.combo += 1;
    s.bestCombo = Math.max(s.bestCombo, s.combo);
    burst(s, unit.x, 0.8, unit.z, info.color, 16, 5);
    events.sound("boom");
    if (!s.seen.has(unit.kind)) {
      s.seen.add(unit.kind);
      events.onToast({ ok: true, judul: `${info.nama} dinetralkan!`, teks: info.alasan, konsep: info.konsep });
    }
    const chance = unit.kind === "phish" || unit.kind === "yatim" ? 0.3 : 0.13;
    if (Math.random() < chance) {
      const kind = pickWeighted<DropKind>([["mfa", 1], ["backup", s.serverHp < 70 ? 1.4 : 0.6], ["overclock", 1.1], ["kopi", s.hearts < PLAYER_HEARTS ? 1 : 0.2]]);
      s.drops.push({ uid: ++s.uid, kind, x: unit.x, z: unit.z, life: 9 });
      dropsDirty = true;
    }
  };

  // --- gelombang ---
  if (s.wave === 1 && s.elapsed >= WAVE1_END) {
    s.wave = 2;
    events.onBanner("GELOMBANG 2!");
  } else if (s.wave === 2 && s.elapsed >= WAVE2_END) {
    s.wave = 3;
    s.boss.active = true;
    s.shake = 0.6;
    events.sound("boom");
    events.onBanner("BOSS DATANG!", "bad");
    events.onToast({ ok: false, judul: "Peretas Bayangan muncul!", teks: "Hindari peluru & serbuannya. Habiskan HP-nya untuk memunculkan perisai.", konsep: "Serangan terarah" });
  }

  // --- spawn ---
  s.spawnIn -= delta;
  if (s.spawnIn <= 0) {
    const gap = s.wave === 1 ? 1.3 : s.wave === 2 ? 0.8 : 2.6;
    s.spawnIn = gap * (0.8 + Math.random() * 0.4);
    const kind =
      s.wave === 1
        ? pickWeighted<UnitKind>([["virus", 45], ["bot", 30], ["staf", 25]])
        : s.wave === 2
          ? pickWeighted<UnitKind>([["virus", 30], ["bot", 20], ["phish", 20], ["yatim", 12], ["staf", 18]])
          : pickWeighted<UnitKind>([["virus", 40], ["phish", 30], ["staf", 30]]);
    let angle = Math.random() * Math.PI * 2;
    for (let tries = 0; tries < 6; tries++) {
      const sx = Math.sin(angle) * (ARENA_R - 0.9);
      const sz = Math.cos(angle) * (ARENA_R - 0.9);
      if (Math.hypot(sx - px, sz - pz) > 5) break;
      angle = Math.random() * Math.PI * 2;
    }
    spawnUnit(kind, Math.sin(angle) * (ARENA_R - 0.9), Math.cos(angle) * (ARENA_R - 0.9));
  }

  // --- dash ---
  const shift = Boolean(held.shift);
  if (shift && !s.prevShift && s.dashCd <= 0) {
    s.dashT = DASH_TIME;
    s.dashCd = DASH_COOLDOWN;
    events.sound("interact");
    burst(s, px, 0.3, pz, "#7cc4ff", 8, 3);
  }
  s.prevShift = shift;

  // --- gerak unit ---
  for (const unit of [...s.units]) {
    unit.t += delta;
    unit.flash = Math.max(0, unit.flash - delta * 6);
    const chase = unit.kind === "phish";
    const tx = chase ? p.position.x : SERVER.x;
    const tz = chase ? p.position.z : SERVER.z;
    let dx = tx - unit.x;
    let dz = tz - unit.z;
    const dist = Math.hypot(dx, dz) || 1;
    dx /= dist;
    dz /= dist;
    const wobble = unit.kind === "bot" ? Math.sin(unit.t * 4) * 0.9 : 0;
    unit.x += (dx + -dz * wobble) * unit.speed * delta;
    unit.z += (dz + dx * wobble) * unit.speed * delta;
    if (chase) {
      if (dist < 0.9) {
        removeUnit(unit);
        burst(s, unit.x, 0.8, unit.z, ARENA_ENEMIES.phish.color, 10, 4);
        hurtPlayer(unit.x, unit.z);
        events.onToast({ ok: false, judul: "Kena phishing! (−1 nyawa)", teks: ARENA_ENEMIES.phish.alasan, konsep: "Phishing" });
      }
    } else if (dist < SERVER.r + 0.7) {
      removeUnit(unit);
      if (unit.kind === "staf") {
        burst(s, unit.x, 1, unit.z, "#39e67a", 6, 2);
      } else {
        const info = ARENA_ENEMIES[unit.kind];
        burst(s, unit.x, 1, unit.z, "#ff2b2b", 14, 4);
        damageServer(info.damage);
        events.sound("error");
        events.onToast({ ok: false, judul: `Server ditembus ${info.nama}! (−${info.damage})`, teks: info.alasan, konsep: info.konsep });
      }
    }
  }

  // --- tembak ---
  if (held.space && s.fireIn <= 0) {
    s.fireIn = FIRE_GAP;
    let tx = 0;
    let tz = 0;
    let best = FIRE_RANGE;
    for (const unit of s.units) {
      if (unit.kind === "staf") continue;
      const d = Math.hypot(unit.x - px, unit.z - pz);
      if (d < best) {
        best = d;
        tx = unit.x;
        tz = unit.z;
      }
    }
    const b = s.boss;
    if (b.active && (b.mode === "orbit" || b.mode === "telegraph" || b.mode === "charge")) {
      const d = Math.hypot(b.x - px, b.z - pz) - 1.2;
      if (d < best) {
        best = d;
        tx = b.x;
        tz = b.z;
      }
    }
    const aim = best < FIRE_RANGE ? Math.atan2(tx - px, tz - pz) : p.rotation.y;
    p.rotation.y = aim;
    for (const spread of s.overclock > 0 ? [-0.22, 0, 0.22] : [0]) {
      const a = aim + spread;
      emit(s.shots, px + Math.sin(a) * 0.6, pz + Math.cos(a) * 0.6, Math.sin(a) * SHOT_SPEED, Math.cos(a) * SHOT_SPEED, 0.9);
    }
    events.sound("shoot");
  }

  // --- peluru pemain ---
  for (const shot of s.shots) {
    if (!shot.on) continue;
    shot.x += shot.vx * delta;
    shot.z += shot.vz * delta;
    shot.life -= delta;
    if (shot.life <= 0 || Math.hypot(shot.x, shot.z) > ARENA_R || Math.hypot(shot.x - SERVER.x, shot.z - SERVER.z) < SERVER.r) {
      shot.on = false;
      continue;
    }
    const target = s.units.find((unit) => Math.hypot(unit.x - shot.x, unit.z - shot.z) < 0.7);
    if (target) {
      shot.on = false;
      if (target.kind === "staf") {
        removeUnit(target);
        s.wrongStaff += 1;
        s.combo = 0;
        burst(s, target.x, 1, target.z, "#9ca3af", 10, 3);
        damageServer(5);
        events.sound("error");
        events.onToast({ ok: false, judul: "Itu staf yang bekerja normal! (−5 server)", teks: `${target.label}: aksesnya sah. Auditor harus membedakan ancaman dari aktivitas wajar.`, konsep: "Need-to-know" });
      } else {
        target.hp -= 1;
        target.flash = 1;
        if (target.hp <= 0) kill(target);
      }
      continue;
    }
    const b = s.boss;
    if (b.active && b.mode !== "shield" && b.mode !== "dead" && b.mode !== "enter" && Math.hypot(b.x - shot.x, b.z - shot.z) < 1.4) {
      shot.on = false;
      b.hp -= 1;
      b.flash = 1;
      burst(s, shot.x, 1.4, shot.z, "#b14bff", 3, 3);
      if (b.hp <= 0) {
        if (b.phase >= BOSS_PHASE_HP.length - 1 && b.finalRetry) {
          b.mode = "dead";
          b.timer = 0;
        } else {
          b.hp = 0;
          b.mode = "shield";
          s.bossShots.forEach((entry) => (entry.on = false));
          s.shake = 0.6;
          events.sound("boom");
          events.onHud(hudOf(s), true);
          events.onQuiz(b.phase);
        }
        break;
      }
    }
  }

  // --- boss ---
  const b = s.boss;
  if (b.active) {
    if (b.mode === "enter") {
      b.z += 3 * delta;
      if (b.z >= SERVER.z - BOSS_ORBIT) {
        b.mode = "orbit";
        b.angle = Math.PI;
      }
    } else if (b.mode === "orbit") {
      b.angle += (0.35 + b.phase * 0.12) * delta;
      const ox = SERVER.x + Math.sin(b.angle) * BOSS_ORBIT;
      const oz = SERVER.z + Math.cos(b.angle) * BOSS_ORBIT;
      b.x += (ox - b.x) * Math.min(1, delta * 3);
      b.z += (oz - b.z) * Math.min(1, delta * 3);
      b.attackIn -= delta;
      if (b.attackIn <= 0) {
        const pattern = BOSS_PATTERNS[b.phase];
        const attack = pattern[b.attackIdx % pattern.length];
        b.attackIdx += 1;
        b.attackIn = BOSS_ATTACK_GAP[b.phase];
        const toPlayer = Math.atan2(px - b.x, pz - b.z);
        if (attack === "ring") {
          const count = 10 + b.phase * 4;
          const offset = Math.random() * Math.PI;
          const speed = 5.5 + b.phase;
          for (let i = 0; i < count; i++) {
            const a = offset + (i / count) * Math.PI * 2;
            emit(s.bossShots, b.x, b.z, Math.sin(a) * speed, Math.cos(a) * speed, 4);
          }
          events.sound("boom");
        } else if (attack === "aimed") {
          const count = 3 + b.phase * 2;
          for (let i = 0; i < count; i++) {
            const a = toPlayer + (i - (count - 1) / 2) * 0.15;
            emit(s.bossShots, b.x, b.z, Math.sin(a) * 8.5, Math.cos(a) * 8.5, 3);
          }
          events.sound("shoot");
        } else if (attack === "summon") {
          for (let i = 0; i < 2 + b.phase; i++) {
            const a = (i / (2 + b.phase)) * Math.PI * 2;
            spawnUnit(i % 2 ? "phish" : "virus", b.x + Math.sin(a) * 1.8, b.z + Math.cos(a) * 1.8);
          }
          burst(s, b.x, 1.5, b.z, "#b14bff", 18, 5);
        } else {
          b.mode = "telegraph";
          b.timer = 0.75;
          b.vx = Math.sin(toPlayer);
          b.vz = Math.cos(toPlayer);
        }
      }
    } else if (b.mode === "telegraph") {
      b.timer -= delta;
      if (b.timer <= 0) {
        b.mode = "charge";
        b.timer = 0.6;
        s.shake = Math.max(s.shake, 0.3);
      }
    } else if (b.mode === "charge") {
      b.timer -= delta;
      const nx = b.x + b.vx * 15 * delta;
      const nz = b.z + b.vz * 15 * delta;
      if (Math.hypot(nx, nz) < ARENA_R - 1.5 && Math.hypot(nx - SERVER.x, nz - SERVER.z) > SERVER.r + 1.4) {
        b.x = nx;
        b.z = nz;
      } else b.timer = 0;
      if (b.timer <= 0) {
        b.mode = "orbit";
        b.angle = Math.atan2(b.x - SERVER.x, b.z - SERVER.z);
      }
    } else if (b.mode === "dead") {
      b.timer += delta;
      if (Math.random() < 0.5) burst(s, b.x + (Math.random() - 0.5) * 2, 1 + Math.random() * 2, b.z + (Math.random() - 0.5) * 2, Math.random() < 0.5 ? "#b14bff" : "#ffd166", 6, 6);
      s.shake = Math.max(s.shake, 0.4);
      if (b.timer > 1.6) {
        b.active = false;
        end(true);
      }
    }
    if ((b.mode === "orbit" || b.mode === "charge" || b.mode === "telegraph") && Math.hypot(b.x - p.position.x, b.z - p.position.z) < 1.5) hurtPlayer(b.x, b.z);
  }

  // --- peluru boss ---
  for (const shot of s.bossShots) {
    if (!shot.on) continue;
    shot.x += shot.vx * delta;
    shot.z += shot.vz * delta;
    shot.life -= delta;
    if (shot.life <= 0 || Math.hypot(shot.x, shot.z) > ARENA_R + 0.5) {
      shot.on = false;
      continue;
    }
    if (Math.hypot(shot.x - p.position.x, shot.z - p.position.z) < 0.55) {
      shot.on = false;
      hurtPlayer(shot.x, shot.z);
    }
  }

  // --- power-up ---
  for (const drop of [...s.drops]) {
    drop.life -= delta;
    if (drop.life <= 0) {
      s.drops = s.drops.filter((entry) => entry !== drop);
      dropsDirty = true;
      continue;
    }
    if (Math.hypot(drop.x - p.position.x, drop.z - p.position.z) < 1) {
      s.drops = s.drops.filter((entry) => entry !== drop);
      dropsDirty = true;
      if (drop.kind === "mfa") s.mfa = 6;
      if (drop.kind === "backup") s.serverHp = Math.min(100, s.serverHp + 20);
      if (drop.kind === "overclock") s.overclock = 7;
      if (drop.kind === "kopi") s.hearts = Math.min(PLAYER_HEARTS, s.hearts + 1);
      const info = DROP_INFO[drop.kind];
      burst(s, drop.x, 1, drop.z, info.warna, 12, 3);
      events.sound("pickup");
      events.onToast({ ok: true, judul: `${info.nama}: ${info.efek}`, teks: "" });
    }
  }

  if (unitsDirty) events.onUnits([...s.units]);
  if (dropsDirty) events.onDrops([...s.drops]);
  events.onHud(hudOf(s));
}

function ArenaScene({
  simRef,
  avatar,
  input,
  running,
  playerRef,
  units,
  drops,
  bossActive,
  events,
}: {
  simRef: RefObject<Sim>;
  avatar: WorldLevelProps["avatar"];
  input: WorldInput;
  running: boolean;
  playerRef: RefObject<THREE.Group | null>;
  units: Unit[];
  drops: Drop[];
  bossActive: boolean;
  events: SceneEvents;
}) {
  useFrame((_, raw) => {
    const p = playerRef.current;
    if (!running || !p || simRef.current.ended) return;
    stepArena(simRef.current, p, input.current.held, clampDelta(raw), events);
  });

  return (
    <>
      <DataCenterLights />
      <fog attach="fog" args={["#070a12", 30, 62]} />
      <ArenaHall />
      <ServerCluster stateRef={simRef} />
      {units.map((unit) => (
        <UnitNode key={unit.uid} unit={unit} />
      ))}
      {drops.map((drop) => (
        <DropNode key={drop.uid} drop={drop} />
      ))}
      <BossModel stateRef={simRef} playerRef={playerRef} active={bossActive} />
      <PatchShots stateRef={simRef} count={SHOT_POOL} />
      <MalwareShots stateRef={simRef} count={BOSS_SHOT_POOL} />
      <SparkLayer simRef={simRef} />
      <Walker
        avatar={avatar}
        input={input}
        playerRef={playerRef}
        start={PLAYER_START}
        frozen={!running}
        blocked={arenaBlocked}
        cameraOffset={[0, 13, 10]}
        speed={() => (simRef.current.dashT > 0 ? DASH_SPEED : WALK_SPEED)}
      />
      <PlayerAura simRef={simRef} playerRef={playerRef} />
      <CameraShake simRef={simRef} />
    </>
  );
}

/* ------------------------------- level ------------------------------- */

export function ArenaLevel({ levelIndex, info, paused, quality, avatar, input, sound, onPause, onFinish }: WorldLevelProps) {
  const simRef = useRef<Sim>(null as unknown as Sim);
  if (simRef.current === null) simRef.current = createSim();
  const player = useRef<THREE.Group>(null);
  const [phase, setPhase] = useState<"intro" | "play" | "quiz" | "done">("intro");
  const [hud, setHud] = useState<Hud>(() => hudOf(createSim()));
  const pushHud = useThrottled(setHud, 10);
  const [units, setUnits] = useState<Unit[]>([]);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [toast, setToast] = useState<Feedback>(null);
  const [banner, setBanner] = useState<{ text: string; tone?: "gold" | "bad"; key: number } | null>(null);
  const [quizPhase, setQuizPhase] = useState(0);
  const [quizPick, setQuizPick] = useState<number | null>(null);
  const [quizCorrect, setQuizCorrect] = useState(0);
  const [phasesCleared, setPhasesCleared] = useState(0);
  const [result, setResult] = useState<{ win: boolean } | null>(null);
  const bannerTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(bannerTimer.current), []);

  const showBanner = (text: string, tone?: "gold" | "bad") => {
    setBanner({ text, tone, key: performance.now() });
    window.clearTimeout(bannerTimer.current);
    bannerTimer.current = window.setTimeout(() => setBanner(null), 1300);
  };

  const finding = BOSS_FINDINGS[quizPhase];
  const bossDown = Boolean(result?.win);
  const score = clampPercent(
    hud.serverHp * 0.3 + (bossDown ? 30 : phasesCleared * 8) + (quizCorrect / BOSS_FINDINGS.length) * 20 + Math.min(20, hud.kills * 0.6) - hud.wrongStaff * 5
  );

  const answerQuiz = (index: number) => {
    if (quizPick !== null) return;
    const ok = index === finding.rekomendasiBenar;
    setQuizPick(index);
    if (ok) setQuizCorrect((value) => value + 1);
    sound(ok ? "success" : "error");
  };

  const resumeAfterQuiz = () => {
    const ok = quizPick === finding.rekomendasiBenar;
    const sim = simRef.current;
    const b = sim.boss;
    setPhasesCleared((value) => value + 1);
    setQuizPick(null);
    if (b.phase >= BOSS_PHASE_HP.length - 1) {
      if (ok) {
        b.mode = "dead";
        b.timer = 0;
      } else {
        // Jawaban salah di fase terakhir: bos memulihkan sebagian perisai, habisi sekali lagi.
        b.finalRetry = true;
        b.hp = Math.round(b.maxHp * 0.25);
        b.mode = "orbit";
        b.attackIn = 1.5;
      }
    } else {
      b.phase += 1;
      b.maxHp = Math.round(BOSS_PHASE_HP[b.phase] * (ok ? 1 : 1.25));
      b.hp = b.maxHp;
      b.mode = "orbit";
      b.attackIn = 1.5;
      b.attackIdx = 0;
    }
    sim.shake = 0.7;
    burst(sim, b.x, 1.6, b.z, ok ? "#3fd0ff" : "#b14bff", 30, 7);
    sound("boom");
    showBanner(ok ? "PERISAI JEBOL!" : "BOSS PULIH!", ok ? "gold" : "bad");
    setPhase("play");
  };

  const events: SceneEvents = {
    sound,
    onUnits: setUnits,
    onDrops: setDrops,
    onHud: pushHud,
    onToast: setToast,
    onBanner: showBanner,
    onQuiz: (bossPhase) => {
      setQuizPhase(bossPhase);
      setQuizPick(null);
      setPhase("quiz");
    },
    onEnd: (win) => {
      setResult({ win });
      sound(win ? "success" : "error");
      setPhase("done");
    },
  };

  const bossVisible = hud.wave === 3 && phase !== "done";

  return (
    <WorldStage
      quality={quality}
      paused={paused || phase === "done"}
      background="#070a12"
      overlay={
        <>
          <WorldHud
            levelIndex={levelIndex}
            info={info}
            onPause={onPause}
            toast={phase === "play" ? toast : null}
            stats={
              <>
                <HudChip>{Array.from({ length: PLAYER_HEARTS }, (_, i) => <IconHeart key={i} className={i < hud.hearts ? "fill-current text-track-audit" : "opacity-30"} />)}</HudChip>
                <HudMeter label="SERVER DB" value={hud.serverHp} tone={hud.serverHp < 35 ? "red" : hud.serverHp < 65 ? "gold" : "green"} />
                <HudChip tone="gold"><IconCrosshair />{hud.kills}</HudChip>
                {hud.combo >= 3 && <HudChip tone="green"><IconBolt />Combo x{hud.combo}</HudChip>}
                {hud.wave < 3 && <HudChip tone="dark">Gelombang {hud.wave}</HudChip>}
                {hud.mfa > 0 && <HudChip tone="green"><IconShield />{Math.ceil(hud.mfa)}s</HudChip>}
                {hud.overclock > 0 && <HudChip tone="gold"><IconBolt />x3 {Math.ceil(hud.overclock)}s</HudChip>}
                <HudChip tone={hud.dashReady ? "dark" : "red"}><IconWind />{hud.dashReady ? "Dash" : "…"}</HudChip>
              </>
            }
          />
          {bossVisible && (
            <div className={cn("world-boss-bar", hud.bossShield && "is-shield")}>
              <small>
                <span><IconSkull className="mr-1 inline h-3 w-3" />PERETAS BAYANGAN</span>
                <span>{hud.bossShield ? "PERISAI AKTIF" : `FASE ${hud.bossPhase + 1}/3`}</span>
              </small>
              <span><i style={{ width: `${hud.bossShield ? 100 : (hud.bossHp / Math.max(1, hud.bossMax)) * 100}%` }} /></span>
            </div>
          )}
          {banner && (
            <div key={banner.key} className={cn("world-objection", banner.tone === "bad" && "is-bad", banner.tone === "gold" && "is-gold")}>
              {banner.text}
            </div>
          )}
          <TouchControls
            inputRef={input}
            mode="stick"
            buttons={[
              { holdKey: "shift", label: "Dash", tone: "light" },
              { holdKey: "space", label: <IconCrosshair className="h-7 w-7" /> },
            ]}
          />
          {phase === "intro" && (
            <div className="world-overlay-card mission-pop">
              <p className="flex items-center gap-2 text-xs font-black tracking-[0.15em] text-muted-foreground">CARA MAIN</p>
              <p className="mt-1 text-lg font-black">Pertahankan server database!</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Ancaman datang dari segala arah menuju server. <b className="text-foreground">Tahan Spasi</b> untuk menembakkan patch keamanan (bidikan otomatis),{" "}
                <b className="text-foreground">Shift</b> untuk dash menghindar.
              </p>
              <div className="mt-3 grid gap-2 text-sm">
                <div className="flex items-center gap-2 rounded-2xl bg-track-audit-soft p-2.5">
                  <span className="flex-1"><b>Virus USB · Bot brute force · Phishing · Akun resign</b></span>
                  <span className="rounded-full bg-track-audit px-2 py-0.5 text-xs font-black text-white">TEMBAK</span>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-2.5">
                  <span className="flex-1"><b>Staf hijau</b> · akses sah ke server</span>
                  <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-black text-white">JANGAN</span>
                </div>
              </div>
              <p className="mt-3 text-xs font-bold leading-relaxed">
                Ambil power-up: <span className="text-sky-600">Perisai MFA</span> · <span className="text-emerald-600">Backup</span> · <span className="text-amber-600">Patch Overclock</span> · Kopi.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Setelah 2 gelombang, bos Peretas Bayangan datang. Jebol perisainya dengan memilih kontrol audit yang tepat!</p>
              <Button
                className="mt-3 w-full"
                onClick={() => {
                  sound("interact");
                  setPhase("play");
                }}
              >
                Mulai bertahan
              </Button>
            </div>
          )}
          {phase === "quiz" && finding && (
            <div className="world-overlay-card mission-pop">
              <p className="flex items-center gap-2 text-xs font-black tracking-[0.15em] text-muted-foreground">JEBOL PERISAI · FASE {quizPhase + 1}/3</p>
              <p className="mt-1 text-sm text-muted-foreground">Perisai bos terbuat dari celah ini:</p>
              <p className="mt-1 text-lg font-black">{finding.judul}</p>
              <p className="mt-2 text-sm font-bold">Kontrol mana yang menutup celahnya?</p>
              <div className="mt-2 grid gap-1.5">
                {finding.rekomendasi.map((rec, index) => (
                  <button
                    key={rec}
                    disabled={quizPick !== null}
                    onClick={() => answerQuiz(index)}
                    className={cn(
                      "flex items-center gap-2 rounded-2xl border-2 px-3 py-2 text-left text-sm font-semibold transition-colors",
                      quizPick === null && "border-border hover:border-brand-navy",
                      quizPick !== null && index === finding.rekomendasiBenar && "border-emerald-500 bg-emerald-50",
                      quizPick === index && index !== finding.rekomendasiBenar && "border-track-audit bg-track-audit-soft"
                    )}
                  >
                    {quizPick !== null && index === finding.rekomendasiBenar ? (
                      <IconCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                    ) : quizPick === index ? (
                      <IconX className="h-4 w-4 shrink-0 text-track-audit" />
                    ) : null}
                    {rec}
                  </button>
                ))}
              </div>
              {quizPick !== null && (
                <>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{finding.penjelasan}</p>
                  <Button className="mt-3 w-full" onClick={resumeAfterQuiz}>
                    {quizPick === finding.rekomendasiBenar ? "Jebol perisainya!" : "Lanjut bertarung"}
                  </Button>
                </>
              )}
            </div>
          )}
          {phase === "done" && result && (
            <LevelEnd
              score={score}
              reason={result.win ? "Peretas Bayangan dikalahkan!" : hud.serverHp <= 0 ? "Server database jebol" : "Inspektur tumbang"}
              detail={`${hud.kills} ancaman dinetralkan · server ${Math.round(hud.serverHp)}% · ${quizCorrect}/${BOSS_FINDINGS.length} kontrol tepat · combo terbaik x${hud.bestCombo} · ${hud.wrongStaff} staf salah tembak.`}
              isLast
              onNext={() => onFinish(score)}
            />
          )}
        </>
      }
    >
      <ArenaScene simRef={simRef} avatar={avatar} input={input} running={!paused && phase === "play"} playerRef={player} units={units} drops={drops} bossActive={hud.wave === 3 && phase !== "done"} events={events} />
    </WorldStage>
  );
}
