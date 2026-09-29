"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { IconFire, IconPackage, IconTimer } from "@/components/ui/icons";
import { clampPercent, type Feedback } from "@/components/game/missions/mission-kit";
import { DRONE_JOB_BANK, DRONE_SITES, type DroneJob, type DroneSiteId } from "@/lib/data/worlds";
import { cn } from "@/lib/utils";
import { pickOne, shuffled } from "../quiz-bank";
import { TouchControls } from "../touch-controls";
import { stackCompassLabels } from "../hud-layout";
import { controlHint, readAxis, usePressReader, type WorldInput } from "../world-controls";
import { clampDelta, HudChip, HudMeter, KeyHint, LevelEnd, WorldHud, WorldStage, useThrottled, type WorldLevelProps } from "../world-kit";
import {
  BATTERY_SPOTS,
  BUG_PATROLS,
  HARD_RADIUS,
  HQ_TOWER,
  MAX_ALTITUDE,
  PAD_RADIUS,
  PLAY_RADIUS,
  RINGS,
  SITE,
  SOLIDS,
  surfaceAt,
} from "./drone-layout";
import { BatteryCell, BugDrone, CargoDrone, DataPacket, Fireworks, GoLiveArcs, OpsTower, SiteBeacon, SyncRing, type BeaconMode, type DroneMotion } from "./drone-models";
import { DroneNature } from "./drone-scenery";
import { DroneCity } from "./drone-city";

/* ------------------------------------------------------------------ */
/* Level 3 · Drone Integrasi: Hari Go-Live                             */
/* ------------------------------------------------------------------ */

const START_TIME = 200;
const CORRECT_BONUS = 12;
const WRONG_PENALTY = 8;
const SPEED = 24;
const TURBO_SPEED = 40;
const LOW_SPEED = 11;
const CLIMB = 13;
const CLEARANCE = 2.2;
const DRONE_RADIUS = 1.5;
const BUG_CHASE_SPEED = 15;
const FINALE_TIME = 5;
const JOBS = DRONE_JOB_BANK.length;

const padY = (id: DroneSiteId) => surfaceAt(SITE[id].x, SITE[id].z);

/** Tugas yang sedang dimainkan & urutan tampil kandidat tujuannya (diisi `rerollJobs`). */
const ACTIVE_JOBS: DroneJob[] = [];
const CANDIDATES: DroneSiteId[][] = [];

/** Undi satu varian tugas per slot & acak urutan kandidat. Dipanggil setiap level dimulai. */
function rerollJobs() {
  ACTIVE_JOBS.splice(0, ACTIVE_JOBS.length, ...DRONE_JOB_BANK.map((variants) => pickOne(variants)));
  CANDIDATES.splice(0, CANDIDATES.length, ...ACTIVE_JOBS.map((job) => shuffled([job.ke, ...job.pengecoh])));
}
rerollJobs();

type Phase = "pickup" | "deliver" | "golive" | "finale" | "done";

type Bug = { cx: number; cz: number; r: number; baseY: number; angle: number; speed: number; x: number; y: number; z: number; chasing: boolean; cooldown: number; dead: number };

type DroneState = {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  vy: number;
  heading: number;
  yawRate: number;
  battery: number;
  turbo: number;
  turboOn: boolean;
  stun: number;
  /** Detik perlindungan setelah mengambil paket (bug tidak bisa mencuri). */
  shield: number;
};

type Sim = {
  timeLeft: number;
  elapsed: number;
  phase: Phase;
  job: number;
  carrying: boolean;
  dropped: THREE.Vector3 | null;
  wrongSites: DroneSiteId[];
  wrongs: number;
  delivered: number;
  combo: number;
  bestCombo: number;
  rings: number;
  ringTaken: number[];
  batteryTaken: number[];
  bugs: Bug[];
  bugsDowned: number;
  lowWarned: boolean;
  finale: number;
};

function createSim(): Sim {
  const rand = (k: number) => (Math.sin(k * 91.7) + 1) / 2;
  return {
    timeLeft: START_TIME,
    elapsed: 0,
    phase: "pickup",
    job: 0,
    carrying: false,
    dropped: null,
    wrongSites: [],
    wrongs: 0,
    delivered: 0,
    combo: 0,
    bestCombo: 0,
    rings: 0,
    ringTaken: RINGS.map(() => -999),
    batteryTaken: BATTERY_SPOTS.map(() => -999),
    bugs: BUG_PATROLS.map((p, k) => ({
      cx: p.x,
      cz: p.z,
      r: p.r,
      baseY: surfaceAt(p.x, p.z) + p.y,
      angle: rand(k) * Math.PI * 2,
      speed: (0.35 + rand(k + 7) * 0.2) * (k % 2 ? 1 : -1),
      x: p.x,
      y: p.y,
      z: p.z,
      chasing: false,
      cooldown: 0,
      dead: 0,
    })),
    bugsDowned: 0,
    lowWarned: false,
    finale: 0,
  };
}

function createDrone(): DroneState {
  return {
    pos: new THREE.Vector3(SITE.hq.x, padY("hq") + 3, SITE.hq.z + 2),
    vel: new THREE.Vector3(),
    vy: 0,
    heading: Math.PI,
    yawRate: 0,
    battery: 100,
    turbo: 60,
    turboOn: false,
    stun: 0,
    shield: 0,
  };
}

/** Status tugas yang ditampilkan HUD & beacon, hanya berubah saat ada kejadian. */
type Stage = { phase: Phase; job: number; carrying: boolean; dropped: THREE.Vector3 | null; wrongSites: DroneSiteId[]; hinted: boolean };

const stageOf = (s: Sim): Stage => ({
  phase: s.phase,
  job: s.job,
  carrying: s.carrying,
  dropped: s.dropped ? s.dropped.clone() : null,
  wrongSites: [...s.wrongSites],
  hinted: s.wrongSites.length > 0,
});

type Hud = { timeLeft: number; delivered: number; combo: number; battery: number; turbo: number; outside: boolean; prompt: string | null };

type Target = { x: number; z: number; color: string; label: string };

/** Titik tujuan saat ini untuk kompas & radar. */
function targetsOf(s: Sim): Target[] {
  if (s.phase === "golive" || s.phase === "finale") return [{ x: SITE.hq.x, z: SITE.hq.z, color: "#ffc857", label: "Pusat Operasi" }];
  if (s.phase === "done") return [];
  const job = ACTIVE_JOBS[s.job];
  if (s.dropped) return [{ x: s.dropped.x, z: s.dropped.z, color: "#ffc857", label: "Paket jatuh" }];
  if (s.phase === "pickup") return [{ x: SITE[job.dari].x, z: SITE[job.dari].z, color: "#ffc857", label: SITE[job.dari].nama }];
  const hinted = s.wrongSites.length > 0;
  return CANDIDATES[s.job]
    .filter((id) => !s.wrongSites.includes(id) && (!hinted || id === job.ke))
    .map((id) => ({ x: SITE[id].x, z: SITE[id].z, color: hinted ? "#2fe06b" : "#ffc857", label: SITE[id].nama }));
}

type Events = {
  sound: WorldLevelProps["sound"];
  toast: (feedback: Feedback) => void;
  stage: (s: Sim) => void;
  hud: (hud: Hud, force?: boolean) => void;
  end: (s: Sim) => void;
};

/* ------------------------------ pengendali ------------------------------ */

const forward = new THREE.Vector3();
const desired = new THREE.Vector3();
const lookTarget = new THREE.Vector3();
const targetVel = new THREE.Vector3();
const FINALE_CAM = new THREE.Vector3();

function DroneController({
  input,
  running,
  droneRef,
  simRef,
  events,
  finaleRef,
}: {
  input: WorldInput;
  running: boolean;
  droneRef: RefObject<DroneState>;
  simRef: RefObject<Sim>;
  events: Events;
  finaleRef: RefObject<number>;
}) {
  const group = useRef<THREE.Group>(null);
  const motion = useRef({ speed: 0, turbo: false, carrying: null as string | null, beam: 0, stunned: false });
  const look = useRef(new THREE.Vector3());
  const placed = useRef(false);
  const read = usePressReader(input);
  const bumpCooldown = useRef(0);

  useFrame((state, raw) => {
    const camera = state.camera as THREE.PerspectiveCamera;
    const d = droneRef.current;
    const s = simRef.current;
    const delta = clampDelta(raw);
    const interact = read("interact");
    bumpCooldown.current = Math.max(0, bumpCooldown.current - delta);
    let prompt: string | null = null;
    let beam = 0;

    if (running && s.phase !== "done") {
      s.elapsed += delta;
      d.shield = Math.max(0, d.shield - delta);

      /* ---------- input & fisika ---------- */
      const finale = s.phase === "finale";
      let axis = finale ? { x: 0, y: 0 } : readAxis(input.current);
      let climb = finale ? 0 : (input.current.held.space ? 1 : 0) - (input.current.held.c ? 1 : 0);
      if (d.stun > 0) {
        d.stun = Math.max(0, d.stun - delta);
        axis = { x: 0, y: 0 };
        climb = 0;
      }
      const low = d.battery <= 0;
      d.turboOn = Boolean(input.current.held.shift) && d.turbo > 0 && axis.y > 0.2 && !low && !finale;
      if (d.turboOn) d.turbo = Math.max(0, d.turbo - 28 * delta);
      else d.turbo = Math.min(100, d.turbo + 4 * delta);
      d.battery = Math.max(0, d.battery - (0.38 + (d.turboOn ? 1.6 : 0)) * delta);
      if (low && !s.lowWarned) {
        s.lowWarned = true;
        events.sound("error");
        events.toast({ ok: false, judul: "Baterai habis, mode hemat!", teks: "Drone melambat. Ambil sel baterai hijau atau mendarat di landasan Pusat Operasi untuk mengisi ulang." });
      }
      if (!low) s.lowWarned = false;

      d.yawRate = THREE.MathUtils.damp(d.yawRate, -axis.x * 1.9, 8, delta);
      d.heading += d.yawRate * delta;
      forward.set(Math.sin(d.heading), 0, Math.cos(d.heading));
      const max = low ? LOW_SPEED : d.turboOn ? TURBO_SPEED : SPEED;
      targetVel.copy(forward).multiplyScalar(axis.y * max * (axis.y < 0 ? 0.45 : 1));
      d.vel.lerp(targetVel, 1 - Math.exp(-delta * (d.turboOn ? 3 : 2.2)));
      d.vy = THREE.MathUtils.damp(d.vy, climb * CLIMB, 4, delta);

      // Batas lembut: angin sakal makin kuat di luar area operasi.
      const r = Math.hypot(d.pos.x, d.pos.z);
      const outside = r > PLAY_RADIUS;
      if (outside) {
        const push = (r - PLAY_RADIUS) * 0.9;
        d.vel.x -= (d.pos.x / r) * push * delta;
        d.vel.z -= (d.pos.z / r) * push * delta;
      }

      const prevY = d.pos.y;
      d.pos.addScaledVector(d.vel, delta);
      d.pos.y += d.vy * delta;
      const rr = Math.hypot(d.pos.x, d.pos.z);
      if (rr > HARD_RADIUS) {
        d.pos.x *= HARD_RADIUS / rr;
        d.pos.z *= HARD_RADIUS / rr;
      }

      // Gedung.
      for (const solid of SOLIDS) {
        const ground = surfaceAt(solid.x, solid.z);
        const top = ground + solid.top + CLEARANCE * 0.7;
        const dx = d.pos.x - solid.x;
        const dz = d.pos.z - solid.z;
        const nx = solid.hw + DRONE_RADIUS;
        const nz = solid.hd + DRONE_RADIUS;
        if (Math.abs(dx) >= nx || Math.abs(dz) >= nz || d.pos.y >= top) continue;
        if (prevY >= top - 0.05) {
          d.pos.y = top;
          d.vy = Math.max(0, d.vy);
          continue;
        }
        const px = nx - Math.abs(dx);
        const pz = nz - Math.abs(dz);
        const impact = d.vel.length();
        if (px < pz) {
          d.pos.x += Math.sign(dx || 1) * px;
          d.vel.x *= -0.3;
        } else {
          d.pos.z += Math.sign(dz || 1) * pz;
          d.vel.z *= -0.3;
        }
        if (impact > 12 && bumpCooldown.current <= 0) {
          bumpCooldown.current = 0.8;
          events.sound("boom");
          d.battery = Math.max(0, d.battery - 3);
        }
      }

      const ground = surfaceAt(d.pos.x, d.pos.z);
      if (d.pos.y < ground + CLEARANCE) {
        d.pos.y = ground + CLEARANCE;
        d.vy = Math.max(0, d.vy);
      }
      d.pos.y = Math.min(d.pos.y, MAX_ALTITUDE);

      /* ---------- waktu ---------- */
      if (!finale) {
        s.timeLeft -= delta;
        if (s.timeLeft <= 0) {
          s.timeLeft = 0;
          s.phase = "done";
          events.sound("error");
          events.stage(s);
          events.end(s);
        }
      }

      /* ---------- landasan & tugas ---------- */
      const near = (x: number, z: number, y: number) => Math.hypot(d.pos.x - x, d.pos.z - z) < PAD_RADIUS + 3 && d.pos.y - y < 20;
      const job = ACTIVE_JOBS[Math.min(s.job, JOBS - 1)];

      if (!finale && near(SITE.hq.x, SITE.hq.z, padY("hq")) && d.battery < 100) {
        d.battery = Math.min(100, d.battery + 30 * delta);
        prompt = "Mengisi baterai di Pusat Operasi";
      }

      if (s.phase === "pickup" || (s.phase === "deliver" && s.dropped)) {
        const spot = s.dropped ? { x: s.dropped.x, z: s.dropped.z, y: s.dropped.y } : { x: SITE[job.dari].x, z: SITE[job.dari].z, y: padY(job.dari) };
        if (near(spot.x, spot.z, spot.y)) {
          beam = d.pos.y - spot.y;
          prompt = `E Ambil paket ${job.paket}`;
          if (interact) {
            s.carrying = true;
            s.dropped = null;
            s.phase = "deliver";
            d.shield = 3;
            events.sound("pickup");
            events.toast({ ok: true, judul: `Paket diambil: ${job.paket}`, teks: `${job.deskripsi} Pilih divisi tujuan yang tepat.`, konsep: job.kode });
            events.stage(s);
          }
        }
      } else if (s.phase === "deliver" && s.carrying) {
        for (const id of CANDIDATES[s.job]) {
          if (s.wrongSites.includes(id) || !near(SITE[id].x, SITE[id].z, padY(id))) continue;
          beam = d.pos.y - padY(id);
          prompt = `E Serahkan ke ${SITE[id].nama}`;
          if (!interact) break;
          if (id === job.ke) {
            s.delivered += 1;
            s.combo += 1;
            s.bestCombo = Math.max(s.bestCombo, s.combo);
            s.timeLeft += CORRECT_BONUS;
            s.wrongSites = [];
            s.carrying = false;
            s.job += 1;
            events.sound("success");
            const next = ACTIVE_JOBS[s.job];
            if (!next) {
              s.phase = "golive";
              events.toast({ ok: true, judul: "Semua modul terhubung!", teks: `${job.benar} Sekarang kembali ke Pusat Operasi untuk Go-Live!`, konsep: job.konsep });
            } else if (next.dari === id) {
              // Data langsung mengalir ke proses berikutnya di divisi yang sama.
              s.carrying = true;
              d.shield = 3;
              s.phase = "deliver";
              events.toast({ ok: true, judul: `Tepat! +${CORRECT_BONUS} dtk · lanjut: ${next.paket}`, teks: `${job.benar} Paket berikutnya langsung terbit di sini.`, konsep: job.konsep });
            } else {
              s.phase = "pickup";
              events.toast({ ok: true, judul: `Tepat! +${CORRECT_BONUS} dtk`, teks: `${job.benar} Berikutnya: ambil ${next.paket} di ${SITE[next.dari].nama}.`, konsep: job.konsep });
            }
          } else {
            s.wrongs += 1;
            s.combo = 0;
            s.timeLeft = Math.max(1, s.timeLeft - WRONG_PENALTY);
            s.wrongSites = [...s.wrongSites, id];
            events.sound("error");
            events.toast({ ok: false, judul: `Ditolak ${SITE[id].nama} · −${WRONG_PENALTY} dtk`, teks: `${job.petunjuk} Tujuan yang benar sekarang ditandai hijau.`, konsep: job.konsep });
          }
          events.stage(s);
          break;
        }
      } else if (s.phase === "golive") {
        const y = padY("hq");
        if (near(SITE.hq.x, SITE.hq.z, y)) {
          prompt = "E Jalankan GO-LIVE!";
          beam = d.pos.y - y;
          if (interact) {
            s.phase = "finale";
            s.finale = 0;
            events.sound("success");
            events.toast({ ok: true, judul: "GO-LIVE!", teks: "Semua divisi kini memakai satu sistem dan satu sumber data. Data silo resmi tamat!", konsep: "Sistem terintegrasi" });
            events.stage(s);
          }
        }
      } else if (s.phase === "finale") {
        s.finale += delta;
        if (s.finale >= FINALE_TIME) {
          s.phase = "done";
          events.stage(s);
          events.end(s);
        }
      }
      finaleRef.current = s.phase === "finale" || s.phase === "done" ? Math.min(1, s.finale / (FINALE_TIME * 0.7)) : 0;

      /* ---------- cincin & baterai ---------- */
      RINGS.forEach((ring, k) => {
        if (s.elapsed - s.ringTaken[k] < 45) return;
        if (Math.hypot(d.pos.x - ring.x, d.pos.y - ring.y, d.pos.z - ring.z) > 3.8) return;
        s.ringTaken[k] = s.elapsed;
        s.rings += 1;
        d.turbo = Math.min(100, d.turbo + 35);
        events.sound("pickup");
      });
      BATTERY_SPOTS.forEach(([bx, by, bz], k) => {
        if (s.elapsed - s.batteryTaken[k] < 30) return;
        const y = surfaceAt(bx, bz) + by;
        if (Math.hypot(d.pos.x - bx, d.pos.y - y, d.pos.z - bz) > 3.2) return;
        s.batteryTaken[k] = s.elapsed;
        d.battery = Math.min(100, d.battery + 40);
        events.sound("pickup");
        events.toast({ ok: true, judul: "Baterai +40%", teks: "Sel baterai terpasang. Drone kembali bertenaga penuh." });
      });

      /* ---------- drone bug ---------- */
      s.bugs.forEach((bug) => {
        if (bug.dead > 0) {
          bug.dead = Math.max(0, bug.dead - delta);
          return;
        }
        bug.cooldown = Math.max(0, bug.cooldown - delta);
        const dist = Math.hypot(d.pos.x - bug.x, d.pos.y - bug.y, d.pos.z - bug.z);
        const home = Math.hypot(bug.x - bug.cx, bug.z - bug.cz);
        bug.chasing = s.carrying && bug.cooldown <= 0 && d.shield <= 0 && dist < 34 && home < 90 && !finale;
        if (bug.chasing) {
          const k = (BUG_CHASE_SPEED * delta) / Math.max(dist, 0.001);
          bug.x += (d.pos.x - bug.x) * k;
          bug.y += (d.pos.y - bug.y) * k;
          bug.z += (d.pos.z - bug.z) * k;
        } else {
          bug.angle += bug.speed * delta;
          const tx = bug.cx + Math.cos(bug.angle) * bug.r;
          const tz = bug.cz + Math.sin(bug.angle) * bug.r;
          const ty = bug.baseY + Math.sin(s.elapsed * 1.3 + bug.r) * 3;
          const f = 1 - Math.exp(-delta * 1.5);
          bug.x += (tx - bug.x) * f;
          bug.y += (ty - bug.y) * f;
          bug.z += (tz - bug.z) * f;
        }
        if (dist > 3.2 || finale) return;
        if (d.turboOn) {
          bug.dead = 25;
          s.bugsDowned += 1;
          events.sound("boom");
          events.toast({ ok: true, judul: "Bug Data Silo dihancurkan!", teks: "Integrasi membongkar silo: data mengalir lagi antar divisi.", konsep: "Hapus data silo" });
          return;
        }
        bug.cooldown = 8;
        if (d.shield > 0) {
          // Perisai sinkron: bug terpental tanpa mencuri paket.
          bug.x -= (d.pos.x - bug.x) * 2;
          bug.z -= (d.pos.z - bug.z) * 2;
          return;
        }
        d.stun = 1.1;
        d.vel.set(d.pos.x - bug.x, 0, d.pos.z - bug.z).setLength(18);
        d.vy = 6;
        d.battery = Math.max(0, d.battery - 6);
        events.sound("error");
        if (s.carrying) {
          s.carrying = false;
          s.combo = 0;
          s.dropped = new THREE.Vector3(d.pos.x, surfaceAt(d.pos.x, d.pos.z), d.pos.z);
          events.toast({ ok: false, judul: "Paket dicuri bug Data Silo!", teks: `Paket jatuh ke tanah. Ambil lagi, dan tabrak bug pakai turbo (${controlHint("Shift", "tombol Turbo")}) untuk menghancurkannya.`, konsep: "Data silo" });
          events.stage(s);
        } else {
          events.toast({ ok: false, judul: "Ditabrak bug Data Silo!", teks: "Baterai berkurang. Tabrak bug sambil turbo untuk menghancurkannya." });
        }
      });

      events.hud({
        timeLeft: s.timeLeft,
        delivered: s.delivered,
        combo: s.combo,
        battery: d.battery,
        turbo: d.turbo,
        outside,
        prompt,
      });
    }

    /* ---------- tampilan drone ---------- */
    forward.set(Math.sin(d.heading), 0, Math.cos(d.heading));
    const forwardSpeed = d.vel.dot(forward);
    const m = motion.current;
    m.speed = d.vel.length();
    m.turbo = d.turboOn;
    m.carrying = s.carrying ? "packet" : null;
    m.beam = THREE.MathUtils.damp(m.beam, beam > 0 ? Math.min(beam, 22) : 0, 8, delta);
    m.stunned = d.stun > 0;
    if (group.current) {
      const g = group.current;
      g.rotation.order = "YXZ";
      g.position.copy(d.pos);
      g.position.y += Math.sin(s.elapsed * 2.4) * 0.12;
      g.rotation.y = d.heading + (d.stun > 0 ? d.stun * 9 : 0);
      g.rotation.x = THREE.MathUtils.damp(g.rotation.x, THREE.MathUtils.clamp(forwardSpeed * 0.013, -0.3, 0.45), 6, delta);
      g.rotation.z = THREE.MathUtils.damp(g.rotation.z, THREE.MathUtils.clamp(-d.yawRate * 0.22, -0.4, 0.4), 6, delta);
    }

    /* ---------- kamera ---------- */
    if (s.phase === "finale" || (s.phase === "done" && s.finale > 0)) {
      const a = s.finale * 0.35 + 0.6;
      const base = surfaceAt(HQ_TOWER.x, HQ_TOWER.z);
      FINALE_CAM.set(HQ_TOWER.x + Math.cos(a) * 170, base + 62, HQ_TOWER.z + Math.sin(a) * 170);
      desired.copy(FINALE_CAM);
      lookTarget.set(HQ_TOWER.x, base + HQ_TOWER.h * 0.85, HQ_TOWER.z);
    } else {
      desired.copy(d.pos).addScaledVector(forward, d.turboOn ? -13.5 : -12).setY(d.pos.y + 4.6);
      lookTarget.copy(d.pos).addScaledVector(forward, 8).setY(d.pos.y + 0.6);
      desired.y = Math.max(desired.y, surfaceAt(desired.x, desired.z) + 1.5);
    }
    if (!placed.current) {
      camera.position.copy(desired);
      look.current.copy(lookTarget);
      placed.current = true;
    }
    camera.position.lerp(desired, 1 - Math.exp(-delta * (s.phase === "finale" ? 1.4 : 4.5)));
    look.current.lerp(lookTarget, 1 - Math.exp(-delta * 7));
    camera.lookAt(look.current);
    const fov = 60 + Math.min(12, m.speed * 0.28) + (d.turboOn ? 6 : 0);
    if (Math.abs(camera.fov - fov) > 0.05) {
      camera.fov = THREE.MathUtils.damp(camera.fov, fov, 3, delta);
      camera.updateProjectionMatrix();
    }
  });

  return (
    <group ref={group}>
      <CargoDrone motion={motion as DroneMotion} />
    </group>
  );
}

/* ------------------------------ objek dinamis ------------------------------ */

function Bugs({ simRef, droneRef }: { simRef: RefObject<Sim>; droneRef: RefObject<DroneState> }) {
  const groups = useRef<(THREE.Group | null)[]>([]);
  const [chasing, setChasing] = useState<boolean[]>(() => BUG_PATROLS.map(() => false));
  const last = useRef(chasing);
  useFrame(() => {
    const bugs = simRef.current.bugs;
    bugs.forEach((bug, k) => {
      const g = groups.current[k];
      if (!g) return;
      g.visible = bug.dead <= 0;
      g.position.set(bug.x, bug.y, bug.z);
      const d = droneRef.current.pos;
      if (bug.chasing) g.lookAt(d.x, bug.y, d.z);
      else g.rotation.y = Math.atan2(-Math.sin(bug.angle) * Math.sign(bug.speed), Math.cos(bug.angle) * Math.sign(bug.speed));
    });
    const now = bugs.map((bug) => bug.chasing);
    if (now.some((value, k) => value !== last.current[k])) {
      last.current = now;
      setChasing(now);
    }
  });
  return (
    <>
      {BUG_PATROLS.map((_, k) => (
        <group key={k} ref={(node) => { groups.current[k] = node; }}>
          <BugDrone chasing={chasing[k]} phase={k * 2.1} />
        </group>
      ))}
    </>
  );
}

/** Cincin & baterai: status "sudah diambil" dibaca dari sim beberapa kali per detik. */
function Pickups({ simRef }: { simRef: RefObject<Sim> }) {
  const [taken, setTaken] = useState({ rings: RINGS.map(() => false), cells: BATTERY_SPOTS.map(() => false) });
  const key = useRef("");
  useFrame(() => {
    const s = simRef.current;
    const rings = s.ringTaken.map((t) => s.elapsed - t < 45);
    const cells = s.batteryTaken.map((t) => s.elapsed - t < 30);
    const next = rings.map(Number).join("") + cells.map(Number).join("");
    if (next !== key.current) {
      key.current = next;
      setTaken({ rings, cells });
    }
  });
  return (
    <>
      {RINGS.map((ring, k) => (
        <group key={k} position={[ring.x, ring.y, ring.z]} rotation={[0, ring.heading, 0]}>
          <SyncRing taken={taken.rings[k]} phase={k * 0.9} />
        </group>
      ))}
      {BATTERY_SPOTS.map(([x, y, z], k) => (
        <group key={k} position={[x, surfaceAt(x, z) + y, z]}>
          <BatteryCell taken={taken.cells[k]} phase={k * 1.3} />
        </group>
      ))}
    </>
  );
}

function DroppedPacket({ at }: { at: THREE.Vector3 | null }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.elapsedTime * 1.5;
      group.current.position.y = (at?.y ?? 0) + 1.2 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
    }
  });
  if (!at) return null;
  return (
    <group ref={group} position={[at.x, at.y + 1.2, at.z]}>
      <DataPacket size={1.4} />
      <mesh position={[0, 20, 0]}>
        <cylinderGeometry args={[0.3, 0.8, 40, 12, 1, true]} />
        <meshBasicMaterial color="#ffc857" transparent opacity={0.12} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

/* ------------------------------ HUD: kompas & radar ------------------------------ */

const bearing = (fromX: number, fromZ: number, heading: number, x: number, z: number) => {
  const a = Math.atan2(x - fromX, z - fromZ) - heading;
  return Math.atan2(Math.sin(a), Math.cos(a));
};

function Compass({ droneRef, simRef }: { droneRef: RefObject<DroneState>; simRef: RefObject<Sim> }) {
  const strip = useRef<HTMLDivElement>(null);
  const ticks = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const loop = () => {
      const d = droneRef.current;
      const el = strip.current;
      if (el && d) {
        const width = el.clientWidth;
        const targets = targetsOf(simRef.current);
        const markers = Array.from(el.querySelectorAll<HTMLElement>("[data-marker]"));
        markers.forEach((node, k) => {
          const t = targets[k];
          if (!t) {
            node.style.display = "none";
            return;
          }
          // Bearing positif = di kiri (heading bertambah ke kiri).
          const b = -bearing(d.pos.x, d.pos.z, d.heading, t.x, t.z);
          const clamped = THREE.MathUtils.clamp(b, -Math.PI / 2, Math.PI / 2);
          node.style.display = "flex";
          node.style.left = `${((clamped / Math.PI + 0.5) * width).toFixed(1)}px`;
          node.style.setProperty("--marker", t.color);
          node.dataset.edge = Math.abs(b) > Math.PI / 2 ? (b > 0 ? "right" : "left") : "";
          const dist = Math.hypot(t.x - d.pos.x, t.z - d.pos.z);
          const label = node.querySelector("span");
          if (label) label.textContent = `${t.label} · ${Math.round(dist)} m`;
        });
        stackCompassLabels(el);
        if (ticks.current) {
          const offset = ((d.heading / (Math.PI * 2)) * width * 2) % (width / 2);
          ticks.current.style.backgroundPosition = `${(-offset).toFixed(1)}px 0`;
        }
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [droneRef, simRef]);
  return (
    <div className="drone-compass" ref={strip} aria-hidden>
      <div className="drone-compass-ticks" ref={ticks} />
      <i className="drone-compass-center" />
      {[0, 1, 2].map((k) => (
        <div key={k} className="drone-compass-marker" data-marker>
          <b />
          <span />
        </div>
      ))}
    </div>
  );
}

const RADAR = 76;
const RADAR_RANGE = 260;

function Radar({ droneRef, simRef }: { droneRef: RefObject<DroneState>; simRef: RefObject<Sim> }) {
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    let frame = 0;
    const put = (node: SVGCircleElement | null, fromX: number, fromZ: number, heading: number, x: number, z: number, clampEdge = false) => {
      if (!node) return;
      const dist = Math.hypot(x - fromX, z - fromZ);
      const b = bearing(fromX, fromZ, heading, x, z);
      let r = (dist / RADAR_RANGE) * (RADAR - 6);
      if (r > RADAR - 6) {
        if (!clampEdge) {
          node.setAttribute("visibility", "hidden");
          return;
        }
        r = RADAR - 6;
      }
      node.setAttribute("visibility", "visible");
      node.setAttribute("cx", (RADAR - Math.sin(b) * r).toFixed(1));
      node.setAttribute("cy", (RADAR - Math.cos(b) * r).toFixed(1));
    };
    const loop = () => {
      const d = droneRef.current;
      const s = simRef.current;
      const root = svg.current;
      if (root && d) {
        const sites = root.querySelectorAll<SVGCircleElement>("[data-site]");
        DRONE_SITES.forEach((site, k) => put(sites[k], d.pos.x, d.pos.z, d.heading, site.x, site.z));
        const bugs = root.querySelectorAll<SVGCircleElement>("[data-bug]");
        s.bugs.forEach((bug, k) => {
          if (bug.dead > 0) bugs[k]?.setAttribute("visibility", "hidden");
          else put(bugs[k], d.pos.x, d.pos.z, d.heading, bug.x, bug.z);
        });
        const cells = root.querySelectorAll<SVGCircleElement>("[data-cell]");
        BATTERY_SPOTS.forEach(([x, , z], k) => {
          if (s.elapsed - s.batteryTaken[k] < 30) cells[k]?.setAttribute("visibility", "hidden");
          else put(cells[k], d.pos.x, d.pos.z, d.heading, x, z);
        });
        const targets = targetsOf(s);
        root.querySelectorAll<SVGCircleElement>("[data-target]").forEach((node, k) => {
          const t = targets[k];
          if (!t) node.setAttribute("visibility", "hidden");
          else {
            node.setAttribute("stroke", t.color);
            put(node, d.pos.x, d.pos.z, d.heading, t.x, t.z, true);
          }
        });
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [droneRef, simRef]);
  return (
    <div className="drone-radar" aria-hidden>
      <svg ref={svg} viewBox={`0 0 ${RADAR * 2} ${RADAR * 2}`}>
        <circle cx={RADAR} cy={RADAR} r={RADAR - 2} fill="rgb(16 19 26 / .72)" stroke="rgb(255 255 255 / .25)" strokeWidth={2} />
        <circle cx={RADAR} cy={RADAR} r={(RADAR - 6) / 2} fill="none" stroke="rgb(255 255 255 / .12)" />
        <line x1={RADAR} y1={6} x2={RADAR} y2={RADAR * 2 - 6} stroke="rgb(255 255 255 / .08)" />
        <line x1={6} y1={RADAR} x2={RADAR * 2 - 6} y2={RADAR} stroke="rgb(255 255 255 / .08)" />
        {DRONE_SITES.map((site) => (
          <circle key={site.id} data-site r={3.2} fill={site.color} stroke="#10131a" strokeWidth={1} />
        ))}
        {BATTERY_SPOTS.map((_, k) => (
          <circle key={k} data-cell r={2.4} fill="#2fe06b" />
        ))}
        {BUG_PATROLS.map((_, k) => (
          <circle key={k} data-bug r={2.6} fill="#ff3b30" />
        ))}
        {[0, 1, 2].map((k) => (
          <circle key={k} data-target r={6} fill="none" strokeWidth={2.4} className="drone-radar-pulse" />
        ))}
        <path d={`M${RADAR} ${RADAR - 7} L${RADAR + 5} ${RADAR + 5} L${RADAR} ${RADAR + 2} L${RADAR - 5} ${RADAR + 5} Z`} fill="#f26b3a" stroke="#fff" strokeWidth={1.2} strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function JobCard({ stage }: { stage: Stage }) {
  if (stage.phase === "done") return null;
  if (stage.phase === "golive" || stage.phase === "finale") {
    return (
      <div className="drone-job is-live">
        <small>SEMUA MODUL TERHUBUNG</small>
        <strong>{stage.phase === "finale" ? "GO-LIVE berjalan…" : "Kembali ke Pusat Operasi"}</strong>
        <p>{stage.phase === "finale" ? "Data mengalir ke seluruh divisi." : `Mendarat di landasan menara ERP, lalu ${controlHint("tekan E", "ketuk Aksi")} untuk Go-Live.`}</p>
      </div>
    );
  }
  const job = ACTIVE_JOBS[stage.job];
  return (
    <div className="drone-job">
      <small>TUGAS {stage.job + 1}/{JOBS} · {job.kode}</small>
      <strong><IconPackage className="inline h-4 w-4" /> {job.paket}</strong>
      {stage.dropped ? (
        <p className="is-warn">Paket jatuh! Terbang ke sinar kuning dan ambil lagi.</p>
      ) : stage.phase === "pickup" ? (
        <p>Ambil di <b>{SITE[job.dari].nama}</b> ({SITE[job.dari].divisi}).</p>
      ) : (
        <>
          <p>{job.deskripsi}</p>
          <ul>
            {CANDIDATES[stage.job].map((id) => {
              const wrong = stage.wrongSites.includes(id);
              const hint = stage.hinted && id === job.ke;
              return (
                <li key={id} className={cn(wrong && "is-wrong", hint && "is-hint")}>
                  <i style={{ background: SITE[id].color }} />
                  {SITE[id].nama}
                  <em>{SITE[id].divisi}</em>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

/* ------------------------------ level ------------------------------ */

const TOUCH = [
  { holdKey: "space", label: "Naik" },
  { holdKey: "c", label: "Turun", tone: "light" as const },
  { holdKey: "shift", label: "Turbo" },
  { press: "interact" as const, label: "Aksi", tone: "gold" as const },
];

function scoreOf(s: Sim) {
  const live = s.phase === "done" && s.finale > 0;
  const deliveries = (s.delivered / JOBS) * 50;
  const accuracy = s.delivered > 0 ? Math.max(0, 10 - s.wrongs * 2.5) * (s.delivered / JOBS) : 0;
  const time = live ? THREE.MathUtils.clamp(s.timeLeft / 80, 0, 1) * 15 : 0;
  return clampPercent(deliveries + accuracy + time + (live ? 10 : 0) + Math.min(10, s.rings) + Math.min(5, s.bugsDowned * 2.5));
}

export function DroneLevel({ levelIndex, info, paused, quality, input, sound, onPause, onFinish }: WorldLevelProps) {
  const droneRef = useRef<DroneState>(createDrone());
  // Tugas diundi ulang setiap level dimulai / diulang (sebelum simulasi dibuat).
  useState(rerollJobs);
  const simRef = useRef<Sim>(createSim());
  const finaleRef = useRef(0);
  const [stage, setStage] = useState<Stage>({ phase: "pickup", job: 0, carrying: false, dropped: null, wrongSites: [], hinted: false });
  const [hud, setHud] = useState<Hud>({ timeLeft: START_TIME, delivered: 0, combo: 0, battery: 100, turbo: 60, outside: false, prompt: null });
  const pushHud = useThrottled(setHud, 10);
  const [toast, setToast] = useState<Feedback>({
    ok: true,
    judul: "Hari Go-Live dimulai!",
    teks: `Tugas pertama: ambil ${ACTIVE_JOBS[0].paket} di ${SITE[ACTIVE_JOBS[0].dari].nama}. Ikuti penanda kuning di kompas & radar.`,
  });
  const [result, setResult] = useState<null | { score: number; live: boolean; delivered: number; wrongs: number; rings: number; bugs: number; timeLeft: number }>(null);

  const events = useMemo<Events>(
    () => ({
      sound,
      toast: setToast,
      stage: (s) => setStage(stageOf(s)),
      hud: pushHud,
      end: (s) =>
        setResult({
          score: scoreOf(s),
          live: s.finale > 0,
          delivered: s.delivered,
          wrongs: s.wrongs,
          rings: s.rings,
          bugs: s.bugsDowned,
          timeLeft: s.timeLeft,
        }),
    }),
    [sound, pushHud]
  );

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), toast.ok ? 4200 : 5200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const beaconModes = useMemo(() => {
    const modes: Record<DroneSiteId, BeaconMode> = { hq: "idle", penjualan: "idle", keuangan: "idle", gudang: "idle", pabrik: "idle", pelabuhan: "idle", proyek: "idle", perumahan: "idle" };
    const labels: Partial<Record<DroneSiteId, string>> = {};
    if (stage.phase === "golive") {
      modes.hq = "home";
      labels.hq = "GO-LIVE di sini";
    } else if (stage.phase === "pickup" && !stage.dropped) {
      const job = ACTIVE_JOBS[stage.job];
      modes[job.dari] = "pickup";
      labels[job.dari] = `Ambil: ${job.paket}`;
    } else if (stage.phase === "deliver" && !stage.dropped) {
      const job = ACTIVE_JOBS[stage.job];
      CANDIDATES[stage.job].forEach((id) => {
        if (stage.wrongSites.includes(id)) modes[id] = "wrong";
        else if (stage.hinted) modes[id] = id === job.ke ? "correct" : "idle";
        else modes[id] = "candidate";
        if (modes[id] !== "idle") labels[id] = modes[id] === "wrong" ? `Salah: ${SITE[id].nama}` : `? ${SITE[id].nama}`;
      });
    }
    return { modes, labels };
  }, [stage]);

  const hqTop: [number, number, number] = [HQ_TOWER.x, surfaceAt(HQ_TOWER.x, HQ_TOWER.z) + HQ_TOWER.h, HQ_TOWER.z];
  const live = stage.phase === "finale" || (stage.phase === "done" && Boolean(result?.live));
  const minutes = Math.floor(hud.timeLeft / 60);
  const seconds = Math.floor(hud.timeLeft % 60).toString().padStart(2, "0");

  return (
    <WorldStage
      quality={quality}
      paused={paused || Boolean(result)}
      camera={{ position: [0, 12, 16], fov: 60, near: 0.5, far: 2400 }}
      overlay={
        <>
          <WorldHud
            levelIndex={levelIndex}
            info={info}
            onPause={onPause}
            toast={toast}
            prompt={
              result ? null : hud.outside ? (
                <span className="text-brand-gold">Sinyal ERP melemah, putar balik!</span>
              ) : hud.prompt ? (
                hud.prompt.startsWith("E ") ? (
                  <>
                    <KeyHint keyboard="E" touch="Aksi" />
                    {hud.prompt.slice(2)}
                  </>
                ) : (
                  hud.prompt
                )
              ) : null
            }
            stats={
              <>
                <HudChip tone={hud.timeLeft < 30 ? "red" : "dark"} pulse={hud.timeLeft < 15}>
                  <IconTimer />
                  {minutes}:{seconds}
                </HudChip>
                <HudChip tone="gold">
                  <IconPackage />
                  {hud.delivered}/{JOBS}
                </HudChip>
                {hud.combo > 1 && (
                  <HudChip tone="green">
                    <IconFire />
                    Combo x{hud.combo}
                  </HudChip>
                )}
                <HudMeter label="BATERAI" value={hud.battery} tone={hud.battery < 25 ? "red" : "green"} />
                <HudMeter label="TURBO" value={hud.turbo} tone="gold" />
              </>
            }
          />
          <JobCard stage={stage} />
          <Compass droneRef={droneRef} simRef={simRef} />
          <Radar droneRef={droneRef} simRef={simRef} />
          <TouchControls inputRef={input} mode="stick" buttons={TOUCH} />
          {result && (
            <LevelEnd
              score={result.score}
              reason={result.live ? "Go-Live sukses!" : "Waktu habis"}
              detail={`${result.delivered}/${JOBS} paket tepat · ${result.wrongs} salah kirim · ${result.rings} cincin sinkron · ${result.bugs} bug dihancurkan${result.live ? ` · sisa ${Math.round(result.timeLeft)} dtk` : ""}.`}
              isLast
              onNext={() => onFinish(result.score)}
            />
          )}
        </>
      }
    >
      <DroneNature quality={quality} focus={droneRef} />
      <DroneCity quality={quality} />
      <OpsTower live={live} />
      {DRONE_SITES.map((site, k) => (
        <SiteBeacon key={site.id} siteIndex={k} mode={beaconModes.modes[site.id]} label={beaconModes.labels[site.id]} />
      ))}
      <Pickups simRef={simRef} />
      <Bugs simRef={simRef} droneRef={droneRef} />
      <DroppedPacket at={stage.dropped} />
      <GoLiveArcs progress={finaleRef} />
      <Fireworks active={live} center={hqTop} />
      <DroneController input={input} running={!paused && !result} droneRef={droneRef} simRef={simRef} events={events} finaleRef={finaleRef} />
    </WorldStage>
  );
}

