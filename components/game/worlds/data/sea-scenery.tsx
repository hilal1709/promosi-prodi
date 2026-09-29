"use client";

import { memo, useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { Billboard } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { GameQuality } from "@/lib/types";
import { clampDelta } from "../world-kit";
import { fbm, seeded } from "../erp/race-track";
import { Birds, canvasTexture, Clouds, fitText, InstancedSet } from "../erp/race-scenery";
import { Person, StiltHouse } from "./river-scenery";
import { Pier } from "./sea-models";
import {
  boatAt,
  FISHING_BOATS,
  HARBOR,
  HARBOR_DOCK,
  islandAt,
  ISLANDS,
  REEF,
  SEA_Y,
  SHOP_DOCKS,
  terrainHeight,
  TURTLE_SPOTS,
  type Inst,
  type IslandKind,
  type SeaFlora,
} from "./sea-layout";

export type Focus = RefObject<{ pos: THREE.Vector3 }>;

const smooth = THREE.MathUtils.smoothstep;

/* ------------------------------------------------------------------ */
/* Langit sore keemasan — warna cakrawala = warna kabut (batas tak terlihat) */
/* ------------------------------------------------------------------ */

export const SEA_HORIZON = "#f0dcc4";
const SKY_TOP = "#3a7fcf";
const SKY_WARM = "#ffb068";
const SUN_DIR = new THREE.Vector3(0.62, 0.36, -0.7).normalize();

const srgb = (hex: string) => {
  const c = new THREE.Color();
  c.setStyle(hex, THREE.SRGBColorSpace);
  const out = { r: 0, g: 0, b: 0 };
  c.getRGB(out, THREE.SRGBColorSpace);
  return new THREE.Vector3(out.r, out.g, out.b);
};

function SeaSky() {
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
          horizon: { value: srgb(SEA_HORIZON) },
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
            col = mix(col, warm, pow(s, 4.0) * 0.55 * smoothstep(0.0, 0.2, h) * (1.0 - h));
            col += vec3(1.0, 0.9, 0.7) * (pow(s, 700.0) * 1.4 + pow(s, 30.0) * 0.28);
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

function SeaSun({ focus, quality }: { focus: Focus; quality: GameQuality }) {
  const light = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const size = quality === "tinggi" ? 2048 : 1024;
  useFrame(() => {
    const p = focus.current.pos;
    const x = Math.round(p.x / 4) * 4;
    const z = Math.round(p.z / 4) * 4;
    target.position.set(x, 0, z);
    target.updateMatrixWorld();
    light.current?.position.set(x + SUN_DIR.x * 140, SUN_DIR.y * 140, z + SUN_DIR.z * 140);
  });
  return (
    <>
      <primitive object={target} />
      <ambientLight intensity={0.34} color="#ffeede" />
      <hemisphereLight intensity={1} color="#dcecff" groundColor="#6b7a55" />
      <directionalLight
        ref={light}
        target={target}
        castShadow={quality !== "hemat"}
        intensity={2.5}
        color="#ffdcae"
        shadow-mapSize={[size, size]}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-camera-near={1}
        shadow-camera-far={320}
        shadow-bias={-0.0004}
        shadow-normalBias={0.06}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Pulau & dasar laut                                                   */
/* ------------------------------------------------------------------ */

const C = (hex: string) => new THREE.Color(hex);
const DEEP = C("#1f4f66");
const MID = C("#2f7d8a");
const SHELF = C("#8fd0c0");
const REEF_BED = C("#c7e6c9");
const LAGOON = C("#e6f2cf");
const WET = C("#cdb884");
const BEACH = C("#eedfae");
const GRASS = C("#5e9f45");
const GRASS_B = C("#86b955");
const JUNGLE = C("#3d7a33");
const MUD = C("#6d6246");
const MARSH = C("#5b8a42");
const LAVA_ROCK = C("#4b4542");
const ASH = C("#7a716a");
const CRATER = C("#7a3b2a");
const CLIFF = C("#b08f6f");
const CLIFF_B = C("#9a7457");
const STONE = C("#8e8b80");
const PLAZA = C("#c7b594");
const FAR = C("#6f8e70");
const FAR_ROCK = C("#8d9a8f");

const warp = (u: number, size: number) => size * (0.3 * u + 0.7 * u * u * u);

function landColor(kind: IslandKind, x: number, z: number, h: number, t: number, slope: number, out: THREE.Color) {
  const n = fbm(x * 0.05, z * 0.05, 3);
  out.copy(GRASS).lerp(GRASS_B, THREE.MathUtils.clamp(n * 1.6 - 0.4, 0, 1));
  switch (kind) {
    case "tropis":
      out.lerp(JUNGLE, smooth(t, 0.35, 0.8) * 0.7);
      break;
    case "bakau":
      out.copy(MARSH).lerp(MUD, smooth(n, 0.45, 0.7) * 0.6);
      break;
    case "vulkanik":
      out.lerp(JUNGLE, smooth(t, 0.1, 0.4) * 0.5);
      out.lerp(ASH, smooth(t, 0.4, 0.62));
      out.lerp(LAVA_ROCK, smooth(t, 0.58, 0.8));
      out.lerp(CRATER, smooth(t, 0.9, 0.98));
      break;
    case "tebing":
      if (slope > 0.9) out.copy(n > 0.5 ? CLIFF : CLIFF_B).lerp(CLIFF_B, Math.sin(h * 1.3) * 0.5 + 0.5);
      break;
    case "tanjung":
    case "karang":
      out.lerp(STONE, kind === "karang" ? 0.85 : smooth(n, 0.4, 0.7) * 0.7);
      break;
    case "pelabuhan":
      out.lerp(PLAZA, (1 - smooth(t, 0.3, 0.55)) * 0.85);
      break;
    case "atol":
      out.copy(BEACH).lerp(GRASS_B, smooth(h, 1, 1.5) * 0.6);
      break;
  }
  if (slope > 1.2 && kind !== "tebing") out.lerp(STONE, smooth(slope, 1.2, 2.2) * 0.8);
  // Pantai.
  out.lerp(BEACH, 1 - smooth(h, 0.6, 1.5));
  if (h < 0.55) out.copy(WET);
  return out;
}

const Terrain = memo(function Terrain({ quality }: { quality: GameQuality }) {
  const geometry = useMemo(() => {
    const n = quality === "hemat" ? 200 : quality === "tinggi" ? 340 : 270;
    const size = 1500;
    const verts = new Float32Array((n + 1) * (n + 1) * 3);
    const colors = new Float32Array((n + 1) * (n + 1) * 3);
    const color = new THREE.Color();
    let i = 0;
    for (let iz = 0; iz <= n; iz++) {
      const z = warp((iz / n) * 2 - 1, size / 2);
      for (let ix = 0; ix <= n; ix++) {
        const x = warp((ix / n) * 2 - 1, size / 2);
        const h = terrainHeight(x, z);
        verts[i * 3] = x;
        verts[i * 3 + 1] = h;
        verts[i * 3 + 2] = z;
        const r = Math.hypot(x, z);
        if (h < SEA_Y + 0.2) {
          // Dasar laut: pasir terang di paparan dangkal → biru tua di laut dalam.
          color.copy(DEEP).lerp(MID, smooth(h, -12, -5)).lerp(SHELF, smooth(h, -4.5, -1.6));
          const reefD = Math.abs(Math.hypot(x - REEF.x, z - REEF.z) - REEF.r);
          if (reefD < 7) color.lerp(REEF_BED, (1 - smooth(reefD, 2, 7)) * 0.7);
          const { island, t } = islandAt(x, z);
          if (island.kind === "atol" && t > 0.45) color.copy(LAGOON);
          else if (h > -0.9) color.lerp(WET, smooth(h, -0.9, 0.1));
        } else if (r > 370) {
          color.copy(FAR).lerp(FAR_ROCK, smooth(h, 40, 120));
          color.lerp(BEACH, 1 - smooth(h, 0.4, 2.5));
        } else {
          const { island, t } = islandAt(x, z);
          const slope = Math.abs(terrainHeight(x + 1.2, z) - h) + Math.abs(terrainHeight(x, z + 1.2) - h);
          landColor(island.kind, x, z, h, t, slope, color);
        }
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

/* ------------------------------ laut ------------------------------- */

const WATER_SIZE = 3200;
const WATER_REPEAT = 110;
const WATER_TILE = WATER_SIZE / WATER_REPEAT;

function Ocean() {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const { camera } = useThree();
  const clock = useRef(0);
  const texture = useMemo(() => {
    const t = canvasTexture(256, 256, (g) => {
      g.fillStyle = "#5fb7cf";
      g.fillRect(0, 0, 256, 256);
      const rand = seeded(12);
      for (let k = 0; k < 140; k++) {
        g.strokeStyle = `rgba(255,255,255,${0.07 + rand() * 0.18})`;
        g.lineWidth = 1 + rand() * 2.2;
        const x = rand() * 256;
        const y = rand() * 256;
        g.beginPath();
        g.moveTo(x, y);
        g.quadraticCurveTo(x + 9, y - 4, x + 18 + rand() * 14, y);
        g.stroke();
      }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(WATER_REPEAT, WATER_REPEAT);
    return t;
  }, []);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    if (mesh.current) {
      const x = Math.round(camera.position.x / WATER_TILE) * WATER_TILE;
      const z = Math.round(camera.position.z / WATER_TILE) * WATER_TILE;
      mesh.current.position.set(x, SEA_Y, z);
      texture.offset.set(clock.current * 0.012, clock.current * 0.02);
    }
    if (material.current) material.current.emissiveIntensity = 0.12 + Math.sin(clock.current * 1.1) * 0.04;
  });
  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} receiveShadow renderOrder={1}>
      <planeGeometry args={[WATER_SIZE, WATER_SIZE]} />
      <meshStandardMaterial ref={material} map={texture} color="#b8ecf2" emissive="#3aa6c8" emissiveIntensity={0.12} roughness={0.08} metalness={0.25} transparent opacity={0.8} depthWrite={false} />
    </mesh>
  );
}

/** Buih ombak berdenyut di tepi setiap pulau. */
function ShoreFoam() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const rings = useMemo(
    () =>
      ISLANDS.filter((island) => island.kind !== "atol").map((island) => {
        const pts: THREE.Vector2[] = [];
        const segs = 64;
        for (let k = 0; k <= segs; k++) {
          const a = (k / segs) * Math.PI * 2;
          let d = island.r * 0.4;
          while (d < island.r * 2.2 && terrainHeight(island.x + Math.sin(a) * d, island.z + Math.cos(a) * d) > 0) d += 0.4;
          pts.push(new THREE.Vector2(Math.sin(a) * d, Math.cos(a) * d));
        }
        // Pita buih: bagian dalam = garis pantai, bagian luar sedikit ke laut.
        const pos: number[] = [];
        const idx: number[] = [];
        pts.forEach((p, k) => {
          const len = p.length() || 1;
          pos.push(p.x, 0, p.y, p.x + (p.x / len) * 1.3, 0, p.y + (p.y / len) * 1.3);
          if (k < pts.length - 1) idx.push(k * 2, k * 2 + 1, k * 2 + 2, k * 2 + 1, k * 2 + 3, k * 2 + 2);
        });
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
        geo.setIndex(idx);
        return { island, geo };
      }),
    []
  );
  const clock = useRef(0);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    refs.current.forEach((m, k) => {
      if (!m) return;
      const s = 1 + (Math.sin(clock.current * 0.9 + k) * 0.5 + 0.5) * 0.04;
      m.scale.set(s, 1, s);
      (m.material as THREE.MeshBasicMaterial).opacity = 0.2 + Math.sin(clock.current * 0.9 + k) * 0.1;
    });
  });
  return (
    <>
      {rings.map(({ island, geo }, k) => (
        <mesh key={island.id} ref={(node) => { refs.current[k] = node; }} geometry={geo} position={[island.x, SEA_Y + 0.08, island.z]} renderOrder={2}>
          <meshBasicMaterial color="#ffffff" transparent opacity={0.4} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Flora                                                                */
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
    // Kelapa: batang melengkung + mahkota pelepah terkulai.
    const top = { x: 1.5, y: 6.4 };
    const palmTrunk = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, -0.3, 0), new THREE.Vector3(0.1, 3.6, 0), new THREE.Vector3(top.x, top.y, 0)), 10, 0.17, 6);
    const palmCrown = merge([
      ...Array.from({ length: 8 }, (_, k) => {
        const a = (k / 8) * Math.PI * 2;
        const leaf = put(new THREE.ConeGeometry(0.42, 3.2, 4, 1), 0, 1.6, 0, 0, 0, 0, [1, 1, 0.18]);
        leaf.rotateX(Math.PI / 2 + 0.55 + (k % 2) * 0.25);
        leaf.rotateY(a);
        return put(leaf, top.x, top.y, 0);
      }),
      ...[0, 1, 2].map((k) => put(new THREE.SphereGeometry(0.2, 6, 5), top.x + Math.cos(k * 2.1) * 0.25, top.y - 0.25, Math.sin(k * 2.1) * 0.25)),
    ]);
    const jungleTrunk = put(new THREE.CylinderGeometry(0.22, 0.34, 3, 6), 0, 1.5, 0);
    const jungleTop = merge([
      put(new THREE.IcosahedronGeometry(1.9, 1), 0, 3.9, 0, 0, 0, 0, [1, 0.8, 1]),
      put(new THREE.IcosahedronGeometry(1.35, 1), 1.1, 3.3, 0.5),
      put(new THREE.IcosahedronGeometry(1.25, 1), -1, 3.4, -0.5),
      put(new THREE.IcosahedronGeometry(1.1, 1), 0.2, 4.8, -0.2),
    ]);
    const mangroveRoots = merge(
      Array.from({ length: 6 }, (_, k) => {
        const a = (k / 6) * Math.PI * 2;
        return put(new THREE.CylinderGeometry(0.05, 0.08, 1.9, 4), Math.sin(a) * 0.55, 0.7, Math.cos(a) * 0.55, Math.cos(a) * 0.55, 0, -Math.sin(a) * 0.55);
      }).concat([put(new THREE.CylinderGeometry(0.12, 0.16, 1.6, 5), 0, 2.2, 0)])
    );
    const mangroveTop = merge([
      put(new THREE.IcosahedronGeometry(1.5, 1), 0, 3.3, 0, 0, 0, 0, [1.25, 0.65, 1.25]),
      put(new THREE.IcosahedronGeometry(1, 1), 0.9, 3, 0.3, 0, 0, 0, [1, 0.7, 1]),
    ]);
    const bush = put(new THREE.IcosahedronGeometry(0.85, 1), 0, 0.45, 0, 0, 0, 0, [1.25, 0.8, 1.1]);
    const grass = merge([0, 1, 2, 3, 4].map((k) => put(new THREE.ConeGeometry(0.06, 0.7 + (k % 3) * 0.14, 3), Math.cos(k * 1.3) * 0.13, 0.35, Math.sin(k * 1.3) * 0.13, Math.cos(k) * 0.25, 0, Math.sin(k * 2) * 0.25)));
    const flower = merge([
      put(new THREE.CylinderGeometry(0.018, 0.025, 0.55, 3), 0, 0.27, 0),
      put(new THREE.IcosahedronGeometry(0.06, 0), 0, 0.58, 0),
      ...[0, 1, 2, 3, 4].map((k) => put(new THREE.SphereGeometry(0.075, 4, 3), Math.cos((k / 5) * Math.PI * 2) * 0.09, 0.56, Math.sin((k / 5) * Math.PI * 2) * 0.09, 0, 0, 0, [1, 0.35, 1])),
    ]);
    const rock = new THREE.DodecahedronGeometry(0.7, 0);
    const deadTree = merge([
      put(new THREE.CylinderGeometry(0.12, 0.24, 3.2, 5), 0, 1.6, 0),
      put(new THREE.CylinderGeometry(0.05, 0.09, 1.4, 4), 0.45, 2.6, 0, 0, 0, -0.8),
      put(new THREE.CylinderGeometry(0.04, 0.08, 1.2, 4), -0.4, 2.3, 0.1, 0.2, 0, 0.9),
    ]);
    const coral = merge([
      put(new THREE.CylinderGeometry(0.08, 0.14, 1.1, 5), 0, 0.5, 0),
      put(new THREE.CylinderGeometry(0.06, 0.1, 0.8, 5), 0.25, 0.7, 0, 0, 0, -0.7),
      put(new THREE.CylinderGeometry(0.06, 0.1, 0.8, 5), -0.22, 0.65, 0.1, 0.3, 0, 0.8),
      put(new THREE.SphereGeometry(0.16, 6, 5), 0, 1.05, 0),
      put(new THREE.SphereGeometry(0.13, 6, 5), 0.5, 0.95, 0),
      put(new THREE.SphereGeometry(0.13, 6, 5), -0.46, 0.92, 0.2),
      put(new THREE.IcosahedronGeometry(0.45, 0), 0.6, 0.15, -0.4, 0, 0, 0, [1, 0.5, 1]),
    ]);
    const seaweed = merge([0, 1, 2].map((k) => put(new THREE.ConeGeometry(0.09, 2.2 + k * 0.4, 3), Math.cos(k * 2.1) * 0.2, 1.1 + k * 0.2, Math.sin(k * 2.1) * 0.2)));
    const driftwood = new THREE.CylinderGeometry(0.18, 0.22, 1, 6);
    return { palmTrunk, palmCrown, jungleTrunk, jungleTop, mangroveRoots, mangroveTop, bush, grass, flower, rock, deadTree, coral, seaweed, driftwood };
  }, []);
}

const WIND = { value: 0 };

function swayMaterial(color: string, amp: number, emissive?: string) {
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true, side: THREE.DoubleSide, emissive: emissive ?? "#000000", emissiveIntensity: emissive ? 0.35 : 0 });
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
      float bend = max(position.y, 0.0);
      float gust = sin(uWind * 1.4 + root.x * 0.17 + root.z * 0.11) * 0.6 + sin(uWind * 2.9 + root.x * 0.6) * 0.25;
      transformed.x += gust * bend * ${amp.toFixed(3)};
      transformed.z += cos(uWind * 1.1 + root.z * 0.19) * bend * ${(amp * 0.55).toFixed(3)};`
    );
  };
  return material;
}

function WindClock() {
  useFrame((_, raw) => {
    WIND.value += clampDelta(raw);
  });
  return null;
}

function SwaySet({ items, geometry, color = "#ffffff", amp, shadow = false, emissive }: { items: Inst[]; geometry: THREE.BufferGeometry; color?: string; amp: number; shadow?: boolean; emissive?: string }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const material = useMemo(() => swayMaterial(color, amp, emissive), [color, amp, emissive]);
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
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} castShadow={shadow} receiveShadow />;
}

const strip = (items: Inst[]) => items.map(({ p, r, s }) => ({ p, r, s }));

const Flora = memo(function Flora({ flora, quality }: { flora: SeaFlora; quality: GameQuality }) {
  const g = useFloraGeometries();
  const shadow = quality !== "hemat";
  const trunks = useMemo(() => ({ palms: strip(flora.palms), jungle: strip(flora.jungle), mangroves: strip(flora.mangroves) }), [flora]);
  return (
    <group>
      <SwaySet items={trunks.palms} geometry={g.palmTrunk} color="#8a6a48" amp={0.035} shadow={shadow} />
      <SwaySet items={flora.palms} geometry={g.palmCrown} amp={0.06} shadow={shadow} />
      <InstancedSet items={trunks.jungle} geometry={g.jungleTrunk} color="#6b4a2f" shadow={shadow} />
      <SwaySet items={flora.jungle} geometry={g.jungleTop} amp={0.025} shadow={shadow} />
      <InstancedSet items={trunks.mangroves} geometry={g.mangroveRoots} color="#5a4632" shadow={shadow} />
      <SwaySet items={flora.mangroves} geometry={g.mangroveTop} amp={0.02} shadow={shadow} />
      <InstancedSet items={flora.bushes} geometry={g.bush} shadow={shadow} />
      <InstancedSet items={flora.rocks} geometry={g.rock} shadow={shadow} />
      <InstancedSet items={flora.deadTrees} geometry={g.deadTree} color="#5b504a" shadow={shadow} />
      <InstancedSet items={flora.driftwood} geometry={g.driftwood} color="#a08a6c" shadow={false} />
      <InstancedSet items={flora.corals} geometry={g.coral} shadow={false} emissive="#ff8a7a" emissiveIntensity={0.15} />
      <SwaySet items={flora.seaweed} geometry={g.seaweed} color="#3f8a4a" amp={0.12} />
      <SwaySet items={flora.grass} geometry={g.grass} color="#7fae4f" amp={0.2} />
      <SwaySet items={flora.flowers} geometry={g.flower} amp={0.2} />
    </group>
  );
});

/* ------------------------------------------------------------------ */
/* Pelabuhan Gresik                                                     */
/* ------------------------------------------------------------------ */

function signTexture(text: string, bg: string, ink: string) {
  return canvasTexture(512, 128, (g) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, 512, 128);
    g.fillStyle = ink;
    g.textAlign = "center";
    g.textBaseline = "middle";
    fitText(g, text, 470, 84, 900);
    g.fillText(text, 256, 68);
  });
}

function Crane() {
  const arm = useRef<THREE.Group>(null);
  const clock = useRef(0);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    if (arm.current) arm.current.rotation.y = Math.sin(clock.current * 0.18) * 1.2;
  });
  return (
    <group>
      {[[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]].map(([x, z], k) => (
        <mesh key={k} position={[x, 5, z]} castShadow>
          <boxGeometry args={[0.25, 10, 0.25]} />
          <meshStandardMaterial color="#e9a13b" />
        </mesh>
      ))}
      {[2, 4.5, 7, 9.5].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[2, 0.15, 2]} />
          <meshStandardMaterial color="#d88a2a" />
        </mesh>
      ))}
      <group ref={arm} position={[0, 10.3, 0]}>
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[2.2, 1.4, 2.2]} />
          <meshStandardMaterial color="#f1ede4" />
        </mesh>
        <mesh position={[0, 0.3, 6]} castShadow>
          <boxGeometry args={[0.6, 0.6, 13]} />
          <meshStandardMaterial color="#e9a13b" />
        </mesh>
        <mesh position={[0, 0.3, -3]}>
          <boxGeometry args={[1.4, 1.2, 2]} />
          <meshStandardMaterial color="#6c6f78" />
        </mesh>
        <mesh position={[0, -3.3, 11.5]}>
          <cylinderGeometry args={[0.03, 0.03, 7, 4]} />
          <meshStandardMaterial color="#2b2f36" />
        </mesh>
        <mesh position={[0, -7, 11.5]} castShadow>
          <boxGeometry args={[2.2, 1, 1.4]} />
          <meshStandardMaterial color="#d9d4c7" />
        </mesh>
      </group>
    </group>
  );
}

function MooredBoat({ sail, phase }: { sail: string; phase: number }) {
  const ref = useRef<THREE.Group>(null);
  const clock = useRef(phase);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    if (ref.current) {
      ref.current.position.y = Math.sin(clock.current * 1.3) * 0.12;
      ref.current.rotation.z = Math.sin(clock.current * 1.1) * 0.05;
    }
  });
  return (
    <group ref={ref}>
      <SmallBoat sail={sail} />
    </group>
  );
}

function SmallBoat({ sail }: { sail: string }) {
  return (
    <group>
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[1.6, 0.7, 4.6]} />
        <meshStandardMaterial color="#2a6f97" />
      </mesh>
      <mesh position={[0, 0.45, 2.4]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[1.1, 0.5, 1.1]} />
        <meshStandardMaterial color="#2a6f97" />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <boxGeometry args={[1.7, 0.1, 4.7]} />
        <meshStandardMaterial color="#f1ede4" />
      </mesh>
      <mesh position={[0, 2.5, 0.2]}>
        <cylinderGeometry args={[0.05, 0.06, 4, 5]} />
        <meshStandardMaterial color="#5a3a22" />
      </mesh>
      <mesh position={[0.05, 2.6, -0.6]} rotation={[0, Math.PI / 2, 0]}>
        <shapeGeometry args={[new THREE.Shape([new THREE.Vector2(-0.8, -1.3), new THREE.Vector2(0.8, -1.3), new THREE.Vector2(-0.8, 1.6)])]} />
        <meshStandardMaterial color={sail} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

const Harbor = memo(function Harbor() {
  const dock = HARBOR_DOCK;
  const warehouseSign = useMemo(() => signTexture("GUDANG SEMEN", "#1e1e24", "#ffc857"), []);
  const portSign = useMemo(() => signTexture("PELABUHAN GRESIK", "#f1ede4", "#2a6f97"), []);
  const side = { x: Math.cos(dock.rot), z: -Math.sin(dock.rot) };
  const inward = { x: Math.sin(dock.rot), z: Math.cos(dock.rot) };
  const at = (lat: number, fwd: number): [number, number, number] => {
    const x = dock.land.x + side.x * lat + inward.x * fwd;
    const z = dock.land.z + side.z * lat + inward.z * fwd;
    return [x, terrainHeight(x, z), z];
  };
  const secondDock = useMemo(() => ({ ...dock, x: dock.x + side.x * 16, z: dock.z + side.z * 16, land: { x: dock.land.x + side.x * 16, z: dock.land.z + side.z * 16 } }), [dock, side.x, side.z]);
  const thirdDock = useMemo(() => ({ ...dock, x: dock.x - side.x * 17, z: dock.z - side.z * 17, land: { x: dock.land.x - side.x * 17, z: dock.land.z - side.z * 17 } }), [dock, side.x, side.z]);
  const containers = ["#e63946", "#2a9d8f", "#f4a261", "#457b9d", "#e9c46a", "#6d597a"];
  const stalls = ["#e63946", "#ffd166", "#2a9d8f", "#f4a261"];
  const people = [
    { lat: 1.5, fwd: 2, shirt: "#e76f51", pose: 0 },
    { lat: -2, fwd: 5, shirt: "#2a9d8f", pose: -0.5 },
    { lat: 9, fwd: 8, shirt: "#e9c46a", pose: 0 },
    { lat: -12, fwd: 9, shirt: "#8ecae6", pose: 0.4 },
    { lat: 14, fwd: 3, shirt: "#b5838d", pose: 0 },
    { lat: -6, fwd: 14, shirt: "#f4a261", pose: 0 },
  ];
  return (
    <group>
      <Pier dock={dock} width={4} />
      <Pier dock={secondDock} width={2.4} />
      <Pier dock={thirdDock} width={2.4} />
      {[
        { d: secondDock, sail: "#e63946", k: 0 },
        { d: thirdDock, sail: "#ffd166", k: 1 },
      ].map(({ d, sail, k }) => (
        <group key={k} position={[d.x + side.x * 3, 0, d.z + side.z * 3]} rotation={[0, dock.rot, 0]}>
          <MooredBoat sail={sail} phase={k * 2} />
        </group>
      ))}
      {/* Gudang */}
      <group position={at(0, 14)} rotation={[0, dock.rot + Math.PI, 0]}>
        <mesh position={[0, 3, 0]} castShadow receiveShadow>
          <boxGeometry args={[14, 6, 9]} />
          <meshStandardMaterial color="#d8dde3" />
        </mesh>
        <mesh position={[0, 6, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[4.6, 4.6, 14.2, 16, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#9c3d2e" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 4.9, 4.55]}>
          <planeGeometry args={[8, 2]} />
          <meshBasicMaterial map={warehouseSign} toneMapped={false} />
        </mesh>
        <mesh position={[0, 1.8, 4.53]}>
          <boxGeometry args={[4.5, 3.6, 0.06]} />
          <meshStandardMaterial color="#4a4e57" />
        </mesh>
      </group>
      {/* Papan nama pelabuhan */}
      <group position={at(4, 3)} rotation={[0, dock.rot + Math.PI, 0]}>
        {[-2.2, 2.2].map((x) => (
          <mesh key={x} position={[x, 1.6, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 3.2, 6]} />
            <meshStandardMaterial color="#5a3a22" />
          </mesh>
        ))}
        <mesh position={[0, 2.8, 0.05]}>
          <planeGeometry args={[5, 1.25]} />
          <meshBasicMaterial map={portSign} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <group position={at(-11, 6)}>
        <Crane />
      </group>
      {/* Kontainer & tumpukan semen */}
      {containers.map((c, k) => (
        <mesh key={c} position={((): [number, number, number] => { const p = at(9 + (k % 3) * 2.7, 8 + Math.floor(k / 3) * 0.1); return [p[0], p[1] + 1.2 + Math.floor(k / 3) * 2.4, p[2]]; })()} rotation={[0, dock.rot, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.5, 2.4, 6]} />
          <meshStandardMaterial color={c} />
        </mesh>
      ))}
      {[0, 1, 2, 3].map((k) => (
        <group key={k} position={at(-5 + (k % 2) * 2.2, 4 + Math.floor(k / 2) * 2.2)}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <mesh key={i} position={[(i % 2) * 0.72 - 0.36, 0.25 + Math.floor(i / 2) * 0.48, 0]} castShadow>
              <boxGeometry args={[0.7, 0.45, 0.95]} />
              <meshStandardMaterial color={i % 2 ? "#d9d4c7" : "#c8c1b0"} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Lapak pasar ikan */}
      {stalls.map((c, k) => (
        <group key={c} position={at(-16 + k * 4.2, 18)} rotation={[0, dock.rot + Math.PI, 0]}>
          {[[-1.3, -1], [1.3, -1], [-1.3, 1], [1.3, 1]].map(([x, z], i) => (
            <mesh key={i} position={[x, 1.2, z]}>
              <cylinderGeometry args={[0.06, 0.06, 2.4, 4]} />
              <meshStandardMaterial color="#6b4a2f" />
            </mesh>
          ))}
          <mesh position={[0, 2.5, 0]} rotation={[0.18, 0, 0]} castShadow>
            <boxGeometry args={[3, 0.1, 2.6]} />
            <meshStandardMaterial color={c} />
          </mesh>
          <mesh position={[0, 0.8, 0.6]} castShadow>
            <boxGeometry args={[2.6, 0.2, 1]} />
            <meshStandardMaterial color="#9a7a52" />
          </mesh>
        </group>
      ))}
      {/* Lampu jalan */}
      {[-6, 6].map((lat) => (
        <group key={lat} position={at(lat, 1)}>
          <mesh position={[0, 2, 0]}>
            <cylinderGeometry args={[0.07, 0.09, 4, 6]} />
            <meshStandardMaterial color="#2b2f36" />
          </mesh>
          <mesh position={[0, 4.1, 0]}>
            <sphereGeometry args={[0.3, 10, 8]} />
            <meshStandardMaterial color="#fff1c1" emissive="#ffc857" emissiveIntensity={1.2} />
          </mesh>
        </group>
      ))}
      {people.map((p, k) => (
        <group key={k} position={at(p.lat, p.fwd)} rotation={[0, dock.rot + Math.PI + (k % 3) * 0.5, 0]}>
          <Person shirt={p.shirt} pose={p.pose} hat={k % 2 === 0} />
        </group>
      ))}
    </group>
  );
});

/** Pelampung navigasi merah-hijau di alur masuk pelabuhan. */
function ChannelBuoys() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const clock = useRef(0);
  const buoys = useMemo(() => {
    const out: { x: number; z: number; color: string }[] = [];
    const fx = -Math.sin(HARBOR_DOCK.rot);
    const fz = -Math.cos(HARBOR_DOCK.rot);
    const sx = Math.cos(HARBOR_DOCK.rot);
    const sz = -Math.sin(HARBOR_DOCK.rot);
    [16, 32, 48].forEach((d) => {
      [-1, 1].forEach((side) => out.push({ x: HARBOR_DOCK.x + fx * d + sx * side * 11, z: HARBOR_DOCK.z + fz * d + sz * side * 11, color: side > 0 ? "#2fae66" : "#e63946" }));
    });
    return out;
  }, []);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    refs.current.forEach((g, k) => {
      if (!g) return;
      g.position.y = Math.sin(clock.current * 1.5 + k) * 0.15;
      g.rotation.z = Math.sin(clock.current * 1.2 + k) * 0.1;
    });
  });
  return (
    <>
      {buoys.map((b, k) => (
        <group key={k} position={[b.x, 0, b.z]}>
          <group ref={(node) => { refs.current[k] = node; }}>
            <mesh position={[0, 0.3, 0]}>
              <cylinderGeometry args={[0.6, 0.7, 0.8, 10]} />
              <meshStandardMaterial color={b.color} />
            </mesh>
            <mesh position={[0, 1.3, 0]}>
              <coneGeometry args={[0.35, 1.3, 8]} />
              <meshStandardMaterial color={b.color} />
            </mesh>
            <mesh position={[0, 2.1, 0]}>
              <sphereGeometry args={[0.16, 8, 6]} />
              <meshStandardMaterial color="#fff6d5" emissive={b.color} emissiveIntensity={1.5} />
            </mesh>
          </group>
        </group>
      ))}
    </>
  );
}

const Huts = memo(function Huts({ flora }: { flora: SeaFlora }) {
  const roofs = ["#9c3d2e", "#bc6c25", "#6d597a", "#2a9d8f"];
  return (
    <>
      {flora.huts.map((hut, k) => (
        <group key={k} position={[hut.x, hut.y - 0.4, hut.z]} rotation={[0, hut.rot, 0]} scale={0.8}>
          <StiltHouse wall={hut.color} roof={roofs[k % roofs.length]} />
        </group>
      ))}
    </>
  );
});

/** Warga menunggu di dermaga tiap pulau toko. */
function ShopVillagers() {
  const shirts = ["#e76f51", "#2a9d8f", "#e9c46a", "#8ecae6", "#b5838d", "#f4a261", "#90be6d"];
  return (
    <>
      {SHOP_DOCKS.map((dock, k) => {
        const x = dock.land.x + Math.sin(dock.rot) * 1.5 + Math.cos(dock.rot) * 1.4;
        const z = dock.land.z + Math.cos(dock.rot) * 1.5 - Math.sin(dock.rot) * 1.4;
        return (
          <group key={k} position={[x, Math.max(1, terrainHeight(x, z)), z]} rotation={[0, dock.rot + Math.PI, 0]}>
            <Person shirt={shirts[k % shirts.length]} pose={k % 2 ? -0.6 : 0.1} />
          </group>
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Gunung Berkah: asap; Amanah: air terjun; Barokah: kabut              */
/* ------------------------------------------------------------------ */

function puffTexture() {
  return canvasTexture(64, 64, (g) => {
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.5, "rgba(255,255,255,.55)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
  });
}

function VolcanoSmoke() {
  const island = ISLANDS.find((item) => item.id === "berkah")!;
  const top = useMemo(() => terrainHeight(island.x, island.z) + 2, [island]);
  const refs = useRef<(THREE.Sprite | null)[]>([]);
  const texture = useMemo(() => puffTexture(), []);
  const clock = useRef(0);
  const count = 14;
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    refs.current.forEach((sprite, k) => {
      if (!sprite) return;
      const life = (clock.current * 0.08 + k / count) % 1;
      sprite.position.set(island.x + Math.sin(k * 2.3) * 2 + life * 14, top + life * 38, island.z + Math.cos(k * 1.7) * 2 - life * 6);
      const s = 5 + life * 22;
      sprite.scale.set(s, s, 1);
      (sprite.material as THREE.SpriteMaterial).opacity = (1 - life) * 0.55 * Math.min(1, life * 6);
    });
  });
  return (
    <>
      {Array.from({ length: count }, (_, k) => (
        <sprite key={k} ref={(node) => { refs.current[k] = node; }}>
          <spriteMaterial map={texture} color={k % 3 ? "#d9d3cc" : "#b8b0a8"} transparent depthWrite={false} />
        </sprite>
      ))}
    </>
  );
}

function Waterfall() {
  const island = ISLANDS.find((item) => item.id === "amanah")!;
  const texture = useMemo(() => {
    const t = canvasTexture(64, 256, (g) => {
      g.fillStyle = "#d8f3ff";
      g.fillRect(0, 0, 64, 256);
      const rand = seeded(4);
      for (let k = 0; k < 60; k++) {
        g.fillStyle = `rgba(90,170,210,${0.2 + rand() * 0.3})`;
        g.fillRect(rand() * 64, rand() * 256, 2 + rand() * 4, 20 + rand() * 40);
      }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }, []);
  const spot = useMemo(() => {
    // Cari bibir tebing di sisi timur pulau.
    const dir = { x: 0.8, z: 0.6 };
    let d = 2;
    const top = terrainHeight(island.x, island.z);
    while (d < island.r * 2 && terrainHeight(island.x + dir.x * d, island.z + dir.z * d) > top * 0.7) d += 0.5;
    const x = island.x + dir.x * d;
    const z = island.z + dir.z * d;
    return { x, z, y: terrainHeight(x - dir.x * 1.5, z - dir.z * 1.5), rot: Math.atan2(dir.x, dir.z) };
  }, [island]);
  const mist = useRef<THREE.Sprite>(null);
  const puff = useMemo(() => puffTexture(), []);
  useFrame((_, raw) => {
    texture.offset.setY(texture.offset.y + clampDelta(raw) * 1.4);
    if (mist.current) {
      const s = 7 + Math.sin(texture.offset.y * 2) * 0.8;
      mist.current.scale.set(s, s * 0.6, 1);
    }
  });
  return (
    <group position={[spot.x, 0, spot.z]} rotation={[0, spot.rot, 0]}>
      <mesh position={[0, spot.y / 2, 1.2]}>
        <planeGeometry args={[3.2, spot.y + 0.5]} />
        <meshStandardMaterial map={texture} emissive="#bfe9ff" emissiveIntensity={0.35} transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>
      <sprite ref={mist} position={[0, 1.2, 2.5]}>
        <spriteMaterial map={puff} color="#ffffff" transparent opacity={0.7} depthWrite={false} />
      </sprite>
    </group>
  );
}

function ReefMist() {
  const refs = useRef<(THREE.Sprite | null)[]>([]);
  const texture = useMemo(() => puffTexture(), []);
  const clock = useRef(0);
  const count = 22;
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    refs.current.forEach((sprite, k) => {
      if (!sprite) return;
      const a = (k / count) * Math.PI * 2 + clock.current * 0.02 * (k % 2 ? 1 : -1);
      const r = REEF.r * (0.55 + (k % 4) * 0.18);
      sprite.position.set(REEF.x + Math.sin(a) * r, 2.5 + (k % 3) * 1.4 + Math.sin(clock.current * 0.4 + k) * 0.6, REEF.z + Math.cos(a) * r);
    });
  });
  return (
    <>
      {Array.from({ length: count }, (_, k) => (
        <sprite key={k} ref={(node) => { refs.current[k] = node; }} scale={[26, 11, 1]}>
          <spriteMaterial map={texture} color="#f4efe6" transparent opacity={0.32} depthWrite={false} />
        </sprite>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Kehidupan laut                                                       */
/* ------------------------------------------------------------------ */

function Dolphin() {
  return (
    <group>
      <mesh scale={[0.55, 0.5, 1.7]} castShadow>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial color="#6f8fa6" roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.18, 0.1]} scale={[0.45, 0.3, 1.4]}>
        <sphereGeometry args={[1, 10, 6]} />
        <meshStandardMaterial color="#dfe8ee" />
      </mesh>
      <mesh position={[0, -0.05, 1.8]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.2, 0.7, 8]} />
        <meshStandardMaterial color="#6f8fa6" />
      </mesh>
      <mesh position={[0, 0.55, -0.1]} rotation={[-0.5, 0, 0]}>
        <coneGeometry args={[0.1, 0.7, 4]} />
        <meshStandardMaterial color="#5f7f96" />
      </mesh>
      <mesh position={[0, 0, -1.85]} rotation={[0, 0, 0]} scale={[1.1, 0.12, 0.45]}>
        <sphereGeometry args={[0.6, 8, 4]} />
        <meshStandardMaterial color="#5f7f96" />
      </mesh>
    </group>
  );
}

/** Kawanan lumba-lumba yang berenang di dekat kapal dan melompat bergantian. */
function Dolphins({ focus }: { focus: Focus }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const state = useRef({ cx: 0, cz: 0, t: 0, placed: false });
  useFrame((_, raw) => {
    const delta = clampDelta(raw);
    const s = state.current;
    s.t += delta;
    const f = focus.current.pos;
    // Pusat kawanan mengikuti kapal secara lembut, tapi tetap di air dalam.
    const tx = f.x + Math.sin(s.t * 0.05) * 30;
    const tz = f.z + Math.cos(s.t * 0.05) * 30;
    if (!s.placed) {
      s.cx = tx;
      s.cz = tz;
      s.placed = true;
    }
    s.cx += (tx - s.cx) * Math.min(1, delta * 0.25);
    s.cz += (tz - s.cz) * Math.min(1, delta * 0.25);
    refs.current.forEach((g, k) => {
      if (!g) return;
      const a = s.t * 0.45 + k * 0.5;
      const x = s.cx + Math.sin(a) * (12 + k * 2);
      const z = s.cz + Math.cos(a) * (12 + k * 2);
      const deep = terrainHeight(x, z) < -3;
      const cycle = (s.t * 0.35 + k * 0.33) % 1;
      const jump = cycle < 0.22 ? Math.sin((cycle / 0.22) * Math.PI) : 0;
      g.visible = deep;
      g.position.set(x, -0.5 + jump * 3.2, z);
      g.rotation.set(-Math.cos((cycle / 0.22) * Math.PI) * 0.7 * (jump > 0 ? 1 : 0), a + Math.PI / 2, 0, "YXZ");
    });
  });
  return (
    <>
      {[0, 1, 2].map((k) => (
        <group key={k} ref={(node) => { refs.current[k] = node; }}>
          <Dolphin />
        </group>
      ))}
    </>
  );
}

/** Ikan terbang yang sesekali meluncur di atas permukaan dekat kapal. */
function FlyingFish({ focus }: { focus: Focus }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const burst = useRef({ t: 0, x: 0, z: 0, dir: 0 });
  useFrame((_, raw) => {
    const b = burst.current;
    b.t += clampDelta(raw);
    if (b.t > 7) {
      b.t = 0;
      const f = focus.current.pos;
      const a = Math.random() * Math.PI * 2;
      b.x = f.x + Math.sin(a) * 18;
      b.z = f.z + Math.cos(a) * 18;
      b.dir = Math.random() * Math.PI * 2;
    }
    refs.current.forEach((g, k) => {
      if (!g) return;
      const life = b.t - k * 0.12;
      g.visible = life > 0 && life < 1.6 && terrainHeight(b.x, b.z) < -2;
      if (!g.visible) return;
      const d = life * 9;
      g.position.set(b.x + Math.sin(b.dir) * d + (k - 3) * 0.6, Math.sin((life / 1.6) * Math.PI) * 1.4, b.z + Math.cos(b.dir) * d + ((k * 7) % 3) * 0.6);
      g.rotation.set(0, b.dir, 0);
    });
  });
  return (
    <>
      {Array.from({ length: 6 }, (_, k) => (
        <group key={k} ref={(node) => { refs.current[k] = node; }} visible={false}>
          <mesh scale={[0.12, 0.1, 0.45]}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial color="#cfd8e3" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.02, 0.05]} scale={[0.6, 0.02, 0.22]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#a9c7e8" transparent opacity={0.8} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function Turtles() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const clock = useRef(0);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    refs.current.forEach((g, k) => {
      if (!g) return;
      const spot = TURTLE_SPOTS[k];
      const a = clock.current * 0.12 + k * 2;
      g.position.set(spot.x + Math.sin(a) * 6, -0.45 + Math.sin(clock.current * 0.7 + k) * 0.12, spot.z + Math.cos(a) * 6);
      g.rotation.y = a + Math.PI / 2;
      const flip = Math.sin(clock.current * 3 + k) * 0.4;
      g.children.forEach((child) => {
        if (child.name === "flipper") child.rotation.y = flip * (child.position.x > 0 ? 1 : -1);
      });
    });
  });
  return (
    <>
      {TURTLE_SPOTS.map((_, k) => (
        <group key={k} ref={(node) => { refs.current[k] = node; }}>
          <mesh scale={[0.9, 0.35, 1.1]}>
            <sphereGeometry args={[1, 10, 8]} />
            <meshStandardMaterial color="#4f7d3c" flatShading />
          </mesh>
          <mesh position={[0, 0, 1.2]}>
            <sphereGeometry args={[0.3, 8, 6]} />
            <meshStandardMaterial color="#8aa36a" />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} name="flipper" position={[side * 0.9, -0.05, 0.4]} scale={[0.7, 0.08, 0.3]}>
              <sphereGeometry args={[1, 6, 4]} />
              <meshStandardMaterial color="#8aa36a" />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

function FishingBoats() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const clock = useRef(0);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    refs.current.forEach((g, k) => {
      if (!g) return;
      const b = boatAt(k, clock.current);
      g.position.set(b.x, Math.sin(clock.current * 1.4 + k) * 0.15, b.z);
      g.rotation.set(0, b.rot, Math.sin(clock.current * 1.1 + k) * 0.06);
    });
  });
  return (
    <>
      {FISHING_BOATS.map((boat, k) => (
        <group key={k} ref={(node) => { refs.current[k] = node; }}>
          <SmallBoat sail={boat.sail} />
          <group position={[0, 0.65, -1.2]}>
            <Person shirt={["#e76f51", "#2a9d8f", "#e9c46a"][k % 3]} />
          </group>
        </group>
      ))}
    </>
  );
}

/** Paus yang muncul ke permukaan & menyemburkan air secara berkala. */
function Whale() {
  const body = useRef<THREE.Group>(null);
  const spout = useRef<(THREE.Sprite | null)[]>([]);
  const texture = useMemo(() => puffTexture(), []);
  const clock = useRef(0);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    const t = clock.current;
    const a = t * 0.02;
    const x = 60 + Math.sin(a) * 70;
    const z = -20 + Math.cos(a) * 70;
    const cycle = (t / 22) % 1;
    const up = cycle < 0.3 ? Math.sin((cycle / 0.3) * Math.PI) : 0;
    if (body.current) {
      body.current.position.set(x, -3.4 + up * 3.2, z);
      body.current.rotation.set(-0.1 + up * 0.1, a + Math.PI / 2, 0);
    }
    spout.current.forEach((sprite, k) => {
      if (!sprite) return;
      const life = cycle < 0.25 ? ((cycle / 0.25) * 2 + k * 0.2) % 1 : 1;
      sprite.visible = up > 0.6 && life < 1;
      sprite.position.set(x, 1 + life * 6, z);
      const s = 1 + life * 3;
      sprite.scale.set(s, s, 1);
      (sprite.material as THREE.SpriteMaterial).opacity = (1 - life) * 0.8;
    });
  });
  return (
    <>
      <group ref={body}>
        <mesh scale={[2.2, 1.8, 6.5]} castShadow>
          <sphereGeometry args={[1, 14, 10]} />
          <meshStandardMaterial color="#3d5a73" roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.8, 0.5]} scale={[1.9, 1, 5.6]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color="#cfd8e3" />
        </mesh>
        <mesh position={[0, 0.2, -7.2]} scale={[3.2, 0.25, 1.2]}>
          <sphereGeometry args={[1, 10, 6]} />
          <meshStandardMaterial color="#344e63" />
        </mesh>
      </group>
      {[0, 1, 2, 3, 4].map((k) => (
        <sprite key={k} ref={(node) => { spout.current[k] = node; }} visible={false}>
          <spriteMaterial map={texture} color="#ffffff" transparent depthWrite={false} />
        </sprite>
      ))}
    </>
  );
}

/** Plankton data berkilau di sekitar kapal. */
function DataMotes({ focus, count }: { focus: Focus; count: number }) {
  const RANGE = 40;
  const { geometry, seeds } = useMemo(() => {
    const rand = seeded(3);
    const pos = new Float32Array(count * 3);
    const list = Array.from({ length: count }, () => ({ x: (rand() - 0.5) * RANGE * 2, z: (rand() - 0.5) * RANGE * 2, y: 0.3 + rand() * 5, p: rand() * 10 }));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { geometry: geo, seeds: list };
  }, [count]);
  const dot = useMemo(
    () =>
      canvasTexture(32, 32, (g) => {
        const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
        grad.addColorStop(0, "rgba(255,255,255,1)");
        grad.addColorStop(0.4, "rgba(200,248,255,0.8)");
        grad.addColorStop(1, "rgba(200,248,255,0)");
        g.fillStyle = grad;
        g.fillRect(0, 0, 32, 32);
      }),
    []
  );
  const clock = useRef(0);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    const t = clock.current;
    const f = focus.current.pos;
    const attr = geometry.getAttribute("position") as THREE.BufferAttribute;
    seeds.forEach((s, i) => {
      const wx = f.x + ((((s.x + Math.sin(t * 0.3 + s.p) * 2 - f.x) % (RANGE * 2)) + RANGE * 3) % (RANGE * 2)) - RANGE;
      const wz = f.z + ((((s.z + Math.cos(t * 0.25 + s.p) * 2 - f.z) % (RANGE * 2)) + RANGE * 3) % (RANGE * 2)) - RANGE;
      attr.setXYZ(i, wx, Math.max(0, terrainHeight(wx, wz)) + s.y + Math.sin(t * 0.8 + s.p) * 0.4, wz);
    });
    attr.needsUpdate = true;
  });
  return (
    <points geometry={geometry} frustumCulled={false}>
      <pointsMaterial map={dot} color="#d8fbff" size={0.26} sizeAttenuation transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

/** Papan nama pulau yang melayang di atas tiap pulau berpenghuni (terlihat dari jauh). */
function IslandNames() {
  const items = useMemo(
    () =>
      ISLANDS.filter((island) => island.shop !== undefined || island.id === "pelabuhan").map((island) => ({
        island,
        y: terrainHeight(island.x, island.z) + 12,
        texture: canvasTexture(512, 112, (g) => {
          g.fillStyle = "rgba(16,19,26,.72)";
          g.beginPath();
          g.roundRect(4, 4, 504, 104, 50);
          g.fill();
          g.fillStyle = island.color;
          g.beginPath();
          g.arc(58, 56, 20, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = "#ffffff";
          g.textAlign = "left";
          g.textBaseline = "middle";
          fitText(g, island.nama, 400, 54, 900);
          g.fillText(island.nama, 96, 60);
        }),
      })),
    []
  );
  return (
    <>
      {items.map(({ island, y, texture }) => (
        <Billboard key={island.id} position={[island.x, y, island.z]}>
          <mesh>
            <planeGeometry args={[14, 3.06]} />
            <meshBasicMaterial map={texture} transparent toneMapped={false} depthWrite={false} fog={false} />
          </mesh>
        </Billboard>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Komposisi                                                            */
/* ------------------------------------------------------------------ */

const ORIGIN = { x: 0, z: 0 };

export const SeaNature = memo(function SeaNature({ quality, focus, flora }: { quality: GameQuality; focus: Focus; flora: SeaFlora }) {
  const lite = quality === "hemat";
  return (
    <>
      <fog attach="fog" args={[SEA_HORIZON, lite ? 140 : 170, lite ? 520 : 640]} />
      <SeaSky />
      <SeaSun focus={focus} quality={quality} />
      <WindClock />
      <Terrain quality={quality} />
      <Ocean />
      <ShoreFoam />
      <Flora flora={flora} quality={quality} />
      <Harbor />
      <ChannelBuoys />
      <Huts flora={flora} />
      <ShopVillagers />
      <IslandNames />
      <VolcanoSmoke />
      <Waterfall />
      <ReefMist />
      <Clouds count={lite ? 12 : 22} center={ORIGIN} />
      <Birds center={ORIGIN} spread={2.2} />
      <Birds center={{ x: HARBOR.x, z: HARBOR.z - 20 }} spread={0.35} />
      <Dolphins focus={focus} />
      <FlyingFish focus={focus} />
      <Turtles />
      <FishingBoats />
      <Whale />
      <DataMotes focus={focus} count={lite ? 60 : 140} />
    </>
  );
});
