"use client";

import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { clampDelta, Label } from "../world-kit";

/* ------------------------------------------------------------------ */
/* Truk molen dan kendaraan lalu lintas                               */
/* Semua model menghadap +Z.                                           */
/* ------------------------------------------------------------------ */

export type MotionRef = RefObject<{ speed: number; steer: number; braking: boolean }>;

const WHEEL_RADIUS = 0.58;

/** Profil drum molen (diputar mengelilingi sumbu Y: -Y = depan, +Y = corong belakang). */
const DRUM_PROFILE = [
  [0.0, -1.95], [0.55, -1.9], [0.95, -1.65], [1.18, -1.1], [1.25, -0.4], [1.2, 0.3],
  [1.02, 1.0], [0.72, 1.6], [0.5, 1.95], [0.46, 2.05],
].map(([r, y]) => new THREE.Vector2(r, y));

function drumRadius(y: number) {
  for (let i = 1; i < DRUM_PROFILE.length; i++) {
    const a = DRUM_PROFILE[i - 1], b = DRUM_PROFILE[i];
    if (y <= b.y) return THREE.MathUtils.lerp(a.x, b.x, (y - a.y) / (b.y - a.y || 1));
  }
  return DRUM_PROFILE[DRUM_PROFILE.length - 1].x;
}

class DrumHelix extends THREE.Curve<THREE.Vector3> {
  constructor(private phase: number) {
    super();
  }
  getPoint(u: number, target = new THREE.Vector3()) {
    const y = THREE.MathUtils.lerp(-1.55, 1.75, u);
    const angle = this.phase + u * Math.PI * 2 * 1.6;
    const r = drumRadius(y) + 0.015;
    return target.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
  }
}

function useDrumGeometry() {
  return useMemo(() => {
    const drum = new THREE.LatheGeometry(DRUM_PROFILE, 22);
    const helixA = new THREE.TubeGeometry(new DrumHelix(0), 80, 0.07, 5, false);
    const helixB = new THREE.TubeGeometry(new DrumHelix(Math.PI), 80, 0.07, 5, false);
    return { drum, helixA, helixB };
  }, []);
}

function Wheel({
  x,
  z,
  side = Math.sign(x),
  wheelRef,
  dual = false,
}: {
  x: number;
  z: number;
  side?: number;
  wheelRef?: (node: THREE.Group | null) => void;
  dual?: boolean;
}) {
  return (
    <group position={[x, WHEEL_RADIUS, z]}>
      <group ref={wheelRef}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[WHEEL_RADIUS, WHEEL_RADIUS, dual ? 0.62 : 0.42, 16]} />
          <meshStandardMaterial color="#17181c" roughness={0.9} />
        </mesh>
        <mesh position={[side * (dual ? 0.32 : 0.22), 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.33, 0.33, 0.04, 12]} />
          <meshStandardMaterial color="#c9ced6" metalness={0.6} roughness={0.35} />
        </mesh>
        {[0, 1, 2, 3, 4].map((k) => (
          <mesh key={k} position={[side * (dual ? 0.34 : 0.24), Math.cos((k / 5) * Math.PI * 2) * 0.2, Math.sin((k / 5) * Math.PI * 2) * 0.2]}>
            <boxGeometry args={[0.03, 0.07, 0.07]} />
            <meshStandardMaterial color="#6b717b" metalness={0.5} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Mengatur putaran roda, belok roda depan, drum, dan lampu rem dari `motion`. */
function useVehicleAnimation(motion: MotionRef | undefined, fallbackSpeed = 0) {
  const wheels = useRef<THREE.Group[]>([]);
  const steering = useRef<THREE.Group[]>([]);
  const brakes = useRef<THREE.MeshStandardMaterial[]>([]);
  const spin = useRef(0);
  useFrame((_, raw) => {
    const delta = clampDelta(raw);
    const m = motion?.current;
    const speed = m ? m.speed : fallbackSpeed;
    spin.current += (speed * delta) / WHEEL_RADIUS;
    wheels.current.forEach((wheel) => wheel && (wheel.rotation.x = spin.current));
    steering.current.forEach((group) => group && (group.rotation.y = THREE.MathUtils.damp(group.rotation.y, (m?.steer ?? 0) * 0.45, 10, delta)));
    brakes.current.forEach((material) => (material.emissiveIntensity = m?.braking ? 2.2 : 0.5));
  });
  const addWheel = (node: THREE.Group | null) => {
    if (node && !wheels.current.includes(node)) wheels.current.push(node);
  };
  const addSteer = (node: THREE.Group | null) => {
    if (node && !steering.current.includes(node)) steering.current.push(node);
  };
  const addBrake = (node: THREE.MeshStandardMaterial | null) => {
    if (node && !brakes.current.includes(node)) brakes.current.push(node);
  };
  return { addWheel, addSteer, addBrake };
}

export interface TruckLivery {
  cab: string;
  stripe: string;
  drum: string;
  helix: string;
}

export const PLAYER_LIVERY: TruckLivery = { cab: "#f26b3a", stripe: "#fff4e8", drum: "#f4f1ea", helix: "#f26b3a" };

export function CementTruck({
  livery = PLAYER_LIVERY,
  motion,
  label,
}: {
  livery?: TruckLivery;
  motion?: MotionRef;
  label?: string;
}) {
  const drumRef = useRef<THREE.Group>(null);
  const geo = useDrumGeometry();
  const { addWheel, addSteer, addBrake } = useVehicleAnimation(motion, 12);
  useFrame((_, raw) => {
    if (drumRef.current) drumRef.current.rotation.y += clampDelta(raw) * 1.6;
  });
  const glass = <meshStandardMaterial color="#1b2f3d" metalness={0.4} roughness={0.12} />;
  const chrome = <meshStandardMaterial color="#d7dbe0" metalness={0.8} roughness={0.25} />;

  return (
    <group>
      {/* Sasis */}
      <mesh position={[0, 0.95, -0.3]} castShadow>
        <boxGeometry args={[1.5, 0.34, 7.2]} />
        <meshStandardMaterial color="#23262d" roughness={0.8} />
      </mesh>
      {/* Kabin */}
      <group position={[0, 0, 2.55]}>
        <mesh position={[0, 1.95, 0]} castShadow>
          <boxGeometry args={[2.5, 1.55, 1.95]} />
          <meshStandardMaterial color={livery.cab} roughness={0.45} metalness={0.15} />
        </mesh>
        <mesh position={[0, 2.82, -0.05]} castShadow>
          <boxGeometry args={[2.36, 0.2, 1.75]} />
          <meshStandardMaterial color={livery.cab} roughness={0.45} metalness={0.15} />
        </mesh>
        <mesh position={[0, 1.55, 0]}>
          <boxGeometry args={[2.52, 0.2, 1.97]} />
          <meshStandardMaterial color={livery.stripe} roughness={0.5} />
        </mesh>
        {/* Kaca depan & samping */}
        <mesh position={[0, 2.3, 0.99]} rotation={[-0.08, 0, 0]}>
          <boxGeometry args={[2.2, 0.78, 0.05]} />
          {glass}
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 1.262, 2.3, 0.15]}>
            <boxGeometry args={[0.04, 0.62, 1.1]} />
            {glass}
          </mesh>
        ))}
        {/* Gril, lampu, bemper */}
        <mesh position={[0, 1.35, 1.0]}>
          <boxGeometry args={[1.5, 0.62, 0.08]} />
          <meshStandardMaterial color="#2a2d33" metalness={0.5} roughness={0.4} />
        </mesh>
        {[-0.3, -0.15, 0, 0.15, 0.3].map((y) => (
          <mesh key={y} position={[0, 1.35 + y * 0.9, 1.05]}>
            <boxGeometry args={[1.45, 0.04, 0.03]} />
            {chrome}
          </mesh>
        ))}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.98, 1.38, 1.0]}>
            <boxGeometry args={[0.42, 0.26, 0.06]} />
            <meshStandardMaterial color="#fff6d8" emissive="#ffe8a8" emissiveIntensity={1.2} />
          </mesh>
        ))}
        <mesh position={[0, 0.82, 1.08]} castShadow>
          <boxGeometry args={[2.6, 0.32, 0.3]} />
          {chrome}
        </mesh>
        {/* Lampu atap */}
        {[-0.7, -0.35, 0, 0.35, 0.7].map((x) => (
          <mesh key={x} position={[x, 2.97, 0.6]}>
            <boxGeometry args={[0.2, 0.1, 0.12]} />
            <meshStandardMaterial color="#ffb347" emissive="#ff9f1c" emissiveIntensity={0.8} />
          </mesh>
        ))}
        {/* Spion */}
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 1.45, 2.2, 0.7]}>
            <mesh position={[-side * 0.08, 0, 0]}>
              <boxGeometry args={[0.2, 0.05, 0.05]} />
              <meshStandardMaterial color="#23262d" />
            </mesh>
            <mesh position={[side * 0.05, 0, 0]}>
              <boxGeometry args={[0.08, 0.42, 0.24]} />
              <meshStandardMaterial color="#23262d" />
            </mesh>
          </group>
        ))}
        {/* Spakbor depan */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 1.12, 1.25, 0]} castShadow>
            <boxGeometry args={[0.46, 0.12, 1.35]} />
            <meshStandardMaterial color="#23262d" />
          </mesh>
        ))}
      </group>
      {/* Knalpot tegak & tangki */}
      <mesh position={[1.08, 2.55, 1.45]}>
        <cylinderGeometry args={[0.09, 0.09, 1.9, 8]} />
        {chrome}
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 1.0, 0.95, 0.9]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 1.0, 12]} />
          {chrome}
        </mesh>
      ))}
      {/* Dudukan & drum molen */}
      {[0.9, -2.7].map((z) => (
        <mesh key={z} position={[0, 1.55, z]} castShadow>
          <boxGeometry args={[1.6, 0.9, 0.28]} />
          <meshStandardMaterial color="#3b3f47" />
        </mesh>
      ))}
      <group position={[0, 2.35, -0.95]} rotation={[-Math.PI / 2 + 0.2, 0, 0]}>
        <group ref={drumRef}>
          <mesh geometry={geo.drum} castShadow>
            <meshStandardMaterial color={livery.drum} roughness={0.55} metalness={0.1} flatShading side={THREE.DoubleSide} />
          </mesh>
          <mesh geometry={geo.helixA}>
            <meshStandardMaterial color={livery.helix} roughness={0.5} />
          </mesh>
          <mesh geometry={geo.helixB}>
            <meshStandardMaterial color={livery.helix} roughness={0.5} />
          </mesh>
        </group>
      </group>
      {/* Corong & tangga belakang */}
      <mesh position={[0, 2.25, -3.45]} rotation={[0.9, 0, 0]} castShadow>
        <boxGeometry args={[0.7, 0.08, 0.9]} />
        <meshStandardMaterial color="#555b66" metalness={0.4} />
      </mesh>
      <mesh position={[0, 1.55, -3.55]} rotation={[-0.5, 0, 0]}>
        <boxGeometry args={[0.36, 0.06, 1.1]} />
        <meshStandardMaterial color="#555b66" metalness={0.4} />
      </mesh>
      {[-0.35, 0.35].map((x) => (
        <mesh key={x} position={[x + 0.5, 2.1, -3.3]} rotation={[0.25, 0, 0]}>
          <boxGeometry args={[0.05, 2.0, 0.05]} />
          {chrome}
        </mesh>
      ))}
      {/* Lampu belakang */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.95, 1.0, -3.92]}>
          <boxGeometry args={[0.4, 0.2, 0.05]} />
          <meshStandardMaterial ref={addBrake} color="#ff3b30" emissive="#ff1e12" emissiveIntensity={0.5} />
        </mesh>
      ))}
      {/* Pelindung lumpur */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 1.1, 0.75, -3.3]}>
          <boxGeometry args={[0.5, 0.6, 0.04]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      ))}
      {/* Roda: depan bisa berbelok, dua gandar belakang ganda */}
      {[-1.1, 1.1].map((x) => (
        <group key={x} ref={addSteer} position={[x, 0, 2.55]}>
          <Wheel x={0} z={0} side={Math.sign(x)} wheelRef={addWheel} />
        </group>
      ))}
      {[-1.4, -2.75].flatMap((z) => [-1.02, 1.02].map((x) => <Wheel key={`${x}:${z}`} x={x} z={z} dual wheelRef={addWheel} />))}
      {label && <Label position={[0, 4.6, 0]} className="is-red" distanceFactor={18}>{label}</Label>}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Kendaraan lalu lintas                                               */
/* ------------------------------------------------------------------ */

export type TrafficKind = "sedan" | "angkot" | "pickup" | "boxtruck" | "bus";

/** Setengah panjang & setengah lebar untuk tabrakan. */
export const TRAFFIC_SIZE: Record<TrafficKind, [number, number]> = {
  sedan: [2.2, 1.0],
  angkot: [2.2, 1.0],
  pickup: [2.5, 1.05],
  boxtruck: [3.0, 1.15],
  bus: [4.6, 1.25],
};

function SmallWheels({ z, x, addWheel, r = 0.38 }: { z: number[]; x: number; addWheel: (node: THREE.Group | null) => void; r?: number }) {
  return (
    <>
      {z.flatMap((zz) =>
        [-x, x].map((xx) => (
          <group key={`${xx}:${zz}`} position={[xx, r, zz]}>
            <group ref={addWheel}>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[r, r, 0.28, 12]} />
                <meshStandardMaterial color="#16171b" roughness={0.9} />
              </mesh>
              <mesh position={[Math.sign(xx) * 0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[r * 0.55, r * 0.55, 0.02, 10]} />
                <meshStandardMaterial color="#b9bec6" metalness={0.6} roughness={0.3} />
              </mesh>
            </group>
          </group>
        ))
      )}
    </>
  );
}

function Lights({ z, y, x, back }: { z: number; y: number; x: number; back: number }) {
  return (
    <>
      {[-x, x].map((xx) => (
        <mesh key={`f${xx}`} position={[xx, y, z]}>
          <boxGeometry args={[0.36, 0.16, 0.04]} />
          <meshStandardMaterial color="#fff6d8" emissive="#ffe8a8" emissiveIntensity={1} />
        </mesh>
      ))}
      {[-x, x].map((xx) => (
        <mesh key={`b${xx}`} position={[xx, y, back]}>
          <boxGeometry args={[0.3, 0.14, 0.04]} />
          <meshStandardMaterial color="#ff3b30" emissive="#ff1e12" emissiveIntensity={0.7} />
        </mesh>
      ))}
    </>
  );
}

export function TrafficCar({
  kind,
  color,
  trafficRef,
  index,
}: {
  kind: TrafficKind;
  color: string;
  trafficRef: RefObject<{ speed: number }[]>;
  index: number;
}) {
  const motion = useRef({ speed: 0, steer: 0, braking: false });
  useFrame(() => {
    motion.current.speed = trafficRef.current[index]?.speed ?? 0;
  });
  const { addWheel } = useVehicleAnimation(motion);
  const glass = <meshStandardMaterial color="#1d2e3a" metalness={0.4} roughness={0.15} />;
  const paint = <meshStandardMaterial color={color} roughness={0.4} metalness={0.2} />;

  if (kind === "sedan") {
    return (
      <group>
        <mesh position={[0, 0.72, 0]} castShadow>
          <boxGeometry args={[1.9, 0.62, 4.3]} />
          {paint}
        </mesh>
        <mesh position={[0, 1.28, -0.25]} castShadow>
          <boxGeometry args={[1.7, 0.55, 2.2]} />
          {paint}
        </mesh>
        <mesh position={[0, 1.28, -0.25]}>
          <boxGeometry args={[1.74, 0.42, 2.0]} />
          {glass}
        </mesh>
        <Lights z={2.16} y={0.8} x={0.66} back={-2.16} />
        <SmallWheels z={[1.35, -1.35]} x={0.9} addWheel={addWheel} />
      </group>
    );
  }
  if (kind === "angkot") {
    return (
      <group>
        <mesh position={[0, 1.2, -0.15]} castShadow>
          <boxGeometry args={[1.85, 1.55, 3.9]} />
          {paint}
        </mesh>
        <mesh position={[0, 0.78, 1.95]} castShadow>
          <boxGeometry args={[1.8, 0.7, 0.6]} />
          {paint}
        </mesh>
        <mesh position={[0, 1.5, -0.15]}>
          <boxGeometry args={[1.88, 0.5, 3.4]} />
          {glass}
        </mesh>
        <mesh position={[0, 1.5, 1.75]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[1.7, 0.6, 0.05]} />
          {glass}
        </mesh>
        <mesh position={[0, 0.95, -0.15]}>
          <boxGeometry args={[1.87, 0.12, 3.92]} />
          <meshStandardMaterial color="#fff4e0" />
        </mesh>
        <mesh position={[0, 2.03, -0.3]}>
          <boxGeometry args={[1.5, 0.08, 2.8]} />
          <meshStandardMaterial color="#2a2d33" />
        </mesh>
        <Lights z={2.26} y={0.85} x={0.66} back={-2.11} />
        <SmallWheels z={[1.3, -1.3]} x={0.88} addWheel={addWheel} />
      </group>
    );
  }
  if (kind === "pickup") {
    return (
      <group>
        <mesh position={[0, 0.72, 0]} castShadow>
          <boxGeometry args={[1.95, 0.6, 4.9]} />
          {paint}
        </mesh>
        <mesh position={[0, 1.4, 0.95]} castShadow>
          <boxGeometry args={[1.9, 0.8, 1.6]} />
          {paint}
        </mesh>
        <mesh position={[0, 1.45, 1.1]}>
          <boxGeometry args={[1.94, 0.5, 1.2]} />
          {glass}
        </mesh>
        {[-0.93, 0.93].map((x) => (
          <mesh key={x} position={[x, 1.2, -1.25]}>
            <boxGeometry args={[0.08, 0.4, 2.3]} />
            {paint}
          </mesh>
        ))}
        {[0, 1, 2].map((k) => (
          <mesh key={k} position={[(k - 1) * 0.55, 1.22, -1.3 + (k % 2) * 0.5]} castShadow>
            <boxGeometry args={[0.5, 0.35, 0.8]} />
            <meshStandardMaterial color="#e9e0cc" />
          </mesh>
        ))}
        <Lights z={2.46} y={0.8} x={0.7} back={-2.46} />
        <SmallWheels z={[1.6, -1.55]} x={0.92} addWheel={addWheel} r={0.42} />
      </group>
    );
  }
  if (kind === "bus") {
    return (
      <group>
        <mesh position={[0, 1.75, 0]} castShadow>
          <boxGeometry args={[2.5, 2.6, 9.2]} />
          {paint}
        </mesh>
        <mesh position={[0, 2.25, 0]}>
          <boxGeometry args={[2.54, 0.85, 8.4]} />
          {glass}
        </mesh>
        <mesh position={[0, 2.2, 4.61]}>
          <boxGeometry args={[2.2, 1.1, 0.04]} />
          {glass}
        </mesh>
        <mesh position={[0, 1.15, 0]}>
          <boxGeometry args={[2.53, 0.25, 9.22]} />
          <meshStandardMaterial color="#fff4e0" />
        </mesh>
        <Lights z={4.62} y={0.9} x={0.9} back={-4.62} />
        <SmallWheels z={[3.1, -2.6]} x={1.15} addWheel={addWheel} r={0.52} />
      </group>
    );
  }
  // boxtruck
  return (
    <group>
      <mesh position={[0, 1.35, 1.95]} castShadow>
        <boxGeometry args={[2.1, 1.5, 1.5]} />
        {paint}
      </mesh>
      <mesh position={[0, 1.6, 2.71]}>
        <boxGeometry args={[1.9, 0.6, 0.04]} />
        {glass}
      </mesh>
      <mesh position={[0, 1.75, -0.85]} castShadow>
        <boxGeometry args={[2.3, 2.3, 4.2]} />
        <meshStandardMaterial color="#f4f2ee" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.75, -0.85]}>
        <boxGeometry args={[2.32, 0.35, 4.22]} />
        {paint}
      </mesh>
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[1.4, 0.3, 5.9]} />
        <meshStandardMaterial color="#23262d" />
      </mesh>
      <Lights z={2.72} y={0.95} x={0.75} back={-2.97} />
      <SmallWheels z={[1.9, -1.9]} x={1.0} addWheel={addWheel} r={0.48} />
    </group>
  );
}
