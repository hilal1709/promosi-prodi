"use client";

import { useEffect, useMemo, useRef, type ReactNode, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cn } from "@/lib/utils";
import { clampDelta } from "../world-kit";

/* ------------------------------------------------------------------ */
/* Partikel ledakan & guncangan kamera                                 */
/* ------------------------------------------------------------------ */

export interface FxApi {
  burst: (x: number, y: number, z: number, color: string, count?: number, power?: number) => void;
  shake: (amount: number) => void;
}

const PARTICLES = 180;

type Particle = { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; max: number; spin: number };

/** Satu pool partikel instanced + guncangan kamera. Render SETELAH PlayerTruck agar guncangan menimpa posisi kamera. */
export function Effects({ apiRef }: { apiRef: RefObject<FxApi | null> }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const particles = useMemo<Particle[]>(() => Array.from({ length: PARTICLES }, () => ({ x: 0, y: -99, z: 0, vx: 0, vy: 0, vz: 0, life: 0, max: 1, spin: 0 })), []);
  const cursor = useRef(0);
  const shake = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const geometry = useMemo(() => new THREE.BoxGeometry(0.28, 0.28, 0.28), []);

  useEffect(() => {
    apiRef.current = {
      burst: (x, y, z, hex, count = 16, power = 7) => {
        const m = mesh.current;
        color.set(hex);
        for (let k = 0; k < count; k++) {
          const i = cursor.current;
          cursor.current = (cursor.current + 1) % PARTICLES;
          const p = particles[i];
          const a = Math.random() * Math.PI * 2;
          const up = 0.4 + Math.random() * 0.9;
          const sp = power * (0.4 + Math.random() * 0.8);
          Object.assign(p, { x, y, z, vx: Math.cos(a) * sp, vy: up * power, vz: Math.sin(a) * sp, life: 0.7 + Math.random() * 0.5, spin: Math.random() * 10 });
          p.max = p.life;
          m?.setColorAt(i, color);
        }
        if (m?.instanceColor) m.instanceColor.needsUpdate = true;
      },
      shake: (amount) => {
        shake.current = Math.max(shake.current, amount);
      },
    };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef, color, particles]);

  useFrame((state, raw) => {
    const delta = clampDelta(raw);
    const m = mesh.current;
    if (m) {
      particles.forEach((p, i) => {
        if (p.life > 0) {
          p.life -= delta;
          p.vy -= 18 * delta;
          p.x += p.vx * delta;
          p.y = Math.max(0.1, p.y + p.vy * delta);
          p.z += p.vz * delta;
        }
        dummy.position.set(p.x, p.life > 0 ? p.y : -99, p.z);
        dummy.rotation.set(p.spin * p.life, p.spin * p.life * 0.7, 0);
        dummy.scale.setScalar(p.life > 0 ? Math.max(0.05, p.life / p.max) * 1.2 : 0.0001);
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);
      });
      m.instanceMatrix.needsUpdate = true;
    }
    if (shake.current > 0.001) {
      const s = shake.current;
      state.camera.position.x += (Math.random() - 0.5) * s;
      state.camera.position.y += (Math.random() - 0.5) * s;
      state.camera.position.z += (Math.random() - 0.5) * s;
      shake.current = Math.max(0, s - delta * 2.2);
    }
  });

  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, PARTICLES]} frustumCulled={false}>
      <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.35} flatShading />
    </instancedMesh>
  );
}

/* ------------------------------------------------------------------ */
/* Model: drone bug, ramp, kerucut, tumpukan kertas, genangan error    */
/* ------------------------------------------------------------------ */

export function DroneModel() {
  const rotors = useRef<(THREE.Mesh | null)[]>([]);
  const eye = useRef<THREE.MeshStandardMaterial>(null);
  const clock = useRef(0);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    rotors.current.forEach((rotor) => rotor && (rotor.rotation.y += clampDelta(raw) * 40));
    if (eye.current) eye.current.emissiveIntensity = 1.2 + Math.sin(clock.current * 12) * 0.8;
  });
  return (
    <group>
      <mesh castShadow>
        <sphereGeometry args={[0.9, 14, 10]} />
        <meshStandardMaterial color="#d7263d" roughness={0.35} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.72]}>
        <sphereGeometry args={[0.32, 10, 8]} />
        <meshStandardMaterial ref={eye} color="#fff36b" emissive="#ffe94d" emissiveIntensity={1.5} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.35, 0.65, 0.55]} rotation={[0.4, 0, side * 0.5]}>
          <cylinderGeometry args={[0.03, 0.03, 0.7, 5]} />
          <meshStandardMaterial color="#1e1e24" />
        </mesh>
      ))}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], k) => (
        <group key={k} position={[x * 1.05, 0.25, z * 1.05]}>
          <mesh position={[-x * 0.5, 0, -z * 0.5]} rotation={[0, Math.atan2(x, z), 0]}>
            <boxGeometry args={[0.12, 0.1, 1.3]} />
            <meshStandardMaterial color="#2a2d33" />
          </mesh>
          <mesh ref={(node) => { rotors.current[k] = node; }} position={[0, 0.12, 0]}>
            <boxGeometry args={[1.3, 0.04, 0.16]} />
            <meshStandardMaterial color="#f4f1ea" transparent opacity={0.8} />
          </mesh>
        </group>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={`leg${side}`} position={[side * 0.4, -0.85, 0]} rotation={[0, 0, side * 0.3]}>
          <boxGeometry args={[0.08, 0.6, 0.08]} />
          <meshStandardMaterial color="#1e1e24" />
        </mesh>
      ))}
    </group>
  );
}

export const RAMP_LENGTH = 7;
export const RAMP_HEIGHT = 1.7;
export const RAMP_WIDTH = 5.4;

/** Ramp berbentuk baji; naik menuju +Z, titik asal di ujung bawah. */
export function RampModel() {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(RAMP_LENGTH, 0);
    shape.lineTo(RAMP_LENGTH, RAMP_HEIGHT);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: RAMP_WIDTH, bevelEnabled: false });
    // Bentuk dibuat di bidang XY; putar agar panjang = +Z dan lebar = X, berpusat di X=0.
    geo.rotateY(-Math.PI / 2);
    geo.translate(RAMP_WIDTH / 2, 0, 0);
    return geo;
  }, []);
  const slope = Math.atan2(RAMP_HEIGHT, RAMP_LENGTH);
  const slopeLength = Math.hypot(RAMP_HEIGHT, RAMP_LENGTH);
  return (
    <group>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color="#f2a93b" roughness={0.6} flatShading />
      </mesh>
      {[0.2, 0.45, 0.7].map((f) => (
        <mesh key={f} position={[0, RAMP_HEIGHT * f + 0.03, RAMP_LENGTH * f]} rotation={[-slope, 0, 0]}>
          <boxGeometry args={[RAMP_WIDTH + 0.02, 0.04, slopeLength * 0.1]} />
          <meshStandardMaterial color="#1e1e24" />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (RAMP_WIDTH / 2 + 0.25), 0.5, 0.2]}>
          <boxGeometry args={[0.18, 1, 0.18]} />
          <meshStandardMaterial color="#ffffff" emissive="#fff36b" emissiveIntensity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

export function ConeModel() {
  return (
    <group>
      <mesh position={[0, 0.06, 0]} castShadow>
        <boxGeometry args={[0.9, 0.12, 0.9]} />
        <meshStandardMaterial color="#1e1e24" />
      </mesh>
      <mesh position={[0, 0.65, 0]} castShadow>
        <coneGeometry args={[0.38, 1.2, 12]} />
        <meshStandardMaterial color="#ff7a1a" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.235, 0.29, 0.2, 12]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

export function PaperPile() {
  return (
    <group>
      {[0, 1, 2, 3, 4].map((k) => (
        <mesh key={k} position={[((k * 37) % 5) * 0.18 - 0.35, 0.2 + k * 0.3, ((k * 13) % 3) * 0.15 - 0.15]} rotation={[0, k * 0.45, 0]} castShadow>
          <boxGeometry args={[1.6, 0.28, 1.15]} />
          <meshStandardMaterial color={k % 2 ? "#fffdf5" : "#efe6cf"} />
        </mesh>
      ))}
      <mesh position={[0.3, 1.75, 0.1]} rotation={[0.2, 0.6, 0.1]}>
        <boxGeometry args={[0.9, 0.02, 1.2]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

export function PuddleModel({ radius = 2.1, phase = 0 }: { radius?: number; phase?: number }) {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const clock = useRef(phase);
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    if (mat.current) mat.current.emissiveIntensity = 0.55 + Math.sin(clock.current * 4) * 0.25;
  });
  return (
    <group>
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius, 20]} />
        <meshStandardMaterial ref={mat} color="#7b2cbf" emissive="#b14bff" emissiveIntensity={0.6} transparent opacity={0.85} roughness={0.1} polygonOffset polygonOffsetFactor={-8} polygonOffsetUnits={-8} />
      </mesh>
      {[0, 1, 2].map((k) => (
        <mesh key={k} position={[Math.cos(k * 2.1) * radius * 0.45, 0.12, Math.sin(k * 2.1) * radius * 0.45]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.32, 10]} />
          <meshBasicMaterial color="#e0aaff" />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Overlay DOM                                                         */
/* ------------------------------------------------------------------ */

export function Countdown({ count }: { count: number }) {
  if (count < 0) return null;
  return (
    <div key={count} className={cn("race-countdown", count === 0 && "is-go")}>
      {count === 0 ? "GO!" : count}
    </div>
  );
}

export function SpeedLines({ active }: { active: boolean }) {
  return <div className={cn("race-speedlines", active && "is-on")} aria-hidden />;
}

export function ScreenFlash({ flash }: { flash: { tone: "good" | "bad"; id: number } | null }) {
  if (!flash) return null;
  return <div key={flash.id} className={cn("race-flash", flash.tone === "bad" ? "is-bad" : "is-good")} aria-hidden />;
}

/** Posisinya diatur `useHudLayout` (world-kit) agar tidak menimpa HUD/minimap. */
export function HintCard({ children }: { children: ReactNode }) {
  return <div className="race-hint">{children}</div>;
}
