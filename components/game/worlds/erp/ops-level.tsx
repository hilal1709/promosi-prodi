"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { IconAlarm, IconBolt, IconCheck, IconCoffee, IconFactory, IconPackage, IconSmile, IconTimer, IconWarehouse, IconX } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { clampPercent, type Feedback } from "@/components/game/missions/mission-kit";
import { ERP_EVENTS } from "@/lib/data/missions";
import { OPS_EVENT_TIMES, OPS_ORDERS, OPS_PRODUCT_IDS, OPS_PRODUCTS, type OpsOrder, type OpsProductId } from "@/lib/data/worlds";
import { cn } from "@/lib/utils";
import { TouchControls } from "../touch-controls";
import { usePressReader, type WorldInput } from "../world-controls";
import { clampDelta, HudChip, Label, LevelEnd, Walker, WorldHud, WorldStage, useThrottled, type WorldLevelProps } from "../world-kit";
import {
  arrivalPath,
  BAY_Z,
  COFFEE_SPOTS,
  CONSOLES,
  CONVEYOR_PATH,
  departurePath,
  distanceAt,
  FORKLIFT_PERIMETER,
  forkliftPose,
  LOAD_X,
  opsBlocked,
  OPS_TIME,
  pathDuration,
  PLAYER_START,
  poseOnPath,
  RACK_CAPACITY,
  RACK_PICK_X,
  RACK_X,
  RACKS,
  SPILLS,
  TERMINAL,
  TRUCK_PARK_X,
} from "./ops-layout";
import { CarriedStack, CoffeeCup, Conveyor, ErpTerminal, FlatbedTruck, Forklift, PalletModel, ProductionConsole, SpillDecal, WarehouseRack } from "./ops-models";
import { OpsScenery, type DashData } from "./ops-scenery";

/* ------------------------------------------------------------------ */
/* Level 2 · Shift Gudang Pintar                                       */
/* ------------------------------------------------------------------ */

const MAX_CARRY = 2;
const PRODUCTION_TIME = 7;
const PRODUCTION_BATCH = 3;
const ALARM_WINDOW = 30;
const FORKLIFT_SPEED = 4.2;
const TRUCK_CABS = ["#2f6fb5", "#c0392b", "#2fae66", "#8e44ad", "#d35400", "#1f3b63", "#16a085", "#7f8c8d"];
const TOTAL_PALLETS = OPS_ORDERS.reduce((sum, order) => sum + order.palet.length, 0);
const ARRIVALS = BAY_Z.map((z) => arrivalPath(z));
const DEPARTURES = BAY_Z.map((z) => departurePath(z));
const ARRIVAL_TIME = ARRIVALS.map(pathDuration);
const DEPARTURE_TIME = DEPARTURES.map(pathDuration);

type TruckPhase = "arrive" | "dock" | "leave";

type Truck = {
  uid: number;
  order: OpsOrder;
  bay: number;
  phase: TruckPhase;
  clock: number;
  loaded: OpsProductId[];
  patience: number;
  patienceMax: number;
  cab: string;
};

type FloorPallet = { uid: number; x: number; z: number; product: OpsProductId };

type Sim = {
  time: number;
  ended: boolean;
  stock: Record<OpsProductId, number>;
  carry: OpsProductId[];
  production: { product: OpsProductId; t: number } | null;
  spawned: string[];
  queue: OpsOrder[];
  trucks: Truck[];
  completed: string[];
  failed: string[];
  deliveredPallets: number;
  floor: FloorPallet[];
  forklifts: number[];
  stun: number;
  sprint: number;
  coffee: { uid: number; x: number; z: number } | null;
  nextCoffee: number;
  eventIdx: number;
  alarm: number | null;
  alarmDeadline: number;
  answers: Record<string, number>;
  susulan: { at: number; pallets: number } | null;
  satisfaction: number;
  combo: number;
  bestCombo: number;
  uid: number;
};

function createSim(): Sim {
  return {
    time: 0,
    ended: false,
    stock: { pcc: 3, opc: 3, putih: 2 },
    carry: [],
    production: null,
    spawned: [],
    queue: [],
    trucks: [],
    completed: [],
    failed: [],
    deliveredPallets: 0,
    floor: [],
    forklifts: [0, FORKLIFT_PERIMETER / 2],
    stun: 0,
    sprint: 0,
    coffee: null,
    nextCoffee: 22,
    eventIdx: 0,
    alarm: null,
    alarmDeadline: 0,
    answers: {},
    susulan: null,
    satisfaction: 100,
    combo: 0,
    bestCombo: 0,
    uid: 1,
  };
}

const needed = (truck: Truck) => {
  const rest = [...truck.order.palet];
  truck.loaded.forEach((p) => {
    const i = rest.indexOf(p);
    if (i >= 0) rest.splice(i, 1);
  });
  return rest;
};

/** Kebutuhan palet per jenis dari truk yang sedang/akan dimuat, dikurangi yang sedang dibawa. */
function openDemand(s: Sim) {
  const demand: Record<OpsProductId, number> = { pcc: 0, opc: 0, putih: 0 };
  s.trucks.forEach((t) => t.phase !== "leave" && needed(t).forEach((p) => demand[p]++));
  s.queue.forEach((o) => o.palet.forEach((p) => demand[p]++));
  return demand;
}

type TruckView = { uid: number; bay: number; phase: TruckPhase; pelanggan: string; loaded: OpsProductId[]; needed: OpsProductId[]; patience: number; cab: string };

type View = {
  time: number;
  stock: Record<OpsProductId, number>;
  carry: OpsProductId[];
  production: { product: OpsProductId; progress: number } | null;
  trucks: TruckView[];
  queue: number;
  floor: FloorPallet[];
  coffee: { uid: number; x: number; z: number } | null;
  alarm: number | null;
  alarmLeft: number;
  completed: number;
  failed: number;
  satisfaction: number;
  combo: number;
  sprint: number;
  stunned: boolean;
  guide: [number, number] | null;
};

function guideTarget(s: Sim): [number, number] | null {
  if (s.alarm !== null) return [TERMINAL.x, TERMINAL.z];
  const docked = s.trucks.filter((t) => t.phase === "dock");
  if (s.carry.length) {
    const truck = docked.find((t) => needed(t).some((p) => s.carry.includes(p)));
    if (truck) return [LOAD_X + 0.6, BAY_Z[truck.bay]];
  }
  if (s.floor.length && s.carry.length < MAX_CARRY) return [s.floor[0].x, s.floor[0].z];
  if (s.carry.length < MAX_CARRY) {
    for (const truck of docked) {
      const want = needed(truck).find((p) => !s.carry.includes(p) || needed(truck).filter((q) => q === p).length > s.carry.filter((q) => q === p).length);
      if (!want) continue;
      if (s.stock[want] > 0) return [RACK_PICK_X, RACKS.find((r) => r.product === want)!.z];
      if (!s.production) return [CONSOLES.find((c) => c.product === want)!.x, CONSOLES.find((c) => c.product === want)!.z];
    }
  }
  return null;
}

function snapshot(s: Sim): View {
  return {
    time: s.time,
    stock: { ...s.stock },
    carry: [...s.carry],
    production: s.production ? { product: s.production.product, progress: s.production.t / PRODUCTION_TIME } : null,
    trucks: s.trucks.map((t) => ({
      uid: t.uid,
      bay: t.bay,
      phase: t.phase,
      pelanggan: t.order.pelanggan,
      loaded: [...t.loaded],
      needed: needed(t),
      patience: t.patienceMax ? t.patience / t.patienceMax : 1,
      cab: t.cab,
    })),
    queue: s.queue.length,
    floor: [...s.floor],
    coffee: s.coffee,
    alarm: s.alarm,
    alarmLeft: s.alarm === null ? 0 : Math.max(0, s.alarmDeadline - s.time),
    completed: s.completed.length,
    failed: s.failed.length,
    satisfaction: Math.round(s.satisfaction),
    combo: s.combo,
    sprint: s.sprint,
    stunned: s.stun > 0,
    guide: guideTarget(s),
  };
}

/** Kurangi stok rak (yang paling banyak dulu), dipakai efek kejadian. */
function removeStock(s: Sim, pallets: number) {
  for (let i = 0; i < pallets; i++) {
    const id = [...OPS_PRODUCT_IDS].sort((a, b) => s.stock[b] - s.stock[a])[0];
    if (s.stock[id] > 0) s.stock[id]--;
  }
}

type SceneEvents = {
  sound: WorldLevelProps["sound"];
  toast: (feedback: Feedback) => void;
  banner: (text: string, tone?: "gold" | "bad") => void;
  prompt: (text: string | null) => void;
  openEvent: () => void;
  end: () => void;
};

type Station =
  | { kind: "rack"; product: OpsProductId }
  | { kind: "bay"; bay: number }
  | { kind: "console"; product: OpsProductId }
  | { kind: "terminal" }
  | { kind: "floor"; pallet: FloorPallet };

function nearestStation(s: Sim, x: number, z: number): Station | null {
  let best: { station: Station; d: number } | null = null;
  const offer = (station: Station, d: number, radius: number) => {
    if (d < radius && (!best || d < best.d)) best = { station, d };
  };
  RACKS.forEach((r) => offer({ kind: "rack", product: r.product }, Math.hypot(Math.max(0, x - RACK_PICK_X), Math.max(0, Math.abs(z - r.z) - 1.8)), 1.6));
  BAY_Z.forEach((bz, bay) => offer({ kind: "bay", bay }, Math.hypot(Math.max(0, LOAD_X - x), Math.max(0, Math.abs(z - bz) - 1.6)), 1.4));
  CONSOLES.forEach((c) => offer({ kind: "console", product: c.product }, Math.hypot(x - c.x, z - (c.z + 0.9)), 1.3));
  offer({ kind: "terminal" }, Math.hypot(x - TERMINAL.x, z - (TERMINAL.z + 1)), 1.8);
  s.floor.forEach((pallet) => offer({ kind: "floor", pallet }, Math.hypot(x - pallet.x, z - pallet.z), 1.6));
  return (best as { station: Station } | null)?.station ?? null;
}

const productList = (list: OpsProductId[]) => {
  const counts = new Map<OpsProductId, number>();
  list.forEach((p) => counts.set(p, (counts.get(p) ?? 0) + 1));
  return [...counts].map(([p, n]) => `${n} ${OPS_PRODUCTS[p].singkat}`).join(" + ");
};

function promptFor(s: Sim, station: Station | null): string | null {
  if (!station) return null;
  switch (station.kind) {
    case "rack": {
      const info = OPS_PRODUCTS[station.product];
      const demand = openDemand(s)[station.product];
      if (s.carry.includes(station.product) && s.carry.filter((p) => p === station.product).length > demand) return `Kembalikan palet ${info.singkat} ke rak`;
      if (s.carry.length >= MAX_CARRY) return s.carry.includes(station.product) ? `Kembalikan palet ${info.singkat} ke rak` : "Tangan penuh, muat dulu ke truk";
      return s.stock[station.product] > 0 ? `Ambil palet ${info.nama} (stok ${s.stock[station.product]})` : `Stok ${info.singkat} habis, produksi dulu!`;
    }
    case "bay": {
      const truck = s.trucks.find((t) => t.bay === station.bay && t.phase === "dock");
      if (!truck) return s.trucks.some((t) => t.bay === station.bay && t.phase === "arrive") ? `Bay ${station.bay + 1}: truk sedang mundur…` : `Bay ${station.bay + 1} kosong`;
      const want = needed(truck);
      return s.carry.some((p) => want.includes(p)) ? `Muat ke truk ${truck.order.pelanggan}` : `${truck.order.pelanggan} butuh ${productList(want)}`;
    }
    case "console":
      return s.production
        ? `Kiln sibuk: ${OPS_PRODUCTS[s.production.product].singkat} ${Math.ceil(PRODUCTION_TIME - s.production.t)} dtk`
        : `Jalankan produksi ${OPS_PRODUCTS[station.product].nama} (+${PRODUCTION_BATCH} palet)`;
    case "terminal":
      return s.alarm !== null ? "Tangani alarm ERP!" : "Cek rekomendasi dasbor ERP";
    case "floor":
      return s.carry.length < MAX_CARRY ? `Pungut palet ${OPS_PRODUCTS[station.pallet.product].singkat} yang jatuh` : "Tangan penuh";
  }
}

function interact(s: Sim, station: Station, ev: SceneEvents) {
  switch (station.kind) {
    case "rack": {
      const p = station.product;
      const info = OPS_PRODUCTS[p];
      const surplus = s.carry.filter((q) => q === p).length > openDemand(s)[p];
      if (s.carry.includes(p) && (surplus || s.carry.length >= MAX_CARRY)) {
        s.carry.splice(s.carry.lastIndexOf(p), 1);
        s.stock[p] = Math.min(RACK_CAPACITY, s.stock[p] + 1);
        ev.sound("interact");
        ev.toast({ ok: true, judul: `Palet ${info.singkat} kembali ke rak`, teks: "Stok di ERP langsung bertambah lagi, tidak ada selisih pencatatan.", konsep: "Real-time inventory" });
        return;
      }
      if (s.carry.length >= MAX_CARRY) {
        ev.sound("error");
        ev.toast({ ok: false, judul: "Tangan penuh", teks: "Maksimal 2 palet sekali angkut. Muat dulu ke truk.", konsep: "K3" });
        return;
      }
      if (s.stock[p] <= 0) {
        ev.sound("error");
        ev.toast({ ok: false, judul: `Stok ${info.singkat} kosong`, teks: `Jalankan produksi ${info.singkat} di konsol utara, ERP akan menambah stok otomatis.`, konsep: "Perencanaan produksi (MRP)" });
        return;
      }
      s.stock[p]--;
      s.carry.push(p);
      ev.sound("pickup");
      if (s.stock[p] === 0) ev.toast({ ok: false, judul: `Stok ${info.singkat} habis!`, teks: "Dasbor ERP menandai merah. Jadwalkan produksi sebelum pesanan berikutnya datang.", konsep: "Reorder point" });
      return;
    }
    case "bay": {
      const truck = s.trucks.find((t) => t.bay === station.bay && t.phase === "dock");
      if (!truck) {
        ev.sound("error");
        return;
      }
      let moved = 0;
      for (const p of [...s.carry]) {
        if (needed(truck).includes(p)) {
          s.carry.splice(s.carry.indexOf(p), 1);
          truck.loaded.push(p);
          s.deliveredPallets++;
          moved++;
        }
      }
      if (!moved) {
        ev.sound("error");
        ev.toast({
          ok: false,
          judul: s.carry.length ? "Jenis semen salah!" : "Belum bawa palet",
          teks: `${truck.order.pelanggan} memesan ${productList(needed(truck))}. Cek Sales Order di dasbor sebelum mengambil barang.`,
          konsep: "Akurasi pesanan",
        });
        return;
      }
      if (needed(truck).length === 0) {
        const fast = truck.patience / truck.patienceMax > 0.5;
        s.completed.push(truck.order.id);
        s.combo = fast ? s.combo + 1 : 1;
        s.bestCombo = Math.max(s.bestCombo, s.combo);
        if (fast) s.satisfaction = Math.min(100, s.satisfaction + 3);
        truck.phase = "leave";
        truck.clock = 0;
        ev.sound("success");
        ev.toast({
          ok: true,
          judul: `${truck.order.jumlah} ton → ${truck.order.pelanggan}`,
          teks: `Surat jalan & faktur INV-${truck.order.id.toUpperCase()} terbit otomatis di modul Keuangan.`,
          konsep: "Integrasi order-to-cash",
        });
        if (s.combo >= 2) ev.banner(`KILAT x${s.combo}!`, "gold");
      } else {
        ev.sound("pickup");
      }
      return;
    }
    case "console": {
      const info = OPS_PRODUCTS[station.product];
      if (s.production) {
        ev.sound("error");
        ev.toast({ ok: false, judul: "Kiln masih bekerja", teks: `Tunggu produksi ${OPS_PRODUCTS[s.production.product].singkat} selesai dulu.`, konsep: "Kapasitas produksi" });
        return;
      }
      if (s.stock[station.product] >= RACK_CAPACITY) {
        ev.sound("error");
        ev.toast({ ok: false, judul: `Rak ${info.singkat} penuh`, teks: "Produksi berlebih hanya menumpuk biaya gudang.", konsep: "Overproduction" });
        return;
      }
      s.production = { product: station.product, t: 0 };
      ev.sound("interact");
      ev.toast({ ok: true, judul: `Produksi ${info.nama} dijadwalkan`, teks: "ERP otomatis memotong stok bahan baku dan akan menambah stok gudang saat selesai.", konsep: "Integrasi produksi–gudang" });
      return;
    }
    case "terminal": {
      if (s.alarm !== null) {
        ev.sound("interact");
        ev.openEvent();
        return;
      }
      const demand = openDemand(s);
      const short = OPS_PRODUCT_IDS.map((id) => ({ id, gap: demand[id] - s.stock[id] })).sort((a, b) => b.gap - a.gap)[0];
      ev.sound("interact");
      ev.toast(
        short.gap > 0
          ? { ok: false, judul: `Rekomendasi MRP: produksi ${OPS_PRODUCTS[short.id].singkat}`, teks: `Pesanan aktif butuh ${demand[short.id]} palet ${OPS_PRODUCTS[short.id].singkat}, stok cuma ${s.stock[short.id]}.`, konsep: "Material Requirement Planning" }
          : { ok: true, judul: "Semua stok aman", teks: "Stok gudang cukup untuk semua Sales Order yang terbuka.", konsep: "Dasbor real-time" }
      );
      return;
    }
    case "floor": {
      if (s.carry.length >= MAX_CARRY) {
        ev.sound("error");
        return;
      }
      s.floor = s.floor.filter((f) => f !== station.pallet);
      s.carry.push(station.pallet.product);
      ev.sound("pickup");
      return;
    }
  }
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

function TruckNode({ simRef, uid, view }: { simRef: RefObject<Sim>; uid: number; view: TruckView }) {
  const group = useRef<THREE.Group>(null);
  const motion = useRef({ speed: 0 });
  const pos = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const truck = simRef.current.trucks.find((t) => t.uid === uid);
    const g = group.current;
    if (!truck || !g) return;
    let heading = Math.PI / 2;
    if (truck.phase === "dock") {
      pos.set(TRUCK_PARK_X, 0, BAY_Z[truck.bay]);
      motion.current.speed = 0;
    } else {
      const path = truck.phase === "arrive" ? ARRIVALS[truck.bay] : DEPARTURES[truck.bay];
      const pose = poseOnPath(path, distanceAt(path, truck.clock), pos);
      heading = pose.heading;
      motion.current.speed = pose.speed;
    }
    g.position.copy(pos);
    const diff = Math.atan2(Math.sin(heading - g.rotation.y), Math.cos(heading - g.rotation.y));
    g.rotation.y += diff * 0.25;
  });
  const urgent = view.patience < 0.3;
  return (
    <group ref={group} position={[60, 0, 150]}>
      <FlatbedTruck cab={view.cab} loaded={view.loaded} needed={view.phase === "leave" ? [] : view.needed} motion={motion} />
      {view.phase !== "leave" && (
        <Label position={[0, 4.6, 0]} className={urgent && view.phase === "dock" ? "is-red" : "is-light"} distanceFactor={16}>
          <span className="block text-[0.7rem]">{view.pelanggan}</span>
          <span className="mt-0.5 flex justify-center gap-1">
            {view.needed.map((p, k) => (
              <i key={k} className="inline-block h-2.5 w-2.5 rounded-sm ring-1 ring-black/30" style={{ background: OPS_PRODUCTS[p].color }} />
            ))}
          </span>
          {view.phase === "dock" && (
            <span className="mt-1 block h-1 w-16 overflow-hidden rounded-full bg-black/20">
              <i className="block h-full" style={{ width: `${view.patience * 100}%`, background: urgent ? "#fff" : "#2fae66" }} />
            </span>
          )}
        </Label>
      )}
    </group>
  );
}

function Forklifts({ simRef }: { simRef: RefObject<Sim> }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  useFrame(() => {
    simRef.current.forklifts.forEach((d, k) => {
      const g = refs.current[k];
      if (!g) return;
      const pose = forkliftPose(d);
      g.position.set(pose.x, 0, pose.z);
      g.rotation.y = pose.heading;
    });
  });
  return (
    <>
      {[0, 1].map((k) => (
        <group key={k} ref={(node) => { refs.current[k] = node; }}>
          <Forklift product={k ? "putih" : "pcc"} color={k ? "#2d6cdf" : "#f2a93b"} />
        </group>
      ))}
    </>
  );
}

/** Tumpukan palet & bintang pusing yang mengikuti pemain. */
function PlayerExtras({ playerRef, carry, stunned, sprint }: { playerRef: RefObject<THREE.Group | null>; carry: OpsProductId[]; stunned: boolean; sprint: boolean }) {
  const group = useRef<THREE.Group>(null);
  const stars = useRef<THREE.Group>(null);
  useFrame((_, raw) => {
    const p = playerRef.current;
    const g = group.current;
    if (!p || !g) return;
    g.position.copy(p.position);
    g.rotation.y = p.rotation.y;
    if (stars.current) stars.current.rotation.y += clampDelta(raw) * 6;
  });
  return (
    <group ref={group}>
      <CarriedStack items={carry} />
      {stunned && (
        <group ref={stars} position={[0, 3, 0]}>
          {[0, 1, 2, 3].map((k) => (
            <mesh key={k} position={[Math.cos((k / 4) * Math.PI * 2) * 0.55, 0, Math.sin((k / 4) * Math.PI * 2) * 0.55]}>
              <octahedronGeometry args={[0.13, 0]} />
              <meshBasicMaterial color="#ffd23f" />
            </mesh>
          ))}
        </group>
      )}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.75, 0.95, 32]} />
        <meshBasicMaterial color={sprint ? "#3fd0ff" : "#ffa987"} transparent opacity={0.7} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** Panah emas melayang di atas tujuan berikutnya. */
function GuideArrow({ target }: { target: [number, number] | null }) {
  const group = useRef<THREE.Group>(null);
  const clock = useRef(0);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    const g = group.current;
    if (!g) return;
    g.visible = Boolean(target);
    if (!target) return;
    g.position.x = THREE.MathUtils.damp(g.position.x, target[0], 8, clampDelta(raw));
    g.position.z = THREE.MathUtils.damp(g.position.z, target[1], 8, clampDelta(raw));
    g.position.y = 3.6 + Math.sin(clock.current * 4) * 0.3;
    g.rotation.y = clock.current * 2;
  });
  return (
    <group ref={group} position={[target?.[0] ?? 0, 3.6, target?.[1] ?? 0]}>
      <mesh rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.4, 0.8, 4]} />
        <meshStandardMaterial color="#ffc857" emissive="#ffb020" emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

function OpsScene({
  simRef,
  view,
  avatar,
  input,
  running,
  quality,
  events,
  pushView,
}: {
  simRef: RefObject<Sim>;
  view: View;
  avatar: WorldLevelProps["avatar"];
  input: WorldInput;
  running: boolean;
  quality: WorldLevelProps["quality"];
  events: SceneEvents;
  pushView: (view: View, force?: boolean) => void;
}) {
  const player = useRef<THREE.Group>(null);
  const read = usePressReader(input);
  const lastPrompt = useRef<string | null>(null);
  const wasRunning = useRef(false);
  const dashRef = useRef<DashData>({ stock: { ...view.stock }, done: 0, total: OPS_ORDERS.length, sat: 100, alarm: false });

  useFrame((_, raw) => {
    const s = simRef.current;
    const pressed = read("interact") || read("action");
    if (!running || s.ended) {
      wasRunning.current = false;
      return;
    }
    // Ketukan selama jeda/panel dibuang agar tidak memicu aksi saat lanjut.
    if (!wasRunning.current) {
      wasRunning.current = true;
      return;
    }
    const p = player.current;
    if (!p) return;
    const dt = clampDelta(raw);
    let dirty = false;
    s.time += dt;
    s.stun = Math.max(0, s.stun - dt);
    s.sprint = Math.max(0, s.sprint - dt);

    // Pesanan masuk → antre → truk menuju bay kosong.
    OPS_ORDERS.forEach((order) => {
      if (s.time >= order.muncul && !s.spawned.includes(order.id)) {
        s.spawned.push(order.id);
        s.queue.push(order);
        dirty = true;
      }
    });
    BAY_Z.forEach((_, bay) => {
      if (!s.queue.length || s.trucks.some((t) => t.bay === bay && (t.phase !== "leave" || t.clock < 2.5))) return;
      const order = s.queue.shift()!;
      const patienceMax = 42 + order.palet.length * 12;
      s.trucks.push({ uid: s.uid++, order, bay, phase: "arrive", clock: 0, loaded: [], patience: patienceMax, patienceMax, cab: TRUCK_CABS[OPS_ORDERS.indexOf(order) % TRUCK_CABS.length] });
      dirty = true;
    });

    for (const truck of [...s.trucks]) {
      if (truck.phase === "arrive") {
        truck.clock += dt;
        if (truck.clock >= ARRIVAL_TIME[truck.bay]) {
          truck.phase = "dock";
          dirty = true;
          events.sound("interact");
          events.toast({ ok: true, judul: `Truk ${truck.order.pelanggan} di Bay ${truck.bay + 1}`, teks: `Sales Order: ${productList(truck.order.palet)} (${truck.order.jumlah} ton). Data pesanan sudah terlihat di gudang tanpa input ulang.`, konsep: "Sales order terintegrasi" });
        }
      } else if (truck.phase === "dock") {
        truck.patience -= dt;
        if (truck.patience <= 0) {
          truck.phase = "leave";
          truck.clock = 0;
          s.failed.push(truck.order.id);
          s.satisfaction = Math.max(0, s.satisfaction - 12);
          s.combo = 0;
          dirty = true;
          events.sound("error");
          events.toast({ ok: false, judul: `${truck.order.pelanggan} pergi kecewa`, teks: "Pesanan terlambat dimuat. Pantau stok & antrean truk di dasbor ERP.", konsep: "Kepuasan pelanggan" });
        }
      } else {
        truck.clock += dt;
        if (truck.clock >= DEPARTURE_TIME[truck.bay]) {
          s.trucks = s.trucks.filter((t) => t !== truck);
          dirty = true;
        }
      }
    }

    // Produksi.
    if (s.production) {
      s.production.t += dt;
      if (s.production.t >= PRODUCTION_TIME) {
        const id = s.production.product;
        s.stock[id] = Math.min(RACK_CAPACITY, s.stock[id] + PRODUCTION_BATCH);
        s.production = null;
        dirty = true;
        events.sound("success");
        events.toast({ ok: true, judul: `+${PRODUCTION_BATCH} palet ${OPS_PRODUCTS[id].singkat} masuk gudang`, teks: "Conveyor mengantar hasil produksi; stok rak ter-update otomatis.", konsep: "Real-time inventory" });
      }
    }

    if (s.susulan && s.time >= s.susulan.at) {
      removeStock(s, s.susulan.pallets);
      s.susulan = null;
      dirty = true;
      events.sound("error");
      events.banner("STOK SELISIH!", "bad");
      events.toast({ ok: false, judul: "Selisih stok membesar!", teks: "Selisih yang diabaikan ternyata membuat stok fisik kurang 2 palet.", konsep: "Stock opname" });
    }

    // Alarm kejadian ERP.
    if (s.alarm === null && s.eventIdx < ERP_EVENTS.length && s.time >= OPS_EVENT_TIMES[s.eventIdx]) {
      s.alarm = s.eventIdx;
      s.alarmDeadline = s.time + ALARM_WINDOW;
      dirty = true;
      events.sound("boom");
      events.banner("ALARM ERP!", "bad");
      events.toast({ ok: false, judul: `Kejadian: ${ERP_EVENTS[s.alarm].judul}`, teks: "Lari ke Terminal ERP di depan Pusat Kendali untuk memutuskan!", konsep: ERP_EVENTS[s.alarm].konsep });
    }
    if (s.alarm !== null && s.time > s.alarmDeadline) {
      const event = ERP_EVENTS[s.alarm];
      s.answers[event.id] = -1;
      s.satisfaction = Math.max(0, s.satisfaction - 10);
      s.alarm = null;
      s.eventIdx++;
      dirty = true;
      events.sound("error");
      events.toast({ ok: false, judul: "Alarm tidak ditangani", teks: `"${event.judul}" dibiarkan, masalah merembet ke pelanggan.`, konsep: event.konsep });
    }

    // Forklift & tabrakan.
    s.forklifts = s.forklifts.map((d) => (d + FORKLIFT_SPEED * dt) % FORKLIFT_PERIMETER);
    s.forklifts.forEach((d) => {
      const pose = forkliftPose(d);
      const dx = p.position.x - pose.x;
      const dz = p.position.z - pose.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 1.7 || s.stun > 0) return;
      s.stun = 1.1;
      s.combo = 0;
      const nx = dx / (dist || 1);
      const nz = dz / (dist || 1);
      const tx = p.position.x + nx * 1.6;
      const tz = p.position.z + nz * 1.6;
      if (!opsBlocked(tx, tz)) p.position.set(tx, 0, tz);
      s.carry.forEach((product, i) => {
        const a = Math.atan2(nx, nz) + (i - 0.5) * 1.4 + Math.PI;
        const fx = THREE.MathUtils.clamp(p.position.x + Math.sin(a) * 1.5, -15, 13);
        const fz = THREE.MathUtils.clamp(p.position.z + Math.cos(a) * 1.5, -12.5, 14.5);
        s.floor.push({ uid: s.uid++, x: fx, z: fz, product });
      });
      const dropped = s.carry.length;
      s.carry = [];
      dirty = true;
      events.sound("boom");
      events.toast({ ok: false, judul: "Tertabrak forklift!", teks: dropped ? "Paletmu jatuh, pungut lagi. Selalu lihat kiri-kanan di jalur kuning." : "Selalu lihat kiri-kanan saat melintasi jalur kuning.", konsep: "K3 gudang" });
    });

    // Kopi = lari cepat sementara.
    if (!s.coffee && s.time >= s.nextCoffee) {
      const spots = COFFEE_SPOTS.filter(([x, z]) => Math.hypot(x - p.position.x, z - p.position.z) > 6);
      const [x, z] = spots[Math.floor(Math.random() * spots.length)] ?? COFFEE_SPOTS[0];
      s.coffee = { uid: s.uid++, x, z };
      dirty = true;
    }
    if (s.coffee && Math.hypot(s.coffee.x - p.position.x, s.coffee.z - p.position.z) < 1.1) {
      s.coffee = null;
      s.sprint = 9;
      s.nextCoffee = s.time + 24;
      dirty = true;
      events.sound("pickup");
      events.toast({ ok: true, judul: "Kopi! Lari lebih cepat 9 detik", teks: "Energi penuh, antar palet lebih cepat." });
    }

    // Interaksi stasiun.
    const station = s.stun > 0 ? null : nearestStation(s, p.position.x, p.position.z);
    if (pressed && station) {
      interact(s, station, events);
      dirty = true;
    }
    const text = promptFor(s, station);
    if (text !== lastPrompt.current) {
      lastPrompt.current = text;
      events.prompt(text);
    }

    const d = dashRef.current;
    d.stock = s.stock;
    d.done = s.completed.length;
    d.sat = Math.round(s.satisfaction);
    d.alarm = s.alarm !== null;

    const allDone = s.completed.length + s.failed.length >= OPS_ORDERS.length && s.eventIdx >= ERP_EVENTS.length && s.alarm === null;
    if (s.time >= OPS_TIME || allDone) {
      s.ended = true;
      events.end();
      pushView(snapshot(s), true);
      return;
    }
    pushView(snapshot(s), dirty);
  });

  const speed = () => {
    const s = simRef.current;
    if (s.stun > 0) return 0;
    let v = input.current.held.shift && s.carry.length < MAX_CARRY ? 7.4 : 5.2;
    v *= [1, 0.9, 0.76][s.carry.length] ?? 0.76;
    if (s.sprint > 0) v *= 1.3;
    const pos = player.current?.position;
    if (pos && SPILLS.some(([x, z, r]) => Math.hypot(pos.x - x, pos.z - z) < r)) v *= 0.55;
    return v;
  };

  const bayStatusKey = BAY_Z.map((_, bay) => {
    const truck = view.trucks.find((t) => t.bay === bay && t.phase !== "leave");
    return truck ? (truck.phase === "dock" ? "loading" : "arriving") : "empty";
  }).join(",");
  const bayStatus = useMemo(() => bayStatusKey.split(",") as ("empty" | "arriving" | "loading")[], [bayStatusKey]);
  const producing = view.production?.product ?? null;
  const kilnRunning = Boolean(producing);

  return (
    <>
      <OpsScenery quality={quality} focus={player} dashRef={dashRef} bayStatus={bayStatus} kilnRunning={kilnRunning} />
      {RACKS.map((rack) => (
        <group key={rack.product} position={[RACK_X, 0, rack.z]}>
          <WarehouseRack product={rack.product} count={view.stock[rack.product]} glow={view.trucks.some((t) => t.phase === "dock" && t.needed.includes(rack.product))} />
        </group>
      ))}
      <Conveyor path={CONVEYOR_PATH} running={kilnRunning} product={producing} />
      {CONSOLES.map((c) => (
        <group key={c.product} position={[c.x, 0, c.z]}>
          <ProductionConsole product={c.product} active={producing === c.product} busy={Boolean(producing) && producing !== c.product} />
          {producing === c.product && view.production && (
            <Label position={[0, 2.6, 0]} className="is-gold" distanceFactor={12}>
              Produksi {Math.round(view.production.progress * 100)}%
            </Label>
          )}
        </group>
      ))}
      <group position={[TERMINAL.x, 0, TERMINAL.z]}>
        <ErpTerminal alarm={view.alarm !== null} />
        {view.alarm !== null && (
          <Label position={[0, 4.4, 0]} className="is-red" distanceFactor={12}>
            ALARM · {Math.ceil(view.alarmLeft)}s
          </Label>
        )}
      </group>
      {SPILLS.map(([x, z, r], k) => (
        <group key={k} position={[x, 0, z]}>
          <SpillDecal radius={r} />
        </group>
      ))}
      {view.floor.map((f) => (
        <group key={f.uid} position={[f.x, 0, f.z]} rotation={[0, f.uid, 0.08]}>
          <PalletModel product={f.product} />
        </group>
      ))}
      {view.coffee && (
        <group key={view.coffee.uid} position={[view.coffee.x, 0, view.coffee.z]}>
          <CoffeeCup />
        </group>
      )}
      {view.trucks.map((t) => (
        <TruckNode key={t.uid} simRef={simRef} uid={t.uid} view={t} />
      ))}
      <Forklifts simRef={simRef} />
      <Walker
        avatar={avatar}
        input={input}
        playerRef={player}
        start={PLAYER_START}
        frozen={!running}
        blocked={opsBlocked}
        cameraOffset={[0, 8.6, 12.5]}
        speed={speed}
      />
      <PlayerExtras playerRef={player} carry={view.carry} stunned={view.stunned} sprint={view.sprint > 0} />
      <GuideArrow target={view.guide} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Level                                                               */
/* ------------------------------------------------------------------ */

function ProductDot({ id }: { id: OpsProductId }) {
  return <i className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm ring-1 ring-white/40" style={{ background: OPS_PRODUCTS[id].color }} />;
}

export function OpsLevel({ levelIndex, info, paused, quality, avatar, input, sound, onPause, onFinish }: WorldLevelProps) {
  const simRef = useRef<Sim>(null as unknown as Sim);
  if (simRef.current === null) simRef.current = createSim();
  const [phase, setPhase] = useState<"intro" | "play" | "event" | "done">("intro");
  const [view, setView] = useState<View>(() => snapshot(createSim()));
  const pushView = useThrottled(setView, 8);
  const [toast, setToast] = useState<Feedback>(null);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ text: string; tone?: "gold" | "bad"; key: number } | null>(null);
  const [pick, setPick] = useState<number | null>(null);
  const [result, setResult] = useState<{ correct: number; pallets: number; bestCombo: number } | null>(null);
  const bannerTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(bannerTimer.current), []);

  const events: SceneEvents = {
    sound,
    toast: setToast,
    prompt: setPrompt,
    banner: (text, tone) => {
      setBanner({ text, tone, key: performance.now() });
      window.clearTimeout(bannerTimer.current);
      bannerTimer.current = window.setTimeout(() => setBanner(null), 1300);
    },
    openEvent: () => {
      setPick(null);
      setPhase("event");
    },
    end: () => {
      const s = simRef.current;
      const correct = ERP_EVENTS.filter((e) => s.answers[e.id] !== undefined && s.answers[e.id] >= 0 && e.opsi[s.answers[e.id]].benar).length;
      const pallets = s.completed.reduce((sum, id) => sum + (OPS_ORDERS.find((o) => o.id === id)?.palet.length ?? 0), 0);
      setResult({ correct, pallets, bestCombo: s.bestCombo });
      sound("success");
      setPhase("done");
    },
  };

  const event = view.alarm !== null ? ERP_EVENTS[view.alarm] : null;

  const answer = (index: number) => {
    if (pick !== null || !event) return;
    setPick(index);
    const option = event.opsi[index];
    sound(option.benar ? "success" : "error");
  };

  const resume = () => {
    const s = simRef.current;
    if (event && pick !== null) {
      const option = event.opsi[pick];
      s.answers[event.id] = pick;
      if (option.stok && option.stok < 0) removeStock(s, Math.max(1, Math.round(-option.stok / 20)));
      if (option.stokSusulan) s.susulan = { at: s.time + 12, pallets: 2 };
      if (option.kepuasan) s.satisfaction = Math.max(0, Math.min(100, s.satisfaction + option.kepuasan));
      if (option.benar) s.satisfaction = Math.min(100, s.satisfaction + 4);
      s.alarm = null;
      s.eventIdx++;
      pushView(snapshot(s), true);
      setToast({ ok: option.benar, judul: option.benar ? "Keputusan tepat!" : "Kurang tepat", teks: option.hasil, konsep: event.konsep });
    }
    setPick(null);
    setPhase("play");
  };

  const score = result
    ? clampPercent((result.pallets / TOTAL_PALLETS) * 50 + (result.correct / ERP_EVENTS.length) * 30 + view.satisfaction * 0.2)
    : 0;
  const timeLeft = Math.max(0, Math.ceil(OPS_TIME - view.time));
  const orders = view.trucks.filter((t) => t.phase !== "leave").sort((a, b) => a.bay - b.bay);

  return (
    <WorldStage
      quality={quality}
      paused={paused || phase === "done"}
      camera={{ position: [0, 12, 20], fov: 55, near: 0.3, far: 900 }}
      overlay={
        <>
          <WorldHud
            levelIndex={levelIndex}
            info={info}
            onPause={onPause}
            toast={phase === "play" ? toast : null}
            prompt={phase === "play" && prompt ? <><kbd>E</kbd>{prompt}</> : undefined}
            stats={
              <>
                <HudChip tone={timeLeft <= 20 ? "red" : "dark"}><IconTimer />{timeLeft}s</HudChip>
                <HudChip tone="gold"><IconPackage />{view.completed}/{OPS_ORDERS.length}</HudChip>
                <HudChip tone={view.satisfaction < 60 ? "red" : "green"}><IconSmile />{view.satisfaction}%</HudChip>
                <HudChip tone="dark">
                  <IconWarehouse />
                  {OPS_PRODUCT_IDS.map((id) => (
                    <span key={id} className={cn("inline-flex items-center gap-1", view.stock[id] === 0 && "text-red-300")}>
                      <ProductDot id={id} />
                      {view.stock[id]}
                    </span>
                  ))}
                </HudChip>
                {view.production && <HudChip tone="gold"><IconFactory />{OPS_PRODUCTS[view.production.product].singkat} {Math.round(view.production.progress * 100)}%</HudChip>}
                {view.alarm !== null && <HudChip tone="red" pulse><IconAlarm />Alarm {Math.ceil(view.alarmLeft)}s</HudChip>}
                {view.sprint > 0 && <HudChip tone="green"><IconCoffee />{Math.ceil(view.sprint)}s</HudChip>}
                {view.combo >= 2 && <HudChip tone="gold"><IconBolt />x{view.combo}</HudChip>}
              </>
            }
          />
          <div className="world-side">
            <h4>SALES ORDER · ERP</h4>
            {orders.length === 0 && <p className="text-white/60">{view.queue ? "Truk sedang menuju…" : "Belum ada truk."}</p>}
            {orders.map((t) => (
              <div key={t.uid} className="mb-1.5 rounded-lg bg-white/10 px-2 py-1.5">
                <p className="flex items-center justify-between gap-1 font-bold">
                  <span className="truncate">{t.pelanggan}</span>
                  <span className="shrink-0 text-[0.6rem] text-white/60">BAY {t.bay + 1}</span>
                </p>
                <p className="mt-1 flex items-center gap-1">
                  {t.loaded.map((p, k) => <span key={`l${k}`} className="opacity-40"><ProductDot id={p} /></span>)}
                  {t.needed.map((p, k) => <ProductDot key={`n${k}`} id={p} />)}
                  <span className="ml-auto text-[0.6rem] text-white/60">{t.phase === "dock" ? productList(t.needed) : "menuju dermaga"}</span>
                </p>
                {t.phase === "dock" && (
                  <span className="mt-1 block h-1 overflow-hidden rounded-full bg-white/15">
                    <i className="block h-full" style={{ width: `${t.patience * 100}%`, background: t.patience < 0.3 ? "#e54b4b" : "#2fae66" }} />
                  </span>
                )}
              </div>
            ))}
            {view.queue > 0 && orders.length > 0 && <p className="text-[0.62rem] text-white/60">+{view.queue} truk antre di jalan</p>}
            {view.carry.length > 0 && (
              <p className="mt-2 flex items-center gap-1 border-t border-white/15 pt-1.5 font-bold">
                Dibawa: {view.carry.map((p, k) => <ProductDot key={k} id={p} />)}
              </p>
            )}
          </div>
          {banner && (
            <div key={banner.key} className={cn("world-objection", banner.tone === "bad" && "is-bad", banner.tone === "gold" && "is-gold")}>
              {banner.text}
            </div>
          )}
          <TouchControls
            inputRef={input}
            mode="stick"
            buttons={[
              { holdKey: "shift", label: "Lari", tone: "light" },
              { press: "interact", label: "Aksi" },
            ]}
          />
          {phase === "intro" && (
            <div className="world-overlay-card mission-pop">
              <p className="flex items-center gap-2 text-xs font-black tracking-[0.15em] text-muted-foreground">CARA MAIN</p>
              <p className="mt-1 text-lg font-black">Jaga gudang tetap mengalir!</p>
              <div className="mt-3 grid gap-2 text-sm">
                <p className="flex items-start gap-2 rounded-2xl bg-card p-2.5 ring-1 ring-border">
                  <b className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-navy text-[0.7rem] text-white">1</b>
                  <span>Truk pelanggan mundur ke <b>dermaga timur</b>. Lihat pesanannya di panel <b>Sales Order</b>.</span>
                </p>
                <p className="flex items-start gap-2 rounded-2xl bg-card p-2.5 ring-1 ring-border">
                  <b className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-navy text-[0.7rem] text-white">2</b>
                  <span>
                    Ambil palet di <b>rak barat</b> (<ProductDot id="pcc" /> PCC · <ProductDot id="opc" /> OPC · <ProductDot id="putih" /> Putih), maks 2 sekali angkut, lalu tekan <b>E</b> di truk.
                  </span>
                </p>
                <p className="flex items-start gap-2 rounded-2xl bg-card p-2.5 ring-1 ring-border">
                  <b className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-navy text-[0.7rem] text-white">3</b>
                  <span>Stok menipis? Jalankan <b>produksi</b> di konsol utara. Alarm berbunyi? Lari ke <b>Terminal ERP</b>.</span>
                </p>
              </div>
              <p className="mt-3 text-xs font-bold leading-relaxed text-muted-foreground">
                Awas forklift di jalur kuning & tumpahan semen yang licin. Ambil kopi untuk lari lebih cepat. Ikuti panah emas kalau bingung!
              </p>
              <Button
                className="mt-3 w-full"
                onClick={() => {
                  sound("interact");
                  setPhase("play");
                }}
              >
                Mulai shift
              </Button>
            </div>
          )}
          {phase === "event" && event && (
            <div className="world-overlay-card mission-pop">
              <p className="flex items-center gap-2 text-xs font-black tracking-[0.15em] text-track-audit"><IconAlarm className="h-4 w-4" /> ALARM ERP · {event.konsep.toUpperCase()}</p>
              <p className="mt-1 text-lg font-black">{event.judul}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{event.deskripsi}</p>
              <div className="mt-3 grid gap-1.5">
                {event.opsi.map((option, index) => (
                  <button
                    key={option.label}
                    disabled={pick !== null}
                    onClick={() => answer(index)}
                    className={cn(
                      "flex items-center gap-2 rounded-2xl border-2 px-3 py-2 text-left text-sm font-semibold transition-colors",
                      pick === null && "border-border hover:border-brand-navy",
                      pick !== null && option.benar && "border-emerald-500 bg-emerald-50",
                      pick === index && !option.benar && "border-track-audit bg-track-audit-soft"
                    )}
                  >
                    {pick !== null && option.benar ? <IconCheck className="h-4 w-4 shrink-0 text-emerald-600" /> : pick === index ? <IconX className="h-4 w-4 shrink-0 text-track-audit" /> : null}
                    {option.label}
                  </button>
                ))}
              </div>
              {pick !== null && (
                <>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{event.opsi[pick].hasil}</p>
                  <Button className="mt-3 w-full" onClick={resume} autoFocus>
                    Kembali ke gudang
                  </Button>
                </>
              )}
            </div>
          )}
          {phase === "done" && result && (
            <LevelEnd
              score={score}
              reason={view.completed + view.failed >= OPS_ORDERS.length ? "Semua truk sudah dilayani" : "Shift selesai"}
              detail={`${view.completed}/${OPS_ORDERS.length} pesanan · ${result.pallets}/${TOTAL_PALLETS} palet · ${result.correct}/${ERP_EVENTS.length} keputusan tepat · kepuasan ${view.satisfaction}% · combo terbaik x${result.bestCombo}`}
              onNext={() => onFinish(score)}
            />
          )}
        </>
      }
    >
      <OpsScene simRef={simRef} view={view} avatar={avatar} input={input} running={!paused && phase === "play"} quality={quality} events={events} pushView={pushView} />
    </WorldStage>
  );
}
