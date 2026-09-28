"use client";

import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { OPS_PRODUCTS, type OpsProductId } from "@/lib/data/worlds";
import { clampDelta } from "../world-kit";
import { canvasTexture, fitText } from "./race-scenery";

/* ------------------------------------------------------------------ */
/* Model-model level Shift Gudang Pintar. Semua menghadap +Z.          */
/* ------------------------------------------------------------------ */

function tinted(geometry: THREE.BufferGeometry, color: string) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  const c = new THREE.Color(color);
  const colors = new Float32Array(g.attributes.position.count * 3);
  for (let i = 0; i < colors.length; i += 3) {
    colors[i] = c.r;
    colors[i + 1] = c.g;
    colors[i + 2] = c.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return g;
}

const box = (w: number, h: number, d: number, x: number, y: number, z: number, color: string, ry = 0) => {
  const g = new THREE.BoxGeometry(w, h, d);
  if (ry) g.rotateY(ry);
  g.translate(x, y, z);
  return tinted(g, color);
};

const palletCache = new Map<string, THREE.BufferGeometry>();

/** Satu palet kayu + 3 lapis karung semen, digabung jadi satu geometri berwarna. */
function palletGeometry(product: OpsProductId) {
  const hit = palletCache.get(product);
  if (hit) return hit;
  const info = OPS_PRODUCTS[product];
  const parts: THREE.BufferGeometry[] = [];
  // Palet kayu
  [-0.45, 0, 0.45].forEach((z) => parts.push(box(1.3, 0.1, 0.28, 0, 0.05, z, "#8a6038")));
  [-0.55, 0, 0.55].forEach((x) => parts.push(box(0.16, 0.08, 1.2, x, 0.14, 0, "#9d7044")));
  parts.push(box(1.32, 0.05, 1.2, 0, 0.2, 0, "#b5885a"));
  // Karung (pola ikatan berselang tiap lapis)
  for (let layer = 0; layer < 3; layer++) {
    const y = 0.36 + layer * 0.27;
    const rot = layer % 2 ? Math.PI / 2 : 0;
    [[-0.31, -0.27], [0.31, -0.27], [-0.31, 0.27], [0.31, 0.27]].forEach(([x, z], k) => {
      const [px, pz] = rot ? [z, x] : [x, z];
      parts.push(box(0.6, 0.25, 0.5, px, y, pz, (layer + k) % 2 ? info.sack : new THREE.Color(info.sack).multiplyScalar(0.93).getStyle(), rot));
      parts.push(box(0.62, 0.08, 0.2, px, y + 0.02, pz, info.color, rot));
    });
  }
  const merged = mergeGeometries(parts)!;
  merged.computeVertexNormals();
  palletCache.set(product, merged);
  return merged;
}

const palletMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, flatShading: true });
const GHOST_BOX = new THREE.BoxGeometry(1.3, 1.05, 1.15);
const GHOST_EDGES = new THREE.EdgesGeometry(GHOST_BOX);

export function PalletModel({ product, ghost = false }: { product: OpsProductId; ghost?: boolean }) {
  const geometry = useMemo(() => palletGeometry(product), [product]);
  if (ghost) {
    const color = OPS_PRODUCTS[product].color;
    return (
      <group>
        <mesh position={[0, 0.55, 0]} geometry={GHOST_BOX}>
          <meshBasicMaterial color={color} transparent opacity={0.22} depthWrite={false} />
        </mesh>
        <lineSegments position={[0, 0.55, 0]} geometry={GHOST_EDGES}>
          <lineBasicMaterial color={color} />
        </lineSegments>
      </group>
    );
  }
  return <mesh geometry={geometry} material={palletMaterial} castShadow receiveShadow />;
}

/* ------------------------------------------------------------------ */
/* Truk bak (pelanggan)                                                */
/* ------------------------------------------------------------------ */

export const TRUCK_SLOTS = [-2.7, -1.25, 0.2];
export type TruckMotion = RefObject<{ speed: number }>;

export function FlatbedTruck({
  cab = "#2f6fb5",
  loaded,
  needed,
  motion,
}: {
  cab?: string;
  loaded: OpsProductId[];
  /** Palet yang masih ditunggu (ditampilkan sebagai slot transparan). */
  needed: OpsProductId[];
  motion?: TruckMotion;
}) {
  const wheels = useRef<THREE.Group[]>([]);
  const beacon = useRef<THREE.MeshStandardMaterial>(null);
  const clock = useRef(0);
  useFrame((_, raw) => {
    const delta = clampDelta(raw);
    clock.current += delta;
    const speed = motion?.current.speed ?? 0;
    wheels.current.forEach((w) => (w.rotation.x += (speed * delta) / 0.5));
    if (beacon.current) beacon.current.emissiveIntensity = Math.abs(speed) > 0.1 && speed < 0 ? (Math.sin(clock.current * 14) > 0 ? 2 : 0.1) : 0.2;
  });
  const addWheel = (node: THREE.Group | null) => {
    if (node && !wheels.current.includes(node)) wheels.current.push(node);
  };
  const slots = [...loaded.map((p) => ({ p, ghost: false })), ...needed.map((p) => ({ p, ghost: true }))];
  return (
    <group>
      {/* Sasis & bak */}
      <mesh position={[0, 0.75, -0.6]} castShadow>
        <boxGeometry args={[1.6, 0.3, 7]} />
        <meshStandardMaterial color="#23262d" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.02, -1.25]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.22, 4.9]} />
        <meshStandardMaterial color="#6d6f73" roughness={0.7} metalness={0.2} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 1.22, 1.32, -1.25]} castShadow>
          <boxGeometry args={[0.08, 0.42, 4.9]} />
          <meshStandardMaterial color={cab} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 1.4, 1.2]} castShadow>
        <boxGeometry args={[2.5, 0.6, 0.1]} />
        <meshStandardMaterial color="#8c8f94" />
      </mesh>
      {/* Kabin */}
      <group position={[0, 0, 2.3]}>
        <mesh position={[0, 1.75, 0]} castShadow>
          <boxGeometry args={[2.4, 1.6, 1.7]} />
          <meshStandardMaterial color={cab} roughness={0.45} metalness={0.15} />
        </mesh>
        <mesh position={[0, 2.12, 0.86]}>
          <boxGeometry args={[2.1, 0.7, 0.05]} />
          <meshStandardMaterial color="#1b2f3d" metalness={0.4} roughness={0.12} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 1.21, 2.12, 0.2]}>
            <boxGeometry args={[0.04, 0.6, 0.9]} />
            <meshStandardMaterial color="#1b2f3d" metalness={0.4} roughness={0.12} />
          </mesh>
        ))}
        <mesh position={[0, 1.2, 0.87]}>
          <boxGeometry args={[1.6, 0.5, 0.06]} />
          <meshStandardMaterial color="#2a2d33" metalness={0.5} roughness={0.4} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.95, 1.2, 0.88]}>
            <boxGeometry args={[0.36, 0.22, 0.05]} />
            <meshStandardMaterial color="#fff6d8" emissive="#ffe8a8" emissiveIntensity={1} />
          </mesh>
        ))}
        <mesh position={[0, 0.72, 0.92]}>
          <boxGeometry args={[2.5, 0.28, 0.24]} />
          <meshStandardMaterial color="#d7dbe0" metalness={0.8} roughness={0.25} />
        </mesh>
      </group>
      {/* Lampu mundur */}
      <mesh position={[0, 1.1, -3.72]}>
        <boxGeometry args={[1.8, 0.16, 0.06]} />
        <meshStandardMaterial ref={beacon} color="#ffb020" emissive="#ff8a00" emissiveIntensity={0.2} />
      </mesh>
      {/* Roda */}
      {[
        [-1.12, 2.4],
        [1.12, 2.4],
        [-1.12, -2.2],
        [1.12, -2.2],
        [-1.12, -3.1],
        [1.12, -3.1],
      ].map(([x, z]) => (
        <group key={`${x}:${z}`} position={[x, 0.5, z]} ref={addWheel}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.5, 0.5, 0.36, 14]} />
            <meshStandardMaterial color="#1a1b1f" roughness={0.9} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.26, 0.26, 0.38, 8]} />
            <meshStandardMaterial color="#b9bcc2" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      ))}
      {/* Muatan */}
      {slots.slice(0, TRUCK_SLOTS.length).map((slot, k) => (
        <group key={k} position={[0, 1.13, TRUCK_SLOTS[k]]}>
          <PalletModel product={slot.p} ghost={slot.ghost} />
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Forklift                                                            */
/* ------------------------------------------------------------------ */

export function Forklift({ product = "opc", color = "#f2a93b" }: { product?: OpsProductId; color?: string }) {
  const beacon = useRef<THREE.MeshStandardMaterial>(null);
  const wheels = useRef<THREE.Group>(null);
  const clock = useRef(0);
  useFrame((_, raw) => {
    const delta = clampDelta(raw);
    clock.current += delta;
    if (beacon.current) beacon.current.emissiveIntensity = Math.sin(clock.current * 10) > 0 ? 2.4 : 0.3;
    wheels.current?.children.forEach((w) => (w.rotation.x += delta * 7));
  });
  return (
    <group>
      <mesh position={[0, 0.7, -0.2]} castShadow>
        <boxGeometry args={[1.3, 0.8, 1.9]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.85, -1.15]} castShadow>
        <boxGeometry args={[1.35, 1, 0.45]} />
        <meshStandardMaterial color="#3a3d44" roughness={0.6} />
      </mesh>
      {/* Kursi & pengemudi */}
      <mesh position={[0, 1.25, -0.4]}>
        <boxGeometry args={[0.6, 0.2, 0.6]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0, 1.75, -0.35]} castShadow>
        <capsuleGeometry args={[0.24, 0.5, 4, 8]} />
        <meshStandardMaterial color="#2d6cdf" />
      </mesh>
      <mesh position={[0, 2.25, -0.3]} castShadow>
        <sphereGeometry args={[0.2, 10, 8]} />
        <meshStandardMaterial color="#e0b48a" />
      </mesh>
      <mesh position={[0, 2.42, -0.3]}>
        <sphereGeometry args={[0.22, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#ffd23f" />
      </mesh>
      {/* Pelindung atas */}
      {[
        [-0.58, 0.45],
        [0.58, 0.45],
        [-0.58, -1.1],
        [0.58, -1.1],
      ].map(([x, z]) => (
        <mesh key={`${x}:${z}`} position={[x, 1.85, z]}>
          <boxGeometry args={[0.07, 1.5, 0.07]} />
          <meshStandardMaterial color="#26282d" />
        </mesh>
      ))}
      <mesh position={[0, 2.62, -0.33]} castShadow>
        <boxGeometry args={[1.25, 0.06, 1.65]} />
        <meshStandardMaterial color="#26282d" />
      </mesh>
      <mesh position={[0, 2.72, -0.9]}>
        <cylinderGeometry args={[0.11, 0.11, 0.18, 10]} />
        <meshStandardMaterial ref={beacon} color="#ff9f1c" emissive="#ff7b00" emissiveIntensity={1} />
      </mesh>
      {/* Tiang & garpu */}
      {[-0.45, 0.45].map((x) => (
        <mesh key={x} position={[x, 1.4, 0.95]} castShadow>
          <boxGeometry args={[0.1, 2.6, 0.12]} />
          <meshStandardMaterial color="#3a3d44" metalness={0.4} />
        </mesh>
      ))}
      {[-0.35, 0.35].map((x) => (
        <mesh key={x} position={[x, 0.32, 1.6]}>
          <boxGeometry args={[0.12, 0.06, 1.3]} />
          <meshStandardMaterial color="#5a5d63" metalness={0.5} />
        </mesh>
      ))}
      <group position={[0, 0.36, 1.6]} scale={0.85}>
        <PalletModel product={product} />
      </group>
      <group ref={wheels}>
        {[
          [-0.62, 0.55],
          [0.62, 0.55],
          [-0.62, -0.95],
          [0.62, -0.95],
        ].map(([x, z]) => (
          <group key={`${x}:${z}`} position={[x, 0.3, z]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.3, 0.3, 0.25, 12]} />
              <meshStandardMaterial color="#1a1b1f" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Rak gudang                                                          */
/* ------------------------------------------------------------------ */

function signTexture(title: string, sub: string, bg: string, fg = "#ffffff") {
  return canvasTexture(512, 192, (g) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, 512, 192);
    g.fillStyle = "rgba(0,0,0,.18)";
    g.fillRect(0, 150, 512, 42);
    g.fillStyle = fg;
    g.textAlign = "center";
    g.textBaseline = "middle";
    fitText(g, title, 470, 92);
    g.fillText(title, 256, 78);
    g.font = "800 30px system-ui, sans-serif";
    g.fillText(sub, 256, 171);
  });
}

export const RACK_SLOTS: [number, number, number][] = [
  [0, 0.12, -1.6], [0, 0.12, 0], [0, 0.12, 1.6],
  [0, 1.92, -1.6], [0, 1.92, 0], [0, 1.92, 1.6],
  [0, 3.72, -1.6], [0, 3.72, 0],
];

/** Rak baja 3 tingkat; sisi depan (+X lokal) menghadap lorong. */
export function WarehouseRack({ product, count, glow }: { product: OpsProductId; count: number; glow: boolean }) {
  const info = OPS_PRODUCTS[product];
  const sign = useMemo(() => signTexture(info.nama.toUpperCase(), "RAK GUDANG · STOK REAL-TIME", info.color === "#f4f1ea" ? "#8a8f98" : info.color), [info]);
  return (
    <group>
      {[-2.45, 2.45].flatMap((z) =>
        [-0.7, 0.7].map((x) => (
          <mesh key={`${x}:${z}`} position={[x, 2.8, z]} castShadow>
            <boxGeometry args={[0.12, 5.6, 0.12]} />
            <meshStandardMaterial color="#2d5fa8" metalness={0.3} roughness={0.5} />
          </mesh>
        ))
      )}
      {[0, 1.8, 3.6].flatMap((y) =>
        [-0.7, 0.7].map((x) => (
          <mesh key={`${x}:${y}`} position={[x, y + 0.05, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.12, 0.14, 5.1]} />
            <meshStandardMaterial color="#f29b38" metalness={0.2} roughness={0.5} />
          </mesh>
        ))
      )}
      {RACK_SLOTS.slice(0, Math.min(count, RACK_SLOTS.length)).map((p, k) => (
        <group key={k} position={p} rotation={[0, Math.PI / 2, 0]}>
          <PalletModel product={product} />
        </group>
      ))}
      <mesh position={[0.75, 5.95, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[3.6, 1.35]} />
        <meshStandardMaterial map={sign} emissive="#ffffff" emissiveMap={sign} emissiveIntensity={glow ? 0.55 : 0.2} />
      </mesh>
      {/* Garis lantai area ambil */}
      <mesh position={[3.4, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.2, 4.6]} />
        <meshBasicMaterial color={info.color} transparent opacity={glow ? 0.55 : 0.28} depthWrite={false} polygonOffset polygonOffsetFactor={-4} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Produksi: kiln, conveyor, konsol                                    */
/* ------------------------------------------------------------------ */

export function Kiln({ running }: { running: boolean }) {
  const tube = useRef<THREE.Group>(null);
  const flame = useRef<THREE.MeshStandardMaterial>(null);
  const clock = useRef(0);
  useFrame((_, raw) => {
    const delta = clampDelta(raw);
    clock.current += delta;
    if (tube.current) tube.current.rotation.x += delta * (running ? 1.6 : 0.35);
    if (flame.current) flame.current.emissiveIntensity = (running ? 2.4 : 0.9) + Math.sin(clock.current * 13) * 0.4;
  });
  return (
    <group>
      {/* Tabung putar (sumbu X lokal, sedikit miring) */}
      <group rotation={[0, 0, -0.04]}>
        <group ref={tube} rotation={[0, 0, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
            <cylinderGeometry args={[1.6, 1.6, 26, 24, 1, true]} />
            <meshStandardMaterial color="#9a8f84" roughness={0.6} metalness={0.3} side={THREE.DoubleSide} />
          </mesh>
          {[-10, -4, 2, 8].map((x) => (
            <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <torusGeometry args={[1.66, 0.14, 8, 24]} />
              <meshStandardMaterial color="#4b4f57" metalness={0.6} roughness={0.35} />
            </mesh>
          ))}
          <mesh position={[0.5, 1.6, 0]}>
            <boxGeometry args={[25, 0.12, 0.4]} />
            <meshStandardMaterial color="#c0392b" />
          </mesh>
        </group>
      </group>
      {/* Penyangga */}
      {[-9, -3, 3, 9].map((x) => (
        <mesh key={x} position={[x, -1.4, 0]} castShadow>
          <boxGeometry args={[1.2, 2.8, 3]} />
          <meshStandardMaterial color="#c8c2b5" roughness={0.9} />
        </mesh>
      ))}
      {/* Mulut pembakaran */}
      <mesh position={[13.4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <circleGeometry args={[1.4, 20]} />
        <meshStandardMaterial ref={flame} color="#ff7a1a" emissive="#ff5a00" emissiveIntensity={1.4} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[14.2, 0, 0]} color="#ff7a1a" intensity={running ? 30 : 10} distance={10} />
    </group>
  );
}

/** Menara pemanas awal dengan siklon bertingkat. */
export function PreheaterTower() {
  return (
    <group>
      {[-2.2, 2.2].flatMap((x) =>
        [-2.2, 2.2].map((z) => (
          <mesh key={`${x}:${z}`} position={[x, 11, z]} castShadow>
            <boxGeometry args={[0.35, 22, 0.35]} />
            <meshStandardMaterial color="#5c6470" metalness={0.4} />
          </mesh>
        ))
      )}
      {[4, 9, 14, 19].map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow receiveShadow>
          <boxGeometry args={[5, 0.3, 5]} />
          <meshStandardMaterial color="#8c939c" />
        </mesh>
      ))}
      {[
        [-1, 6, -1, 1.1],
        [1.1, 11, 0.9, 1.2],
        [-1, 16, 0.8, 1],
        [0.9, 20.5, -0.8, 0.9],
      ].map(([x, y, z, r], k) => (
        <group key={k} position={[x, y, z]}>
          <mesh castShadow>
            <cylinderGeometry args={[r, r, 2.2, 16]} />
            <meshStandardMaterial color="#d8d3c8" roughness={0.6} />
          </mesh>
          <mesh position={[0, -1.7, 0]} castShadow>
            <coneGeometry args={[r, 1.3, 16]} />
            <meshStandardMaterial color="#d8d3c8" roughness={0.6} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 26, 0]} castShadow>
        <cylinderGeometry args={[0.7, 0.9, 8, 14]} />
        <meshStandardMaterial color="#b9b3a8" />
      </mesh>
      {[24, 28].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[0.92, 0.92, 0.5, 14]} />
          <meshStandardMaterial color="#d94f3d" />
        </mesh>
      ))}
    </group>
  );
}

export function Silo({ label, color = "#e7e2d8" }: { label?: string; color?: string }) {
  const sign = useMemo(() => (label ? signTexture(label, "SILO SEMEN", "#1f3b63") : null), [label]);
  return (
    <group>
      <mesh position={[0, 9, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[3.2, 3.2, 14, 24]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, 16.4, 0]} castShadow>
        <coneGeometry args={[3.3, 1.4, 24]} />
        <meshStandardMaterial color="#b9b3a8" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.2, 0]} castShadow>
        <coneGeometry args={[3.2, 2.4, 24]} />
        <meshStandardMaterial color="#b9b3a8" />
      </mesh>
      {[-2.4, 2.4].map((x) => (
        <mesh key={x} position={[x, 1, 2.2]} castShadow>
          <boxGeometry args={[0.3, 2, 0.3]} />
          <meshStandardMaterial color="#5c6470" />
        </mesh>
      ))}
      <mesh position={[0, 12.5, 0]}>
        <cylinderGeometry args={[3.25, 3.25, 0.5, 24]} />
        <meshStandardMaterial color="#d94f3d" />
      </mesh>
      {sign && (
        <mesh position={[0, 8.5, 3.22]}>
          <planeGeometry args={[4.2, 1.6]} />
          <meshStandardMaterial map={sign} />
        </mesh>
      )}
    </group>
  );
}

/** Belt conveyor sepanjang polyline, dengan karung yang bergerak saat produksi berjalan. */
export function Conveyor({ path, running, product }: { path: [number, number][]; running: boolean; product: OpsProductId | null }) {
  const sacks = useRef<THREE.InstancedMesh>(null);
  const offset = useRef(0);
  const o = useMemo(() => new THREE.Object3D(), []);
  const { segments, total } = useMemo(() => {
    const segs: { a: [number, number]; b: [number, number]; len: number; start: number }[] = [];
    let start = 0;
    for (let i = 1; i < path.length; i++) {
      const len = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
      segs.push({ a: path[i - 1], b: path[i], len, start });
      start += len;
    }
    return { segments: segs, total: start };
  }, [path]);
  const count = Math.floor(total / 2.2);
  const color = product ? OPS_PRODUCTS[product].color : "#d8d0c0";
  useFrame((_, raw) => {
    const mesh = sacks.current;
    if (!mesh) return;
    offset.current = (offset.current + clampDelta(raw) * (running ? 3.2 : 0)) % 2.2;
    for (let i = 0; i < count; i++) {
      const d = i * 2.2 + offset.current;
      const s = segments.find((seg) => d >= seg.start && d <= seg.start + seg.len) ?? segments[segments.length - 1];
      const t = (d - s.start) / s.len;
      o.position.set(s.a[0] + (s.b[0] - s.a[0]) * t, 1.28, s.a[1] + (s.b[1] - s.a[1]) * t);
      o.rotation.set(0, Math.atan2(s.b[0] - s.a[0], s.b[1] - s.a[1]), 0);
      o.scale.setScalar(running ? 1 : 0.001);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      {segments.map((s, k) => {
        const mx = (s.a[0] + s.b[0]) / 2;
        const mz = (s.a[1] + s.b[1]) / 2;
        const rot = Math.atan2(s.b[0] - s.a[0], s.b[1] - s.a[1]);
        return (
          <group key={k} position={[mx, 0, mz]} rotation={[0, rot, 0]}>
            <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.3, 0.2, s.len + 1.3]} />
              <meshStandardMaterial color="#2a2c31" roughness={0.9} />
            </mesh>
            {[-0.72, 0.72].map((x) => (
              <mesh key={x} position={[x, 1.15, 0]}>
                <boxGeometry args={[0.14, 0.3, s.len + 1.3]} />
                <meshStandardMaterial color="#f2c14e" />
              </mesh>
            ))}
            {Array.from({ length: Math.max(1, Math.floor(s.len / 3)) }, (_, i) => (
              <mesh key={i} position={[0, 0.5, -s.len / 2 + (i + 0.5) * (s.len / Math.max(1, Math.floor(s.len / 3)))]}>
                <boxGeometry args={[1.1, 1, 0.14]} />
                <meshStandardMaterial color="#5c6470" />
              </mesh>
            ))}
          </group>
        );
      })}
      <instancedMesh ref={sacks} args={[undefined, undefined, count]} frustumCulled={false} castShadow>
        <boxGeometry args={[0.8, 0.28, 0.55]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </instancedMesh>
    </group>
  );
}

export function ProductionConsole({ product, active, busy }: { product: OpsProductId; active: boolean; busy: boolean }) {
  const info = OPS_PRODUCTS[product];
  const button = useRef<THREE.MeshStandardMaterial>(null);
  const clock = useRef(0);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    if (button.current) button.current.emissiveIntensity = active ? 1.2 + Math.sin(clock.current * 8) * 0.8 : busy ? 0.1 : 0.45;
  });
  const screen = useMemo(() => signTexture(info.singkat, "PRODUKSI", "#10233b", info.color === "#f4f1ea" ? "#ffffff" : info.color), [info]);
  return (
    <group>
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[0.9, 1.2, 0.7]} />
        <meshStandardMaterial color="#d7dbe0" metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.35, 0.05]} rotation={[-0.5, 0, 0]} castShadow>
        <boxGeometry args={[1, 0.5, 0.12]} />
        <meshStandardMaterial color="#3a3d44" />
      </mesh>
      <mesh position={[0, 1.38, 0.12]} rotation={[-0.5, 0, 0]}>
        <planeGeometry args={[0.86, 0.34]} />
        <meshStandardMaterial map={screen} emissive="#ffffff" emissiveMap={screen} emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, 1.24, 0.3]}>
        <cylinderGeometry args={[0.16, 0.18, 0.1, 16]} />
        <meshStandardMaterial ref={button} color={info.color} emissive={info.color} emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 0.03, 0.9]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.8, 24]} />
        <meshBasicMaterial color={info.color} transparent opacity={active ? 0.6 : 0.3} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function ErpTerminal({ alarm }: { alarm: boolean }) {
  const light = useRef<THREE.MeshStandardMaterial>(null);
  const ring = useRef<THREE.Mesh>(null);
  const clock = useRef(0);
  const screen = useMemo(
    () =>
      canvasTexture(256, 320, (g) => {
        g.fillStyle = "#0e1a2b";
        g.fillRect(0, 0, 256, 320);
        g.fillStyle = "#3fd0ff";
        g.font = "900 34px system-ui, sans-serif";
        g.fillText("ERP", 18, 48);
        g.fillStyle = "#ffffff";
        g.font = "700 16px system-ui, sans-serif";
        g.fillText("Terminal Ruang Kendali", 18, 74);
        ["Penjualan", "Gudang", "Produksi", "Logistik", "Keuangan"].forEach((name, k) => {
          g.fillStyle = "rgba(255,255,255,.1)";
          g.fillRect(18, 96 + k * 42, 220, 32);
          g.fillStyle = ["#ffa987", "#2fae66", "#f2c14e", "#3f8fd8", "#b36bd6"][k];
          g.fillRect(18, 96 + k * 42, 70 + ((k * 37) % 140), 32);
          g.fillStyle = "#ffffff";
          g.font = "800 15px system-ui, sans-serif";
          g.fillText(name, 26, 117 + k * 42);
        });
      }),
    []
  );
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    const t = clock.current;
    if (light.current) {
      light.current.emissive.set(alarm ? "#ff2b2b" : "#3fd0ff");
      light.current.color.set(alarm ? "#ff4b4b" : "#3fd0ff");
      light.current.emissiveIntensity = alarm ? (Math.sin(t * 12) > 0 ? 3 : 0.2) : 0.8;
    }
    if (ring.current) {
      ring.current.visible = alarm;
      const s = 1 + ((t * 1.4) % 1) * 1.6;
      ring.current.scale.set(s, s, s);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - ((t * 1.4) % 1));
    }
  });
  return (
    <group>
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[1.4, 1.8, 0.8]} />
        <meshStandardMaterial color="#1f3b63" metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0, 2.2, 0.05]} castShadow>
        <boxGeometry args={[1.5, 1.8, 0.2]} />
        <meshStandardMaterial color="#10131a" />
      </mesh>
      <mesh position={[0, 2.2, 0.16]}>
        <planeGeometry args={[1.3, 1.6]} />
        <meshStandardMaterial map={screen} emissive="#ffffff" emissiveMap={screen} emissiveIntensity={0.9} />
      </mesh>
      <mesh position={[0, 3.35, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.4, 14]} />
        <meshStandardMaterial ref={light} color="#3fd0ff" emissive="#3fd0ff" emissiveIntensity={0.8} />
      </mesh>
      <mesh ref={ring} position={[0, 0.05, 0.9]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1.15, 32]} />
        <meshBasicMaterial color="#ff4b4b" transparent opacity={0.6} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Pernak-pernik interaktif                                            */
/* ------------------------------------------------------------------ */

export function CoffeeCup() {
  const group = useRef<THREE.Group>(null);
  const clock = useRef(0);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    if (group.current) {
      group.current.rotation.y = clock.current * 1.8;
      group.current.position.y = 0.6 + Math.sin(clock.current * 3) * 0.15;
    }
  });
  return (
    <group ref={group}>
      <mesh castShadow>
        <cylinderGeometry args={[0.28, 0.22, 0.55, 14]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffe8c8" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.29, 0.29, 0.2, 14]} />
        <meshStandardMaterial color="#7a4a2a" />
      </mesh>
      <mesh position={[0.32, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.13, 0.04, 6, 12]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, -0.55, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.45, 0.6, 24]} />
        <meshBasicMaterial color="#f2c14e" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

export function SpillDecal({ radius }: { radius: number }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const n = 14;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = radius * (0.78 + 0.22 * Math.sin(i * 2.3 + radius));
      if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    return new THREE.ShapeGeometry(shape);
  }, [radius]);
  return (
    <group>
      <mesh geometry={geometry} position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#c9c4ba" roughness={0.3} polygonOffset polygonOffsetFactor={-5} />
      </mesh>
      {[-0.4, 0.3, 0.6].map((x, k) => (
        <mesh key={k} position={[x * radius * 0.6, 0.1, (k - 1) * radius * 0.4]} castShadow>
          <boxGeometry args={[0.45, 0.14, 0.35]} />
          <meshStandardMaterial color="#e8e2d6" />
        </mesh>
      ))}
      {/* Kerucut peringatan */}
      <group position={[radius + 0.2, 0, 0]}>
        <mesh position={[0, 0.35, 0]} castShadow>
          <coneGeometry args={[0.22, 0.7, 12]} />
          <meshStandardMaterial color="#ff7a1a" />
        </mesh>
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.15, 0.17, 0.12, 12]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
    </group>
  );
}

/** Tumpukan palet yang dibawa pemain (di depan dada). */
export function CarriedStack({ items }: { items: OpsProductId[] }) {
  return (
    <group position={[0, 0.95, 0.75]} scale={0.62}>
      {items.map((product, k) => (
        <group key={k} position={[0, k * 1.08, 0]}>
          <PalletModel product={product} />
        </group>
      ))}
    </group>
  );
}
