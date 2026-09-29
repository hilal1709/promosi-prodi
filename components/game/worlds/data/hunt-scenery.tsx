"use client";

import { memo, useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { GameQuality } from "@/lib/types";
import { clampDelta } from "../world-kit";
import { fbm, seeded } from "../erp/race-track";
import { Birds, canvasTexture, Clouds, fitText, InstancedSet } from "../erp/race-scenery";
import {
  BIOMES,
  biomeAt,
  CAMP,
  groundAt,
  LAKE,
  pathDistance,
  PIER,
  RUINS,
  SIGNPOSTS,
  SOLAR,
  streamDistance,
  TENTS,
  terrainHeight,
  WATER_Y,
  WEATHER_STATION,
  type Vegetation,
} from "./hunt-layout";

export type Focus = RefObject<{ pos: THREE.Vector3 }>;

/* ------------------------------------------------------------------ */
/* Langit pagi & kabut: warna cakrawala = warna kabut (batas tak terlihat) */
/* ------------------------------------------------------------------ */

export const HUNT_HORIZON = "#e4e6da";
const SKY_TOP = "#4a9be0";
const SKY_WARM = "#f7d9ae";
const SUN_DIR = new THREE.Vector3(-0.45, 0.62, -0.64).normalize();
const smooth = THREE.MathUtils.smoothstep;
const pick = <T,>(list: T[], r: number) => list[Math.floor(r * list.length) % list.length];

const srgb = (hex: string) => {
  const c = new THREE.Color();
  c.setStyle(hex, THREE.SRGBColorSpace);
  const out = { r: 0, g: 0, b: 0 };
  c.getRGB(out, THREE.SRGBColorSpace);
  return new THREE.Vector3(out.r, out.g, out.b);
};

function HuntSky() {
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
          horizon: { value: srgb(HUNT_HORIZON) },
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
            vec3 col = mix(horizon, top, pow(h, 0.55));
            // Semburat hangat di sisi matahari, tapi tepat di cakrawala tetap = warna kabut.
            col = mix(col, warm, pow(s, 3.0) * 0.35 * smoothstep(0.0, 0.25, h) * (1.0 - h));
            col += vec3(1.0, 0.95, 0.8) * (pow(s, 900.0) * 1.3 + pow(s, 40.0) * 0.2);
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

function HuntSun({ focus, quality }: { focus: Focus; quality: GameQuality }) {
  const light = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const size = quality === "tinggi" ? 2048 : 1024;
  useFrame(() => {
    const p = focus.current.pos;
    // Dibulatkan ke grid kasar supaya bayangan tidak bergetar saat bergerak.
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
      <ambientLight intensity={0.32} color="#fff4e2" />
      <hemisphereLight intensity={1.05} color="#dff0ff" groundColor="#5f7a44" />
      <directionalLight
        ref={light}
        target={target}
        castShadow={quality !== "hemat"}
        intensity={2.4}
        color="#fff0d2"
        shadow-mapSize={[size, size]}
        shadow-camera-left={-55}
        shadow-camera-right={55}
        shadow-camera-top={55}
        shadow-camera-bottom={-55}
        shadow-camera-near={1}
        shadow-camera-far={280}
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
const GRASS_A = C("#5e9c44");
const GRASS_B = C("#8fbf5a");
const MEADOW = C("#b5c46a");
const FOREST_FLOOR = C("#3d6632");
const NEEDLES = C("#5a5236");
const RUIN_GROUND = C("#7f8a64");
const MOSS = C("#5d7d3e");
const SAND = C("#e0cf98");
const MUD = C("#6d6246");
const PATH = C("#b39a6c");
const PLAZA = C("#c2b394");
const HILL = C("#4e7c3a");
const ROCK = C("#8b8b7e");
const ROCK_DARK = C("#6b695f");
const SNOW = C("#f1f3f5");

/** Kisi tidak seragam: rapat di tengah (area main), renggang di kejauhan. */
const warp = (u: number, size: number) => size * (0.28 * u + 0.72 * u * u * u);

const Terrain = memo(function Terrain({ quality }: { quality: GameQuality }) {
  const geometry = useMemo(() => {
    const n = quality === "hemat" ? 180 : quality === "tinggi" ? 300 : 240;
    const size = 1400;
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
        const nz = fbm(x * 0.04, z * 0.04, 3);
        color.copy(GRASS_A).lerp(GRASS_B, THREE.MathUtils.clamp(nz * 1.7 - 0.4, 0, 1));
        if (r < 220) {
          const { biome, strength } = biomeAt(x, z);
          if (biome.id === "padang") color.lerp(MEADOW, strength * 0.55);
          if (biome.id === "hutan") color.lerp(nz > 0.5 ? NEEDLES : FOREST_FLOOR, strength * 0.8);
          if (biome.id === "reruntuhan") color.lerp(nz > 0.55 ? MOSS : RUIN_GROUND, strength * 0.75);
        }
        // Lereng bukit & gunung.
        if (h > 8) color.lerp(HILL, smooth(h, 8, 30) * 0.7);
        if (h > 70) color.lerp(ROCK, smooth(h, 70, 140));
        if (h > 120) color.lerp(ROCK_DARK, smooth(fbm(x * 0.03, z * 0.03, 2), 0.45, 0.7) * 0.6);
        if (h > 230) color.lerp(SNOW, smooth(h, 230, 290));
        // Pantai danau & sungai.
        const dl = Math.hypot(x - LAKE.x, z - LAKE.z);
        if (dl < LAKE.r + 14 && h < 2.2) color.lerp(SAND, 1 - smooth(h, 0.6, 2.2));
        if (streamDistance(x, z) < 8) color.lerp(SAND, (1 - smooth(streamDistance(x, z), 4, 8)) * 0.8);
        if (h < WATER_Y + 0.1) color.copy(MUD);
        // Jalan setapak & alun-alun kemah.
        const pd = pathDistance(x, z);
        if (pd < 2.6) color.lerp(PATH, (1 - smooth(pd, 1.2, 2.6)) * 0.9);
        const dc = Math.hypot(x - CAMP.x, z - CAMP.z);
        if (dc < 18) color.lerp(PLAZA, (1 - smooth(dc, 10, 18)) * 0.6);
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

/* ------------------------------ air ------------------------------ */

const WATER_SIZE = 3000;
const WATER_REPEAT = 100;
const WATER_TILE = WATER_SIZE / WATER_REPEAT;

function Water() {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const { camera } = useThree();
  const clock = useRef(0);
  const texture = useMemo(() => {
    const t = canvasTexture(256, 256, (g) => {
      g.fillStyle = "#4aa3c4";
      g.fillRect(0, 0, 256, 256);
      const rand = seeded(8);
      for (let k = 0; k < 110; k++) {
        g.strokeStyle = `rgba(255,255,255,${0.08 + rand() * 0.16})`;
        g.lineWidth = 1 + rand() * 2;
        const x = rand() * 256;
        const y = rand() * 256;
        g.beginPath();
        g.moveTo(x, y);
        g.quadraticCurveTo(x + 8, y - 3, x + 16 + rand() * 12, y);
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
      mesh.current.position.set(x, WATER_Y, z);
      texture.offset.set(clock.current * 0.015, clock.current * 0.025);
    }
    if (material.current) material.current.emissiveIntensity = 0.14 + Math.sin(clock.current * 1.2) * 0.04;
  });
  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[WATER_SIZE, WATER_SIZE]} />
      <meshStandardMaterial ref={material} map={texture} color="#bfe6f2" emissive="#4fb1d6" emissiveIntensity={0.14} roughness={0.12} metalness={0.2} transparent opacity={0.88} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Geometri vegetasi                                                   */
/* ------------------------------------------------------------------ */

function merge(parts: THREE.BufferGeometry[]) {
  const geo = mergeGeometries(parts.map((part) => (part.index ? part.toNonIndexed() : part)));
  geo.computeVertexNormals();
  return geo;
}

const at = (geo: THREE.BufferGeometry, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, s: number | [number, number, number] = 1) => {
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
    typeof s === "number" ? new THREE.Vector3(s, s, s) : new THREE.Vector3(...s)
  );
  return geo.applyMatrix4(m);
};

function useGeometries() {
  return useMemo(() => {
    const pineTrunk = at(new THREE.CylinderGeometry(0.18, 0.28, 2.4, 6), 0, 1.2, 0);
    const pineTop = merge([
      at(new THREE.ConeGeometry(1.7, 2.8, 7), 0, 2.6, 0),
      at(new THREE.ConeGeometry(1.35, 2.4, 7), 0, 3.9, 0),
      at(new THREE.ConeGeometry(0.95, 2, 7), 0, 5.1, 0),
    ]);
    const roundTrunk = at(new THREE.CylinderGeometry(0.2, 0.3, 2.6, 6), 0, 1.3, 0);
    const roundTop = merge([
      at(new THREE.IcosahedronGeometry(1.6, 1), 0, 3.4, 0),
      at(new THREE.IcosahedronGeometry(1.15, 1), 0.9, 2.9, 0.4),
      at(new THREE.IcosahedronGeometry(1.1, 1), -0.8, 3, -0.4),
    ]);
    const birchTrunk = at(new THREE.CylinderGeometry(0.12, 0.17, 4.2, 6), 0, 2.1, 0);
    const birchTop = merge([
      at(new THREE.IcosahedronGeometry(0.95, 1), 0, 4.3, 0),
      at(new THREE.IcosahedronGeometry(0.7, 1), 0.5, 3.6, 0.2),
      at(new THREE.IcosahedronGeometry(0.65, 1), -0.45, 3.8, -0.3),
    ]);
    const deadTree = merge([
      at(new THREE.CylinderGeometry(0.14, 0.26, 3.4, 5), 0, 1.7, 0),
      at(new THREE.CylinderGeometry(0.05, 0.1, 1.6, 4), 0.5, 2.8, 0, 0, 0, -0.8),
      at(new THREE.CylinderGeometry(0.05, 0.09, 1.3, 4), -0.4, 2.4, 0.1, 0.2, 0, 0.9),
      at(new THREE.CylinderGeometry(0.04, 0.07, 1, 4), 0.1, 3.3, -0.3, -0.7, 0, 0.1),
    ]);
    const bush = at(new THREE.IcosahedronGeometry(0.85, 1), 0, 0.45, 0, 0, 0, 0, [1.2, 0.8, 1.1]);
    const grass = merge(
      [0, 1, 2, 3, 4].map((k) => at(new THREE.ConeGeometry(0.06, 0.62 + (k % 3) * 0.12, 3), Math.cos(k * 1.3) * 0.12, 0.32, Math.sin(k * 1.3) * 0.12, Math.cos(k) * 0.25, 0, Math.sin(k * 2) * 0.25))
    );
    const stem = merge([at(new THREE.CylinderGeometry(0.018, 0.025, 0.55, 3), 0, 0.27, 0), at(new THREE.ConeGeometry(0.07, 0.25, 3), 0.06, 0.12, 0, 0, 0, -0.5)]);
    const bloom = merge([
      at(new THREE.IcosahedronGeometry(0.06, 0), 0, 0.58, 0),
      ...[0, 1, 2, 3, 4].map((k) => at(new THREE.SphereGeometry(0.07, 4, 3), Math.cos((k / 5) * Math.PI * 2) * 0.09, 0.56, Math.sin((k / 5) * Math.PI * 2) * 0.09, 0, 0, 0, [1, 0.35, 1])),
    ]);
    const dataFlower = merge([
      at(new THREE.CylinderGeometry(0.025, 0.035, 0.8, 4), 0, 0.4, 0),
      at(new THREE.OctahedronGeometry(0.18, 0), 0, 0.88, 0, 0, 0, 0, [1, 1.4, 1]),
      at(new THREE.TorusGeometry(0.22, 0.02, 3, 12), 0, 0.88, 0, Math.PI / 2, 0, 0),
    ]);
    const reed = merge([
      at(new THREE.ConeGeometry(0.04, 1.6, 3), 0, 0.8, 0),
      at(new THREE.ConeGeometry(0.035, 1.3, 3), 0.12, 0.65, 0.05, 0, 0, -0.12),
      at(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 5), 0.02, 1.45, 0),
    ]);
    const mushroomStem = at(new THREE.CylinderGeometry(0.06, 0.08, 0.3, 6), 0, 0.15, 0);
    const mushroomCap = at(new THREE.SphereGeometry(0.2, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), 0, 0.28, 0);
    const log = new THREE.CylinderGeometry(0.28, 0.3, 1, 7);
    const rock = new THREE.DodecahedronGeometry(0.6, 0);
    const boulder = new THREE.IcosahedronGeometry(1, 0);
    return { pineTrunk, pineTop, roundTrunk, roundTop, birchTrunk, birchTop, deadTree, bush, grass, stem, bloom, dataFlower, reed, mushroomStem, mushroomCap, log, rock, boulder };
  }, []);
}

/* ------------------------------ angin ------------------------------ */

const WIND = { value: 0 };

function windMaterial(color: string, emissive?: string) {
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true, side: THREE.DoubleSide, emissive: emissive ?? "#000000", emissiveIntensity: emissive ? 0.6 : 0 });
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
      float gust = sin(uWind * 1.7 + root.x * 0.21 + root.z * 0.13) * 0.6 + sin(uWind * 3.1 + root.x * 0.7) * 0.25;
      transformed.x += gust * bend * 0.22;
      transformed.z += cos(uWind * 1.3 + root.z * 0.19) * bend * 0.12;`
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

type Inst = Vegetation["grass"][number];

function WindSet({ items, geometry, color, emissive }: { items: Inst[]; geometry: THREE.BufferGeometry; color: string; emissive?: string }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const material = useMemo(() => windMaterial(color, emissive), [color, emissive]);
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

const Flora = memo(function Flora({ veg, quality }: { veg: Vegetation; quality: GameQuality }) {
  const g = useGeometries();
  const shadow = quality !== "hemat";
  const trunks = useMemo(
    () => ({ pines: strip(veg.pines), round: strip(veg.roundTrees), birch: strip(veg.birches), far: strip(veg.farPines), stems: strip(veg.mushrooms), flowerStems: strip(veg.flowers) }),
    [veg]
  );
  return (
    <group>
      <InstancedSet items={trunks.pines} geometry={g.pineTrunk} color="#6b4a2f" shadow={shadow} />
      <InstancedSet items={veg.pines} geometry={g.pineTop} shadow={shadow} />
      <InstancedSet items={trunks.round} geometry={g.roundTrunk} color="#7a5535" shadow={shadow} />
      <InstancedSet items={veg.roundTrees} geometry={g.roundTop} shadow={shadow} />
      <InstancedSet items={trunks.birch} geometry={g.birchTrunk} color="#ece8df" shadow={shadow} />
      <InstancedSet items={veg.birches} geometry={g.birchTop} color="#9cc95c" shadow={shadow} />
      <InstancedSet items={veg.deadTrees} geometry={g.deadTree} color="#7d6f60" shadow={shadow} />
      <InstancedSet items={veg.bushes} geometry={g.bush} shadow={shadow} />
      <InstancedSet items={trunks.stems} geometry={g.mushroomStem} color="#f3ead8" shadow={false} />
      <InstancedSet items={veg.mushrooms} geometry={g.mushroomCap} shadow={false} />
      <InstancedSet items={veg.logs} geometry={g.log} color="#6d4c33" shadow={shadow} />
      <InstancedSet items={veg.rocks} geometry={g.rock} shadow={shadow} />
      <InstancedSet items={veg.boulders} geometry={g.boulder} shadow={shadow} />
      <InstancedSet items={veg.dataFlowers} geometry={g.dataFlower} color="#7ee8fa" emissive="#35c7ef" emissiveIntensity={0.9} shadow={false} />
      <InstancedSet items={trunks.far} geometry={g.pineTrunk} color="#5a3f28" shadow={false} />
      <InstancedSet items={veg.farPines} geometry={g.pineTop} shadow={false} />
      <WindSet items={veg.grass} geometry={g.grass} color="#ffffff" />
      <WindSet items={trunks.flowerStems} geometry={g.stem} color="#5c9a3e" />
      <WindSet items={veg.flowers} geometry={g.bloom} color="#ffffff" />
      <WindSet items={veg.reeds} geometry={g.reed} color="#8a9a4a" />
    </group>
  );
});

/* ------------------------------------------------------------------ */
/* Kemah, reruntuhan, papan penunjuk, dermaga                          */
/* ------------------------------------------------------------------ */

function Campfire() {
  const flame = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const clock = useRef(0);
  const x = CAMP.x + 4;
  const z = CAMP.z + 5;
  const y = groundAt(x, z);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    const t = clock.current;
    const f = 1 + Math.sin(t * 13) * 0.08 + Math.sin(t * 7.3) * 0.08;
    flame.current?.scale.set(f, 1 + Math.sin(t * 9) * 0.18, f);
    if (light.current) light.current.intensity = 6 + Math.sin(t * 11) * 1.5;
  });
  return (
    <group position={[x, y, z]}>
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <mesh key={k} position={[Math.cos((k / 6) * Math.PI * 2) * 0.9, 0.12, Math.sin((k / 6) * Math.PI * 2) * 0.9]} castShadow>
          <dodecahedronGeometry args={[0.25, 0]} />
          <meshStandardMaterial color="#8d8a80" flatShading />
        </mesh>
      ))}
      {[0, 1, 2].map((k) => (
        <mesh key={k} position={[0, 0.2, 0]} rotation={[0, (k / 3) * Math.PI, Math.PI / 2 - 0.25]}>
          <cylinderGeometry args={[0.08, 0.1, 1.2, 5]} />
          <meshStandardMaterial color="#5b3a22" />
        </mesh>
      ))}
      <mesh ref={flame} position={[0, 0.55, 0]}>
        <coneGeometry args={[0.35, 0.9, 6]} />
        <meshBasicMaterial color="#ffb347" transparent opacity={0.9} />
      </mesh>
      <pointLight ref={light} position={[0, 1.2, 0]} color="#ff9a3c" intensity={6} distance={14} decay={2} />
      {/* Bangku kayu */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 2.4, 0.3, 0]} rotation={[0, Math.PI / 2, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.28, 0.28, 2, 7]} />
          <meshStandardMaterial color="#7a5535" flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Tent({ x, z, rot, color }: { x: number; z: number; rot: number; color: string }) {
  const y = groundAt(x, z);
  return (
    <group position={[x, y, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, 1.2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
        <coneGeometry args={[2.4, 2.4, 4]} />
        <meshStandardMaterial color={color} flatShading roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.65, 1.2]} rotation={[0, 0, 0]}>
        <planeGeometry args={[0.9, 1.3]} />
        <meshStandardMaterial color="#2b2118" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.5, 4]} />
        <meshStandardMaterial color="#d9d9d9" />
      </mesh>
    </group>
  );
}

function CampProps() {
  const crates = useMemo(() => {
    const rand = seeded(55);
    return Array.from({ length: 7 }, () => {
      const a = rand() * Math.PI * 2;
      const d = 16 + rand() * 4;
      const x = CAMP.x + Math.cos(a) * d;
      const z = CAMP.z + Math.sin(a) * d;
      return { x, z, y: groundAt(x, z), rot: rand() * Math.PI, s: 0.7 + rand() * 0.4 };
    });
  }, []);
  return (
    <group>
      {TENTS.map((t) => <Tent key={`${t.x}`} {...t} />)}
      <Campfire />
      {SOLAR.map((s, k) => {
        const y = groundAt(s.x, s.z);
        return (
          <group key={k} position={[s.x, y, s.z]} rotation={[0, Math.PI / 2, 0]}>
            <mesh position={[0, 0.6, 0]} castShadow>
              <cylinderGeometry args={[0.06, 0.06, 1.2, 5]} />
              <meshStandardMaterial color="#9aa3ad" />
            </mesh>
            <mesh position={[0, 1.25, 0]} rotation={[-0.6, 0, 0]} castShadow>
              <boxGeometry args={[2.2, 0.06, 1.3]} />
              <meshStandardMaterial color="#1d3f73" metalness={0.5} roughness={0.25} emissive="#0e2a5c" emissiveIntensity={0.3} />
            </mesh>
          </group>
        );
      })}
      {crates.map((c, k) => (
        <mesh key={k} position={[c.x, c.y + 0.4 * c.s, c.z]} rotation={[0, c.rot, 0]} scale={c.s} castShadow receiveShadow>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial color={k % 3 === 0 ? "#3a6ea5" : "#a47148"} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function WeatherStation() {
  const cups = useRef<THREE.Group>(null);
  const vane = useRef<THREE.Group>(null);
  useFrame((_, raw) => {
    const delta = clampDelta(raw);
    if (cups.current) cups.current.rotation.y += delta * 5;
    if (vane.current) vane.current.rotation.y = Math.sin(WIND.value * 0.3) * 0.6;
  });
  const { x, z } = WEATHER_STATION;
  const y = groundAt(x, z);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 5, 6]} />
        <meshStandardMaterial color="#c9ced6" metalness={0.4} />
      </mesh>
      <mesh position={[0, 1.2, 0.2]} castShadow>
        <boxGeometry args={[0.7, 0.9, 0.4]} />
        <meshStandardMaterial color="#f4f4f2" />
      </mesh>
      <mesh position={[0, 1.4, 0.41]}>
        <planeGeometry args={[0.4, 0.2]} />
        <meshBasicMaterial color="#4cc9f0" />
      </mesh>
      <group ref={cups} position={[0, 5.1, 0]}>
        {[0, 1, 2].map((k) => (
          <group key={k} rotation={[0, (k / 3) * Math.PI * 2, 0]}>
            <mesh position={[0.45, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.02, 0.02, 0.9, 4]} />
              <meshStandardMaterial color="#9aa3ad" />
            </mesh>
            <mesh position={[0.9, 0, 0]}>
              <sphereGeometry args={[0.13, 8, 6, 0, Math.PI]} />
              <meshStandardMaterial color="#ef476f" side={THREE.DoubleSide} />
            </mesh>
          </group>
        ))}
      </group>
      <group ref={vane} position={[0, 4.4, 0]}>
        <mesh position={[0.4, 0, 0]}>
          <boxGeometry args={[0.9, 0.05, 0.05]} />
          <meshStandardMaterial color="#343a40" />
        </mesh>
        <mesh position={[0.85, 0, 0]}>
          <boxGeometry args={[0.05, 0.3, 0.3]} />
          <meshStandardMaterial color="#ffc857" />
        </mesh>
      </group>
    </group>
  );
}

function Signposts() {
  const boards = useMemo(
    () =>
      SIGNPOSTS.map((sign) =>
        canvasTexture(512, 160, (g) => {
          g.fillStyle = "#1b2433";
          g.fillRect(0, 0, 512, 160);
          g.fillStyle = sign.biome.color;
          g.fillRect(0, 0, 18, 160);
          g.fillStyle = "#7ee8fa";
          g.font = "800 26px system-ui, sans-serif";
          g.fillText("ZONA DATA", 44, 50);
          g.fillStyle = "#ffffff";
          fitText(g, sign.biome.nama, 440, 58);
          g.fillText(sign.biome.nama, 44, 118);
        })
      ),
    []
  );
  return (
    <group>
      {SIGNPOSTS.map((sign, k) => {
        const y = groundAt(sign.x, sign.z);
        return (
          <group key={k} position={[sign.x, y, sign.z]} rotation={[0, sign.rot, 0]}>
            <mesh position={[0, 1.2, 0]} castShadow>
              <cylinderGeometry args={[0.08, 0.1, 2.4, 6]} />
              <meshStandardMaterial color="#6b4a2f" />
            </mesh>
            <mesh position={[0, 2.3, 0.06]} castShadow>
              <boxGeometry args={[2.3, 0.72, 0.08]} />
              <meshStandardMaterial color="#1b2433" />
            </mesh>
            <mesh position={[0, 2.3, 0.11]}>
              <planeGeometry args={[2.2, 0.68]} />
              <meshStandardMaterial map={boards[k]} emissive="#ffffff" emissiveMap={boards[k]} emissiveIntensity={0.35} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Pier() {
  const planks = useMemo(() => Array.from({ length: 16 }, (_, k) => k), []);
  return (
    <group position={[PIER.x, WATER_Y, PIER.z]} rotation={[0, PIER.rot, 0]}>
      {planks.map((k) => (
        <mesh key={k} position={[(k % 2) * 0.02, 0.55, k * (PIER.len / 16)]} castShadow receiveShadow>
          <boxGeometry args={[2.4, 0.12, 0.9]} />
          <meshStandardMaterial color={k % 3 ? "#9c7650" : "#8a6644"} flatShading />
        </mesh>
      ))}
      {[0, 4, 8, 12, 15].map((k) =>
        [-1.1, 1.1].map((x) => (
          <mesh key={`${k}${x}`} position={[x, -0.3, k * (PIER.len / 16)]}>
            <cylinderGeometry args={[0.12, 0.12, 2, 6]} />
            <meshStandardMaterial color="#5b4030" />
          </mesh>
        ))
      )}
      {/* Perahu kecil */}
      <group position={[2.4, 0.15, PIER.len - 2]} rotation={[0, 0.3, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.1, 0.4, 3]} />
          <meshStandardMaterial color="#e76f51" flatShading />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <boxGeometry args={[0.9, 0.06, 2.6]} />
          <meshStandardMaterial color="#8a6644" />
        </mesh>
      </group>
    </group>
  );
}

/** Rak server tua berlumut, sisa pusat data lama, LED masih berkedip. */
const ServerRuins = memo(function ServerRuins() {
  const leds = useRef<THREE.InstancedMesh>(null);
  const ledSpots = useMemo(() => {
    const out: { p: THREE.Vector3; phase: number; color: THREE.Color }[] = [];
    const rand = seeded(9);
    RUINS.forEach((ruin) => {
      if (ruin.broken) return;
      const y = groundAt(ruin.x, ruin.z);
      for (let k = 0; k < 6; k++) {
        const local = new THREE.Vector3(-0.4 + (k % 2) * 0.25, 0.5 + Math.floor(k / 2) * (ruin.h / 4), 0.62);
        local.applyAxisAngle(new THREE.Vector3(0, 1, 0), ruin.rot);
        out.push({ p: local.add(new THREE.Vector3(ruin.x, y, ruin.z)), phase: rand() * 10, color: new THREE.Color(rand() > 0.3 ? "#4cff9a" : "#ff5d73") });
      }
    });
    return out;
  }, []);
  const clock = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useLayoutEffect(() => {
    ledSpots.forEach((spot, i) => leds.current?.setColorAt(i, spot.color));
    if (leds.current?.instanceColor) leds.current.instanceColor.needsUpdate = true;
  }, [ledSpots]);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    const m = leds.current;
    if (!m) return;
    ledSpots.forEach((spot, i) => {
      const on = Math.sin(clock.current * 3 + spot.phase * 5) > -0.2;
      dummy.position.copy(spot.p);
      dummy.scale.setScalar(on ? 1 : 0.001);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      {RUINS.map((ruin, k) => {
        const y = groundAt(ruin.x, ruin.z);
        return (
          <group key={k} position={[ruin.x, y, ruin.z]} rotation={ruin.broken ? [0.12, ruin.rot, k % 2 ? 1.25 : -0.3] : [0, ruin.rot, 0]}>
            <mesh position={[0, ruin.h / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.3, ruin.h, 1.2]} />
              <meshStandardMaterial color="#3d434d" roughness={0.7} metalness={0.3} />
            </mesh>
            <mesh position={[0, ruin.h / 2, 0.61]}>
              <planeGeometry args={[1.1, ruin.h * 0.92]} />
              <meshStandardMaterial color="#20252c" />
            </mesh>
            {/* Lumut di atas & di sisi */}
            <mesh position={[0, ruin.h + 0.08, 0]} castShadow>
              <boxGeometry args={[1.42, 0.2, 1.32]} />
              <meshStandardMaterial color="#5f8f3e" flatShading roughness={1} />
            </mesh>
            <mesh position={[0.66, ruin.h * 0.35, 0]} scale={[0.15, ruin.h * 0.5, 1]}>
              <icosahedronGeometry args={[0.9, 0]} />
              <meshStandardMaterial color="#6e9c48" flatShading />
            </mesh>
            {ruin.broken && (
              <mesh position={[0.2, 0.2, 1.4]} rotation={[0.3, 0.6, 0.2]} castShadow>
                <boxGeometry args={[0.9, 0.12, 0.6]} />
                <meshStandardMaterial color="#555c66" metalness={0.3} />
              </mesh>
            )}
          </group>
        );
      })}
      <instancedMesh ref={leds} args={[undefined, undefined, Math.max(1, ledSpots.length)]}>
        <boxGeometry args={[0.1, 0.06, 0.02]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  );
});

/* ------------------------------------------------------------------ */
/* Kehidupan: kupu-kupu, partikel data, ikan, rusa, kelinci            */
/* ------------------------------------------------------------------ */

function Butterflies({ count }: { count: number }) {
  const left = useRef<THREE.InstancedMesh>(null);
  const right = useRef<THREE.InstancedMesh>(null);
  const flies = useMemo(() => {
    const rand = seeded(61);
    const meadow = BIOMES[0];
    const lake = BIOMES[2];
    return Array.from({ length: count }, (_, k) => {
      const home = k % 3 === 2 ? lake : meadow;
      return { cx: home.x + (rand() - 0.5) * 70, cz: home.z + (rand() - 0.5) * 70, r: 2 + rand() * 5, speed: 0.4 + rand() * 0.6, phase: rand() * 10, color: pick(["#ffd166", "#ff8fab", "#ffffff", "#9bf6ff", "#ffadad"], rand()) };
    });
  }, [count]);
  const clock = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.34, 0.26);
    g.translate(0.17, 0, 0);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  useLayoutEffect(() => {
    const c = new THREE.Color();
    flies.forEach((fly, i) => {
      left.current?.setColorAt(i, c.set(fly.color));
      right.current?.setColorAt(i, c.set(fly.color));
    });
    [left.current, right.current].forEach((m) => {
      if (m?.instanceColor) m.instanceColor.needsUpdate = true;
    });
  }, [flies]);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    const t = clock.current;
    flies.forEach((fly, i) => {
      const a = t * fly.speed + fly.phase;
      const x = fly.cx + Math.cos(a) * fly.r + Math.sin(a * 2.3) * 1.2;
      const z = fly.cz + Math.sin(a * 0.8) * fly.r;
      const y = groundAt(x, z) + 1 + Math.sin(a * 3.1) * 0.5;
      const heading = Math.atan2(-Math.sin(a) * fly.r, Math.cos(a * 0.8) * fly.r * 0.8);
      const flap = Math.sin(t * 22 + fly.phase) * 1.1;
      [left.current, right.current].forEach((m, side) => {
        if (!m) return;
        dummy.position.set(x, y, z);
        dummy.rotation.set(0, heading + (side ? Math.PI : 0), side ? -flap : flap);
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);
      });
    });
    if (left.current) left.current.instanceMatrix.needsUpdate = true;
    if (right.current) right.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <>
      <instancedMesh ref={left} args={[geometry, undefined, count]} frustumCulled={false}>
        <meshBasicMaterial side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={right} args={[geometry, undefined, count]} frustumCulled={false}>
        <meshBasicMaterial side={THREE.DoubleSide} />
      </instancedMesh>
    </>
  );
}

/** Partikel data yang melayang di sekitar pemain, debu cahaya kecil. */
function DataMotes({ focus, count }: { focus: Focus; count: number }) {
  const points = useRef<THREE.Points>(null);
  const RANGE = 36;
  const { geometry, seeds } = useMemo(() => {
    const rand = seeded(3);
    const pos = new Float32Array(count * 3);
    const seeds = Array.from({ length: count }, () => ({ x: (rand() - 0.5) * RANGE * 2, z: (rand() - 0.5) * RANGE * 2, y: 0.4 + rand() * 4, p: rand() * 10 }));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { geometry: geo, seeds };
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
      // Posisi dibungkus di sekitar pemain supaya partikel selalu ada di dekatnya.
      const wx = f.x + ((((s.x + Math.sin(t * 0.3 + s.p) * 2 - f.x) % (RANGE * 2)) + RANGE * 3) % (RANGE * 2)) - RANGE;
      const wz = f.z + ((((s.z + Math.cos(t * 0.25 + s.p) * 2 - f.z) % (RANGE * 2)) + RANGE * 3) % (RANGE * 2)) - RANGE;
      attr.setXYZ(i, wx, groundAt(wx, wz) + s.y + Math.sin(t * 0.8 + s.p) * 0.4, wz);
    });
    attr.needsUpdate = true;
  });
  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <pointsMaterial map={dot} color="#d8fbff" size={0.22} sizeAttenuation transparent opacity={0.75} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function Fish() {
  const fish = useMemo(() => {
    const rand = seeded(17);
    return Array.from({ length: 5 }, () => ({ a: rand() * Math.PI * 2, d: 6 + rand() * (LAKE.r - 16), wait: 1 + rand() * 6, t: -1, heading: rand() * Math.PI * 2 }));
  }, []);
  const bodies = useRef<(THREE.Group | null)[]>([]);
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const ringAge = useRef(fish.map(() => 9));
  useFrame((_, raw) => {
    const delta = clampDelta(raw);
    fish.forEach((f, k) => {
      const body = bodies.current[k];
      const ring = rings.current[k];
      const x = LAKE.x + Math.cos(f.a) * f.d;
      const z = LAKE.z + Math.sin(f.a) * f.d;
      if (f.t < 0) {
        f.wait -= delta;
        if (f.wait <= 0) {
          f.t = 0;
          f.heading = Math.random() * Math.PI * 2;
        }
      } else {
        f.t += delta / 0.9;
        if (f.t >= 1) {
          f.t = -1;
          f.wait = 2 + Math.random() * 6;
          f.a += 0.8 + Math.random();
          ringAge.current[k] = 0;
        }
      }
      if (body) {
        const jumping = f.t >= 0;
        body.visible = jumping;
        if (jumping) {
          const s = f.t;
          body.position.set(x + Math.sin(f.heading) * (s - 0.5) * 2.4, WATER_Y + Math.sin(s * Math.PI) * 1.6 - 0.2, z + Math.cos(f.heading) * (s - 0.5) * 2.4);
          body.rotation.set(-(s - 0.5) * 2.4, f.heading, 0);
        }
      }
      if (ring) {
        ringAge.current[k] += delta;
        const age = ringAge.current[k];
        ring.visible = age < 1.4;
        ring.position.set(x + Math.sin(f.heading) * 1.2, WATER_Y + 0.05, z + Math.cos(f.heading) * 1.2);
        ring.scale.setScalar(0.3 + age * 1.6);
        (ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.7 - age * 0.5);
      }
    });
  });
  return (
    <group>
      {fish.map((_, k) => (
        <group key={k} ref={(node) => { bodies.current[k] = node; }} visible={false}>
          <mesh scale={[0.28, 0.35, 0.8]}>
            <sphereGeometry args={[0.6, 8, 6]} />
            <meshStandardMaterial color="#f4a261" metalness={0.4} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, -0.55]} rotation={[Math.PI / 2, 0, 0]} scale={[0.1, 1, 1]}>
            <coneGeometry args={[0.25, 0.35, 4]} />
            <meshStandardMaterial color="#e76f51" />
          </mesh>
        </group>
      ))}
      {fish.map((_, k) => (
        <mesh key={k} ref={(node) => { rings.current[k] = node; }} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
          <ringGeometry args={[0.8, 1, 24]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

type Critter = { kind: "rusa" | "kelinci"; x: number; z: number; hx: number; hz: number; tx: number; tz: number; heading: number; speed: number; wait: number; flee: number; phase: number; hop: number };

/** Rusa & kelinci yang merumput, berkeliaran, dan kabur bila pemain mendekat. */
function Critters({ focus, count }: { focus: Focus; count: number }) {
  const critters = useMemo<Critter[]>(() => {
    const rand = seeded(88);
    const homes = [BIOMES[0], BIOMES[1], BIOMES[2], { x: -30, z: -40 }, { x: 40, z: 10 }];
    return Array.from({ length: count }, (_, k) => {
      const home = homes[k % homes.length];
      const x = home.x + (rand() - 0.5) * 50;
      const z = home.z + (rand() - 0.5) * 50;
      return { kind: k % 5 < 2 ? "rusa" : "kelinci", x, z, hx: x, hz: z, tx: x, tz: z, heading: rand() * 6, speed: 0, wait: rand() * 4, flee: 0, phase: rand() * 10, hop: 0 };
    });
  }, [count]);
  const refs = useRef<(THREE.Group | null)[]>([]);
  const legs = useRef<(THREE.Group | null)[][]>([]);
  const clock = useRef(0);
  useFrame((_, raw) => {
    const delta = clampDelta(raw);
    clock.current += delta;
    const p = focus.current.pos;
    critters.forEach((c, k) => {
      const dist = Math.hypot(c.x - p.x, c.z - p.z);
      const scare = c.kind === "rusa" ? 13 : 7;
      if (dist < scare) {
        c.flee = 2.5;
        const ax = (c.x - p.x) / (dist || 1);
        const az = (c.z - p.z) / (dist || 1);
        c.tx = c.x + ax * 20;
        c.tz = c.z + az * 20;
      }
      c.flee = Math.max(0, c.flee - delta);
      const dx = c.tx - c.x;
      const dz = c.tz - c.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.6) {
        c.wait -= delta;
        if (c.wait <= 0) {
          c.tx = c.hx + (Math.random() - 0.5) * 40;
          c.tz = c.hz + (Math.random() - 0.5) * 40;
          if (terrainHeight(c.tx, c.tz) < 0.4 || Math.hypot(c.tx, c.tz) > 185) {
            c.tx = c.hx;
            c.tz = c.hz;
          }
          c.wait = 2 + Math.random() * 5;
        }
      }
      const want = d < 0.6 ? 0 : c.flee > 0 ? (c.kind === "rusa" ? 9 : 7) : c.kind === "rusa" ? 1.6 : 1.2;
      c.speed = THREE.MathUtils.damp(c.speed, want, 5, delta);
      if (d > 0.01 && c.speed > 0.05) {
        const nx = c.x + (dx / d) * c.speed * delta;
        const nz = c.z + (dz / d) * c.speed * delta;
        if (terrainHeight(nx, nz) > 0.3 && Math.hypot(nx, nz) < 190) {
          c.x = nx;
          c.z = nz;
        } else {
          c.tx = c.x;
          c.tz = c.z;
        }
        const target = Math.atan2(dx, dz);
        c.heading += Math.atan2(Math.sin(target - c.heading), Math.cos(target - c.heading)) * Math.min(1, delta * 6);
      }
      c.phase += delta * (2 + c.speed * 2.2);
      const g = refs.current[k];
      if (!g) return;
      let y = groundAt(c.x, c.z);
      if (c.kind === "kelinci" && c.speed > 0.2) y += Math.abs(Math.sin(c.phase)) * 0.35;
      g.position.set(c.x, y, c.z);
      g.rotation.y = c.heading;
      // Kepala menunduk makan rumput saat diam.
      const head = g.children[1];
      if (head && c.kind === "rusa") head.rotation.x = c.speed < 0.2 ? 0.9 + Math.sin(clock.current * 2 + k) * 0.1 : 0;
      legs.current[k]?.forEach((leg, i) => {
        if (leg) leg.rotation.x = Math.sin(c.phase + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * Math.min(0.7, c.speed * 0.15);
      });
    });
  });
  return (
    <group>
      {critters.map((c, k) =>
        c.kind === "rusa" ? (
          <group key={k} ref={(node) => { refs.current[k] = node; }}>
            <mesh position={[0, 1.15, 0]} castShadow>
              <boxGeometry args={[0.55, 0.6, 1.4]} />
              <meshStandardMaterial color="#a0683f" flatShading />
            </mesh>
            <group position={[0, 1.4, 0.6]}>
              <mesh position={[0, 0.35, 0.1]} rotation={[-0.4, 0, 0]} castShadow>
                <boxGeometry args={[0.25, 0.7, 0.28]} />
                <meshStandardMaterial color="#a0683f" flatShading />
              </mesh>
              <mesh position={[0, 0.72, 0.32]} castShadow>
                <boxGeometry args={[0.3, 0.3, 0.5]} />
                <meshStandardMaterial color="#9a623b" flatShading />
              </mesh>
              {[-1, 1].map((side) => (
                <mesh key={side} position={[side * 0.16, 1.05, 0.2]} rotation={[0, 0, side * -0.4]}>
                  <cylinderGeometry args={[0.025, 0.03, 0.5, 4]} />
                  <meshStandardMaterial color="#e8dcc6" />
                </mesh>
              ))}
            </group>
            <mesh position={[0, 1.3, -0.72]}>
              <boxGeometry args={[0.16, 0.2, 0.1]} />
              <meshStandardMaterial color="#f4efe6" />
            </mesh>
            {[
              [-0.2, 0.5],
              [0.2, 0.5],
              [-0.2, -0.5],
              [0.2, -0.5],
            ].map(([x, z], i) => (
              <group
                key={i}
                position={[x, 0.9, z]}
                ref={(node) => {
                  legs.current[k] = legs.current[k] ?? [];
                  legs.current[k][i] = node;
                }}
              >
                <mesh position={[0, -0.45, 0]}>
                  <boxGeometry args={[0.1, 0.9, 0.1]} />
                  <meshStandardMaterial color="#7d5031" />
                </mesh>
              </group>
            ))}
          </group>
        ) : (
          <group key={k} ref={(node) => { refs.current[k] = node; }} scale={0.8}>
            <mesh position={[0, 0.3, 0]} castShadow>
              <sphereGeometry args={[0.3, 8, 6]} />
              <meshStandardMaterial color={k % 2 ? "#d8cfc4" : "#8d7b68"} flatShading />
            </mesh>
            <mesh position={[0, 0.5, 0.25]} castShadow>
              <sphereGeometry args={[0.18, 8, 6]} />
              <meshStandardMaterial color={k % 2 ? "#d8cfc4" : "#8d7b68"} flatShading />
            </mesh>
            {[-1, 1].map((side) => (
              <mesh key={side} position={[side * 0.07, 0.78, 0.22]} rotation={[-0.2, 0, side * 0.15]}>
                <boxGeometry args={[0.06, 0.32, 0.04]} />
                <meshStandardMaterial color="#e9ded2" />
              </mesh>
            ))}
            <mesh position={[0, 0.35, -0.3]}>
              <sphereGeometry args={[0.09, 6, 5]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          </group>
        )
      )}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Komposisi                                                           */
/* ------------------------------------------------------------------ */

export function HuntNature({ quality, focus, veg }: { quality: GameQuality; focus: Focus; veg: Vegetation }) {
  const lush = quality !== "hemat";
  return (
    <>
      <color attach="background" args={[HUNT_HORIZON]} />
      <fog attach="fog" args={[HUNT_HORIZON, 110, 620]} />
      <HuntSky />
      <HuntSun focus={focus} quality={quality} />
      <WindClock />
      <Terrain quality={quality} />
      <Water />
      <Flora veg={veg} quality={quality} />
      <CampProps />
      <WeatherStation />
      <Signposts />
      <Pier />
      <ServerRuins />
      <Clouds count={lush ? 22 : 12} center={{ x: 0, z: 0 }} />
      <Birds center={{ x: 0, z: 0 }} spread={1.3} />
      <Butterflies count={lush ? 36 : 18} />
      <DataMotes focus={focus} count={lush ? 260 : 120} />
      <Fish />
      <Critters focus={focus} count={lush ? 20 : 12} />
    </>
  );
}

