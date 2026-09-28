"use client";

import { memo, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ArenaEnemyKind } from "@/lib/data/worlds";
import { clampDelta, Label } from "../world-kit";

/**
 * Model visual level Serbuan Peretas: aula data center tertutup, klaster
 * server di tengah, staf & peretas yang bervariasi, bos "Trojan Core", dan
 * peluru. Semua animasi membaca state simulasi lewat ref (tanpa setState).
 */

export const ARENA_R = 12;
export const SERVER = { x: 0, z: -1.5, r: 1.7 };
const HALL_R = 20;

export type ModelUnit = { uid: number; kind: ArenaEnemyKind | "staf"; variant: number; t: number; flash: number };
export type ModelShot = { x: number; z: number; vx: number; vz: number; on: boolean };
export type ModelBoss = { active: boolean; phase: number; mode: string; x: number; z: number; vx: number; vz: number; flash: number; timer: number };
export type ArenaVisualState = { serverFlash: number; serverHp: number; boss: ModelBoss; shots: ModelShot[]; bossShots: ModelShot[] };

function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void, repeat?: [number, number]) {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  draw(ctx);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  if (repeat) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeat[0], repeat[1]);
  }
  return texture;
}

/* ------------------------------ aula arena ------------------------------ */

function makeArenaFloor() {
  return canvasTexture(
    512,
    512,
    (ctx) => {
      ctx.fillStyle = "#1a2336";
      ctx.fillRect(0, 0, 512, 512);
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          ctx.fillStyle = (x * 7 + y * 3) % 5 === 0 ? "#1f2a40" : (x + y) % 2 ? "#1c2538" : "#18202f";
          ctx.fillRect(x * 64 + 2, y * 64 + 2, 60, 60);
          if ((x * 5 + y * 11) % 7 === 0) {
            ctx.fillStyle = "rgba(63,208,255,0.18)";
            for (let i = 0; i < 4; i++) ctx.fillRect(x * 64 + 10, y * 64 + 12 + i * 11, 20 + ((x + i) % 3) * 10, 3);
          }
        }
      }
      ctx.fillStyle = "rgba(63,208,255,0.55)";
      for (let y = 0; y <= 8; y++) for (let x = 0; x <= 8; x++) ctx.fillRect(x * 64 - 2, y * 64 - 2, 4, 4);
    },
    [6, 6]
  );
}

function makeGrating() {
  return canvasTexture(
    128,
    128,
    (ctx) => {
      ctx.fillStyle = "#0f1420";
      ctx.fillRect(0, 0, 128, 128);
      ctx.strokeStyle = "#232c3d";
      ctx.lineWidth = 3;
      for (let i = -128; i < 256; i += 16) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 128, 128);
        ctx.stroke();
      }
      ctx.strokeStyle = "#2b3549";
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, 128, 128);
    },
    [18, 18]
  );
}

function makeWallTexture() {
  return canvasTexture(
    256,
    512,
    (ctx) => {
      const grad = ctx.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0, "#070a12");
      grad.addColorStop(0.55, "#141b2b");
      grad.addColorStop(1, "#1d2638");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 512);
      ctx.strokeStyle = "#0a0e17";
      ctx.lineWidth = 4;
      for (let y = 200; y < 512; y += 78) {
        ctx.strokeRect(6, y, 118, 72);
        ctx.strokeRect(132, y, 118, 72);
      }
      ctx.fillStyle = "#3fd0ff";
      ctx.fillRect(124, 180, 8, 332);
      ctx.fillStyle = "rgba(63,208,255,0.25)";
      ctx.fillRect(116, 180, 24, 332);
      ctx.fillStyle = "#ff4f8b";
      ctx.fillRect(0, 170, 256, 5);
    },
    [16, 1]
  );
}

function makeAlertScreen(seed: number) {
  return canvasTexture(512, 256, (ctx) => {
    ctx.fillStyle = "#060b16";
    ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = seed % 2 ? "#ff4f8b" : "#3fd0ff";
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 500, 244);
    ctx.font = "bold 34px monospace";
    ctx.fillStyle = seed % 2 ? "#ff4f8b" : "#ffd166";
    ctx.fillText(seed % 2 ? "⚠ INTRUSION DETECTED" : "FIREWALL · ONLINE", 26, 58);
    ctx.font = "18px monospace";
    let s = seed * 97 + 13;
    for (let i = 0; i < 8; i++) {
      s = (s * 16807) % 2147483647;
      ctx.fillStyle = i % 3 === 0 ? "#ff8fa3" : "#7fd8ff";
      ctx.fillText(`${(s % 9000) + 1000}.${i}  ${["LOGIN FAIL", "PORT SCAN", "USB MOUNT", "ACCESS DENY", "PATCH OK"][s % 5]}  0x${(s % 65535).toString(16)}`, 26, 96 + i * 19);
    }
  });
}

const INNER_RACKS = Array.from({ length: 22 }, (_, i) => (i / 22) * Math.PI * 2);
const OUTER_RACKS = Array.from({ length: 28 }, (_, i) => ((i + 0.5) / 28) * Math.PI * 2);
const WALL_SCREENS = [Math.PI, Math.PI * 0.7, Math.PI * 1.3, Math.PI * 0.42, Math.PI * 1.58];
export const PORTAL_ANGLES = [0.4, 1.6, 2.7, 3.7, 4.8, 5.8];
const RACK_LED = ["#3fd0ff", "#39e67a", "#3fd0ff", "#ffb347"];

function Rack({ angle, radius, height, tint }: { angle: number; radius: number; height: number; tint: string }) {
  return (
    <group position={[Math.sin(angle) * radius, 0, Math.cos(angle) * radius]} rotation={[0, angle, 0]}>
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[2.3, height, 1.2]} />
        <meshStandardMaterial color={tint} metalness={0.55} roughness={0.4} />
      </mesh>
      <mesh position={[0, height / 2, -0.61]}>
        <planeGeometry args={[2, height - 0.4]} />
        <meshStandardMaterial color="#0b1220" metalness={0.8} roughness={0.2} side={THREE.DoubleSide} />
      </mesh>
      {Array.from({ length: Math.floor(height / 0.45) }, (_, i) => (
        <mesh key={i} position={[-0.35 + (i % 3) * 0.3, 0.45 + i * 0.42, -0.63]}>
          <boxGeometry args={[1.2 - (i % 2) * 0.4, 0.05, 0.02]} />
          <meshBasicMaterial color={RACK_LED[(i + Math.round(angle * 10)) % RACK_LED.length]} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function Portal({ angle }: { angle: number }) {
  const ring = useRef<THREE.Group>(null);
  const beam = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (ring.current) ring.current.rotation.y = clock.elapsedTime * 1.4 + angle;
    if (beam.current) beam.current.opacity = 0.12 + Math.sin(clock.elapsedTime * 3 + angle * 4) * 0.05;
  });
  const r = ARENA_R - 0.9;
  return (
    <group position={[Math.sin(angle) * r, 0, Math.cos(angle) * r]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <circleGeometry args={[0.8, 32]} />
        <meshBasicMaterial color="#2a0a1a" />
      </mesh>
      <group ref={ring}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <ringGeometry args={[0.6, 0.82, 6]} />
          <meshBasicMaterial color="#ff4f8b" toneMapped={false} />
        </mesh>
      </group>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.45, 0.72, 1.4, 20, 1, true]} />
        <meshBasicMaterial ref={beam} color="#ff4f8b" transparent opacity={0.18} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

/** Aula data center melingkar tertutup: dinding tinggi, dua lapis rak, layar peringatan — tidak ada tepi dunia. */
export const ArenaHall = memo(function ArenaHall() {
  const floor = useMemo(() => makeArenaFloor(), []);
  const grating = useMemo(() => makeGrating(), []);
  const wall = useMemo(() => makeWallTexture(), []);
  const screens = useMemo(() => WALL_SCREENS.map((_, i) => makeAlertScreen(i + 1)), []);
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial color="#05070d" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <ringGeometry args={[ARENA_R, HALL_R + 0.5, 96]} />
        <meshStandardMaterial map={grating} color={grating ? "#ffffff" : "#121826"} roughness={0.8} metalness={0.4} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[ARENA_R, 72]} />
        <meshStandardMaterial map={floor} color={floor ? "#ffffff" : "#1c2538"} roughness={0.55} metalness={0.3} />
      </mesh>
      {[4, 7.5].map((r) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
          <ringGeometry args={[r - 0.05, r + 0.05, 96]} />
          <meshBasicMaterial color="#3fd0ff" transparent opacity={0.22} toneMapped={false} />
        </mesh>
      ))}
      {/* pagar energi tepi arena */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[ARENA_R - 0.22, ARENA_R, 120]} />
        <meshBasicMaterial color="#ff4f8b" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[ARENA_R, ARENA_R, 0.7, 120, 1, true]} />
        <meshBasicMaterial color="#ff4f8b" transparent opacity={0.12} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {INNER_RACKS.map((angle) => (
        <Rack key={angle} angle={angle} radius={ARENA_R + 1.7} height={2.6} tint="#1c2331" />
      ))}
      {OUTER_RACKS.map((angle) => (
        <Rack key={angle} angle={angle} radius={HALL_R - 3} height={4.2} tint="#161c28" />
      ))}
      {/* dinding aula tinggi: BackSide supaya dinding dekat kamera tidak menghalangi */}
      <mesh position={[0, 14, 0]}>
        <cylinderGeometry args={[HALL_R, HALL_R, 28, 64, 1, true]} />
        <meshStandardMaterial map={wall} color={wall ? "#ffffff" : "#141b2b"} side={THREE.BackSide} roughness={0.9} />
      </mesh>
      {WALL_SCREENS.map((angle, i) => (
        <mesh key={angle} position={[Math.sin(angle) * (HALL_R - 0.3), 7.5, Math.cos(angle) * (HALL_R - 0.3)]} rotation={[0, angle + Math.PI, 0]}>
          <planeGeometry args={[7, 3.5]} />
          <meshBasicMaterial map={screens[i]} color={screens[i] ? "#ffffff" : "#0b1830"} toneMapped={false} />
        </mesh>
      ))}
      {PORTAL_ANGLES.map((angle) => (
        <Portal key={angle} angle={angle} />
      ))}
      <pointLight position={[0, 6, -1.5]} color="#7cc4ff" intensity={34} distance={24} decay={1.4} />
      <pointLight position={[0, 5, 14]} color="#ff4f8b" intensity={10} distance={16} decay={1.6} />
    </>
  );
});

/* ------------------------------ klaster server ------------------------------ */

const CABINETS: [number, number][] = [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]];
const CABLES: [number, number][] = [[-0.35, -0.35], [0.35, -0.3], [-0.3, 0.35], [0.35, 0.35]];

function paintServer(state: ArenaVisualState, delta: number, t: number, body: THREE.MeshStandardMaterial, leds: THREE.MeshBasicMaterial[], holoMat: THREE.MeshBasicMaterial) {
  state.serverFlash = Math.max(0, state.serverFlash - delta * 2.5);
  body.emissive.set("#ff2b2b");
  body.emissiveIntensity = state.serverFlash * 1.4;
  leds.forEach((mat, i) => {
    const on = Math.sin(t * (6 + i * 3) + i) > -0.2;
    mat.color.set(state.serverHp < 35 && i !== 2 ? (on ? "#ff4f4f" : "#401010") : on ? ["#39e67a", "#3fd0ff", "#ffb347"][i] : "#12301f");
  });
  holoMat.color.set(state.serverHp < 35 ? "#ff4f4f" : state.serverHp < 65 ? "#ffb347" : "#3fd0ff");
}

export function ServerCluster({ stateRef }: { stateRef: RefObject<ArenaVisualState> }) {
  const body = useMemo(() => new THREE.MeshStandardMaterial({ color: "#232b3b", metalness: 0.6, roughness: 0.35, emissive: new THREE.Color("#000000") }), []);
  const leds = useMemo(() => ["#39e67a", "#3fd0ff", "#ffb347"].map((color) => new THREE.MeshBasicMaterial({ color, toneMapped: false })), []);
  const holo = useRef<THREE.Group>(null);
  const holoMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#3fd0ff", transparent: true, opacity: 0.55, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending }), []);
  useFrame(({ clock }, raw) => {
    const t = clock.elapsedTime;
    paintServer(stateRef.current, clampDelta(raw), t, body, leds, holoMat);
    if (holo.current) {
      holo.current.rotation.y = t * 0.8;
      holo.current.position.y = 3.9 + Math.sin(t * 2) * 0.12;
    }
  });
  return (
    <group position={[SERVER.x, 0, SERVER.z]}>
      {/* panggung dengan garis bahaya */}
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <cylinderGeometry args={[SERVER.r + 0.45, SERVER.r + 0.6, 0.3, 8]} />
        <meshStandardMaterial color="#2c3547" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 8]} position={[0, 0.31, 0]}>
        <ringGeometry args={[SERVER.r + 0.15, SERVER.r + 0.38, 8]} />
        <meshBasicMaterial color="#ffd166" toneMapped={false} />
      </mesh>
      {CABINETS.map(([x, z]) => (
        <group key={`${x}:${z}`} position={[x, 0.3, z]} rotation={[0, Math.atan2(x, z), 0]}>
          <mesh position={[0, 1.3, 0]} material={body} castShadow>
            <boxGeometry args={[1.1, 2.6, 1.1]} />
          </mesh>
          <mesh position={[0, 1.3, 0.56]}>
            <planeGeometry args={[0.95, 2.4]} />
            <meshStandardMaterial color="#0a1220" metalness={0.9} roughness={0.15} />
          </mesh>
          {Array.from({ length: 9 }, (_, i) => (
            <group key={i} position={[0, 0.3 + i * 0.25, 0.575]}>
              <mesh>
                <boxGeometry args={[0.85, 0.16, 0.02]} />
                <meshStandardMaterial color="#1b2536" />
              </mesh>
              <mesh position={[-0.3, 0, 0.015]} material={leds[i % 3]}>
                <boxGeometry args={[0.06, 0.05, 0.01]} />
              </mesh>
              <mesh position={[-0.2, 0, 0.015]} material={leds[(i + 1) % 3]}>
                <boxGeometry args={[0.06, 0.05, 0.01]} />
              </mesh>
              <mesh position={[0.15, 0, 0.015]}>
                <boxGeometry args={[0.45, 0.03, 0.01]} />
                <meshBasicMaterial color="#3fd0ff" transparent opacity={0.35} toneMapped={false} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
      {/* bundel kabel menuju langit-langit */}
      {CABLES.map(([x, z], i) => (
        <mesh key={i} position={[x, 7.6, z]}>
          <cylinderGeometry args={[0.09, 0.09, 9.8, 8]} />
          <meshStandardMaterial color={["#1f6feb", "#e54b4b", "#39e67a", "#ffd166"][i]} roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 3.05, 0]}>
        <boxGeometry args={[2.5, 0.12, 2.5]} />
        <meshStandardMaterial color="#394257" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* hologram ikon database */}
      <group ref={holo} position={[0, 3.9, 0]}>
        {[0, 0.34, 0.68].map((y) => (
          <mesh key={y} position={[0, y, 0]} material={holoMat}>
            <cylinderGeometry args={[0.55, 0.55, 0.26, 24]} />
          </mesh>
        ))}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.34, 0]} material={holoMat}>
          <torusGeometry args={[0.95, 0.03, 6, 40]} />
        </mesh>
      </group>
      <Label position={[0, 5.4, 0]} className="is-gold" distanceFactor={14}>SERVER DB</Label>
    </group>
  );
}

/* ------------------------------ staf (hijau) ------------------------------ */

type StaffLook = { shirt: string; pants: string; skin: string; hair: string; style: "short" | "long" | "hijab" | "helmet" | "cap" | "bun"; accent: string; prop: "laptop" | "folder" | "clipboard" | "coffee" | "tablet" | "briefcase"; tie?: string };

const STAFF_LOOKS: StaffLook[] = [
  { shirt: "#3d6fb6", pants: "#27303f", skin: "#f1c7a1", hair: "#2a1d14", style: "short", accent: "#3d6fb6", prop: "laptop" },
  { shirt: "#f4f1ea", pants: "#44516b", skin: "#c68c5a", hair: "#1a1a1a", style: "hijab", accent: "#8e5bb5", prop: "folder" },
  { shirt: "#ff9f1c", pants: "#31445e", skin: "#e0ac7e", hair: "#3b2616", style: "helmet", accent: "#ffd400", prop: "clipboard" },
  { shirt: "#7a4fa0", pants: "#1f2430", skin: "#f6d2b4", hair: "#6b3f22", style: "long", accent: "#7a4fa0", prop: "coffee" },
  { shirt: "#ffffff", pants: "#2f3b52", skin: "#8d5a3b", hair: "#111111", style: "cap", accent: "#1f9d5b", prop: "tablet" },
  { shirt: "#2a2f3a", pants: "#2a2f3a", skin: "#e9b98f", hair: "#222222", style: "short", accent: "#2a2f3a", prop: "briefcase", tie: "#c0392b" },
  { shirt: "#e76f51", pants: "#264653", skin: "#f3cfa9", hair: "#8a4b24", style: "bun", accent: "#e76f51", prop: "laptop" },
  { shirt: "#2a9d8f", pants: "#3b3b4f", skin: "#b67a50", hair: "#0f0f0f", style: "hijab", accent: "#2a9d8f", prop: "tablet" },
];

function StaffProp({ prop }: { prop: StaffLook["prop"] }) {
  if (prop === "laptop") return <mesh rotation={[0.2, 0, 0]}><boxGeometry args={[0.42, 0.04, 0.3]} /><meshStandardMaterial color="#b8c0cc" metalness={0.6} /></mesh>;
  if (prop === "folder") return <mesh rotation={[1.3, 0, 0]}><boxGeometry args={[0.3, 0.04, 0.38]} /><meshStandardMaterial color="#f2c14e" /></mesh>;
  if (prop === "clipboard")
    return (
      <group rotation={[1.1, 0, 0]}>
        <mesh><boxGeometry args={[0.28, 0.03, 0.36]} /><meshStandardMaterial color="#8a5a3b" /></mesh>
        <mesh position={[0, 0.02, 0.02]}><boxGeometry args={[0.24, 0.01, 0.28]} /><meshStandardMaterial color="#ffffff" /></mesh>
      </group>
    );
  if (prop === "coffee") return <mesh><cylinderGeometry args={[0.07, 0.06, 0.16, 10]} /><meshStandardMaterial color="#f4efe6" /></mesh>;
  if (prop === "tablet")
    return (
      <group rotation={[1.2, 0, 0]}>
        <mesh><boxGeometry args={[0.3, 0.02, 0.4]} /><meshStandardMaterial color="#1b1f27" /></mesh>
        <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.26, 0.34]} /><meshBasicMaterial color="#7fd8ff" toneMapped={false} /></mesh>
      </group>
    );
  return <mesh position={[0, -0.18, 0]}><boxGeometry args={[0.38, 0.28, 0.1]} /><meshStandardMaterial color="#4a3324" /></mesh>;
}

function StaffHair({ look }: { look: StaffLook }) {
  if (look.style === "hijab")
    return (
      <>
        <mesh position={[0, 0.02, -0.02]} scale={[1, 1.08, 1]}><sphereGeometry args={[0.25, 16, 12]} /><meshStandardMaterial color={look.accent} /></mesh>
        <mesh position={[0, -0.25, -0.02]}><coneGeometry args={[0.32, 0.36, 16]} /><meshStandardMaterial color={look.accent} /></mesh>
      </>
    );
  if (look.style === "helmet")
    return (
      <>
        <mesh position={[0, 0.07, 0]}><sphereGeometry args={[0.25, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#ffd400" /></mesh>
        <mesh position={[0, 0.07, 0.05]}><cylinderGeometry args={[0.3, 0.3, 0.03, 16]} /><meshStandardMaterial color="#ffd400" /></mesh>
      </>
    );
  if (look.style === "cap")
    return (
      <>
        <mesh position={[0, 0.06, 0]}><sphereGeometry args={[0.235, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={look.accent} /></mesh>
        <mesh position={[0, 0.07, 0.2]}><boxGeometry args={[0.28, 0.03, 0.2]} /><meshStandardMaterial color={look.accent} /></mesh>
      </>
    );
  return (
    <>
      <mesh position={[0, 0.06, -0.02]}><sphereGeometry args={[0.235, 16, 10, 0, Math.PI * 2, 0, Math.PI / 1.9]} /><meshStandardMaterial color={look.hair} /></mesh>
      {look.style === "long" && <mesh position={[0, -0.18, -0.12]}><boxGeometry args={[0.4, 0.45, 0.12]} /><meshStandardMaterial color={look.hair} /></mesh>}
      {look.style === "bun" && <mesh position={[0, 0.2, -0.16]}><sphereGeometry args={[0.1, 10, 8]} /><meshStandardMaterial color={look.hair} /></mesh>}
    </>
  );
}

function StaffLeg({ color }: { color: string }) {
  return (
    <>
      <mesh position={[0, -0.4, 0]} castShadow><boxGeometry args={[0.18, 0.8, 0.2]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0, -0.8, 0.05]}><boxGeometry args={[0.2, 0.1, 0.3]} /><meshStandardMaterial color="#1b1b1f" /></mesh>
    </>
  );
}

/** Staf berakses sah: pakaian & rambut bervariasi, tanda pengenal hijau. */
export function StaffModel({ unit }: { unit: ModelUnit }) {
  const look = STAFF_LOOKS[unit.variant % STAFF_LOOKS.length];
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  useFrame(() => {
    const swing = Math.sin(unit.t * 9) * 0.55;
    if (legL.current) legL.current.rotation.x = swing;
    if (legR.current) legR.current.rotation.x = -swing;
    if (armL.current) armL.current.rotation.x = -swing * 0.8;
  });
  return (
    <group scale={0.95}>
      <group ref={legL} position={[-0.13, 0.82, 0]}>
        <StaffLeg color={look.pants} />
      </group>
      <group ref={legR} position={[0.13, 0.82, 0]}>
        <StaffLeg color={look.pants} />
      </group>
      <mesh position={[0, 1.15, 0]} castShadow><boxGeometry args={[0.56, 0.68, 0.3]} /><meshStandardMaterial color={look.shirt} /></mesh>
      {look.tie && <mesh position={[0, 1.2, 0.16]}><boxGeometry args={[0.08, 0.42, 0.02]} /><meshStandardMaterial color={look.tie} /></mesh>}
      {/* kartu identitas hijau: tanda akses sah */}
      <mesh position={[-0.13, 1.08, 0.16]}><boxGeometry args={[0.14, 0.18, 0.02]} /><meshStandardMaterial color="#1f9d5b" emissive="#39e67a" emissiveIntensity={0.6} /></mesh>
      <group ref={armL} position={[-0.36, 1.42, 0]}>
        <mesh position={[0, -0.3, 0]} castShadow><capsuleGeometry args={[0.08, 0.45, 4, 8]} /><meshStandardMaterial color={look.shirt} /></mesh>
        <mesh position={[0, -0.62, 0]}><sphereGeometry args={[0.08, 8, 6]} /><meshStandardMaterial color={look.skin} /></mesh>
      </group>
      <group position={[0.36, 1.42, 0]} rotation={[-1.1, 0, 0]}>
        <mesh position={[0, -0.3, 0]} castShadow><capsuleGeometry args={[0.08, 0.45, 4, 8]} /><meshStandardMaterial color={look.shirt} /></mesh>
        <group position={[-0.1, -0.62, 0.05]}><StaffProp prop={look.prop} /></group>
      </group>
      <mesh position={[0, 1.54, 0]}><cylinderGeometry args={[0.08, 0.08, 0.1, 8]} /><meshStandardMaterial color={look.skin} /></mesh>
      <group position={[0, 1.78, 0]}>
        <mesh castShadow><sphereGeometry args={[0.22, 16, 12]} /><meshStandardMaterial color={look.skin} /></mesh>
        {[-0.08, 0.08].map((x) => (
          <mesh key={x} position={[x, 0.02, 0.2]}><sphereGeometry args={[0.03, 6, 5]} /><meshBasicMaterial color="#1b1b1f" /></mesh>
        ))}
        <StaffHair look={look} />
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[0.42, 0.52, 28]} />
        <meshBasicMaterial color="#39e67a" transparent opacity={0.8} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ------------------------------ peretas (merah) ------------------------------ */

const ICO_DIRS = (() => {
  const geo = new THREE.IcosahedronGeometry(1, 0);
  const pos = geo.getAttribute("position");
  const seen = new Map<string, THREE.Vector3>();
  for (let i = 0; i < pos.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(pos, i).normalize();
    seen.set(`${v.x.toFixed(2)}:${v.y.toFixed(2)}:${v.z.toFixed(2)}`, v);
  }
  geo.dispose();
  return [...seen.values()];
})();
const UP = new THREE.Vector3(0, 1, 0);
const SPIKES = ICO_DIRS.map((dir) => ({ pos: dir.clone().multiplyScalar(0.46).toArray() as [number, number, number], quat: new THREE.Quaternion().setFromUnitVectors(UP, dir) }));

const VIRUS_TINTS = ["#e54b4b", "#ff3d7f", "#ff6a2b"];
const BOT_TINTS = ["#6d3fb0", "#8a2be2", "#9b2a4a"];
const MAIL_TINTS = ["#fff4d6", "#ffe1e1", "#e8f0ff"];
const GHOST_TINTS = ["#aab4c8", "#c0b3d9", "#9fc2c9"];

function Virus({ unit }: { unit: ModelUnit }) {
  const spin = useRef<THREE.Group>(null);
  const tint = VIRUS_TINTS[unit.variant % VIRUS_TINTS.length];
  const size = 0.85 + (unit.variant % 3) * 0.12;
  useFrame((_, raw) => {
    if (!spin.current) return;
    spin.current.rotation.y += clampDelta(raw) * 3;
    spin.current.rotation.x += clampDelta(raw) * 1.4;
    const pulse = 1 + Math.sin(unit.t * 10) * 0.06;
    spin.current.scale.setScalar(size * pulse);
  });
  return (
    <group position={[0, 0.85, 0]}>
      <group ref={spin}>
        <mesh castShadow><icosahedronGeometry args={[0.4, 1]} /><meshStandardMaterial color={tint} emissive={tint} emissiveIntensity={0.55} flatShading /></mesh>
        {SPIKES.map((spike, i) => (
          <group key={i} position={spike.pos} quaternion={spike.quat}>
            <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.025, 0.04, 0.2, 5]} /><meshStandardMaterial color="#2a0d12" /></mesh>
            <mesh position={[0, 0.22, 0]}><sphereGeometry args={[0.065, 8, 6]} /><meshBasicMaterial color={unit.variant % 2 ? "#ffd166" : "#ffe3ea"} toneMapped={false} /></mesh>
          </group>
        ))}
      </group>
      {unit.variant % 3 === 2 && (
        <mesh position={[0, -0.05, -0.6]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.2, 0.34, 0.1]} />
          <meshStandardMaterial color="#9ca3af" metalness={0.7} />
        </mesh>
      )}
    </group>
  );
}

function SpiderBot({ unit }: { unit: ModelUnit }) {
  const legs = useRef<THREE.Group>(null);
  const tint = BOT_TINTS[unit.variant % BOT_TINTS.length];
  const count = unit.variant % 2 ? 4 : 6;
  useFrame(() => {
    legs.current?.children.forEach((leg, i) => {
      leg.rotation.z = (i % 2 ? 1 : -1) * (Math.sin(unit.t * 14 + i * 1.7) * 0.25);
    });
  });
  return (
    <group position={[0, 0.55, 0]}>
      <mesh castShadow scale={[1, 0.6, 1.2]}><sphereGeometry args={[0.42, 16, 12]} /><meshStandardMaterial color={tint} metalness={0.6} roughness={0.3} /></mesh>
      <mesh position={[0, 0.12, 0.38]} scale={[1, 0.45, 0.4]}><sphereGeometry args={[0.3, 12, 8]} /><meshBasicMaterial color="#ff2b6b" toneMapped={false} /></mesh>
      <mesh position={[0, 0.34, -0.1]}><cylinderGeometry args={[0.02, 0.02, 0.4, 6]} /><meshStandardMaterial color="#cbd5e1" /></mesh>
      {/* kunci palsu di antena: menebak password */}
      <group position={[0, 0.58, -0.1]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.07, 0.02, 6, 12]} /><meshBasicMaterial color="#ffd166" toneMapped={false} /></mesh>
        <mesh position={[0, -0.12, 0]}><boxGeometry args={[0.03, 0.14, 0.03]} /><meshBasicMaterial color="#ffd166" toneMapped={false} /></mesh>
      </group>
      <group ref={legs}>
      {Array.from({ length: count }, (_, i) => {
        const side = i % 2 ? 1 : -1;
        const z = ((Math.floor(i / 2) / (count / 2 - 1)) - 0.5) * 0.7;
        return (
          <group key={i} position={[side * 0.3, 0, z]}>
            <mesh position={[side * 0.25, 0.08, 0]} rotation={[0, 0, side * -0.4]}><boxGeometry args={[0.5, 0.05, 0.05]} /><meshStandardMaterial color="#2a2f3a" /></mesh>
            <mesh position={[side * 0.5, -0.2, 0]}><boxGeometry args={[0.05, 0.5, 0.05]} /><meshStandardMaterial color="#2a2f3a" /></mesh>
          </group>
        );
      })}
      </group>
    </group>
  );
}

function PhishMail({ unit }: { unit: ModelUnit }) {
  const wingL = useRef<THREE.Mesh>(null);
  const wingR = useRef<THREE.Mesh>(null);
  const hook = useRef<THREE.Group>(null);
  const paper = MAIL_TINTS[unit.variant % MAIL_TINTS.length];
  useFrame(() => {
    const flap = Math.sin(unit.t * 18) * 0.7;
    if (wingL.current) wingL.current.rotation.z = 0.3 + flap;
    if (wingR.current) wingR.current.rotation.z = -0.3 - flap;
    if (hook.current) hook.current.rotation.x = Math.sin(unit.t * 5) * 0.3;
  });
  return (
    <group position={[0, 1.15, 0]}>
      <mesh castShadow><boxGeometry args={[0.8, 0.5, 0.1]} /><meshStandardMaterial color={paper} /></mesh>
      <mesh position={[0, 0.08, 0.06]} rotation={[0, 0, Math.PI / 4]} scale={[1, 1, 0.1]}><boxGeometry args={[0.4, 0.4, 0.2]} /><meshStandardMaterial color="#f2a93b" /></mesh>
      <mesh position={[0, 0.02, 0.07]}><circleGeometry args={[0.08, 12]} /><meshBasicMaterial color="#c0392b" /></mesh>
      <mesh ref={wingL} position={[-0.45, 0.1, 0]}>
        <boxGeometry args={[0.5, 0.04, 0.3]} />
        <meshStandardMaterial color="#2a0d18" />
      </mesh>
      <mesh ref={wingR} position={[0.45, 0.1, 0]}>
        <boxGeometry args={[0.5, 0.04, 0.3]} />
        <meshStandardMaterial color="#2a0d18" />
      </mesh>
      {/* kail pancing: phishing memancing korban */}
      <group ref={hook} position={[0, -0.25, 0]}>
        <mesh position={[0, -0.25, 0]}><cylinderGeometry args={[0.008, 0.008, 0.5, 4]} /><meshBasicMaterial color="#e5e7eb" /></mesh>
        <mesh position={[0.05, -0.55, 0]} rotation={[0, 0, Math.PI]}><torusGeometry args={[0.07, 0.015, 6, 12, Math.PI * 1.3]} /><meshStandardMaterial color="#d1d5db" metalness={0.9} /></mesh>
      </group>
    </group>
  );
}

function Ghost({ unit }: { unit: ModelUnit }) {
  const tail = useRef<THREE.Group>(null);
  const tint = GHOST_TINTS[unit.variant % GHOST_TINTS.length];
  useFrame(() => {
    if (tail.current) tail.current.rotation.y = unit.t * 2;
  });
  return (
    <group position={[0, 0.35, 0]}>
      <mesh position={[0, 1.05, 0]} castShadow><sphereGeometry args={[0.42, 18, 14]} /><meshStandardMaterial color={tint} transparent opacity={0.8} emissive="#8fa8ff" emissiveIntensity={0.25} /></mesh>
      <mesh position={[0, 0.55, 0]}><cylinderGeometry args={[0.42, 0.5, 0.9, 18, 1, true]} /><meshStandardMaterial color={tint} transparent opacity={0.7} side={THREE.DoubleSide} /></mesh>
      <group ref={tail} position={[0, 0.1, 0]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[Math.sin((i / 5) * Math.PI * 2) * 0.38, 0, Math.cos((i / 5) * Math.PI * 2) * 0.38]}>
            <sphereGeometry args={[0.13, 8, 6]} />
            <meshStandardMaterial color={tint} transparent opacity={0.65} />
          </mesh>
        ))}
      </group>
      {[-0.14, 0.14].map((x) => (
        <mesh key={x} position={[x, 1.1, 0.38]} scale={[1, 1.4, 1]}><sphereGeometry args={[0.07, 8, 6]} /><meshBasicMaterial color="#0f0f14" /></mesh>
      ))}
      {/* kartu akses kedaluwarsa */}
      <group position={[0, 0.65, 0.45]}>
        <mesh><boxGeometry args={[0.3, 0.22, 0.02]} /><meshStandardMaterial color="#ffffff" /></mesh>
        <mesh position={[0, 0, 0.015]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.25, 0.04, 0.01]} /><meshBasicMaterial color="#e54b4b" /></mesh>
        <mesh position={[0, 0, 0.015]} rotation={[0, 0, -Math.PI / 4]}><boxGeometry args={[0.25, 0.04, 0.01]} /><meshBasicMaterial color="#e54b4b" /></mesh>
      </group>
      {unit.variant % 3 === 1 && <mesh position={[0, 0.85, 0.42]}><boxGeometry args={[0.07, 0.3, 0.02]} /><meshStandardMaterial color="#c0392b" /></mesh>}
      {unit.variant % 3 === 2 && (
        <group position={[0, 1.42, 0]}>
          <mesh><cylinderGeometry args={[0.26, 0.26, 0.2, 14]} /><meshStandardMaterial color="#2a2f3a" /></mesh>
          <mesh position={[0, -0.09, 0]}><cylinderGeometry args={[0.4, 0.4, 0.03, 14]} /><meshStandardMaterial color="#2a2f3a" /></mesh>
        </group>
      )}
    </group>
  );
}

/** Peretas: tiap jenis punya bentuk sendiri, warna/ukuran bervariasi, cincin merah di bawahnya. */
export function ThreatModel({ unit }: { unit: ModelUnit }) {
  return (
    <>
      {unit.kind === "virus" && <Virus unit={unit} />}
      {unit.kind === "bot" && <SpiderBot unit={unit} />}
      {unit.kind === "phish" && <PhishMail unit={unit} />}
      {unit.kind === "yatim" && <Ghost unit={unit} />}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[0.5, 0.62, 24]} />
        <meshBasicMaterial color="#ff2b4b" transparent opacity={0.85} toneMapped={false} />
      </mesh>
    </>
  );
}

/* ------------------------------ bos: Trojan Core ------------------------------ */

const PHASE_GLOW = ["#b14bff", "#ff3dd2", "#ff2b2b"];
const PLATES = Array.from({ length: 6 }, (_, i) => (i / 6) * Math.PI * 2);
const TENTACLES = [0.6, 2.1, 3.7, 5.2];

function paintBoss(glow: THREE.MeshStandardMaterial, iris: THREE.MeshBasicMaterial, color: string, intensity: number, telegraph: boolean) {
  glow.emissive.set(color);
  glow.emissiveIntensity = intensity;
  iris.color.set(telegraph ? "#ffffff" : color);
}

/** Inti mesin peretas melayang: mata raksasa yang melacak pemain, pelat baja mengorbit, sulur kabel. */
export function BossModel({ stateRef, playerRef, active }: { stateRef: RefObject<ArenaVisualState>; playerRef: RefObject<THREE.Group | null>; active: boolean }) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const eye = useRef<THREE.Group>(null);
  const plates = useRef<THREE.Group>(null);
  const shield = useRef<THREE.Mesh>(null);
  const crown = useRef<THREE.Group>(null);
  const ring = useRef<THREE.MeshBasicMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  const segments = useRef<THREE.Group>(null);
  const glow = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2a1840", emissive: new THREE.Color(PHASE_GLOW[0]), emissiveIntensity: 0.9, metalness: 0.6, roughness: 0.3 }), []);
  const iris = useMemo(() => new THREE.MeshBasicMaterial({ color: PHASE_GLOW[0], toneMapped: false }), []);
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }, raw) => {
    const b = stateRef.current.boss;
    const g = root.current;
    if (!g) return;
    g.visible = b.active;
    if (!b.active) return;
    const t = clock.elapsedTime;
    b.flash = Math.max(0, b.flash - clampDelta(raw) * 6);
    const dead = b.mode === "dead";
    g.position.set(b.x, 0, b.z);
    if (body.current) {
      body.current.position.y = dead ? Math.max(-2, 2.6 - b.timer * 2) : 2.6 + Math.sin(t * 1.8) * 0.25;
      body.current.rotation.z = dead ? b.timer * 2 : Math.sin(t * 1.2) * 0.08;
    }
    const telegraph = b.mode === "telegraph" && Math.floor(t * 14) % 2 === 0;
    const color = b.flash > 0 ? "#ffffff" : telegraph ? "#ff2b2b" : PHASE_GLOW[Math.min(b.phase, 2)];
    paintBoss(glow, iris, color, 0.7 + b.flash * 1.5 + (telegraph ? 1 : 0), telegraph);
    if (ring.current) ring.current.color.set(color);
    if (light.current) light.current.color.set(color);
    const p = playerRef.current;
    if (eye.current && p) {
      target.set(p.position.x - b.x, 0, p.position.z - b.z);
      eye.current.rotation.y = Math.atan2(target.x, target.z);
      eye.current.rotation.x = 0.35;
    }
    if (plates.current) {
      plates.current.rotation.y = t * (0.8 + b.phase * 0.5);
      const spread = b.mode === "shield" ? 1.35 : telegraph ? 2.3 : 1.8 + Math.sin(t * 3) * 0.1;
      plates.current.children.forEach((child, i) => {
        const a = PLATES[i];
        child.position.set(Math.sin(a) * spread, Math.sin(t * 2 + i) * 0.2, Math.cos(a) * spread);
      });
    }
    if (crown.current) crown.current.rotation.y = -t * 1.5;
    if (shield.current) shield.current.visible = b.mode === "shield";
    segments.current?.children.forEach((seg, index) => {
      const tentacle = Math.floor(index / 6);
      const k = index % 6;
      const base = TENTACLES[tentacle];
      const sway = Math.sin(t * 2.4 + tentacle * 1.3 + k * 0.6) * (0.15 + k * 0.07);
      const r = 0.9 + k * 0.22;
      seg.position.set(Math.sin(base + sway) * r, -0.5 - k * 0.32, Math.cos(base + sway) * r);
    });
  });

  return (
    <group ref={root} visible={false}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[1.6, 1.95, 48]} />
        <meshBasicMaterial ref={ring} color={PHASE_GLOW[0]} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <circleGeometry args={[1.6, 48]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.45} />
      </mesh>
      <pointLight ref={light} position={[0, 2.6, 0]} color={PHASE_GLOW[0]} intensity={20} distance={9} decay={1.5} />
      <group ref={body} position={[0, 2.6, 0]}>
        {/* inti baja */}
        <mesh castShadow><sphereGeometry args={[1.05, 28, 20]} /><meshStandardMaterial color="#1b1f2b" metalness={0.8} roughness={0.25} /></mesh>
        {[0, Math.PI / 3, -Math.PI / 3].map((r) => (
          <mesh key={r} rotation={[Math.PI / 2, r, 0]} material={glow}>
            <torusGeometry args={[1.07, 0.05, 8, 48]} />
          </mesh>
        ))}
        {/* mata raksasa */}
        <group ref={eye}>
          <mesh position={[0, 0, 0.72]} scale={[1, 1, 0.45]}><sphereGeometry args={[0.62, 24, 16]} /><meshStandardMaterial color="#e8e3f0" roughness={0.2} /></mesh>
          <mesh position={[0, 0, 0.99]} material={iris}><circleGeometry args={[0.34, 32]} /></mesh>
          <mesh position={[0, 0, 1.0]}><circleGeometry args={[0.15, 24]} /><meshBasicMaterial color="#050308" /></mesh>
          <mesh position={[0, 0.62, 0.62]} rotation={[0.9, 0, 0]}><boxGeometry args={[1.1, 0.14, 0.3]} /><meshStandardMaterial color="#0f1118" metalness={0.8} /></mesh>
        </group>
        {/* pelat baja mengorbit */}
        <group ref={plates}>
          {PLATES.map((a) => (
            <mesh key={a} rotation={[0, a, 0]} castShadow material={glow}>
              <boxGeometry args={[0.9, 1.2, 0.14]} />
            </mesh>
          ))}
        </group>
        {/* mahkota duri */}
        <group ref={crown} position={[0, 1.25, 0]}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <mesh key={i} position={[Math.sin((i / 8) * Math.PI * 2) * 0.55, 0, Math.cos((i / 8) * Math.PI * 2) * 0.55]} material={glow}>
              <coneGeometry args={[0.1, 0.45, 5]} />
            </mesh>
          ))}
        </group>
        {/* sulur kabel */}
        <group ref={segments}>
        {TENTACLES.flatMap((_, tentacle) =>
          Array.from({ length: 6 }, (_, k) => (
            <mesh key={`${tentacle}:${k}`} castShadow>
              <sphereGeometry args={[0.2 - k * 0.022, 10, 8]} />
              {k === 5 ? <meshBasicMaterial color="#ff2b6b" toneMapped={false} /> : <meshStandardMaterial color="#232838" metalness={0.7} roughness={0.35} />}
            </mesh>
          ))
        )}
        </group>
        <mesh ref={shield} visible={false}>
          <icosahedronGeometry args={[2.3, 2]} />
          <meshBasicMaterial color="#3fd0ff" transparent opacity={0.28} wireframe toneMapped={false} />
        </mesh>
      </group>
      {active && <Label position={[0, 5.6, 0]} className="is-red" distanceFactor={14}>TROJAN · PERETAS BAYANGAN</Label>}
    </group>
  );
}

/* ------------------------------ peluru ------------------------------ */

/** Peluru patch pemain: baut cahaya emas memanjang searah gerak dengan ekor. */
export function PatchShots({ stateRef, count }: { stateRef: RefObject<ArenaVisualState>; count: number }) {
  const core = useRef<THREE.InstancedMesh>(null);
  const trail = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const coreGeo = useMemo(() => new THREE.CapsuleGeometry(0.08, 0.5, 4, 8).rotateX(Math.PI / 2), []);
  const trailGeo = useMemo(() => new THREE.ConeGeometry(0.14, 1.3, 10, 1, true).rotateX(-Math.PI / 2).translate(0, 0, -0.75), []);
  useFrame(() => {
    const shots = stateRef.current.shots;
    shots.forEach((shot, i) => {
      dummy.position.set(shot.x, 0.95, shot.z);
      dummy.rotation.set(0, Math.atan2(shot.vx, shot.vz), 0);
      dummy.scale.setScalar(shot.on ? 1 : 0);
      dummy.updateMatrix();
      core.current?.setMatrixAt(i, dummy.matrix);
      trail.current?.setMatrixAt(i, dummy.matrix);
    });
    if (core.current) core.current.instanceMatrix.needsUpdate = true;
    if (trail.current) trail.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <>
      <instancedMesh ref={core} args={[coreGeo, undefined, count]} frustumCulled={false}>
        <meshBasicMaterial color="#fff2b0" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={trail} args={[trailGeo, undefined, count]} frustumCulled={false}>
        <meshBasicMaterial color="#ffb700" transparent opacity={0.45} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </instancedMesh>
    </>
  );
}

/** Peluru bos: kristal malware berputar dengan pendar merah muda. */
export function MalwareShots({ stateRef, count }: { stateRef: RefObject<ArenaVisualState>; count: number }) {
  const core = useRef<THREE.InstancedMesh>(null);
  const halo = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    const shots = stateRef.current.bossShots;
    const t = clock.elapsedTime;
    shots.forEach((shot, i) => {
      dummy.position.set(shot.x, 0.95, shot.z);
      dummy.rotation.set(t * 6 + i, t * 4 + i * 0.7, 0);
      dummy.scale.setScalar(shot.on ? 1 : 0);
      dummy.updateMatrix();
      core.current?.setMatrixAt(i, dummy.matrix);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(shot.on ? 1 + Math.sin(t * 12 + i) * 0.15 : 0);
      dummy.updateMatrix();
      halo.current?.setMatrixAt(i, dummy.matrix);
    });
    if (core.current) core.current.instanceMatrix.needsUpdate = true;
    if (halo.current) halo.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <>
      <instancedMesh ref={core} args={[undefined, undefined, count]} frustumCulled={false}>
        <octahedronGeometry args={[0.2, 0]} />
        <meshBasicMaterial color="#ff5fb8" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={halo} args={[undefined, undefined, count]} frustumCulled={false}>
        <sphereGeometry args={[0.36, 12, 10]} />
        <meshBasicMaterial color="#ff2b6b" transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </instancedMesh>
    </>
  );
}
