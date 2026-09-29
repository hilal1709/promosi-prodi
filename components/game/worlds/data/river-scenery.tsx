"use client";

import { memo, useLayoutEffect, useMemo, useRef, type ReactNode, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { GameQuality } from "@/lib/types";
import { clampDelta } from "../world-kit";
import { fbm, seeded } from "../erp/race-track";
import { Birds, canvasTexture, Clouds, InstancedSet } from "../erp/race-scenery";
import {
  ARCH_S,
  axisCoords,
  bankPoint,
  BRIDGES,
  CHUNKS,
  DOCK_START,
  frameAt,
  heightFromFrame,
  HOUSES,
  isNear,
  L,
  RIVER,
  SAMPANS,
  sampanAt,
  SAMPLES,
  SIDE_FALLS,
  toWorld,
  WATERFALLS,
  waterY,
  WHEELS,
  widthAt,
  zoneAt,
  zoneWeights,
  type Flora,
  type FloraKind,
  type Inst,
} from "./river-layout";

export type Focus = RefObject<{ pos: THREE.Vector3; s: number }>;

/** Grup yang hanya tampil bila rentang s-nya dekat dengan pemain. */
export function Near({ s0, s1 = s0, children }: { s0: number; s1?: number; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) ref.current.visible = isNear(s0, s1);
  });
  return <group ref={ref}>{children}</group>;
}

const smooth = THREE.MathUtils.smoothstep;
const clamp = THREE.MathUtils.clamp;
const pick = <T,>(list: T[], r: number) => list[Math.floor(r * list.length) % list.length];

/* ------------------------------------------------------------------ */
/* Langit tropis pagi, warna cakrawala = warna kabut (batas tak terlihat) */
/* ------------------------------------------------------------------ */

export const RIVER_HORIZON = "#e3ead6";
const SKY_TOP = "#3f93dc";
const SKY_WARM = "#ffd6a3";
const SUN_DIR = new THREE.Vector3(0.5, 0.58, -0.64).normalize();

const srgb = (hex: string) => {
  const c = new THREE.Color();
  c.setStyle(hex, THREE.SRGBColorSpace);
  const out = { r: 0, g: 0, b: 0 };
  c.getRGB(out, THREE.SRGBColorSpace);
  return new THREE.Vector3(out.r, out.g, out.b);
};

function RiverSky() {
  const mesh = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        toneMapped: false,
        uniforms: {
          top: { value: srgb(SKY_TOP) },
          horizon: { value: srgb(RIVER_HORIZON) },
          warm: { value: srgb(SKY_WARM) },
          sunDir: { value: SUN_DIR.clone() },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 top;
          uniform vec3 horizon;
          uniform vec3 warm;
          uniform vec3 sunDir;
          varying vec3 vDir;
          void main() {
            vec3 d = normalize(vDir);
            float h = max(d.y, 0.0);
            float s = max(dot(d, sunDir), 0.0);
            vec3 col = mix(horizon, top, pow(h, 0.5));
            col = mix(col, warm, pow(s, 3.0) * 0.4 * smoothstep(0.0, 0.25, h) * (1.0 - h));
            col += vec3(1.0, 0.95, 0.8) * (pow(s, 900.0) * 1.3 + pow(s, 40.0) * 0.22);
            gl_FragColor = vec4(min(col, vec3(1.0)), 1.0);
          }`,
      }),
    []
  );
  useFrame(() => mesh.current?.position.copy(camera.position));
  return (
    <mesh ref={mesh} material={material} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[900, 32, 16]} />
    </mesh>
  );
}

function RiverSun({ focus, quality }: { focus: Focus; quality: GameQuality }) {
  const light = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const size = quality === "tinggi" ? 2048 : 1024;
  useFrame(() => {
    const p = focus.current.pos;
    const x = Math.round(p.x / 4) * 4;
    const z = Math.round(p.z / 4) * 4;
    const y = Math.round(p.y / 4) * 4;
    target.position.set(x, y, z);
    target.updateMatrixWorld();
    light.current?.position.set(x + SUN_DIR.x * 120, y + SUN_DIR.y * 120, z + SUN_DIR.z * 120);
  });
  return (
    <>
      <primitive object={target} />
      <ambientLight intensity={0.34} color="#fff4e2" />
      <hemisphereLight intensity={1.05} color="#dff0ff" groundColor="#5f7a44" />
      <directionalLight
        ref={light}
        target={target}
        castShadow={quality !== "hemat"}
        intensity={2.4}
        color="#fff0d2"
        shadow-mapSize={[size, size]}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-camera-near={1}
        shadow-camera-far={300}
        shadow-bias={-0.0004}
        shadow-normalBias={0.06}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Tanah                                                               */
/* ------------------------------------------------------------------ */

const C = (hex: string) => new THREE.Color(hex);
const LUSH = C("#4f9a3c");
const LUSH_B = C("#6cb24a");
const EARTH = C("#b99a6b");
const MEADOW = C("#8cae55");
const RICE = C("#a4c954");
const PADDY = C("#7fb0a0");
const RISER = C("#6f7f3a");
const STRATA = [C("#c46a44"), C("#d98b5f"), C("#a8513a"), C("#e0a676")];
const MESA = C("#7a9a45");
const MUD = C("#6d6246");
const MARSH = C("#5f8f45");
const BED = C("#8a7d55");
const SAND = C("#d8c690");
const FOREST = C("#3f7336");
const HIGH = C("#6f8660");
const MIST = C("#9faa98");

const Terrain = memo(function Terrain({ quality }: { quality: GameQuality }) {
  const geometry = useMemo(() => {
    const step = quality === "hemat" ? 6 : quality === "tinggi" ? 3.4 : 4.4;
    const b = RIVER.bounds;
    const xs = axisCoords(b.minX - 900, b.minX - 110, b.maxX + 110, b.maxX + 900, step);
    const zs = axisCoords(b.minZ - 900, b.minZ - 110, b.maxZ + 110, b.maxZ + 900, step * 1.15);
    const nx = xs.length;
    const nz = zs.length;
    const verts = new Float32Array(nx * nz * 3);
    const colors = new Float32Array(nx * nz * 3);
    const color = new THREE.Color();
    let i = 0;
    for (let iz = 0; iz < nz; iz++) {
      const z = zs[iz];
      for (let ix = 0; ix < nx; ix++) {
        const x = xs[ix];
        const f = frameAt(x, z);
        const h = heightFromFrame(x, z, f);
        verts[i * 3] = x;
        verts[i * 3 + 1] = h;
        verts[i * 3 + 2] = z;
        const wy = waterY(f.s);
        const t = f.dist - widthAt(f.s) / 2;
        const zw = zoneWeights(f.s);
        const n = fbm(x * 0.05, z * 0.05, 2);
        color.copy(LUSH).lerp(LUSH_B, clamp(n * 1.8 - 0.5, 0, 1));
        if (zw.pasar > 0.01) {
          const c = new THREE.Color().copy(MEADOW);
          if (t > 1 && t < 16) c.lerp(EARTH, (1 - smooth(t, 10, 16)) * 0.75);
          color.lerp(c, zw.pasar);
        }
        if (zw.sawah > 0.01 && t > 2 && t < 90) {
          const off = t - 3;
          const cell = off % 8.5;
          const flat = cell > 0.9 && cell < 7.8;
          const wet = fbm(Math.floor(off / 8.5) * 3.1 + x * 0.02, z * 0.02, 1) > 0.55;
          const c = flat ? (wet ? PADDY : RICE) : RISER;
          color.lerp(c, zw.sawah * (1 - smooth(t, 70, 90)));
        }
        if (zw.ngarai > 0.01) {
          const band = STRATA[((Math.floor(h / 2.6) % 4) + 4) % 4];
          const c = new THREE.Color().copy(band);
          if (t > 34) c.lerp(MESA, smooth(t, 34, 60) * 0.8);
          color.lerp(c, zw.ngarai);
        }
        if (zw.bakau > 0.01) color.lerp(h < wy + 0.35 ? MUD : MARSH, zw.bakau * 0.85);
        // Pegunungan jauh.
        if (h > wy + 24 && zw.ngarai < 0.6) color.lerp(FOREST, smooth(h, wy + 24, wy + 50) * 0.8);
        if (h > 110) color.lerp(HIGH, smooth(h, 110, 180));
        if (h > 180) color.lerp(MIST, smooth(h, 180, 260));
        // Tepi pasir & dasar sungai.
        if (t > -1.5 && t < 2.2 && zw.ngarai < 0.5) color.lerp(SAND, (1 - smooth(Math.abs(t - 0.3), 0.4, 1.9)) * 0.8);
        if (h < wy - 0.2) color.copy(BED).lerp(MUD, smooth(h, wy - 0.3, wy - 2));
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
        i++;
      }
    }
    const index = new Uint32Array((nx - 1) * (nz - 1) * 6);
    let k = 0;
    for (let iz = 0; iz < nz - 1; iz++) {
      for (let ix = 0; ix < nx - 1; ix++) {
        const a = iz * nx + ix;
        const b2 = a + 1;
        const c = a + nx;
        const d = c + 1;
        index[k++] = a;
        index[k++] = c;
        index[k++] = b2;
        index[k++] = b2;
        index[k++] = c;
        index[k++] = d;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(verts, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.setIndex(new THREE.BufferAttribute(index, 1));
    geo.computeVertexNormals();
    return geo;
  }, [quality]);
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors flatShading roughness={1} />
    </mesh>
  );
});

/* ------------------------------------------------------------------ */
/* Air sungai: pita mengikuti aliran, tekstur bergulir searah arus      */
/* ------------------------------------------------------------------ */

const DEEP = C("#3f8fb0");
const CANYON_WATER = C("#3a7d8f");
const LAGOON_WATER = C("#46b7b0");
const FOAM = C("#eef8f8");

function makeWaterTexture() {
  {
    const t = canvasTexture(256, 256, (g) => {
      g.fillStyle = "#d4eaf0";
      g.fillRect(0, 0, 256, 256);
      const rand = seeded(8);
      for (let k = 0; k < 140; k++) {
        g.strokeStyle = `rgba(255,255,255,${0.12 + rand() * 0.3})`;
        g.lineWidth = 1 + rand() * 2.5;
        const x = rand() * 256;
        const y = rand() * 256;
        g.beginPath();
        g.moveTo(x, y);
        g.quadraticCurveTo(x + 3, y + 10, x + (rand() - 0.5) * 6, y + 18 + rand() * 18);
        g.stroke();
      }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }
}

const RiverWater = memo(function RiverWater() {
  const texture = useMemo(() => makeWaterTexture(), []);
  const lagoonTex = useMemo(() => {
    const t = texture.clone();
    t.repeat.set(10, 10);
    t.needsUpdate = true;
    return t;
  }, [texture]);
  const clock = useRef(0);
  const scroll = useRef({ texture, lagoonTex });
  const geometry = useMemo(() => {
    const COLS = 12;
    const rows: number[] = [];
    for (let i = 0; i < SAMPLES; i += 2) rows.push(i);
    if (rows[rows.length - 1] !== SAMPLES - 1) rows.push(SAMPLES - 1);
    const verts: number[] = [];
    const uvs: number[] = [];
    const cols: number[] = [];
    const c = new THREE.Color();
    rows.forEach((i) => {
      const s = i * RIVER.step;
      const half = widthAt(s) / 2 + 3.5;
      const wy = waterY(s);
      const zw = zoneWeights(s);
      let foamAlong = 0;
      for (const fall of WATERFALLS) if (s > fall.s - 1.5) foamAlong = Math.max(foamAlong, 1 - smooth(s - fall.s, 3, 30));
      for (let k = 0; k <= COLS; k++) {
        const u = k / COLS;
        const lat = (u * 2 - 1) * half;
        const p = toWorld(s, lat);
        verts.push(p.x, wy, p.z);
        uvs.push((lat + 60) / 7, s / 9);
        const edge = Math.abs(u * 2 - 1);
        c.copy(DEEP).lerp(CANYON_WATER, zw.ngarai).lerp(LAGOON_WATER, zw.bakau * 0.7);
        const foam = Math.max(smooth(edge, 0.72, 0.95) * 0.55, clamp(foamAlong, 0, 1) * 0.9, zw.ngarai * 0.18);
        c.lerp(FOAM, foam);
        cols.push(c.r, c.g, c.b);
      }
    });
    const index: number[] = [];
    for (let r = 0; r < rows.length - 1; r++) {
      for (let k = 0; k < COLS; k++) {
        const a = r * (COLS + 1) + k;
        const b = a + 1;
        const d = a + COLS + 1;
        const e = d + 1;
        index.push(a, b, d, b, e, d);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
    geo.setIndex(index);
    geo.computeVertexNormals();
    return geo;
  }, []);
  const ends = useMemo(() => {
    const a = toWorld(0, 0);
    const b = toWorld(L, 0);
    return [
      { x: a.x, z: a.z, y: waterY(0), r: widthAt(0) / 2 + 4 },
      { x: b.x, z: b.z, y: waterY(L), r: widthAt(L) / 2 + 6 },
    ];
  }, []);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    scroll.current.texture.offset.y = -clock.current * 0.62;
    scroll.current.lagoonTex.offset.set(clock.current * 0.01, -clock.current * 0.02);
  });
  return (
    <>
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial map={texture} vertexColors roughness={0.32} metalness={0.1} emissive="#2f8fb0" emissiveIntensity={0.12} transparent opacity={0.9} />
      </mesh>
      {ends.map((end, k) => (
        <mesh key={k} position={[end.x, end.y - 0.02, end.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[end.r, 40]} />
          <meshStandardMaterial map={lagoonTex} color={k ? "#4cc2b8" : "#4b9fbe"} roughness={0.32} metalness={0.1} emissive="#2f8fb0" emissiveIntensity={0.12} transparent opacity={0.9} />
        </mesh>
      ))}
    </>
  );
});

/* ------------------------------------------------------------------ */
/* Flora instanced ber-angin, dipotong per chunk sepanjang sungai       */
/* ------------------------------------------------------------------ */

function merge(parts: THREE.BufferGeometry[]) {
  const geo = mergeGeometries(parts.map((part) => (part.index ? part.toNonIndexed() : part)));
  geo.computeVertexNormals();
  return geo;
}

const put = (geo: THREE.BufferGeometry, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, s: number | [number, number, number] = 1) => {
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
    typeof s === "number" ? new THREE.Vector3(s, s, s) : new THREE.Vector3(...s)
  );
  return geo.applyMatrix4(m);
};

function useFloraGeometries() {
  return useMemo(() => {
    const culms: THREE.BufferGeometry[] = [];
    const bambooLeaves: THREE.BufferGeometry[] = [];
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      const lean = 0.08 + (k % 3) * 0.05;
      const h = 6.5 + (k % 3) * 1.4;
      const ox = Math.cos(a) * 0.35;
      const oz = Math.sin(a) * 0.35;
      culms.push(put(new THREE.CylinderGeometry(0.07, 0.1, h, 5), ox + Math.cos(a) * lean * h * 0.5, h / 2, oz + Math.sin(a) * lean * h * 0.5, Math.sin(a) * lean, 0, -Math.cos(a) * lean));
      for (let j = 0; j < 3; j++) {
        const y = h * (0.55 + j * 0.17);
        bambooLeaves.push(put(new THREE.ConeGeometry(0.55 - j * 0.1, 1.5, 4), ox + Math.cos(a) * lean * y + Math.cos(a) * 0.4, y, oz + Math.sin(a) * lean * y + Math.sin(a) * 0.4, Math.PI * 0.62, a, 0, [1, 1, 0.35]));
      }
    }
    const banana = merge([
      put(new THREE.CylinderGeometry(0.16, 0.24, 2.2, 6), 0, 1.1, 0),
      ...[0, 1, 2, 3, 4, 5].map((k) => put(new THREE.BoxGeometry(0.5, 0.03, 2), Math.cos(k * 1.05) * 0.8, 2.25, Math.sin(k * 1.05) * 0.8, 0.45, -k * 1.05 + Math.PI / 2, 0)),
    ]);
    const palmTrunk = merge([
      put(new THREE.CylinderGeometry(0.2, 0.28, 2.4, 6), 0, 1.2, 0, 0, 0, 0.05),
      put(new THREE.CylinderGeometry(0.17, 0.2, 2.4, 6), 0.22, 3.5, 0, 0, 0, 0.14),
      put(new THREE.CylinderGeometry(0.14, 0.17, 2.2, 6), 0.62, 5.7, 0, 0, 0, 0.24),
    ]);
    const palmTop = merge([
      ...[0, 1, 2, 3, 4, 5, 6].map((k) => put(new THREE.BoxGeometry(0.45, 0.04, 2.6), 0.85 + Math.cos(k * 0.9) * 1.1, 6.55, Math.sin(k * 0.9) * 1.1, 0.42, -k * 0.9 + Math.PI / 2, 0)),
      put(new THREE.SphereGeometry(0.3, 6, 4), 0.85, 6.55, 0),
    ]);
    const jungleTrunk = put(new THREE.CylinderGeometry(0.22, 0.34, 3, 6), 0, 1.5, 0);
    const jungleTop = merge([
      put(new THREE.IcosahedronGeometry(1.9, 1), 0, 4, 0),
      put(new THREE.IcosahedronGeometry(1.35, 1), 1.1, 3.4, 0.5),
      put(new THREE.IcosahedronGeometry(1.25, 1), -1, 3.5, -0.4),
    ]);
    const fern = merge([0, 1, 2, 3, 4, 5, 6].map((k) => put(new THREE.ConeGeometry(0.16, 1.3, 3), Math.cos(k * 0.9) * 0.45, 0.4, Math.sin(k * 0.9) * 0.45, Math.cos(k * 0.9) * 1, 0, -Math.sin(k * 0.9) * 1 + 0, [1, 1, 0.3])));
    const mangroveRoots = merge([
      ...[0, 1, 2, 3, 4, 5].map((k) => put(new THREE.CylinderGeometry(0.05, 0.07, 1.8, 4), Math.cos(k * 1.05) * 0.55, 0.7, Math.sin(k * 1.05) * 0.55, Math.sin(k * 1.05) * 0.55, 0, -Math.cos(k * 1.05) * 0.55)),
      put(new THREE.CylinderGeometry(0.16, 0.2, 2.2, 6), 0, 2.4, 0),
    ]);
    const mangroveTop = merge([put(new THREE.IcosahedronGeometry(1.7, 1), 0, 4, 0, 0, 0, 0, [1.2, 0.75, 1.2]), put(new THREE.IcosahedronGeometry(1.1, 1), 0.9, 3.7, 0.3)]);
    const rice = merge([0, 1, 2, 3, 4, 5].map((k) => put(new THREE.ConeGeometry(0.035, 0.75 + (k % 3) * 0.1, 3), Math.cos(k * 1.1) * 0.1, 0.38, Math.sin(k * 1.1) * 0.1, Math.cos(k) * 0.2, 0, Math.sin(k * 2) * 0.2)));
    const grass = merge([0, 1, 2, 3, 4].map((k) => put(new THREE.ConeGeometry(0.06, 0.62 + (k % 3) * 0.12, 3), Math.cos(k * 1.3) * 0.12, 0.32, Math.sin(k * 1.3) * 0.12, Math.cos(k) * 0.25, 0, Math.sin(k * 2) * 0.25)));
    const reed = merge([
      put(new THREE.ConeGeometry(0.04, 1.6, 3), 0, 0.8, 0),
      put(new THREE.ConeGeometry(0.035, 1.3, 3), 0.12, 0.65, 0.05, 0, 0, -0.12),
      put(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 5), 0.02, 1.45, 0),
    ]);
    const stem = merge([put(new THREE.CylinderGeometry(0.018, 0.025, 0.55, 3), 0, 0.27, 0), put(new THREE.ConeGeometry(0.07, 0.25, 3), 0.06, 0.12, 0, 0, 0, -0.5)]);
    const bloom = merge([
      put(new THREE.IcosahedronGeometry(0.06, 0), 0, 0.58, 0),
      ...[0, 1, 2, 3, 4].map((k) => put(new THREE.SphereGeometry(0.07, 4, 3), Math.cos((k / 5) * Math.PI * 2) * 0.09, 0.56, Math.sin((k / 5) * Math.PI * 2) * 0.09, 0, 0, 0, [1, 0.35, 1])),
    ]);
    const rock = new THREE.DodecahedronGeometry(0.6, 0);
    const redRock = new THREE.IcosahedronGeometry(1, 0);
    const shrub = put(new THREE.IcosahedronGeometry(0.8, 1), 0, 0.45, 0, 0, 0, 0, [1.2, 0.75, 1.1]);
    const farTrunk = put(new THREE.CylinderGeometry(0.2, 0.3, 2, 5), 0, 1, 0);
    const farTop = merge([put(new THREE.IcosahedronGeometry(1.6, 0), 0, 3.2, 0, 0, 0, 0, [1, 1.3, 1]), put(new THREE.ConeGeometry(1.2, 2, 6), 0, 4.8, 0)]);
    const lily = merge([put(new THREE.CylinderGeometry(0.5, 0.5, 0.03, 9, 1, false, 0.4, Math.PI * 2 - 0.4), 0, 0, 0)]);
    return { culms: merge(culms), bambooLeaves: merge(bambooLeaves), banana, palmTrunk, palmTop, jungleTrunk, jungleTop, fern, mangroveRoots, mangroveTop, rice, grass, reed, stem, bloom, rock, redRock, shrub, farTrunk, farTop, lily };
  }, []);
}

const WIND = { value: 0 };

function swayMaterial(color: string, amp: number) {
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true, side: THREE.DoubleSide });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWind = WIND;
    shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nuniform float uWind;").replace(
      "#include <begin_vertex>",
      /* glsl */ `#include <begin_vertex>
      #ifdef USE_INSTANCING
        vec3 root = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
      #else
        vec3 root = vec3(0.0);
      #endif
      float bend = max(position.y, 0.0) * ${amp.toFixed(3)};
      float gust = sin(uWind * 1.6 + root.x * 0.21 + root.z * 0.13) * 0.6 + sin(uWind * 3.1 + root.x * 0.7) * 0.25;
      transformed.x += gust * bend;
      transformed.z += cos(uWind * 1.3 + root.z * 0.19) * bend * 0.55;`
    );
  };
  material.customProgramCacheKey = () => `sway-${amp}`;
  return material;
}

function WindClock() {
  useFrame((_, raw) => {
    WIND.value += clampDelta(raw);
  });
  return null;
}

function SwaySet({ items, geometry, color = "#ffffff", amp }: { items: Inst[]; geometry: THREE.BufferGeometry; color?: string; amp: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const tinted = items.some((it) => it.c);
  const material = useMemo(() => swayMaterial(tinted ? "#ffffff" : color, amp), [tinted, color, amp]);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    items.forEach((it, i) => {
      o.position.set(it.p[0], it.p[1], it.p[2]);
      o.rotation.set(it.r?.[0] ?? 0, it.r?.[1] ?? 0, it.r?.[2] ?? 0);
      const s = it.s ?? 1;
      if (typeof s === "number") o.scale.setScalar(s);
      else o.scale.set(s[0], s[1], s[2]);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
      if (it.c) mesh.setColorAt(i, col.set(it.c));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items]);
  if (!items.length) return null;
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} receiveShadow />;
}

const strip = (items: Inst[]) => items.map(({ p, r, s }) => ({ p, r, s }));

const FloraChunk = memo(function FloraChunk({ flora, k, shadow }: { flora: Flora; k: number; shadow: boolean }) {
  const g = useFloraGeometries();
  const get = (kind: FloraKind) => flora[kind][k];
  const plain = useMemo(
    () => ({
      jungle: strip(flora.jungle[k]),
      far: strip(flora.farTree[k]),
      mangrove: strip(flora.mangrove[k]),
      flower: strip(flora.flower[k]),
    }),
    [flora, k]
  );
  return (
    <group>
      <SwaySet items={get("bamboo")} geometry={g.culms} color="#a3c24c" amp={0.025} />
      <SwaySet items={get("bamboo")} geometry={g.bambooLeaves} color="#5f9e35" amp={0.03} />
      <SwaySet items={get("banana")} geometry={g.banana} color="#6fb33f" amp={0.05} />
      <InstancedSet items={get("palm")} geometry={g.palmTrunk} color="#8b6b4a" shadow={shadow} />
      <SwaySet items={get("palm")} geometry={g.palmTop} color="#4f9a3c" amp={0.022} />
      <InstancedSet items={plain.jungle} geometry={g.jungleTrunk} color="#6e4d31" shadow={shadow} />
      <InstancedSet items={get("jungle")} geometry={g.jungleTop} shadow={shadow} />
      <SwaySet items={get("fern")} geometry={g.fern} color="#4a8f3a" amp={0.12} />
      <InstancedSet items={plain.mangrove} geometry={g.mangroveRoots} color="#6b5440" shadow={shadow} />
      <InstancedSet items={get("mangrove")} geometry={g.mangroveTop} color="#3d7a3a" shadow={shadow} />
      <SwaySet items={get("rice")} geometry={g.rice} amp={0.22} />
      <SwaySet items={get("grass")} geometry={g.grass} amp={0.22} />
      <SwaySet items={get("reed")} geometry={g.reed} color="#8a9a4a" amp={0.14} />
      <SwaySet items={plain.flower} geometry={g.stem} color="#5c9a3e" amp={0.2} />
      <SwaySet items={get("flower")} geometry={g.bloom} amp={0.2} />
      <InstancedSet items={get("rock")} geometry={g.rock} shadow={shadow} />
      <InstancedSet items={get("redRock")} geometry={g.redRock} shadow={shadow} />
      <InstancedSet items={get("shrub")} geometry={g.shrub} shadow={false} />
      <InstancedSet items={plain.far} geometry={g.farTrunk} color="#5a3f28" shadow={false} />
      <InstancedSet items={get("farTree")} geometry={g.farTop} shadow={false} />
      <InstancedSet items={get("lily")} geometry={g.lily} shadow={false} />
    </group>
  );
});

function FloraAll({ flora, quality }: { flora: Flora; quality: GameQuality }) {
  const shadow = quality !== "hemat";
  return (
    <>
      {Array.from({ length: CHUNKS }, (_, k) => (
        <Near key={k} s0={(k / CHUNKS) * L - 30} s1={((k + 1) / CHUNKS) * L + 30}>
          <FloraChunk flora={flora} k={k} shadow={shadow} />
        </Near>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Rumah panggung, dermaga, jembatan, kincir                            */
/* ------------------------------------------------------------------ */

export function StiltHouse({ wall = "#e9d8a6", roof = "#9c3d2e", glow, children }: { wall?: string; roof?: string; glow?: string; children?: ReactNode }) {
  return (
    <group>
      {[[-1.9, -1.5], [1.9, -1.5], [-1.9, 1.5], [1.9, 1.5]].map(([x, z], k) => (
        <mesh key={k} position={[x, 0.9, z]} castShadow>
          <cylinderGeometry args={[0.13, 0.15, 2.4, 6]} />
          <meshStandardMaterial color="#6b4a2f" />
        </mesh>
      ))}
      <mesh position={[0, 2.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.4, 0.2, 3.6]} />
        <meshStandardMaterial color="#8a6a45" />
      </mesh>
      <mesh position={[0, 3.3, -0.2]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 2.3, 2.8]} />
        <meshStandardMaterial color={wall} emissive={glow ?? "#000000"} emissiveIntensity={glow ? 0.35 : 0} />
      </mesh>
      <mesh position={[0, 5.15, -0.2]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <cylinderGeometry args={[0.01, 2.9, 1.6, 4, 1]} />
        <meshStandardMaterial color={roof} flatShading />
      </mesh>
      <mesh position={[0, 3, 1.21]}>
        <boxGeometry args={[0.9, 1.6, 0.05]} />
        <meshStandardMaterial color="#4a3526" />
      </mesh>
      {[-1.25, 1.25].map((x) => (
        <mesh key={x} position={[x, 3.5, 1.21]}>
          <boxGeometry args={[0.7, 0.6, 0.05]} />
          <meshStandardMaterial color="#2e3a44" emissive="#ffcf7a" emissiveIntensity={0.15} />
        </mesh>
      ))}
      {/* Tangga ke air */}
      {[0, 1, 2, 3].map((k) => (
        <mesh key={k} position={[0, 1.8 - k * 0.45, 1.95 + k * 0.35]} castShadow>
          <boxGeometry args={[1, 0.08, 0.35]} />
          <meshStandardMaterial color="#7a5a3a" />
        </mesh>
      ))}
      {children}
    </group>
  );
}

const Village = memo(function Village() {
  return (
    <>
      {HOUSES.map((house, k) => (
        <Near key={k} s0={house.s}>
        <group position={[house.x, house.y - 0.3, house.z]} rotation={[0, house.rot, 0]} scale={house.scale}>
          <StiltHouse wall={house.color} roof={house.roof} />
          {k % 3 === 0 && (
            <group position={[2.8, 0, 0.5]}>
              {[-0.9, 0.9].map((x) => (
                <mesh key={x} position={[0, 0.9, x]}>
                  <cylinderGeometry args={[0.04, 0.04, 1.8, 4]} />
                  <meshStandardMaterial color="#6b4a2f" />
                </mesh>
              ))}
              {["#e63946", "#ffd166", "#4cc9f0", "#f1faee"].map((c, i) => (
                <mesh key={c} position={[0, 1.45, -0.6 + i * 0.4]}>
                  <boxGeometry args={[0.04, 0.5, 0.32]} />
                  <meshStandardMaterial color={c} side={THREE.DoubleSide} />
                </mesh>
              ))}
            </group>
          )}
        </group>
        </Near>
      ))}
    </>
  );
});

function Smoke() {
  const puffs = useMemo(() => HOUSES.filter((_, k) => k % 2 === 0).slice(0, 8), []);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const clock = useRef(0);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const house = puffs[Math.floor(i / 3)];
      const t = (clock.current * 0.35 + (i % 3) / 3) % 1;
      mesh.position.set(house.x + t * 1.5, house.y + 5.5 * house.scale + t * 6, house.z + t * 0.8);
      mesh.scale.setScalar(0.4 + t * 1.3);
      (mesh.material as THREE.MeshStandardMaterial).opacity = 0.45 * (1 - t);
    });
  });
  return (
    <>
      {puffs.flatMap((_, h) =>
        [0, 1, 2].map((j) => (
          <mesh key={`${h}-${j}`} ref={(node) => { refs.current[h * 3 + j] = node; }}>
            <icosahedronGeometry args={[0.6, 0]} />
            <meshStandardMaterial color="#e8e6e0" transparent opacity={0.4} depthWrite={false} flatShading />
          </mesh>
        ))
      )}
    </>
  );
}

function StartDock() {
  const p = DOCK_START;
  const flags = useRef<(THREE.Mesh | null)[]>([]);
  const clock = useRef(0);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    flags.current.forEach((flag, i) => {
      if (flag) flag.rotation.y = Math.sin(clock.current * 3 + i) * 0.35;
    });
  });
  const wy = waterY(0);
  return (
    <group position={[p.x, wy, p.z]} rotation={[0, p.rot, 0]}>
      <group position={[0, 0, -3.6]}>
      <mesh position={[0, 0.45, 2.5]} receiveShadow castShadow>
        <boxGeometry args={[3.2, 0.18, 8]} />
        <meshStandardMaterial color="#9a7a52" />
      </mesh>
      {[-1.4, 1.4].flatMap((x) =>
        [0, 2.6, 5.2].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0, z]} castShadow>
            <cylinderGeometry args={[0.13, 0.15, 1.8, 6]} />
            <meshStandardMaterial color="#6b4a2f" />
          </mesh>
        ))
      )}
      {[-1.4, 1.4].map((x, i) => (
        <group key={x} position={[x, 0, 6.2]}>
          <mesh position={[0, 2, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 3.4, 5]} />
            <meshStandardMaterial color="#e9ecef" />
          </mesh>
          <mesh ref={(node) => { flags.current[i] = node; }} position={[0, 3.3, 0]}>
            <boxGeometry args={[0.03, 0.6, 1]} />
            <meshStandardMaterial color={i ? "#ffc857" : "#7ee8fa"} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
      </group>
    </group>
  );
}

function RopeBridge({ s }: { s: number }) {
  const parts = useMemo(() => {
    const half = widthAt(s) / 2 + 4;
    const wy = waterY(s);
    const deck = wy + 5.6;
    const heading = Math.atan2(RIVER.fx[Math.round(s / RIVER.step)], RIVER.fz[Math.round(s / RIVER.step)]);
    const planks = [];
    const N = Math.round(half * 1.6);
    for (let k = 0; k <= N; k++) {
      const lat = -half + (k / N) * half * 2;
      const sag = Math.cos((lat / half) * Math.PI * 0.5) * 1.1;
      const p = toWorld(s, lat);
      planks.push({ x: p.x, y: deck - sag, z: p.z });
    }
    const posts = [-1, 1].map((side) => {
      const p = toWorld(s, side * (half + 0.6));
      const f = frameAt(p.x, p.z);
      return { x: p.x, z: p.z, y: Math.max(heightFromFrame(p.x, p.z, f), wy + 0.5) };
    });
    return { planks, posts, heading, deck };
  }, [s]);
  return (
    <group>
      {parts.planks.map((pl, k) => (
        <group key={k} position={[pl.x, pl.y, pl.z]} rotation={[0, parts.heading, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.5, 0.08, 0.5]} />
            <meshStandardMaterial color={k % 5 === 0 ? "#6f5236" : "#9a7a52"} />
          </mesh>
          {[-0.75, 0.75].map((x) => (
            <mesh key={x} position={[x, 0.55, 0]}>
              <cylinderGeometry args={[0.025, 0.025, 1.1, 3]} />
              <meshStandardMaterial color="#c9b48a" />
            </mesh>
          ))}
          {k % 4 === 2 && (
            <mesh position={[0.75, 0.9, 0]}>
              <sphereGeometry args={[0.16, 8, 6]} />
              <meshStandardMaterial color="#ff6b4a" emissive="#ff6b4a" emissiveIntensity={0.7} />
            </mesh>
          )}
        </group>
      ))}
      {parts.posts.map((post, k) => (
        <group key={k} position={[post.x, post.y, post.z]} rotation={[0, parts.heading, 0]}>
          {[-0.8, 0.8].map((x) => (
            <mesh key={x} position={[x, (parts.deck - post.y) / 2 + 0.8, 0]} castShadow>
              <cylinderGeometry args={[0.14, 0.18, parts.deck - post.y + 1.6, 6]} />
              <meshStandardMaterial color="#6b4a2f" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function WaterWheel({ s, side }: { s: number; side: 1 | -1 }) {
  const wheel = useRef<THREE.Group>(null);
  const p = useMemo(() => toWorld(s, side * (widthAt(s) / 2 + 0.2)), [s, side]);
  const heading = useMemo(() => Math.atan2(RIVER.fx[Math.round(s / RIVER.step)], RIVER.fz[Math.round(s / RIVER.step)]), [s]);
  const wy = waterY(s);
  useFrame((_, raw) => {
    if (wheel.current) wheel.current.rotation.x += clampDelta(raw) * 0.9;
  });
  return (
    <group position={[p.x, wy + 1.4, p.z]} rotation={[0, heading, 0]}>
      <group ref={wheel}>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[2.2, 0.1, 5, 18]} />
          <meshStandardMaterial color="#7a5a3a" />
        </mesh>
        {Array.from({ length: 10 }, (_, k) => (
          <mesh key={k} rotation={[(k / 10) * Math.PI * 2, 0, 0]} position={[0, 0, 0]}>
            <boxGeometry args={[0.8, 0.08, 4.6]} />
            <meshStandardMaterial color="#8a6a45" />
          </mesh>
        ))}
      </group>
      <mesh position={[side * 1.4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 2.8, 6]} />
        <meshStandardMaterial color="#5a3f28" />
      </mesh>
      <mesh position={[side * 2.4, 0.4, 0]}>
        <boxGeometry args={[0.5, 3.2, 0.5]} />
        <meshStandardMaterial color="#6b4a2f" />
      </mesh>
    </group>
  );
}

function Kites() {
  const kites = useMemo(() => {
    const rand = seeded(71);
    return [0.47, 0.53, 0.58].map((f, k) => {
      const s = f * L;
      const side = k % 2 ? 1 : -1;
      const anchor = bankPoint(s, side, 30 + rand() * 20);
      return { anchor, color: ["#e63946", "#ffd166", "#4cc9f0"][k], phase: rand() * 6 };
    });
  }, []);
  const refs = useRef<(THREE.Group | null)[]>([]);
  const clock = useRef(0);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    refs.current.forEach((g, k) => {
      if (!g) return;
      const t = clock.current + kites[k].phase;
      g.position.set(kites[k].anchor.x + Math.sin(t * 0.5) * 3, kites[k].anchor.y + 26 + Math.sin(t * 0.8) * 2, kites[k].anchor.z + Math.cos(t * 0.4) * 3);
      g.rotation.z = Math.sin(t * 1.3) * 0.3;
    });
  });
  return (
    <>
      {kites.map((kite, k) => (
        <group key={k} ref={(node) => { refs.current[k] = node; }}>
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[1.8, 1.8, 0.04]} />
            <meshStandardMaterial color={kite.color} side={THREE.DoubleSide} />
          </mesh>
          {[0, 1, 2, 3].map((j) => (
            <mesh key={j} position={[0, -1.6 - j * 0.7, 0]} rotation={[0, 0, j % 2 ? 0.4 : -0.4]}>
              <boxGeometry args={[0.3, 0.12, 0.02]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Ngarai: air terjun samping, lengkung batu, kabut                     */
/* ------------------------------------------------------------------ */

function makeFallTexture() {
  {
    const t = canvasTexture(64, 256, (g) => {
      g.fillStyle = "#cfeff5";
      g.fillRect(0, 0, 64, 256);
      const rand = seeded(19);
      for (let k = 0; k < 60; k++) {
        g.fillStyle = `rgba(255,255,255,${0.3 + rand() * 0.5})`;
        g.fillRect(rand() * 64, rand() * 256, 1 + rand() * 3, 10 + rand() * 40);
      }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, 2);
    return t;
  }
}

function Mist({ points, count }: { points: { x: number; y: number; z: number; r: number }[]; count: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const seeds = useMemo(() => {
    const rand = seeded(3);
    return Array.from({ length: count * points.length }, (_, i) => ({ src: i % points.length, a: rand() * 6.28, d: rand(), t: rand() }));
  }, [points, count]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame((_, raw) => {
    const m = mesh.current;
    if (!m) return;
    const delta = clampDelta(raw);
    seeds.forEach((sd, i) => {
      sd.t = (sd.t + delta * 0.35) % 1;
      const p = points[sd.src];
      dummy.position.set(p.x + Math.cos(sd.a) * p.r * sd.d * (0.4 + sd.t), p.y + sd.t * 3.5, p.z + Math.sin(sd.a) * p.r * sd.d * (0.4 + sd.t));
      dummy.scale.setScalar((0.5 + sd.t * 1.4) * (1 - sd.t * 0.6));
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, seeds.length]} frustumCulled={false}>
      <icosahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial color="#ffffff" transparent opacity={0.35} depthWrite={false} emissive="#ffffff" emissiveIntensity={0.3} />
    </instancedMesh>
  );
}

function Waterfalls({ lush }: { lush: boolean }) {
  const texture = useMemo(() => makeFallTexture(), []);
  const scroll = useRef(texture);
  const clock = useRef(0);
  const falls = useMemo(() => {
    const side = SIDE_FALLS.map((fall) => {
      const half = widthAt(fall.s) / 2;
      const p = toWorld(fall.s, fall.side * (half + 1.2));
      const wy = waterY(fall.s);
      return { x: p.x, z: p.z, y: wy, h: fall.h, rot: Math.atan2(RIVER.fx[Math.round(fall.s / RIVER.step)], RIVER.fz[Math.round(fall.s / RIVER.step)]) + (fall.side > 0 ? -Math.PI / 2 : Math.PI / 2), w: 3.2 };
    });
    const src = toWorld(0, 0);
    const back = { x: src.x - RIVER.fx[0] * 4, z: src.z - RIVER.fz[0] * 4 };
    const source = { x: back.x, z: back.z, y: waterY(0), h: 16, rot: Math.atan2(RIVER.fx[0], RIVER.fz[0]), w: 9 };
    return [...side, source];
  }, []);
  const main = useMemo(
    () =>
      WATERFALLS.map((fall) => {
        const p = toWorld(fall.s + 3.5, 0);
        return { x: p.x, y: waterY(fall.s + 4), z: p.z, r: widthAt(fall.s) / 2 };
      }),
    []
  );
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    scroll.current.offset.y = clock.current * 1.4;
  });
  const mistPoints = useMemo(() => [...falls.map((f) => ({ x: f.x, y: f.y, z: f.z, r: 2.4 })), ...main.map((m) => ({ x: m.x, y: m.y, z: m.z, r: m.r * 0.8 }))], [falls, main]);
  return (
    <>
      {falls.map((fall, k) => (
        <group key={k} position={[fall.x, fall.y, fall.z]} rotation={[0, fall.rot, 0]}>
          <mesh position={[0, fall.h / 2, -0.4]}>
            <planeGeometry args={[fall.w, fall.h, 1, 4]} />
            <meshStandardMaterial map={texture} transparent opacity={0.85} emissive="#bfeaf2" emissiveIntensity={0.25} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          <mesh position={[0, 0.08, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[fall.w * 0.8, 16]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.7} depthWrite={false} />
          </mesh>
        </group>
      ))}
      {main.map((m, k) => (
        <mesh key={k} position={[m.x, m.y + 0.06, m.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[m.r * 0.2, m.r * 1.05, 24]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.5} depthWrite={false} />
        </mesh>
      ))}
      <Mist points={mistPoints} count={lush ? 14 : 7} />
    </>
  );
}

function RockArch() {
  const arch = useMemo(() => {
    const p = toWorld(ARCH_S, 0);
    const half = widthAt(ARCH_S) / 2;
    return { x: p.x, z: p.z, y: waterY(ARCH_S), r: half + 5, rot: Math.atan2(RIVER.fx[Math.round(ARCH_S / RIVER.step)], RIVER.fz[Math.round(ARCH_S / RIVER.step)]) };
  }, []);
  return (
    <group position={[arch.x, arch.y + 3, arch.z]} rotation={[0, arch.rot, 0]}>
      <mesh castShadow receiveShadow>
        <torusGeometry args={[arch.r, 2.6, 6, 16, Math.PI]} />
        <meshStandardMaterial color="#c46a44" flatShading roughness={1} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * arch.r, -2, 0]} castShadow>
          <dodecahedronGeometry args={[3.2, 0]} />
          <meshStandardMaterial color="#a8513a" flatShading />
        </mesh>
      ))}
      {[-0.6, 0, 0.6].map((a) => (
        <mesh key={a} position={[Math.sin(a) * arch.r, Math.cos(a) * arch.r - 1.8, 0]}>
          <cylinderGeometry args={[0.05, 0.02, 3.4, 3]} />
          <meshStandardMaterial color="#3f7a35" />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Kehidupan: warga, kerbau, bangau, sampan, ikan, capung, kunang-kunang */
/* ------------------------------------------------------------------ */

export function Person({ shirt, hat = true, pose = 0 }: { shirt: string; hat?: boolean; pose?: number }) {
  return (
    <group>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.16, 0.18, 0.9, 6]} />
        <meshStandardMaterial color="#3d405b" />
      </mesh>
      <mesh position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.24, 0.65, 7]} />
        <meshStandardMaterial color={shirt} />
      </mesh>
      <mesh position={[0, 1.66, 0]}>
        <sphereGeometry args={[0.2, 10, 8]} />
        <meshStandardMaterial color="#c68b59" />
      </mesh>
      {hat && (
        <mesh position={[0, 1.86, 0]}>
          <coneGeometry args={[0.46, 0.26, 12]} />
          <meshStandardMaterial color="#d9b86c" flatShading />
        </mesh>
      )}
      <group position={[0.26, 1.4, 0]} rotation={[0, 0, pose]} name="arm">
        <mesh position={[0, -0.28, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.56, 5]} />
          <meshStandardMaterial color={shirt} />
        </mesh>
      </group>
    </group>
  );
}

function Villagers() {
  const people = useMemo(() => {
    const rand = seeded(88);
    const shirts = ["#e76f51", "#2a9d8f", "#e9c46a", "#f4a261", "#8ecae6", "#b5838d"];
    const list: { x: number; y: number; z: number; s: number; rot: number; shirt: string; wave: boolean; bend: boolean; phase: number }[] = [];
    for (let k = 0; k < 12; k++) {
      const s = (0.14 + rand() * 0.27) * L;
      const side = rand() > 0.5 ? 1 : -1;
      const p = bankPoint(s, side, 2.2 + rand() * 4);
      list.push({ x: p.x, y: p.y, z: p.z, s, rot: p.rot, shirt: pick(shirts, rand()), wave: rand() > 0.35, bend: false, phase: rand() * 6 });
    }
    for (let k = 0; k < 8; k++) {
      const s = (0.44 + rand() * 0.2) * L;
      const side = rand() > 0.5 ? 1 : -1;
      const p = bankPoint(s, side, 5 + Math.floor(rand() * 5) * 8.5);
      list.push({ x: p.x, y: p.y, z: p.z, s, rot: rand() * 6, shirt: pick(shirts, rand()), wave: false, bend: true, phase: rand() * 6 });
    }
    for (let k = 0; k < 4; k++) {
      const s = (0.81 + rand() * 0.12) * L;
      const side = rand() > 0.5 ? 1 : -1;
      const p = bankPoint(s, side, 2 + rand() * 3);
      list.push({ x: p.x, y: p.y, z: p.z, s, rot: p.rot, shirt: pick(shirts, rand()), wave: true, bend: false, phase: rand() * 6 });
    }
    return list;
  }, []);
  const refs = useRef<(THREE.Group | null)[]>([]);
  const clock = useRef(0);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    refs.current.forEach((g, k) => {
      if (!g) return;
      const person = people[k];
      const t = clock.current + person.phase;
      const arm = g.getObjectByName("arm");
      if (person.wave && arm) arm.rotation.z = Math.PI * 0.75 + Math.sin(t * 7) * 0.35;
      if (person.bend) g.rotation.x = 0.55 + Math.sin(t * 0.8) * 0.12;
    });
  });
  return (
    <>
      {people.map((person, k) => (
        <Near key={k} s0={person.s}>
          <group position={[person.x, person.y, person.z]} rotation={[0, person.rot, 0]}>
            <group ref={(node) => { refs.current[k] = node; }}>
              <Person shirt={person.shirt} hat={person.bend || k % 3 === 0} />
            </group>
          </group>
        </Near>
      ))}
    </>
  );
}

function Buffalo({ x, y, z, rot, phase }: { x: number; y: number; z: number; rot: number; phase: number }) {
  const head = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Mesh>(null);
  const clock = useRef(phase);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    if (head.current) head.current.rotation.x = 0.3 + Math.sin(clock.current * 0.7) * 0.25;
    if (tail.current) tail.current.rotation.z = Math.sin(clock.current * 4) * 0.4;
  });
  return (
    <group position={[x, y, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[1, 0.9, 2]} />
        <meshStandardMaterial color="#4a4a52" />
      </mesh>
      {[[-0.35, -0.7], [0.35, -0.7], [-0.35, 0.7], [0.35, 0.7]].map(([lx, lz], k) => (
        <mesh key={k} position={[lx, 0.3, lz]}>
          <boxGeometry args={[0.22, 0.6, 0.22]} />
          <meshStandardMaterial color="#3b3b42" />
        </mesh>
      ))}
      <group ref={head} position={[0, 1.2, 1.05]}>
        <mesh position={[0, -0.1, 0.35]}>
          <boxGeometry args={[0.55, 0.55, 0.75]} />
          <meshStandardMaterial color="#44444c" />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.45, 0.2, 0.2]} rotation={[0, 0, side * -1.1]}>
            <coneGeometry args={[0.08, 0.7, 5]} />
            <meshStandardMaterial color="#e9e2d0" />
          </mesh>
        ))}
      </group>
      <mesh ref={tail} position={[0, 1.1, -1.05]}>
        <cylinderGeometry args={[0.03, 0.03, 0.8, 3]} />
        <meshStandardMaterial color="#3b3b42" />
      </mesh>
    </group>
  );
}

function Herds() {
  const herd = useMemo(() => {
    const rand = seeded(15);
    return [0.46, 0.5, 0.56, 0.63].map((f, k) => {
      const p = bankPoint(f * L, k % 2 ? 1 : -1, 8 + Math.floor(rand() * 4) * 8.5 + 3);
      return { ...p, phase: rand() * 6 };
    });
  }, []);
  return (
    <>
      {herd.map((b, k) => (
        <Near key={k} s0={b.s}>
          <Buffalo x={b.x} y={b.y} z={b.z} rot={b.rot + 1.2} phase={b.phase} />
        </Near>
      ))}
    </>
  );
}

function Herons() {
  const birds = useMemo(() => {
    const rand = seeded(44);
    return Array.from({ length: 9 }, () => {
      const s = (rand() > 0.5 ? 0.44 + rand() * 0.2 : 0.8 + rand() * 0.14) * L;
      const side = rand() > 0.5 ? 1 : -1;
      const p = toWorld(s, side * (widthAt(s) / 2 - 1));
      return { x: p.x, z: p.z, y: waterY(s), rot: rand() * 6, phase: rand() * 6 };
    });
  }, []);
  const refs = useRef<(THREE.Group | null)[]>([]);
  const clock = useRef(0);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    refs.current.forEach((g, k) => {
      if (g) g.rotation.x = Math.max(0, Math.sin(clock.current * 0.9 + birds[k].phase)) * 0.6;
    });
  });
  return (
    <>
      {birds.map((bird, k) => (
        <group key={k} position={[bird.x, bird.y, bird.z]} rotation={[0, bird.rot, 0]}>
          {[-0.08, 0.08].map((x) => (
            <mesh key={x} position={[x, 0.4, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.9, 3]} />
              <meshStandardMaterial color="#e0a458" />
            </mesh>
          ))}
          <mesh position={[0, 1.05, 0]} rotation={[0.3, 0, 0]}>
            <sphereGeometry args={[0.3, 8, 6]} />
            <meshStandardMaterial color="#f8f9fa" />
          </mesh>
          <group ref={(node) => { refs.current[k] = node; }} position={[0, 1.2, 0.2]}>
            <mesh position={[0, 0.3, 0.05]} rotation={[0.3, 0, 0]}>
              <cylinderGeometry args={[0.04, 0.05, 0.6, 4]} />
              <meshStandardMaterial color="#f8f9fa" />
            </mesh>
            <mesh position={[0, 0.62, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.05, 0.4, 4]} />
              <meshStandardMaterial color="#f4a261" />
            </mesh>
          </group>
        </group>
      ))}
    </>
  );
}

function Sampans() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const paddles = useRef<(THREE.Group | null)[]>([]);
  const clock = useRef(0);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    SAMPANS.forEach((_, k) => {
      const g = refs.current[k];
      if (!g) return;
      const st = sampanAt(k, clock.current);
      toWorld(st.s, st.lat, v);
      g.position.set(v.x, waterY(st.s) + Math.sin(clock.current * 2 + k) * 0.05, v.z);
      g.rotation.y = Math.atan2(RIVER.fx[Math.round(st.s / RIVER.step)], RIVER.fz[Math.round(st.s / RIVER.step)]) + (st.dir < 0 ? Math.PI : 0);
      const p = paddles.current[k];
      if (p) p.rotation.x = Math.sin(clock.current * 2.4 + k) * 0.6;
    });
  });
  return (
    <>
      {SAMPANS.map((boat, k) => (
        <group key={k} ref={(node) => { refs.current[k] = node; }}>
          <mesh position={[0, 0.2, 0]} castShadow>
            <boxGeometry args={[1.3, 0.45, 4.2]} />
            <meshStandardMaterial color={boat.color} />
          </mesh>
          {[-1, 1].map((end) => (
            <mesh key={end} position={[0, 0.35, end * 2.35]} rotation={[end * 0.5, 0, 0]}>
              <boxGeometry args={[0.9, 0.35, 0.8]} />
              <meshStandardMaterial color={boat.color} />
            </mesh>
          ))}
          <mesh position={[0, 0.44, 0]}>
            <boxGeometry args={[1.1, 0.05, 3.9]} />
            <meshStandardMaterial color="#7a5a3a" />
          </mesh>
          {k % 2 === 0 && (
            <mesh position={[0, 0.9, 0.9]}>
              <boxGeometry args={[0.8, 0.8, 0.8]} />
              <meshStandardMaterial color="#d9c49a" />
            </mesh>
          )}
          <group position={[0, 0.2, -1.2]} scale={0.8}>
            <Person shirt={["#e63946", "#2a9d8f", "#ffd166"][k % 3]} />
          </group>
          <group ref={(node) => { paddles.current[k] = node; }} position={[0.55, 1.1, -1.2]}>
            <mesh position={[0, -0.6, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 1.8, 4]} />
              <meshStandardMaterial color="#8a6a45" />
            </mesh>
            <mesh position={[0, -1.45, 0]}>
              <boxGeometry args={[0.05, 0.5, 0.22]} />
              <meshStandardMaterial color="#8a6a45" />
            </mesh>
          </group>
        </group>
      ))}
    </>
  );
}

/** Ikan melompat di dekat pemain. */
function Fish({ focus }: { focus: Focus }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const state = useMemo(() => Array.from({ length: 5 }, (_, k) => ({ t: -k * 1.3, s: 0, lat: 0, dir: 1 })), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, raw) => {
    const delta = clampDelta(raw);
    state.forEach((f, k) => {
      f.t += delta;
      const g = refs.current[k];
      if (!g) return;
      if (f.t > 1.1) {
        f.t = -1.5 - Math.random() * 4;
        f.s = Math.min(L - 5, focus.current.s + 14 + Math.random() * 40);
        f.lat = (Math.random() * 2 - 1) * (widthAt(f.s) / 2 - 2);
        f.dir = Math.random() > 0.5 ? 1 : -1;
      }
      if (f.t < 0) {
        g.visible = false;
        return;
      }
      g.visible = true;
      const u = f.t / 1.1;
      toWorld(f.s, f.lat + (u - 0.5) * 2.4 * f.dir, v);
      g.position.set(v.x, waterY(f.s) + Math.sin(u * Math.PI) * 1.5, v.z);
      g.rotation.set(0, headingAt(f.s) + (f.dir > 0 ? -Math.PI / 2 : Math.PI / 2), (u - 0.5) * 2.4);
    });
  });
  return (
    <>
      {state.map((_, k) => (
        <group key={k} ref={(node) => { refs.current[k] = node; }} visible={false}>
          <mesh rotation={[0, 0, 0]} scale={[0.18, 0.28, 0.6]}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial color={k % 2 ? "#f4a261" : "#adb5bd"} metalness={0.4} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, -0.62]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.2, 0.3, 3]} />
            <meshStandardMaterial color={k % 2 ? "#e76f51" : "#8d99ae"} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function headingAt(s: number) {
  const i = Math.round(clamp(s / RIVER.step, 0, SAMPLES - 1));
  return Math.atan2(RIVER.fx[i], RIVER.fz[i]);
}

/** Capung, kupu-kupu & kunang-kunang yang selalu berada di sekitar pemain. */
function Critters({ focus, count }: { focus: Focus; count: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const glow = useRef<THREE.InstancedMesh>(null);
  const bugs = useMemo(() => {
    const rand = seeded(9);
    return Array.from({ length: count }, (_, k) => ({ ox: (rand() * 2 - 1) * 24, oz: rand() * 60 - 14, y: 0.6 + rand() * 2.8, ph: rand() * 6, sp: 0.6 + rand(), c: k % 3 }));
  }, [count]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colors = useMemo(() => ["#7ee8fa", "#ffd166", "#ef476f"].map((c) => new THREE.Color(c)), []);
  const clock = useRef(0);
  const v = useMemo(() => new THREE.Vector3(), []);
  useLayoutEffect(() => {
    bugs.forEach((bug, i) => mesh.current?.setColorAt(i, colors[bug.c]));
    if (mesh.current?.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, [bugs, colors]);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    const t = clock.current;
    const s0 = focus.current.s;
    const canyon = zoneAt(s0).id === "ngarai";
    bugs.forEach((bug, i) => {
      const s = clamp(s0 + bug.oz + Math.sin(t * 0.3 * bug.sp + bug.ph) * 4, 0, L);
      const half = widthAt(s) / 2 + 3;
      toWorld(s, clamp(bug.ox + Math.cos(t * 0.5 * bug.sp + bug.ph) * 3, -half, half), v);
      const y = waterY(s) + bug.y + Math.sin(t * 2 * bug.sp + bug.ph) * 0.4;
      dummy.position.set(v.x, y, v.z);
      dummy.rotation.set(0, t * bug.sp + bug.ph, Math.sin(t * 20 + bug.ph) * 0.8);
      dummy.scale.setScalar(canyon ? 0.001 : 1);
      dummy.updateMatrix();
      mesh.current?.setMatrixAt(i, dummy.matrix);
      dummy.scale.setScalar(canyon ? 0.6 + Math.sin(t * 4 + bug.ph) * 0.3 : 0.001);
      dummy.updateMatrix();
      glow.current?.setMatrixAt(i, dummy.matrix);
    });
    if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true;
    if (glow.current) glow.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <>
      <instancedMesh ref={mesh} args={[undefined, undefined, bugs.length]} frustumCulled={false}>
        <boxGeometry args={[0.5, 0.02, 0.14]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} />
      </instancedMesh>
      <instancedMesh ref={glow} args={[undefined, undefined, bugs.length]} frustumCulled={false}>
        <sphereGeometry args={[0.07, 6, 4]} />
        <meshBasicMaterial color="#fff3a3" toneMapped={false} />
      </instancedMesh>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Komposisi                                                           */
/* ------------------------------------------------------------------ */

export const RiverNature = memo(function RiverNature({ quality, focus, flora }: { quality: GameQuality; focus: Focus; flora: Flora }) {
  const lush = quality !== "hemat";
  const mid = useMemo(() => {
    const p = toWorld(L / 2, 0);
    return { x: p.x, z: p.z };
  }, []);
  const nearA = useMemo(() => {
    const p = toWorld(L * 0.2, 0);
    return { x: p.x, z: p.z };
  }, []);
  const nearB = useMemo(() => {
    const p = toWorld(L * 0.8, 0);
    return { x: p.x, z: p.z };
  }, []);
  return (
    <>
      <color attach="background" args={[RIVER_HORIZON]} />
      <fog attach="fog" args={[RIVER_HORIZON, 120, 640]} />
      <RiverSky />
      <RiverSun focus={focus} quality={quality} />
      <WindClock />
      <Terrain quality={quality} />
      <RiverWater />
      <FloraAll flora={flora} quality={quality} />
      <StartDock />
      <Village />
      <Smoke />
      {BRIDGES.map((s) => (
        <Near key={s} s0={s}>
          <RopeBridge s={s} />
        </Near>
      ))}
      {WHEELS.map((wheel) => (
        <Near key={wheel.s} s0={wheel.s}>
          <WaterWheel s={wheel.s} side={wheel.side} />
        </Near>
      ))}
      <Kites />
      <Waterfalls lush={lush} />
      <Near s0={ARCH_S}>
        <RockArch />
      </Near>
      <Villagers />
      <Herds />
      <Herons />
      <Sampans />
      <Fish focus={focus} />
      <Critters focus={focus} count={lush ? 26 : 12} />
      <Clouds count={lush ? 16 : 9} center={nearA} />
      <Clouds count={lush ? 16 : 9} center={mid} />
      <Clouds count={lush ? 16 : 9} center={nearB} />
      <Birds center={nearA} spread={1.2} />
      <Birds center={nearB} spread={1.2} />
    </>
  );
});
