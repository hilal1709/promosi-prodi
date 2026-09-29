"use client";

import { memo, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { IconBolt, IconCheck, IconHeart, IconLock, IconScan, IconThreat, IconTimer, IconX } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import CharacterModel, { type CharacterMotion } from "@/components/game/character-model";
import { clampPercent, type Feedback } from "@/components/game/missions/mission-kit";
import { cn } from "@/lib/utils";
import { BONUS_KINDS, BONUS_SPOTS, FIREWALL_DRAW, FIREWALL_PACKETS, OFFICE_EXTRA_CONCEPTS, OFFICE_OBJECTS, OFFICE_VARIANTS, type FirewallPacket, type OfficeObject } from "@/lib/data/worlds";
import { pickOne, sample, shuffled } from "../quiz-bank";
import { TouchControls } from "../touch-controls";
import {
  BONUS_INFO,
  BonusItem,
  CONE_HALF,
  CONE_RANGE,
  CONE_RANGE_CROUCH,
  ConceptQuiz,
  DroneCone,
  SecureChallenge,
  type BonusItemData,
  type DroneState,
} from "./inspect-extras";
import { DataCenterHall, DataCenterLights, Technician } from "./data-center";
import { usePressReader, type WorldInput } from "../world-controls";
import {
  clampDelta,
  HudChip,
  HudMeter,
  Label,
  LevelEnd,
  Walker,
  WorldHud,
  WorldLights,
  WorldStage,
  useThrottled,
  type WorldLevelProps,
} from "../world-kit";

/* ------------------------------------------------------------------ */
/* Level 1 · Inspeksi malam                                           */
/* ------------------------------------------------------------------ */

const INSPECT_TIME = 150;
const ROOM = { x: 12, z: 8.6 };
const VIOLATIONS = OFFICE_OBJECTS.filter((item) => item.pelanggaran).length;
const DECOYS = OFFICE_OBJECTS.length - VIOLATIONS;
const DRONE_PATH: [number, number][] = [[-8, 1], [0, 1.2], [8, 1], [8, 6], [0, 6.5], [-8, 6]];

/** Sekat ruang server di pojok belakang-kanan: dinding kiri penuh + dinding depan dengan celah pintu. */
const SERVER_ROOM = {
  xMin: 6.6,
  zFront: -1.4,
  wallHeight: 3.2,
  wallThickness: 0.3,
  doorX: 9,
  doorWidth: 1.7,
};
const SERVER_WALL_COLLIDERS: Collider[] = [
  // dinding kiri (sepanjang sumbu z)
  { x: SERVER_ROOM.xMin, z: (-ROOM.z + SERVER_ROOM.zFront) / 2, w: SERVER_ROOM.wallThickness + 0.4, d: -ROOM.z - SERVER_ROOM.zFront + 0.2 },
  // dinding depan, dua segmen mengapit celah pintu
  { x: (SERVER_ROOM.xMin + (SERVER_ROOM.doorX - SERVER_ROOM.doorWidth / 2)) / 2, z: SERVER_ROOM.zFront, w: SERVER_ROOM.doorX - SERVER_ROOM.doorWidth / 2 - SERVER_ROOM.xMin, d: SERVER_ROOM.wallThickness + 0.4 },
  { x: (ROOM.x + (SERVER_ROOM.doorX + SERVER_ROOM.doorWidth / 2)) / 2, z: SERVER_ROOM.zFront, w: ROOM.x - (SERVER_ROOM.doorX + SERVER_ROOM.doorWidth / 2), d: SERVER_ROOM.wallThickness + 0.4 },
];

type Collider = { x: number; z: number; w: number; d: number };
const COLLIDERS: Collider[] = OFFICE_OBJECTS.flatMap((item): Collider[] => {
  if (item.kind === "monitor" || item.kind === "usb") return [{ x: item.x, z: item.z - 0.3, w: 2.6, d: 1.2 }];
  if (item.kind === "printer") return [{ x: item.x, z: item.z, w: 1.3, d: 1.1 }];
  if (item.kind === "server") return [{ x: item.x, z: item.z, w: 1.4, d: 1.4 }];
  if (item.kind === "book") return [{ x: item.x, z: item.z, w: 0.9, d: 0.9 }];
  return [];
}).concat(
  // tanaman pot & sofa tunggu (dekorasi)
  [[-11, -7.6], [5.7, -7.6], [11, 7.6], [-11, 7.6], [-3.2, 7.6]].map(([x, z]) => ({ x, z, w: 0.9, d: 0.9 })),
  [{ x: 7.2, z: 7.7, w: 3, d: 1 }],
  SERVER_WALL_COLLIDERS
);

function officeBlocked(x: number, z: number) {
  if (Math.abs(x) > ROOM.x - 0.5 || Math.abs(z) > ROOM.z - 0.5) return true;
  return COLLIDERS.some((c) => Math.abs(x - c.x) < c.w / 2 + 0.35 && Math.abs(z - c.z) < c.d / 2 + 0.35);
}

function OfficeProp({ item, revealed, status, secured }: { item: OfficeObject; revealed: boolean; status?: "ok" | "bad"; secured?: boolean }) {
  const glow = status === "ok" ? "#2fae66" : status === "bad" ? "#e54b4b" : revealed ? "#ffd166" : "#000000";
  const glowAmount = status || revealed ? 0.9 : 0;
  const mat = (color: string) => <meshStandardMaterial color={color} emissive={glow} emissiveIntensity={glowAmount} />;
  const desk = (
    <mesh position={[0, 0.75, -0.3]} castShadow receiveShadow>
      <boxGeometry args={[2.6, 0.1, 1.2]} />
      <meshStandardMaterial color="#b08560" roughness={0.7} />
    </mesh>
  );
  let body: ReactNode = null;
  if (item.kind === "monitor" || item.kind === "usb") {
    body = (
      <>
        {desk}
        {[-1.2, 1.2].map((x) => (
          <mesh key={x} position={[x, 0.37, -0.3]}><boxGeometry args={[0.1, 0.75, 1.1]} /><meshStandardMaterial color="#7a5a40" /></mesh>
        ))}
        <OfficeChair />
        <mesh position={[0.95, 0.83, -0.55]} castShadow><cylinderGeometry args={[0.09, 0.07, 0.16, 10]} /><meshStandardMaterial color="#f4efe6" /></mesh>
        <mesh position={[-0.9, 0.81, -0.1]} rotation={[0, 0.3, 0]}><boxGeometry args={[0.5, 0.02, 0.36]} /><meshStandardMaterial color="#fbf8f2" /></mesh>
        <mesh position={[0, 1.3, -0.5]} castShadow><boxGeometry args={[1.3, 0.8, 0.08]} />{mat("#1d2330")}</mesh>
        <mesh position={[0, 1.3, -0.45]}>
          <planeGeometry args={[1.18, 0.68]} />
          <meshBasicMaterial color={item.id === "d3" || (item.id === "v2" && secured) ? "#2b3346" : "#8fd0ff"} toneMapped={false} />
        </mesh>
        {item.id === "v1" && !secured && <mesh position={[0.45, 1.55, -0.44]}><planeGeometry args={[0.28, 0.28]} /><meshBasicMaterial color="#ffe45c" /></mesh>}
        {item.kind === "usb" && !secured && <mesh position={[0.7, 0.9, -0.1]}><boxGeometry args={[0.12, 0.06, 0.3]} />{mat("#e54b4b")}</mesh>}
      </>
    );
  } else if (item.kind === "printer") {
    body = (
      <>
        {/* badan utama printer */}
        <mesh position={[0, 0.28, 0]} castShadow>
          <boxGeometry args={[1.15, 0.5, 0.82]} />
          {mat("#e6e2d9")}
        </mesh>
        {/* tutup pemindai di bagian atas-belakang */}
        <mesh position={[0, 0.58, -0.06]} castShadow>
          <boxGeometry args={[1.02, 0.1, 0.68]} />
          <meshStandardMaterial color="#cfc9bd" />
        </mesh>
        {/* panel kontrol dengan layar kecil */}
        <mesh position={[0.32, 0.58, 0.3]} rotation={[-0.35, 0, 0]}>
          <boxGeometry args={[0.32, 0.03, 0.16]} />
          <meshStandardMaterial color="#2a2f3a" />
        </mesh>
        <mesh position={[0.32, 0.596, 0.335]} rotation={[-0.35, 0, 0]}>
          <planeGeometry args={[0.22, 0.09]} />
          <meshBasicMaterial color="#7fd8ff" toneMapped={false} />
        </mesh>
        {/* baki keluaran kertas menonjol ke depan */}
        <mesh position={[-0.1, 0.4, 0.48]} rotation={[0.22, 0, 0]}>
          <boxGeometry args={[0.72, 0.03, 0.3]} />
          <meshStandardMaterial color="#8f8a80" />
        </mesh>
        <mesh position={[-0.1, 0.425, 0.44]} rotation={[0.22, 0, 0]}>
          <boxGeometry args={[0.56, 0.04, 0.02]} />
          <meshStandardMaterial color="#fbfbf8" />
        </mesh>
      </>
    );
  } else if (item.kind === "server") {
    body = (
      <>
        <mesh position={[0, 1.2, 0]} castShadow><boxGeometry args={[1.3, 2.4, 1.3]} />{mat("#23272f")}</mesh>
        {[0.6, 1, 1.4, 1.8].map((y) => (
          <mesh key={y} position={[0.3, y, 0.66]}><boxGeometry args={[0.1, 0.05, 0.02]} /><meshBasicMaterial color="#39e67a" /></mesh>
        ))}
      </>
    );
  } else if (item.kind === "book") {
    body = (
      <>
        {/* podium buku tamu */}
        <mesh position={[0, 0.36, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.27, 0.72, 8]} />
          <meshStandardMaterial color="#6b4a35" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.74, 0]} castShadow>
          <boxGeometry args={[0.58, 0.04, 0.42]} />
          <meshStandardMaterial color="#4a3324" />
        </mesh>
        {/* halaman buku terbuka */}
        <mesh position={[-0.13, 0.775, 0]} rotation={[-0.12, 0.14, 0.04]} castShadow>
          <boxGeometry args={[0.26, 0.02, 0.34]} />
          {mat("#f7f2e4")}
        </mesh>
        <mesh position={[0.13, 0.775, 0]} rotation={[-0.12, -0.14, -0.04]} castShadow>
          <boxGeometry args={[0.26, 0.02, 0.34]} />
          {mat("#f7f2e4")}
        </mesh>
        <mesh position={[0, 0.767, 0]}><boxGeometry args={[0.03, 0.03, 0.34]} /><meshStandardMaterial color="#7b2d26" /></mesh>
        {/* pulpen di atas halaman */}
        <mesh position={[0.09, 0.795, 0.04]} rotation={[0, 0.6, 1.3]}>
          <cylinderGeometry args={[0.012, 0.012, 0.22, 6]} />
          <meshStandardMaterial color="#1e293b" metalness={0.4} />
        </mesh>
      </>
    );
  } else if (item.kind === "door") {
    body = (
      <group rotation={[0, 0, 0]}>
        {secured ? (
          <mesh position={[0, 1.3, -0.1]}><boxGeometry args={[1.8, 2.6, 0.1]} />{mat("#6b7280")}</mesh>
        ) : (
          <>
            <mesh position={[-0.9, 1.3, 0.1]} rotation={[0, -0.9, 0]}><boxGeometry args={[1.6, 2.6, 0.1]} />{mat("#6b7280")}</mesh>
            <mesh position={[0.4, 0.35, 0.8]} castShadow><boxGeometry args={[0.6, 0.7, 0.6]} /><meshStandardMaterial color="#3b82f6" /></mesh>
          </>
        )}
        <mesh position={[0, 1.3, -0.2]}><planeGeometry args={[1.8, 2.6]} /><meshBasicMaterial color="#0b0d12" /></mesh>
      </group>
    );
  } else if (item.kind === "cctv") {
    body = (
      <group position={[0.3, 2.6, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh castShadow><boxGeometry args={[0.35, 0.3, 0.7]} />{mat("#e8e2dc")}</mesh>
        <mesh position={[0, 0, 0.36]}><circleGeometry args={[0.1, 12]} /><meshBasicMaterial color="#111" /></mesh>
        {secured && <mesh position={[0.12, 0.1, 0.36]}><sphereGeometry args={[0.04, 8, 6]} /><meshBasicMaterial color="#39e67a" toneMapped={false} /></mesh>}
      </group>
    );
  } else if (item.kind === "card") {
    body = (
      <group position={[-0.1, 1.3, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh><boxGeometry args={[0.4, 0.6, 0.08]} />{mat("#23272f")}</mesh>
        <mesh position={[0, 0.1, 0.05]}><planeGeometry args={[0.2, 0.12]} /><meshBasicMaterial color={secured ? "#e54b4b" : "#39e67a"} /></mesh>
      </group>
    );
  }
  return (
    <group position={[item.x, 0, item.z]}>
      {body}
      {(revealed || status) && (
        <Label position={[0, 2.6, 0]} className={status === "ok" ? "is-green" : status === "bad" ? "is-red" : "is-gold"} distanceFactor={10}>
          {secured ? <IconLock className="mr-1 inline h-3 w-3 align-[-2px]" /> : status === "ok" ? <IconCheck className="mr-1 inline h-3 w-3 align-[-2px]" /> : status === "bad" ? <IconX className="mr-1 inline h-3 w-3 align-[-2px]" /> : "? "}
          {item.nama}
          {secured && " · diamankan"}
        </Label>
      )}
    </group>
  );
}

function Drone({ droneRef, alertRef }: { droneRef: RefObject<DroneState>; alertRef: RefObject<{ alert: number }> }) {
  const group = useRef<THREE.Group>(null);
  const rotor = useRef<THREE.Group>(null);
  const eye = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (!group.current) return;
    const d = droneRef.current;
    group.current.position.set(d.x, 1.6 + Math.sin(clock.elapsedTime * 3) * 0.12, d.z);
    group.current.rotation.y = d.heading;
    if (rotor.current) rotor.current.rotation.y += d.pause > 0 ? 0.01 : 0.5;
    if (eye.current) eye.current.color.set(d.pause > 0 ? "#555" : alertRef.current.alert > 50 ? "#ff2b2b" : "#ffd166");
  });
  return (
    <group ref={group}>
      <mesh castShadow><sphereGeometry args={[0.4, 16, 12]} /><meshStandardMaterial color="#23272f" metalness={0.5} /></mesh>
      <mesh position={[0, -0.05, 0.35]}><sphereGeometry args={[0.13, 10, 8]} /><meshBasicMaterial ref={eye} color="#ffd166" toneMapped={false} /></mesh>
      <group ref={rotor} position={[0, 0.35, 0]}>
        {[0, Math.PI / 2].map((r) => (
          <mesh key={r} rotation={[0, r, 0]}><boxGeometry args={[1.6, 0.04, 0.12]} /><meshStandardMaterial color="#8a8483" /></mesh>
        ))}
      </group>
    </group>
  );
}

function OfficeChair() {
  return (
    <group position={[0, 0, 0.55]}>
      <mesh position={[0, 0.5, 0]} castShadow><boxGeometry args={[0.6, 0.1, 0.55]} /><meshStandardMaterial color="#3d5a80" /></mesh>
      <mesh position={[0, 0.85, 0.26]} castShadow><boxGeometry args={[0.6, 0.6, 0.08]} /><meshStandardMaterial color="#3d5a80" /></mesh>
      <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.04, 0.04, 0.45, 8]} /><meshStandardMaterial color="#4b4f58" metalness={0.6} roughness={0.4} /></mesh>
      <mesh position={[0, 0.04, 0]}><cylinderGeometry args={[0.3, 0.3, 0.05, 12]} /><meshStandardMaterial color="#4b4f58" /></mesh>
    </group>
  );
}

const LEAVES: [number, number, number, number][] = [[0, 1.05, 0, 0.42], [0.2, 1.35, 0.1, 0.32], [-0.18, 1.3, -0.1, 0.3], [0.05, 1.6, -0.05, 0.24]];

function Plant({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.3, 0]} castShadow><cylinderGeometry args={[0.32, 0.24, 0.6, 14]} /><meshStandardMaterial color="#c96f4a" roughness={0.9} /></mesh>
      <mesh position={[0, 0.58, 0]}><cylinderGeometry args={[0.29, 0.29, 0.04, 14]} /><meshStandardMaterial color="#4a3526" /></mesh>
      {LEAVES.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <icosahedronGeometry args={[r, 0]} />
          <meshStandardMaterial color={i % 2 ? "#6db564" : "#449650"} flatShading roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/** Tekstur langit senja + siluet kota untuk jendela kantor. */
function useDuskTexture() {
  return useMemo(() => makeDuskTexture(), []);
}

function makeDuskTexture() {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const sky = ctx.createLinearGradient(0, 0, 0, 256);
  sky.addColorStop(0, "#33407f");
  sky.addColorStop(0.45, "#8a5fa8");
  sky.addColorStop(0.75, "#f29a76");
  sky.addColorStop(1, "#ffd39a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  for (let i = 0; i < 18; i++) ctx.fillRect((i * 97) % 512, (i * 37) % 70, 2, 2);
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let x = 0; x < 512; ) {
    const w = 24 + rand() * 40;
    const h = 50 + rand() * 110;
    ctx.fillStyle = rand() > 0.5 ? "#2a2440" : "#3a3055";
    ctx.fillRect(x, 256 - h, w, h);
    ctx.fillStyle = "#ffd98a";
    for (let wy = 256 - h + 8; wy < 250; wy += 12) {
      for (let wx = x + 5; wx < x + w - 6; wx += 9) if (rand() > 0.6) ctx.fillRect(wx, wy, 4, 5);
    }
    x += w + 2;
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const WINDOWS = [-8.2, -4.1, 0, 4.1];
const LAMPS: [number, number][] = [[-6, -2.5], [2, -2.5], [-4, 4.5], [5, 4.5]];
const CARPET_TILES = Array.from({ length: 12 * 9 }, (_, i) => i).filter((i) => (i % 12 + Math.floor(i / 12)) % 2 === 0);
const BOARD_LINES: [number, number, number, string][] = [[-0.8, 0.25, 1.1, "#3d5a80"], [0.3, 0, 1.4, "#e54b4b"], [-0.4, -0.3, 0.9, "#2fae66"]];

/** Kubah langit gradien (ungu tua di atas → senja hangat di cakrawala), supaya bagian atas dinding yang tidak beratap tidak menampakkan "batas dunia" berupa warna latar polos. */
const SKY_VERTEX = `
varying vec3 vWorldPosition;
void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const SKY_FRAGMENT = `
uniform vec3 topColor;
uniform vec3 horizonColor;
uniform vec3 bottomColor;
varying vec3 vWorldPosition;
void main() {
  float h = normalize(vWorldPosition).y;
  vec3 col = h > 0.0 ? mix(horizonColor, topColor, pow(h, 0.55)) : mix(horizonColor, bottomColor, pow(-h, 0.6));
  gl_FragColor = vec4(col, 1.0);
}
`;

const SkyDome = memo(function SkyDome() {
  const uniforms = useMemo(
    () => ({
      topColor: { value: new THREE.Color("#201f3d") },
      horizonColor: { value: new THREE.Color("#6a5a86") },
      bottomColor: { value: new THREE.Color("#2a2740") },
    }),
    []
  );
  return (
    <mesh renderOrder={-1}>
      <sphereGeometry args={[140, 24, 16]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={SKY_VERTEX}
        fragmentShader={SKY_FRAGMENT}
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  );
});

const OfficeRoom = memo(function OfficeRoom() {
  const dusk = useDuskTexture();
  return (
    <>
      {/* tanah luar yang meluas jauh melewati dinding, agar tepi dunia tidak kelihatan. Warnanya
          senada dengan lantai supaya sambungannya tidak jadi garis tegas dekat kamera (kamera
          bisa berada di luar dinding depan yang rendah), lalu memudar ke kabut di kejauhan. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
        <planeGeometry args={[160, 160]} />
        <meshStandardMaterial color="#8c8171" roughness={1} />
      </mesh>
      {/* lantai karpet kotak-kotak dua warna */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM.x * 2, ROOM.z * 2]} />
        <meshStandardMaterial color="#a39686" roughness={0.95} />
      </mesh>
      {CARPET_TILES.map((i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-ROOM.x + 1 + (i % 12) * 2, 0.004, -ROOM.z + 0.95 + Math.floor(i / 12) * 1.91]} receiveShadow>
          <planeGeometry args={[2, 1.91]} />
          <meshStandardMaterial color="#9a8d7e" roughness={1} />
        </mesh>
      ))}
      {/* karpet area tengah */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1, 0.01, 0.2]} receiveShadow>
        <planeGeometry args={[9, 3.4]} />
        <meshStandardMaterial color="#6f8f7a" roughness={1} />
      </mesh>

      {/* dinding belakang dengan jendela senja */}
      <mesh position={[0, 0.6, -ROOM.z]} receiveShadow><boxGeometry args={[ROOM.x * 2, 1.2, 0.3]} /><meshStandardMaterial color="#b8a58f" /></mesh>
      <mesh position={[0, 2.95, -ROOM.z]} receiveShadow><boxGeometry args={[ROOM.x * 2, 0.5, 0.3]} /><meshStandardMaterial color="#efe6d8" /></mesh>
      <mesh position={[-4.05, 1.95, -ROOM.z - 0.1]}><boxGeometry args={[15.9, 1.5, 0.1]} /><meshStandardMaterial color="#efe6d8" /></mesh>
      <mesh position={[8.1, 1.95, -ROOM.z]}><boxGeometry args={[7.8, 1.5, 0.3]} /><meshStandardMaterial color="#efe6d8" /></mesh>
      {WINDOWS.map((x) => (
        <group key={x} position={[x, 1.95, -ROOM.z + 0.02]}>
          <mesh><planeGeometry args={[3.4, 1.4]} /><meshBasicMaterial map={dusk} color={dusk ? "#ffffff" : "#d98e7a"} toneMapped={false} /></mesh>
          <mesh position={[0, 0, 0.03]}><boxGeometry args={[0.06, 1.4, 0.04]} /><meshStandardMaterial color="#f7f3ec" /></mesh>
          <mesh position={[0, -0.72, 0.1]}><boxGeometry args={[3.6, 0.06, 0.28]} /><meshStandardMaterial color="#f7f3ec" /></mesh>
        </group>
      ))}

      {/* dinding samping hangat + list bawah */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * ROOM.x, 1.6, 0]} receiveShadow><boxGeometry args={[0.3, 3.2, ROOM.z * 2]} /><meshStandardMaterial color="#e3d6c3" /></mesh>
          <mesh position={[side * (ROOM.x - 0.17), 0.08, 0]}><boxGeometry args={[0.04, 0.16, ROOM.z * 2]} /><meshStandardMaterial color="#8a6a4f" /></mesh>
        </group>
      ))}
      <mesh position={[0, 0.3, ROOM.z]}><boxGeometry args={[ROOM.x * 2, 0.6, 0.3]} /><meshStandardMaterial color="#d6c8b3" /></mesh>

      {/* sekat ruang server: dinding kiri penuh + dinding depan dengan celah pintu */}
      <mesh
        position={[SERVER_ROOM.xMin, SERVER_ROOM.wallHeight / 2, (-ROOM.z + SERVER_ROOM.zFront) / 2]}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[SERVER_ROOM.wallThickness, SERVER_ROOM.wallHeight, SERVER_ROOM.zFront + ROOM.z]} />
        <meshStandardMaterial color="#c8bda6" />
      </mesh>
      <mesh
        position={[(SERVER_ROOM.xMin + (SERVER_ROOM.doorX - SERVER_ROOM.doorWidth / 2)) / 2, SERVER_ROOM.wallHeight / 2, SERVER_ROOM.zFront]}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[SERVER_ROOM.doorX - SERVER_ROOM.doorWidth / 2 - SERVER_ROOM.xMin, SERVER_ROOM.wallHeight, SERVER_ROOM.wallThickness]} />
        <meshStandardMaterial color="#c8bda6" />
      </mesh>
      <mesh
        position={[(ROOM.x + (SERVER_ROOM.doorX + SERVER_ROOM.doorWidth / 2)) / 2, SERVER_ROOM.wallHeight / 2, SERVER_ROOM.zFront]}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[ROOM.x - (SERVER_ROOM.doorX + SERVER_ROOM.doorWidth / 2), SERVER_ROOM.wallHeight, SERVER_ROOM.wallThickness]} />
        <meshStandardMaterial color="#c8bda6" />
      </mesh>
      {/* ambang pintu di atas celah */}
      <mesh position={[SERVER_ROOM.doorX, 2.75, SERVER_ROOM.zFront]}>
        <boxGeometry args={[SERVER_ROOM.doorWidth + 0.2, 0.5, SERVER_ROOM.wallThickness]} />
        <meshStandardMaterial color="#c8bda6" />
      </mesh>

      {/* papan tulis di dinding kiri, jam di dinding kanan */}
      <group position={[-ROOM.x + 0.17, 1.8, -3]} rotation={[0, Math.PI / 2, 0]}>
        <mesh><boxGeometry args={[3, 1.3, 0.06]} /><meshStandardMaterial color="#c9ccd1" /></mesh>
        <mesh position={[0, 0, 0.035]}><planeGeometry args={[2.85, 1.15]} /><meshStandardMaterial color="#fbfbf8" /></mesh>
        {BOARD_LINES.map(([x, y, w, c]) => (
          <mesh key={c} position={[x, y, 0.04]}><planeGeometry args={[w, 0.04]} /><meshBasicMaterial color={c} /></mesh>
        ))}
      </group>
      <group position={[ROOM.x - 0.17, 2.5, 1.5]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.35, 0.35, 0.06, 24]} /><meshStandardMaterial color="#f7f3ec" /></mesh>
        <mesh position={[0, 0.1, 0.04]}><boxGeometry args={[0.03, 0.22, 0.01]} /><meshBasicMaterial color="#1e1e24" /></mesh>
        <mesh position={[0.08, 0, 0.04]} rotation={[0, 0, -1.2]}><boxGeometry args={[0.03, 0.16, 0.01]} /><meshBasicMaterial color="#1e1e24" /></mesh>
      </group>

      {/* sofa tunggu di dekat pintu masuk */}
      <group position={[7.2, 0, 7.7]}>
        <mesh position={[0, 0.3, 0]} castShadow><boxGeometry args={[2.8, 0.45, 0.9]} /><meshStandardMaterial color="#d98b5f" /></mesh>
        <mesh position={[0, 0.75, 0.35]} castShadow><boxGeometry args={[2.8, 0.6, 0.2]} /><meshStandardMaterial color="#c97b50" /></mesh>
      </group>

      <Plant position={[-11, 0, -7.6]} scale={1.2} />
      <Plant position={[5.7, 0, -7.6]} />
      <Plant position={[11, 0, 7.6]} scale={1.1} />
      <Plant position={[-11, 0, 7.6]} />
      <Plant position={[-3.2, 0, 7.6]} scale={0.9} />

      {/* lampu langit-langit (tak terlihat dari kamera atas): cahaya hangat menyebar di area kerja */}
      {LAMPS.map(([x, z]) => (
        <group key={`${x}:${z}`} position={[x, 3.4, z]}>
          <pointLight position={[0, -0.3, 0]} color="#ffd9a8" intensity={14} distance={11} decay={1.6} />
        </group>
      ))}
      <Label position={[SERVER_ROOM.doorX, 3.2, SERVER_ROOM.zFront + 0.3]} distanceFactor={12}>RUANG SERVER</Label>
    </>
  );
});

type Body = { stamina: number; moving: boolean; sprint: boolean; crouch: boolean; alert: number };
type Stage = { id: string; step: "decide" | "quiz" | "offer" | "secure"; note?: Feedback };

const DRONE_SPEED = 2.6;
const DRONE_WAIT = 1.4;
const SPRINT_SPEED = 7;
const CROUCH_SPEED = 2.2;
const WALK_SPEED = 4.2;
/** Semua konsep pelanggaran yang mungkin muncul + pengecoh tambahan, untuk kuis konsep. */
const QUIZ_CONCEPTS = [
  ...new Set([
    ...OFFICE_OBJECTS.filter((item) => item.pelanggaran).flatMap((item) => (OFFICE_VARIANTS[item.id] ?? []).map((variant) => variant.konsep)),
    ...OFFICE_EXTRA_CONCEPTS,
  ]),
];

/** Undi satu studi kasus per objek kantor (posisi & status pelanggarannya tetap). */
function drawOfficeObjects(): OfficeObject[] {
  return OFFICE_OBJECTS.map((item) => ({ ...item, ...pickOne(OFFICE_VARIANTS[item.id] ?? [item]) }));
}

/** Ambil paket firewall acak, seimbang antara berbahaya & normal. */
function drawPackets(): FirewallPacket[] {
  const half = FIREWALL_DRAW / 2;
  return [...sample(FIREWALL_PACKETS.filter((packet) => packet.bahaya), half), ...sample(FIREWALL_PACKETS.filter((packet) => !packet.bahaya), half)];
}

function wrapAngle(angle: number) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

/** Garis pandang drone → pemain terhalang furnitur? (sampling titik di sepanjang garis). */
function sightBlocked(ax: number, az: number, bx: number, bz: number) {
  for (let i = 1; i < 8; i++) {
    const t = i / 8;
    const x = ax + (bx - ax) * t;
    const z = az + (bz - az) * t;
    if (COLLIDERS.some((c) => Math.abs(x - c.x) < c.w / 2 && Math.abs(z - c.z) < c.d / 2)) return true;
  }
  return false;
}

const shuffle = <T,>(list: readonly T[]) => shuffled(list);

function InspectScene({
  avatar,
  input,
  running,
  frozen,
  decided,
  secured,
  bonus,
  taken,
  revealUntil,
  playerRef,
  droneRef,
  bodyRef,
  onTick,
  onNear,
  onInspect,
  onScan,
  onCaught,
  onPickup,
  onStep,
}: {
  avatar: WorldLevelProps["avatar"];
  input: WorldInput;
  running: boolean;
  frozen: boolean;
  decided: Record<string, "ok" | "bad">;
  secured: Record<string, boolean>;
  bonus: BonusItemData[];
  taken: Set<string>;
  revealUntil: number;
  playerRef: RefObject<THREE.Group | null>;
  droneRef: RefObject<DroneState>;
  bodyRef: RefObject<Body>;
  onTick: (delta: number) => number;
  onNear: (id: string | null) => void;
  onInspect: (id: string) => void;
  onScan: (x: number, z: number) => void;
  onCaught: () => void;
  onPickup: (item: BonusItemData) => void;
  onStep: () => void;
}) {
  const pressed = usePressReader(input);
  const near = useRef<string | null>(null);
  const ring = useRef<THREE.Mesh>(null);
  const scan = useRef({ t: 1, x: 0, z: 0 });
  const [now, setNow] = useState(0);

  const speed = () => {
    const b = bodyRef.current;
    const held = input.current.held;
    b.crouch = Boolean(held.c) && !frozen;
    b.sprint = !b.crouch && Boolean(held.shift) && b.stamina > 1 && b.moving && !frozen;
    return b.crouch ? CROUCH_SPEED : b.sprint ? SPRINT_SPEED : WALK_SPEED;
  };

  useFrame((_, raw) => {
    const delta = clampDelta(raw);
    const p = playerRef.current;
    if (running && p) {
      setNow(onTick(delta));
      const b = bodyRef.current;

      // Drone patroli: jalan antar titik, berhenti & menyapu pandangan di tiap titik.
      const d = droneRef.current;
      if (d.pause > 0) {
        d.pause = Math.max(0, d.pause - delta);
      } else if (d.wait > 0) {
        d.wait = Math.max(0, d.wait - delta);
        const progress = 1 - d.wait / DRONE_WAIT;
        d.heading = d.baseHeading + Math.sin(progress * Math.PI * 2) * 1.05;
        if (d.wait === 0) d.leg = (d.leg + 1) % DRONE_PATH.length;
      } else {
        const [tx, tz] = DRONE_PATH[d.leg];
        const dist = Math.hypot(tx - d.x, tz - d.z);
        if (dist < 0.2) {
          d.wait = DRONE_WAIT;
          d.baseHeading = d.heading;
        } else {
          d.x += ((tx - d.x) / dist) * DRONE_SPEED * delta;
          d.z += ((tz - d.z) / dist) * DRONE_SPEED * delta;
          d.heading += wrapAngle(Math.atan2(tx - d.x, tz - d.z) - d.heading) * Math.min(1, delta * 6);
        }
      }

      // Sorotan drone: meter "ketahuan" naik bila pemain di dalam kerucut & tidak terhalang.
      const dx = p.position.x - d.x;
      const dz = p.position.z - d.z;
      const range = b.crouch ? CONE_RANGE_CROUCH : CONE_RANGE;
      const seen =
        d.pause === 0 &&
        Math.hypot(dx, dz) < range &&
        Math.abs(wrapAngle(Math.atan2(dx, dz) - d.heading)) < CONE_HALF &&
        !sightBlocked(d.x, d.z, p.position.x, p.position.z);
      b.alert = THREE.MathUtils.clamp(b.alert + (seen ? (b.crouch ? 35 : 70) : -30) * delta, 0, 100);
      if (b.alert >= 100) {
        b.alert = 0;
        d.pause = 1.5;
        const away = new THREE.Vector2(dx, dz).normalize().multiplyScalar(2.2);
        if (!officeBlocked(p.position.x + away.x, p.position.z + away.y)) p.position.set(p.position.x + away.x, 0, p.position.z + away.y);
        onCaught();
      }

      bonus.forEach((item) => {
        if (!taken.has(item.id) && Math.hypot(p.position.x - item.x, p.position.z - item.z) < 0.9) onPickup(item);
      });

      let nearest: string | null = null;
      let best = 2.3;
      OFFICE_OBJECTS.forEach((item) => {
        if (decided[item.id]) return;
        const distance = Math.hypot(p.position.x - item.x, p.position.z - item.z);
        if (distance < best) {
          best = distance;
          nearest = item.id;
        }
      });
      if (nearest !== near.current) {
        near.current = nearest;
        onNear(nearest);
      }
      if (!frozen) {
        if (pressed("interact") && near.current) onInspect(near.current);
        if (pressed("action")) {
          scan.current = { t: 0, x: p.position.x, z: p.position.z };
          onScan(p.position.x, p.position.z);
        }
      } else {
        pressed("interact");
        pressed("action");
      }
    }
    scan.current.t = Math.min(1, scan.current.t + delta * 1.1);
    if (ring.current) {
      const r = 0.1 + scan.current.t * 9;
      ring.current.scale.set(r, r, r);
      ring.current.position.set(scan.current.x, 0.08, scan.current.z);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - scan.current.t);
    }
  });

  return (
    <>
      <WorldLights night />
      <fog attach="fog" args={["#3a3552", 26, 55]} />
      <SkyDome />
      <OfficeRoom />
      {OFFICE_OBJECTS.map((item) => (
        <OfficeProp key={item.id} item={item} revealed={now < revealUntil && !decided[item.id]} status={decided[item.id]} secured={secured[item.id]} />
      ))}
      {bonus.map((item, index) => (taken.has(item.id) ? null : <BonusItem key={item.id} item={item} index={index} />))}
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.92, 1, 64]} />
        <meshBasicMaterial color="#ffd166" transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
      <Drone droneRef={droneRef} alertRef={bodyRef} />
      <DroneCone droneRef={droneRef} alertRef={bodyRef} />
      <Walker
        avatar={avatar}
        input={input}
        playerRef={playerRef}
        start={[0, 7]}
        frozen={!running || frozen}
        blocked={officeBlocked}
        cameraOffset={[0, 9, 8]}
        speed={speed}
        crouch={() => bodyRef.current.crouch}
        onMove={(moving) => {
          bodyRef.current.moving = moving;
        }}
        onStep={onStep}
      />
    </>
  );
}

export function InspectLevel({ levelIndex, info, paused, quality, avatar, input, sound, onPause, onFinish }: WorldLevelProps) {
  const player = useRef<THREE.Group>(null);
  const droneRef = useRef<DroneState>({ x: DRONE_PATH[0][0], z: DRONE_PATH[0][1], leg: 1, heading: Math.PI / 2, baseHeading: 0, wait: 0, pause: 0 });
  const bodyRef = useRef<Body>({ stamina: 100, moving: false, sprint: false, crouch: false, alert: 0 });
  const clock = useRef({ left: INSPECT_TIME, energy: 100, elapsed: 0 });
  const [hud, setHud] = useState({ left: INSPECT_TIME, energy: 100, stamina: 100, alert: 0 });
  const push = useThrottled(setHud, 8);
  const [decided, setDecided] = useState<Record<string, "ok" | "bad">>({});
  const [secured, setSecured] = useState<Record<string, boolean>>({});
  const [nearId, setNearId] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [quizCorrect, setQuizCorrect] = useState(0);
  const [revealUntil, setRevealUntil] = useState(0);
  const [wrongFlags, setWrongFlags] = useState(0);
  const [docs, setDocs] = useState(0);
  const [toast, setToast] = useState<Feedback>(null);
  const [bonus] = useState<BonusItemData[]>(() =>
    shuffle(BONUS_SPOTS)
      .slice(0, BONUS_KINDS.length)
      .map(([x, z], i) => ({ id: `b${i}`, kind: BONUS_KINDS[i], x, z }))
  );
  const takenRef = useRef(new Set<string>());
  const [taken, setTaken] = useState<Set<string>>(() => new Set());
  // Studi kasus tiap objek diundi ulang setiap level dimulai / diulang.
  const [objects] = useState(drawOfficeObjects);

  const found = objects.filter((item) => item.pelanggaran && decided[item.id] === "ok").length;
  const clearedDecoys = objects.filter((item) => !item.pelanggaran && decided[item.id] === "ok").length;
  const securedCount = Object.keys(secured).length;
  const allDecided = Object.keys(decided).length >= objects.length;
  const ended = hud.left <= 0 || ((found >= VIOLATIONS || allDecided) && !stage);
  const score = clampPercent(
    (found / VIOLATIONS) * 65 + (clearedDecoys / DECOYS) * 15 + (quizCorrect / VIOLATIONS) * 10 + (securedCount / VIOLATIONS) * 10 + docs * 2 - wrongFlags * 8
  );
  const item = objects.find((entry) => entry.id === stage?.id);
  const nearItem = objects.find((entry) => entry.id === nearId);

  const tick = (delta: number) => {
    const c = clock.current;
    const b = bodyRef.current;
    c.left = Math.max(0, c.left - delta);
    c.energy = Math.min(100, c.energy + delta * 12);
    c.elapsed += delta;
    b.stamina = b.sprint ? Math.max(0, b.stamina - delta * 35) : Math.min(100, b.stamina + delta * 18);
    push({ left: c.left, energy: c.energy, stamina: b.stamina, alert: b.alert }, c.left <= 0);
    return c.elapsed;
  };

  const scan = () => {
    const c = clock.current;
    if (c.energy < 35) {
      sound("error");
      setToast({ ok: false, judul: "Energi pemindai kurang", teks: "Tunggu sebentar atau ambil baterai di lantai kantor." });
      return;
    }
    c.energy -= 35;
    sound("interact");
    setRevealUntil(c.elapsed + 5);
  };

  const decide = (flag: boolean) => {
    if (!item) return;
    const ok = flag === item.pelanggaran;
    setDecided((current) => ({ ...current, [item.id]: ok ? "ok" : "bad" }));
    sound(ok ? "success" : "error");
    if (flag && !item.pelanggaran) {
      setWrongFlags((value) => value + 1);
      clock.current.left = Math.max(0, clock.current.left - 8);
    }
    const feedback: Feedback = {
      ok,
      judul: ok ? (flag ? `Pelanggaran dicatat: ${item.nama}` : `${item.nama}: aman`) : flag ? "Ini kontrol yang berjalan baik (−8 detik)" : "Ternyata ini pelanggaran!",
      teks: item.detail,
      konsep: item.konsep,
    };
    if (ok && flag) {
      // Pelanggaran benar → lanjut kuis konsep, lalu tawaran amankan.
      setQuizOptions(shuffle([item.konsep, ...sample(QUIZ_CONCEPTS.filter((konsep) => konsep !== item.konsep), 2)]));
      setStage({ id: item.id, step: "quiz" });
      return;
    }
    setStage(null);
    setToast(feedback);
  };

  const answerQuiz = (value: string) => {
    if (!item) return;
    const correct = value === item.konsep;
    if (correct) setQuizCorrect((count) => count + 1);
    sound(correct ? "success" : "error");
    setStage({
      id: item.id,
      step: "offer",
      note: correct
        ? { ok: true, judul: "Tepat!", teks: `Kontrol yang dilanggar: ${item.konsep}.` }
        : { ok: false, judul: "Kurang tepat", teks: `Jawaban yang benar: ${item.konsep}.` },
    });
  };

  const finishSecure = (success: boolean) => {
    if (!item) return;
    setStage(null);
    if (success) {
      setSecured((current) => ({ ...current, [item.id]: true }));
      clock.current.left += 6;
      sound("success");
      setToast({ ok: true, judul: `Diamankan: ${item.aksi} (+6 detik)`, teks: item.detail, konsep: item.konsep });
    } else {
      sound("error");
      setToast({ ok: false, judul: "Gagal mengamankan", teks: "Temuan tetap tercatat, tapi belum ditindaklanjuti." });
    }
  };

  const pickup = (bonusItem: BonusItemData) => {
    if (takenRef.current.has(bonusItem.id)) return;
    takenRef.current.add(bonusItem.id);
    setTaken(new Set(takenRef.current));
    sound("pickup");
    if (bonusItem.kind === "baterai") clock.current.energy = Math.min(100, clock.current.energy + 50);
    if (bonusItem.kind === "kopi") clock.current.left += 10;
    if (bonusItem.kind === "dokumen") setDocs((count) => count + 1);
    const info = BONUS_INFO[bonusItem.kind];
    setToast({ ok: true, judul: `${info.nama}: ${info.efek}`, teks: "" });
  };

  return (
    <WorldStage
      quality={quality}
      paused={paused || ended}
      background="#3a3552"
      overlay={
        <>
          <WorldHud
            levelIndex={levelIndex}
            info={info}
            onPause={onPause}
            toast={stage ? null : toast}
            stats={
              <>
                <HudChip tone={hud.left <= 20 ? "red" : "dark"} pulse={hud.left <= 20}><IconTimer />{Math.ceil(hud.left)}s</HudChip>
                <HudChip tone="gold"><IconThreat />{found}/{VIOLATIONS} pelanggaran</HudChip>
                {securedCount > 0 && <HudChip tone="green"><IconLock />{securedCount} aman</HudChip>}
                <HudMeter label="PEMINDAI" value={hud.energy} tone={hud.energy < 35 ? "red" : "gold"} />
                <HudMeter label="STAMINA" value={hud.stamina} tone={hud.stamina < 25 ? "red" : "green"} />
                {hud.alert > 1 && <HudMeter label="KETAHUAN!" value={hud.alert} tone="red" />}
              </>
            }
            prompt={nearItem && !stage && !ended ? <><kbd className="hint-pointer">E</kbd>Periksa: {nearItem.nama}</> : undefined}
          />
          <TouchControls
            inputRef={input}
            mode="stick"
            buttons={[
              { holdKey: "c", label: "Jongkok", tone: "light" },
              { holdKey: "shift", label: "Lari", tone: "light" },
              { press: "action", label: <IconScan className="h-6 w-6" /> },
              { press: "interact", label: "Periksa" },
            ]}
          />
          {item && stage && !ended && (
            <div className="world-overlay-card mission-pop">
              <p className="flex items-center gap-2 text-xs font-black tracking-[0.15em] text-muted-foreground">HASIL PEMERIKSAAN</p>
              <p className="mt-1 text-lg font-black">{item.nama}</p>
              <p className="mt-2 rounded-2xl bg-card p-3 text-sm leading-relaxed ring-1 ring-border">{item.detail}</p>
              {stage.step === "decide" && (
                <>
                  <p className="mt-3 text-sm font-bold">Apakah ini pelanggaran kontrol?</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Button onClick={() => decide(true)} className="bg-track-audit text-white hover:bg-track-audit/90">Pelanggaran</Button>
                    <Button onClick={() => decide(false)} className="bg-emerald-600 text-white hover:bg-emerald-700">Aman</Button>
                  </div>
                </>
              )}
              {stage.step === "quiz" && <ConceptQuiz options={quizOptions} onPick={answerQuiz} />}
              {stage.step === "offer" && (
                <>
                  {stage.note && (
                    <p className={cn("mt-3 rounded-2xl px-3 py-2 text-sm font-bold", stage.note.ok ? "bg-emerald-100 text-emerald-800" : "bg-track-audit-soft text-track-audit")}>
                      {stage.note.judul} {stage.note.teks}
                    </p>
                  )}
                  <p className="mt-3 text-sm font-bold">Tindak lanjut sekarang? (+6 detik & skor bila berhasil)</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Button onClick={() => setStage({ id: item.id, step: "secure" })} className="bg-brand-gold text-brand-navy hover:bg-brand-gold/90">{item.aksi ?? "Amankan"}</Button>
                    <Button variant="outline" onClick={() => setStage(null)}>Lewati</Button>
                  </div>
                </>
              )}
              {stage.step === "secure" && <SecureChallenge aksi={item.aksi ?? "Amankan temuan"} onDone={finishSecure} />}
            </div>
          )}
          {ended && (
            <LevelEnd
              score={score}
              reason={found >= VIOLATIONS ? "Semua pelanggaran ditemukan" : hud.left <= 0 ? "Waktu habis" : "Inspeksi selesai"}
              detail={`${found}/${VIOLATIONS} pelanggaran · ${securedCount} diamankan · ${quizCorrect} kuis benar · ${docs} dokumen · ${wrongFlags} tuduhan keliru.`}
              onNext={() => onFinish(score)}
            />
          )}
        </>
      }
    >
      <InspectScene
        avatar={avatar}
        input={input}
        running={!paused && !ended}
        frozen={Boolean(stage)}
        decided={decided}
        secured={secured}
        bonus={bonus}
        taken={taken}
        revealUntil={revealUntil}
        playerRef={player}
        droneRef={droneRef}
        bodyRef={bodyRef}
        onTick={tick}
        onNear={setNearId}
        onInspect={(id) => {
          sound("interact");
          setStage({ id, step: "decide" });
        }}
        onScan={scan}
        onCaught={() => {
          clock.current.left = Math.max(0, clock.current.left - 8);
          sound("error");
          setStage((current) => (current?.step === "secure" ? null : current));
          setToast({ ok: false, judul: "Tertangkap sorotan drone! (−8 detik)", teks: "Jongkok (C) atau berlindung di balik meja agar tidak terlihat." });
        }}
        onPickup={pickup}
        onStep={() => sound("step")}
      />
    </WorldStage>
  );
}

/* ------------------------------------------------------------------ */
/* Level 2 · Firewall Defender                                        */
/* ------------------------------------------------------------------ */

const FIREWALL_TIME = 75;
const FIREWALL_LIVES = 3;
const LANES = [-3, 0, 3];
const SPAWN_Z = -15;
const FIREWALL_Z = 4.2;

/** Tempo naik bertahap: santai → sedang → cepat. */
function firewallPace(elapsed: number) {
  if (elapsed < 20) return { speed: 2.2, gap: 3.2 };
  if (elapsed < 45) return { speed: 3, gap: 2.3 };
  return { speed: 3.8, gap: 1.7 };
}

type LivePacket = { uid: number; packet: FirewallPacket; lane: number; blocked: boolean };

/** Kamera diam; mundur lebih jauh di layar potret agar ketiga jalur tetap terlihat. */
function FirewallCamera() {
  const { camera, size } = useThree();
  const far = size.width / size.height < 1 ? 1.55 : 1;
  useEffect(() => {
    camera.position.set(0, 14 * far, 12 * far);
    camera.lookAt(0, 0, -3.5);
  }, [camera, far]);
  return null;
}

const NetworkRoom = memo(function NetworkRoom() {
  const length = FIREWALL_Z - SPAWN_Z;
  return (
    <>
      <DataCenterHall lanes={LANES} laneFrom={SPAWN_Z} laneTo={FIREWALL_Z} />
      {/* kabel jalur data */}
      {LANES.map((x) => (
        <group key={x}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, SPAWN_Z + length / 2]}>
            <planeGeometry args={[1.6, length]} />
            <meshStandardMaterial color="#1f2b44" roughness={0.5} metalness={0.2} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.03, SPAWN_Z + length / 2]}>
            <planeGeometry args={[0.08, length]} />
            <meshBasicMaterial color="#3fd0ff" toneMapped={false} />
          </mesh>
        </group>
      ))}
      {/* gerbang asal lalu lintas */}
      <group position={[0, 0, SPAWN_Z - 0.6]}>
        {[-5.2, 5.2].map((x) => (
          <mesh key={x} position={[x, 1.6, 0]} castShadow>
            <boxGeometry args={[0.5, 3.2, 0.5]} />
            <meshStandardMaterial color="#3a4660" />
          </mesh>
        ))}
        <mesh position={[0, 3.3, 0]}>
          <boxGeometry args={[10.9, 0.4, 0.5]} />
          <meshStandardMaterial color="#3a4660" emissive="#3fd0ff" emissiveIntensity={0.3} />
        </mesh>
        <Label position={[0, 4.1, 0]} distanceFactor={16}>INTERNET · KANTOR</Label>
      </group>
      {/* garis firewall: titik keputusan terakhir sebelum server */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, FIREWALL_Z]}>
        <planeGeometry args={[10, 0.25]} />
        <meshBasicMaterial color="#ffb347" toneMapped={false} />
      </mesh>
      <pointLight position={[0, 3, -4]} color="#7cc4ff" intensity={16} distance={18} decay={1.4} />
    </>
  );
});

function ServerRack({ flashRef }: { flashRef: RefObject<number> }) {
  const body = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((_, raw) => {
    flashRef.current = Math.max(0, flashRef.current - clampDelta(raw) * 1.6);
    if (body.current) body.current.emissiveIntensity = flashRef.current * 1.4;
  });
  return (
    <group position={[0, 0, FIREWALL_Z + 2]}>
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[9, 1.6, 1.2]} />
        <meshStandardMaterial ref={body} color="#4a5366" emissive="#ff2b2b" emissiveIntensity={0} metalness={0.3} roughness={0.5} />
      </mesh>
      {[-3.4, -1.7, 0, 1.7, 3.4].map((x) =>
        [0.45, 0.8, 1.15].map((y) => (
          <mesh key={`${x}:${y}`} position={[x, y, 0.61]}>
            <boxGeometry args={[1.2, 0.08, 0.02]} />
            <meshBasicMaterial color={(x + y) % 2 === 0 ? "#ffd166" : "#39e67a"} toneMapped={false} />
          </mesh>
        ))
      )}
      <Label position={[0, 2.2, 0]} className="is-gold" distanceFactor={16}>SERVER DB PELANGGAN</Label>
    </group>
  );
}

function PacketNode({
  item,
  running,
  speedRef,
  onBlock,
  onArrive,
  onGone,
}: {
  item: LivePacket;
  running: boolean;
  speedRef: RefObject<number>;
  onBlock: (uid: number) => void;
  onArrive: (uid: number) => void;
  onGone: (uid: number) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const z = useRef(SPAWN_Z);
  const fade = useRef(1);
  const done = useRef(false);
  const x = LANES[item.lane];

  useFrame(({ clock }, raw) => {
    const g = group.current;
    if (!g) return;
    const delta = clampDelta(raw);
    if (item.blocked) {
      fade.current = Math.max(0, fade.current - delta * 3.5);
      g.scale.setScalar(1 + (1 - fade.current) * 1.2);
      if (material.current) material.current.opacity = fade.current;
      if (fade.current === 0 && !done.current) {
        done.current = true;
        onGone(item.uid);
      }
      return;
    }
    if (!running) return;
    z.current += speedRef.current * delta;
    g.position.set(x, 0.7 + Math.sin(clock.elapsedTime * 4 + item.uid) * 0.08, z.current);
    if (core.current) core.current.rotation.y += delta * 2;
    if (z.current >= FIREWALL_Z && !done.current) {
      done.current = true;
      onArrive(item.uid);
    }
  });

  const block = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    onBlock(item.uid);
  };

  return (
    <group ref={group} position={[x, 0.7, SPAWN_Z]}>
      <mesh ref={core} onPointerDown={block}>
        <octahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial
          ref={material}
          color={item.blocked ? "#ffd166" : "#7cc4ff"}
          emissive={item.blocked ? "#ffb347" : "#3fd0ff"}
          emissiveIntensity={0.8}
          transparent
          flatShading
        />
      </mesh>
      {!item.blocked && (
        <Html position={[0, 1.2, 0]} center zIndexRange={[20, 0]}>
          <button type="button" className="firewall-packet" onPointerDown={block}>
            <small>{item.packet.jam} · {item.packet.pengguna}</small>
            <strong>{item.packet.aksi}</strong>
          </button>
        </Html>
      )}
    </group>
  );
}

function FirewallScene({
  avatar,
  running,
  packets,
  speedRef,
  flashRef,
  onTick,
  onBlock,
  onArrive,
  onGone,
}: {
  avatar: WorldLevelProps["avatar"];
  running: boolean;
  packets: LivePacket[];
  speedRef: RefObject<number>;
  flashRef: RefObject<number>;
  onTick: (delta: number) => void;
  onBlock: (uid: number) => void;
  onArrive: (uid: number) => void;
  onGone: (uid: number) => void;
}) {
  const motion = useRef<CharacterMotion>({ phase: 0, moving: false });
  useFrame((_, raw) => {
    if (running) onTick(clampDelta(raw));
  });
  return (
    <>
      <FirewallCamera />
      <DataCenterLights />
      <fog attach="fog" args={["#1b2230", 40, 90]} />
      <NetworkRoom />
      <Technician avatar={avatar === "arga" ? "nara" : "arga"} path={[[-10.2, -17], [-10.2, 4]]} />
      <Technician avatar={avatar === "arga" ? "nara" : "arga"} path={[[10.2, 3], [10.2, -16]]} delay={4} />
      <ServerRack flashRef={flashRef} />
      <group position={[5.2, 0, FIREWALL_Z - 0.6]} rotation={[0, Math.PI * 0.85, 0]}>
        <CharacterModel avatar={avatar} motion={motion} />
      </group>
      {packets.map((item) => (
        <PacketNode key={item.uid} item={item} running={running} speedRef={speedRef} onBlock={onBlock} onArrive={onArrive} onGone={onGone} />
      ))}
    </>
  );
}

export function FirewallLevel({ levelIndex, info, paused, quality, avatar, sound, onPause, onFinish }: WorldLevelProps) {
  // Paket diundi ulang setiap level dimulai / diulang.
  const [pool] = useState(drawPackets);
  const live = useRef({ left: FIREWALL_TIME, elapsed: 0, spawnIn: 0.8, uid: 0, lastLane: -1, lives: FIREWALL_LIVES, ended: false, deck: [] as FirewallPacket[] });
  const speedRef = useRef(firewallPace(0).speed);
  const flashRef = useRef(0);
  const byUid = useRef(new Map<number, LivePacket>());
  const handled = useRef(new Set<number>());
  const [phase, setPhase] = useState<"intro" | "play" | "done">("intro");
  const [left, setLeft] = useState(FIREWALL_TIME);
  const push = useThrottled(setLeft, 6);
  const [packets, setPackets] = useState<LivePacket[]>([]);
  const [lives, setLives] = useState(FIREWALL_LIVES);
  const [combo, setCombo] = useState(0);
  const [stats, setStats] = useState({ blocked: 0, passed: 0, wrongBlock: 0, leaked: 0 });
  const [toast, setToast] = useState<Feedback>(null);
  const resolved = stats.blocked + stats.passed + stats.wrongBlock + stats.leaked;
  const score = resolved ? clampPercent(((stats.blocked + stats.passed) / resolved) * 100 - stats.leaked * 5) : 0;

  const finish = () => {
    const s = live.current;
    if (s.ended) return;
    s.ended = true;
    sound(s.lives > 0 ? "success" : "error");
    setPhase("done");
  };

  const spawn = () => {
    const s = live.current;
    if (s.deck.length === 0) s.deck = shuffle(pool);
    const packet = s.deck.pop()!;
    const lanes = [0, 1, 2].filter((lane) => lane !== s.lastLane);
    const lane = lanes[Math.floor(Math.random() * lanes.length)];
    s.lastLane = lane;
    const item: LivePacket = { uid: ++s.uid, packet, lane, blocked: false };
    byUid.current.set(item.uid, item);
    setPackets((current) => [...current, item]);
  };

  const tick = (delta: number) => {
    const s = live.current;
    s.left = Math.max(0, s.left - delta);
    s.elapsed += delta;
    const pace = firewallPace(s.elapsed);
    speedRef.current = pace.speed;
    s.spawnIn -= delta;
    if (s.spawnIn <= 0 && s.left > 3) {
      s.spawnIn = pace.gap;
      spawn();
    }
    push(s.left, s.left <= 0);
    if (s.left <= 0) finish();
  };

  const block = (uid: number) => {
    const item = byUid.current.get(uid);
    if (phase !== "play" || paused || !item || handled.current.has(uid)) return;
    handled.current.add(uid);
    setPackets((current) => current.map((entry) => (entry.uid === uid ? { ...entry, blocked: true } : entry)));
    const { packet } = item;
    if (packet.bahaya) {
      setStats((current) => ({ ...current, blocked: current.blocked + 1 }));
      setCombo((value) => value + 1);
      sound("success");
      setToast({ ok: true, judul: `Diblokir: ${packet.aksi}`, teks: packet.alasan, konsep: packet.konsep });
    } else {
      live.current.left = Math.max(0, live.current.left - 3);
      setStats((current) => ({ ...current, wrongBlock: current.wrongBlock + 1 }));
      setCombo(0);
      sound("error");
      setToast({ ok: false, judul: "Itu aktivitas normal! (−3 detik)", teks: `${packet.pengguna}: ${packet.alasan}`, konsep: packet.konsep });
    }
  };

  const arrive = (uid: number) => {
    const item = byUid.current.get(uid);
    setPackets((current) => current.filter((entry) => entry.uid !== uid));
    if (!item || handled.current.has(uid)) return;
    handled.current.add(uid);
    const { packet } = item;
    if (!packet.bahaya) {
      setStats((current) => ({ ...current, passed: current.passed + 1 }));
      setCombo((value) => value + 1);
      return;
    }
    const s = live.current;
    s.lives -= 1;
    flashRef.current = 1;
    setLives(s.lives);
    setStats((current) => ({ ...current, leaked: current.leaked + 1 }));
    setCombo(0);
    sound("error");
    setToast({ ok: false, judul: `Server kebobolan: ${packet.aksi}`, teks: packet.alasan, konsep: packet.konsep });
    if (s.lives <= 0) finish();
  };

  const gone = (uid: number) => {
    setPackets((current) => current.filter((entry) => entry.uid !== uid));
  };

  return (
    <WorldStage
      quality={quality}
      paused={paused || phase === "done"}
      background="#1b2230"
      overlay={
        <>
          <WorldHud
            levelIndex={levelIndex}
            info={info}
            onPause={onPause}
            toast={phase === "play" ? toast : null}
            stats={
              <>
                <HudChip tone={left <= 10 ? "red" : "dark"} pulse={left <= 10}><IconTimer />{Math.ceil(left)}s</HudChip>
                <HudChip>{Array.from({ length: FIREWALL_LIVES }, (_, i) => <IconHeart key={i} className={i < lives ? "fill-current text-track-audit" : "opacity-30"} />)}</HudChip>
                <HudChip tone="gold"><IconThreat />{stats.blocked} diblokir</HudChip>
                {combo > 1 && <HudChip tone="green"><IconBolt />Combo x{combo}</HudChip>}
              </>
            }
          />
          {phase === "intro" && (
            <div className="world-overlay-card mission-pop">
              <p className="flex items-center gap-2 text-xs font-black tracking-[0.15em] text-muted-foreground">CARA MAIN</p>
              <p className="mt-1 text-lg font-black">Kamu penjaga firewall server database</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Paket data meluncur menuju server. Baca labelnya, lalu <b className="text-foreground">klik/ketuk paket yang mencurigakan</b> untuk memblokirnya. Aktivitas normal biarkan lewat.
              </p>
              <div className="mt-3 grid gap-2 text-sm">
                <div className="flex items-center gap-2 rounded-2xl bg-track-audit-soft p-2.5">
                  <span className="flex-1"><b>lala.intern</b> · Ekspor 12.000 data → USB</span>
                  <span className="rounded-full bg-track-audit px-2 py-0.5 text-xs font-black text-white">BLOKIR</span>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-2.5">
                  <span className="flex-1"><b>hendra.gdg</b> · Cek stok semen 08.40</span>
                  <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-black text-white">BIARKAN</span>
                </div>
              </div>
              <p className="mt-3 text-xs font-bold leading-relaxed">Curigai jika: peran tidak cocok · jam aneh tanpa izin · data dalam jumlah besar · akun tidak wajar.</p>
              <p className="mt-1 text-xs text-muted-foreground">Kalau {FIREWALL_LIVES} paket berbahaya lolos, server jebol!</p>
              <Button
                className="mt-3 w-full"
                onClick={() => {
                  sound("interact");
                  setPhase("play");
                }}
              >
                Mulai jaga
              </Button>
            </div>
          )}
          {phase === "done" && (
            <LevelEnd
              score={score}
              reason={lives <= 0 ? "Server kebobolan" : "Shift jaga selesai"}
              detail={`${stats.blocked} ancaman diblokir · ${stats.passed} aktivitas normal diloloskan · ${stats.wrongBlock} salah blokir · ${stats.leaked} lolos ke server.`}
              onNext={() => onFinish(score)}
            />
          )}
        </>
      }
    >
      <FirewallScene
        avatar={avatar}
        running={!paused && phase === "play"}
        packets={packets}
        speedRef={speedRef}
        flashRef={flashRef}
        onTick={tick}
        onBlock={block}
        onArrive={arrive}
        onGone={gone}
      />
    </WorldStage>
  );
}
