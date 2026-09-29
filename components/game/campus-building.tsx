"use client";

import { useEffect, useMemo } from "react";
import { Html, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { Instanced, type InstanceSpec } from "@/components/game/campus-scenery";

export type BuildingStyle = {
  floors: number;
  wall: string;
  trim: string;
  facade: "windows" | "glass";
  roof: "flat" | "gable";
  roofColor: string;
};

type Vec3 = [number, number, number];

const FLOOR_HEIGHT = 1.4;
const BASE_HEIGHT = 0.22;
const DEPTH = 4.6;

const PANE_GEOMETRY = new THREE.BoxGeometry(1, 1, 1);
const GLASS_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#7fb6d9",
  emissive: "#bfe2ff",
  emissiveIntensity: 0.16,
  metalness: 0.4,
  roughness: 0.15,
});
const FRAME_MATERIAL = new THREE.MeshStandardMaterial({ color: "#3d4148", roughness: 0.55 });

function GableRoof({ width, color, y }: { width: number; color: string; y: number }) {
  const geometry = useMemo(() => {
    const half = DEPTH / 2 + 0.45;
    const shape = new THREE.Shape();
    shape.moveTo(-half, 0);
    shape.lineTo(half, 0);
    shape.lineTo(0, 1.5);
    shape.closePath();
    const length = width + 0.6;
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: length,
      bevelEnabled: true,
      bevelSize: 0.06,
      bevelThickness: 0.06,
      bevelSegments: 2,
    });
    geo.translate(0, 0, -length / 2);
    return geo;
  }, [width]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh castShadow geometry={geometry} position={[0, y, 0]} rotation={[0, Math.PI / 2, 0]}>
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
  );
}

export function CampusBuilding({
  title,
  short,
  color,
  position,
  style,
  width = 7,
  completed,
}: {
  title: string;
  short: string;
  color: string;
  position: Vec3;
  style: BuildingStyle;
  width?: number;
  completed: boolean;
}) {
  const { floors, facade } = style;
  const bodyHeight = FLOOR_HEIGHT * floors;
  const top = BASE_HEIGHT + bodyHeight;
  // Gedung di sisi selatan plaza diputar supaya pintu masuknya menghadap plaza.
  const rotation = position[2] > 0 ? Math.PI : 0;

  const { panes, frames } = useMemo(() => {
    const paneList: InstanceSpec[] = [];
    const frameList: InstanceSpec[] = [];
    const frontColumns = Math.floor((width - 0.8) / 1.15);
    const addWindow = (x: number, y: number, z: number, ry: number, w = 0.72, h = 0.8) => {
      const outward = ry === 0 ? [0, 0, 1] : ry === Math.PI ? [0, 0, -1] : ry > 0 ? [1, 0, 0] : [-1, 0, 0];
      frameList.push({ position: [x, y, z], rotation: [0, ry, 0], scale: [w + 0.14, h + 0.14, 0.05] });
      paneList.push({
        position: [x + outward[0] * 0.02, y, z + outward[2] * 0.02],
        rotation: [0, ry, 0],
        scale: [w, h, 0.05],
      });
      // Ambang jendela kecil di bawahnya.
      frameList.push({
        position: [x + outward[0] * 0.06, y - h / 2 - 0.08, z + outward[2] * 0.06],
        rotation: [0, ry, 0],
        scale: [w + 0.22, 0.06, 0.14],
      });
    };

    for (let floor = 0; floor < floors; floor++) {
      const y = BASE_HEIGHT + FLOOR_HEIGHT * floor + 0.76;
      const glassBand = facade === "glass" && floor > 0;
      for (const [z, ry] of [[DEPTH / 2 + 0.01, 0], [-DEPTH / 2 - 0.01, Math.PI]] as const) {
        if (glassBand) {
          // Dinding kaca penuh dengan mullion vertikal.
          const bandWidth = width - 1;
          paneList.push({ position: [0, y, z + Math.sign(z) * 0.02], rotation: [0, ry, 0], scale: [bandWidth, 1, 0.05] });
          for (let m = 0; m <= 6; m++) {
            const x = -bandWidth / 2 + (m / 6) * bandWidth;
            frameList.push({ position: [x, y, z + Math.sign(z) * 0.04], rotation: [0, ry, 0], scale: [0.07, 1.06, 0.06] });
          }
          continue;
        }
        for (let col = 0; col < frontColumns; col++) {
          const x = (col - (frontColumns - 1) / 2) * 1.15;
          if (floor === 0 && ry === 0 && Math.abs(x) < 1.4) continue; // ruang pintu masuk
          addWindow(x, y, z, ry);
        }
      }
      for (let col = 0; col < 3; col++) {
        const z = (col - 1) * 1.3;
        addWindow(width / 2 + 0.01, y, z, Math.PI / 2);
        addWindow(-width / 2 - 0.01, y, z, -Math.PI / 2);
      }
    }
    return { panes: paneList, frames: frameList };
  }, [facade, floors, width]);

  const labelY = top + (style.roof === "gable" ? 2.1 : 1);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Fondasi */}
      <RoundedBox receiveShadow position={[0, BASE_HEIGHT / 2, 0]} args={[width + 0.35, BASE_HEIGHT, DEPTH + 0.35]} radius={0.08} smoothness={2}>
        <meshStandardMaterial color="#8d8a85" roughness={0.9} />
      </RoundedBox>
      {/* Badan gedung */}
      <RoundedBox castShadow receiveShadow position={[0, BASE_HEIGHT + bodyHeight / 2, 0]} args={[width, bodyHeight, DEPTH]} radius={0.18} smoothness={4}>
        <meshStandardMaterial color={style.wall} roughness={0.85} />
      </RoundedBox>
      {/* Pilar sudut */}
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
        <RoundedBox
          key={`${sx}${sz}`}
          castShadow
          position={[sx * (width / 2 - 0.05), BASE_HEIGHT + bodyHeight / 2, sz * (DEPTH / 2 - 0.05)]}
          args={[0.38, bodyHeight, 0.38]}
          radius={0.1}
          smoothness={3}
        >
          <meshStandardMaterial color={style.trim} roughness={0.8} />
        </RoundedBox>
      )))}
      {/* Lis antar lantai */}
      {Array.from({ length: floors - 1 }, (_, i) => (
        <RoundedBox key={i} castShadow position={[0, BASE_HEIGHT + FLOOR_HEIGHT * (i + 1), 0]} args={[width + 0.16, 0.14, DEPTH + 0.16]} radius={0.06} smoothness={2}>
          <meshStandardMaterial color={style.trim} roughness={0.8} />
        </RoundedBox>
      ))}

      <Instanced geometry={PANE_GEOMETRY} material={FRAME_MATERIAL} items={frames} />
      <Instanced geometry={PANE_GEOMETRY} material={GLASS_MATERIAL} items={panes} />

      {/* Atap */}
      <RoundedBox castShadow position={[0, top + 0.16, 0]} args={[width + 0.4, 0.32, DEPTH + 0.4]} radius={0.12} smoothness={3}>
        <meshStandardMaterial color={style.roof === "gable" ? style.trim : style.roofColor} roughness={0.8} />
      </RoundedBox>
      {style.roof === "gable" ? (
        <GableRoof width={width} color={style.roofColor} y={top + 0.3} />
      ) : (
        <>
          <RoundedBox castShadow position={[width / 4, top + 0.62, -0.7]} args={[1.3, 0.6, 1]} radius={0.1} smoothness={2}>
            <meshStandardMaterial color="#a7abb1" roughness={0.5} metalness={0.3} />
          </RoundedBox>
          <RoundedBox castShadow position={[-width / 4, top + 0.5, 0.3]} args={[1.6, 0.36, 1.2]} radius={0.08} smoothness={2}>
            <meshStandardMaterial color="#2f3b52" roughness={0.3} metalness={0.5} />
          </RoundedBox>
        </>
      )}

      {/* Pintu masuk kaca */}
      <mesh position={[0, BASE_HEIGHT + 0.68, DEPTH / 2 + 0.02]}>
        <boxGeometry args={[1.6, 1.36, 0.06]} />
        <meshStandardMaterial color="#2e4a5c" metalness={0.4} roughness={0.2} />
      </mesh>
      <mesh position={[0, BASE_HEIGHT + 0.68, DEPTH / 2 + 0.06]}>
        <boxGeometry args={[0.05, 1.36, 0.02]} />
        <meshStandardMaterial color={style.trim} />
      </mesh>
      {/* Kanopi warna zona */}
      <RoundedBox castShadow position={[0, BASE_HEIGHT + 1.48, DEPTH / 2 + 0.4]} args={[2.8, 0.14, 0.85]} radius={0.06} smoothness={2}>
        <meshStandardMaterial color={color} roughness={0.5} />
      </RoundedBox>
      {[-1, 1].map((side) => (
        <mesh key={side} castShadow position={[side * 1.2, BASE_HEIGHT + 0.72, DEPTH / 2 + 0.65]}>
          <cylinderGeometry args={[0.07, 0.07, 1.45, 12]} />
          <meshStandardMaterial color={style.trim} />
        </mesh>
      ))}
      <RoundedBox position={[0, BASE_HEIGHT + 1.78, DEPTH / 2 + 0.05]} args={[2.3, 0.38, 0.08]} radius={0.04} smoothness={2}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
      </RoundedBox>
      {/* Pot tanaman di depan */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (width / 2 - 1.1), 0, DEPTH / 2 + 0.4]}>
          <RoundedBox castShadow position={[0, 0.25, 0]} args={[1.1, 0.5, 0.55]} radius={0.08} smoothness={2}>
            <meshStandardMaterial color="#7b7f86" roughness={0.9} />
          </RoundedBox>
          {[-0.28, 0.05, 0.3].map((x, i) => (
            <mesh key={i} castShadow position={[x, 0.62, 0]}>
              <sphereGeometry args={[0.26 + (i % 2) * 0.05, 14, 12]} />
              <meshStandardMaterial color={i === 1 ? "#5da74f" : "#4b8f43"} roughness={0.85} />
            </mesh>
          ))}
        </group>
      ))}

      <Html position={[0, labelY, DEPTH / 2]} center distanceFactor={13} zIndexRange={[8, 0]} style={{ pointerEvents: "none" }}>
        <div className="game-world-label" style={{ borderColor: color }}>
          <span>{short}{completed ? " · selesai" : ""}</span>
          <strong>{title}</strong>
        </div>
      </Html>
    </group>
  );
}
