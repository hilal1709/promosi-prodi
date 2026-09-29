import * as THREE from "three";
import type { GameQuality } from "@/lib/types";
import { DATA_CUBES } from "@/lib/data/worlds";
import { fbm, seeded } from "../erp/race-track";

/* ------------------------------------------------------------------ */
/* Lembah Data, tata letak deterministik untuk Level 1 Data Science    */
/* ------------------------------------------------------------------ */

export type XZ = { x: number; z: number };

export const WATER_Y = 0;
/** Batas lunak: pemain didorong pelan kembali ke lembah. */
export const PLAY_RADIUS = 178;
/** Batas keras: posisi pemain dijepit di sini (lereng bukit sudah curam). */
export const HARD_RADIUS = 196;

export const CAMP: XZ = { x: 0, z: 8 };
export const TOWER = { x: 0, z: -8, r: 6.4, top: 22 };
export const START: XZ = { x: 0, z: 22 };

export const LAKE = { x: 84, z: 74, r: 40 };

export type BiomeId = "padang" | "hutan" | "danau" | "reruntuhan";

export const BIOMES: { id: BiomeId; nama: string; x: number; z: number; color: string }[] = [
  { id: "padang", nama: "Padang Bunga", x: -88, z: -70, color: "#f4b860" },
  { id: "hutan", nama: "Hutan Pinus", x: 86, z: -82, color: "#3f8a4a" },
  { id: "danau", nama: "Tepi Danau", x: 46, z: 70, color: "#3f93b8" },
  { id: "reruntuhan", nama: "Reruntuhan Server", x: -86, z: 78, color: "#9b8cff" },
];

const smooth = THREE.MathUtils.smoothstep;

export function segDistance(px: number, pz: number, a: XZ, b: XZ) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = dx * dx + dz * dz || 1;
  const t = THREE.MathUtils.clamp(((px - a.x) * dx + (pz - a.z) * dz) / len, 0, 1);
  return Math.hypot(px - (a.x + dx * t), pz - (a.z + dz * t));
}

function polyDistance(px: number, pz: number, line: XZ[]) {
  let best = Infinity;
  for (let i = 0; i < line.length - 1; i++) best = Math.min(best, segDistance(px, pz, line[i], line[i + 1]));
  return best;
}

/** Jalan setapak dari kemah ke tiap bioma (sedikit berkelok). */
export const PATHS: XZ[][] = BIOMES.map((biome, k) => {
  const rand = seeded(400 + k);
  const pts: XZ[] = [{ x: CAMP.x, z: CAMP.z }];
  const steps = 5;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const wobble = i < steps ? (rand() - 0.5) * 18 : 0;
    const nx = -(biome.z - CAMP.z);
    const nz = biome.x - CAMP.x;
    const nl = Math.hypot(nx, nz) || 1;
    pts.push({ x: CAMP.x + (biome.x - CAMP.x) * t * 0.82 + (nx / nl) * wobble, z: CAMP.z + (biome.z - CAMP.z) * t * 0.82 + (nz / nl) * wobble });
  }
  return pts;
});

/** Lingkar jalan kecil mengelilingi kemah. */
const RING_R = 26;

export function pathDistance(x: number, z: number) {
  let best = Math.abs(Math.hypot(x - CAMP.x, z - CAMP.z) - RING_R);
  for (const path of PATHS) best = Math.min(best, polyDistance(x, z, path));
  return best;
}

/** Sungai kecil yang turun dari bukit timur laut dan bermuara ke danau. */
export const STREAM: XZ[] = [
  { x: 176, z: -40 },
  { x: 150, z: -12 },
  { x: 132, z: 14 },
  { x: 114, z: 34 },
  { x: 98, z: 52 },
];

export function streamDistance(x: number, z: number) {
  return polyDistance(x, z, STREAM);
}

/** Ketinggian tanah, cekungan landai di tengah, bukit & pegunungan melingkar di tepi. */
export function terrainHeight(x: number, z: number) {
  const r = Math.hypot(x, z);
  let h = 2.6 + (fbm(x * 0.018 + 7, z * 0.018 - 3, 3) - 0.5) * 4.6;
  // Bukit kecil di kemah untuk menara.
  h += 3.2 * (1 - smooth(Math.hypot(x - TOWER.x, z - TOWER.z), 6, 34));
  // Area reruntuhan sedikit berbatu & bergelombang.
  const ruins = 1 - smooth(Math.hypot(x - BIOMES[3].x, z - BIOMES[3].z), 20, 70);
  h += ruins * Math.max(0, fbm(x * 0.06, z * 0.06, 2) - 0.4) * 6;
  // Cincin bukit & gunung (menyembunyikan batas dunia).
  const ring = smooth(r, 150, 250);
  const ridge = fbm(x * 0.006 + 31, z * 0.006 - 17, 4);
  h += ring * (26 + ridge * 90);
  h += smooth(r, 240, 520) * (90 + fbm(x * 0.004 - 5, z * 0.004 + 9, 4) * 260);
  // Danau
  const dl = Math.hypot(x - LAKE.x, z - LAKE.z);
  const shore = LAKE.r + (fbm(x * 0.05, z * 0.05, 2) - 0.5) * 10;
  h = THREE.MathUtils.lerp(h, -3.2, 1 - smooth(dl, shore - 12, shore + 4));
  // Sungai
  const sd = streamDistance(x, z);
  h = THREE.MathUtils.lerp(h, Math.min(h, -1.2), 1 - smooth(sd, 2.5, 7));
  // Jalan setapak diratakan sedikit.
  const pd = pathDistance(x, z);
  if (pd < 4 && dl > LAKE.r + 4) h = THREE.MathUtils.lerp(h, Math.max(h, 0.6), (1 - smooth(pd, 1, 4)) * 0.4);
  return h;
}

/** Titik aman di atas tanah & air (untuk pemain, hewan, sprite). */
export function groundAt(x: number, z: number) {
  return Math.max(terrainHeight(x, z), WATER_Y + 0.05);
}

export function biomeAt(x: number, z: number) {
  let best = BIOMES[0];
  let bestD = Infinity;
  const jx = (fbm(x * 0.02, z * 0.02, 2) - 0.5) * 50;
  const jz = (fbm(x * 0.02 + 50, z * 0.02 - 20, 2) - 0.5) * 50;
  for (const biome of BIOMES) {
    const d = Math.hypot(x + jx - biome.x, z + jz - biome.z);
    if (d < bestD) {
      bestD = d;
      best = biome;
    }
  }
  return { biome: best, strength: 1 - smooth(bestD, 40, 110) };
}

/* ------------------------------ sprite ----------------------------- */

export type Personality = "melayang" | "berkelana" | "pemalu" | "teleport";

export interface SpriteSpawn {
  index: number;
  biome: BiomeId;
  x: number;
  z: number;
  personality: Personality;
}

const PERSONALITIES: Personality[] = ["melayang", "berkelana", "pemalu", "teleport"];

export const SPRITE_SPAWNS: SpriteSpawn[] = (() => {
  const rand = seeded(77);
  const LAKE_ANGLES = [Math.PI * 1.02, Math.PI * 1.3, Math.PI * 0.72];
  return DATA_CUBES.map((_, index) => {
    const b = index % BIOMES.length;
    const biome = BIOMES[b];
    const slot = Math.floor(index / BIOMES.length);
    let x: number;
    let z: number;
    if (biome.id === "danau") {
      // Tersebar di sepanjang tepi danau, bukan menumpuk di satu sisi.
      const a = LAKE_ANGLES[slot % LAKE_ANGLES.length];
      const d = LAKE.r + 9 + rand() * 6;
      x = LAKE.x + Math.cos(a) * d;
      z = LAKE.z + Math.sin(a) * d;
    } else {
      const angle = slot * 2.2 + b * 0.9 + rand() * 0.6;
      const dist = 10 + slot * 15 + rand() * 6;
      x = biome.x + Math.cos(angle) * dist;
      z = biome.z + Math.sin(angle) * dist;
    }
    const r = Math.hypot(x, z);
    if (r > PLAY_RADIUS - 24) {
      x *= (PLAY_RADIUS - 24) / r;
      z *= (PLAY_RADIUS - 24) / r;
    }
    return { index, biome: biome.id, x, z, personality: PERSONALITIES[(index + slot) % PERSONALITIES.length] };
  });
})();

/* --------------------------- struktur tetap ------------------------ */

export interface Ruin {
  x: number;
  z: number;
  rot: number;
  h: number;
  broken: boolean;
}

export const RUINS: Ruin[] = (() => {
  const rand = seeded(12);
  const c = BIOMES[3];
  return Array.from({ length: 11 }, (_, k) => {
    const a = (k / 11) * Math.PI * 2 + rand() * 0.4;
    const d = 10 + rand() * 34;
    return { x: c.x + Math.cos(a) * d, z: c.z + Math.sin(a) * d, rot: rand() * Math.PI, h: 2.2 + rand() * 3.2, broken: rand() > 0.45 };
  });
})();

export const TENTS: { x: number; z: number; rot: number; color: string }[] = [
  { x: 11, z: 12, rot: -0.7, color: "#e76f51" },
  { x: -12, z: 13, rot: 0.8, color: "#2a9d8f" },
  { x: 14, z: -2, rot: -1.6, color: "#f4a261" },
];

export const SOLAR: XZ[] = [
  { x: -14, z: -4 },
  { x: -17.5, z: 0 },
  { x: -14, z: 4 },
];

export const PIER = { x: LAKE.x - LAKE.r * 0.72, z: LAKE.z - LAKE.r * 0.55, rot: Math.atan2(LAKE.x - (LAKE.x - LAKE.r * 0.72), LAKE.z - (LAKE.z - LAKE.r * 0.55)), len: 16 };

export const SIGNPOSTS = BIOMES.map((biome, k) => {
  const path = PATHS[k];
  const p = path[2];
  return { x: p.x + 3, z: p.z, biome, rot: Math.atan2(CAMP.x - p.x, CAMP.z - p.z) };
});

export const WEATHER_STATION: XZ = { x: 30, z: -34 };

/* ------------------------------ tabrakan --------------------------- */

/** `f`/`top` = jari-jari & puncak tajuk pohon (untuk tabrakan kamera). */
export type Solid = { x: number; z: number; r: number; f?: number; bottom?: number; top?: number };

const FIXED_SOLIDS: Solid[] = [
  { x: TOWER.x, z: TOWER.z, r: TOWER.r + 0.6 },
  ...TENTS.map((t) => ({ x: t.x, z: t.z, r: 2.2 })),
  ...RUINS.map((ruin) => ({ x: ruin.x, z: ruin.z, r: 1.5 })),
  { x: WEATHER_STATION.x, z: WEATHER_STATION.z, r: 1.2 },
  ...SOLAR.map((s) => ({ x: s.x, z: s.z, r: 1.4 })),
];

/* --------------------------- vegetasi ------------------------------ */

type Inst = { p: [number, number, number]; r?: [number, number, number]; s?: number | [number, number, number]; c?: string };

export interface Vegetation {
  pines: Inst[];
  roundTrees: Inst[];
  birches: Inst[];
  deadTrees: Inst[];
  bushes: Inst[];
  grass: Inst[];
  flowers: Inst[];
  dataFlowers: Inst[];
  reeds: Inst[];
  mushrooms: Inst[];
  logs: Inst[];
  rocks: Inst[];
  boulders: Inst[];
  farPines: Inst[];
  solids: Solid[];
}

const FLOWER_COLORS = ["#ffd166", "#ef476f", "#f8f9fa", "#c77dff", "#ff9f1c", "#8ecae6"];
const LEAF = ["#4f8f3a", "#5f9e45", "#6aa84f", "#3f7f35"];
const PINE = ["#2f5d34", "#35683a", "#294f2e", "#3c7040"];

const pick = <T,>(list: T[], r: number) => list[Math.floor(r * list.length) % list.length];

function blocked(x: number, z: number, margin: number) {
  if (pathDistance(x, z) < 3 + margin) return true;
  if (Math.hypot(x - CAMP.x, z - CAMP.z) < 30 + margin) return true;
  if (Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r + margin - 4) return true;
  if (streamDistance(x, z) < 5 + margin) return true;
  if (FIXED_SOLIDS.some((s) => Math.hypot(s.x - x, s.z - z) < s.r + margin + 1)) return true;
  return false;
}

/** Penyebaran vegetasi deterministik; kepadatan mengikuti kualitas grafis. */
export function scatterVegetation(quality: GameQuality): Vegetation {
  const scale = quality === "hemat" ? 0.45 : quality === "tinggi" ? 1.25 : 0.8;
  const rand = seeded(2024);
  const v: Vegetation = {
    pines: [], roundTrees: [], birches: [], deadTrees: [], bushes: [], grass: [], flowers: [], dataFlowers: [],
    reeds: [], mushrooms: [], logs: [], rocks: [], boulders: [], farPines: [], solids: [...FIXED_SOLIDS],
  };
  const CROWN: Record<string, [number, number, number]> = { pine: [1.7, 1.2, 6.2], round: [2.3, 1.8, 5], birch: [1.2, 2.8, 5.3], dead: [1.2, 1.5, 3.8] };
  const tree = (list: Inst[], x: number, z: number, s: number, c?: string) => {
    const y = terrainHeight(x, z) - 0.2;
    list.push({ p: [x, y, z], r: [0, rand() * Math.PI * 2, 0], s, c });
    const kind = list === v.pines ? "pine" : list === v.roundTrees ? "round" : list === v.birches ? "birch" : "dead";
    const [f, bottom, top] = CROWN[kind];
    if (Math.hypot(x, z) < HARD_RADIUS + 4) v.solids.push({ x, z, r: 0.55 * s, f: f * s, bottom: y + bottom * s, top: y + top * s });
  };

  // Pohon & semak utama di lembah.
  const treeTries = Math.round(2600 * scale);
  for (let i = 0; i < treeTries; i++) {
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(rand()) * 205;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    if (blocked(x, z, 1.5)) continue;
    const h = terrainHeight(x, z);
    if (h < 0.4) continue;
    const { biome, strength } = biomeAt(x, z);
    const n = fbm(x * 0.03 + 9, z * 0.03 - 4, 2);
    const r = rand();
    if (biome.id === "hutan" && strength > 0.15) {
      if (r < 0.55 + strength * 0.3) tree(v.pines, x, z, 0.9 + rand() * 0.9, pick(PINE, rand()));
      else if (r < 0.8) v.mushrooms.push({ p: [x, h, z], r: [0, rand() * 6, 0], s: 0.6 + rand() * 0.7, c: rand() > 0.5 ? "#e63946" : "#f1c27d" });
      else if (r < 0.9) v.logs.push({ p: [x, h + 0.25, z], r: [0, rand() * Math.PI, Math.PI / 2], s: [1, 1.4 + rand() * 1.6, 1] });
      else v.bushes.push({ p: [x, h, z], r: [0, rand() * 6, 0], s: 0.8 + rand() * 0.6, c: pick(LEAF, rand()) });
    } else if (biome.id === "padang" && strength > 0.25) {
      if (r < 0.06) tree(v.roundTrees, x, z, 0.9 + rand() * 0.7, pick(LEAF, rand()));
      else if (r < 0.14) v.bushes.push({ p: [x, h, z], r: [0, rand() * 6, 0], s: 0.7 + rand() * 0.5, c: pick(LEAF, rand()) });
      else if (r < 0.2) v.dataFlowers.push({ p: [x, h, z], r: [0, rand() * 6, 0], s: 0.8 + rand() * 0.5 });
    } else if (biome.id === "danau" && strength > 0.2) {
      if (r < 0.28) tree(v.birches, x, z, 0.8 + rand() * 0.6);
      else if (r < 0.4) tree(v.roundTrees, x, z, 0.8 + rand() * 0.6, pick(LEAF, rand()));
      else if (r < 0.55) v.rocks.push({ p: [x, h, z], r: [rand(), rand() * 6, rand()], s: 0.4 + rand() * 0.6, c: "#9a9a8e" });
      else if (r < 0.7) v.bushes.push({ p: [x, h, z], r: [0, rand() * 6, 0], s: 0.7 + rand() * 0.5, c: pick(LEAF, rand()) });
    } else if (biome.id === "reruntuhan" && strength > 0.2) {
      if (r < 0.12) tree(v.deadTrees, x, z, 0.8 + rand() * 0.7);
      else if (r < 0.3) {
        v.boulders.push({ p: [x, h - 0.4, z], r: [rand(), rand() * 6, rand()], s: 1 + rand() * 1.6, c: pick(["#8b8c7c", "#7c7a6e", "#9b9a8a"], rand()) });
        if (Math.hypot(x, z) < HARD_RADIUS) v.solids.push({ x, z, r: 1.1 });
      } else if (r < 0.42) v.rocks.push({ p: [x, h, z], r: [rand(), rand() * 6, rand()], s: 0.4 + rand() * 0.6, c: "#8e8a7c" });
      else if (r < 0.52) tree(v.pines, x, z, 0.8 + rand() * 0.5, pick(PINE, rand()));
    } else {
      // Peralihan: campuran hutan ringan.
      if (n > 0.55 && r < 0.4) tree(v.pines, x, z, 0.8 + rand() * 0.8, pick(PINE, rand()));
      else if (r < 0.14) tree(v.roundTrees, x, z, 0.8 + rand() * 0.8, pick(LEAF, rand()));
      else if (r < 0.22) v.bushes.push({ p: [x, h, z], r: [0, rand() * 6, 0], s: 0.7 + rand() * 0.6, c: pick(LEAF, rand()) });
      else if (r < 0.26) v.rocks.push({ p: [x, h, z], r: [rand(), rand() * 6, rand()], s: 0.4 + rand() * 0.8, c: "#9a9a8e" });
    }
  }

  // Rumput & bunga (tidak berbayang, murah).
  const grassTries = Math.round(9000 * scale);
  for (let i = 0; i < grassTries; i++) {
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(rand()) * 190;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    if (pathDistance(x, z) < 1.8) continue;
    const h = terrainHeight(x, z);
    if (h < 0.3) continue;
    const { biome, strength } = biomeAt(x, z);
    const meadow = biome.id === "padang" ? strength : 0;
    if (rand() < 0.2 + meadow * 0.55) {
      v.flowers.push({ p: [x, h, z], r: [0, rand() * 6, 0], s: 0.7 + rand() * 0.6, c: pick(FLOWER_COLORS, rand()) });
    } else {
      const dry = biome.id === "reruntuhan" ? strength : 0;
      v.grass.push({ p: [x, h, z], r: [0, rand() * 6, 0], s: 0.6 + rand() * 0.8, c: dry > 0.4 ? "#a4a55f" : pick(["#6fae4a", "#5f9e3f", "#7fbf55"], rand()) });
    }
  }

  // Alang-alang di tepi danau & sungai.
  const reedTries = Math.round(900 * scale);
  for (let i = 0; i < reedTries; i++) {
    const a = rand() * Math.PI * 2;
    const x = LAKE.x + Math.cos(a) * (LAKE.r - 6 + rand() * 12);
    const z = LAKE.z + Math.sin(a) * (LAKE.r - 6 + rand() * 12);
    const h = terrainHeight(x, z);
    if (h < -1 || h > 1.6 || Math.hypot(x - PIER.x, z - PIER.z) < 6) continue;
    v.reeds.push({ p: [x, Math.max(h, WATER_Y - 0.3), z], r: [0, rand() * 6, 0], s: 0.8 + rand() * 0.6 });
  }
  STREAM.forEach((p, k) => {
    if (k === 0) return;
    const prev = STREAM[k - 1];
    for (let j = 0; j < 20 * scale; j++) {
      const t = rand();
      const side = rand() > 0.5 ? 1 : -1;
      const dx = p.x - prev.x;
      const dz = p.z - prev.z;
      const l = Math.hypot(dx, dz) || 1;
      const x = prev.x + dx * t + (-dz / l) * side * (4.5 + rand() * 2);
      const z = prev.z + dz * t + (dx / l) * side * (4.5 + rand() * 2);
      v.reeds.push({ p: [x, terrainHeight(x, z), z], r: [0, rand() * 6, 0], s: 0.6 + rand() * 0.5 });
    }
  });

  // Hutan di lereng bukit luar (latar yang menutup cakrawala).
  const farTries = Math.round(2200 * scale);
  for (let i = 0; i < farTries; i++) {
    const a = rand() * Math.PI * 2;
    const d = 200 + rand() * 260;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    const h = terrainHeight(x, z);
    if (h > 150 || h < 1) continue;
    v.farPines.push({ p: [x, h - 0.5, z], r: [0, rand() * 6, 0], s: 1.6 + rand() * 1.8, c: pick(PINE, rand()) });
  }
  return v;
}

/** Grid spasial untuk mencari penghalang terdekat dengan cepat. */
export function buildSolidGrid(solids: Solid[], cell = 8) {
  const map = new Map<string, Solid[]>();
  for (const s of solids) {
    const pad = Math.max(s.r, s.f ?? 0) + 1;
    const x0 = Math.floor((s.x - pad) / cell);
    const x1 = Math.floor((s.x + pad) / cell);
    const z0 = Math.floor((s.z - pad) / cell);
    const z1 = Math.floor((s.z + pad) / cell);
    for (let gx = x0; gx <= x1; gx++) {
      for (let gz = z0; gz <= z1; gz++) {
        const key = `${gx},${gz}`;
        const list = map.get(key);
        if (list) list.push(s);
        else map.set(key, [s]);
      }
    }
  }
  return (x: number, z: number) => map.get(`${Math.floor(x / cell)},${Math.floor(z / cell)}`) ?? [];
}
