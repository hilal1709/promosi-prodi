"use client";

import { memo, useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import CharacterModel, { type CharacterMotion } from "@/components/game/character-model";
import type { GameAvatarId } from "@/lib/types";
import { clampDelta } from "../world-kit";

/**
 * Ruang data center untuk level Firewall Defender: aula tertutup (dinding
 * lebih tinggi dari kamera) supaya tepi dunia tidak pernah terlihat, diisi
 * baris rak server, layar pemantau, dan teknisi yang berpatroli.
 */

export const HALL = { x: 15, zBack: -20, zFront: 22, height: 22 };

const RACK_ROWS = [-12.4, -8, 8, 12.4];
const RACK_Z = Array.from({ length: 12 }, (_, i) => -17.2 + i * 2.05);
const RACK = { w: 1.1, h: 2.3, d: 1.9 };
const LED_ROWS = [0.5, 0.85, 1.2, 1.55, 1.9];
const LED_COLORS = ["#39e67a", "#3fd0ff", "#ffb347"];

function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  draw(ctx);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function seeded(seed: number) {
  let value = seed;
  return () => (value = (value * 16807) % 2147483647) / 2147483647;
}

/** Lantai panggung (raised floor) dengan ubin berlubang ventilasi. */
function makeFloorTexture() {
  const texture = canvasTexture(128, 128, (ctx) => {
    ctx.fillStyle = "#8e97a6";
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = "#98a1b0";
    ctx.fillRect(3, 3, 58, 58);
    ctx.fillRect(67, 67, 58, 58);
    ctx.fillStyle = "#7a8393";
    for (let y = 70; y < 124; y += 7) for (let x = 3; x < 60; x += 7) ctx.fillRect(x + 2, y, 3, 3);
    ctx.fillStyle = "#6b7383";
    ctx.fillRect(0, 0, 128, 2);
    ctx.fillRect(0, 63, 128, 2);
    ctx.fillRect(0, 0, 2, 128);
    ctx.fillRect(63, 0, 2, 128);
  });
  if (texture) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set((HALL.x * 2) / 1.2, (HALL.zFront - HALL.zBack) / 1.2);
    texture.anisotropy = 4;
  }
  return texture;
}

function screenFrame(ctx: CanvasRenderingContext2D, w: number, h: number, title: string) {
  ctx.fillStyle = "#0b1426";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(63,208,255,0.12)";
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.fillStyle = "#3fd0ff";
  ctx.font = "bold 22px sans-serif";
  ctx.fillText(title, 18, 34);
}

/** Layar tengah: peta lalu lintas jaringan. */
function makeMapTexture() {
  return canvasTexture(1024, 460, (ctx) => {
    screenFrame(ctx, 1024, 460, "SECURITY OPERATIONS CENTER · LIVE");
    const rand = seeded(11);
    const blobs: [number, number, number, number][] = [[250, 190, 150, 90], [520, 170, 120, 70], [700, 210, 190, 110], [560, 330, 70, 60], [860, 350, 70, 40]];
    ctx.fillStyle = "rgba(124,196,255,0.55)";
    blobs.forEach(([cx, cy, rx, ry]) => {
      for (let i = 0; i < 260; i++) {
        const a = rand() * Math.PI * 2;
        const r = Math.sqrt(rand());
        ctx.fillRect(cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r, 3, 3);
      }
    });
    const home: [number, number] = [735, 290];
    const sources: [number, number, string][] = [[210, 170, "#ff5a5a"], [470, 150, "#ffb347"], [300, 230, "#ff5a5a"], [880, 340, "#39e67a"], [560, 330, "#39e67a"]];
    sources.forEach(([x, y, color]) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo((x + home[0]) / 2, Math.min(y, home[1]) - 90, home[0], home[1]);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "#ffd166";
    ctx.beginPath();
    ctx.arc(home[0], home[1], 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "bold 18px sans-serif";
    ctx.fillText("GRESIK DC", home[0] + 16, home[1] + 6);
    ctx.fillStyle = "#39e67a";
    ctx.fillText("● 1.284 koneksi aman", 18, 430);
    ctx.fillStyle = "#ff5a5a";
    ctx.fillText("● 3 ancaman aktif", 260, 430);
  });
}

/** Layar kiri: grafik lalu lintas yang bergulir (dianimasikan lewat offset). */
function makeGraphTexture() {
  const texture = canvasTexture(512, 300, (ctx) => {
    screenFrame(ctx, 512, 300, "");
    const rand = seeded(5);
    const lines: [string, number][] = [["#3fd0ff", 170], ["#39e67a", 220], ["#ff5a5a", 250]];
    lines.forEach(([color, base]) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      // Titik awal dan akhir sama supaya pola menyambung saat diulang.
      for (let x = 0; x <= 512; x += 16) {
        const y = x === 0 || x === 512 ? base : base - rand() * 90;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
  });
  if (texture) texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

/** Layar kanan: aliran log yang bergulir ke atas. */
function makeLogTexture() {
  const texture = canvasTexture(512, 512, (ctx) => {
    ctx.fillStyle = "#0b1426";
    ctx.fillRect(0, 0, 512, 512);
    const rand = seeded(23);
    const verbs = ["LOGIN OK", "QUERY", "SYNC", "BACKUP", "DENY", "LOGIN FAIL", "EXPORT", "AUTH MFA"];
    ctx.font = "18px monospace";
    for (let i = 0; i < 20; i++) {
      const verb = verbs[Math.floor(rand() * verbs.length)];
      ctx.fillStyle = verb === "DENY" || verb === "LOGIN FAIL" ? "#ff7a7a" : verb === "EXPORT" ? "#ffb347" : "#7fe0a8";
      const hh = String(Math.floor(rand() * 24)).padStart(2, "0");
      const mm = String(Math.floor(rand() * 60)).padStart(2, "0");
      ctx.fillText(`${hh}:${mm}  ${verb.padEnd(10)} 10.4.${Math.floor(rand() * 250)}.${Math.floor(rand() * 250)}`, 16, 24 + i * 25.6);
    }
  });
  if (texture) {
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 0.55);
  }
  return texture;
}

/** Semua rak memakai instancing: badan, panel depan, dan tiga kelompok LED yang berkedip bergantian. */
function RackRows() {
  const bodies = useRef<THREE.InstancedMesh>(null);
  const doors = useRef<THREE.InstancedMesh>(null);
  const leds = useRef<(THREE.InstancedMesh | null)[]>([]);
  const ledMats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const racks = useMemo(() => RACK_ROWS.flatMap((x) => RACK_Z.map((z) => [x, z] as const)), []);
  const ledSpots = useMemo(() => {
    const rand = seeded(3);
    const groups: [number, number, number][][] = [[], [], []];
    racks.forEach(([x, z]) => {
      [-1, 1].forEach((side) => {
        LED_ROWS.forEach((y) => {
          const dz = (rand() - 0.5) * 1.2;
          groups[Math.floor(rand() * 3)].push([x + side * (RACK.w / 2 + 0.012), y, z + dz]);
        });
      });
    });
    return groups;
  }, [racks]);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    racks.forEach(([x, z], i) => {
      m.makeTranslation(x, RACK.h / 2, z);
      bodies.current?.setMatrixAt(i, m);
      m.makeTranslation(x, RACK.h / 2, z);
      doors.current?.setMatrixAt(i, m);
    });
    if (bodies.current) bodies.current.instanceMatrix.needsUpdate = true;
    if (doors.current) doors.current.instanceMatrix.needsUpdate = true;
    ledSpots.forEach((spots, g) => {
      const mesh = leds.current[g];
      if (!mesh) return;
      spots.forEach(([x, y, z], i) => {
        m.makeTranslation(x, y, z);
        mesh.setMatrixAt(i, m);
      });
      mesh.instanceMatrix.needsUpdate = true;
    });
  }, [racks, ledSpots]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    ledMats.current.forEach((mat, g) => {
      if (mat) mat.opacity = 0.35 + 0.65 * (Math.sin(t * (2.2 + g * 1.7) + g * 2) > -0.2 ? 1 : 0.15);
    });
  });

  return (
    <>
      <instancedMesh ref={bodies} args={[undefined, undefined, racks.length]} castShadow receiveShadow>
        <boxGeometry args={[RACK.w, RACK.h, RACK.d]} />
        <meshStandardMaterial color="#353c49" roughness={0.55} metalness={0.3} />
      </instancedMesh>
      {/* pintu depan-belakang berlubang, sedikit lebih terang agar rak tidak tampak seperti balok polos */}
      <instancedMesh ref={doors} args={[undefined, undefined, racks.length]}>
        <boxGeometry args={[RACK.w + 0.02, RACK.h - 0.25, RACK.d - 0.2]} />
        <meshStandardMaterial color="#3a414f" roughness={0.7} metalness={0.2} />
      </instancedMesh>
      {ledSpots.map((spots, g) => (
        <instancedMesh
          key={g}
          ref={(mesh) => {
            leds.current[g] = mesh;
          }}
          args={[undefined, undefined, spots.length]}
        >
          <boxGeometry args={[0.02, 0.05, 0.18]} />
          <meshBasicMaterial
            ref={(mat) => {
              ledMats.current[g] = mat;
            }}
            color={LED_COLORS[g]}
            transparent
            toneMapped={false}
          />
        </instancedMesh>
      ))}
      {/* rak kabel kuning di atas tiap baris */}
      {RACK_ROWS.map((x) => (
        <group key={x} position={[x, RACK.h + 0.55, (RACK_Z[0] + RACK_Z[RACK_Z.length - 1]) / 2]}>
          <mesh>
            <boxGeometry args={[0.7, 0.1, RACK_Z[RACK_Z.length - 1] - RACK_Z[0] + 2]} />
            <meshStandardMaterial color="#e0b42a" roughness={0.6} />
          </mesh>
          {[-0.18, 0, 0.18].map((dx, k) => (
            <mesh key={dx} position={[dx, 0.1, 0]}>
              <boxGeometry args={[0.1, 0.1, RACK_Z[RACK_Z.length - 1] - RACK_Z[0] + 1.8]} />
              <meshStandardMaterial color={["#3b82f6", "#e54b4b", "#f5f5f0"][k]} roughness={0.8} />
            </mesh>
          ))}
          {RACK_Z.filter((_, i) => i % 3 === 0).map((z) => (
            <mesh key={z} position={[0, -0.3, z - (RACK_Z[0] + RACK_Z[RACK_Z.length - 1]) / 2]}>
              <boxGeometry args={[0.05, 0.6, 0.05]} />
              <meshStandardMaterial color="#6b7280" />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

function CoolingUnit({ position, flip }: { position: [number, number, number]; flip: boolean }) {
  return (
    <group position={position} rotation={[0, flip ? Math.PI : 0, 0]}>
      <mesh position={[0, 1.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 2.6, 3]} />
        <meshStandardMaterial color="#d7dbe2" roughness={0.6} />
      </mesh>
      {[0.6, 1.0, 1.4, 1.8, 2.2].map((y) => (
        <mesh key={y} position={[0.71, y, 0]}>
          <boxGeometry args={[0.02, 0.08, 2.6]} />
          <meshStandardMaterial color="#8b94a3" />
        </mesh>
      ))}
      <mesh position={[0.72, 2.45, 0.9]}>
        <boxGeometry args={[0.02, 0.18, 0.5]} />
        <meshBasicMaterial color="#39e67a" toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Butiran data kecil yang terus mengalir di sepanjang kabel jalur. */
function DataStream({ lanes, from, to }: { lanes: number[]; from: number; to: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const count = lanes.length * 12;
  const offsets = useMemo(() => {
    const rand = seeded(9);
    return Array.from({ length: count }, () => rand());
  }, [count]);
  const m = useMemo(() => new THREE.Matrix4(), []);
  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const length = to - from;
    for (let i = 0; i < count; i++) {
      const lane = lanes[i % lanes.length];
      const progress = (offsets[i] + clock.elapsedTime * (0.08 + (i % 3) * 0.02)) % 1;
      m.makeTranslation(lane + (i % 2 ? 0.18 : -0.18), 0.08, from + progress * length);
      mesh.current.setMatrixAt(i, m);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.07, 8, 6]} />
      <meshBasicMaterial color="#9fe8ff" toneMapped={false} />
    </instancedMesh>
  );
}

function VideoWall() {
  const map = useMemo(() => makeMapTexture(), []);
  const graph = useMemo(() => makeGraphTexture(), []);
  const logs = useMemo(() => makeLogTexture(), []);
  const graphMat = useRef<THREE.MeshBasicMaterial>(null);
  const logsMat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((_, raw) => {
    const delta = clampDelta(raw);
    const graphMap = graphMat.current?.map;
    const logsMap = logsMat.current?.map;
    if (graphMap) graphMap.offset.x = (graphMap.offset.x + delta * 0.06) % 1;
    if (logsMap) logsMap.offset.y = (logsMap.offset.y + delta * 0.05) % 1;
  });
  const z = HALL.zBack + 0.4;
  const screen = (
    texture: THREE.Texture | null,
    position: [number, number, number],
    size: [number, number],
    materialRef?: RefObject<THREE.MeshBasicMaterial | null>
  ) => (
    <group position={position}>
      <mesh position={[0, 0, -0.08]}>
        <boxGeometry args={[size[0] + 0.3, size[1] + 0.3, 0.12]} />
        <meshStandardMaterial color="#141820" />
      </mesh>
      <mesh>
        <planeGeometry args={size} />
        <meshBasicMaterial ref={materialRef} map={texture} color={texture ? "#ffffff" : "#0b1426"} toneMapped={false} />
      </mesh>
    </group>
  );
  return (
    <>
      {screen(map, [0, 4.1, z], [9.4, 4.2])}
      {screen(graph, [-8.3, 3.6, z], [5, 2.9], graphMat)}
      {screen(logs, [8.3, 3.6, z], [5, 2.9], logsMat)}
      <pointLight position={[0, 4.5, z + 2.5]} color="#5aa8ff" intensity={18} distance={14} decay={1.5} />
    </>
  );
}

/** Meja operator SOC di bagian depan aula (terlihat di layar potret). */
function OperatorDesk({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.2, 0.1, 1.3]} />
        <meshStandardMaterial color="#e7e2d8" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.37, -0.55]}>
        <boxGeometry args={[4.1, 0.74, 0.08]} />
        <meshStandardMaterial color="#9aa3b2" />
      </mesh>
      {[-1.3, 0, 1.3].map((x) => (
        <group key={x} position={[x, 1.2, -0.35]}>
          <mesh castShadow>
            <boxGeometry args={[1.05, 0.62, 0.06]} />
            <meshStandardMaterial color="#1d2330" />
          </mesh>
          <mesh position={[0, 0, 0.035]}>
            <planeGeometry args={[0.95, 0.52]} />
            <meshBasicMaterial color={x === 0 ? "#3fd0ff" : "#2a6f9e"} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {[-1.1, 1.1].map((x) => (
        <group key={x} position={[x, 0, 0.95]}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[0.6, 0.1, 0.55]} />
            <meshStandardMaterial color="#3d5a80" />
          </mesh>
          <mesh position={[0, 0.85, 0.26]} castShadow>
            <boxGeometry args={[0.6, 0.6, 0.08]} />
            <meshStandardMaterial color="#3d5a80" />
          </mesh>
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.45, 8]} />
            <meshStandardMaterial color="#4b4f58" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Cahaya sejuk ala data center: lampu langit-langit putih-kebiruan dengan bayangan lembut. */
export function DataCenterLights() {
  return (
    <>
      <ambientLight intensity={0.35} color="#dfe8ff" />
      <hemisphereLight intensity={0.9} color="#e4ecff" groundColor="#3a4050" />
      <directionalLight
        castShadow
        position={[6, 20, 8]}
        intensity={1.3}
        color="#f4f8ff"
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={26}
        shadow-camera-bottom={-26}
        shadow-bias={-0.0005}
      />
    </>
  );
}

export const DataCenterHall = memo(function DataCenterHall({ lanes, laneFrom, laneTo }: { lanes: number[]; laneFrom: number; laneTo: number }) {
  const floor = useMemo(() => makeFloorTexture(), []);
  const depth = HALL.zFront - HALL.zBack;
  const midZ = (HALL.zFront + HALL.zBack) / 2;
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, midZ]} receiveShadow>
        <planeGeometry args={[HALL.x * 2, depth]} />
        <meshStandardMaterial map={floor} color={floor ? "#ffffff" : "#8e97a6"} roughness={0.85} />
      </mesh>
      {/* dinding aula lebih tinggi dari kamera: tidak ada tepi dunia yang terlihat */}
      <mesh position={[0, HALL.height / 2, HALL.zBack]} receiveShadow>
        <boxGeometry args={[HALL.x * 2 + 1, HALL.height, 0.4]} />
        <meshStandardMaterial color="#39414f" roughness={0.9} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * HALL.x, HALL.height / 2, midZ]} receiveShadow>
            <boxGeometry args={[0.4, HALL.height, depth]} />
            <meshStandardMaterial color="#4a5263" roughness={0.9} />
          </mesh>
          {/* list bawah dan lampu strip di dinding */}
          <mesh position={[side * (HALL.x - 0.22), 0.6, midZ]}>
            <boxGeometry args={[0.05, 1.2, depth]} />
            <meshStandardMaterial color="#5c6577" />
          </mesh>
          <mesh position={[side * (HALL.x - 0.22), 5.2, midZ]}>
            <boxGeometry args={[0.05, 0.12, depth]} />
            <meshBasicMaterial color="#cfe6ff" toneMapped={false} />
          </mesh>
          <CoolingUnit position={[side * (HALL.x - 0.95), 0, 9.5]} flip={side > 0} />
          <CoolingUnit position={[side * (HALL.x - 0.95), 0, 13.5]} flip={side > 0} />
        </group>
      ))}
      <mesh position={[0, 7.4, HALL.zBack + 0.22]}>
        <boxGeometry args={[HALL.x * 2, 0.12, 0.05]} />
        <meshBasicMaterial color="#cfe6ff" toneMapped={false} />
      </mesh>
      <VideoWall />
      <RackRows />
      <OperatorDesk position={[-4.5, 0, 11]} />
      <OperatorDesk position={[4.5, 0, 11]} />
      <DataStream lanes={lanes} from={laneFrom} to={laneTo} />
    </>
  );
});

type PatrolState = { leg: number; wait: number; x: number; z: number };

/** Teknisi yang berjalan bolak-balik di lorong rak dan berhenti memeriksa rak. */
export function Technician({ avatar, path, delay = 0 }: { avatar: GameAvatarId; path: [number, number][]; delay?: number }) {
  const group = useRef<THREE.Group>(null);
  const motion = useRef<CharacterMotion>({ phase: 0, moving: false });
  const state = useRef<PatrolState>({ leg: 1, wait: delay, x: path[0][0], z: path[0][1] });
  useFrame((_, raw) => {
    const g = group.current;
    if (!g) return;
    const delta = clampDelta(raw);
    const s = state.current;
    if (s.wait > 0) {
      s.wait = Math.max(0, s.wait - delta);
      motion.current.moving = false;
    } else {
      const [tx, tz] = path[s.leg];
      const dist = Math.hypot(tx - s.x, tz - s.z);
      if (dist < 0.1) {
        s.leg = (s.leg + 1) % path.length;
        s.wait = 1.5 + (s.leg % 2) * 1.5;
      } else {
        const step = Math.min(dist, 1.5 * delta);
        s.x += ((tx - s.x) / dist) * step;
        s.z += ((tz - s.z) / dist) * step;
        const target = Math.atan2(tx - s.x, tz - s.z);
        g.rotation.y += Math.atan2(Math.sin(target - g.rotation.y), Math.cos(target - g.rotation.y)) * Math.min(1, delta * 8);
      }
      motion.current.moving = s.wait === 0;
    }
    g.position.set(s.x, 0, s.z);
  });
  return (
    <group ref={group} position={[path[0][0], 0, path[0][1]]}>
      <CharacterModel avatar={avatar} motion={motion} />
    </group>
  );
}
