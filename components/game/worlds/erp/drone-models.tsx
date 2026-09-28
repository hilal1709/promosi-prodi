"use client";

import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DRONE_SITES } from "@/lib/data/worlds";
import { clampDelta, Label } from "../world-kit";
import { canvasTexture, fitText } from "./race-scenery";
import { HQ_TOWER, PAD_RADIUS, surfaceAt } from "./drone-layout";

/* ------------------------------------------------------------------ */
/* Model: drone, paket, beacon, cincin, bug, baterai, menara ERP       */
/* ------------------------------------------------------------------ */

export type DroneMotion = RefObject<{ speed: number; turbo: boolean; carrying: string | null; beam: number; stunned: boolean }>;

export const PACKET_COLOR = "#ffc857";

/** Tekstur ikon dokumen untuk sisi kubus paket data. */
function usePacketTexture(color: string) {
  return useMemo(
    () =>
      canvasTexture(128, 128, (g) => {
        g.fillStyle = color;
        g.fillRect(0, 0, 128, 128);
        g.strokeStyle = "rgba(0,0,0,.35)";
        g.lineWidth = 8;
        g.strokeRect(4, 4, 120, 120);
        g.fillStyle = "#fffdf5";
        g.fillRect(34, 24, 60, 80);
        g.fillStyle = "#1f3b63";
        [38, 52, 66, 80].forEach((y, k) => g.fillRect(42, y, k === 3 ? 28 : 44, 6));
      }),
    [color]
  );
}

export function DataPacket({ color = PACKET_COLOR, size = 1.3 }: { color?: string; size?: number }) {
  const map = usePacketTexture(color);
  return (
    <mesh castShadow>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial map={map} emissive={color} emissiveIntensity={0.25} roughness={0.5} />
    </mesh>
  );
}

/** Drone kargo quadcopter dengan rotor berputar, lampu navigasi, dan sinar tractor. */
export function CargoDrone({ motion }: { motion: DroneMotion }) {
  const rotors = useRef<(THREE.Group | null)[]>([]);
  const beam = useRef<THREE.Mesh>(null);
  const beamMat = useRef<THREE.MeshBasicMaterial>(null);
  const packet = useRef<THREE.Group>(null);
  const flame = useRef<THREE.Group>(null);
  const blink = useRef<THREE.MeshStandardMaterial>(null);
  const clock = useRef(0);
  useFrame((_, raw) => {
    const delta = clampDelta(raw);
    clock.current += delta;
    const m = motion.current;
    rotors.current.forEach((r, k) => {
      if (r) r.rotation.y += delta * (38 + m.speed * 1.2) * (k % 2 ? 1 : -1);
    });
    if (beam.current && beamMat.current) {
      beam.current.visible = m.beam > 0.02;
      beam.current.scale.set(1 + m.beam * 0.04, Math.max(0.01, m.beam), 1 + m.beam * 0.04);
      beam.current.position.y = -0.4 - m.beam / 2;
      beamMat.current.opacity = 0.28 * Math.min(1, m.beam) + Math.sin(clock.current * 20) * 0.04;
    }
    if (packet.current) {
      packet.current.visible = Boolean(m.carrying);
      packet.current.rotation.y += delta * 1.4;
    }
    if (flame.current) {
      flame.current.visible = m.turbo;
      flame.current.scale.setScalar(0.8 + Math.sin(clock.current * 40) * 0.2);
    }
    if (blink.current) blink.current.emissiveIntensity = m.stunned ? (Math.sin(clock.current * 30) > 0 ? 3 : 0) : Math.sin(clock.current * 5) > 0.6 ? 2.5 : 0.3;
  });
  const arm = useMemo(() => new THREE.BoxGeometry(0.22, 0.14, 2.6), []);
  return (
    <group>
      {/* Badan */}
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[1.5, 0.55, 2.1]} />
        <meshStandardMaterial color="#f26b3a" roughness={0.35} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.34, 0.1]} castShadow>
        <sphereGeometry args={[0.62, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#1d2e3a" roughness={0.1} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.02, 1.07]}>
        <boxGeometry args={[1.0, 0.2, 0.05]} />
        <meshStandardMaterial color="#bff3ff" emissive="#6fe3ff" emissiveIntensity={1.4} />
      </mesh>
      <mesh position={[0, -0.36, 0]}>
        <boxGeometry args={[1.1, 0.18, 1.3]} />
        <meshStandardMaterial color="#2b2f36" />
      </mesh>
      {/* Lengan & rotor */}
      {[Math.PI / 4, -Math.PI / 4].map((a) => (
        <mesh key={a} geometry={arm} rotation={[0, a, 0]} castShadow>
          <meshStandardMaterial color="#2b2f36" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
      {[
        [0.92, 0.92],
        [-0.92, 0.92],
        [0.92, -0.92],
        [-0.92, -0.92],
      ].map(([x, z], k) => (
        <group key={k} position={[x, 0.18, z]}>
          <mesh>
            <cylinderGeometry args={[0.14, 0.18, 0.3, 10]} />
            <meshStandardMaterial color="#16171b" />
          </mesh>
          <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.72, 0.05, 6, 24]} />
            <meshStandardMaterial color="#f26b3a" />
          </mesh>
          <group ref={(node) => { rotors.current[k] = node; }} position={[0, 0.18, 0]}>
            {[0, Math.PI / 2].map((r) => (
              <mesh key={r} rotation={[0, r, 0]}>
                <boxGeometry args={[1.3, 0.03, 0.14]} />
                <meshStandardMaterial color="#e8e6e0" transparent opacity={0.75} />
              </mesh>
            ))}
          </group>
          <mesh position={[0, -0.2, 0]}>
            <sphereGeometry args={[0.07, 8, 6]} />
            <meshStandardMaterial color={k < 2 ? "#ffffff" : x > 0 ? "#2fe06b" : "#ff3b30"} emissive={k < 2 ? "#ffffff" : x > 0 ? "#2fe06b" : "#ff3b30"} emissiveIntensity={1.8} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.34, -0.9]}>
        <sphereGeometry args={[0.09, 8, 6]} />
        <meshStandardMaterial ref={blink} color="#ff5a3c" emissive="#ff5a3c" emissiveIntensity={1} />
      </mesh>
      {/* Paket tergantung */}
      <group ref={packet} position={[0, -1.25, 0]}>
        <DataPacket size={1.05} />
        <mesh position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.5, 4]} />
          <meshBasicMaterial color="#2b2f36" />
        </mesh>
      </group>
      {/* Sinar tractor */}
      <mesh ref={beam} position={[0, -0.4, 0]} visible={false}>
        <cylinderGeometry args={[0.35, 3.2, 1, 20, 1, true]} />
        <meshBasicMaterial ref={beamMat} color="#8ff0ff" transparent opacity={0.25} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Api turbo */}
      <group ref={flame} position={[0, 0, -1.2]} visible={false}>
        {[-0.45, 0.45].map((x) => (
          <mesh key={x} position={[x, 0, -0.35]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.2, 0.9, 10]} />
            <meshBasicMaterial color="#7fe9ff" transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Tekstur papan nama situs. */
function siteSignTexture(name: string, divisi: string, color: string) {
  return canvasTexture(512, 160, (g) => {
    g.fillStyle = "#10131a";
    g.fillRect(0, 0, 512, 160);
    g.fillStyle = color;
    g.fillRect(0, 0, 18, 160);
    g.fillStyle = "#ffffff";
    fitText(g, name.toUpperCase(), 460, 56);
    g.textBaseline = "middle";
    g.fillText(name.toUpperCase(), 36, 58);
    g.fillStyle = "rgba(255,255,255,.7)";
    fitText(g, divisi, 460, 34, 700);
    g.fillText(divisi, 36, 116);
  });
}

export type BeaconMode = "idle" | "pickup" | "candidate" | "correct" | "wrong" | "home";

const BEACON_COLORS: Record<BeaconMode, string> = {
  idle: "#9aa6b2",
  pickup: "#ffc857",
  candidate: "#ffc857",
  correct: "#2fe06b",
  wrong: "#ff5a4f",
  home: "#ffc857",
};

/** Landasan divisi: pad bercahaya, papan nama, dan kolom cahaya bila aktif. */
export function SiteBeacon({ siteIndex, mode, label }: { siteIndex: number; mode: BeaconMode; label?: string }) {
  const site = DRONE_SITES[siteIndex];
  const y = surfaceAt(site.x, site.z);
  const sign = useMemo(() => siteSignTexture(site.nama, site.divisi, site.color), [site]);
  const ring = useRef<THREE.Mesh>(null);
  const column = useRef<THREE.MeshBasicMaterial>(null);
  const clock = useRef(siteIndex * 1.7);
  const active = mode !== "idle";
  const color = active ? BEACON_COLORS[mode] : site.color;
  useFrame((_, raw) => {
    clock.current += clampDelta(raw);
    if (ring.current) {
      ring.current.rotation.z += clampDelta(raw) * 0.8;
      const s = 1 + Math.sin(clock.current * 3) * (active ? 0.08 : 0.02);
      ring.current.scale.set(s, s, 1);
    }
    if (column.current) column.current.opacity = 0.16 + Math.sin(clock.current * 4) * 0.05;
  });
  return (
    <group position={[site.x, y, site.z]}>
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <cylinderGeometry args={[PAD_RADIUS, PAD_RADIUS + 0.4, 0.24, 40]} />
        <meshStandardMaterial color="#2b2f36" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.26, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[PAD_RADIUS - 1.1, PAD_RADIUS - 0.5, 40]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={active ? 1.4 : 0.35} />
      </mesh>
      <mesh position={[0, 0.26, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.2, 5]} />
        <meshStandardMaterial color="#f4f1ea" />
      </mesh>
      <mesh position={[0, 0.26, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[1.2, 5]} />
        <meshStandardMaterial color="#f4f1ea" />
      </mesh>
      <mesh ref={ring} position={[0, 3.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[PAD_RADIUS - 0.6, 0.14, 6, 40]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.9 : 0.25} />
      </mesh>
      <mesh position={[0, 60, 0]} visible={active}>
        <cylinderGeometry args={[2.4, PAD_RADIUS - 0.8, 120, 24, 1, true]} />
        <meshBasicMaterial ref={column} color={color} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} fog={false} />
      </mesh>
      {/* Papan nama */}
      <group position={[PAD_RADIUS + 2.4, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        {[-1.6, 1.6].map((x) => (
          <mesh key={x} position={[x, 1.6, 0]} castShadow>
            <boxGeometry args={[0.18, 3.2, 0.18]} />
            <meshStandardMaterial color="#5c6470" />
          </mesh>
        ))}
        <mesh position={[0, 3.2, 0]} castShadow>
          <boxGeometry args={[5.2, 1.7, 0.16]} />
          <meshStandardMaterial color="#10131a" />
        </mesh>
        {[0.09, -0.09].map((z) => (
          <mesh key={z} position={[0, 3.2, z]} rotation={[0, z > 0 ? 0 : Math.PI, 0]}>
            <planeGeometry args={[5, 1.56]} />
            <meshStandardMaterial map={sign} emissive="#ffffff" emissiveMap={sign} emissiveIntensity={0.35} />
          </mesh>
        ))}
      </group>
      {label && (
        <Label position={[0, 9, 0]} className={mode === "correct" ? "is-green" : mode === "wrong" ? "is-red" : "is-gold"} fixed>
          {label}
        </Label>
      )}
    </group>
  );
}

/** Cincin sinkron di udara. */
export function SyncRing({ taken, phase = 0 }: { taken: boolean; phase?: number }) {
  const group = useRef<THREE.Group>(null);
  const clock = useRef(phase);
  useFrame((_, raw) => {
    const delta = clampDelta(raw);
    clock.current += delta;
    const g = group.current;
    if (!g) return;
    const target = taken ? 0.001 : 1 + Math.sin(clock.current * 3) * 0.05;
    const s = THREE.MathUtils.damp(g.scale.x, target, taken ? 6 : 10, delta);
    g.scale.setScalar(s);
    g.visible = s > 0.02;
    g.rotation.z += delta * 0.6;
  });
  return (
    <group ref={group}>
      <mesh>
        <torusGeometry args={[3.4, 0.28, 8, 36]} />
        <meshStandardMaterial color="#3fd0ff" emissive="#3fd0ff" emissiveIntensity={1.3} />
      </mesh>
      {[0, 1, 2, 3].map((k) => (
        <mesh key={k} rotation={[0, 0, (k * Math.PI) / 2]} position={[Math.cos((k * Math.PI) / 2) * 3.4, Math.sin((k * Math.PI) / 2) * 3.4, 0]}>
          <boxGeometry args={[0.7, 0.7, 0.7]} />
          <meshStandardMaterial color="#ffffff" emissive="#bff3ff" emissiveIntensity={1.2} />
        </mesh>
      ))}
      <mesh>
        <circleGeometry args={[3.2, 32]} />
        <meshBasicMaterial color="#3fd0ff" transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** Drone bug "Data Silo": bola merah bergerigi dengan mata berkedip. */
export function BugDrone({ chasing, phase = 0 }: { chasing: boolean; phase?: number }) {
  const spin = useRef<THREE.Group>(null);
  const eye = useRef<THREE.MeshStandardMaterial>(null);
  const clock = useRef(phase);
  useFrame((_, raw) => {
    const delta = clampDelta(raw);
    clock.current += delta;
    if (spin.current) {
      spin.current.rotation.y += delta * (chasing ? 6 : 2);
      spin.current.rotation.x = Math.sin(clock.current * 2) * 0.3;
    }
    if (eye.current) eye.current.emissiveIntensity = chasing ? 2.5 + Math.sin(clock.current * 25) : 1.2;
  });
  return (
    <group>
      <group ref={spin}>
        <mesh castShadow>
          <icosahedronGeometry args={[1.1, 0]} />
          <meshStandardMaterial color="#b3261e" roughness={0.4} metalness={0.4} flatShading />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((k) => {
          const a = (k / 6) * Math.PI * 2;
          return (
            <mesh key={k} position={[Math.cos(a) * 1.1, (k % 2 ? 0.4 : -0.4), Math.sin(a) * 1.1]} rotation={[0, -a, Math.PI / 2]}>
              <coneGeometry args={[0.22, 0.8, 5]} />
              <meshStandardMaterial color="#2b2f36" />
            </mesh>
          );
        })}
      </group>
      <mesh position={[0, 0.1, 0.95]}>
        <sphereGeometry args={[0.32, 12, 8]} />
        <meshStandardMaterial ref={eye} color="#ff3b30" emissive="#ff1e12" emissiveIntensity={1.2} />
      </mesh>
      <Label position={[0, 2.3, 0]} className="is-red" distanceFactor={26}>Data Silo</Label>
    </group>
  );
}

/** Sel baterai melayang. */
export function BatteryCell({ taken, phase = 0 }: { taken: boolean; phase?: number }) {
  const group = useRef<THREE.Group>(null);
  const clock = useRef(phase);
  useFrame((_, raw) => {
    const delta = clampDelta(raw);
    clock.current += delta;
    const g = group.current;
    if (!g) return;
    g.visible = !taken;
    g.rotation.y += delta * 1.5;
    g.position.y = Math.sin(clock.current * 2) * 0.4;
  });
  return (
    <group ref={group}>
      <mesh castShadow>
        <cylinderGeometry args={[0.7, 0.7, 1.8, 16]} />
        <meshStandardMaterial color="#2fe06b" emissive="#2fe06b" emissiveIntensity={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.3, 12]} />
        <meshStandardMaterial color="#d8dde3" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0.71]}>
        <boxGeometry args={[0.18, 0.8, 0.02]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.4, 0.06, 6, 28]} />
        <meshBasicMaterial color="#8dffb0" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

/* --------------------------- menara Pusat Operasi --------------------------- */

/** Menara kaca Pusat Operasi dengan globe hologram ERP di puncaknya. */
export function OpsTower({ live }: { live: boolean }) {
  const globe = useRef<THREE.Group>(null);
  const halo = useRef<THREE.MeshBasicMaterial>(null);
  const clock = useRef(0);
  const { w, h } = HQ_TOWER;
  const glass = useMemo(
    () =>
      canvasTexture(256, 512, (g) => {
        g.fillStyle = "#2c4d6b";
        g.fillRect(0, 0, 256, 512);
        for (let y = 0; y < 512; y += 16) {
          for (let x = 0; x < 256; x += 32) {
            const lit = Math.sin(x * 12.9 + y * 78.2) * 43758.5 % 1;
            g.fillStyle = Math.abs(lit) > 0.55 ? "#9fd6f2" : "#3c6d91";
            g.fillRect(x + 3, y + 3, 26, 10);
          }
        }
      }),
    []
  );
  const sign = useMemo(
    () =>
      canvasTexture(512, 128, (g) => {
        g.fillStyle = "#10131a";
        g.fillRect(0, 0, 512, 128);
        g.fillStyle = "#ffc857";
        fitText(g, "PUSAT OPERASI ERP", 480, 64);
        g.textBaseline = "middle";
        g.textAlign = "center";
        g.fillText("PUSAT OPERASI ERP", 256, 66);
      }),
    []
  );
  useFrame((_, raw) => {
    const delta = clampDelta(raw);
    clock.current += delta;
    if (globe.current) globe.current.rotation.y += delta * (live ? 1.6 : 0.5);
    if (halo.current) halo.current.opacity = (live ? 0.5 : 0.18) + Math.sin(clock.current * 3) * 0.06;
  });
  const y0 = surfaceAt(HQ_TOWER.x, HQ_TOWER.z);
  return (
    <group position={[HQ_TOWER.x, y0, HQ_TOWER.z]}>
      <mesh position={[0, 3, 0]} castShadow receiveShadow>
        <boxGeometry args={[w + 8, 6, w + 8]} />
        <meshStandardMaterial color="#e4ddd0" roughness={0.8} />
      </mesh>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, w]} />
        <meshStandardMaterial map={glass} roughness={0.15} metalness={0.5} emissive="#6fb8e0" emissiveMap={glass} emissiveIntensity={0.25} />
      </mesh>
      {[0.25, 0.5, 0.75].map((f) => (
        <mesh key={f} position={[0, h * f, 0]}>
          <boxGeometry args={[w + 0.6, 0.6, w + 0.6]} />
          <meshStandardMaterial color="#f4f1ea" />
        </mesh>
      ))}
      <mesh position={[0, h + 1.5, 0]} castShadow>
        <cylinderGeometry args={[w * 0.55, w * 0.62, 3, 24]} />
        <meshStandardMaterial color="#f4f1ea" />
      </mesh>
      {[1, -1].map((side) => (
        <mesh key={side} position={[0, 7.2, side * (w / 2 + 0.05)]} rotation={[0, side > 0 ? 0 : Math.PI, 0]}>
          <planeGeometry args={[w * 0.9, 2.3]} />
          <meshStandardMaterial map={sign} emissive="#ffc857" emissiveMap={sign} emissiveIntensity={0.6} />
        </mesh>
      ))}
      <group ref={globe} position={[0, h + 9, 0]}>
        <mesh>
          <icosahedronGeometry args={[5, 2]} />
          <meshBasicMaterial color="#6fe3ff" wireframe transparent opacity={0.75} />
        </mesh>
        <mesh>
          <sphereGeometry args={[3.6, 20, 14]} />
          <meshStandardMaterial color="#1f6f9c" emissive="#3fd0ff" emissiveIntensity={live ? 1.4 : 0.6} transparent opacity={0.85} />
        </mesh>
        {[0, 1].map((k) => (
          <mesh key={k} rotation={[Math.PI / 2 + k * 0.6, k * 0.8, 0]}>
            <torusGeometry args={[6.4, 0.1, 6, 48]} />
            <meshBasicMaterial color={k ? "#ffc857" : "#6fe3ff"} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, h + 9, 0]}>
        <sphereGeometry args={[8, 20, 14]} />
        <meshBasicMaterial ref={halo} color="#6fe3ff" transparent opacity={0.2} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh position={[w / 2 - 1, h + 8, w / 2 - 1]}>
        <cylinderGeometry args={[0.08, 0.08, 14, 5]} />
        <meshStandardMaterial color="#b9bec6" />
      </mesh>
      <pointLight position={[0, h + 9, 0]} color="#6fe3ff" intensity={live ? 800 : 200} distance={60} />
    </group>
  );
}

/* --------------------------- Go-Live: busur & kembang api --------------------------- */

const ARC_COLORS = ["#3fa7ff", "#2fae66", "#f2a93b", "#e5664b", "#8e7cf0", "#ff8fb1", "#4fd1c5"];

/** Busur cahaya dari puncak menara ke setiap divisi, tumbuh perlahan. */
export function GoLiveArcs({ progress }: { progress: RefObject<number> }) {
  const tubes = useMemo(() => {
    const top = new THREE.Vector3(HQ_TOWER.x, surfaceAt(HQ_TOWER.x, HQ_TOWER.z) + HQ_TOWER.h + 9, HQ_TOWER.z);
    return DRONE_SITES.filter((site) => site.id !== "hq").map((site, k) => {
      const end = new THREE.Vector3(site.x, surfaceAt(site.x, site.z) + 1, site.z);
      const mid = top.clone().lerp(end, 0.5);
      mid.y += 40 + top.distanceTo(end) * 0.18;
      const curve = new THREE.QuadraticBezierCurve3(top, mid, end);
      const geometry = new THREE.TubeGeometry(curve, 60, 0.45, 6, false);
      return { geometry, color: ARC_COLORS[k % ARC_COLORS.length], total: geometry.index!.count };
    });
  }, []);
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(() => {
    const p = progress.current;
    tubes.forEach((tube, k) => {
      const mesh = meshes.current[k];
      if (!mesh) return;
      const local = THREE.MathUtils.clamp(p * 1.6 - k * 0.08, 0, 1);
      mesh.visible = local > 0;
      const count = Math.floor((local * tube.total) / 3) * 3;
      mesh.geometry.setDrawRange(0, count);
    });
  });
  return (
    <group>
      {tubes.map((tube, k) => (
        <mesh key={k} ref={(node) => { meshes.current[k] = node; }} geometry={tube.geometry} visible={false}>
          <meshBasicMaterial color={tube.color} fog={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/** Kembang api instanced di atas menara saat Go-Live. */
export function Fireworks({ active, center }: { active: boolean; center: [number, number, number] }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const count = 240;
  const bursts = useRef<{ t: number; x: number; y: number; z: number; color: THREE.Color }[]>([]);
  const dirs = useMemo(() => {
    const list: THREE.Vector3[] = [];
    for (let i = 0; i < 40; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / 40);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      list.push(new THREE.Vector3(Math.cos(theta) * Math.sin(phi), Math.cos(phi), Math.sin(theta) * Math.sin(phi)));
    }
    return list;
  }, []);
  const o = useMemo(() => new THREE.Object3D(), []);
  const next = useRef(0);
  const palette = useMemo(() => ["#ffc857", "#3fd0ff", "#ff8fb1", "#2fe06b", "#ffffff", "#f26b3a"].map((c) => new THREE.Color(c)), []);
  useFrame((_, raw) => {
    const m = mesh.current;
    if (!m) return;
    const delta = clampDelta(raw);
    next.current -= delta;
    if (active && next.current <= 0) {
      next.current = 0.35 + Math.random() * 0.3;
      bursts.current.push({
        t: 0,
        x: center[0] + (Math.random() - 0.5) * 60,
        y: center[1] + 10 + Math.random() * 30,
        z: center[2] + (Math.random() - 0.5) * 60,
        color: palette[Math.floor(Math.random() * palette.length)],
      });
      if (bursts.current.length > count / dirs.length) bursts.current.shift();
    }
    let i = 0;
    bursts.current.forEach((b) => {
      b.t += delta;
      const r = 14 * (1 - Math.exp(-b.t * 2.5));
      const s = Math.max(0, 1 - b.t / 2.2) * 0.9;
      dirs.forEach((d) => {
        if (i >= count) return;
        o.position.set(b.x + d.x * r, b.y + d.y * r - b.t * b.t * 2.5, b.z + d.z * r);
        o.scale.setScalar(s);
        o.updateMatrix();
        m.setMatrixAt(i, o.matrix);
        m.setColorAt(i, b.color);
        i++;
      });
    });
    for (; i < count; i++) {
      o.scale.setScalar(0);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh
      ref={(node) => {
        mesh.current = node;
        if (node && !node.instanceColor) {
          const white = new THREE.Color("#ffffff");
          for (let i = 0; i < count; i++) {
            node.setMatrixAt(i, new THREE.Matrix4().makeScale(0, 0, 0));
            node.setColorAt(i, white);
          }
        }
      }}
      args={[undefined, undefined, count]}
      frustumCulled={false}
    >
      <sphereGeometry args={[0.5, 6, 4]} />
      <meshBasicMaterial color="#ffffff" toneMapped={false} fog={false} />
    </instancedMesh>
  );
}
