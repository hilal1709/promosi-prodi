import * as THREE from "three";
import type { OpsProductId } from "@/lib/data/worlds";

/* ------------------------------------------------------------------ */
/* Tata letak kompleks pabrik (level Shift Gudang Pintar)              */
/* Atas layar = -Z (utara). Semua angka dalam satuan dunia.            */
/* ------------------------------------------------------------------ */

export const OPS_TIME = 180;
export const PLAYER_START: [number, number] = [-1, 9];

/** Area jalan kaki pemain; tepinya ditutup properti (rak, dermaga, pagar tanaman). */
export const BOUNDS = { minX: -16.6, maxX: 14.2, minZ: -13.6, maxZ: 15.4 };

export const RACK_X = -19.6;
export const RACK_PICK_X = -15.6;
export const RACKS: { product: OpsProductId; z: number }[] = [
  { product: "pcc", z: -7 },
  { product: "opc", z: 0 },
  { product: "putih", z: 7 },
];
export const RACK_CAPACITY = 8;

export const BAY_Z = [-7.5, 0, 7.5];
export const DOCK_EDGE_X = 15.2;
/** Titik tengah truk saat parkir (menghadap +X, bak di sisi dermaga). */
export const TRUCK_PARK_X = 21.4;
export const LOAD_X = 13.4;

export const ROAD_X = 36;
export const CROSS_ROAD_Z = 44;

export const CONSOLES: { product: OpsProductId; x: number; z: number }[] = [
  { product: "pcc", x: -4, z: -15 },
  { product: "opc", x: -1, z: -15 },
  { product: "putih", x: 2, z: -15 },
];
export const TERMINAL = { x: 9.5, z: -15 };

/** Jalur conveyor: kiln → gudang (ujungnya masuk ke belakang rak). */
export const CONVEYOR_PATH: [number, number][] = [
  [-8, -24],
  [-8, -17.6],
  [-22.6, -17.6],
  [-22.6, 10],
];

export const FORKLIFT_LOOP: [number, number][] = [
  [-9.5, -9.5],
  [9, -9.5],
  [9, 11],
  [-9.5, 11],
];

export const SPILLS: [number, number, number][] = [
  [-5.5, 3.8, 1.5],
  [5.5, -4, 1.3],
  [1.5, 12.5, 1.4],
];

export const COFFEE_SPOTS: [number, number][] = [
  [-12, 12.5],
  [11, -11.5],
  [-3, -11],
  [7.5, 13.5],
  [-13, -11.5],
  [12, 4],
];

type Box = [number, number, number, number]; // minX, maxX, minZ, maxZ

const OBSTACLES: Box[] = [
  ...CONSOLES.map(({ x, z }): Box => [x - 0.6, x + 0.6, z - 0.6, z + 0.6]),
  [TERMINAL.x - 0.8, TERMINAL.x + 0.8, TERMINAL.z - 0.6, TERMINAL.z + 0.6],
];

/** true = titik tidak boleh diinjak pemain. */
export function opsBlocked(x: number, z: number) {
  if (x < BOUNDS.minX || x > BOUNDS.maxX || z < BOUNDS.minZ || z > BOUNDS.maxZ) return true;
  return OBSTACLES.some(([a, b, c, d]) => x > a && x < b && z > c && z < d);
}

/* ------------------------------------------------------------------ */
/* Lintasan truk (polyline dengan panjang kumulatif)                   */
/* ------------------------------------------------------------------ */

export type PathSeg = { pts: THREE.Vector2[]; cum: number[]; length: number; reverse: boolean; speed: number };

function bezier(a: [number, number], c: [number, number], b: [number, number], steps = 18) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const u = 1 - t;
    return new THREE.Vector2(u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]);
  });
}

function seg(pts: THREE.Vector2[], speed: number, reverse = false): PathSeg {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
  return { pts, cum, length: cum[cum.length - 1], reverse, speed };
}

const NORTH_LANE = ROAD_X - 1.8;
const SOUTH_LANE = ROAD_X + 1.8;

/** Datang dari selatan, melewati bay, lalu mundur masuk ke dermaga. */
export function arrivalPath(bayZ: number): PathSeg[] {
  const turn: [number, number] = [NORTH_LANE, bayZ - 9];
  return [
    seg([new THREE.Vector2(NORTH_LANE, 150), new THREE.Vector2(turn[0], turn[1])], 19),
    seg(bezier(turn, [NORTH_LANE, bayZ], [TRUCK_PARK_X, bayZ]), 5, true),
  ];
}

/** Maju keluar dermaga lalu menghilang ke selatan. */
export function departurePath(bayZ: number): PathSeg[] {
  return [
    seg(bezier([TRUCK_PARK_X, bayZ], [SOUTH_LANE, bayZ], [SOUTH_LANE, bayZ + 12]), 7),
    seg([new THREE.Vector2(SOUTH_LANE, bayZ + 12), new THREE.Vector2(SOUTH_LANE, 170)], 17),
  ];
}

export const pathLength = (path: PathSeg[]) => path.reduce((sum, s) => sum + s.length, 0);

/** Posisi & arah hadap (rotasi-Y, model menghadap +Z) pada jarak `d` sepanjang lintasan. */
export function poseOnPath(path: PathSeg[], d: number, out: THREE.Vector3) {
  let rest = Math.max(0, d);
  for (const s of path) {
    if (rest > s.length && s !== path[path.length - 1]) {
      rest -= s.length;
      continue;
    }
    rest = Math.min(rest, s.length);
    let i = 1;
    while (i < s.cum.length - 1 && s.cum[i] < rest) i++;
    const a = s.pts[i - 1];
    const b = s.pts[i];
    const t = (rest - s.cum[i - 1]) / Math.max(1e-6, s.cum[i] - s.cum[i - 1]);
    out.set(a.x + (b.x - a.x) * t, 0, a.y + (b.y - a.y) * t);
    const dx = (b.x - a.x) * (s.reverse ? -1 : 1);
    const dz = (b.y - a.y) * (s.reverse ? -1 : 1);
    return { heading: Math.atan2(dx, dz), speed: s.speed * (s.reverse ? -1 : 1) };
  }
  out.set(0, 0, 0);
  return { heading: 0, speed: 0 };
}

/** Lama (detik) menempuh lintasan dengan kecepatan tiap segmen. */
export const pathDuration = (path: PathSeg[]) => path.reduce((sum, s) => sum + s.length / s.speed, 0);

/** Jarak tempuh setelah `time` detik. */
export function distanceAt(path: PathSeg[], time: number) {
  let rest = time;
  let d = 0;
  for (const s of path) {
    const need = s.length / s.speed;
    if (rest <= need) return d + rest * s.speed;
    rest -= need;
    d += s.length;
  }
  return d;
}

/** Posisi di keliling loop forklift pada jarak `d`. */
export const FORKLIFT_PERIMETER = FORKLIFT_LOOP.reduce((sum, p, i) => {
  const q = FORKLIFT_LOOP[(i + 1) % FORKLIFT_LOOP.length];
  return sum + Math.hypot(q[0] - p[0], q[1] - p[1]);
}, 0);

export function forkliftPose(d: number) {
  let rest = ((d % FORKLIFT_PERIMETER) + FORKLIFT_PERIMETER) % FORKLIFT_PERIMETER;
  for (let i = 0; i < FORKLIFT_LOOP.length; i++) {
    const p = FORKLIFT_LOOP[i];
    const q = FORKLIFT_LOOP[(i + 1) % FORKLIFT_LOOP.length];
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (rest <= len) {
      const t = rest / len;
      return { x: p[0] + (q[0] - p[0]) * t, z: p[1] + (q[1] - p[1]) * t, heading: Math.atan2(q[0] - p[0], q[1] - p[1]) };
    }
    rest -= len;
  }
  return { x: FORKLIFT_LOOP[0][0], z: FORKLIFT_LOOP[0][1], heading: 0 };
}
