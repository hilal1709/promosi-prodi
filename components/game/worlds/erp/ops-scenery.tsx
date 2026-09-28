"use client";

import { memo, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Technician } from "../audit/data-center";
import { OPS_PRODUCTS, OPS_PRODUCT_IDS, type OpsProductId } from "@/lib/data/worlds";
import type { GameQuality } from "@/lib/types";
import { clampDelta } from "../world-kit";
import { fbm, seeded } from "./race-track";
import { Birds, canvasTexture, Clouds, HORIZON, InstancedSet, SkyDome } from "./race-scenery";
import { CementTruck, type TruckLivery } from "./truck-models";
import { Forklift, Kiln, PalletModel, PreheaterTower, Silo } from "./ops-models";
import { BAY_Z, BOUNDS, CROSS_ROAD_Z, DOCK_EDGE_X, ROAD_X } from "./ops-layout";

/* ------------------------------------------------------------------ */
/* Dunia sekitar gudang: langit, bukit, jalan, bangunan, kehidupan     */
/* ------------------------------------------------------------------ */

type Inst = { p: [number, number, number]; r?: [number, number, number]; s?: number | [number, number, number]; c?: string };

const WORLD_CENTER = { x: 0, z: 0 };
const SUN_DIR = new THREE.Vector3(-0.45, 0.62, -0.64).normalize();
const YARD = { minX: -52, maxX: 31, minZ: -48, maxZ: 36 };

const smooth = THREE.MathUtils.smoothstep;
const pick = <T,>(list: T[], r: number) => list[Math.floor(r * list.length) % list.length];

function yardDistance(x: number, z: number) {
  const dx = Math.max(YARD.minX - x, 0, x - YARD.maxX);
  const dz = Math.max(YARD.minZ - z, 0, z - YARD.maxZ);
  return Math.hypot(dx, dz);
}

function roadDistance(x: number, z: number) {
  return Math.min(z > -70 ? Math.abs(x - ROAD_X) : Infinity, Math.abs(z - CROSS_ROAD_Z));
}

const QUARRY = { x: -190, z: -150, r: 75 };

/** Tinggi tanah di luar kompleks: datar di pabrik & jalan, berbukit makin jauh, gunung di utara. */
export function opsHeight(x: number, z: number) {
  const yd = yardDistance(x, z);
  let h = (fbm(x * 0.012 + 3, z * 0.012 - 7, 4) - 0.35) * 46 * smooth(yd, 14, 170);
  h += smooth(-z, 220, 560) * (60 + fbm(x * 0.006, z * 0.006, 4) * 170);
  h = Math.max(h, -2);
  const qd = Math.hypot(x - QUARRY.x, z - QUARRY.z);
  if (qd < QUARRY.r) {
    // Tambang kapur bertingkat.
    const terr = Math.floor(h / 5) * 5 - (1 - qd / QUARRY.r) * 10;
    h = THREE.MathUtils.lerp(h, terr, smooth(QUARRY.r - qd, 0, 18));
  }
  h *= smooth(roadDistance(x, z), 7, 26);
  return h;
}

/* ------------------------------ cahaya ------------------------------ */

function OpsSun({ focus, quality }: { focus: RefObject<THREE.Group | null>; quality: GameQuality }) {
  const light = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const size = quality === "tinggi" ? 2048 : 1024;
  useFrame(() => {
    const p = focus.current?.position;
    const x = p ? Math.round(p.x / 2) * 2 : 0;
    const z = p ? Math.round(p.z / 2) * 2 : 0;
    target.position.set(x, 0, z);
    target.updateMatrixWorld();
    light.current?.position.set(x + SUN_DIR.x * 80, SUN_DIR.y * 80, z + SUN_DIR.z * 80);
  });
  return (
    <>
      <primitive object={target} />
      <ambientLight intensity={0.28} color="#fff6e8" />
      <hemisphereLight intensity={1.05} color="#dcefff" groundColor="#6f6a55" />
      <directionalLight
        ref={light}
        target={target}
        castShadow={quality !== "hemat"}
        intensity={2.2}
        color="#fff0d4"
        shadow-mapSize={[size, size]}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-camera-near={1}
        shadow-camera-far={200}
        shadow-bias={-0.0004}
        shadow-normalBias={0.05}
      />
    </>
  );
}

/* ------------------------------ tanah ------------------------------- */

const GRASS_A = new THREE.Color("#5c9a43");
const GRASS_B = new THREE.Color("#8cbd5a");
const DRY = new THREE.Color("#b9b86c");
const FOREST = new THREE.Color("#3f7536");
const ROCK = new THREE.Color("#8b8c7c");
const PEAK = new THREE.Color("#c9ccc0");
const LIME = new THREE.Color("#e6e1d2");
const PADDY = new THREE.Color("#a6c95a");
const PADDY_WET = new THREE.Color("#6f9f6a");
const DIRT = new THREE.Color("#b59e7a");

const Terrain = memo(function Terrain({ quality }: { quality: GameQuality }) {
  const geometry = useMemo(() => {
    const size = 1500;
    const segments = quality === "hemat" ? 120 : quality === "tinggi" ? 220 : 170;
    const plane = new THREE.PlaneGeometry(size, size, segments, segments);
    plane.rotateX(-Math.PI / 2);
    const position = plane.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(position.count * 3);
    const color = new THREE.Color();
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const z = position.getZ(i);
      const h = opsHeight(x, z);
      position.setY(i, h - 0.06);
      const n = fbm(x * 0.03, z * 0.03, 3);
      color.copy(GRASS_A).lerp(GRASS_B, THREE.MathUtils.clamp(n * 1.5 - 0.25, 0, 1));
      color.lerp(DRY, smooth(fbm(x * 0.008 + 40, z * 0.008 - 11, 3), 0.55, 0.72) * 0.5);
      // Petak sawah di dataran selatan & timur.
      const paddy = fbm(x * 0.02 + 9, z * 0.02 + 4, 2);
      if (h < 3 && z > 40 && paddy > 0.52 && roadDistance(x, z) > 10) {
        const cell = (Math.floor(x / 14) + Math.floor(z / 10)) % 2;
        color.copy(cell ? PADDY : PADDY_WET);
      }
      if (h > 8) color.lerp(FOREST, smooth(h, 8, 26) * 0.8);
      if (h > 55) color.lerp(ROCK, smooth(h, 55, 95));
      if (h > 140) color.lerp(PEAK, smooth(h, 140, 190));
      const qd = Math.hypot(x - QUARRY.x, z - QUARRY.z);
      if (qd < QUARRY.r + 10) color.lerp(LIME, 1 - smooth(qd, QUARRY.r - 12, QUARRY.r + 10));
      const yd = yardDistance(x, z);
      if (yd < 8) color.lerp(DIRT, (1 - yd / 8) * 0.55);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    plane.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    plane.computeVertexNormals();
    return plane;
  }, [quality]);
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors flatShading roughness={1} />
    </mesh>
  );
});

/** Lantai beton kompleks dengan marka jalur forklift, zebra, dan nomor bay (satu tekstur kanvas). */
const YardFloor = memo(function YardFloor() {
  const W = YARD.maxX - YARD.minX;
  const D = YARD.maxZ - YARD.minZ;
  const texture = useMemo(() => {
    const px = 2048;
    const sx = px / W;
    const sz = px / D;
    const X = (x: number) => (x - YARD.minX) * sx;
    const Z = (z: number) => (z - YARD.minZ) * sz;
    const tex = canvasTexture(px, px, (g) => {
      g.fillStyle = "#b9b5ab";
      g.fillRect(0, 0, px, px);
      // Noda & pelat beton
      const rand = seeded(12);
      for (let i = 0; i < 900; i++) {
        g.fillStyle = `rgba(${rand() > 0.5 ? "90,86,80" : "235,230,220"},${0.03 + rand() * 0.05})`;
        const r = 4 + rand() * 30;
        g.beginPath();
        g.arc(rand() * px, rand() * px, r, 0, Math.PI * 2);
        g.fill();
      }
      g.strokeStyle = "rgba(80,76,70,.28)";
      g.lineWidth = 2;
      for (let x = YARD.minX; x < YARD.maxX; x += 6) {
        g.beginPath();
        g.moveTo(X(x), 0);
        g.lineTo(X(x), px);
        g.stroke();
      }
      for (let z = YARD.minZ; z < YARD.maxZ; z += 6) {
        g.beginPath();
        g.moveTo(0, Z(z));
        g.lineTo(px, Z(z));
        g.stroke();
      }
      // Area kerja utama sedikit lebih terang
      g.fillStyle = "rgba(255,255,255,.08)";
      g.fillRect(X(BOUNDS.minX), Z(BOUNDS.minZ), X(BOUNDS.maxX) - X(BOUNDS.minX), Z(BOUNDS.maxZ) - Z(BOUNDS.minZ));
      // Jalur forklift (kuning ganda)
      g.strokeStyle = "#f2c14e";
      g.lineWidth = 5;
      [-1.4, 1.4].forEach((o) => g.strokeRect(X(-9.5 - o), Z(-9.5 - o), X(9 + o) - X(-9.5 - o), Z(11 + o) - Z(-9.5 - o)));
      // Panah arah forklift
      g.fillStyle = "#f2c14e";
      const arrow = (x: number, z: number, a: number) => {
        g.save();
        g.translate(X(x), Z(z));
        g.rotate(a);
        g.beginPath();
        g.moveTo(0, -18);
        g.lineTo(12, 8);
        g.lineTo(-12, 8);
        g.closePath();
        g.fill();
        g.restore();
      };
      arrow(0, -9.5, Math.PI / 2);
      arrow(9, 1, Math.PI);
      arrow(0, 11, -Math.PI / 2);
      arrow(-9.5, 1, 0);
      // Zebra penyeberangan di jalur forklift
      g.fillStyle = "rgba(255,255,255,.85)";
      BAY_Z.forEach((bz) => {
        [-9.5, 9].forEach((fx) => {
          for (let k = -3; k <= 3; k++) g.fillRect(X(fx - 1.2), Z(bz + k * 0.5) - 5, X(fx + 1.2) - X(fx - 1.2), 9);
        });
      });
      // Garis tepi dermaga (hitam-kuning)
      for (let z = -12; z < 12; z += 1) {
        g.fillStyle = Math.round(z) % 2 ? "#1d1e22" : "#f2c14e";
        g.fillRect(X(DOCK_EDGE_X - 0.8), Z(z), X(DOCK_EDGE_X) - X(DOCK_EDGE_X - 0.8), Z(z + 1) - Z(z));
      }
      // Nomor bay
      g.fillStyle = "#ffffff";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.font = `900 ${Math.round(sx * 2.2)}px system-ui, sans-serif`;
      BAY_Z.forEach((bz, k) => {
        g.save();
        g.translate(X(DOCK_EDGE_X - 2.4), Z(bz));
        g.rotate(-Math.PI / 2);
        g.fillText(`BAY ${k + 1}`, 0, 0);
        g.restore();
      });
      // Parkir di selatan
      g.strokeStyle = "rgba(255,255,255,.8)";
      g.lineWidth = 4;
      for (let x = -14; x <= 12; x += 3.2) {
        g.beginPath();
        g.moveTo(X(x), Z(21));
        g.lineTo(X(x), Z(26));
        g.stroke();
        g.beginPath();
        g.moveTo(X(x), Z(29));
        g.lineTo(X(x), Z(34));
        g.stroke();
      }
      // Tulisan K3
      g.fillStyle = "rgba(255,255,255,.75)";
      g.font = `900 ${Math.round(sx * 1.4)}px system-ui, sans-serif`;
      g.fillText("UTAMAKAN K3", X(0.2), Z(1));
      g.font = `800 ${Math.round(sx * 0.8)}px system-ui, sans-serif`;
      g.fillText("AWAS FORKLIFT · PAKAI APD", X(0.2), Z(2.6));
    });
    tex.anisotropy = 8;
    return tex;
  }, [W, D]);
  return (
    <mesh position={[(YARD.minX + YARD.maxX) / 2, 0.01, (YARD.minZ + YARD.maxZ) / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[W, D]} />
      <meshStandardMaterial map={texture} roughness={0.95} />
    </mesh>
  );
});

/* ------------------------------ jalan ------------------------------- */

const Roads = memo(function Roads() {
  const dashes = useMemo(() => {
    const items: Inst[] = [];
    for (let z = -60; z < 560; z += 8) items.push({ p: [ROAD_X, 0.07, z], s: [0.18, 1, 3.2] });
    for (let x = -560; x < 560; x += 8) if (Math.abs(x - ROAD_X) > 6) items.push({ p: [x, 0.07, CROSS_ROAD_Z], s: [3.2, 1, 0.18] });
    return items;
  }, []);
  const lamps = useMemo(() => {
    const poles: Inst[] = [];
    const heads: Inst[] = [];
    for (let z = -40; z < 240; z += 22) {
      poles.push({ p: [ROAD_X + 6.2, 3.5, z], s: [1, 7, 1] });
      heads.push({ p: [ROAD_X + 5.2, 7, z], s: [2.2, 0.2, 0.6] });
    }
    for (let x = -200; x < 220; x += 26) {
      if (Math.abs(x - ROAD_X) < 10) continue;
      poles.push({ p: [x, 3.5, CROSS_ROAD_Z - 6.2], s: [1, 7, 1] });
      heads.push({ p: [x, 7, CROSS_ROAD_Z - 5.2], s: [0.6, 0.2, 2.2] });
    }
    return { poles, heads };
  }, []);
  const flat = useMemo(() => new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), []);
  const pole = useMemo(() => new THREE.CylinderGeometry(0.12, 0.16, 1, 6), []);
  const cube = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  return (
    <group>
      <mesh position={[ROAD_X, 0.04, 250]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 640]} />
        <meshStandardMaterial color="#4a4d52" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.045, CROSS_ROAD_Z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1200, 10]} />
        <meshStandardMaterial color="#4a4d52" roughness={0.95} />
      </mesh>
      {[-5.4, 5.4].map((o) => (
        <group key={o}>
          <mesh position={[ROAD_X + o, 0.06, 250]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.8, 640]} />
            <meshStandardMaterial color="#9d9689" />
          </mesh>
          <mesh position={[0, 0.062, CROSS_ROAD_Z + o]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1200, 0.8]} />
            <meshStandardMaterial color="#9d9689" />
          </mesh>
        </group>
      ))}
      <InstancedSet items={dashes} geometry={flat} color="#f4f1ea" shadow={false} />
      <InstancedSet items={lamps.poles} geometry={pole} color="#6b7079" metalness={0.5} roughness={0.4} />
      <InstancedSet items={lamps.heads} geometry={cube} color="#fff4d6" emissive="#ffe8b0" emissiveIntensity={0.4} shadow={false} />
    </group>
  );
});

/* --------------------------- bangunan pabrik ------------------------- */

function sign(text: string, sub: string, bg = "#1f3b63", fg = "#ffffff") {
  return canvasTexture(1024, 256, (g) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, 1024, 256);
    g.fillStyle = fg;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = "900 110px system-ui, sans-serif";
    g.fillText(text, 512, 110);
    g.font = "700 40px system-ui, sans-serif";
    g.globalAlpha = 0.8;
    g.fillText(sub, 512, 210);
  });
}

/** Gudang tertutup di belakang rak, terbuka ke arah lorong. */
const WarehouseShed = memo(function WarehouseShed() {
  const label = useMemo(() => sign("GUDANG SEMEN", "Terhubung modul Inventory ERP", "#2d5fa8"), []);
  return (
    <group position={[-31, 0, 0]}>
      <mesh position={[-4, 5.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[14, 11, 34]} />
        <meshStandardMaterial color="#d9d4c8" roughness={0.8} />
      </mesh>
      {Array.from({ length: 12 }, (_, k) => (
        <mesh key={k} position={[3.05, 5.5, -16.5 + k * 3]}>
          <boxGeometry args={[0.1, 11, 0.25]} />
          <meshStandardMaterial color="#b9b3a8" />
        </mesh>
      ))}
      <mesh position={[-4, 11.5, 0]} rotation={[0, 0, 0.12]} castShadow>
        <boxGeometry args={[15.5, 0.5, 35]} />
        <meshStandardMaterial color="#6f7d8c" roughness={0.6} metalness={0.3} />
      </mesh>
      {/* Kanopi di atas rak (tinggi agar kamera tidak terhalang) */}
      <mesh position={[8.6, 9.2, 0]} rotation={[0, 0, -0.08]} castShadow>
        <boxGeometry args={[11, 0.25, 30]} />
        <meshStandardMaterial color="#8a98a8" roughness={0.6} metalness={0.3} />
      </mesh>
      {[-14, 0, 14].map((z) => (
        <mesh key={z} position={[13.7, 4.6, z]} castShadow>
          <boxGeometry args={[0.3, 9.2, 0.3]} />
          <meshStandardMaterial color="#5c6470" />
        </mesh>
      ))}
      <mesh position={[3.12, 9.3, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[12, 3]} />
        <meshStandardMaterial map={label} />
      </mesh>
      {/* Pintu gulung */}
      {[-11, 11].map((z) => (
        <mesh key={z} position={[3.1, 2.8, z]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[4.5, 5.6]} />
          <meshStandardMaterial color="#a7adb5" metalness={0.4} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
});

/** Kantor Pusat ERP berdinding kaca dengan layar dasbor besar yang hidup. */
const ErpOffice = memo(function ErpOffice({ dashRef }: { dashRef: RefObject<DashData> }) {
  const label = useMemo(() => sign("PUSAT KENDALI ERP", "Satu data untuk semua divisi", "#10233b", "#3fd0ff"), []);
  const canvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 288;
    return c;
  }, []);
  const screen = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [canvas]);
  const screenMat = useRef<THREE.MeshStandardMaterial>(null);
  const last = useRef(-1);
  const clock = useRef(0);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    if (clock.current - last.current < 0.5) return;
    last.current = clock.current;
    const d = dashRef.current;
    const g = canvas.getContext("2d")!;
    g.fillStyle = "#0b1422";
    g.fillRect(0, 0, 512, 288);
    g.fillStyle = "#3fd0ff";
    g.font = "900 26px system-ui, sans-serif";
    g.fillText("DASBOR ERP · LIVE", 18, 36);
    g.fillStyle = Math.floor(clock.current * 2) % 2 ? "#2fae66" : "#1a5c3a";
    g.beginPath();
    g.arc(490, 28, 8, 0, Math.PI * 2);
    g.fill();
    OPS_PRODUCT_IDS.forEach((id, k) => {
      const y = 62 + k * 46;
      const value = d.stock[id];
      g.fillStyle = "rgba(255,255,255,.1)";
      g.fillRect(18, y, 300, 30);
      g.fillStyle = value <= 1 ? "#e54b4b" : OPS_PRODUCTS[id].color;
      g.fillRect(18, y, (300 * Math.min(8, value)) / 8, 30);
      g.fillStyle = "#ffffff";
      g.font = "800 18px system-ui, sans-serif";
      g.fillText(`${OPS_PRODUCTS[id].singkat}  ${value} palet`, 26, y + 21);
    });
    g.fillStyle = "#ffffff";
    g.font = "800 20px system-ui, sans-serif";
    g.fillText("Pesanan", 340, 80);
    g.font = "900 44px system-ui, sans-serif";
    g.fillText(`${d.done}/${d.total}`, 340, 126);
    g.font = "800 20px system-ui, sans-serif";
    g.fillText("Kepuasan", 340, 170);
    g.fillStyle = d.sat < 60 ? "#e54b4b" : "#2fae66";
    g.font = "900 44px system-ui, sans-serif";
    g.fillText(`${d.sat}%`, 340, 216);
    g.fillStyle = d.alarm ? "#e54b4b" : "#2fae66";
    g.fillRect(18, 214, 300, 50);
    g.fillStyle = "#ffffff";
    g.font = "900 20px system-ui, sans-serif";
    g.fillText(d.alarm ? "⚠ ALARM · CEK TERMINAL" : "✓ SEMUA MODUL SINKRON", 30, 246);
    const map = screenMat.current?.map;
    if (map) map.needsUpdate = true;
  });
  return (
    <group position={[18, 0, -25]}>
      <mesh position={[0, 0.3, 0]} receiveShadow>
        <boxGeometry args={[17, 0.6, 12]} />
        <meshStandardMaterial color="#9a958a" />
      </mesh>
      <mesh position={[0, 4.6, 0]} castShadow>
        <boxGeometry args={[16, 8, 11]} />
        <meshStandardMaterial color="#6fa4c8" metalness={0.6} roughness={0.08} />
      </mesh>
      {[1, 3.6, 6.2].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[16.2, 0.25, 11.2]} />
          <meshStandardMaterial color="#e8e6e0" />
        </mesh>
      ))}
      {Array.from({ length: 9 }, (_, k) => (
        <mesh key={k} position={[-8 + k * 2, 4.6, 5.55]}>
          <boxGeometry args={[0.14, 8, 0.12]} />
          <meshStandardMaterial color="#e8e6e0" />
        </mesh>
      ))}
      <mesh position={[0, 8.9, 0]} castShadow>
        <boxGeometry args={[16.6, 0.6, 11.6]} />
        <meshStandardMaterial color="#e8e6e0" />
      </mesh>
      <mesh position={[0, 9.9, 5.9]}>
        <planeGeometry args={[11, 2.6]} />
        <meshStandardMaterial map={label} emissive="#ffffff" emissiveMap={label} emissiveIntensity={0.35} />
      </mesh>
      {/* Layar dasbor */}
      <mesh position={[-3.2, 4.2, 5.75]}>
        <boxGeometry args={[7.6, 4.4, 0.2]} />
        <meshStandardMaterial color="#111318" />
      </mesh>
      <mesh position={[-3.2, 4.2, 5.87]}>
        <planeGeometry args={[7.2, 4.05]} />
        <meshStandardMaterial ref={screenMat} map={screen} emissive="#ffffff" emissiveMap={screen} emissiveIntensity={0.95} toneMapped={false} />
      </mesh>
      {/* Pintu */}
      <mesh position={[4.5, 1.9, 5.6]}>
        <boxGeometry args={[2.4, 3, 0.1]} />
        <meshStandardMaterial color="#1b2f3d" metalness={0.5} roughness={0.1} />
      </mesh>
      {/* Parabola & antena */}
      <group position={[5, 9.2, -2]}>
        <mesh rotation={[-0.8, 0.5, 0]}>
          <sphereGeometry args={[1.1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 3]} />
          <meshStandardMaterial color="#f4f4f4" side={THREE.DoubleSide} />
        </mesh>
      </group>
      <mesh position={[-6, 11.5, -3]}>
        <cylinderGeometry args={[0.06, 0.1, 5, 6]} />
        <meshStandardMaterial color="#8a8f98" />
      </mesh>
    </group>
  );
});

export type DashData = { stock: Record<OpsProductId, number>; done: number; total: number; sat: number; alarm: boolean };

/** Kanopi dermaga, bumper, dan lampu status per bay. */
const DockArea = memo(function DockArea({ bayStatus }: { bayStatus: ("empty" | "arriving" | "loading")[] }) {
  return (
    <group>
      <mesh position={[22, 7.2, 0]} rotation={[0, 0, 0.05]} castShadow receiveShadow>
        <boxGeometry args={[13, 0.3, 26]} />
        <meshStandardMaterial color="#e8e6e0" roughness={0.5} />
      </mesh>
      {[-12.5, -3.75, 3.75, 12.5].flatMap((z) =>
        [16.3, 27.8].map((x) => (
          <mesh key={`${x}:${z}`} position={[x, 3.6, z]} castShadow>
            <boxGeometry args={[0.35, 7.2, 0.35]} />
            <meshStandardMaterial color="#d94f3d" />
          </mesh>
        ))
      )}
      {BAY_Z.map((bz, k) => {
        const status = bayStatus[k];
        const light = status === "loading" ? "#2fae66" : status === "arriving" ? "#f2c14e" : "#e54b4b";
        return (
          <group key={bz} position={[16.4, 0, bz]}>
            {[-1.6, 1.6].map((z) => (
              <mesh key={z} position={[0, 0.8, z]} castShadow>
                <boxGeometry args={[0.35, 0.8, 0.5]} />
                <meshStandardMaterial color="#1d1e22" />
              </mesh>
            ))}
            <mesh position={[0, 5.2, -2.1]}>
              <boxGeometry args={[0.3, 0.6, 0.6]} />
              <meshStandardMaterial color={light} emissive={light} emissiveIntensity={1.6} />
            </mesh>
            {/* Garis parkir */}
            {[-1.8, 1.8].map((z) => (
              <mesh key={`l${z}`} position={[5, 0.05, z]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[9, 0.2]} />
                <meshBasicMaterial color="#f4f1ea" />
              </mesh>
            ))}
          </group>
        );
      })}
      {/* Pembatas ujung dermaga (menutup tepi area kerja secara alami) */}
      {[-13.6, 13.6].map((z) => (
        <group key={z} position={[15.6, 0, z]}>
          <mesh position={[0, 0.6, 0]} castShadow>
            <boxGeometry args={[2, 1.2, 1]} />
            <meshStandardMaterial color="#c8c2b5" />
          </mesh>
          <mesh position={[0, 1.5, 0]}>
            <boxGeometry args={[1.6, 0.8, 0.7]} />
            <meshStandardMaterial color="#4f8a3d" />
          </mesh>
        </group>
      ))}
    </group>
  );
});

/* --------------------- tepi area kerja (alami) ---------------------- */

const CONTAINER_COLORS = ["#c0392b", "#2d6cdf", "#2fae66", "#f2a93b", "#6f7d8c", "#8e44ad", "#d35400"];

const Borders = memo(function Borders() {
  const parts = useMemo(() => {
    const rand = seeded(41);
    const planters: Inst[] = [];
    const hedges: Inst[] = [];
    const containers: Inst[] = [];
    const bollards: Inst[] = [];
    // Pot tanaman memanjang di tepi selatan, dengan tiang pembatas di celahnya.
    for (let x = -16; x <= 13.5; x += 3.4) {
      planters.push({ p: [x, 0.22, 17.2], s: [2.8, 0.44, 1.1] });
      hedges.push({ p: [x, 0.55, 17.2], s: [1.35, 0.32 + rand() * 0.12, 0.55], c: pick(["#4f8a3d", "#5b9a45", "#447a34"], rand()) });
      bollards.push({ p: [x + 1.7, 0.4, 17.2], s: [1, 0.8, 1] });
    }
    // Tumpukan kontainer di pojok barat laut & barat daya.
    const stack = (x: number, z: number, rot: number, levels: number) => {
      for (let l = 0; l < levels; l++)
        containers.push({ p: [x, 1.3 + l * 2.6, z], r: [0, rot + (rand() - 0.5) * 0.04, 0], s: [2.4, 2.6, 6], c: pick(CONTAINER_COLORS, rand()) });
    };
    stack(-20.5, -13.5, Math.PI / 2, 2);
    stack(-21.5, 13.8, Math.PI / 2, 1);
    stack(-27, 20, 0.1, 2);
    stack(-24, 20.5, 0.05, 1);
    stack(-30, -22, Math.PI / 2, 2);
    // Pagar tanaman tepi luar kompleks
    for (let x = YARD.minX + 2; x < YARD.maxX; x += 2.2) {
      if (Math.abs(x - 5) < 5) continue;
      hedges.push({ p: [x, 0.9, YARD.maxZ - 1], s: [1.4, 0.9 + rand() * 0.5, 1.1], c: pick(["#4f8a3d", "#5b9a45", "#3f7536"], rand()) });
    }
    for (let z = YARD.minZ + 2; z < YARD.maxZ; z += 2.2) {
      hedges.push({ p: [YARD.minX + 1, 0.9, z], s: [1.1, 0.9 + rand() * 0.5, 1.4], c: pick(["#4f8a3d", "#5b9a45", "#3f7536"], rand()) });
    }
    return { planters, hedges, containers, bollards };
  }, []);
  const cube = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const blob = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
  const bollard = useMemo(() => new THREE.CylinderGeometry(0.14, 0.14, 1, 8), []);
  return (
    <group>
      <InstancedSet items={parts.planters} geometry={cube} color="#8f8a80" />
      <InstancedSet items={parts.hedges} geometry={blob} />
      <InstancedSet items={parts.containers} geometry={cube} roughness={0.6} metalness={0.3} />
      <InstancedSet items={parts.bollards} geometry={bollard} color="#f2c14e" />
      {/* Tumpukan palet cadangan */}
      {[
        [-18.5, -11.2, "pcc"],
        [-18.5, 11.3, "putih"],
        [13.4, -12.6, "opc"],
        [13.2, 14.2, "pcc"],
      ].map(([x, z, p], k) => (
        <group key={k} position={[x as number, 0, z as number]} rotation={[0, k * 0.4, 0]}>
          <PalletModel product={p as OpsProductId} />
          <group position={[0, 1.08, 0]}>
            <PalletModel product={p as OpsProductId} />
          </group>
        </group>
      ))}
    </group>
  );
});

/* --------------------------- area produksi --------------------------- */

const ProductionArea = memo(function ProductionArea({ kilnRunning }: { kilnRunning: boolean }) {
  const hallSign = useMemo(() => sign("PRODUKSI", "Jadwal otomatis dari modul MRP", "#b5532f"), []);
  return (
    <group>
      <group position={[-20, 3.4, -28]}>
        <Kiln running={kilnRunning} />
      </group>
      <group position={[-40, 0, -28]}>
        <PreheaterTower />
      </group>
      {/* Atap hall pendingin di ujung kiln */}
      <group position={[-6, 0, -26]}>
        <mesh position={[0, 3.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[7, 7, 7]} />
          <meshStandardMaterial color="#c8c2b5" roughness={0.8} />
        </mesh>
        <mesh position={[0, 7.3, 0]} castShadow>
          <boxGeometry args={[7.6, 0.6, 7.6]} />
          <meshStandardMaterial color="#8a5a3c" />
        </mesh>
        <mesh position={[0, 5.2, 3.52]}>
          <planeGeometry args={[6, 1.5]} />
          <meshStandardMaterial map={hallSign} />
        </mesh>
      </group>
      {/* Silo */}
      {[
        [2, -36, "SILO A"],
        [10, -38, "SILO B"],
        [-8, -40, "SILO C"],
      ].map(([x, z, l]) => (
        <group key={l as string} position={[x as number, 0, z as number]}>
          <Silo label={l as string} />
        </group>
      ))}
      {/* Pipa dari kiln ke silo */}
      <mesh position={[-4, 12, -34]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.45, 0.45, 26, 10]} />
        <meshStandardMaterial color="#9aa2ad" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Pagar pipa di belakang area konsol (tepi utara area kerja) */}
      {Array.from({ length: 12 }, (_, k) => (
        <mesh key={k} position={[-12 + k * 2.2, 0.6, -18.6]} castShadow>
          <boxGeometry args={[0.12, 1.2, 0.12]} />
          <meshStandardMaterial color="#f2c14e" />
        </mesh>
      ))}
      {[0.5, 1.1].map((y) => (
        <mesh key={y} position={[0, y, -18.6]}>
          <boxGeometry args={[24.4, 0.08, 0.08]} />
          <meshStandardMaterial color="#f2c14e" />
        </mesh>
      ))}
    </group>
  );
});

/** Asap dari cerobong & kiln: bola-bola yang naik, membesar, lalu diulang. */
export function Smoke({ sources, count }: { sources: [number, number, number][]; count: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const puffs = useMemo(() => {
    const rand = seeded(8);
    return Array.from({ length: count }, (_, i) => ({ src: i % sources.length, t: rand(), drift: rand() * Math.PI * 2 }));
  }, [count, sources.length]);
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame((_, raw) => {
    const m = mesh.current;
    if (!m) return;
    const delta = clampDelta(raw);
    puffs.forEach((p, i) => {
      p.t = (p.t + delta * 0.09) % 1;
      const [x, y, z] = sources[p.src];
      const rise = p.t * 26;
      o.position.set(x + Math.cos(p.drift) * p.t * 3 + p.t * 9, y + rise, z + Math.sin(p.drift) * p.t * 3 - p.t * 4);
      o.scale.setScalar(1 + p.t * 5 * (1 - p.t * 0.4));
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color="#eeeae3" transparent opacity={0.5} depthWrite={false} flatShading roughness={1} />
    </instancedMesh>
  );
}

/* -------------------------- parkir & gerbang ------------------------- */

const CAR_COLORS = ["#e54b4b", "#f4f1ea", "#2b2f36", "#3f8fd8", "#9aa0a8", "#f2c14e", "#2fae66"];

const ParkingAndGate = memo(function ParkingAndGate() {
  const cars = useMemo(() => {
    const rand = seeded(19);
    const bodies: Inst[] = [];
    const cabins: Inst[] = [];
    const wheels: Inst[] = [];
    [23.5, 31.5].forEach((z, row) => {
      for (let x = -12.4; x <= 10.4; x += 3.2) {
        if (rand() < 0.28) continue;
        const rot = row ? Math.PI : 0;
        const c = pick(CAR_COLORS, rand());
        bodies.push({ p: [x, 0.65, z], r: [0, rot, 0], s: [1.8, 0.7, 4], c });
        cabins.push({ p: [x, 1.3, z + (row ? 0.2 : -0.2)], r: [0, rot, 0], s: [1.6, 0.65, 2.2], c: "#1d2e3a" });
        [-0.8, 0.8].forEach((wx) => [-1.3, 1.3].forEach((wz) => wheels.push({ p: [x + wx, 0.35, z + wz], s: [0.3, 0.7, 0.7] })));
      }
    });
    return { bodies, cabins, wheels };
  }, []);
  const cube = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const wheel = useMemo(() => new THREE.CylinderGeometry(0.5, 0.5, 1, 10).rotateZ(Math.PI / 2), []);
  const gateSign = useMemo(() => sign("PT SEMEN NUSANTARA", "Pabrik Tuban · Kawasan Industri", "#b5532f"), []);
  return (
    <group>
      <InstancedSet items={cars.bodies} geometry={cube} roughness={0.35} metalness={0.3} />
      <InstancedSet items={cars.cabins} geometry={cube} roughness={0.1} metalness={0.4} />
      <InstancedSet items={cars.wheels} geometry={wheel} color="#1a1b1f" shadow={false} />
      {/* Pos satpam & portal */}
      <group position={[ROAD_X - 8, 0, 36]}>
        <mesh position={[0, 1.6, 0]} castShadow>
          <boxGeometry args={[3.4, 3.2, 3]} />
          <meshStandardMaterial color="#f4efe4" />
        </mesh>
        <mesh position={[0, 3.35, 0]} castShadow>
          <boxGeometry args={[4, 0.3, 3.6]} />
          <meshStandardMaterial color="#1f3b63" />
        </mesh>
        <mesh position={[1.72, 1.8, 0]}>
          <boxGeometry args={[0.05, 1.2, 2]} />
          <meshStandardMaterial color="#1b2f3d" metalness={0.4} roughness={0.1} />
        </mesh>
      </group>
      <group position={[ROAD_X, 0, 34]}>
        {[-6.2, 6.2].map((x) => (
          <mesh key={x} position={[x, 3.5, 0]} castShadow>
            <boxGeometry args={[0.8, 7, 0.8]} />
            <meshStandardMaterial color="#c8c2b5" />
          </mesh>
        ))}
        <mesh position={[0, 7.4, 0]} castShadow>
          <boxGeometry args={[13.4, 1.6, 0.6]} />
          <meshStandardMaterial color="#b5532f" />
        </mesh>
        <mesh position={[0, 7.4, 0.32]}>
          <planeGeometry args={[12.4, 1.4]} />
          <meshStandardMaterial map={gateSign} />
        </mesh>
        <mesh position={[0, 7.4, -0.32]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[12.4, 1.4]} />
          <meshStandardMaterial map={gateSign} />
        </mesh>
      </group>
    </group>
  );
});

/* ---------------------------- bendera ----------------------------- */

function Flags() {
  const clock = useRef(0);
  const flags = useMemo(
    () => [
      { x: 8.5, colors: ["#e54b4b", "#ffffff"] },
      { x: 10.5, colors: ["#b5532f", "#f2c14e"] },
      { x: 12.5, colors: ["#2d6cdf", "#3fd0ff"] },
    ],
    []
  );
  const geos = useMemo(() => flags.map(() => new THREE.PlaneGeometry(2, 0.65, 10, 1).translate(1, 0, 0)), [flags]);
  const base = useMemo(() => Float32Array.from(geos[0].attributes.position.array as Float32Array), [geos]);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    geos.forEach((g, k) => {
      const pos = g.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        const x = base[i * 3];
        pos.setZ(i, Math.sin(x * 2.4 - clock.current * 5 + k) * 0.18 * x);
      }
      pos.needsUpdate = true;
    });
  });
  return (
    <group position={[0, 0, -17.8]}>
      {flags.map((flag, k) => (
        <group key={k} position={[flag.x, 0, 0]}>
          <mesh position={[0, 4, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.08, 8, 8]} />
            <meshStandardMaterial color="#d7dbe0" metalness={0.7} roughness={0.3} />
          </mesh>
          {flag.colors.map((color, row) => (
            <mesh key={row} geometry={geos[k]} position={[0.05, 7.5 - row * 0.65, 0]}>
              <meshStandardMaterial color={color} side={THREE.DoubleSide} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/* ------------------------ vegetasi & desa jauh ----------------------- */

const Vegetation = memo(function Vegetation({ quality }: { quality: GameQuality }) {
  const v = useMemo(() => {
    const rand = seeded(quality === "hemat" ? 3 : 4);
    const count = quality === "hemat" ? 260 : quality === "tinggi" ? 900 : 560;
    const trunks: Inst[] = [];
    const crowns: Inst[] = [];
    const pines: Inst[] = [];
    const palms: Inst[] = [];
    const leaves: Inst[] = [];
    const bushes: Inst[] = [];
    const rocks: Inst[] = [];
    const place = (x: number, z: number) => {
      const h = opsHeight(x, z);
      const kind = rand();
      const scale = 0.8 + rand() * 0.8;
      if (h > 20 && kind < 0.7) {
        pines.push({ p: [x, h - 0.2, z], s: [2 * scale, 6 * scale, 2 * scale], c: pick(["#2f5f2c", "#3a6b33", "#2b5530"], rand()) });
      } else if (kind < 0.22 && h < 6) {
        const th = 5 + rand() * 3;
        palms.push({ p: [x, h, z], r: [(rand() - 0.5) * 0.2, 0, (rand() - 0.5) * 0.2], s: [1, th, 1] });
        for (let l = 0; l < 6; l++) leaves.push({ p: [x, h + th, z], r: [-0.5 - rand() * 0.3, (l / 6) * Math.PI * 2 + rand() * 0.3, 0], s: [1, 1, scale], c: pick(["#4d8f3a", "#5ea447", "#3f7a31"], rand()) });
      } else {
        const th = 1.6 + rand() * 1.4;
        trunks.push({ p: [x, h, z], s: [1, th * scale, 1] });
        crowns.push({ p: [x, h + th * scale + 1.2 * scale, z], r: [rand(), rand(), rand()], s: [2.2 * scale, 1.9 * scale, 2.2 * scale], c: pick(["#4f8a3d", "#5b9a45", "#3f7536", "#6aa84f", "#7aa33f"], rand()) });
      }
    };
    let guard = 0;
    while (trunks.length + pines.length + palms.length < count && guard++ < count * 12) {
      const a = rand() * Math.PI * 2;
      const r = 45 + Math.pow(rand(), 1.4) * 320;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (yardDistance(x, z) < 6 || roadDistance(x, z) < 9) continue;
      if (Math.hypot(x - QUARRY.x, z - QUARRY.z) < QUARRY.r) continue;
      if (x > 55 && x < 130 && z > 55 && z < 120) continue; // desa
      place(x, z);
    }
    // Deretan pohon peneduh di sepanjang jalan.
    for (let z = 50; z < 300; z += 11) [-8.5, 8.5].forEach((o) => place(ROAD_X + o + (rand() - 0.5), z));
    for (let x = -260; x < 260; x += 12) if (Math.abs(x - ROAD_X) > 14) [-8.5, 8.5].forEach((o) => place(x, CROSS_ROAD_Z + o + (rand() - 0.5)));
    // Pohon di taman kompleks
    [[-40, 30], [-46, 12], [-44, -38], [26, 30], [28, -40], [-14, 38], [4, 38], [20, 40]].forEach(([x, z]) => place(x, z));
    for (let i = 0; i < count * 0.5; i++) {
      const a = rand() * Math.PI * 2;
      const r = 40 + rand() * 200;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (yardDistance(x, z) < 3 || roadDistance(x, z) < 7) continue;
      const h = opsHeight(x, z);
      if (rand() < 0.75) bushes.push({ p: [x, h + 0.3, z], s: [1 + rand() * 1.4, 0.7 + rand() * 0.6, 1 + rand() * 1.4], c: pick(["#4f8a3d", "#5b9a45", "#6aa84f"], rand()) });
      else rocks.push({ p: [x, h + 0.2, z], r: [rand(), rand(), rand()], s: 0.6 + rand() * 1.6, c: pick(["#9a978c", "#b8b3a6", "#8b8c7c"], rand()) });
    }
    // Batu kapur di tambang
    for (let i = 0; i < 40; i++) {
      const a = rand() * Math.PI * 2;
      const r = rand() * QUARRY.r;
      const x = QUARRY.x + Math.cos(a) * r;
      const z = QUARRY.z + Math.sin(a) * r;
      rocks.push({ p: [x, opsHeight(x, z) + 0.5, z], r: [rand(), rand(), rand()], s: 1.5 + rand() * 3, c: "#e6e1d2" });
    }
    return { trunks, crowns, pines, palms, leaves, bushes, rocks };
  }, [quality]);
  const geo = useMemo(
    () => ({
      trunk: new THREE.CylinderGeometry(0.2, 0.3, 1, 6).translate(0, 0.5, 0),
      palm: new THREE.CylinderGeometry(0.16, 0.26, 1, 6).translate(0, 0.5, 0),
      crown: new THREE.IcosahedronGeometry(1, 0),
      leaf: new THREE.BoxGeometry(0.55, 0.06, 3).translate(0, 0, 1.5),
      cone: new THREE.ConeGeometry(1, 1, 7).translate(0, 0.5, 0),
      bush: new THREE.IcosahedronGeometry(1, 0),
      rock: new THREE.DodecahedronGeometry(1, 0),
    }),
    []
  );
  return (
    <>
      <InstancedSet items={v.trunks} geometry={geo.trunk} color="#6b4a2f" />
      <InstancedSet items={v.crowns} geometry={geo.crown} />
      <InstancedSet items={v.pines} geometry={geo.cone} />
      <InstancedSet items={v.palms} geometry={geo.palm} color="#8a6a48" />
      <InstancedSet items={v.leaves} geometry={geo.leaf} side={THREE.DoubleSide} />
      <InstancedSet items={v.bushes} geometry={geo.bush} />
      <InstancedSet items={v.rocks} geometry={geo.rock} />
    </>
  );
});

const WALLS = ["#f4efe4", "#f2e2c4", "#dfeee4", "#f6d9c9", "#e6ecf5", "#fff3c4"];
const ROOFS = ["#b5532f", "#c4643a", "#9c4428", "#8a5a3c", "#6f7d8c"];

/** Desa di seberang jalan + masjid kecil, supaya cakrawala terasa berpenghuni. */
const Village = memo(function Village() {
  const parts = useMemo(() => {
    const rand = seeded(57);
    const walls: Inst[] = [];
    const roofs: Inst[] = [];
    const clusters = [
      { x: 90, z: 85, n: 14 },
      { x: -110, z: 90, n: 10 },
      { x: 150, z: -40, n: 8 },
      { x: -70, z: 150, n: 8 },
    ];
    clusters.forEach((c) => {
      for (let i = 0, tries = 0; i < c.n && tries < 80; tries++) {
        const x = c.x + (rand() * 2 - 1) * 26;
        const z = c.z + (rand() * 2 - 1) * 22;
        if (roadDistance(x, z) < 10) continue;
        i++;
        const h = opsHeight(x, z);
        const rot = Math.round(rand() * 4) * (Math.PI / 2) + (rand() - 0.5) * 0.3;
        const w = 5 + rand() * 3;
        const d = 4.5 + rand() * 2;
        const hh = 2.8 + rand();
        walls.push({ p: [x, h - 0.3, z], r: [0, rot, 0], s: [w, hh + 0.3, d], c: pick(WALLS, rand()) });
        roofs.push({ p: [x, h + hh, z], r: [0, rot, 0], s: [(w + 0.8) / 1.414, 1.8 + rand() * 0.6, (d + 0.8) / 1.414], c: pick(ROOFS, rand()) });
      }
    });
    return { walls, roofs };
  }, []);
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), []);
  const roof = useMemo(() => new THREE.ConeGeometry(1, 1, 4).rotateY(Math.PI / 4).translate(0, 0.5, 0), []);
  const mosque = { x: 104, z: 70 };
  const mh = opsHeight(mosque.x, mosque.z);
  return (
    <>
      <InstancedSet items={parts.walls} geometry={box} roughness={0.8} />
      <InstancedSet items={parts.roofs} geometry={roof} roughness={0.8} />
      <group position={[mosque.x, mh, mosque.z]}>
        <mesh position={[0, 2.5, 0]} castShadow>
          <boxGeometry args={[9, 5, 9]} />
          <meshStandardMaterial color="#f4f4ee" />
        </mesh>
        <mesh position={[0, 5, 0]} castShadow>
          <sphereGeometry args={[3.6, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#2fae66" metalness={0.3} roughness={0.4} />
        </mesh>
        <mesh position={[5.6, 6, 3.6]} castShadow>
          <cylinderGeometry args={[0.6, 0.7, 12, 10]} />
          <meshStandardMaterial color="#f4f4ee" />
        </mesh>
        <mesh position={[5.6, 12.6, 3.6]}>
          <coneGeometry args={[0.8, 1.6, 10]} />
          <meshStandardMaterial color="#2fae66" />
        </mesh>
      </group>
    </>
  );
});

/** Menara listrik sepanjang lembah, ciri kawasan industri. */
const Pylons = memo(function Pylons() {
  const items = useMemo(() => {
    const legs: Inst[] = [];
    const arms: Inst[] = [];
    for (let k = 0; k < 9; k++) {
      const x = -320 + k * 80;
      const z = -95 + Math.sin(k * 0.8) * 12;
      const h = opsHeight(x, z);
      [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => legs.push({ p: [x + sx * 1.2, h + 9, z + sz * 1.2], r: [sz * 0.06, 0, -sx * 0.06], s: [0.25, 18, 0.25] })));
      arms.push({ p: [x, h + 15, z], s: [9, 0.3, 0.4] });
      arms.push({ p: [x, h + 18.5, z], s: [6, 0.3, 0.4] });
    }
    return { legs, arms };
  }, []);
  const cube = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  return (
    <>
      <InstancedSet items={items.legs} geometry={cube} color="#8a8f98" metalness={0.5} />
      <InstancedSet items={items.arms} geometry={cube} color="#8a8f98" metalness={0.5} />
    </>
  );
});

/* --------------------------- lalu lintas jalan ----------------------- */

const MOLEN_LIVERIES: TruckLivery[] = [
  { cab: "#b5532f", stripe: "#fff4e8", drum: "#f4f1ea", helix: "#b5532f" },
  { cab: "#2d6cdf", stripe: "#e6ecf5", drum: "#e7e2d8", helix: "#1f3b63" },
];

function PassingTraffic({ quality }: { quality: GameQuality }) {
  const vehicles = useMemo(() => {
    const list = [
      { kind: "molen", lane: 1, x: -120, speed: 11, livery: 0 },
      { kind: "car", lane: -1, x: 60, speed: 15, color: "#e54b4b" },
      { kind: "car", lane: 1, x: 150, speed: 14, color: "#f4f1ea" },
      { kind: "molen", lane: -1, x: -40, speed: 10, livery: 1 },
      { kind: "car", lane: -1, x: -220, speed: 16, color: "#3f8fd8" },
      { kind: "car", lane: 1, x: -300, speed: 13, color: "#2b2f36" },
    ];
    return quality === "hemat" ? list.slice(0, 3) : list;
  }, [quality]);
  const groups = useRef<(THREE.Group | null)[]>([]);
  const state = useRef(vehicles.map((v) => v.x));
  const motions = useMemo(() => vehicles.map((v) => ({ current: { speed: v.speed, steer: 0, braking: false } })), [vehicles]);
  useFrame((_, raw) => {
    const delta = clampDelta(raw);
    vehicles.forEach((v, k) => {
      state.current[k] += v.speed * v.lane * delta;
      if (state.current[k] > 360) state.current[k] -= 720;
      if (state.current[k] < -360) state.current[k] += 720;
      const g = groups.current[k];
      if (g) g.position.set(state.current[k], 0, CROSS_ROAD_Z + v.lane * 2.4);
    });
  });
  return (
    <>
      {vehicles.map((v, k) => (
        <group key={k} ref={(node) => { groups.current[k] = node; }} rotation={[0, v.lane > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
          {v.kind === "molen" ? (
            <CementTruck livery={MOLEN_LIVERIES[v.livery ?? 0]} motion={motions[k]} />
          ) : (
            <group>
              <mesh position={[0, 0.7, 0]} castShadow>
                <boxGeometry args={[1.8, 0.7, 4.1]} />
                <meshStandardMaterial color={v.color} roughness={0.35} metalness={0.3} />
              </mesh>
              <mesh position={[0, 1.35, -0.2]} castShadow>
                <boxGeometry args={[1.6, 0.6, 2.2]} />
                <meshStandardMaterial color="#1d2e3a" roughness={0.1} metalness={0.4} />
              </mesh>
              {[-0.8, 0.8].flatMap((x) =>
                [-1.3, 1.3].map((z) => (
                  <mesh key={`${x}:${z}`} position={[x, 0.35, z]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.35, 0.35, 0.3, 10]} />
                    <meshStandardMaterial color="#1a1b1f" />
                  </mesh>
                ))
              )}
            </group>
          )}
        </group>
      ))}
    </>
  );
}

/** Forklift dekoratif di dalam gudang & di area silo (bukan penghalang). */
function IdleForklifts() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const clock = useRef(0);
  const routes = [
    { a: [-30, -6], b: [-30, 12], product: "pcc" as OpsProductId, color: "#f2a93b" },
    { a: [4, -30], b: [22, -32], product: "opc" as OpsProductId, color: "#2fae66" },
  ];
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    routes.forEach((r, k) => {
      const g = refs.current[k];
      if (!g) return;
      const phase = (clock.current * 0.08 + k * 0.5) % 2;
      const t = phase < 1 ? phase : 2 - phase;
      const s = THREE.MathUtils.smoothstep(t, 0, 1);
      g.position.set(r.a[0] + (r.b[0] - r.a[0]) * s, 0, r.a[1] + (r.b[1] - r.a[1]) * s);
      const dir = phase < 1 ? 1 : -1;
      g.rotation.y = Math.atan2((r.b[0] - r.a[0]) * dir, (r.b[1] - r.a[1]) * dir);
    });
  });
  return (
    <>
      {routes.map((r, k) => (
        <group key={k} ref={(node) => { refs.current[k] = node; }}>
          <Forklift product={r.product} color={r.color} />
        </group>
      ))}
    </>
  );
}

/* ------------------------------ akar ------------------------------ */

const WORKER_PATHS: [number, number][][] = [
  [[16.2, -11], [16.2, 11]],
  [[-12, -17], [6, -17], [6, -16.4]],
  [[-4, 20], [8, 20], [8, 19.5]],
  [[-26, -12], [-26, 12]],
  [[12, -19.5], [24, -19.5]],
];

export function OpsScenery({
  quality,
  focus,
  dashRef,
  bayStatus,
  kilnRunning,
}: {
  quality: GameQuality;
  focus: RefObject<THREE.Group | null>;
  dashRef: RefObject<DashData>;
  bayStatus: ("empty" | "arriving" | "loading")[];
  kilnRunning: boolean;
}) {
  const smokeSources = useMemo<[number, number, number][]>(() => [[-40, 30.5, -28], [-6, 8, -26]], []);
  return (
    <>
      <color attach="background" args={[HORIZON]} />
      <fog attach="fog" args={[HORIZON, 70, 380]} />
      <SkyDome />
      <OpsSun focus={focus} quality={quality} />
      <Terrain quality={quality} />
      <YardFloor />
      <Roads />
      <WarehouseShed />
      <ErpOffice dashRef={dashRef} />
      <DockArea bayStatus={bayStatus} />
      <Borders />
      <ProductionArea kilnRunning={kilnRunning} />
      <Smoke sources={smokeSources} count={quality === "hemat" ? 14 : 30} />
      <ParkingAndGate />
      <Flags />
      <Vegetation quality={quality} />
      <Village />
      <Pylons />
      <PassingTraffic quality={quality} />
      <IdleForklifts />
      {WORKER_PATHS.slice(0, quality === "hemat" ? 3 : WORKER_PATHS.length).map((path, k) => (
        <Technician key={k} avatar={k % 2 ? "nara" : "arga"} path={path} delay={k * 1.3} />
      ))}
      <Clouds count={quality === "hemat" ? 8 : 16} center={WORLD_CENTER} />
      <Birds center={WORLD_CENTER} spread={0.8} />
    </>
  );
}
