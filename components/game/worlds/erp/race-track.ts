import * as THREE from "three";
import { TRACK_POINTS } from "@/lib/data/worlds";

/* ------------------------------------------------------------------ */
/* Geometri lintasan bersama (jalan, fisika, pemandangan, lalu lintas) */
/* ------------------------------------------------------------------ */

export const ROAD_WIDTH = 13;
export const ROAD_HALF = ROAD_WIDTH / 2;
/** Jarak pagar pembatas dari garis tengah; truk tidak bisa keluar dari sini. */
export const RAIL_OFFSET = ROAD_HALF + 4.5;
export const SAMPLES = 1200;
/** Lajur kiri & kanan yang dipakai mobil lain. Offset positif = sisi kanan pengemudi. */
export const LANES = [-3.4, 3.4] as const;

export const TRACK = (() => {
  const curve = new THREE.CatmullRomCurve3(TRACK_POINTS.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, "centripetal");
  const points = curve.getSpacedPoints(SAMPLES).slice(0, SAMPLES);
  const tangents = points.map((_, index) => curve.getTangentAt(index / SAMPLES));
  // Normal "kanan" di bidang XZ. Offset gerbang dan posisi lateral truk memakai normal yang sama.
  const normals = tangents.map((t) => new THREE.Vector3(-t.z, 0, t.x));
  const box = new THREE.Box3().setFromPoints(points);
  const center = box.getCenter(new THREE.Vector3());
  // Titik kasar untuk perhitungan jarak massal (terrain, penempatan dekorasi).
  const coarse = new Float32Array(Math.ceil(SAMPLES / 4) * 2);
  for (let i = 0, k = 0; i < SAMPLES; i += 4, k += 2) {
    coarse[k] = points[i].x;
    coarse[k + 1] = points[i].z;
  }
  return { points, tangents, normals, length: curve.getLength(), center, box, coarse };
})();

export const indexAt = (t: number) => ((Math.round(t * SAMPLES) % SAMPLES) + SAMPLES) % SAMPLES;
export const headingAt = (index: number) => Math.atan2(TRACK.tangents[index].x, TRACK.tangents[index].z);

export function pointAt(t: number, offset = 0) {
  const index = indexAt(t);
  return TRACK.points[index].clone().addScaledVector(TRACK.normals[index], offset);
}

const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();

/** Posisi & arah halus (interpolasi antar-sampel) untuk objek yang bergerak di lintasan. */
export function sampleTrack(t: number, offset: number, out: THREE.Vector3) {
  const f = ((((t % 1) + 1) % 1) * SAMPLES);
  const i0 = Math.floor(f) % SAMPLES;
  const i1 = (i0 + 1) % SAMPLES;
  const k = f - Math.floor(f);
  tmpA.copy(TRACK.points[i0]).addScaledVector(TRACK.normals[i0], offset);
  tmpB.copy(TRACK.points[i1]).addScaledVector(TRACK.normals[i1], offset);
  out.copy(tmpA).lerp(tmpB, k);
  const ta = TRACK.tangents[i0];
  const tb = TRACK.tangents[i1];
  return Math.atan2(ta.x + (tb.x - ta.x) * k, ta.z + (tb.z - ta.z) * k);
}

export function nearestIndex(position: THREE.Vector3, hint: number) {
  let best = hint;
  let bestDistance = Infinity;
  for (let step = -40; step <= 40; step++) {
    const index = (hint + step + SAMPLES) % SAMPLES;
    const distance = TRACK.points[index].distanceToSquared(position);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = index;
    }
  }
  return best;
}

/**
 * Apakah perjalanan MAJU dari indeks `from` ke `to` melewati indeks `mark`.
 * Gerak mundur tidak pernah dihitung, sebelumnya setiap kali truk mundur
 * (rem/tabrak), gerbang di depan langsung dianggap terlewati.
 */
export function crossed(from: number, to: number, mark: number) {
  const step = (to - from + SAMPLES) % SAMPLES;
  if (step === 0 || step > SAMPLES / 2) return false;
  const offset = (mark - from + SAMPLES) % SAMPLES;
  return offset > 0 && offset <= step;
}

/** Jarak (kasar) titik XZ ke garis tengah lintasan. */
export function distanceToTrack(x: number, z: number) {
  const c = TRACK.coarse;
  let best = Infinity;
  for (let k = 0; k < c.length; k += 2) {
    const dx = c[k] - x;
    const dz = c[k + 1] - z;
    const d = dx * dx + dz * dz;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}

/** Apakah titik XZ berada di dalam lingkar lintasan (infield). */
export function insideTrack(x: number, z: number) {
  const c = TRACK.coarse;
  let inside = false;
  for (let i = 0, j = c.length - 2; i < c.length; j = i, i += 2) {
    const xi = c[i], zi = c[i + 1], xj = c[j], zj = c[j + 1];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

/** Generator acak deterministik supaya dunia sama setiap kali dimuat. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(x: number, z: number) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function valueNoise(x: number, z: number) {
  const xi = Math.floor(x), zi = Math.floor(z);
  const xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function fbm(x: number, z: number, octaves = 4) {
  let sum = 0, amp = 0.5, freq = 1, norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += valueNoise(x * freq, z * freq) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum / norm;
}

/** Danau di tengah infield: titik infield yang paling jauh dari jalan. */
export const LAKE = (() => {
  let best = { x: TRACK.center.x, z: TRACK.center.z, d: 0 };
  for (let x = TRACK.box.min.x; x <= TRACK.box.max.x; x += 4) {
    for (let z = TRACK.box.min.z; z <= TRACK.box.max.z; z += 4) {
      if (!insideTrack(x, z)) continue;
      const d = distanceToTrack(x, z);
      if (d > best.d) best = { x, z, d };
    }
  }
  return { x: best.x, z: best.z, r: Math.min(30, best.d - RAIL_OFFSET - 14) };
})();

/** Petak sawah: pusat, ukuran, sudut. Terrain diratakan di area ini. */
export interface Paddy { x: number; z: number; w: number; d: number; angle: number }

export const PADDIES: Paddy[] = (() => {
  const rand = seeded(77);
  const list: Paddy[] = [];
  let guard = 0;
  while (list.length < 7 && guard++ < 600) {
    const angle = rand() * Math.PI * 2;
    const r = 60 + rand() * 150;
    const x = TRACK.center.x + Math.cos(angle) * (TRACK.box.max.x - TRACK.center.x + 10) * (r / 150);
    const z = TRACK.center.z + Math.sin(angle) * (TRACK.box.max.z - TRACK.center.z + 10) * (r / 150);
    const w = 34 + rand() * 26;
    const d = 26 + rand() * 20;
    if (distanceToTrack(x, z) < RAIL_OFFSET + Math.hypot(w, d) / 2 + 6) continue;
    if (Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r + Math.hypot(w, d) / 2 + 8) continue;
    if (list.some((p) => Math.hypot(p.x - x, p.z - z) < (Math.hypot(p.w, p.d) + Math.hypot(w, d)) / 2 + 6)) continue;
    list.push({ x, z, w, d, angle: rand() * Math.PI });
  }
  return list;
})();

/** 0..1, seberapa dalam titik berada di petak sawah (dengan tepi halus). */
export function paddyMask(x: number, z: number) {
  let mask = 0;
  for (const p of PADDIES) {
    const dx = x - p.x, dz = z - p.z;
    const c = Math.cos(p.angle), s = Math.sin(p.angle);
    const lx = Math.abs(dx * c - dz * s) - p.w / 2;
    const lz = Math.abs(dx * s + dz * c) - p.d / 2;
    const outside = Math.max(lx, lz);
    mask = Math.max(mask, 1 - THREE.MathUtils.smoothstep(outside, 0, 10));
  }
  return mask;
}

export const WATER_LEVEL = -0.7;

/** Tinggi tanah. Datar di sekitar jalan, berbukit di kejauhan, dikelilingi pegunungan. */
export function terrainHeight(x: number, z: number, d = distanceToTrack(x, z)) {
  const base = -0.06;
  const hillFactor = THREE.MathUtils.smoothstep(d, RAIL_OFFSET + 9, RAIL_OFFSET + 55);
  let h = base + Math.max(0, fbm(x * 0.011 + 3.1, z * 0.011 - 7.4) - 0.38) * 34 * hillFactor;
  const r = Math.hypot(x - TRACK.center.x, z - TRACK.center.z);
  const ring = THREE.MathUtils.smoothstep(r, 230, 470);
  h += ring * (30 + fbm(x * 0.006, z * 0.006, 5) * 150);
  const paddy = paddyMask(x, z);
  if (paddy > 0) h = THREE.MathUtils.lerp(h, 0.02, paddy);
  const lakeDistance = Math.hypot(x - LAKE.x, z - LAKE.z);
  const lake = 1 - THREE.MathUtils.smoothstep(lakeDistance, LAKE.r * 0.55, LAKE.r * 1.1);
  if (lake > 0) h = THREE.MathUtils.lerp(h, -2.6, lake);
  return h;
}
