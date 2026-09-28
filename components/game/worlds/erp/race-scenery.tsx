"use client";

import { createContext, useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { GameQuality } from "@/lib/types";
import { RUSH_STOPS } from "@/lib/data/worlds";
import { clampDelta } from "../world-kit";
import {
  distanceToTrack,
  fbm,
  headingAt,
  indexAt,
  LAKE,
  LANES,
  paddyMask,
  PADDIES,
  pointAt,
  RAIL_OFFSET,
  ROAD_HALF,
  sampleTrack,
  SAMPLES,
  seeded,
  terrainHeight,
  TRACK,
  WATER_LEVEL,
} from "./race-track";
import { TrafficCar, TRAFFIC_SIZE, type TrafficKind } from "./truck-models";

/* ------------------------------------------------------------------ */
/* Tata letak dunia (deterministik)                                    */
/* ------------------------------------------------------------------ */

export const HORIZON = "#d6e7ee";
const SKY_TOP = "#3f8fd8";
const SUN_DIR = new THREE.Vector3(-0.45, 0.62, -0.64).normalize();

type Zone = { x: number; z: number; r: number };

/** Sisi (+1 kanan / -1 kiri) yang paling lapang pada posisi `t`. */
function openSide(t: number, distance: number) {
  const a = pointAt(t, distance);
  const b = pointAt(t, -distance);
  const lakeA = Math.hypot(a.x - LAKE.x, a.z - LAKE.z) < LAKE.r + 12 ? -50 : 0;
  const lakeB = Math.hypot(b.x - LAKE.x, b.z - LAKE.z) < LAKE.r + 12 ? -50 : 0;
  return distanceToTrack(a.x, a.z) + lakeA >= distanceToTrack(b.x, b.z) + lakeB ? 1 : -1;
}

/** Sudut rotasi-Y agar sisi depan (+Z) objek di titik (x, z) menghadap jalan. */
function faceRoad(x: number, z: number, t: number) {
  const p = TRACK.points[indexAt(t)];
  return Math.atan2(p.x - x, p.z - z);
}

const FACTORY_T = RUSH_STOPS.find((stop) => stop.id === "pabrik")?.t ?? 0.03;

export const LAYOUT = (() => {
  const factorySide = openSide(FACTORY_T, RAIL_OFFSET + 30);
  const factory = pointAt(FACTORY_T + 0.012, factorySide * (RAIL_OFFSET + 30));
  const stops: Record<string, { x: number; z: number; side: number }> = {};
  RUSH_STOPS.forEach((stop) => {
    const side = stop.id === "pabrik" ? factorySide : openSide(stop.t, RAIL_OFFSET + 14);
    const p = pointAt(stop.t, side * (RAIL_OFFSET + 5));
    stops[stop.id] = { x: p.x, z: p.z, side };
  });
  const billboards = [0.09, 0.36, 0.61, 0.85].map((t, k) => {
    const side = openSide(t, RAIL_OFFSET + 8);
    const p = pointAt(t, side * (RAIL_OFFSET + 7));
    // Menghadap pengemudi yang datang, sedikit condong ke jalan.
    return { x: p.x, z: p.z, rot: headingAt(indexAt(t)) + Math.PI - side * 0.35, k };
  });
  const villages = [0.19, 0.46, 0.7, 0.93].map((t) => {
    const side = openSide(t, RAIL_OFFSET + 24);
    const p = pointAt(t, side * (RAIL_OFFSET + 26));
    return { x: p.x, z: p.z, t };
  });
  const reserved: Zone[] = [
    { x: factory.x, z: factory.z, r: 34 },
    ...Object.values(stops).map((s) => ({ x: s.x, z: s.z, r: 8 })),
    ...billboards.map((b) => ({ x: b.x, z: b.z, r: 8 })),
  ];
  return { factory: { x: factory.x, z: factory.z, rot: faceRoad(factory.x, factory.z, FACTORY_T + 0.012) }, stops, billboards, villages, reserved };
})();

const inZone = (x: number, z: number, zones: Zone[], margin = 0) => zones.some((zone) => Math.hypot(zone.x - x, zone.z - z) < zone.r + margin);

/* ------------------------------------------------------------------ */
/* Utilitas instancing                                                 */
/* ------------------------------------------------------------------ */

type Inst = { p: [number, number, number]; r?: [number, number, number]; s?: number | [number, number, number]; c?: string };

export function InstancedSet({
  items,
  geometry,
  color = "#ffffff",
  shadow = true,
  flat = true,
  roughness = 0.9,
  metalness = 0,
  emissive,
  emissiveIntensity,
  side,
}: {
  items: Inst[];
  geometry: THREE.BufferGeometry;
  color?: string;
  shadow?: boolean;
  flat?: boolean;
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  side?: THREE.Side;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new THREE.Object3D();
    o.rotation.order = "YXZ";
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
  const tinted = items.some((it) => it.c);
  return (
    <instancedMesh ref={ref} args={[geometry, undefined, items.length]} castShadow={shadow} receiveShadow>
      <meshStandardMaterial
        color={tinted ? "#ffffff" : color}
        flatShading={flat}
        roughness={roughness}
        metalness={metalness}
        emissive={emissive ?? "#000000"}
        emissiveIntensity={emissiveIntensity ?? 0}
        side={side ?? THREE.FrontSide}
      />
    </instancedMesh>
  );
}

const pick = <T,>(list: T[], r: number) => list[Math.floor(r * list.length) % list.length];

/** Geometri pita yang mengikuti lintasan antara offset `a` dan `b`. */
function ribbon(a: number, b: number, y: number, vertical?: [number, number]) {
  const vertices: number[] = [];
  const indices: number[] = [];
  TRACK.points.forEach((point, index) => {
    const n = TRACK.normals[index];
    if (vertical) {
      vertices.push(point.x + n.x * a, vertical[0], point.z + n.z * a);
      vertices.push(point.x + n.x * a, vertical[1], point.z + n.z * a);
    } else {
      vertices.push(point.x + n.x * a, y, point.z + n.z * a);
      vertices.push(point.x + n.x * b, y, point.z + n.z * b);
    }
    const i0 = index * 2;
    const i1 = ((index + 1) % SAMPLES) * 2;
    indices.push(i0, i0 + 1, i1, i0 + 1, i1 + 1, i1);
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function canvasTexture(width: number, height: number, draw: (g: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext("2d")!);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function fitText(g: CanvasRenderingContext2D, text: string, maxWidth: number, size: number, weight = 900) {
  let s = size;
  do {
    g.font = `${weight} ${s}px system-ui, -apple-system, "Segoe UI", sans-serif`;
    s -= 4;
  } while (g.measureText(text).width > maxWidth && s > 12);
}

/* ------------------------------------------------------------------ */
/* Langit, cahaya, awan, burung                                        */
/* ------------------------------------------------------------------ */

const srgb = (hex: string) => {
  const c = new THREE.Color();
  c.setStyle(hex, THREE.SRGBColorSpace);
  const out = { r: 0, g: 0, b: 0 };
  c.getRGB(out, THREE.SRGBColorSpace);
  return new THREE.Vector3(out.r, out.g, out.b);
};

export function SkyDome() {
  const mesh = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        toneMapped: false,
        uniforms: { top: { value: srgb(SKY_TOP) }, horizon: { value: srgb(HORIZON) }, sunDir: { value: SUN_DIR.clone() } },
        // Output langsung dalam sRGB agar warna cakrawala sama persis dengan warna kabut.
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 top;
          uniform vec3 horizon;
          uniform vec3 sunDir;
          varying vec3 vDir;
          void main() {
            vec3 d = normalize(vDir);
            float h = max(d.y, 0.0);
            vec3 col = mix(horizon, top, pow(h, 0.5));
            float s = max(dot(d, sunDir), 0.0);
            col += vec3(1.0, 0.94, 0.78) * (pow(s, 900.0) * 1.4 + pow(s, 30.0) * 0.22 + pow(s, 6.0) * 0.06);
            gl_FragColor = vec4(min(col, vec3(1.0)), 1.0);
          }`,
      }),
    []
  );
  useFrame(() => mesh.current?.position.copy(camera.position));
  return (
    <mesh ref={mesh} material={material} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[800, 32, 16]} />
    </mesh>
  );
}

function SunLight({ focus, quality }: { focus: RefObject<{ pos: THREE.Vector3 }>; quality: GameQuality }) {
  const light = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const size = quality === "tinggi" ? 2048 : 1024;
  useFrame(() => {
    const p = focus.current.pos;
    // Dibulatkan ke grid kasar supaya bayangan tidak "bergetar" saat bergerak.
    const x = Math.round(p.x / 2) * 2;
    const z = Math.round(p.z / 2) * 2;
    target.position.set(x, 0, z);
    target.updateMatrixWorld();
    light.current?.position.set(x + SUN_DIR.x * 90, SUN_DIR.y * 90, z + SUN_DIR.z * 90);
  });
  return (
    <>
      <primitive object={target} />
      <ambientLight intensity={0.25} color="#fff6e8" />
      <hemisphereLight intensity={1.05} color="#dcefff" groundColor="#5f7a44" />
      <directionalLight
        ref={light}
        target={target}
        castShadow
        intensity={2.2}
        color="#fff0d4"
        shadow-mapSize={[size, size]}
        shadow-camera-left={-48}
        shadow-camera-right={48}
        shadow-camera-top={48}
        shadow-camera-bottom={-48}
        shadow-camera-near={1}
        shadow-camera-far={220}
        shadow-bias={-0.0004}
        shadow-normalBias={0.05}
      />
    </>
  );
}

export function Clouds({ count, center = TRACK.center }: { count: number; center?: { x: number; z: number } }) {
  const group = useRef<THREE.Group>(null);
  const clouds = useMemo(() => {
    const rand = seeded(99);
    return Array.from({ length: count }, () => ({
      x: (rand() * 2 - 1) * 420,
      z: (rand() * 2 - 1) * 340,
      y: 75 + rand() * 55,
      speed: 2 + rand() * 3,
      scale: 5 + rand() * 7,
      puffs: Array.from({ length: 4 + Math.floor(rand() * 4) }, (_, k) => ({
        x: (k - 2) * 1.25 + (rand() - 0.5),
        y: (rand() - 0.3) * 0.7,
        z: (rand() - 0.5) * 1.4,
        s: 0.8 + rand() * 0.8,
      })),
    }));
  }, [count]);
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
  useFrame((_, raw) => {
    const delta = clampDelta(raw);
    group.current?.children.forEach((child, k) => {
      child.position.x += clouds[k].speed * delta;
      if (child.position.x > center.x + 440) child.position.x -= 880;
    });
  });
  return (
    <group ref={group}>
      {clouds.map((cloud, k) => (
        <group key={k} position={[center.x + cloud.x, cloud.y, center.z + cloud.z]} scale={cloud.scale}>
          {cloud.puffs.map((puff, i) => (
            <mesh key={i} geometry={geometry} position={[puff.x, puff.y, puff.z]} scale={puff.s}>
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.35} flatShading roughness={1} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export function Birds({ center = TRACK.center, spread = 1 }: { center?: { x: number; z: number }; spread?: number }) {
  const flocks = useMemo(() => {
    const rand = seeded(5);
    return Array.from({ length: 3 }, (_, k) => ({
      cx: center.x + (rand() * 2 - 1) * 90 * spread,
      cz: center.z + (rand() * 2 - 1) * 60 * spread,
      y: 26 + rand() * 18,
      radius: (40 + rand() * 50) * spread,
      speed: (0.12 + rand() * 0.08) * (k % 2 ? 1 : -1),
      phase: rand() * Math.PI * 2,
      birds: Array.from({ length: 5 + (k % 3) }, (_, i) => ({ dx: (i % 3) * 2.2 - 2, dz: -Math.floor(i / 2) * 2.4, dy: (rand() - 0.5) * 1.2, flap: rand() * 6 })),
    }));
  }, [center, spread]);
  const refs = useRef<(THREE.Group | null)[]>([]);
  const wings = useRef<THREE.Object3D[]>([]);
  const clock = useRef(0);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    const t = clock.current;
    flocks.forEach((flock, k) => {
      const g = refs.current[k];
      if (!g) return;
      const a = flock.phase + t * flock.speed;
      g.position.set(flock.cx + Math.cos(a) * flock.radius, flock.y + Math.sin(t * 0.7 + k) * 2, flock.cz + Math.sin(a) * flock.radius);
      g.rotation.y = Math.atan2(-Math.sin(a) * Math.sign(flock.speed), Math.cos(a) * Math.sign(flock.speed));
    });
    wings.current.forEach((wing, i) => {
      wing.rotation.z = Math.sin(t * 9 + i * 1.7) * 0.55 * (i % 2 ? 1 : -1);
    });
  });
  const addWing = (node: THREE.Object3D | null) => {
    if (node && !wings.current.includes(node)) wings.current.push(node);
  };
  return (
    <>
      {flocks.map((flock, k) => (
        <group key={k} ref={(node) => { refs.current[k] = node; }}>
          {flock.birds.map((bird, i) => (
            <group key={i} position={[bird.dx, bird.dy, bird.dz]}>
              {[-1, 1].map((side) => (
                <group key={side} ref={addWing}>
                  <mesh position={[side * 0.45, 0, 0]}>
                    <boxGeometry args={[0.9, 0.04, 0.32]} />
                    <meshBasicMaterial color="#2b2f36" />
                  </mesh>
                </group>
              ))}
            </group>
          ))}
        </group>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Tanah, danau, sawah                                                 */
/* ------------------------------------------------------------------ */

const GRASS_A = new THREE.Color("#5c9a43");
const GRASS_B = new THREE.Color("#8cbd5a");
const DRY = new THREE.Color("#b9b86c");
const FOREST = new THREE.Color("#3f7536");
const ROCK = new THREE.Color("#8b8c7c");
const PEAK = new THREE.Color("#c3c6ba");
const SAND = new THREE.Color("#d8c690");
const MUD = new THREE.Color("#7c6c4c");
const VERGE = new THREE.Color("#6fa64c");

function Terrain({ quality }: { quality: GameQuality }) {
  const geometry = useMemo(() => {
    const size = 1560;
    const segments = quality === "hemat" ? 130 : quality === "tinggi" ? 230 : 180;
    const plane = new THREE.PlaneGeometry(size, size, segments, segments);
    plane.rotateX(-Math.PI / 2);
    plane.translate(TRACK.center.x, 0, TRACK.center.z);
    const position = plane.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(position.count * 3);
    const color = new THREE.Color();
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const z = position.getZ(i);
      const d = distanceToTrack(x, z);
      const h = terrainHeight(x, z, d);
      position.setY(i, h);
      const n = fbm(x * 0.035, z * 0.035, 3);
      color.copy(GRASS_A).lerp(GRASS_B, THREE.MathUtils.clamp(n * 1.5 - 0.25, 0, 1));
      const dry = THREE.MathUtils.smoothstep(fbm(x * 0.009 + 40, z * 0.009 - 11, 3), 0.56, 0.72);
      color.lerp(DRY, dry * 0.55);
      if (h > 6) color.lerp(FOREST, THREE.MathUtils.smoothstep(h, 6, 22) * 0.8);
      if (h > 45) color.lerp(ROCK, THREE.MathUtils.smoothstep(h, 45, 80));
      if (h > 110) color.lerp(PEAK, THREE.MathUtils.smoothstep(h, 110, 150));
      if (d < RAIL_OFFSET + 3) color.lerp(VERGE, 0.6);
      const lakeDistance = Math.hypot(x - LAKE.x, z - LAKE.z);
      if (lakeDistance < LAKE.r * 1.3) {
        color.lerp(SAND, 1 - THREE.MathUtils.smoothstep(lakeDistance, LAKE.r * 0.95, LAKE.r * 1.3));
        if (h < WATER_LEVEL) color.copy(MUD);
      }
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
}

function Lake() {
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const clock = useRef(0);
  const lilies = useMemo<Inst[]>(() => {
    const rand = seeded(12);
    return Array.from({ length: 26 }, () => {
      const a = rand() * Math.PI * 2;
      const r = LAKE.r * (0.35 + rand() * 0.45);
      return { p: [LAKE.x + Math.cos(a) * r, WATER_LEVEL + 0.03, LAKE.z + Math.sin(a) * r], r: [0, rand() * 6, 0], s: [0.8 + rand() * 0.8, 1, 0.8 + rand() * 0.8], c: rand() > 0.8 ? "#f7a8c8" : "#4f9a3a" };
    });
  }, []);
  const lilyGeometry = useMemo(() => new THREE.CylinderGeometry(0.7, 0.7, 0.04, 9), []);
  const pier = useMemo(() => {
    const a = Math.atan2(TRACK.center.z - LAKE.z, TRACK.center.x - LAKE.x) + 0.8;
    const edge = { x: LAKE.x + Math.cos(a) * LAKE.r * 0.95, z: LAKE.z + Math.sin(a) * LAKE.r * 0.95 };
    return { x: edge.x - Math.cos(a) * 5, z: edge.z - Math.sin(a) * 5, rot: Math.atan2(Math.cos(a), Math.sin(a)) };
  }, []);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    if (material.current) material.current.emissiveIntensity = 0.12 + Math.sin(clock.current * 1.3) * 0.04;
  });
  if (LAKE.r < 8) return null;
  return (
    <group>
      <mesh position={[LAKE.x, WATER_LEVEL, LAKE.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[LAKE.r * 1.25, 48]} />
        <meshStandardMaterial ref={material} color="#3f93b8" emissive="#6fc3e0" emissiveIntensity={0.12} roughness={0.12} metalness={0.25} transparent opacity={0.9} />
      </mesh>
      <InstancedSet items={lilies} geometry={lilyGeometry} shadow={false} />
      <group position={[pier.x, 0, pier.z]} rotation={[0, pier.rot, 0]}>
        <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 0.18, 11]} />
          <meshStandardMaterial color="#8b6b47" />
        </mesh>
        {[-4.5, -1.5, 1.5, 4.5].flatMap((z) =>
          [-0.8, 0.8].map((x) => (
            <mesh key={`${x}:${z}`} position={[x, -0.6, z]}>
              <cylinderGeometry args={[0.1, 0.1, 1.5, 6]} />
              <meshStandardMaterial color="#5e472f" />
            </mesh>
          ))
        )}
      </group>
    </group>
  );
}

function Paddies() {
  const texture = useMemo(
    () =>
      canvasTexture(512, 512, (g) => {
        g.fillStyle = "#86b94a";
        g.fillRect(0, 0, 512, 512);
        const rand = seeded(8);
        // Beberapa petak baru ditanami: masih tergenang air.
        for (let px = 0; px < 3; px++) {
          for (let pz = 0; pz < 2; pz++) {
            const wet = rand() > 0.55;
            g.fillStyle = wet ? "#8fb9a8" : rand() > 0.5 ? "#7fb342" : "#a6c455";
            g.fillRect(px * 171, pz * 256, 171, 256);
            g.strokeStyle = wet ? "#6f9f5a" : "#5f9433";
            g.lineWidth = wet ? 2 : 4;
            for (let y = pz * 256 + 8; y < (pz + 1) * 256; y += 11) {
              g.beginPath();
              g.moveTo(px * 171 + 6, y);
              g.lineTo((px + 1) * 171 - 6, y);
              g.stroke();
            }
          }
        }
        g.strokeStyle = "#a08a5c";
        g.lineWidth = 10;
        g.strokeRect(5, 5, 502, 502);
        [171, 342].forEach((x) => {
          g.beginPath();
          g.moveTo(x, 0);
          g.lineTo(x, 512);
          g.stroke();
        });
        g.beginPath();
        g.moveTo(0, 256);
        g.lineTo(512, 256);
        g.stroke();
      }),
    []
  );
  return (
    <group>
      {PADDIES.map((paddy, k) => {
        const hutX = paddy.w / 2 - 3;
        const hutZ = paddy.d / 2 + 3;
        return (
          <group key={k} position={[paddy.x, 0, paddy.z]} rotation={[0, -paddy.angle, 0]}>
            <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[paddy.w, paddy.d]} />
              <meshStandardMaterial map={texture} roughness={0.85} />
            </mesh>
            {/* Gubuk jaga sawah */}
            <group position={[hutX, 0, hutZ]}>
              {[-1, 1].flatMap((x) =>
                [-1, 1].map((z) => (
                  <mesh key={`${x}:${z}`} position={[x * 1.1, 1.1, z * 1.1]} castShadow>
                    <cylinderGeometry args={[0.1, 0.1, 2.2, 5]} />
                    <meshStandardMaterial color="#6d5236" />
                  </mesh>
                ))
              )}
              <mesh position={[0, 0.9, 0]} castShadow>
                <boxGeometry args={[2.4, 0.12, 2.4]} />
                <meshStandardMaterial color="#9c7a50" />
              </mesh>
              <mesh position={[0, 2.8, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                <coneGeometry args={[2.3, 1.4, 4]} />
                <meshStandardMaterial color="#c9a76a" flatShading />
              </mesh>
            </group>
          </group>
        );
      })}
    </group>
  );
}

function Kites() {
  const kites = useMemo(() => {
    const colors = ["#e54b4b", "#f2c14e", "#2d6cdf"];
    return PADDIES.slice(0, 3).map((paddy, k) => ({ x: paddy.x, z: paddy.z, h: 30 + k * 6, color: colors[k % 3], phase: k * 2.1 }));
  }, []);
  const refs = useRef<(THREE.Group | null)[]>([]);
  const lines = useMemo(
    () =>
      kites.map((kite) => {
        const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(kite.x, 0.2, kite.z), new THREE.Vector3(kite.x, kite.h, kite.z)]);
        return new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: "#f5f1e8", transparent: true, opacity: 0.6 }));
      }),
    [kites]
  );
  const clock = useRef(0);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    const t = clock.current;
    kites.forEach((kite, k) => {
      const g = refs.current[k];
      if (!g) return;
      const x = kite.x + 10 + Math.sin(t * 0.6 + kite.phase) * 3;
      const y = kite.h + Math.sin(t * 0.9 + kite.phase) * 1.5;
      const z = kite.z + Math.cos(t * 0.5 + kite.phase) * 2;
      g.position.set(x, y, z);
      g.rotation.z = Math.sin(t * 1.4 + kite.phase) * 0.3;
      const pos = lines[k].geometry.attributes.position as THREE.BufferAttribute;
      pos.setXYZ(1, x, y - 1.2, z);
      pos.needsUpdate = true;
    });
  });
  return (
    <>
      {lines.map((line, k) => (
        <primitive key={`l${k}`} object={line} />
      ))}
      {kites.map((kite, k) => (
        <group key={k} ref={(node) => { refs.current[k] = node; }}>
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <planeGeometry args={[2, 2]} />
            <meshStandardMaterial color={kite.color} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, -2.2, 0]}>
            <boxGeometry args={[0.08, 2.2, 0.02]} />
            <meshBasicMaterial color="#fffdf5" />
          </mesh>
        </group>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Jalan                                                               */
/* ------------------------------------------------------------------ */

function Road() {
  const geo = useMemo(() => {
    const asphalt = ribbon(-ROAD_HALF, ROAD_HALF, 0.03);
    const shoulderL = ribbon(-ROAD_HALF - 2.3, -ROAD_HALF - 0.6, 0.02);
    const shoulderR = ribbon(ROAD_HALF + 0.6, ROAD_HALF + 2.3, 0.02);
    const edgeL = ribbon(-ROAD_HALF + 0.35, -ROAD_HALF + 0.6, 0.05);
    const edgeR = ribbon(ROAD_HALF - 0.6, ROAD_HALF - 0.35, 0.05);
    const railL = ribbon(-RAIL_OFFSET, 0, 0, [0.55, 0.95]);
    const railR = ribbon(RAIL_OFFSET, 0, 0, [0.55, 0.95]);
    return { asphalt, shoulderL, shoulderR, edgeL, edgeR, railL, railR };
  }, []);
  const parts = useMemo(() => {
    const dashes: Inst[] = [];
    const curbs: Inst[] = [];
    const posts: Inst[] = [];
    TRACK.points.forEach((p, i) => {
      const heading = headingAt(i);
      const n = TRACK.normals[i];
      if (i % 12 === 0) dashes.push({ p: [p.x, 0.05, p.z], r: [0, heading, 0], s: [0.28, 1, 3.2] });
      if (i % 2 === 0) {
        const red = Math.floor(i / 2) % 2 === 0;
        [1, -1].forEach((side) => {
          const e = p.clone().addScaledVector(n, side * (ROAD_HALF + 0.3));
          curbs.push({ p: [e.x, 0.08, e.z], r: [0, heading, 0], s: [0.6, 0.16, 1.2], c: red ? "#d9463f" : "#f5f1e8" });
        });
      }
      if (i % 7 === 0) {
        [1, -1].forEach((side) => {
          const e = p.clone().addScaledVector(n, side * (RAIL_OFFSET + 0.12));
          posts.push({ p: [e.x, 0.5, e.z], r: [0, heading, 0], s: [0.16, 1, 0.16] });
        });
      }
    });
    return { dashes, curbs, posts };
  }, []);
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const plane = useMemo(() => new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), []);

  const decal = (color: string, offset: number) => (
    <meshStandardMaterial color={color} roughness={0.8} polygonOffset polygonOffsetFactor={offset} polygonOffsetUnits={offset} />
  );
  return (
    <group>
      <mesh geometry={geo.asphalt} receiveShadow>
        {decal("#474c57", -2)}
      </mesh>
      <mesh geometry={geo.shoulderL} receiveShadow>{decal("#b7a171", -1)}</mesh>
      <mesh geometry={geo.shoulderR} receiveShadow>{decal("#b7a171", -1)}</mesh>
      <mesh geometry={geo.edgeL}>{decal("#f4f1ea", -4)}</mesh>
      <mesh geometry={geo.edgeR}>{decal("#f4f1ea", -4)}</mesh>
      <InstancedSet items={parts.dashes} geometry={plane} color="#f4f1ea" shadow={false} flat={false} />
      <InstancedSet items={parts.curbs} geometry={box} shadow={false} />
      <InstancedSet items={parts.posts} geometry={box} color="#8d939c" metalness={0.4} roughness={0.5} />
      {[geo.railL, geo.railR].map((rail, k) => (
        <mesh key={k} geometry={rail} castShadow receiveShadow>
          <meshStandardMaterial color="#c9ced6" metalness={0.55} roughness={0.35} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function StartGantry() {
  const index = 0;
  const p = TRACK.points[index];
  const heading = headingAt(index);
  const banner = useMemo(
    () =>
      canvasTexture(1024, 160, (g) => {
        const cell = 32;
        for (let x = 0; x < 1024; x += cell) {
          for (let y = 0; y < 160; y += cell) {
            g.fillStyle = (x / cell + y / cell) % 2 === 0 ? "#111318" : "#f7f5ef";
            g.fillRect(x, y, cell, cell);
          }
        }
        g.fillStyle = "#f26b3a";
        g.fillRect(250, 22, 524, 116);
        g.fillStyle = "#ffffff";
        g.textAlign = "center";
        g.textBaseline = "middle";
        fitText(g, "START · FINISH", 480, 72);
        g.fillText("START · FINISH", 512, 82);
      }),
    []
  );
  const checker = useMemo(
    () =>
      canvasTexture(512, 64, (g) => {
        for (let x = 0; x < 512; x += 32) {
          for (let y = 0; y < 64; y += 32) {
            g.fillStyle = (x / 32 + y / 32) % 2 === 0 ? "#15171c" : "#f7f5ef";
            g.fillRect(x, y, 32, 32);
          }
        }
      }),
    []
  );
  return (
    <group position={[p.x, 0, p.z]} rotation={[0, heading, 0]}>
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROAD_HALF * 2, 1.6]} />
        <meshStandardMaterial map={checker} polygonOffset polygonOffsetFactor={-4} polygonOffsetUnits={-4} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (ROAD_HALF + 1.4), 4, 0]} castShadow>
          <boxGeometry args={[0.8, 8, 0.8]} />
          <meshStandardMaterial color="#2a2d33" metalness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 7.6, 0]} castShadow>
        <boxGeometry args={[ROAD_HALF * 2 + 3.6, 1.5, 0.5]} />
        <meshStandardMaterial color="#2a2d33" />
      </mesh>
      {[1, -1].map((face) => (
        <mesh key={face} position={[0, 7.6, face * 0.27]} rotation={[0, face === 1 ? 0 : Math.PI, 0]}>
          <planeGeometry args={[ROAD_HALF * 2 + 3.2, 1.3]} />
          <meshStandardMaterial map={banner} emissive="#ffffff" emissiveMap={banner} emissiveIntensity={0.25} />
        </mesh>
      ))}
    </group>
  );
}

function StreetLamps() {
  const parts = useMemo(() => {
    const poles: Inst[] = [];
    const arms: Inst[] = [];
    const heads: Inst[] = [];
    for (let i = 0, k = 0; i < SAMPLES; i += 64, k++) {
      const side = k % 2 === 0 ? 1 : -1;
      const p = TRACK.points[i];
      const n = TRACK.normals[i];
      const base = p.clone().addScaledVector(n, side * (RAIL_OFFSET + 1));
      const inward = n.clone().multiplyScalar(-side);
      const rot = Math.atan2(inward.x, inward.z);
      poles.push({ p: [base.x, 3.6, base.z], s: [0.14, 7.2, 0.14] });
      const arm = base.clone().addScaledVector(inward, 1.4);
      arms.push({ p: [arm.x, 7.1, arm.z], r: [0, rot, 0], s: [0.1, 0.1, 2.8] });
      const head = base.clone().addScaledVector(inward, 2.7);
      heads.push({ p: [head.x, 6.95, head.z], r: [0, rot, 0], s: [0.45, 0.18, 0.8] });
    }
    return { poles, arms, heads };
  }, []);
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const pole = useMemo(() => new THREE.CylinderGeometry(1, 1, 1, 6), []);
  return (
    <>
      <InstancedSet items={parts.poles} geometry={pole} color="#5d636d" metalness={0.4} roughness={0.5} />
      <InstancedSet items={parts.arms} geometry={box} color="#5d636d" metalness={0.4} roughness={0.5} />
      <InstancedSet items={parts.heads} geometry={box} color="#fff3cf" emissive="#ffe6a3" emissiveIntensity={0.6} shadow={false} />
    </>
  );
}

const BILLBOARDS = [
  { title: "ERP", sub: "Satu data untuk semua divisi", bg: "#1e3a5f", fg: "#ffffff", accent: "#ffa987" },
  { title: "ORDER → KIRIM → FAKTUR", sub: "Alur order-to-cash yang terintegrasi", bg: "#f26b3a", fg: "#ffffff", accent: "#1e1e24" },
  { title: "SEMEN NUSANTARA", sub: "Kuat · Tepat waktu · Terlacak", bg: "#f4f1ea", fg: "#1e1e24", accent: "#e54b4b" },
  { title: "STOK REAL-TIME", sub: "Gudang, produksi & penjualan selalu sinkron", bg: "#2f8f5b", fg: "#ffffff", accent: "#f2c14e" },
];

function Billboards() {
  const textures = useMemo(
    () =>
      BILLBOARDS.map((board) =>
        canvasTexture(1024, 440, (g) => {
          g.fillStyle = board.bg;
          g.fillRect(0, 0, 1024, 440);
          g.fillStyle = board.accent;
          g.fillRect(0, 380, 1024, 60);
          g.fillStyle = board.fg;
          g.textAlign = "center";
          g.textBaseline = "middle";
          fitText(g, board.title, 920, 150);
          g.fillText(board.title, 512, 165);
          fitText(g, board.sub, 900, 54, 700);
          g.fillText(board.sub, 512, 300);
        })
      ),
    []
  );
  return (
    <>
      {LAYOUT.billboards.map((board) => (
        <group key={board.k} position={[board.x, 0, board.z]} rotation={[0, board.rot, 0]}>
          {[-3.6, 3.6].map((x) => (
            <mesh key={x} position={[x, 3, -0.2]} castShadow>
              <boxGeometry args={[0.35, 6, 0.35]} />
              <meshStandardMaterial color="#4a4f58" metalness={0.3} />
            </mesh>
          ))}
          <mesh position={[0, 6.6, -0.3]} castShadow>
            <boxGeometry args={[11.6, 5.2, 0.3]} />
            <meshStandardMaterial color="#2a2d33" />
          </mesh>
          <mesh position={[0, 6.6, -0.14]}>
            <planeGeometry args={[11.2, 4.8]} />
            <meshStandardMaterial map={textures[board.k]} emissive="#ffffff" emissiveMap={textures[board.k]} emissiveIntensity={0.2} roughness={0.6} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Pepohonan, semak, batu, bunga, desa                                 */
/* ------------------------------------------------------------------ */

const LEAF_GREENS = ["#3f8f3f", "#4e9a3c", "#5ea845", "#377f3a", "#6aad4c", "#2f7a3e"];
const PALM_GREENS = ["#4f9a3a", "#5aa846", "#3f8a35", "#67b04a"];
const PINE_GREENS = ["#2f6b3a", "#2c5f35", "#3a7a44"];

function useVegetation(quality: GameQuality) {
  return useMemo(() => {
    const rand = seeded(2024);
    const budget =
      quality === "hemat"
        ? { trees: 340, bushes: 180, rocks: 60, flowers: 160 }
        : quality === "tinggi"
          ? { trees: 1100, bushes: 560, rocks: 170, flowers: 560 }
          : { trees: 760, bushes: 380, rocks: 110, flowers: 380 };
    const trunks: Inst[] = [];
    const crowns: Inst[] = [];
    const palmTrunks: Inst[] = [];
    const leaves: Inst[] = [];
    const coconuts: Inst[] = [];
    const pines: Inst[] = [];
    const bushes: Inst[] = [];
    const rocks: Inst[] = [];
    const flowers: Inst[] = [];
    const occupied: Zone[] = [...LAYOUT.reserved, ...LAYOUT.villages.map((v) => ({ x: v.x, z: v.z, r: 20 }))];
    const blocked = (x: number, z: number, d: number, margin: number) =>
      d < RAIL_OFFSET + margin ||
      Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r * 1.15 + 1.5 ||
      paddyMask(x, z) > 0.01 ||
      inZone(x, z, occupied);

    const addRound = (x: number, z: number, h: number) => {
      const s = 0.8 + rand() * 0.8;
      const th = 1.8 + rand() * 1.4;
      trunks.push({ p: [x, h, z], r: [0, rand() * 6, 0], s: [s, th * s, s], c: "#6b4a2f" });
      const top = h + (th + 0.8) * s;
      crowns.push({ p: [x, top, z], r: [rand(), rand() * 6, 0], s: 1.7 * s, c: pick(LEAF_GREENS, rand()) });
      crowns.push({ p: [x + (rand() - 0.5) * 1.6 * s, top - 0.4 * s, z + (rand() - 0.5) * 1.6 * s], r: [rand(), rand() * 6, 0], s: 1.2 * s, c: pick(LEAF_GREENS, rand()) });
      if (rand() > 0.5) crowns.push({ p: [x, top + 1.0 * s, z], r: [0, rand() * 6, 0], s: 1.0 * s, c: pick(LEAF_GREENS, rand()) });
    };
    const addPalm = (x: number, z: number, h: number) => {
      const height = 5.5 + rand() * 3.5;
      const tilt = 0.08 + rand() * 0.22;
      const yaw = rand() * Math.PI * 2;
      const euler = new THREE.Euler(tilt, yaw, 0, "YXZ");
      const top = new THREE.Vector3(0, height, 0).applyEuler(euler).add(new THREE.Vector3(x, h, z));
      palmTrunks.push({ p: [x, h, z], r: [tilt, yaw, 0], s: [1, height, 1], c: "#8a6a45" });
      const count = 7;
      for (let k = 0; k < count; k++) {
        leaves.push({ p: [top.x, top.y, top.z], r: [0.35 + rand() * 0.35, (k / count) * Math.PI * 2 + rand() * 0.4, 0], s: 0.9 + rand() * 0.35, c: pick(PALM_GREENS, rand()) });
      }
      for (let k = 0; k < 3; k++) coconuts.push({ p: [top.x + Math.cos(k * 2.1) * 0.3, top.y - 0.3, top.z + Math.sin(k * 2.1) * 0.3], s: 0.22, c: "#6b5a2a" });
    };
    const addPine = (x: number, z: number, h: number) => {
      const s = 0.9 + rand() * 0.7;
      trunks.push({ p: [x, h, z], s: [0.8 * s, 1.4 * s, 0.8 * s], c: "#5a3f28" });
      const c = pick(PINE_GREENS, rand());
      pines.push({ p: [x, h + 1.0 * s, z], r: [0, rand() * 6, 0], s: [2.4 * s, 3.6 * s, 2.4 * s], c });
      pines.push({ p: [x, h + 3.0 * s, z], r: [0, rand() * 6, 0], s: [1.8 * s, 3.0 * s, 1.8 * s], c });
      pines.push({ p: [x, h + 4.8 * s, z], r: [0, rand() * 6, 0], s: [1.1 * s, 2.2 * s, 1.1 * s], c });
    };

    // Pohon: tersebar berkelompok (hutan kecil) mengikuti noise, makin rapat di bukit.
    let placed = 0;
    for (let attempt = 0; attempt < budget.trees * 14 && placed < budget.trees; attempt++) {
      const x = TRACK.center.x + (rand() * 2 - 1) * 400;
      const z = TRACK.center.z + (rand() * 2 - 1) * 330;
      const grove = fbm(x * 0.02 + 9, z * 0.02 - 3, 3);
      if (rand() > grove * 1.9 - 0.45) continue;
      const d = distanceToTrack(x, z);
      if (blocked(x, z, d, 7)) continue;
      const h = terrainHeight(x, z, d);
      if (h > 95) continue;
      const nearLake = Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r + 20;
      const roll = rand();
      if (h > 12) (roll < 0.7 ? addPine : addRound)(x, z, h);
      else if (nearLake || roll < 0.32) addPalm(x, z, h);
      else if (roll < 0.85) addRound(x, z, h);
      else addPine(x, z, h);
      placed++;
    }
    // Deretan pohon peneduh di pinggir jalan.
    for (let i = 0; i < SAMPLES; i += 9) {
      if (rand() < 0.35) continue;
      const side = rand() > 0.5 ? 1 : -1;
      const p = pointAt(i / SAMPLES, side * (RAIL_OFFSET + 8 + rand() * 6));
      const d = distanceToTrack(p.x, p.z);
      if (blocked(p.x, p.z, d, 7)) continue;
      (rand() < 0.4 ? addPalm : addRound)(p.x, p.z, terrainHeight(p.x, p.z, d));
    }
    // Semak — separuh di dekat jalan.
    for (let k = 0; k < budget.bushes; k++) {
      let x: number, z: number;
      if (k % 2 === 0) {
        const p = pointAt(rand(), (rand() > 0.5 ? 1 : -1) * (RAIL_OFFSET + 1.8 + rand() * 12));
        x = p.x;
        z = p.z;
      } else {
        x = TRACK.center.x + (rand() * 2 - 1) * 330;
        z = TRACK.center.z + (rand() * 2 - 1) * 260;
      }
      const d = distanceToTrack(x, z);
      if (blocked(x, z, d, 1.6)) continue;
      const s = 0.7 + rand() * 0.9;
      bushes.push({ p: [x, terrainHeight(x, z, d) + 0.35 * s, z], r: [0, rand() * 6, 0], s: [1.3 * s, 0.85 * s, 1.3 * s], c: pick(LEAF_GREENS, rand()) });
    }
    for (let k = 0; k < budget.rocks; k++) {
      const x = TRACK.center.x + (rand() * 2 - 1) * 360;
      const z = TRACK.center.z + (rand() * 2 - 1) * 290;
      const d = distanceToTrack(x, z);
      if (blocked(x, z, d, 2)) continue;
      const s = 0.4 + rand() * 1.5;
      rocks.push({ p: [x, terrainHeight(x, z, d) + 0.2 * s, z], r: [rand() * 3, rand() * 6, rand() * 3], s: [s * 1.3, s * 0.8, s], c: pick(["#8b8d86", "#9a9a90", "#7a7c76", "#a39c8c"], rand()) });
    }
    for (let k = 0; k < budget.flowers; k++) {
      const p = pointAt(rand(), (rand() > 0.5 ? 1 : -1) * (RAIL_OFFSET + 0.9 + rand() * 6));
      const d = distanceToTrack(p.x, p.z);
      if (blocked(p.x, p.z, d, 0.8)) continue;
      flowers.push({ p: [p.x, terrainHeight(p.x, p.z, d) + 0.25, p.z], s: 0.6 + rand() * 0.6, c: pick(["#ff6b9a", "#ffd23f", "#ffffff", "#ff8c42", "#c77dff", "#ff4d4d"], rand()) });
    }
    return { trunks, crowns, palmTrunks, leaves, coconuts, pines, bushes, rocks, flowers };
  }, [quality]);
}

function Vegetation({ quality }: { quality: GameQuality }) {
  const v = useVegetation(quality);
  const geo = useMemo(() => {
    const trunk = new THREE.CylinderGeometry(0.2, 0.3, 1, 6).translate(0, 0.5, 0);
    const palmTrunk = new THREE.CylinderGeometry(0.16, 0.26, 1, 6).translate(0, 0.5, 0);
    const crown = new THREE.IcosahedronGeometry(1, 0);
    const leaf = new THREE.BoxGeometry(0.55, 0.06, 3).translate(0, 0, 1.5);
    const cone = new THREE.ConeGeometry(1, 1, 7).translate(0, 0.5, 0);
    const bush = new THREE.IcosahedronGeometry(1, 0);
    const rock = new THREE.DodecahedronGeometry(1, 0);
    const flower = new THREE.IcosahedronGeometry(0.2, 0);
    const ball = new THREE.SphereGeometry(1, 6, 5);
    return { trunk, palmTrunk, crown, leaf, cone, bush, rock, flower, ball };
  }, []);
  return (
    <>
      <InstancedSet items={v.trunks} geometry={geo.trunk} />
      <InstancedSet items={v.crowns} geometry={geo.crown} />
      <InstancedSet items={v.palmTrunks} geometry={geo.palmTrunk} />
      <InstancedSet items={v.leaves} geometry={geo.leaf} side={THREE.DoubleSide} />
      <InstancedSet items={v.coconuts} geometry={geo.ball} shadow={false} />
      <InstancedSet items={v.pines} geometry={geo.cone} />
      <InstancedSet items={v.bushes} geometry={geo.bush} />
      <InstancedSet items={v.rocks} geometry={geo.rock} />
      <InstancedSet items={v.flowers} geometry={geo.flower} shadow={false} />
    </>
  );
}

const WALLS = ["#f4efe4", "#f2e2c4", "#dfeee4", "#f6d9c9", "#e6ecf5", "#fff3c4"];
const ROOFS = ["#b5532f", "#c4643a", "#9c4428", "#8a5a3c", "#6f7d8c"];

function Village() {
  const parts = useMemo(() => {
    const rand = seeded(31);
    const walls: Inst[] = [];
    const roofs: Inst[] = [];
    const doors: Inst[] = [];
    const windows: Inst[] = [];
    const houses: { x: number; z: number }[] = [];
    LAYOUT.villages.forEach((village) => {
      for (let attempt = 0, count = 0; attempt < 60 && count < 7; attempt++) {
        const x = village.x + (rand() * 2 - 1) * 20;
        const z = village.z + (rand() * 2 - 1) * 20;
        const d = distanceToTrack(x, z);
        if (d < RAIL_OFFSET + 7 || paddyMask(x, z) > 0 || Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r * 1.2 + 6) continue;
        if (inZone(x, z, LAYOUT.reserved, 4) || houses.some((h) => Math.hypot(h.x - x, h.z - z) < 9)) continue;
        houses.push({ x, z });
        count++;
        const h = terrainHeight(x, z, d);
        const rot = faceRoad(x, z, village.t) + (rand() - 0.5) * 0.3;
        const w = 5 + rand() * 2.5;
        const dd = 4.5 + rand() * 2;
        const hh = 2.8 + rand() * 0.8;
        walls.push({ p: [x, h - 0.3, z], r: [0, rot, 0], s: [w, hh + 0.3, dd], c: pick(WALLS, rand()) });
        roofs.push({ p: [x, h + hh, z], r: [0, rot, 0], s: [(w + 0.8) / 1.414, 1.8 + rand() * 0.6, (dd + 0.8) / 1.414], c: pick(ROOFS, rand()) });
        const fx = Math.sin(rot), fz = Math.cos(rot);
        const rx = Math.cos(rot), rz = -Math.sin(rot);
        const front = dd / 2 + 0.03;
        doors.push({ p: [x + fx * front, h + 0.95, z + fz * front], r: [0, rot, 0], s: [0.95, 1.9, 0.05], c: "#6b4a2f" });
        [-1, 1].forEach((side) => {
          const off = side * w * 0.28;
          windows.push({ p: [x + fx * front + rx * off, h + 1.55, z + fz * front + rz * off], r: [0, rot, 0], s: [0.95, 0.8, 0.05], c: "#2c4a5e" });
        });
      }
    });
    return { walls, roofs, doors, windows };
  }, []);
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), []);
  const centered = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const roof = useMemo(() => new THREE.ConeGeometry(1, 1, 4).rotateY(Math.PI / 4).translate(0, 0.5, 0), []);
  return (
    <>
      <InstancedSet items={parts.walls} geometry={box} roughness={0.8} />
      <InstancedSet items={parts.roofs} geometry={roof} roughness={0.8} />
      <InstancedSet items={parts.doors} geometry={centered} shadow={false} />
      <InstancedSet items={parts.windows} geometry={centered} shadow={false} roughness={0.2} metalness={0.3} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Pabrik semen (dengan asap cerobong)                                 */
/* ------------------------------------------------------------------ */

function Factory() {
  const { x, z, rot } = LAYOUT.factory;
  const h = useMemo(() => terrainHeight(x, z), [x, z]);
  const sign = useMemo(
    () =>
      canvasTexture(1024, 256, (g) => {
        g.fillStyle = "#1e3a5f";
        g.fillRect(0, 0, 1024, 256);
        g.fillStyle = "#ffa987";
        g.fillRect(0, 214, 1024, 42);
        g.fillStyle = "#ffffff";
        g.textAlign = "center";
        g.textBaseline = "middle";
        fitText(g, "PABRIK SEMEN NUSANTARA", 940, 96);
        g.fillText("PABRIK SEMEN NUSANTARA", 512, 100);
        fitText(g, "Produksi & Gudang · terhubung ERP", 900, 44, 700);
        g.fillText("Produksi & Gudang · terhubung ERP", 512, 172);
      }),
    []
  );
  const smoke = useRef<(THREE.Mesh | null)[]>([]);
  const clock = useRef(0);
  const PUFFS = 9;
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    smoke.current.forEach((puff, k) => {
      if (!puff) return;
      const f = (clock.current * 0.12 + k / PUFFS) % 1;
      puff.position.set(-13 + f * 6, 29 + f * 20, -9 + f * 2);
      puff.scale.setScalar(1.2 + f * 4.5);
      (puff.material as THREE.MeshStandardMaterial).opacity = 0.75 * (1 - f);
    });
  });
  const concrete = <meshStandardMaterial color="#e3dfd6" roughness={0.85} />;
  return (
    <group position={[x, h, z]} rotation={[0, rot, 0]}>
      {/* Halaman beton */}
      <mesh position={[0, 0.06, -4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[52, 34]} />
        <meshStandardMaterial color="#b9b5ab" roughness={1} />
      </mesh>
      {/* Gedung produksi */}
      <mesh position={[0, 5, -4]} castShadow receiveShadow>
        <boxGeometry args={[18, 10, 12]} />
        {concrete}
      </mesh>
      <mesh position={[0, 10.3, -4]} castShadow>
        <boxGeometry args={[18.6, 0.6, 12.6]} />
        <meshStandardMaterial color="#3f6fa0" />
      </mesh>
      <mesh position={[0, 7.4, 2.02]}>
        <planeGeometry args={[15, 3.75]} />
        <meshStandardMaterial map={sign} emissive="#ffffff" emissiveMap={sign} emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0, 2.2, 2.03]}>
        <planeGeometry args={[6, 4.4]} />
        <meshStandardMaterial color="#5b6470" metalness={0.3} />
      </mesh>
      {/* Silo */}
      {[[12, -9], [18, -9], [15, -2.5]].map(([sx, sz], k) => (
        <group key={k} position={[sx, 0, sz]}>
          <mesh position={[0, 8.5, 0]} castShadow>
            <cylinderGeometry args={[2.7, 2.7, 17, 16]} />
            {concrete}
          </mesh>
          <mesh position={[0, 18, 0]} castShadow>
            <coneGeometry args={[2.8, 2, 16]} />
            <meshStandardMaterial color="#9aa3ad" />
          </mesh>
          {[5, 11].map((y) => (
            <mesh key={y} position={[0, y, 0]}>
              <cylinderGeometry args={[2.75, 2.75, 0.5, 16]} />
              <meshStandardMaterial color="#f26b3a" />
            </mesh>
          ))}
        </group>
      ))}
      {/* Konveyor ke silo */}
      <mesh position={[6.5, 11.5, -8]} rotation={[0, 0, 0.42]} castShadow>
        <boxGeometry args={[12, 0.9, 1.2]} />
        <meshStandardMaterial color="#6b737e" metalness={0.3} />
      </mesh>
      {/* Tanur putar */}
      <mesh position={[-4, 3, -16]} rotation={[0, 0, Math.PI / 2 + 0.05]} castShadow>
        <cylinderGeometry args={[1.7, 1.7, 22, 14]} />
        <meshStandardMaterial color="#8f7f6b" metalness={0.2} />
      </mesh>
      {[-12, -4, 4].map((kx) => (
        <mesh key={kx} position={[kx, 1, -16]} castShadow>
          <boxGeometry args={[1.2, 2, 3.2]} />
          {concrete}
        </mesh>
      ))}
      {/* Cerobong */}
      <mesh position={[-13, 13, -9]} castShadow>
        <cylinderGeometry args={[1.1, 1.7, 28, 14]} />
        <meshStandardMaterial color="#f1ede4" />
      </mesh>
      {[21, 24.5, 27.3].map((y) => (
        <mesh key={y} position={[-13, y, -9]}>
          <cylinderGeometry args={[1.25 + (27.3 - y) * 0.02, 1.3 + (27.3 - y) * 0.02, 1.3, 14]} />
          <meshStandardMaterial color="#e54b4b" />
        </mesh>
      ))}
      {Array.from({ length: PUFFS }, (_, k) => (
        <mesh key={k} ref={(node) => { smoke.current[k] = node; }}>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color="#f2f2f0" transparent opacity={0.6} depthWrite={false} flatShading />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Lalu lintas                                                         */
/* ------------------------------------------------------------------ */

export interface TrafficCarState {
  kind: TrafficKind;
  lane: number;
  base: number;
  dist: number;
  speed: number;
  pos: THREE.Vector3;
  heading: number;
}

export const TrafficContext = createContext<RefObject<TrafficCarState[]> | null>(null);

const FLEET: { kind: TrafficKind; color: string }[] = [
  { kind: "sedan", color: "#e54b4b" },
  { kind: "angkot", color: "#2d9cdb" },
  { kind: "pickup", color: "#f7f7f2" },
  { kind: "boxtruck", color: "#2fae66" },
  { kind: "sedan", color: "#1e1e24" },
  { kind: "bus", color: "#f2a93b" },
  { kind: "angkot", color: "#8bc34a" },
  { kind: "sedan", color: "#5b6cff" },
  { kind: "pickup", color: "#c0392b" },
  { kind: "sedan", color: "#dfe3e8" },
];

export function fleetSize(quality: GameQuality) {
  return quality === "hemat" ? 5 : quality === "tinggi" ? 10 : 8;
}

function createTraffic(count: number): TrafficCarState[] {
  const L = TRACK.length;
  return FLEET.slice(0, count).map((car, k) => {
    const lane = LANES[k % 2];
    const slow = lane < 0;
    const base = car.kind === "bus" || car.kind === "boxtruck" ? 10.5 : slow ? 11.5 + (k % 3) * 0.6 : 15 + (k % 3) * 0.5;
    const dist = 70 + ((L - 140) * k) / count;
    const pos = new THREE.Vector3();
    const heading = sampleTrack(dist / L, lane, pos);
    return { kind: car.kind, lane, base, dist, speed: base, pos, heading };
  });
}

export function Traffic({
  trafficRef,
  quality,
  player,
}: {
  trafficRef: RefObject<TrafficCarState[]>;
  quality: GameQuality;
  player: RefObject<{ pos: THREE.Vector3; index: number; lateral: number; speed: number }>;
}) {
  const count = fleetSize(quality);
  const fleet = useMemo(() => FLEET.slice(0, count), [count]);
  const groups = useRef<(THREE.Group | null)[]>([]);
  useFrame((_, raw) => {
    const delta = clampDelta(raw);
    if (trafficRef.current.length !== count) trafficRef.current = createTraffic(count);
    const cars = trafficRef.current;
    const L = TRACK.length;
    const truck = player.current;
    const playerDist = (truck.index / SAMPLES) * L;
    cars.forEach((car, i) => {
      const [halfLen, halfWidth] = TRAFFIC_SIZE[car.kind];
      let target = car.base;
      // Mengerem untuk kendaraan di depan pada lajur yang sama.
      cars.forEach((other) => {
        if (other === car || Math.abs(other.lane - car.lane) > 1) return;
        const gap = (((other.dist - car.dist) % L) + L) % L;
        const need = halfLen + TRAFFIC_SIZE[other.kind][0] + 2.5;
        if (gap < need + 18) target = Math.min(target, other.speed + (gap - need) * 0.7);
      });
      // ...dan untuk truk pemain.
      if (Math.abs(truck.lateral - car.lane) < halfWidth + 1.6) {
        const gap = (((playerDist - car.dist) % L) + L) % L;
        const need = halfLen + 4 + 2;
        if (gap < need + 18) target = Math.min(target, Math.max(0, truck.speed) + (gap - need) * 0.7);
      }
      target = Math.max(0, target);
      car.speed = THREE.MathUtils.damp(car.speed, target, target < car.speed ? 6 : 1.2, delta);
      car.dist = (car.dist + car.speed * delta) % L;
      car.heading = sampleTrack(car.dist / L, car.lane, car.pos);
      const g = groups.current[i];
      if (g) {
        g.position.copy(car.pos);
        g.rotation.y = car.heading;
      }
    });
  });
  return (
    <>
      {fleet.map((car, i) => (
        <group key={i} ref={(node) => { groups.current[i] = node; }} position={[0, -50, 0]}>
          <TrafficCar kind={car.kind} color={car.color} trafficRef={trafficRef} index={i} />
        </group>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Dunia lengkap                                                       */
/* ------------------------------------------------------------------ */

export function RaceScenery({ quality, focus }: { quality: GameQuality; focus: RefObject<{ pos: THREE.Vector3 }> }) {
  return (
    <>
      <color attach="background" args={[HORIZON]} />
      <fog attach="fog" args={[HORIZON, 90, 470]} />
      <SkyDome />
      <SunLight focus={focus} quality={quality} />
      <Terrain quality={quality} />
      <Lake />
      <Paddies />
      <Kites />
      <Road />
      <StartGantry />
      <StreetLamps />
      <Billboards />
      <Vegetation quality={quality} />
      <Village />
      <Factory />
      <Clouds count={quality === "hemat" ? 8 : 16} />
      <Birds />
    </>
  );
}
