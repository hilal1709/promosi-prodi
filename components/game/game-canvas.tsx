"use client";

import { memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Float, OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import CharacterModel, { type CharacterMotion } from "@/components/game/character-model";
import { CampusBuilding, type BuildingStyle } from "@/components/game/campus-building";
import { CampusSurroundings, Tree, type TreeKind } from "@/components/game/campus-scenery";
import { canvasSettings, QualityRig } from "@/components/game/lite-renderer";
import { ResponsiveCamera } from "@/components/game/responsive-camera";
import { SceneLoader, SceneReady } from "@/components/game/scene-loader";
import { TouchControls } from "@/components/game/worlds/touch-controls";
import { createInputState, type WorldInput } from "@/components/game/worlds/world-controls";
import { qualityProfile } from "@/lib/device-quality";
import type { GameAvatarId, GameQuality, MissionId } from "@/lib/types";

export type CampusZone = MissionId | "info";

const ZONES: Array<{
  id: CampusZone;
  title: string;
  short: string;
  color: string;
  position: [number, number, number];
  building: [number, number, number];
  style: BuildingStyle;
}> = [
  {
    id: "it-audit",
    title: "Pusat Keamanan",
    short: "AUDIT TI",
    color: "#e54b4b",
    position: [-10, 0, -2.8],
    building: [-10, 0, -7],
    style: { floors: 3, wall: "#b9714f", trim: "#eadfcb", facade: "windows", roof: "flat", roofColor: "#5b5f66" },
  },
  {
    id: "enterprise-system",
    title: "Pusat Operasi",
    short: "ENTERPRISE",
    color: "#ffa987",
    position: [0, 0, -8.2],
    building: [0, 0, -12.4],
    style: { floors: 4, wall: "#7d95a3", trim: "#e3e6e8", facade: "glass", roof: "flat", roofColor: "#4f5660" },
  },
  {
    id: "data-science",
    title: "Laboratorium Insight",
    short: "DATA SCIENCE",
    color: "#444140",
    position: [10, 0, -2.8],
    building: [10, 0, -7],
    style: { floors: 3, wall: "#d4a35a", trim: "#f1e6cf", facade: "windows", roof: "flat", roofColor: "#6b5a48" },
  },
  {
    id: "info",
    title: "Pusat Informasi",
    short: "INFO PRODI",
    color: "#e54b4b",
    position: [0, 0, 5],
    building: [0, 0, 9],
    style: { floors: 2, wall: "#c4674f", trim: "#f0e2cc", facade: "windows", roof: "gable", roofColor: "#8c3b2e" },
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
  /** Joystick sentuh (x = kanan, y = maju), ditulis oleh TouchControls. */
  touch: WorldInput;
};

function useMovementKeys() {
  const keys = useRef<Record<string, boolean>>({});
  const touch = useRef(createInputState());
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

  return { keys, touch } satisfies MovementInput;
}

const TREES: Array<{ position: [number, number, number]; kind: TreeKind; scale: number }> = [
  { position: [-15, 0, -1], kind: "round", scale: 1.05 },
  { position: [-14, 0, 7], kind: "blossom", scale: 1 },
  { position: [-8, 0, 7], kind: "pine", scale: 1.1 },
  { position: [8, 0, 7], kind: "round", scale: 0.95 },
  { position: [14, 0, 7], kind: "autumn", scale: 1.05 },
  { position: [15, 0, -1], kind: "pine", scale: 1.2 },
  { position: [-15, 0, -11], kind: "cypress", scale: 1.1 },
  { position: [15, 0, -11], kind: "cypress", scale: 1 },
  { position: [-6, 0, -15], kind: "blossom", scale: 0.95 },
  { position: [6, 0, -15], kind: "autumn", scale: 1 },
  { position: [-6.5, 0, 11], kind: "round", scale: 1.1 },
  { position: [6.5, 0, 11], kind: "blossom", scale: 1.05 },
  { position: [-13, 0, 11], kind: "pine", scale: 0.95 },
  { position: [13, 0, 11], kind: "round", scale: 1 },
  { position: [-15.5, 0, -15.5], kind: "pine", scale: 1.15 },
  { position: [15.5, 0, -15.5], kind: "round", scale: 1.1 },
  { position: [-4.8, 0, 5.4], kind: "palm", scale: 1 },
  { position: [4.8, 0, 5.4], kind: "palm", scale: 1.05 },
  { position: [-2.6, 0, -8.6], kind: "palm", scale: 1.1 },
  { position: [2.6, 0, -8.6], kind: "palm", scale: 0.95 },
];

const FLOWERS: [number, number, number][] = [
  [-5.8, 0, 1.5], [5.8, 0, 1.5], [-6.6, 0, -1], [6.6, 0, -1],
  [-5.2, 0, 6], [5.2, 0, 6], [-13, 0, 3], [13, 0, 3], [-4.5, 0, -12], [4.5, 0, -12],
];

// Batang pohon dan semak ikut diperlakukan sebagai penghalang berbentuk lingkaran.
const ROUND_OBSTACLES = [
  ...TREES.map(({ position: [x, , z] }) => ({ x, z, r: 0.5 })),
  ...FLOWERS.map(([x, , z]) => ({ x, z, r: 0.45 })),
];

// h = tinggi gedung termasuk atap, dipakai untuk tabrakan kamera.
const BUILDING_BOXES = [
  { x: -10, z: -7, w: 7.4, d: 5.2, h: 5.4 },
  { x: 0, z: -12.4, w: 8, d: 5.2, h: 6.8 },
  { x: 10, z: -7, w: 7.4, d: 5.2, h: 5.4 },
  { x: 0, z: 9, w: 8.5, d: 5, h: 5 },
];

function isBlocked(x: number, z: number) {
  if (Math.abs(x) > 16.5 || z < -16.5 || z > 12.5) return true;
  if (ROUND_OBSTACLES.some((o) => Math.hypot(x - o.x, z - o.z) < o.r + 0.3)) return true;
  return BUILDING_BOXES.some(
    (box) => Math.abs(x - box.x) < box.w / 2 + 0.45 && Math.abs(z - box.z) < box.d / 2 + 0.45
  );
}

const CAMERA_STEP = 0.15;
const CAMERA_MIN_DISTANCE = 1.6;

// Jarak terjauh kamera dari target sebelum menembus gedung atau tanah.
function cameraClearance(target: THREE.Vector3, direction: THREE.Vector3, maxDistance: number) {
  const point = new THREE.Vector3();
  for (let t = CAMERA_STEP; t <= maxDistance; t += CAMERA_STEP) {
    point.copy(direction).multiplyScalar(t).add(target);
    const hitsGround = point.y < 0.35;
    const hitsBuilding = BUILDING_BOXES.some(
      (box) =>
        point.y < box.h + 0.3 &&
        Math.abs(point.x - box.x) < box.w / 2 + 0.3 &&
        Math.abs(point.z - box.z) < box.d / 2 + 0.3
    );
    if (hitsGround || hitsBuilding) return Math.max(CAMERA_MIN_DISTANCE, t - 0.3);
  }
  return maxDistance;
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
  const group = useRef<THREE.Group>(null);
  const controls = useRef<OrbitControlsImpl>(null);
  const lastZone = useRef<CampusZone | null>(null);
  const motion = useRef<CharacterMotion>({ phase: 0, moving: false });
  // Jarak zoom pilihan pemain; kamera hanya ditarik maju sementara saat
  // terhalang, lalu dikembalikan ke jarak ini sebelum OrbitControls update.
  const desiredDistance = useRef<number | null>(null);
  const { camera } = useThree();

  useEffect(() => {
    const [x, y, z] = SPAWN[spawnZone];
    group.current?.position.set(x, y, z);
    camera.position.set(x + 1.2, y + 4.4, z + 6);
    desiredDistance.current = null;
    controls.current?.target.set(x, y + 1.25, z);
    controls.current?.update();
  }, [camera, spawnZone]);

  useFrame((_, delta) => {
    const player = group.current;
    if (!player) return;

    const target = player.position.clone().add(new THREE.Vector3(0, 1.25, 0));
    if (controls.current) {
      const follow = target.sub(controls.current.target).multiplyScalar(0.18);
      camera.position.add(follow);
      controls.current.target.add(follow);

      const orbit = controls.current;
      const offset = camera.position.clone().sub(orbit.target);
      if (desiredDistance.current !== null) {
        camera.position.copy(orbit.target).add(offset.setLength(desiredDistance.current));
      }
      orbit.update();
      offset.copy(camera.position).sub(orbit.target);
      desiredDistance.current = offset.length();
      const allowed = cameraClearance(orbit.target, offset.clone().normalize(), desiredDistance.current);
      if (allowed < desiredDistance.current) {
        camera.position.copy(orbit.target).add(offset.setLength(allowed));
      }
    }

    if (!paused) {
      const heldHorizontal = Number(Boolean(input.keys.current.d || input.keys.current.arrowright)) - Number(Boolean(input.keys.current.a || input.keys.current.arrowleft));
      const heldVertical = Number(Boolean(input.keys.current.w || input.keys.current.arrowup)) - Number(Boolean(input.keys.current.s || input.keys.current.arrowdown));
      const stick = input.touch.current.stick;
      const moveX = heldHorizontal + stick.x;
      const moveY = heldVertical + stick.y;
      // Joystick bersifat analog: dorongan kecil berjalan pelan, penuh berjalan normal.
      const strength = Math.min(1, Math.hypot(moveX, moveY));
      if (strength > 0.12) {
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
        const movement = forward.multiplyScalar(moveY).add(right.multiplyScalar(moveX)).normalize();
        const distance = delta * 3.2 * strength;
        const nextX = player.position.x + movement.x * distance;
        const nextZ = player.position.z + movement.z * distance;
        const canMoveX = !isBlocked(nextX, player.position.z);
        const canMoveZ = !isBlocked(player.position.x, nextZ);
        if (canMoveX) player.position.x = nextX;
        if (canMoveZ) player.position.z = nextZ;
        player.rotation.y = Math.atan2(movement.x, movement.z);
        motion.current.phase += delta * 6.4 * Math.max(0.5, strength);
        motion.current.moving = true;
        onStep();
      } else {
        motion.current.moving = false;
      }
    } else {
      motion.current.moving = false;
    }
    // The character's feet define its origin; bobbing this group lifts both
    // feet at once and reads as floating instead of a grounded walk.
    player.position.y = 0;

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
        <CharacterModel avatar={avatar} motion={motion} />
      </group>
      <OrbitControls
        ref={controls}
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={3.4}
        maxDistance={12}
        minPolarAngle={0.55}
        // Sedikit melewati horizontal (π/2) agar pemain bisa mendongak melihat
        // langit dan gedung; pada jarak maksimum kamera tetap di atas tanah.
        maxPolarAngle={1.62}
      />
    </>
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

const SKY_TOP = "#3f8fdc";
const SKY_HORIZON = "#b9dcf2";

// Kubah langit bergradien. Radiusnya dijaga di bawah `far` kamera (100) agar
// tidak terpotong, dan tidak terkena fog supaya warnanya tetap biru.
function SkyDome() {
  const geometry = useMemo(() => {
    const sphere = new THREE.SphereGeometry(72, 32, 16);
    const top = new THREE.Color(SKY_TOP);
    const horizon = new THREE.Color(SKY_HORIZON);
    const color = new THREE.Color();
    const positions = sphere.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    for (let i = 0; i < positions.count; i++) {
      const t = Math.min(1, Math.max(0, positions.getY(i) / 72) * 1.6);
      color.copy(horizon).lerp(top, Math.pow(t, 0.8));
      color.toArray(colors, i * 3);
    }
    sphere.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return sphere;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry} renderOrder={-1}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

const FLOWER_COLORS = ["#f28ca0", "#ffd166", "#b388eb"];

function Path({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
  const dx = to[0] - from[0];
  const dz = to[2] - from[2];
  const length = Math.hypot(dx, dz);
  return (
    <mesh
      receiveShadow
      rotation={[-Math.PI / 2, 0, Math.atan2(dx, dz)]}
      position={[(from[0] + to[0]) / 2, 0.012, (from[2] + to[2]) / 2]}
    >
      <planeGeometry args={[1.6, length]} />
      <meshStandardMaterial color="#c9a676" roughness={0.95} />
    </mesh>
  );
}

function CampusWorld({
  avatar,
  completed,
  paused,
  spawnZone,
  quality,
  input,
  onNearZone,
  onStep,
}: {
  avatar: GameAvatarId;
  quality: GameQuality;
  completed: MissionId[];
  paused: boolean;
  spawnZone: "plaza" | CampusZone;
  input: MovementInput;
  onNearZone: (zone: CampusZone | null) => void;
  onStep: () => void;
}) {
  // Mode hemat: separuh dekorasi saja (tabrakan tetap memakai daftar lengkap).
  const lite = quality === "hemat";
  const flowers = lite ? FLOWERS.filter((_, index) => index % 2 === 0) : FLOWERS;
  const trees = lite ? TREES.filter((_, index) => index % 2 === 0) : TREES;
  return (
    <>
      <color attach="background" args={[SKY_HORIZON]} />
      <fog attach="fog" args={[SKY_HORIZON, 34, 70]} />
      <SkyDome />
      <hemisphereLight intensity={1} color="#dff1ff" groundColor="#5a7d3a" />
      <directionalLight castShadow position={[10, 18, 8]} intensity={1.9} color="#fff1d6" shadow-mapSize={[1024, 1024]} />

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -2]}>
        <circleGeometry args={[71, 64]} />
        <meshStandardMaterial color="#7cc26b" roughness={0.95} />
      </mesh>
      {ZONES.map((zone) => (
        <Path key={zone.id} from={[0, 0, -2]} to={zone.building} />
      ))}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -2]}>
        <circleGeometry args={[5.1, 48]} />
        <meshStandardMaterial color="#d8bf94" roughness={0.9} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -2]}>
        <ringGeometry args={[4.15, 4.65, 48]} />
        <meshStandardMaterial color="#d9573f" roughness={0.72} />
      </mesh>
      {flowers.map((position, index) => (
        <group key={index} position={position} rotation={[0, index * 1.3, 0]}>
          {[[0, 0.26, 0, 0.36], [0.28, 0.2, 0.1, 0.26], [-0.24, 0.2, -0.08, 0.27]].map(([x, y, z, r], i) => (
            <mesh key={i} castShadow position={[x, y, z]}>
              <sphereGeometry args={[r, 16, 12]} />
              <meshStandardMaterial color={i ? "#4f9443" : "#5da74f"} roughness={0.85} />
            </mesh>
          ))}
          {[[0.1, 0.55, 0.12], [-0.16, 0.47, 0.14], [0.3, 0.42, -0.08], [-0.05, 0.5, -0.22], [0.2, 0.36, 0.26]].map(([x, y, z], i) => (
            <mesh key={`f${i}`} position={[x, y, z]}>
              <sphereGeometry args={[0.07, 8, 6]} />
              <meshStandardMaterial color={FLOWER_COLORS[index % FLOWER_COLORS.length]} emissive={FLOWER_COLORS[index % FLOWER_COLORS.length]} emissiveIntensity={0.15} />
            </mesh>
          ))}
        </group>
      ))}

      {ZONES.map((zone) => (
        <group key={zone.id}>
          <CampusBuilding
            title={zone.title}
            short={zone.short}
            color={zone.color}
            position={zone.building}
            style={zone.style}
            completed={zone.id !== "info" && completed.includes(zone.id)}
          />
          <InteractionBeacon
            position={zone.position}
            color={zone.color}
            done={zone.id !== "info" && completed.includes(zone.id)}
          />
        </group>
      ))}

      {trees.map((tree, index) => (
        <Tree key={index} position={tree.position} kind={tree.kind} scale={tree.scale} rotation={index * 1.7} />
      ))}
      <CampusSurroundings />
      {/* Merender ulang scene setiap frame; hanya sepadan di kualitas tinggi. */}
      {quality === "tinggi" && <ContactShadows position={[0, 0.02, -2]} opacity={0.34} scale={38} blur={2.2} far={12} />}
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
  onPerfFallback,
}: {
  avatar: GameAvatarId;
  completed: MissionId[];
  paused: boolean;
  spawnZone: "plaza" | CampusZone;
  quality: GameQuality;
  onNearZone: (zone: CampusZone | null) => void;
  onStep: () => void;
  /** FPS terus tersendat: sarankan pindah ke mode hemat. */
  onPerfFallback?: () => void;
}) {
  const input = useMovementKeys();
  const [ready, setReady] = useState(false);
  const markReady = useCallback(() => setReady(true), []);
  const profile = qualityProfile(quality);
  return (
    <div className="game-canvas-focus">
      <Canvas
        // Saat dialog/jeda terbuka kampus diam, jadi tidak perlu render terus (hemat baterai).
        {...canvasSettings(profile, paused)}
        // Mode hemat: kabut sudah menutup semuanya setelah 70 unit.
        camera={{ position: [7, 7, 10], fov: 48, near: 0.1, far: profile.lite ? 75 : 100 }}
      >
        <ResponsiveCamera />
        <QualityRig profile={profile} paused={paused} onFallback={onPerfFallback} />
        <Suspense fallback={null}>
          <CampusWorld
            avatar={avatar}
            completed={completed}
            paused={paused}
            spawnZone={spawnZone}
            quality={quality}
            input={input}
            onNearZone={onNearZone}
            onStep={onStep}
          />
          <SceneReady onReady={markReady} />
        </Suspense>
      </Canvas>
      <SceneLoader ready={ready} label="Membangun kampus virtual…" />
      <TouchControls inputRef={input.touch} mode="stick" />
      <div className="game-keyboard-hint hint-pointer" aria-hidden="true"><kbd>WASD</kbd><span>Tekan untuk melangkah · tahan untuk berjalan</span></div>
    </div>
  );
}

export default memo(GameCanvas);
