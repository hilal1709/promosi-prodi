import * as THREE from "three";
import { DRONE_SITES, type DroneSiteId } from "@/lib/data/worlds";
import { fbm, seeded } from "./race-track";

/* ------------------------------------------------------------------ */
/* Tata letak dunia Drone Integrasi (deterministik)                    */
/* ------------------------------------------------------------------ */

export type XZ = [number, number];

export const WATER_Y = -1.2;
export const LAND_Y = 0.6;
/** Radius area operasi; di luar ini angin mendorong drone kembali. */
export const PLAY_RADIUS = 380;
export const HARD_RADIUS = 470;
export const MAX_ALTITUDE = 115;
export const PAD_RADIUS = 7;

export const SITE = Object.fromEntries(DRONE_SITES.map((site) => [site.id, site])) as Record<DroneSiteId, (typeof DRONE_SITES)[number]>;

/** Menara Pusat Operasi berdiri di samping landasan HQ. */
export const HQ_TOWER = { x: -24, z: -16, w: 16, h: 64 };

export const CITY = { x: 170, z: -40, r: 92 };

const smooth = THREE.MathUtils.smoothstep;

/* ----------------------------- polyline ----------------------------- */

export function segDistance(x: number, z: number, a: XZ, b: XZ) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const len = dx * dx + dz * dz;
  const t = len ? THREE.MathUtils.clamp(((x - a[0]) * dx + (z - a[1]) * dz) / len, 0, 1) : 0;
  return Math.hypot(x - (a[0] + dx * t), z - (a[1] + dz * t));
}

export function polyDistance(x: number, z: number, poly: XZ[]) {
  let best = Infinity;
  for (let i = 0; i < poly.length - 1; i++) best = Math.min(best, segDistance(x, z, poly[i], poly[i + 1]));
  return best;
}

/** Polyline dengan panjang kumulatif, untuk kendaraan & objek yang berjalan di atasnya. */
export function measure(poly: XZ[]) {
  const acc = [0];
  for (let i = 1; i < poly.length; i++) acc.push(acc[i - 1] + Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]));
  return { poly, acc, length: acc[acc.length - 1] };
}

export type Measured = ReturnType<typeof measure>;

/** Titik & arah (sudut Y) pada jarak `d` di sepanjang polyline. */
export function along(path: Measured, d: number) {
  const dist = THREE.MathUtils.clamp(d, 0, path.length);
  let i = 1;
  while (i < path.acc.length - 1 && path.acc[i] < dist) i++;
  const a = path.poly[i - 1];
  const b = path.poly[i];
  const seg = path.acc[i] - path.acc[i - 1] || 1;
  const t = (dist - path.acc[i - 1]) / seg;
  return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, heading: Math.atan2(b[0] - a[0], b[1] - a[1]) };
}

/** Haluskan polyline (Chaikin) agar jalan & sungai tampak alami. */
function chaikin(poly: XZ[], rounds = 2): XZ[] {
  let out = poly;
  for (let r = 0; r < rounds; r++) {
    const next: XZ[] = [out[0]];
    for (let i = 0; i < out.length - 1; i++) {
      const [ax, az] = out[i];
      const [bx, bz] = out[i + 1];
      next.push([ax * 0.75 + bx * 0.25, az * 0.75 + bz * 0.25], [ax * 0.25 + bx * 0.75, az * 0.25 + bz * 0.75]);
    }
    next.push(out[out.length - 1]);
    out = next;
  }
  return out;
}

/* ------------------------- sungai, jalan, rel ------------------------ */

export const RIVER: XZ[] = chaikin([
  [-360, -900], [-330, -520], [-230, -330], [-150, -190], [-100, -70], [-66, 40], [-44, 120], [10, 200], [60, 282], [96, 380], [120, 700],
]);

export const riverWidth = (z: number) => 8 + smooth(z, 150, 330) * 12;

export const ROADS: XZ[][] = [
  // Pusat Operasi → kota → perumahan → pelabuhan
  [[12, 8], [60, -28], [122, -48], [176, -34], [205, 20], [225, 90], [212, 150], [200, 214], [184, 256]],
  // Pusat Operasi → pabrik → tambang → barat
  [[-12, 8], [-70, 26], [-140, 32], [-190, 38], [-262, 44], [-360, 54], [-560, 76], [-900, 100]],
  // Pusat Operasi → gudang → barat daya
  [[6, 14], [-20, 70], [-60, 118], [-104, 146], [-170, 196], [-262, 226], [-440, 250], [-900, 280]],
  // Pusat Operasi → proyek tol → utara (jalan pegunungan)
  [[2, -12], [18, -90], [30, -170], [52, -212], [70, -300], [84, -470], [100, -900]],
  // Kota → timur
  [[206, -40], [300, -62], [460, -92], [900, -130]],
].map((road) => chaikin(road as XZ[], 2));

export const ROAD_HALF = 4.2;

export const RAIL: XZ[] = chaikin([
  [-900, 130], [-560, 108], [-380, 94], [-236, 72], [-110, 84], [-40, 74], [60, 70], [130, 128], [166, 206], [204, 244],
]);

export const COAST = (x: number) => 296 + (fbm(x * 0.006 + 9, 1.3, 3) - 0.5) * 110 * smooth(Math.abs(x - 190), 30, 140);

/* ---------------------------- zona datar ---------------------------- */

type Flat = { x: number; z: number; r: number };

const FLATS: Flat[] = [
  { x: 0, z: 0, r: 52 },
  { x: CITY.x, z: CITY.z, r: CITY.r + 14 },
  { x: SITE.gudang.x, z: SITE.gudang.z, r: 50 },
  { x: SITE.pabrik.x - 12, z: SITE.pabrik.z - 6, r: 64 },
  { x: SITE.pelabuhan.x, z: SITE.pelabuhan.z - 8, r: 58 },
  { x: SITE.proyek.x, z: SITE.proyek.z, r: 52 },
  { x: SITE.perumahan.x, z: SITE.perumahan.z, r: 60 },
  { x: -34, z: -116, r: 44 },
];

/** Petak sawah (pusat, ukuran, rotasi). */
export const PADDY_ZONES = [
  { x: -66, z: -150, w: 60, d: 76, rot: 0.35 },
  { x: 66, z: -112, w: 58, d: 60, rot: -0.2 },
  { x: 108, z: 38, w: 62, d: 52, rot: 0.1 },
  { x: -118, z: 232, w: 72, d: 46, rot: -0.25 },
];

function inRect(x: number, z: number, zone: (typeof PADDY_ZONES)[number], pad = 0) {
  const c = Math.cos(-zone.rot);
  const s = Math.sin(-zone.rot);
  const dx = x - zone.x;
  const dz = z - zone.z;
  const lx = dx * c - dz * s;
  const lz = dx * s + dz * c;
  return Math.abs(lx) < zone.w / 2 + pad && Math.abs(lz) < zone.d / 2 + pad;
}

export const inPaddy = (x: number, z: number, pad = 0) => PADDY_ZONES.some((zone) => inRect(x, z, zone, pad));

export function roadDistance(x: number, z: number) {
  let best = Infinity;
  for (const road of ROADS) best = Math.min(best, polyDistance(x, z, road));
  return best;
}

export const riverDistance = (x: number, z: number) => polyDistance(x, z, RIVER);
export const railDistance = (x: number, z: number) => polyDistance(x, z, RAIL);

/* ------------------------------ terrain ------------------------------ */

const ISLANDS = [
  { x: -150, z: 560, r: 70, h: 26 },
  { x: 330, z: 520, r: 50, h: 18 },
  { x: 80, z: 780, r: 110, h: 60 },
  { x: -420, z: 700, r: 90, h: 44 },
];

/**
 * Tinggi tanah: lembah datar di area operasi, bukit bergelombang, pegunungan
 * melingkar di kejauhan, laut di selatan, sungai yang membelah lembah.
 * Terrain selalu jauh melampaui jarak kabut sehingga tepi dunia tidak terlihat.
 */
export function droneTerrain(x: number, z: number) {
  const r = Math.hypot(x, z * 1.05);
  let h = LAND_Y + (fbm(x * 0.011 + 3, z * 0.011 - 7, 4) - 0.38) * 34 * smooth(r, 90, 330);
  h += (fbm(x * 0.03, z * 0.03, 2) - 0.5) * 3;
  // Pegunungan melingkar, lebih tinggi di utara.
  const ridge = fbm(x * 0.0045 + 11, z * 0.0045 - 4, 5);
  h += smooth(r, 400, 760) * (45 + ridge * 190) * (0.7 + smooth(-z, 100, 700) * 0.5);
  h = Math.max(h, 0.35);

  // Area kerja, jalan, rel dan sawah diratakan.
  let flat = 0;
  for (const f of FLATS) flat = Math.max(flat, 1 - smooth(Math.hypot(x - f.x, z - f.z) - f.r, 0, 30));
  flat = Math.max(flat, 1 - smooth(roadDistance(x, z) - ROAD_HALF, 2, 34));
  flat = Math.max(flat, 1 - smooth(railDistance(x, z) - 3, 2, 26));
  if (inPaddy(x, z, 18)) flat = Math.max(flat, inPaddy(x, z, 2) ? 1 : 0.8);
  h = THREE.MathUtils.lerp(h, LAND_Y, flat);

  // Sungai.
  const rd = riverDistance(x, z);
  const w = riverWidth(z);
  if (rd < w + 16) h = Math.min(h, THREE.MathUtils.lerp(-3.4, h, smooth(rd, w * 0.55, w + 16)));

  // Laut di selatan.
  const coast = COAST(x);
  if (z > coast - 26) h = THREE.MathUtils.lerp(h, -9 - smooth(z - coast, 0, 260) * 20, smooth(z - coast, -24, 22));

  // Pulau-pulau kecil di laut, supaya cakrawala selatan tidak kosong.
  for (const isle of ISLANDS) {
    const d = Math.hypot(x - isle.x, z - isle.z) / isle.r;
    if (d < 1.3) h = Math.max(h, (1 - smooth(d, 0.2, 1.25)) * isle.h * (0.6 + fbm(x * 0.03, z * 0.03, 3) * 0.8) - 4);
  }
  return h;
}

/** Ketinggian permukaan yang bisa dipijak objek: tanah atau muka air. */
export const surfaceAt = (x: number, z: number) => Math.max(droneTerrain(x, z), WATER_Y);

/** Ketinggian dek jalan/rel (jembatan bila melintasi air). */
export const deckAt = (x: number, z: number) => Math.max(droneTerrain(x, z), LAND_Y) + 0.06;

/* ------------------------------- kota ------------------------------- */

export type Tower = { x: number; z: number; w: number; d: number; h: number; color: string; roof: string };

const TOWER_COLORS = ["#d9dde3", "#b8c4cf", "#9fb4c7", "#e4ddd0", "#c9cfd6", "#8fa3b8", "#dfe7ee"];

export const TOWERS: Tower[] = (() => {
  const rand = seeded(71);
  const list: Tower[] = [];
  const keep = [SITE.penjualan, SITE.keuangan];
  for (let gx = -4; gx <= 4; gx++) {
    for (let gz = -4; gz <= 4; gz++) {
      const x = CITY.x + gx * 22 + (rand() - 0.5) * 4;
      const z = CITY.z + gz * 22 + (rand() - 0.5) * 4;
      const dc = Math.hypot(x - CITY.x, z - CITY.z);
      if (dc > CITY.r) continue;
      if (keep.some((s) => Math.hypot(x - s.x, z - s.z) < 26)) continue;
      if (roadDistance(x, z) < 14) continue;
      const w = 9 + rand() * 7;
      const d = 9 + rand() * 7;
      const core = 1 - dc / CITY.r;
      const h = 12 + rand() * 18 + core * core * 62 + (rand() > 0.85 ? 18 : 0);
      list.push({ x, z, w, d, h, color: TOWER_COLORS[Math.floor(rand() * TOWER_COLORS.length)], roof: rand() > 0.5 ? "#5c6470" : "#7b848f" });
    }
  }
  return list;
})();

/** Gedung kantor khusus tiap divisi di kota, di belakang landasannya. */
export const OFFICES = [
  { site: "penjualan" as const, x: SITE.penjualan.x + 4, z: SITE.penjualan.z - 22, w: 18, d: 14, h: 46 },
  { site: "keuangan" as const, x: SITE.keuangan.x + 22, z: SITE.keuangan.z + 2, w: 14, d: 18, h: 58 },
];

/* ---------------------------- kotak tabrakan ---------------------------- */

export type Solid = { x: number; z: number; hw: number; hd: number; top: number };

export const SOLIDS: Solid[] = [
  ...TOWERS.map((t) => ({ x: t.x, z: t.z, hw: t.w / 2, hd: t.d / 2, top: t.h })),
  ...OFFICES.map((o) => ({ x: o.x, z: o.z, hw: o.w / 2, hd: o.d / 2, top: o.h })),
  { x: HQ_TOWER.x, z: HQ_TOWER.z, hw: HQ_TOWER.w / 2, hd: HQ_TOWER.w / 2, top: HQ_TOWER.h },
  // Pabrik: menara pemanas & silo.
  { x: SITE.pabrik.x - 30, z: SITE.pabrik.z - 26, hw: 3.2, hd: 3.2, top: 30 },
  ...[0, 1, 2].map((k) => ({ x: SITE.pabrik.x + 14 + k * 8, z: SITE.pabrik.z - 30, hw: 3.3, hd: 3.3, top: 17 })),
  // Gudang distribusi.
  { x: SITE.gudang.x - 4, z: SITE.gudang.z + 24, hw: 22, hd: 11, top: 13 },
  // Menara crane proyek.
  { x: SITE.proyek.x - 22, z: SITE.proyek.z - 14, hw: 1.2, hd: 1.2, top: 44 },
];

/* ------------------- cincin sinkron, baterai, bug ------------------- */

export type Ring = { x: number; y: number; z: number; heading: number };

/** Cincin di titik polyline terdekat dari (x, z), menghadap arah polyline. */
function ringNear(poly: XZ[], x: number, z: number, y: number): Ring {
  let best = { d: Infinity, x, z, heading: 0 };
  for (let i = 0; i < poly.length - 1; i++) {
    const a = poly[i];
    const b = poly[i + 1];
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const len = dx * dx + dz * dz || 1;
    const t = THREE.MathUtils.clamp(((x - a[0]) * dx + (z - a[1]) * dz) / len, 0, 1);
    const px = a[0] + dx * t;
    const pz = a[1] + dz * t;
    const d = Math.hypot(x - px, z - pz);
    if (d < best.d) best = { d, x: px, z: pz, heading: Math.atan2(dx, dz) };
  }
  return { x: best.x, y: surfaceAt(best.x, best.z) + y, z: best.z, heading: best.heading };
}

export const RINGS: Ring[] = [
  // Menyusuri sungai, rendah di atas air.
  ...([[-122, -130], [-104, -80], [-88, -30], [-72, 20], [-60, 70]] as XZ[]).map(([x, z], k) => ringNear(RIVER, x, z, 5 + k * 0.8)),
  // Jalan raya di sela gedung kota.
  ...([[96, -40], [140, -46], [188, -14], [210, 40]] as XZ[]).map(([x, z], k) => ringNear(ROADS[0], x, z, 16 + k * 5)),
  // Jalan menuju proyek tol.
  ...([[14, -60], [24, -130], [40, -190]] as XZ[]).map(([x, z]) => ringNear(ROADS[3], x, z, 12)),
  // Mengitari menara pemanas pabrik.
  ...[0, 1, 2].map((k) => {
    const a = k * 2.1 + 0.4;
    const cx = SITE.pabrik.x - 30;
    const cz = SITE.pabrik.z - 26;
    return { x: cx + Math.cos(a) * 16, y: 18 + k * 6, z: cz + Math.sin(a) * 16, heading: -a };
  }),
  // Pelabuhan, di antara crane.
  { x: SITE.pelabuhan.x - 30, y: 16, z: SITE.pelabuhan.z + 14, heading: Math.PI / 2 },
  { x: SITE.pelabuhan.x + 30, y: 16, z: SITE.pelabuhan.z + 14, heading: Math.PI / 2 },
];

export const BATTERY_SPOTS: [number, number, number][] = [
  [80, 18, -150],
  [-160, 14, -60],
  [120, 16, 196],
  [-62, 10, 232],
  [262, 34, -120],
  [-250, 22, 150],
  [30, 12, 118],
  [-40, 20, -250],
];

export const BUG_PATROLS = [
  { x: SITE.penjualan.x - 20, z: SITE.penjualan.z + 30, r: 34, y: 16 },
  { x: SITE.gudang.x + 30, z: SITE.gudang.z - 20, r: 32, y: 14 },
  { x: SITE.pabrik.x + 40, z: SITE.pabrik.z + 10, r: 30, y: 15 },
  { x: SITE.pelabuhan.x - 40, z: SITE.pelabuhan.z - 34, r: 30, y: 14 },
  { x: SITE.proyek.x + 10, z: SITE.proyek.z + 50, r: 34, y: 15 },
  { x: 70, z: 60, r: 40, y: 18 },
  { x: -90, z: -40, r: 36, y: 16 },
];

/* ------------------------- penanda pemandangan ------------------------- */

export const VILLAGE = { x: -34, z: -116, r: 40 };

export const TURBINES: XZ[] = [
  [360, -190], [395, -130], [420, -60], [400, 10], [-120, -430], [-40, -455], [40, -470], [-440, -120], [-470, -40],
];

/** Tiang listrik dari pabrik ke kota, lewat utara lembah. */
export const PYLON_LINE: XZ[] = [[-240, -40], [-170, -70], [-90, -95], [-10, -70], [60, -60], [118, -100], [150, -130]];
