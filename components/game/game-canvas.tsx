"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Float, Html, OrbitControls, RoundedBox, Sky } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import type { GameAvatarId, GameQuality, MissionId } from "@/lib/types";

export type CampusZone = MissionId | "info";

const ZONES: Array<{
  id: CampusZone;
  title: string;
  short: string;
  color: string;
  position: [number, number, number];
  building: [number, number, number];
}> = [
  {
    id: "it-audit",
    title: "Pusat Keamanan",
    short: "AUDIT TI",
    color: "#e54b4b",
    position: [-10, 0, -2.8],
    building: [-10, 0, -7],
  },
  {
    id: "enterprise-system",
    title: "Pusat Operasi",
    short: "ENTERPRISE",
    color: "#ffa987",
    position: [0, 0, -8.2],
    building: [0, 0, -12.4],
  },
  {
    id: "data-science",
    title: "Laboratorium Insight",
    short: "DATA SCIENCE",
    color: "#444140",
    position: [10, 0, -2.8],
    building: [10, 0, -7],
  },
  {
    id: "info",
    title: "Pusat Informasi",
    short: "INFO PRODI",
    color: "#e54b4b",
    position: [0, 0, 5],
    building: [0, 0, 9],
  },
];

const SPAWN: Record<"plaza" | CampusZone, [number, number, number]> = {
  plaza: [0, 0, 0],
  "it-audit": [-10, 0, 0.7],
  "enterprise-system": [0, 0, -5],
  "data-science": [10, 0, 0.7],
  info: [0, 0, 4],
};

const MOVEMENT_KEY_MAP: Record<string, string> = {
  KeyW: "w",
  KeyA: "a",
  KeyS: "s",
  KeyD: "d",
  ArrowUp: "arrowup",
  ArrowLeft: "arrowleft",
  ArrowDown: "arrowdown",
  ArrowRight: "arrowright",
};

const MOVEMENT_KEYS = new Set(["w", "a", "s", "d", "arrowup", "arrowleft", "arrowdown", "arrowright"]);

type MovementInput = {
  keys: { current: Record<string, boolean> };
};

function useMovementKeys() {
  const keys = useRef<Record<string, boolean>>({});
  const releaseTimers = useRef<Record<string, number>>({});

  useEffect(() => {
    const resolveKey = (event: KeyboardEvent) => MOVEMENT_KEY_MAP[event.code] ?? MOVEMENT_KEY_MAP[event.key] ?? event.key.toLowerCase();
    const down = (event: KeyboardEvent) => {
      const key = resolveKey(event);
      if (!MOVEMENT_KEYS.has(key)) return;
      event.preventDefault();
      window.clearTimeout(releaseTimers.current[key]);
      keys.current[key] = true;
    };
    const up = (event: KeyboardEvent) => {
      const key = resolveKey(event);
      if (!MOVEMENT_KEYS.has(key)) return;
      event.preventDefault();
      // Durasi minimum membuat satu ketukan tetap terlihat sebagai satu
      // langkah, sementara tombol yang ditahan memakai state yang sama tanpa
      // transisi atau reset animasi.
      releaseTimers.current[key] = window.setTimeout(() => {
        keys.current[key] = false;
      }, 170);
    };
    const reset = () => {
      keys.current = {};
      Object.values(releaseTimers.current).forEach(window.clearTimeout);
      releaseTimers.current = {};
    };

    // Berada di luar pohon WebGL supaya tetap aktif jika Canvas merender ulang.
    window.addEventListener("keydown", down, true);
    window.addEventListener("keyup", up, true);
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", reset);
    return () => {
      window.removeEventListener("keydown", down, true);
      window.removeEventListener("keyup", up, true);
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", reset);
      reset();
    };
  }, []);

  return { keys } satisfies MovementInput;
}

function isBlocked(x: number, z: number) {
  if (Math.abs(x) > 16.5 || z < -16.5 || z > 12.5) return true;
  const buildings = [
    { x: -10, z: -7, w: 7.4, d: 5.2 },
    { x: 0, z: -12.4, w: 8, d: 5.2 },
    { x: 10, z: -7, w: 7.4, d: 5.2 },
    { x: 0, z: 9, w: 8.5, d: 5 },
  ];
  return buildings.some(
    (box) => Math.abs(x - box.x) < box.w / 2 + 0.45 && Math.abs(z - box.z) < box.d / 2 + 0.45
  );
}

function Avatar({
  avatar,
  spawnZone,
  paused,
  input,
  onNearZone,
  onStep,
}: {
  avatar: GameAvatarId;
  spawnZone: "plaza" | CampusZone;
  paused: boolean;
  input: MovementInput;
  onNearZone: (zone: CampusZone | null) => void;
  onStep: () => void;
}) {
  const isNara = avatar === "nara";
  const group = useRef<THREE.Group>(null);
  const controls = useRef<OrbitControlsImpl>(null);
  const lastZone = useRef<CampusZone | null>(null);
  const walkTime = useRef(0);
  const { camera } = useThree();

  useEffect(() => {
    const [x, y, z] = SPAWN[spawnZone];
    group.current?.position.set(x, y, z);
    camera.position.set(x + 6.5, 7, z + 9);
    controls.current?.target.set(x, y + 1.25, z);
    controls.current?.update();
  }, [camera, spawnZone]);

  useFrame((_, delta) => {
    const player = group.current;
    if (!player) return;

    const target = player.position.clone().add(new THREE.Vector3(0, 1.25, 0));
    controls.current?.target.lerp(target, 0.18);
    controls.current?.update();

    if (!paused) {
      const heldHorizontal = Number(Boolean(input.keys.current.d || input.keys.current.arrowright)) - Number(Boolean(input.keys.current.a || input.keys.current.arrowleft));
      const heldVertical = Number(Boolean(input.keys.current.w || input.keys.current.arrowup)) - Number(Boolean(input.keys.current.s || input.keys.current.arrowdown));
      if (heldHorizontal || heldVertical) {
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
        const movement = forward.multiplyScalar(heldVertical).add(right.multiplyScalar(heldHorizontal)).normalize();
        const distance = delta * 5.5;
        const nextX = player.position.x + movement.x * distance;
        const nextZ = player.position.z + movement.z * distance;
        const canMoveX = !isBlocked(nextX, player.position.z);
        const canMoveZ = !isBlocked(player.position.x, nextZ);
        if (canMoveX) player.position.x = nextX;
        if (canMoveZ) player.position.z = nextZ;
        player.rotation.y = Math.atan2(movement.x, movement.z);
        walkTime.current += delta * 11;
        player.position.y = Math.abs(Math.sin(walkTime.current)) * 0.08;
        onStep();
      } else {
        player.position.y = THREE.MathUtils.lerp(player.position.y, 0, 0.2);
      }
    }

    let nearest: CampusZone | null = null;
    let distance = Infinity;
    ZONES.forEach((zone) => {
      const d = player.position.distanceTo(new THREE.Vector3(...zone.position));
      if (d < distance) {
        distance = d;
        nearest = zone.id;
      }
    });
    const nextZone = distance < 2.35 ? nearest : null;
    if (nextZone !== lastZone.current) {
      lastZone.current = nextZone;
      onNearZone(nextZone);
    }
  });

  return (
    <>
      <group ref={group}>
        <mesh castShadow position={[0, 1.25, 0]}>
          <capsuleGeometry args={[0.32, 0.72, 6, 12]} />
          <meshStandardMaterial color="#b92f43" roughness={0.72} />
        </mesh>
        <mesh castShadow position={[0, 2.05, 0]}>
          <sphereGeometry args={[0.34, 20, 20]} />
          <meshStandardMaterial color="#ffa987" roughness={0.75} />
        </mesh>
        <mesh castShadow position={[0, 2.18, -0.08]}>
          <sphereGeometry args={[isNara ? 0.37 : 0.35, 20, 10, 0, Math.PI * 2, 0, isNara ? Math.PI * 0.72 : Math.PI / 2]} />
          <meshStandardMaterial color="#1e1e24" />
        </mesh>
        {isNara && (
          <>
            <mesh castShadow position={[-0.29, 1.94, -0.04]} rotation={[0, 0, -0.1]}>
              <capsuleGeometry args={[0.11, 0.42, 5, 10]} />
              <meshStandardMaterial color="#1e1e24" roughness={0.7} />
            </mesh>
            <mesh castShadow position={[0.29, 1.94, -0.04]} rotation={[0, 0, 0.1]}>
              <capsuleGeometry args={[0.11, 0.42, 5, 10]} />
              <meshStandardMaterial color="#1e1e24" roughness={0.7} />
            </mesh>
          </>
        )}
        <RoundedBox castShadow position={[0, 1.36, -0.34]} args={[0.58, 0.76, 0.22]} radius={0.08}>
          <meshStandardMaterial color={isNara ? "#444140" : "#1e1e24"} />
        </RoundedBox>
      </group>
      <OrbitControls
        ref={controls}
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={5.5}
        maxDistance={12}
        minPolarAngle={0.55}
        maxPolarAngle={1.25}
      />
    </>
  );
}

function CampusBuilding({
  title,
  short,
  color,
  position,
  completed,
}: {
  title: string;
  short: string;
  color: string;
  position: [number, number, number];
  completed: boolean;
}) {
  return (
    <group position={position}>
      <RoundedBox receiveShadow castShadow position={[0, 1.8, 0]} args={[7, 3.6, 4.6]} radius={0.35} smoothness={4}>
        <meshStandardMaterial color="#f7ebe8" roughness={0.62} />
      </RoundedBox>
      <RoundedBox castShadow position={[0, 2.05, 2.2]} args={[4.8, 2.45, 0.28]} radius={0.12}>
        <meshStandardMaterial color={color} roughness={0.5} />
      </RoundedBox>
      <mesh castShadow position={[0, 0.85, 2.43]}>
        <boxGeometry args={[1.25, 1.7, 0.12]} />
        <meshStandardMaterial color="#1e1e24" metalness={0.15} />
      </mesh>
      <mesh position={[-2.15, 1.9, 2.42]}>
        <boxGeometry args={[1.2, 0.95, 0.08]} />
        <meshStandardMaterial color="#ffd1bf" emissive="#ffa987" emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[2.15, 1.9, 2.42]}>
        <boxGeometry args={[1.2, 0.95, 0.08]} />
        <meshStandardMaterial color="#ffd1bf" emissive="#ffa987" emissiveIntensity={0.18} />
      </mesh>
      <Html position={[0, 3.95, 2.1]} center distanceFactor={13} style={{ pointerEvents: "none" }}>
        <div className="game-world-label" style={{ borderColor: color }}>
          <span>{completed ? "✓ " : ""}{short}</span>
          <strong>{title}</strong>
        </div>
      </Html>
    </group>
  );
}

function InteractionBeacon({
  position,
  color,
  done,
}: {
  position: [number, number, number];
  color: string;
  done: boolean;
}) {
  return (
    <Float speed={2.2} rotationIntensity={0.25} floatIntensity={0.4}>
      <group position={[position[0], 1.05, position[2]]}>
        <mesh castShadow>
          <octahedronGeometry args={[0.48, 0]} />
          <meshStandardMaterial color={done ? "#ffa987" : color} emissive={done ? "#ffa987" : color} emissiveIntensity={0.45} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]}>
          <ringGeometry args={[0.62, 0.78, 32]} />
          <meshBasicMaterial color={done ? "#ffa987" : color} transparent opacity={0.72} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </Float>
  );
}

function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 0.65, 0]}>
        <cylinderGeometry args={[0.12, 0.16, 1.3, 8]} />
        <meshStandardMaterial color="#444140" />
      </mesh>
      <mesh castShadow position={[0, 1.65, 0]}>
        <icosahedronGeometry args={[0.72, 1]} />
        <meshStandardMaterial color="#e54b4b" roughness={0.8} />
      </mesh>
    </group>
  );
}

function CampusWorld({
  avatar,
  completed,
  paused,
  spawnZone,
  input,
  onNearZone,
  onStep,
}: {
  avatar: GameAvatarId;
  completed: MissionId[];
  paused: boolean;
  spawnZone: "plaza" | CampusZone;
  input: MovementInput;
  onNearZone: (zone: CampusZone | null) => void;
  onStep: () => void;
}) {
  const trees = useMemo(
    () => [
      [-15, 0, -1], [-14, 0, 7], [-8, 0, 7], [8, 0, 7], [14, 0, 7], [15, 0, -1],
      [-15, 0, -11], [15, 0, -11], [-6, 0, -15], [6, 0, -15],
    ] as [number, number, number][],
    []
  );

  return (
    <>
      <color attach="background" args={["#f7ebe8"]} />
      <fog attach="fog" args={["#f7ebe8", 28, 58]} />
      <Sky distance={450000} sunPosition={[50, 35, 20]} inclination={0.52} azimuth={0.2} />
      <hemisphereLight intensity={1.35} color="#ffffff" groundColor="#444140" />
      <directionalLight castShadow position={[10, 18, 8]} intensity={1.6} shadow-mapSize={[1024, 1024]} />

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, -2]}>
        <planeGeometry args={[38, 34]} />
        <meshStandardMaterial color="#f1dfda" roughness={0.92} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -2]}>
        <circleGeometry args={[5.1, 48]} />
        <meshStandardMaterial color="#fffdfc" roughness={0.9} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -4]}>
        <ringGeometry args={[4.15, 4.65, 48]} />
        <meshStandardMaterial color="#e54b4b" roughness={0.72} />
      </mesh>

      {ZONES.map((zone) => (
        <group key={zone.id}>
          <CampusBuilding
            title={zone.title}
            short={zone.short}
            color={zone.color}
            position={zone.building}
            completed={zone.id !== "info" && completed.includes(zone.id)}
          />
          <InteractionBeacon
            position={zone.position}
            color={zone.color}
            done={zone.id !== "info" && completed.includes(zone.id)}
          />
        </group>
      ))}

      {trees.map((position, index) => <Tree key={index} position={position} scale={0.85 + (index % 3) * 0.12} />)}
      <ContactShadows position={[0, 0.02, -2]} opacity={0.34} scale={38} blur={2.2} far={12} />
      <Avatar avatar={avatar} spawnZone={spawnZone} paused={paused} input={input} onNearZone={onNearZone} onStep={onStep} />
    </>
  );
}

function GameCanvas({
  avatar,
  completed,
  paused,
  spawnZone,
  quality,
  onNearZone,
  onStep,
}: {
  avatar: GameAvatarId;
  completed: MissionId[];
  paused: boolean;
  spawnZone: "plaza" | CampusZone;
  quality: GameQuality;
  onNearZone: (zone: CampusZone | null) => void;
  onStep: () => void;
}) {
  const input = useMovementKeys();
  const dpr: [number, number] = quality === "hemat" ? [1, 1] : quality === "tinggi" ? [1.25, 1.75] : [1, 1.5];
  return (
    <div className="game-canvas-focus">
      <Canvas
        shadows={quality !== "hemat" ? "percentage" : false}
        dpr={dpr}
        camera={{ position: [7, 7, 10], fov: 48, near: 0.1, far: 100 }}
        gl={{ antialias: quality !== "hemat", powerPreference: "high-performance" }}
      >
        <CampusWorld
          avatar={avatar}
          completed={completed}
          paused={paused}
          spawnZone={spawnZone}
          input={input}
          onNearZone={onNearZone}
          onStep={onStep}
        />
      </Canvas>
      <div className="game-keyboard-hint" aria-hidden="true"><kbd>WASD</kbd><span>Tekan untuk melangkah · tahan untuk berjalan</span></div>
    </div>
  );
}

export default memo(GameCanvas);
