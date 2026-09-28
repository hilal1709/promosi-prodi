"use client";

import { memo, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { GameQuality } from "@/lib/types";
import { Technician } from "../audit/data-center";
import { clampDelta } from "../world-kit";
import { fbm, seeded } from "./race-track";
import { Birds, canvasTexture, Clouds, HORIZON, InstancedSet, SkyDome } from "./race-scenery";
import {
  CITY,
  COAST,
  deckAt,
  droneTerrain,
  inPaddy,
  LAND_Y,
  PADDY_ZONES,
  PYLON_LINE,
  RAIL,
  railDistance,
  riverDistance,
  riverWidth,
  roadDistance,
  ROAD_HALF,
  ROADS,
  SITE,
  surfaceAt,
  TURBINES,
  VILLAGE,
  WATER_Y,
  type XZ,
} from "./drone-layout";

/* ------------------------------------------------------------------ */
/* Alam: langit, tanah, air, jalan, sawah, hutan, turbin               */
/* ------------------------------------------------------------------ */

type Inst = { p: [number, number, number]; r?: [number, number, number]; s?: number | [number, number, number]; c?: string };

const SUN_DIR = new THREE.Vector3(-0.45, 0.62, -0.64).normalize();
const smooth = THREE.MathUtils.smoothstep;
const pick = <T,>(list: T[], r: number) => list[Math.floor(r * list.length) % list.length];

export function DroneSun({ focus, quality }: { focus: RefObject<{ pos: THREE.Vector3 }>; quality: GameQuality }) {
  const light = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const size = quality === "tinggi" ? 2048 : 1024;
  useFrame(() => {
    const p = focus.current.pos;
    const x = Math.round(p.x / 4) * 4;
    const z = Math.round(p.z / 4) * 4;
    const y = Math.max(0, Math.round(p.y / 4) * 4 - 10);
    target.position.set(x, y, z);
    target.updateMatrixWorld();
    light.current?.position.set(x + SUN_DIR.x * 140, y + SUN_DIR.y * 140, z + SUN_DIR.z * 140);
  });
  return (
    <>
      <primitive object={target} />
      <ambientLight intensity={0.3} color="#fff6e8" />
      <hemisphereLight intensity={1.05} color="#dcefff" groundColor="#5f7a44" />
      <directionalLight
        ref={light}
        target={target}
        castShadow={quality !== "hemat"}
        intensity={2.3}
        color="#fff0d4"
        shadow-mapSize={[size, size]}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
        shadow-camera-near={1}
        shadow-camera-far={320}
        shadow-bias={-0.0004}
        shadow-normalBias={0.06}
      />
    </>
  );
}

/* ------------------------------ tanah ------------------------------ */

const GRASS_A = new THREE.Color("#5c9a43");
const GRASS_B = new THREE.Color("#8cbd5a");
const DRY = new THREE.Color("#b9b86c");
const FOREST = new THREE.Color("#3a6d33");
const ROCK = new THREE.Color("#8b8c7c");
const ROCK_DARK = new THREE.Color("#6d6a5f");
const PEAK = new THREE.Color("#e8ecef");
const SAND = new THREE.Color("#dccb95");
const MUD = new THREE.Color("#6f6446");
const PLAZA = new THREE.Color("#b7b09f");

/** Kisi tidak seragam: rapat di tengah (area main), renggang di kejauhan. */
const warp = (u: number, size: number) => size * (0.3 * u + 0.7 * u * u * u);

const Terrain = memo(function Terrain({ quality }: { quality: GameQuality }) {
  const geometry = useMemo(() => {
    const n = quality === "hemat" ? 190 : quality === "tinggi" ? 320 : 250;
    const size = 1500;
    const verts = new Float32Array((n + 1) * (n + 1) * 3);
    const colors = new Float32Array((n + 1) * (n + 1) * 3);
    const color = new THREE.Color();
    let i = 0;
    for (let iz = 0; iz <= n; iz++) {
      const z = warp((iz / n) * 2 - 1, size);
      for (let ix = 0; ix <= n; ix++) {
        const x = warp((ix / n) * 2 - 1, size);
        const h = droneTerrain(x, z);
        verts[i * 3] = x;
        verts[i * 3 + 1] = h;
        verts[i * 3 + 2] = z;
        const nz = fbm(x * 0.03, z * 0.03, 3);
        color.copy(GRASS_A).lerp(GRASS_B, THREE.MathUtils.clamp(nz * 1.6 - 0.3, 0, 1));
        color.lerp(DRY, smooth(fbm(x * 0.008 + 40, z * 0.008 - 11, 3), 0.55, 0.72) * 0.5);
        if (h > 5) color.lerp(FOREST, smooth(h, 5, 30) * 0.75);
        if (h > 60) color.lerp(ROCK, smooth(h, 60, 110));
        if (h > 100) color.lerp(ROCK_DARK, smooth(fbm(x * 0.05, z * 0.05, 2), 0.45, 0.7) * 0.6);
        if (h > 175) color.lerp(PEAK, smooth(h, 175, 230));
        const rd = riverDistance(x, z);
        const w = riverWidth(z);
        if (rd < w + 8) color.lerp(SAND, 1 - smooth(rd, w, w + 8));
        const coast = COAST(x);
        if (z > coast - 40 && h < 5) color.lerp(SAND, smooth(z - coast, -40, -10) * (1 - smooth(h, 2, 5)));
        if (h < WATER_Y + 0.2) color.copy(MUD);
        if (Math.hypot(x, z) < 40 || Math.hypot(x - CITY.x, z - CITY.z) < CITY.r + 6) color.lerp(PLAZA, 0.55);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
        i++;
      }
    }
    const index: number[] = [];
    for (let iz = 0; iz < n; iz++) {
      for (let ix = 0; ix < n; ix++) {
        const a = iz * (n + 1) + ix;
        const b = a + 1;
        const c = a + n + 1;
        const d = c + 1;
        index.push(a, c, b, b, c, d);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(verts, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.setIndex(index);
    geo.computeVertexNormals();
    return geo;
  }, [quality]);
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors flatShading roughness={1} />
    </mesh>
  );
});

const WATER_SIZE = 4000;
const WATER_REPEAT = 120;
const WATER_TILE = WATER_SIZE / WATER_REPEAT;

/** Air laut & sungai: satu bidang besar yang mengikuti kamera — tidak pernah terlihat ujungnya. */
function Water() {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const { camera } = useThree();
  const clock = useRef(0);
  const texture = useMemo(() => {
    const t = canvasTexture(256, 256, (g) => {
      g.fillStyle = "#3f93b8";
      g.fillRect(0, 0, 256, 256);
      const rand = seeded(31);
      for (let k = 0; k < 90; k++) {
        g.strokeStyle = `rgba(255,255,255,${0.08 + rand() * 0.14})`;
        g.lineWidth = 1 + rand() * 2;
        const x = rand() * 256;
        const y = rand() * 256;
        g.beginPath();
        g.moveTo(x, y);
        g.quadraticCurveTo(x + 8, y - 3, x + 18 + rand() * 12, y);
        g.stroke();
      }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(WATER_REPEAT, WATER_REPEAT);
    return t;
  }, []);
  useFrame((_, raw) => {
    const delta = clampDelta(raw);
    clock.current += delta;
    if (mesh.current) {
      // Digeser per satu ulangan tekstur supaya pola air tidak "melompat".
      const x = Math.round(camera.position.x / WATER_TILE) * WATER_TILE;
      const z = Math.round(camera.position.z / WATER_TILE) * WATER_TILE;
      mesh.current.position.set(x, WATER_Y, z);
      texture.offset.set(clock.current * 0.02, clock.current * 0.03);
    }
    if (material.current) material.current.emissiveIntensity = 0.12 + Math.sin(clock.current * 1.3) * 0.04;
  });
  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[WATER_SIZE, WATER_SIZE]} />
      <meshStandardMaterial ref={material} map={texture} color="#b8e3f2" emissive="#4fb1d6" emissiveIntensity={0.12} roughness={0.15} metalness={0.2} transparent opacity={0.9} />
    </mesh>
  );
}

/* ------------------------------ jalan & rel ------------------------------ */

/** Sampel ulang polyline setiap `step` satuan. */
function resample(poly: XZ[], step: number): XZ[] {
  const out: XZ[] = [poly[0]];
  for (let i = 1; i < poly.length; i++) {
    const [ax, az] = poly[i - 1];
    const [bx, bz] = poly[i];
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.ceil(len / step));
    for (let k = 1; k <= n; k++) out.push([ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n]);
  }
  return out;
}

/** Pita datar di atas dek (jalan/rel), dengan UV sepanjang lintasan. */
function stripGeometry(poly: XZ[], half: number, lift: number, uvLength: number) {
  const pts = resample(poly, 4);
  const verts: number[] = [];
  const uvs: number[] = [];
  const index: number[] = [];
  let dist = 0;
  pts.forEach((p, i) => {
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(pts.length - 1, i + 1)];
    let dx = next[0] - prev[0];
    let dz = next[1] - prev[1];
    const len = Math.hypot(dx, dz) || 1;
    dx /= len;
    dz /= len;
    if (i > 0) dist += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
    const y = deckAt(p[0], p[1]) + lift;
    verts.push(p[0] - dz * half, y, p[1] + dx * half, p[0] + dz * half, y, p[1] - dx * half);
    uvs.push(0, dist / uvLength, 1, dist / uvLength);
    if (i > 0) {
      const a = (i - 1) * 2;
      index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(index);
  geo.computeVertexNormals();
  return geo;
}

/** Titik-titik dek di atas air (untuk tiang jembatan & pagar). */
function bridgeSpots(poly: XZ[], every: number) {
  const pts = resample(poly, every);
  return pts
    .map((p, i) => {
      const next = pts[Math.min(pts.length - 1, i + 1)];
      const prev = pts[Math.max(0, i - 1)];
      return { x: p[0], z: p[1], heading: Math.atan2(next[0] - prev[0], next[1] - prev[1]), ground: droneTerrain(p[0], p[1]) };
    })
    .filter((p) => p.ground < LAND_Y - 0.4);
}

const Roads = memo(function Roads() {
  const road = useMemo(() => {
    const t = canvasTexture(128, 256, (g) => {
      g.fillStyle = "#3b3e45";
      g.fillRect(0, 0, 128, 256);
      const rand = seeded(4);
      for (let k = 0; k < 400; k++) {
        g.fillStyle = `rgba(255,255,255,${rand() * 0.05})`;
        g.fillRect(rand() * 128, rand() * 256, 2, 2);
      }
      g.fillStyle = "#e9e4d8";
      g.fillRect(6, 0, 4, 256);
      g.fillRect(118, 0, 4, 256);
      g.fillStyle = "#ffc857";
      g.fillRect(61, 0, 6, 140);
    });
    t.wrapT = THREE.RepeatWrapping;
    return t;
  }, []);
  const rail = useMemo(() => {
    const t = canvasTexture(128, 128, (g) => {
      g.fillStyle = "#8a7b66";
      g.fillRect(0, 0, 128, 128);
      g.fillStyle = "#6a4f35";
      for (let y = 4; y < 128; y += 16) g.fillRect(14, y, 100, 8);
      g.fillStyle = "#c7ccd2";
      g.fillRect(34, 0, 7, 128);
      g.fillRect(87, 0, 7, 128);
    });
    t.wrapT = THREE.RepeatWrapping;
    return t;
  }, []);
  const roadGeos = useMemo(() => ROADS.map((poly) => stripGeometry(poly, ROAD_HALF, 0.02, 14)), []);
  const railGeo = useMemo(() => stripGeometry(RAIL, 2.4, 0.04, 6), []);
  const bridges = useMemo(() => {
    const piers: Inst[] = [];
    const rails: Inst[] = [];
    const deck: Inst[] = [];
    [...ROADS.map((poly) => ({ poly, half: ROAD_HALF })), { poly: RAIL, half: 2.6 }].forEach(({ poly, half }) => {
      bridgeSpots(poly, 3).forEach((spot, k) => {
        const y = deckAt(spot.x, spot.z);
        deck.push({ p: [spot.x, y - 0.35, spot.z], r: [0, spot.heading, 0], s: [half * 2 + 0.8, 0.6, 3.2] });
        [-1, 1].forEach((side) => {
          const ox = Math.cos(spot.heading) * (half + 0.3) * side;
          const oz = -Math.sin(spot.heading) * (half + 0.3) * side;
          rails.push({ p: [spot.x + ox, y + 0.6, spot.z + oz], r: [0, spot.heading, 0], s: [0.25, 1.2, 3.1] });
          if (k % 4 === 0) piers.push({ p: [spot.x + ox * 0.7, (y + spot.ground) / 2 - 1, spot.z + oz * 0.7], s: [1, y - spot.ground + 2, 1] });
        });
      });
    });
    return { piers, rails, deck };
  }, []);
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const pier = useMemo(() => new THREE.CylinderGeometry(0.7, 0.9, 1, 8), []);
  return (
    <group>
      {roadGeos.map((geo, k) => (
        <mesh key={k} geometry={geo} receiveShadow>
          <meshStandardMaterial map={road} roughness={0.95} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
        </mesh>
      ))}
      <mesh geometry={railGeo} receiveShadow>
        <meshStandardMaterial map={rail} roughness={0.95} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
      </mesh>
      <InstancedSet items={bridges.deck} geometry={box} color="#b9b3a8" />
      <InstancedSet items={bridges.rails} geometry={box} color="#d94f3d" shadow={false} />
      <InstancedSet items={bridges.piers} geometry={pier} color="#a8a294" />
    </group>
  );
});

/* ------------------------------ sawah ------------------------------ */

const Paddies = memo(function Paddies() {
  const texture = useMemo(() => {
    const t = canvasTexture(512, 512, (g) => {
      const rand = seeded(8);
      for (let px = 0; px < 4; px++) {
        for (let pz = 0; pz < 4; pz++) {
          const wet = rand() > 0.62;
          g.fillStyle = wet ? "#8fb9a8" : rand() > 0.5 ? "#7fb342" : rand() > 0.5 ? "#a6c455" : "#c9c264";
          g.fillRect(px * 128, pz * 128, 128, 128);
          g.strokeStyle = wet ? "#6f9f5a" : "#5f9433";
          g.lineWidth = wet ? 2 : 3;
          for (let y = pz * 128 + 6; y < (pz + 1) * 128; y += 9) {
            g.beginPath();
            g.moveTo(px * 128 + 5, y);
            g.lineTo((px + 1) * 128 - 5, y);
            g.stroke();
          }
          g.strokeStyle = "#a08a5c";
          g.lineWidth = 6;
          g.strokeRect(px * 128 + 3, pz * 128 + 3, 122, 122);
        }
      }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }, []);
  const huts = useMemo(() => PADDY_ZONES.map((zone, k) => ({ x: zone.x + (k % 2 ? 1 : -1) * zone.w * 0.32, z: zone.z - zone.d * 0.3, rot: zone.rot })), []);
  return (
    <group>
      {PADDY_ZONES.map((zone, k) => {
        const tex = texture.clone();
        tex.needsUpdate = true;
        tex.repeat.set(zone.w / 40, zone.d / 40);
        return (
          <mesh key={k} position={[zone.x, LAND_Y + 0.05, zone.z]} rotation={[-Math.PI / 2, 0, zone.rot]} receiveShadow>
            <planeGeometry args={[zone.w, zone.d]} />
            <meshStandardMaterial map={tex} roughness={0.9} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
          </mesh>
        );
      })}
      {huts.map((hut, k) => (
        <group key={k} position={[hut.x, LAND_Y, hut.z]} rotation={[0, hut.rot, 0]}>
          {[-1.2, 1.2].flatMap((x) =>
            [-1, 1].map((z) => (
              <mesh key={`${x}:${z}`} position={[x, 1.2, z]} castShadow>
                <boxGeometry args={[0.18, 2.4, 0.18]} />
                <meshStandardMaterial color="#6a4f35" />
              </mesh>
            ))
          )}
          <mesh position={[0, 1, 0]}>
            <boxGeometry args={[2.8, 0.15, 2.4]} />
            <meshStandardMaterial color="#9b7a4f" />
          </mesh>
          <mesh position={[0, 2.9, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[2.4, 1.4, 4]} />
            <meshStandardMaterial color="#c9a96b" flatShading />
          </mesh>
        </group>
      ))}
      {PADDY_ZONES.slice(0, 3).map((zone, k) => (
        <group key={`f${k}`} position={[zone.x, LAND_Y, zone.z]}>
          <Technician avatar={k % 2 ? "nara" : "arga"} path={[[-zone.w * 0.3, -zone.d * 0.2], [zone.w * 0.25, -zone.d * 0.2], [zone.w * 0.25, zone.d * 0.2]]} delay={k * 1.7} />
        </group>
      ))}
    </group>
  );
});

/* ------------------------------ vegetasi ------------------------------ */

const LEAF_COLORS = ["#3f7a34", "#4f8a3a", "#5d9a3f", "#356b2e", "#6aa446", "#7fae4a"];
const PINE_COLORS = ["#2f5f3a", "#355f33", "#2c5433", "#3d6b3c"];
const FLOWER_COLORS = ["#e86a8f", "#f2c14e", "#ffffff", "#c86ad8", "#f26b3a"];

const Vegetation = memo(function Vegetation({ quality }: { quality: GameQuality }) {
  const sets = useMemo(() => {
    const rand = seeded(42);
    const trunks: Inst[] = [];
    const crowns: Inst[] = [];
    const pines: Inst[] = [];
    const palmTrunks: Inst[] = [];
    const palmCrowns: Inst[] = [];
    const bushes: Inst[] = [];
    const flowers: Inst[] = [];
    const rocks: Inst[] = [];
    const candidates = quality === "hemat" ? 4200 : quality === "tinggi" ? 11000 : 7200;
    const blocked = (x: number, z: number) =>
      roadDistance(x, z) < ROAD_HALF + 4 ||
      railDistance(x, z) < 6 ||
      riverDistance(x, z) < riverWidth(z) + 3 ||
      inPaddy(x, z, 3) ||
      Math.hypot(x - CITY.x, z - CITY.z) < CITY.r + 4 ||
      Math.hypot(x, z) < 46 ||
      Object.values(SITE).some((s) => Math.hypot(x - s.x, z - s.z) < 42);
    for (let k = 0; k < candidates; k++) {
      // Lebih rapat di dekat area main, tetap ada sampai jauh ke pegunungan.
      const a = rand() * Math.PI * 2;
      const r = Math.pow(rand(), 0.85) * 900;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const h = droneTerrain(x, z);
      if (h < LAND_Y - 0.1 || h > 230 || blocked(x, z)) continue;
      const forest = fbm(x * 0.012 + 70, z * 0.012 - 30, 3);
      const nearCoast = z > COAST(x) - 70;
      const s = 0.8 + rand() * 0.7;
      if (h > 70 || (h > 30 && rand() < 0.5)) {
        if (rand() > 0.35 + smooth(h, 150, 230)) pines.push({ p: [x, h - 0.3, z], r: [0, rand() * 6, 0], s: [s * 1.5, s * (1.8 + rand()), s * 1.5], c: pick(PINE_COLORS, rand()) });
        else if (rand() < 0.4) rocks.push({ p: [x, h, z], r: [rand(), rand() * 6, rand()], s: 1.5 + rand() * 4, c: rand() > 0.5 ? "#8b8c7c" : "#a19f92" });
        continue;
      }
      if (nearCoast && rand() < 0.7) {
        const lean = (rand() - 0.5) * 0.3;
        palmTrunks.push({ p: [x, h + 4 * s, z], r: [lean, rand() * 6, lean], s: [s, s, s] });
        palmCrowns.push({ p: [x + lean * 8 * s, h + 8.2 * s, z - lean * 8 * s], r: [0, rand() * 6, 0], s: [s * 1.2, s * 0.8, s * 1.2], c: pick(LEAF_COLORS, rand()) });
        continue;
      }
      if (forest < 0.47 && rand() > 0.3) {
        if (rand() < 0.25) bushes.push({ p: [x, h + 0.4, z], r: [0, rand() * 6, 0], s: 0.9 + rand() * 0.8, c: pick(LEAF_COLORS, rand()) });
        else if (rand() < 0.15) flowers.push({ p: [x, h + 0.25, z], s: 0.6 + rand() * 0.6, c: pick(FLOWER_COLORS, rand()) });
        continue;
      }
      trunks.push({ p: [x, h + 1.5 * s, z], s: [s, s, s] });
      crowns.push({ p: [x, h + (3.8 + rand()) * s, z], r: [rand(), rand() * 6, 0], s: [s * (2 + rand()), s * (1.8 + rand() * 0.8), s * (2 + rand())], c: pick(LEAF_COLORS, rand()) });
    }
    // Pohon kelapa & pisang di kampung.
    for (let k = 0; k < 26; k++) {
      const a = rand() * Math.PI * 2;
      const r = VILLAGE.r * (0.3 + rand() * 0.8);
      const x = VILLAGE.x + Math.cos(a) * r;
      const z = VILLAGE.z + Math.sin(a) * r;
      if (roadDistance(x, z) < ROAD_HALF + 3) continue;
      const s = 0.8 + rand() * 0.4;
      palmTrunks.push({ p: [x, LAND_Y + 4 * s, z], r: [0.08, rand() * 6, 0.05], s });
      palmCrowns.push({ p: [x + 0.6, LAND_Y + 8.2 * s, z - 0.4], r: [0, rand() * 6, 0], s: [s * 1.2, s * 0.8, s * 1.2], c: pick(LEAF_COLORS, rand()) });
    }
    return { trunks, crowns, pines, palmTrunks, palmCrowns, bushes, flowers, rocks };
  }, [quality]);
  const geo = useMemo(
    () => ({
      trunk: new THREE.CylinderGeometry(0.22, 0.34, 3, 6),
      crown: new THREE.IcosahedronGeometry(1, 0),
      pine: (() => {
        const g = new THREE.ConeGeometry(1.4, 5.5, 7);
        g.translate(0, 3.2, 0);
        return g;
      })(),
      palmTrunk: new THREE.CylinderGeometry(0.18, 0.28, 8, 6),
      palmCrown: (() => {
        const g = new THREE.ConeGeometry(2.6, 1.2, 7, 1, true);
        g.rotateX(Math.PI);
        return g;
      })(),
      bush: new THREE.IcosahedronGeometry(1, 0),
      flower: new THREE.DodecahedronGeometry(0.5, 0),
      rock: new THREE.DodecahedronGeometry(1, 0),
    }),
    []
  );
  return (
    <group>
      <InstancedSet items={sets.trunks} geometry={geo.trunk} color="#6b4f36" />
      <InstancedSet items={sets.crowns} geometry={geo.crown} />
      <InstancedSet items={sets.pines} geometry={geo.pine} />
      <InstancedSet items={sets.palmTrunks} geometry={geo.palmTrunk} color="#8a6d4b" />
      <InstancedSet items={sets.palmCrowns} geometry={geo.palmCrown} side={THREE.DoubleSide} />
      <InstancedSet items={sets.bushes} geometry={geo.bush} shadow={false} />
      <InstancedSet items={sets.flowers} geometry={geo.flower} shadow={false} />
      <InstancedSet items={sets.rocks} geometry={geo.rock} />
    </group>
  );
});

/* ------------------------------ turbin & listrik ------------------------------ */

function Turbine({ x, z, phase }: { x: number; z: number; phase: number }) {
  const rotor = useRef<THREE.Group>(null);
  const y = surfaceAt(x, z);
  useFrame((_, raw) => {
    if (rotor.current) rotor.current.rotation.z += clampDelta(raw) * 0.9;
  });
  const facing = Math.atan2(-x, -z);
  return (
    <group position={[x, y, z]} rotation={[0, facing, 0]}>
      <mesh position={[0, 18, 0]} castShadow>
        <cylinderGeometry args={[0.5, 1.1, 36, 10]} />
        <meshStandardMaterial color="#f4f4f2" />
      </mesh>
      <mesh position={[0, 36.4, 0.6]} castShadow>
        <boxGeometry args={[1.6, 1.6, 4]} />
        <meshStandardMaterial color="#f4f4f2" />
      </mesh>
      <group ref={rotor} position={[0, 36.4, 2.8]} rotation={[0, 0, phase]}>
        <mesh>
          <sphereGeometry args={[0.8, 10, 8]} />
          <meshStandardMaterial color="#e9e9e6" />
        </mesh>
        {[0, 1, 2].map((k) => (
          <group key={k} rotation={[0, 0, (k * Math.PI * 2) / 3]}>
            <mesh position={[0, 8.6, 0.2]} castShadow>
              <boxGeometry args={[0.9, 17, 0.2]} />
              <meshStandardMaterial color="#f7f7f5" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

const Pylons = memo(function Pylons() {
  const data = useMemo(() => {
    const towers = PYLON_LINE.map(([x, z], i) => {
      const next = PYLON_LINE[Math.min(PYLON_LINE.length - 1, i + 1)];
      const prev = PYLON_LINE[Math.max(0, i - 1)];
      return { x, z, y: surfaceAt(x, z), heading: Math.atan2(next[0] - prev[0], next[1] - prev[1]) };
    });
    const lines: THREE.Line[] = [];
    const material = new THREE.LineBasicMaterial({ color: "#3a3f47" });
    [-3, 3].forEach((side) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i < towers.length - 1; i++) {
        const a = towers[i];
        const b = towers[i + 1];
        const ax = a.x + Math.cos(a.heading) * side;
        const az = a.z - Math.sin(a.heading) * side;
        const bx = b.x + Math.cos(b.heading) * side;
        const bz = b.z - Math.sin(b.heading) * side;
        for (let k = 0; k <= 12; k++) {
          const t = k / 12;
          const sag = Math.sin(t * Math.PI) * 3.5;
          pts.push(new THREE.Vector3(ax + (bx - ax) * t, a.y + 21 + (b.y - a.y) * t - sag, az + (bz - az) * t));
        }
      }
      lines.push(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), material));
    });
    return { towers, lines };
  }, []);
  return (
    <group>
      {data.towers.map((t, k) => (
        <group key={k} position={[t.x, t.y, t.z]} rotation={[0, t.heading, 0]}>
          <mesh position={[0, 11, 0]} castShadow>
            <cylinderGeometry args={[0.35, 1.6, 22, 4]} />
            <meshStandardMaterial color="#8c939c" metalness={0.5} wireframe />
          </mesh>
          <mesh position={[0, 21, 0]} castShadow>
            <boxGeometry args={[7, 0.3, 0.3]} />
            <meshStandardMaterial color="#8c939c" metalness={0.5} />
          </mesh>
        </group>
      ))}
      {data.lines.map((line, k) => (
        <primitive key={k} object={line} />
      ))}
    </group>
  );
});

/* ------------------------------ akar ------------------------------ */

export function DroneNature({ quality, focus }: { quality: GameQuality; focus: RefObject<{ pos: THREE.Vector3 }> }) {
  const cloudCenter = useMemo(() => ({ x: 0, z: 0 }), []);
  const birdsA = useMemo(() => ({ x: -60, z: -120 }), []);
  const birdsB = useMemo(() => ({ x: 120, z: 150 }), []);
  return (
    <>
      <color attach="background" args={[HORIZON]} />
      <fog attach="fog" args={[HORIZON, 160, 900]} />
      <SkyDome />
      <DroneSun focus={focus} quality={quality} />
      <Terrain quality={quality} />
      <Water />
      <Roads />
      <Paddies />
      <Vegetation quality={quality} />
      <Pylons />
      {TURBINES.map(([x, z], k) => (
        <Turbine key={k} x={x} z={z} phase={k * 0.7} />
      ))}
      <Clouds count={quality === "hemat" ? 10 : 22} center={cloudCenter} />
      <Birds center={birdsA} spread={1.4} />
      {quality !== "hemat" && <Birds center={birdsB} spread={1.1} />}
    </>
  );
}

