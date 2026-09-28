"use client";

import { memo, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { GameQuality } from "@/lib/types";
import { Technician } from "../audit/data-center";
import { clampDelta } from "../world-kit";
import { seeded } from "./race-track";
import { canvasTexture, fitText, InstancedSet } from "./race-scenery";
import { CementTruck, TrafficCar, type TrafficKind, type TruckLivery } from "./truck-models";
import { Forklift, Kiln, PreheaterTower, Silo } from "./ops-models";
import { Smoke } from "./ops-scenery";
import {
  along,
  CITY,
  deckAt,
  LAND_Y,
  measure,
  OFFICES,
  RAIL,
  RIVER,
  roadDistance,
  ROAD_HALF,
  ROADS,
  SITE,
  TOWERS,
  VILLAGE,
  WATER_Y,
  type Measured,
  type XZ,
} from "./drone-layout";

/* ------------------------------------------------------------------ */
/* Kawasan buatan manusia: kota, pabrik, gudang, pelabuhan, proyek,    */
/* perumahan, kampung — plus kendaraan, kereta, dan kapal yang hidup.  */
/* ------------------------------------------------------------------ */

type Inst = { p: [number, number, number]; r?: [number, number, number]; s?: number | [number, number, number]; c?: string };
const pick = <T,>(list: T[], r: number) => list[Math.floor(r * list.length) % list.length];

/** Gabungkan banyak kotak jadi satu geometri berwarna; UV dinding diskalakan ke ukuran dunia (jendela tidak melar). */
function boxBatch(boxes: { x: number; y: number; z: number; w: number; h: number; d: number; ry?: number; color: string }[], unitU = 6, unitV = 4) {
  const parts = boxes.map((b) => {
    const g = new THREE.BoxGeometry(b.w, b.h, b.d);
    const uv = g.attributes.uv as THREE.BufferAttribute;
    // Urutan sisi BoxGeometry: +x, -x, +y, -y, +z, -z (4 verteks tiap sisi).
    for (let face = 0; face < 6; face++) {
      for (let k = 0; k < 4; k++) {
        const i = face * 4 + k;
        if (face === 2 || face === 3) uv.setXY(i, 0.01, 0.99);
        else uv.setXY(i, uv.getX(i) * ((face < 2 ? b.d : b.w) / unitU), uv.getY(i) * (b.h / unitV));
      }
    }
    if (b.ry) g.rotateY(b.ry);
    g.translate(b.x, b.y, b.z);
    const c = new THREE.Color(b.color);
    const colors = new Float32Array(g.attributes.position.count * 3);
    for (let i = 0; i < colors.length; i += 3) {
      colors[i] = c.r;
      colors[i + 1] = c.g;
      colors[i + 2] = c.b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  });
  return parts.length ? mergeGeometries(parts)! : new THREE.BufferGeometry();
}

function windowTexture(seed: number, wall = "#ffffff", glass = "#34506b", lit = "#ffe7a8") {
  const t = canvasTexture(128, 128, (g) => {
    g.fillStyle = wall;
    g.fillRect(0, 0, 128, 128);
    const rand = seeded(seed);
    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < 2; x++) {
        g.fillStyle = rand() > 0.85 ? lit : glass;
        g.fillRect(x * 64 + 10, y * 64 + 14, 44, 38);
      }
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/* ------------------------------ kota ------------------------------ */

function billboardTexture(title: string, sub: string, bg: string) {
  return canvasTexture(512, 256, (g) => {
    const grad = g.createLinearGradient(0, 0, 512, 256);
    grad.addColorStop(0, bg);
    grad.addColorStop(1, "#10131a");
    g.fillStyle = grad;
    g.fillRect(0, 0, 512, 256);
    g.fillStyle = "#ffc857";
    g.fillRect(0, 220, 512, 36);
    g.fillStyle = "#ffffff";
    fitText(g, title, 470, 72);
    g.textBaseline = "middle";
    g.fillText(title, 24, 90);
    g.fillStyle = "rgba(255,255,255,.8)";
    fitText(g, sub, 470, 34, 700);
    g.fillText(sub, 24, 160);
  });
}

const City = memo(function City() {
  const geometry = useMemo(
    () =>
      boxBatch([
        ...TOWERS.map((t) => ({ x: t.x, y: LAND_Y + t.h / 2, z: t.z, w: t.w, h: t.h, d: t.d, color: t.color })),
        ...OFFICES.map((o) => ({ x: o.x, y: LAND_Y + o.h / 2, z: o.z, w: o.w, h: o.h, d: o.d, color: o.site === "penjualan" ? "#a9d4ff" : "#b9f0cf" })),
      ]),
    []
  );
  const texture = useMemo(() => windowTexture(3), []);
  const roofs = useMemo(() => {
    const rand = seeded(9);
    const caps: Inst[] = [];
    const units: Inst[] = [];
    const pads: Inst[] = [];
    const antennas: Inst[] = [];
    [...TOWERS.map((t) => ({ ...t })), ...OFFICES.map((o) => ({ ...o, roof: "#4b5563" }))].forEach((t) => {
      const top = LAND_Y + t.h;
      caps.push({ p: [t.x, top + 0.3, t.z], s: [t.w + 0.5, 0.6, t.d + 0.5], c: t.roof });
      if (t.h > 50 && rand() > 0.4) pads.push({ p: [t.x, top + 0.7, t.z], s: [Math.min(t.w, t.d) * 0.4, 0.2, Math.min(t.w, t.d) * 0.4] });
      else
        for (let k = 0; k < 2 + Math.floor(rand() * 3); k++)
          units.push({ p: [t.x + (rand() - 0.5) * t.w * 0.6, top + 1.1, t.z + (rand() - 0.5) * t.d * 0.6], s: [1.5 + rand() * 2, 1.2 + rand(), 1.5 + rand() * 2], c: rand() > 0.5 ? "#b9bec6" : "#8c939c" });
      if (rand() > 0.6) antennas.push({ p: [t.x + t.w * 0.3, top + 4, t.z - t.d * 0.3], s: [0.2, 8, 0.2] });
    });
    return { caps, units, pads, antennas };
  }, []);
  const plaza = useMemo(() => {
    const rand = seeded(17);
    const trees: Inst[] = [];
    const lamps: Inst[] = [];
    for (let k = 0; k < 90; k++) {
      const a = rand() * Math.PI * 2;
      const r = rand() * CITY.r;
      const x = CITY.x + Math.cos(a) * r;
      const z = CITY.z + Math.sin(a) * r;
      if (TOWERS.some((t) => Math.abs(x - t.x) < t.w / 2 + 2 && Math.abs(z - t.z) < t.d / 2 + 2)) continue;
      if (OFFICES.some((o) => Math.abs(x - o.x) < o.w / 2 + 2 && Math.abs(z - o.z) < o.d / 2 + 2)) continue;
      const rd = roadDistance(x, z);
      if (rd < ROAD_HALF + 1.5) continue;
      if (Object.values(SITE).some((s) => Math.hypot(x - s.x, z - s.z) < 10)) continue;
      if (rd < ROAD_HALF + 4) lamps.push({ p: [x, LAND_Y + 3, z], s: [0.15, 6, 0.15] });
      else trees.push({ p: [x, LAND_Y + 3, z], s: 1.2 + rand() * 0.6, c: rand() > 0.5 ? "#4f8a3a" : "#5d9a3f" });
    }
    return { trees, lamps };
  }, []);
  const boards = useMemo(
    () => [
      { x: CITY.x - 70, z: CITY.z + 42, ry: 0.9, tex: billboardTexture("SATU DATA, SATU PERUSAHAAN", "Integrasi ERP menghapus data silo", "#1f3b63") },
      { x: CITY.x + 20, z: CITY.z + 78, ry: -0.2, tex: billboardTexture("STOK REAL-TIME", "Gudang, produksi & penjualan melihat angka yang sama", "#8e2b1f") },
      { x: CITY.x + 84, z: CITY.z - 10, ry: -1.4, tex: billboardTexture("FAKTUR OTOMATIS", "Dari pengiriman langsung ke tagihan", "#1f6b44") },
    ],
    []
  );
  const officeSigns = useMemo(
    () =>
      OFFICES.map((o) => ({
        ...o,
        tex: billboardTexture(SITE[o.site].nama.toUpperCase(), SITE[o.site].divisi, o.site === "penjualan" ? "#1f5a99" : "#1f6b44"),
      })),
    []
  );
  const geo = useMemo(
    () => ({
      box: new THREE.BoxGeometry(1, 1, 1),
      pad: new THREE.CylinderGeometry(1, 1, 1, 20),
      crown: new THREE.IcosahedronGeometry(1.3, 0),
    }),
    []
  );
  return (
    <group>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial map={texture} vertexColors roughness={0.35} metalness={0.25} emissive="#ffffff" emissiveMap={texture} emissiveIntensity={0.08} />
      </mesh>
      <InstancedSet items={roofs.caps} geometry={geo.box} />
      <InstancedSet items={roofs.units} geometry={geo.box} />
      <InstancedSet items={roofs.pads} geometry={geo.pad} color="#2b2f36" />
      <InstancedSet items={roofs.antennas} geometry={geo.box} color="#d7dbe0" shadow={false} />
      <InstancedSet items={plaza.trees} geometry={geo.crown} />
      <InstancedSet items={plaza.lamps} geometry={geo.box} color="#5c6470" shadow={false} />
      {boards.map((b, k) => (
        <group key={k} position={[b.x, LAND_Y, b.z]} rotation={[0, b.ry, 0]}>
          {[-3.5, 3.5].map((x) => (
            <mesh key={x} position={[x, 5, 0]} castShadow>
              <boxGeometry args={[0.4, 10, 0.4]} />
              <meshStandardMaterial color="#5c6470" />
            </mesh>
          ))}
          <mesh position={[0, 11, 0]} castShadow>
            <boxGeometry args={[12.4, 6.4, 0.3]} />
            <meshStandardMaterial color="#2b2f36" />
          </mesh>
          {[0.16, -0.16].map((z) => (
            <mesh key={z} position={[0, 11, z]} rotation={[0, z > 0 ? 0 : Math.PI, 0]}>
              <planeGeometry args={[12, 6]} />
              <meshStandardMaterial map={b.tex} emissive="#ffffff" emissiveMap={b.tex} emissiveIntensity={0.45} />
            </mesh>
          ))}
        </group>
      ))}
      {officeSigns.map((o) => (
        <mesh key={o.site} position={[o.x, LAND_Y + o.h * 0.72, o.z + o.d / 2 + 0.06]}>
          <planeGeometry args={[o.w * 0.9, o.w * 0.45]} />
          <meshStandardMaterial map={o.tex} emissive="#ffffff" emissiveMap={o.tex} emissiveIntensity={0.5} />
        </mesh>
      ))}
    </group>
  );
});

/* ------------------------------ HQ plaza ------------------------------ */

const CAR_COLORS = ["#e54b4b", "#f4f1ea", "#2b2f36", "#3f8fd8", "#9aa0a8", "#f2c14e", "#2fae66"];

const HqPlaza = memo(function HqPlaza() {
  const cars = useMemo(() => {
    const rand = seeded(23);
    const bodies: Inst[] = [];
    const cabins: Inst[] = [];
    for (let row = 0; row < 2; row++) {
      for (let k = 0; k < 9; k++) {
        if (rand() < 0.25) continue;
        const x = -44 + k * 3.2;
        const z = 18 + row * 8;
        const c = pick(CAR_COLORS, rand());
        bodies.push({ p: [x, LAND_Y + 0.6, z], s: [1.8, 0.7, 4], c });
        cabins.push({ p: [x, LAND_Y + 1.2, z - 0.2], s: [1.6, 0.55, 2.2], c: "#1d2e3a" });
      }
    }
    return { bodies, cabins };
  }, []);
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const flag = useRef<(THREE.Mesh | null)[]>([]);
  const clock = useRef(0);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    flag.current.forEach((m, k) => m && (m.rotation.y = Math.sin(clock.current * 2.2 + k) * 0.25));
  });
  return (
    <group>
      <mesh position={[-30, LAND_Y + 0.04, 22]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[34, 18]} />
        <meshStandardMaterial color="#4b4f57" polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
      <InstancedSet items={cars.bodies} geometry={box} />
      <InstancedSet items={cars.cabins} geometry={box} />
      {["#ffc857", "#e54b4b", "#3fa7ff", "#2fae66"].map((color, k) => (
        <group key={k} position={[14 + k * 4, LAND_Y, -16]}>
          <mesh position={[0, 5, 0]}>
            <cylinderGeometry args={[0.1, 0.12, 10, 6]} />
            <meshStandardMaterial color="#d7dbe0" metalness={0.6} />
          </mesh>
          <mesh ref={(node) => { flag.current[k] = node; }} position={[0.9, 9, 0]}>
            <boxGeometry args={[1.8, 1.1, 0.04]} />
            <meshStandardMaterial color={color} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
      <Technician avatar="nara" path={[[-8, 14], [10, 14], [10, 22]]} delay={0.5} />
      <Technician avatar="arga" path={[[-6, -30], [6, -30]]} delay={1.8} />
    </group>
  );
});

/* ------------------------------ pabrik ------------------------------ */

const Plant = memo(function Plant() {
  const { x, z } = SITE.pabrik;
  const smoke = useMemo<[number, number, number][]>(() => [[x - 30, LAND_Y + 30, z - 26], [x - 2, LAND_Y + 22, z - 44]], [x, z]);
  const piles = useMemo<Inst[]>(
    () => [
      { p: [x - 50, LAND_Y, z + 4], s: [9, 7, 9], c: "#d9d3c4" },
      { p: [x - 44, LAND_Y, z + 22], s: [7, 5, 7], c: "#b9a98c" },
      { p: [x - 60, LAND_Y, z - 10], s: [6, 4, 6], c: "#8b7a64" },
    ],
    [x, z]
  );
  const cone = useMemo(() => {
    const g = new THREE.ConeGeometry(1, 1, 12);
    g.translate(0, 0.5, 0);
    return g;
  }, []);
  return (
    <group>
      <mesh position={[x - 12, LAND_Y + 0.04, z - 20]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 50]} />
        <meshStandardMaterial color="#b7b09f" polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
      <group position={[x - 30, LAND_Y, z - 26]}>
        <PreheaterTower />
      </group>
      <group position={[x - 12, LAND_Y + 3, z - 26]} rotation={[0, 0, 0]}>
        <Kiln running />
      </group>
      {[0, 1, 2].map((k) => (
        <group key={k} position={[x + 14 + k * 8, LAND_Y, z - 30]}>
          <Silo label={k === 1 ? "OPC" : undefined} />
        </group>
      ))}
      <mesh position={[x - 2, LAND_Y + 11, z - 44]} castShadow>
        <cylinderGeometry args={[1.2, 1.8, 22, 12]} />
        <meshStandardMaterial color="#d8d3c8" />
      </mesh>
      {[4, 8].map((y) => (
        <mesh key={y} position={[x - 2, LAND_Y + 22 - y, z - 44]}>
          <cylinderGeometry args={[1.3, 1.3, 0.8, 12]} />
          <meshStandardMaterial color="#d94f3d" />
        </mesh>
      ))}
      {/* Konveyor dari timbunan ke menara */}
      <mesh position={[x - 40, LAND_Y + 6, z - 12]} rotation={[0, 0.9, 0.35]} castShadow>
        <boxGeometry args={[30, 1, 1.6]} />
        <meshStandardMaterial color="#5c6470" />
      </mesh>
      <InstancedSet items={piles} geometry={cone} />
      <Smoke sources={smoke} count={28} />
      <Technician avatar="arga" path={[[x - 20, z - 8], [x + 10, z - 8]]} delay={0.4} />
    </group>
  );
});

/* ------------------------------ gudang ------------------------------ */

const Warehouse = memo(function Warehouse() {
  const { x, z } = SITE.gudang;
  const cx = x - 4;
  const cz = z + 24;
  const pallets = useMemo(() => {
    const rand = seeded(61);
    const list: Inst[] = [];
    for (let k = 0; k < 18; k++) list.push({ p: [cx - 18 + (k % 9) * 4.2, LAND_Y + 0.55, cz - 15 - Math.floor(k / 9) * 2.4], s: [1.3, 1.1, 1.2], c: pick(["#e0513f", "#3f7fd8", "#f4f1ea"], rand()) });
    return list;
  }, [cx, cz]);
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const fork = useRef<THREE.Group>(null);
  const clock = useRef(0);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    const g = fork.current;
    if (!g) return;
    const t = (Math.sin(clock.current * 0.35) + 1) / 2;
    g.position.set(cx - 16 + t * 30, LAND_Y, cz - 19.5);
    g.rotation.y = Math.cos(clock.current * 0.35) > 0 ? Math.PI / 2 : -Math.PI / 2;
  });
  return (
    <group>
      <mesh position={[cx, LAND_Y + 0.04, cz - 8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[56, 40]} />
        <meshStandardMaterial color="#9c9788" polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
      <mesh position={[cx, LAND_Y + 5, cz]} castShadow receiveShadow>
        <boxGeometry args={[44, 10, 22]} />
        <meshStandardMaterial color="#d8dde3" />
      </mesh>
      <mesh position={[cx, LAND_Y + 10, cz]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[11, 11, 44, 24, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#f2a93b" roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      {[-15, -5, 5, 15].map((dx) => (
        <mesh key={dx} position={[cx + dx, LAND_Y + 3, cz - 11.05]}>
          <planeGeometry args={[6, 6]} />
          <meshStandardMaterial color="#5c6470" />
        </mesh>
      ))}
      <InstancedSet items={pallets} geometry={box} />
      <group ref={fork}>
        <Forklift product="opc" />
      </group>
      {[-12, 12].map((dx, k) => (
        <group key={dx} position={[cx + dx, LAND_Y, cz - 22]} rotation={[0, Math.PI, 0]}>
          <CementTruck livery={k ? LIVERIES[1] : LIVERIES[2]} />
        </group>
      ))}
    </group>
  );
});

/* ------------------------------ pelabuhan ------------------------------ */

const CONTAINER_COLORS = ["#c0392b", "#2f6fb5", "#2fae66", "#f2a93b", "#8e44ad", "#16a085", "#d35400", "#7f8c8d"];

function GantryCrane({ x, z, phase }: { x: number; z: number; phase: number }) {
  const trolley = useRef<THREE.Group>(null);
  const clock = useRef(phase);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    if (trolley.current) trolley.current.position.z = Math.sin(clock.current * 0.4) * 14 + 4;
  });
  return (
    <group position={[x, LAND_Y, z]}>
      {[-5, 5].flatMap((dx) =>
        [-4, 4].map((dz) => (
          <mesh key={`${dx}:${dz}`} position={[dx, 11, dz]} castShadow>
            <boxGeometry args={[0.7, 22, 0.7]} />
            <meshStandardMaterial color="#f2a93b" />
          </mesh>
        ))
      )}
      <mesh position={[0, 22.5, 6]} castShadow>
        <boxGeometry args={[11, 1.4, 36]} />
        <meshStandardMaterial color="#f2a93b" />
      </mesh>
      <group ref={trolley} position={[0, 21, 0]}>
        <mesh>
          <boxGeometry args={[4, 1.6, 3]} />
          <meshStandardMaterial color="#2b2f36" />
        </mesh>
        <mesh position={[0, -5, 0]}>
          <boxGeometry args={[0.1, 10, 0.1]} />
          <meshBasicMaterial color="#2b2f36" />
        </mesh>
        <mesh position={[0, -10.5, 0]} castShadow>
          <boxGeometry args={[2.5, 2.4, 6]} />
          <meshStandardMaterial color={CONTAINER_COLORS[Math.floor(phase) % CONTAINER_COLORS.length]} />
        </mesh>
      </group>
    </group>
  );
}

function Ship({ path, speed, phase, scale = 1, color = "#1f3b63" }: { path: Measured; speed: number; phase: number; scale?: number; color?: string }) {
  const group = useRef<THREE.Group>(null);
  const d = useRef(phase * path.length);
  const dir = useRef(1);
  const clock = useRef(0);
  const containers = useMemo(() => {
    const rand = seeded(Math.floor(phase * 100) + 3);
    const list: Inst[] = [];
    for (let i = 0; i < 5; i++) for (let j = -1; j <= 1; j++) for (let l = 0; l < 2; l++) if (rand() > 0.2) list.push({ p: [j * 2.6, 3.4 + l * 2.5, -7 + i * 6.2], s: [2.4, 2.4, 6], c: pick(CONTAINER_COLORS, rand()) });
    return list;
  }, [phase]);
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  useFrame((_, raw) => {
    const delta = clampDelta(raw);
    clock.current += delta;
    d.current += speed * delta * dir.current;
    if (d.current > path.length || d.current < 0) {
      dir.current *= -1;
      d.current = THREE.MathUtils.clamp(d.current, 0, path.length);
    }
    const p = along(path, d.current);
    const g = group.current;
    if (!g) return;
    g.position.set(p.x, WATER_Y + Math.sin(clock.current * 0.9 + phase) * 0.15, p.z);
    const target = p.heading + (dir.current < 0 ? Math.PI : 0);
    g.rotation.y += Math.atan2(Math.sin(target - g.rotation.y), Math.cos(target - g.rotation.y)) * Math.min(1, delta * 0.8);
    g.rotation.z = Math.sin(clock.current * 0.7 + phase) * 0.02;
  });
  return (
    <group ref={group} scale={scale}>
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[9, 3, 36]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.2, 18.5]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <boxGeometry args={[6.3, 1.8, 6.3]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 2.35, 0]}>
        <boxGeometry args={[9.1, 0.2, 36.1]} />
        <meshStandardMaterial color="#c0392b" />
      </mesh>
      <mesh position={[0, 5.5, -14]} castShadow>
        <boxGeometry args={[7, 6, 5]} />
        <meshStandardMaterial color="#f4f1ea" />
      </mesh>
      <mesh position={[0, 7, -11.45]}>
        <boxGeometry args={[6, 1, 0.1]} />
        <meshStandardMaterial color="#1d2e3a" />
      </mesh>
      <mesh position={[0, 10, -15]}>
        <cylinderGeometry args={[0.8, 0.9, 3, 10]} />
        <meshStandardMaterial color="#d94f3d" />
      </mesh>
      <InstancedSet items={containers} geometry={box} />
    </group>
  );
}

function Sailboat({ cx, cz, r, speed, phase }: { cx: number; cz: number; r: number; speed: number; phase: number }) {
  const group = useRef<THREE.Group>(null);
  const clock = useRef(phase);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw) * speed;
    const a = clock.current;
    const g = group.current;
    if (!g) return;
    g.position.set(cx + Math.cos(a) * r, WATER_Y + Math.sin(a * 5) * 0.12, cz + Math.sin(a) * r);
    g.rotation.y = -a + (speed > 0 ? Math.PI : 0);
    g.rotation.z = 0.12;
  });
  return (
    <group ref={group}>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[1.4, 0.7, 4]} />
        <meshStandardMaterial color="#f4f1ea" />
      </mesh>
      <mesh position={[0, 3.2, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 5.2, 5]} />
        <meshStandardMaterial color="#6b4f36" />
      </mesh>
      <mesh position={[0, 3.2, -0.9]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[1.8, 4.2]} />
        <meshStandardMaterial color={phase > 2 ? "#ff8fb1" : "#ffffff"} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

const Port = memo(function Port() {
  const { x, z } = SITE.pelabuhan;
  const containers = useMemo(() => {
    const rand = seeded(88);
    const list: Inst[] = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 7; col++) {
        const stack = 1 + Math.floor(rand() * 4);
        for (let l = 0; l < stack; l++) list.push({ p: [x - 48 + col * 7, LAND_Y + 1.3 + l * 2.55, z - 34 + row * 3.1], r: [0, Math.PI / 2, 0], s: [2.5, 2.5, 6.2], c: pick(CONTAINER_COLORS, rand()) });
      }
    }
    return list;
  }, [x, z]);
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const offshore = useMemo(() => measure([[x - 260, z + 170], [x - 60, z + 110], [x + 140, z + 150], [x + 360, z + 230]] as XZ[]), [x, z]);
  const inbound = useMemo(() => measure([[x + 30, z + 40], [x + 70, z + 90], [x + 160, z + 140]] as XZ[]), [x, z]);
  const lighthouse = useRef<THREE.Group>(null);
  useFrame((_, raw) => {
    if (lighthouse.current) lighthouse.current.rotation.y += clampDelta(raw) * 1.2;
  });
  return (
    <group>
      <mesh position={[x - 10, LAND_Y + 0.04, z - 14]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[110, 50]} />
        <meshStandardMaterial color="#9c9788" polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
      {/* Dermaga menjorok ke laut */}
      <mesh position={[x - 10, LAND_Y - 0.4, z + 22]} castShadow receiveShadow>
        <boxGeometry args={[100, 2, 26]} />
        <meshStandardMaterial color="#b9b3a8" />
      </mesh>
      <InstancedSet items={containers} geometry={box} />
      <GantryCrane x={x - 30} z={z + 18} phase={0} />
      <GantryCrane x={x + 10} z={z + 18} phase={2.3} />
      <group position={[x + 30, 0, z + 48]} rotation={[0, Math.PI / 2, 0]}>
        <Ship path={measure([[0, 0], [0, 0.01]] as XZ[])} speed={0} phase={0.3} color="#8e2b1f" />
      </group>
      <Ship path={offshore} speed={4} phase={0.2} scale={1.3} />
      <Ship path={inbound} speed={3} phase={0.6} scale={0.8} color="#2f6f5b" />
      <group position={[x + 48, LAND_Y, z + 30]}>
        <mesh position={[0, 7, 0]} castShadow>
          <cylinderGeometry args={[1.4, 2, 14, 12]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        {[3, 8].map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <cylinderGeometry args={[1.7, 1.8, 1.6, 12]} />
            <meshStandardMaterial color="#d94f3d" />
          </mesh>
        ))}
        <group ref={lighthouse} position={[0, 15, 0]}>
          <mesh>
            <cylinderGeometry args={[1.2, 1.2, 2, 10]} />
            <meshStandardMaterial color="#fff6d8" emissive="#ffe8a8" emissiveIntensity={1.4} />
          </mesh>
          <mesh position={[0, 0, 6]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[2.5, 12, 12, 1, true]} />
            <meshBasicMaterial color="#fff6d8" transparent opacity={0.15} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </group>
      <Sailboat cx={x - 120} cz={z + 90} r={40} speed={0.12} phase={0.5} />
      <Sailboat cx={x + 90} cz={z + 120} r={55} speed={-0.09} phase={2.5} />
      <Sailboat cx={x - 30} cz={z + 180} r={70} speed={0.07} phase={4} />
    </group>
  );
});

/* ------------------------------ proyek tol ------------------------------ */

function TowerCrane({ x, z }: { x: number; z: number }) {
  const jib = useRef<THREE.Group>(null);
  const clock = useRef(0);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    if (jib.current) jib.current.rotation.y = Math.sin(clock.current * 0.18) * 1.4;
  });
  return (
    <group position={[x, LAND_Y, z]}>
      <mesh position={[0, 20, 0]} castShadow>
        <boxGeometry args={[1.6, 40, 1.6]} />
        <meshStandardMaterial color="#f2c14e" wireframe />
      </mesh>
      <mesh position={[0, 20, 0]}>
        <boxGeometry args={[1.2, 40, 1.2]} />
        <meshStandardMaterial color="#f2c14e" transparent opacity={0.35} />
      </mesh>
      <group ref={jib} position={[0, 40, 0]}>
        <mesh position={[0, 1.5, 0]} castShadow>
          <boxGeometry args={[2.4, 3, 2.4]} />
          <meshStandardMaterial color="#f2c14e" />
        </mesh>
        <mesh position={[0, 0.5, 12]} castShadow>
          <boxGeometry args={[1, 1, 32]} />
          <meshStandardMaterial color="#f2c14e" />
        </mesh>
        <mesh position={[0, 0.8, -6]} castShadow>
          <boxGeometry args={[2.2, 2, 4]} />
          <meshStandardMaterial color="#8c939c" />
        </mesh>
        <mesh position={[0, -8, 20]}>
          <boxGeometry args={[0.08, 16, 0.08]} />
          <meshBasicMaterial color="#2b2f36" />
        </mesh>
        <mesh position={[0, -16.5, 20]} castShadow>
          <boxGeometry args={[4, 0.6, 1.2]} />
          <meshStandardMaterial color="#8c939c" />
        </mesh>
      </group>
    </group>
  );
}

const Construction = memo(function Construction() {
  const { x, z } = SITE.proyek;
  const deck = useMemo(() => {
    // Jalan tol layang di sisi timur jalan utama, sebagian masih berupa tiang.
    const piers: Inst[] = [];
    const slabs: Inst[] = [];
    const path = measure([[x + 26, z + 80], [x + 34, z - 20], [x + 52, z - 140]] as XZ[]);
    for (let d = 0; d < path.length; d += 12) {
      const p = along(path, d);
      const y = LAND_Y;
      piers.push({ p: [p.x, y + 5, p.z], s: [2.2, 10, 2.2] });
      if (d < path.length * 0.55) slabs.push({ p: [p.x, y + 10.6, p.z], r: [0, p.heading, 0], s: [11, 1.2, 12.2] });
    }
    return { piers, slabs };
  }, [x, z]);
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const cone = useMemo(() => {
    const g = new THREE.ConeGeometry(1, 1, 10);
    g.translate(0, 0.5, 0);
    return g;
  }, []);
  const piles = useMemo<Inst[]>(
    () => [
      { p: [x - 34, LAND_Y, z + 10], s: [6, 4, 6], c: "#d8c690" },
      { p: [x - 40, LAND_Y, z - 4], s: [5, 3.5, 5], c: "#a09a8c" },
    ],
    [x, z]
  );
  const cones = useMemo<Inst[]>(() => Array.from({ length: 12 }, (_, k) => ({ p: [x + 18, LAND_Y, z - 30 + k * 5], s: [0.4, 0.9, 0.4], c: k % 2 ? "#ffffff" : "#f26b3a" })), [x, z]);
  return (
    <group>
      <mesh position={[x - 10, LAND_Y + 0.04, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#b49a72" polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
      <InstancedSet items={deck.piers} geometry={box} color="#c8c2b5" />
      <InstancedSet items={deck.slabs} geometry={box} color="#b9b3a8" />
      <InstancedSet items={piles} geometry={cone} />
      <InstancedSet items={cones} geometry={cone} shadow={false} />
      <TowerCrane x={x - 22} z={z - 14} />
      <group position={[x - 20, LAND_Y, z + 18]} rotation={[0, 0.6, 0]}>
        <CementTruck />
      </group>
      <Technician avatar="arga" path={[[x - 30, z - 20], [x - 10, z - 20], [x - 10, z + 6]]} delay={0.3} />
      <Technician avatar="nara" path={[[x - 36, z + 20], [x - 16, z + 26]]} delay={2.1} />
    </group>
  );
});

/* ------------------------------ rumah ------------------------------ */

const WALL_COLORS = ["#f4efe4", "#f2d6b3", "#d9e6ef", "#f6e3a8", "#e7d1d1", "#d8ecd6"];
const ROOF_COLORS = ["#b8553a", "#9c4a36", "#c96b3c", "#6d4c41", "#8e3b2f"];

function houses(centers: { x: number; z: number; ry: number; w: number; d: number }[], seed: number) {
  const rand = seeded(seed);
  const walls = centers.map((c) => ({ x: c.x, y: LAND_Y + 1.6, z: c.z, w: c.w, h: 3.2, d: c.d, ry: c.ry, color: pick(WALL_COLORS, rand()) }));
  const roofs: Inst[] = centers.map((c) => ({ p: [c.x, LAND_Y + 3.2, c.z], r: [0, c.ry, 0], s: [c.w + 0.8, 2, c.d + 0.8], c: pick(ROOF_COLORS, rand()) }));
  return { walls, roofs };
}

/** Prisma atap pelana (alas 1×1, tinggi 1). */
function gableGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.5, 0);
  shape.lineTo(0.5, 0);
  shape.lineTo(0, 1);
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false });
  g.translate(0, 0, -0.5);
  return g;
}

const Housing = memo(function Housing() {
  const { x, z } = SITE.perumahan;
  const data = useMemo(() => {
    const centers: { x: number; z: number; ry: number; w: number; d: number }[] = [];
    for (let row = -2; row <= 2; row++) {
      for (let col = -3; col <= 3; col++) {
        const hx = x + col * 12;
        const hz = z + row * 14;
        if (Math.hypot(hx - x, hz - z) < 16) continue;
        if (roadDistance(hx, hz) < ROAD_HALF + 5) continue;
        centers.push({ x: hx, z: hz, ry: row % 2 ? Math.PI : 0, w: 7, d: 8 });
      }
    }
    return houses(centers, 5);
  }, [x, z]);
  const walls = useMemo(() => boxBatch(data.walls, 3, 3.2), [data]);
  const tex = useMemo(() => windowTexture(12, "#ffffff", "#3c5a73", "#ffe7a8"), []);
  const gable = useMemo(() => gableGeometry(), []);
  const pool = useMemo(() => ({ x: x + 30, z: z - 30 }), [x, z]);
  return (
    <group>
      <mesh geometry={walls} castShadow receiveShadow>
        <meshStandardMaterial map={tex} vertexColors roughness={0.8} />
      </mesh>
      <InstancedSet items={data.roofs} geometry={gable} />
      <mesh position={[pool.x, LAND_Y + 0.08, pool.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 6]} />
        <meshStandardMaterial color="#5fd0e8" emissive="#3fb0d0" emissiveIntensity={0.3} />
      </mesh>
      <Technician avatar="nara" path={[[x - 30, z + 7], [x + 30, z + 7]]} delay={1} />
    </group>
  );
});

const Village = memo(function Village() {
  const data = useMemo(() => {
    const rand = seeded(14);
    const centers: { x: number; z: number; ry: number; w: number; d: number }[] = [];
    for (let k = 0; k < 40 && centers.length < 18; k++) {
      const a = rand() * Math.PI * 2;
      const r = VILLAGE.r * (0.25 + rand() * 0.75);
      const hx = VILLAGE.x + Math.cos(a) * r;
      const hz = VILLAGE.z + Math.sin(a) * r;
      if (roadDistance(hx, hz) < ROAD_HALF + 5) continue;
      if (centers.some((c) => Math.hypot(c.x - hx, c.z - hz) < 9)) continue;
      centers.push({ x: hx, z: hz, ry: rand() * Math.PI, w: 5 + rand() * 2, d: 6 + rand() * 2 });
    }
    return houses(centers, 15);
  }, []);
  const walls = useMemo(() => boxBatch(data.walls, 3, 3.2), [data]);
  const tex = useMemo(() => windowTexture(19, "#ffffff", "#5a4636", "#ffe7a8"), []);
  const gable = useMemo(() => gableGeometry(), []);
  const mosque = { x: VILLAGE.x + 6, z: VILLAGE.z - 4 };
  return (
    <group>
      <mesh geometry={walls} castShadow receiveShadow>
        <meshStandardMaterial map={tex} vertexColors roughness={0.85} />
      </mesh>
      <InstancedSet items={data.roofs} geometry={gable} />
      <group position={[mosque.x, LAND_Y, mosque.z]}>
        <mesh position={[0, 2.5, 0]} castShadow>
          <boxGeometry args={[10, 5, 10]} />
          <meshStandardMaterial color="#f4f1ea" />
        </mesh>
        <mesh position={[0, 5, 0]} castShadow>
          <sphereGeometry args={[4, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#2fae66" metalness={0.3} roughness={0.4} />
        </mesh>
        <mesh position={[6.5, 7, 6.5]} castShadow>
          <cylinderGeometry args={[0.8, 0.9, 14, 10]} />
          <meshStandardMaterial color="#f4f1ea" />
        </mesh>
        <mesh position={[6.5, 14.8, 6.5]}>
          <coneGeometry args={[1.1, 2.4, 10]} />
          <meshStandardMaterial color="#2fae66" />
        </mesh>
      </group>
      <Technician avatar="arga" path={[[VILLAGE.x - 20, VILLAGE.z + 10], [VILLAGE.x + 10, VILLAGE.z + 16]]} delay={0.8} />
    </group>
  );
});

/* ------------------------------ lalu lintas ------------------------------ */

const LIVERIES: TruckLivery[] = [
  { cab: "#f26b3a", stripe: "#fff4e8", drum: "#f4f1ea", helix: "#f26b3a" },
  { cab: "#2f6fb5", stripe: "#eaf2ff", drum: "#f4f1ea", helix: "#2f6fb5" },
  { cab: "#2fae66", stripe: "#e9fff1", drum: "#f4f1ea", helix: "#2fae66" },
];

type Vehicle = { road: number; d: number; dir: 1 | -1; speed: number; kind: TrafficKind | "truck"; color: string; lane: number };

const KINDS: TrafficKind[] = ["sedan", "sedan", "angkot", "pickup", "boxtruck", "bus"];

/** Kendaraan melaju bolak-balik di jaringan jalan; di ujung jauh (dalam kabut) mereka berputar arah. */
function RoadTraffic({ quality }: { quality: GameQuality }) {
  const paths = useMemo(() => ROADS.map((road) => measure(road)), []);
  const vehicles = useMemo(() => {
    const rand = seeded(77);
    const perRoad = quality === "hemat" ? 3 : quality === "tinggi" ? 7 : 5;
    const list: Vehicle[] = [];
    paths.forEach((path, road) => {
      for (let k = 0; k < perRoad; k++) {
        const dir = k % 2 ? 1 : -1;
        list.push({
          road,
          d: rand() * Math.min(path.length, 700),
          dir,
          speed: 9 + rand() * 6,
          kind: rand() < 0.25 ? "truck" : pick(KINDS, rand()),
          color: pick(CAR_COLORS, rand()),
          // Lajur kiri, sesuai lalu lintas Indonesia.
          lane: -dir * 2.1,
        });
      }
    });
    return list;
  }, [paths, quality]);
  const groups = useRef<(THREE.Group | null)[]>([]);
  const speeds = useRef(vehicles.map((v) => ({ speed: v.speed })));
  const motions = useMemo(() => vehicles.map((v) => ({ current: { speed: v.speed, steer: 0, braking: false } })), [vehicles]);
  useFrame((_, raw) => {
    const delta = clampDelta(raw);
    vehicles.forEach((v, i) => {
      const path = paths[v.road];
      const limit = Math.min(path.length, 720);
      v.d += v.speed * delta * v.dir;
      if (v.d > limit || v.d < 0) {
        v.dir = v.d > limit ? -1 : 1;
        v.lane = -v.dir * 2.1;
      }
      v.d = THREE.MathUtils.clamp(v.d, 0, limit);
      const p = along(path, v.d);
      const heading = p.heading + (v.dir < 0 ? Math.PI : 0);
      const g = groups.current[i];
      if (!g) return;
      const x = p.x + Math.cos(p.heading) * v.lane;
      const z = p.z - Math.sin(p.heading) * v.lane;
      g.position.set(x, deckAt(x, z), z);
      g.rotation.y += Math.atan2(Math.sin(heading - g.rotation.y), Math.cos(heading - g.rotation.y)) * Math.min(1, delta * 6);
    });
  });
  return (
    <group>
      {vehicles.map((v, i) => (
        <group key={i} ref={(node) => { groups.current[i] = node; }} scale={v.kind === "truck" ? 0.9 : 1}>
          {v.kind === "truck" ? <CementTruck livery={LIVERIES[i % LIVERIES.length]} motion={motions[i]} /> : <TrafficCar kind={v.kind} color={v.color} trafficRef={speeds} index={i} />}
        </group>
      ))}
    </group>
  );
}

/** Kereta barang semen bolak-balik antara pabrik dan pelabuhan. */
function Train() {
  const path = useMemo(() => measure(RAIL), []);
  const cars = 7;
  const groups = useRef<(THREE.Group | null)[]>([]);
  const state = useRef({ d: 300, dir: 1 });
  useFrame((_, raw) => {
    const delta = clampDelta(raw);
    const s = state.current;
    const min = 260;
    const max = path.length - 8;
    s.d += 13 * delta * s.dir;
    if (s.d > max) s.dir = -1;
    if (s.d < min) s.dir = 1;
    s.d = THREE.MathUtils.clamp(s.d, min, max);
    for (let k = 0; k < cars; k++) {
      const g = groups.current[k];
      if (!g) continue;
      const p = along(path, s.d - k * 9.4 * s.dir);
      g.position.set(p.x, deckAt(p.x, p.z) + 0.3, p.z);
      g.rotation.y = p.heading;
    }
  });
  return (
    <group>
      {Array.from({ length: cars }, (_, k) => (
        <group key={k} ref={(node) => { groups.current[k] = node; }}>
          {k === 0 ? (
            <>
              <mesh position={[0, 2.1, 0]} castShadow>
                <boxGeometry args={[3, 3.4, 8.6]} />
                <meshStandardMaterial color="#f26b3a" />
              </mesh>
              <mesh position={[0, 2.8, 3.2]}>
                <boxGeometry args={[3.05, 1.1, 1.6]} />
                <meshStandardMaterial color="#1d2e3a" />
              </mesh>
              <mesh position={[0, 4, 0]}>
                <boxGeometry args={[2.4, 0.6, 6]} />
                <meshStandardMaterial color="#2b2f36" />
              </mesh>
            </>
          ) : (
            <>
              <mesh position={[0, 2.4, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[1.5, 1.5, 7.6, 14]} />
                <meshStandardMaterial color={k % 2 ? "#d8d3c8" : "#b9b3a8"} />
              </mesh>
              <mesh position={[0, 0.8, 0]}>
                <boxGeometry args={[2.6, 0.6, 8.6]} />
                <meshStandardMaterial color="#2b2f36" />
              </mesh>
            </>
          )}
        </group>
      ))}
    </group>
  );
}

/** Perahu nelayan menyusuri sungai. */
function RiverBoats() {
  const path = useMemo(() => measure(RIVER.filter(([, z]) => z > -260 && z < 300)), []);
  const boats = useMemo(() => [0.1, 0.45, 0.8].map((f, k) => ({ d: f * path.length, dir: k % 2 ? 1 : -1, speed: 3 + k })), [path]);
  const groups = useRef<(THREE.Group | null)[]>([]);
  const clock = useRef(0);
  useFrame((_, raw) => {
    const delta = clampDelta(raw);
    clock.current += delta;
    boats.forEach((b, k) => {
      b.d += b.speed * delta * b.dir;
      if (b.d > path.length || b.d < 0) b.dir *= -1;
      b.d = THREE.MathUtils.clamp(b.d, 0, path.length);
      const p = along(path, b.d);
      const g = groups.current[k];
      if (!g) return;
      const side = k % 2 ? 2.5 : -2.5;
      g.position.set(p.x + Math.cos(p.heading) * side, WATER_Y + Math.sin(clock.current * 2 + k) * 0.08, p.z - Math.sin(p.heading) * side);
      g.rotation.y = p.heading + (b.dir < 0 ? Math.PI : 0);
    });
  });
  return (
    <group>
      {boats.map((_, k) => (
        <group key={k} ref={(node) => { groups.current[k] = node; }}>
          <mesh position={[0, 0.2, 0]} castShadow>
            <boxGeometry args={[1.3, 0.5, 4.6]} />
            <meshStandardMaterial color={["#2f6fb5", "#c0392b", "#2fae66"][k]} />
          </mesh>
          <mesh position={[0, 0.9, -0.6]}>
            <boxGeometry args={[1, 0.9, 1.2]} />
            <meshStandardMaterial color="#f4f1ea" />
          </mesh>
          <mesh position={[0, 1.5, 1.1]}>
            <coneGeometry args={[0.45, 0.5, 8]} />
            <meshStandardMaterial color="#e8c26e" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ------------------------------ akar ------------------------------ */

export function DroneCity({ quality }: { quality: GameQuality }) {
  return (
    <>
      <City />
      <HqPlaza />
      <Plant />
      <Warehouse />
      <Port />
      <Construction />
      <Housing />
      <Village />
      <RoadTraffic quality={quality} />
      <Train />
      <RiverBoats />
    </>
  );
}

