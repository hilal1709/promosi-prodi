"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

type Vec3 = [number, number, number];

// PRNG deterministik supaya susunan dekorasi sama di setiap render/reload.
function seeded(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type InstanceSpec = { position: Vec3; rotation?: Vec3; scale?: Vec3; color?: string };

export function Instanced({
  geometry,
  material,
  items,
  castShadow = false,
  receiveShadow = false,
}: {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  items: InstanceSpec[];
  castShadow?: boolean;
  receiveShadow?: boolean;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    items.forEach((item, i) => {
      dummy.position.set(...item.position);
      dummy.rotation.set(...(item.rotation ?? [0, 0, 0]));
      dummy.scale.set(...(item.scale ?? [1, 1, 1]));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      if (item.color) mesh.setColorAt(i, color.set(item.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items]);

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, items.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Pohon di dalam kampus: beberapa jenis dengan bentuk berbeda         */
/* ------------------------------------------------------------------ */

export type TreeKind = "round" | "blossom" | "autumn" | "pine" | "cypress" | "palm";

const CANOPY_COLORS: Record<"round" | "blossom" | "autumn", [string, string]> = {
  round: ["#4f9d45", "#6bb356"],
  blossom: ["#f3a5c0", "#f8c7d8"],
  autumn: ["#e39b3a", "#d8742f"],
};

function Trunk({ height, radius = 0.14, color = "#7a5230" }: { height: number; radius?: number; color?: string }) {
  return (
    <mesh castShadow position={[0, height / 2, 0]}>
      <cylinderGeometry args={[radius * 0.75, radius, height, 10]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}

function RoundTree({ kind }: { kind: "round" | "blossom" | "autumn" }) {
  const [main, light] = CANOPY_COLORS[kind];
  return (
    <>
      <Trunk height={1.5} />
      <mesh castShadow position={[0, 1.85, 0]}>
        <sphereGeometry args={[0.8, 20, 16]} />
        <meshStandardMaterial color={main} roughness={0.85} />
      </mesh>
      <mesh castShadow position={[0.45, 1.6, 0.2]}>
        <sphereGeometry args={[0.55, 18, 14]} />
        <meshStandardMaterial color={light} roughness={0.85} />
      </mesh>
      <mesh castShadow position={[-0.4, 1.7, -0.25]}>
        <sphereGeometry args={[0.58, 18, 14]} />
        <meshStandardMaterial color={main} roughness={0.85} />
      </mesh>
      <mesh castShadow position={[0.05, 2.45, 0.05]}>
        <sphereGeometry args={[0.5, 18, 14]} />
        <meshStandardMaterial color={light} roughness={0.85} />
      </mesh>
    </>
  );
}

function PineTree() {
  return (
    <>
      <Trunk height={0.9} radius={0.13} color="#5e3d24" />
      {[
        [1.05, 1.4, 1.2],
        [0.82, 1.2, 1.85],
        [0.56, 1.0, 2.45],
      ].map(([radius, height, y], i) => (
        <mesh key={i} castShadow position={[0, y, 0]}>
          <coneGeometry args={[radius, height, 12]} />
          <meshStandardMaterial color={i === 1 ? "#2f6b3f" : "#285c36"} roughness={0.85} />
        </mesh>
      ))}
    </>
  );
}

function CypressTree() {
  return (
    <>
      <Trunk height={0.6} radius={0.12} />
      <mesh castShadow position={[0, 1.75, 0]}>
        <capsuleGeometry args={[0.42, 1.9, 8, 14]} />
        <meshStandardMaterial color="#35683c" roughness={0.85} />
      </mesh>
    </>
  );
}

function PalmTree() {
  const segments = 7;
  const trunk = Array.from({ length: segments }, (_, i) => ({
    y: 0.2 + i * 0.4,
    x: 0.035 * i * i * 0.35,
    r: 0.12 - i * 0.006,
  }));
  const top = trunk[segments - 1];
  return (
    <>
      {trunk.map((seg, i) => (
        <mesh key={i} castShadow position={[seg.x, seg.y, 0]} rotation={[0, 0, -0.04 * i]}>
          <cylinderGeometry args={[seg.r * 0.92, seg.r, 0.42, 10]} />
          <meshStandardMaterial color={i % 2 ? "#8a6a45" : "#7a5c3a"} roughness={0.9} />
        </mesh>
      ))}
      <group position={[top.x, top.y + 0.2, 0]}>
        {Array.from({ length: 8 }, (_, i) => (
          <group key={i} rotation={[0, (i / 8) * Math.PI * 2, 0]}>
            <mesh castShadow position={[0, -0.12, 0.75]} rotation={[0.45, 0, 0]} scale={[0.26, 0.05, 0.95]}>
              <sphereGeometry args={[1, 12, 8]} />
              <meshStandardMaterial color={i % 2 ? "#3f9a4a" : "#4caf50"} roughness={0.8} />
            </mesh>
          </group>
        ))}
        {[0, 1, 2].map((i) => (
          <mesh key={i} castShadow position={[Math.cos(i * 2.1) * 0.14, -0.12, Math.sin(i * 2.1) * 0.14]}>
            <sphereGeometry args={[0.1, 10, 8]} />
            <meshStandardMaterial color="#6b4a2a" />
          </mesh>
        ))}
      </group>
    </>
  );
}

export function Tree({
  position,
  kind,
  scale = 1,
  rotation = 0,
}: {
  position: Vec3;
  kind: TreeKind;
  scale?: number;
  rotation?: number;
}) {
  return (
    <group position={position} scale={scale} rotation={[0, rotation, 0]}>
      {kind === "pine" ? (
        <PineTree />
      ) : kind === "cypress" ? (
        <CypressTree />
      ) : kind === "palm" ? (
        <PalmTree />
      ) : (
        <RoundTree kind={kind} />
      )}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Lanskap di luar batas kampus                                        */
/* ------------------------------------------------------------------ */

// Area yang bisa dijelajahi (lihat isBlocked di game-canvas).
const BOUNDS = { minX: -16.5, maxX: 16.5, minZ: -16.5, maxZ: 12.5 };
const HEDGE_OFFSET = 0.8;
const ROAD_INNER = 2.2;
const ROAD_WIDTH = 4;

function rectRing(offset: number) {
  return {
    minX: BOUNDS.minX - offset,
    maxX: BOUNDS.maxX + offset,
    minZ: BOUNDS.minZ - offset,
    maxZ: BOUNDS.maxZ + offset,
  };
}

function insideRect(x: number, z: number, r: ReturnType<typeof rectRing>) {
  return x > r.minX && x < r.maxX && z > r.minZ && z < r.maxZ;
}

function BoundaryHedge() {
  const r = rectRing(HEDGE_OFFSET);
  const w = r.maxX - r.minX;
  const d = r.maxZ - r.minZ;
  const cx = (r.minX + r.maxX) / 2;
  const cz = (r.minZ + r.maxZ) / 2;
  const sides: Array<{ position: Vec3; args: Vec3 }> = [
    { position: [cx, 0.45, r.minZ], args: [w + 0.9, 0.9, 0.9] },
    { position: [cx, 0.45, r.maxZ], args: [w + 0.9, 0.9, 0.9] },
    { position: [r.minX, 0.45, cz], args: [0.9, 0.9, d] },
    { position: [r.maxX, 0.45, cz], args: [0.9, 0.9, d] },
  ];
  return (
    <>
      {sides.map((side, i) => (
        <RoundedBox key={i} castShadow receiveShadow position={side.position} args={side.args} radius={0.35} smoothness={3}>
          <meshStandardMaterial color="#3f7d3a" roughness={0.95} />
        </RoundedBox>
      ))}
    </>
  );
}

const ROAD_MATERIAL = new THREE.MeshLambertMaterial({ color: "#5d6168" });
const DASH_MATERIAL = new THREE.MeshLambertMaterial({ color: "#f1e6c8" });
const SIDEWALK_MATERIAL = new THREE.MeshLambertMaterial({ color: "#b8b2a7" });
const PLANE_GEOMETRY = new THREE.PlaneGeometry(1, 1);

function Road() {
  const { roads, dashes, sidewalks } = useMemo(() => {
    const inner = rectRing(ROAD_INNER);
    const mid = rectRing(ROAD_INNER + ROAD_WIDTH / 2);
    const outer = rectRing(ROAD_INNER + ROAD_WIDTH);
    const flat: Vec3 = [-Math.PI / 2, 0, 0];
    const band = (r: ReturnType<typeof rectRing>, width: number, y: number): InstanceSpec[] => {
      const w = r.maxX - r.minX + width;
      const d = r.maxZ - r.minZ + width;
      const cx = (r.minX + r.maxX) / 2;
      const cz = (r.minZ + r.maxZ) / 2;
      return [
        { position: [cx, y, r.minZ], rotation: flat, scale: [w, width, 1] },
        { position: [cx, y, r.maxZ], rotation: flat, scale: [w, width, 1] },
        { position: [r.minX, y, cz], rotation: flat, scale: [width, d, 1] },
        { position: [r.maxX, y, cz], rotation: flat, scale: [width, d, 1] },
      ];
    };
    const dashList: InstanceSpec[] = [];
    for (let x = mid.minX + 1; x < mid.maxX - 1; x += 2.4) {
      dashList.push({ position: [x, 0.02, mid.minZ], rotation: flat, scale: [1.1, 0.14, 1] });
      dashList.push({ position: [x, 0.02, mid.maxZ], rotation: flat, scale: [1.1, 0.14, 1] });
    }
    for (let z = mid.minZ + 1; z < mid.maxZ - 1; z += 2.4) {
      dashList.push({ position: [mid.minX, 0.02, z], rotation: flat, scale: [0.14, 1.1, 1] });
      dashList.push({ position: [mid.maxX, 0.02, z], rotation: flat, scale: [0.14, 1.1, 1] });
    }
    return {
      roads: band(mid, ROAD_WIDTH, 0.008),
      dashes: dashList,
      sidewalks: [...band(inner, 1, 0.014), ...band(outer, 1, 0.014)],
    };
  }, []);

  return (
    <>
      <Instanced geometry={PLANE_GEOMETRY} material={ROAD_MATERIAL} items={roads} receiveShadow />
      <Instanced geometry={PLANE_GEOMETRY} material={SIDEWALK_MATERIAL} items={sidewalks} receiveShadow />
      <Instanced geometry={PLANE_GEOMETRY} material={DASH_MATERIAL} items={dashes} />
    </>
  );
}

const FOREST_TRUNK = new THREE.CylinderGeometry(0.12, 0.18, 1.4, 6).translate(0, 0.7, 0);
const FOREST_CONE = new THREE.ConeGeometry(1, 2.2, 8).translate(0, 1.1, 0);
const FOREST_BALL = new THREE.SphereGeometry(1, 12, 10);
const FOREST_MATERIAL = new THREE.MeshLambertMaterial({ color: "#ffffff" });
const FOREST_GREENS = ["#2f6b3f", "#3f7f45", "#4f9d45", "#5f9b4b", "#356e44", "#6bb356"];
const FOREST_ACCENTS = ["#e39b3a", "#f3a5c0", "#d8742f"];

// Sabuk pepohonan di luar jalan, lalu siluet kota dan bukit di kejauhan —
// semuanya memudar ke kabut sehingga ujung dunia tidak terlihat.
function DistantForest() {
  const { trunks, cones, balls } = useMemo(() => {
    const rand = seeded(7);
    const inner = rectRing(ROAD_INNER + ROAD_WIDTH + 1.2);
    const outer = rectRing(ROAD_INNER + ROAD_WIDTH + 9);
    const trunkList: InstanceSpec[] = [];
    const coneList: InstanceSpec[] = [];
    const ballList: InstanceSpec[] = [];
    for (let x = outer.minX; x <= outer.maxX; x += 2.3) {
      for (let z = outer.minZ; z <= outer.maxZ; z += 2.3) {
        const px = x + (rand() - 0.5) * 1.6;
        const pz = z + (rand() - 0.5) * 1.6;
        if (insideRect(px, pz, inner) || !insideRect(px, pz, outer)) continue;
        if (rand() < 0.2) continue;
        const s = 0.8 + rand() * 0.8;
        trunkList.push({ position: [px, 0, pz], scale: [s, s, s], color: "#6b4a2e" });
        const color = rand() < 0.1
          ? FOREST_ACCENTS[Math.floor(rand() * FOREST_ACCENTS.length)]
          : FOREST_GREENS[Math.floor(rand() * FOREST_GREENS.length)];
        if (rand() < 0.45) {
          coneList.push({ position: [px, 1.0 * s, pz], scale: [s, s * (1 + rand() * 0.5), s], color });
        } else {
          ballList.push({ position: [px, 1.9 * s, pz], scale: [s * 1.1, s * (0.9 + rand() * 0.3), s * 1.1], color });
        }
      }
    }
    return { trunks: trunkList, cones: coneList, balls: ballList };
  }, []);

  return (
    <>
      <Instanced geometry={FOREST_TRUNK} material={FOREST_MATERIAL} items={trunks} />
      <Instanced geometry={FOREST_CONE} material={FOREST_MATERIAL} items={cones} castShadow />
      <Instanced geometry={FOREST_BALL} material={FOREST_MATERIAL} items={balls} castShadow />
    </>
  );
}

function makeFacadeTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 64, 128);
  ctx.fillStyle = "#7f93a8";
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 4; col++) {
      ctx.fillRect(6 + col * 14, 6 + row * 12, 9, 7);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const CITY_BOX = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
const CITY_COLORS = ["#c9b8a6", "#9fb3c2", "#d8c3a5", "#a8a29a", "#b88f7a", "#8fa6a0", "#c7a98a", "#aab4bf"];

function CitySkyline() {
  const facade = useMemo(() => makeFacadeTexture(), []);
  const material = useMemo(() => new THREE.MeshLambertMaterial({ color: "#ffffff", map: facade }), [facade]);
  const roofMaterial = useMemo(() => new THREE.MeshLambertMaterial({ color: "#ffffff" }), []);
  useEffect(() => () => {
    facade.dispose();
    material.dispose();
    roofMaterial.dispose();
  }, [facade, material, roofMaterial]);

  const { bodies, roofs } = useMemo(() => {
    const rand = seeded(21);
    const forest = rectRing(ROAD_INNER + ROAD_WIDTH + 10);
    const bodyList: InstanceSpec[] = [];
    const roofList: InstanceSpec[] = [];
    for (let x = -60; x <= 60; x += 5.5) {
      for (let z = -62; z <= 58; z += 5.5) {
        const px = x + (rand() - 0.5) * 2;
        const pz = z + (rand() - 0.5) * 2;
        const dist = Math.hypot(px, pz + 2);
        if (insideRect(px, pz, forest) || dist > 58 || rand() < 0.3) continue;
        // Makin jauh makin tinggi, supaya berlapis seperti kota sungguhan.
        const height = 5 + rand() * 8 + Math.max(0, dist - 38) * 0.6;
        const w = 3 + rand() * 2.5;
        const d = 3 + rand() * 2.5;
        const color = CITY_COLORS[Math.floor(rand() * CITY_COLORS.length)];
        const rot: Vec3 = [0, (rand() - 0.5) * 0.3, 0];
        bodyList.push({ position: [px, 0, pz], rotation: rot, scale: [w, height, d], color });
        roofList.push({ position: [px, height, pz], rotation: rot, scale: [w + 0.3, 0.35, d + 0.3], color: "#6d7078" });
      }
    }
    return { bodies: bodyList, roofs: roofList };
  }, []);

  return (
    <>
      <Instanced geometry={CITY_BOX} material={material} items={bodies} />
      <Instanced geometry={CITY_BOX} material={roofMaterial} items={roofs} />
    </>
  );
}

const HILL_MATERIAL = new THREE.MeshLambertMaterial({ color: "#6f9f68" });
const HILL_GEOMETRY = new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);

function Hills() {
  const hills = useMemo(() => {
    const rand = seeded(3);
    return Array.from({ length: 14 }, (_, i): InstanceSpec => {
      const angle = (i / 14) * Math.PI * 2 + rand() * 0.3;
      const radius = 60 + rand() * 6;
      return {
        position: [Math.sin(angle) * radius, -0.5, Math.cos(angle) * radius - 2],
        rotation: [0, -angle, 0],
        scale: [16 + rand() * 10, 8 + rand() * 9, 8 + rand() * 4],
      };
    });
  }, []);
  return <Instanced geometry={HILL_GEOMETRY} material={HILL_MATERIAL} items={hills} />;
}

const PATCH_GEOMETRY = new THREE.CircleGeometry(1, 20);
const PATCH_MATERIAL = new THREE.MeshLambertMaterial({ color: "#ffffff" });

function GrassPatches() {
  const patches = useMemo(() => {
    const rand = seeded(11);
    return Array.from({ length: 40 }, (): InstanceSpec => {
      const s = 1.2 + rand() * 2.6;
      return {
        position: [(rand() - 0.5) * 70, 0.001, (rand() - 0.5) * 66 - 2],
        rotation: [-Math.PI / 2, 0, rand() * Math.PI],
        scale: [s, s * (0.6 + rand() * 0.4), 1],
        color: rand() < 0.5 ? "#6fb35f" : "#8ccb74",
      };
    });
  }, []);
  return <Instanced geometry={PATCH_GEOMETRY} material={PATCH_MATERIAL} items={patches} receiveShadow />;
}

export function CampusSurroundings() {
  return (
    <>
      <GrassPatches />
      <BoundaryHedge />
      <Road />
      <DistantForest />
      <CitySkyline />
      <Hills />
    </>
  );
}
