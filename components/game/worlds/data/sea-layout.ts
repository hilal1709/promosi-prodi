import * as THREE from "three";
import type { GameQuality } from "@/lib/types";
import { CHART_QUESTIONS, INSIGHT_QUESTIONS } from "@/lib/data/missions";
import { fbm, seeded } from "../erp/race-track";

/* ------------------------------------------------------------------ */
/* Kepulauan Insight, tata letak deterministik Level 3 Data Science     */
/* ------------------------------------------------------------------ */

export type XZ = { x: number; z: number };
export type Inst = { p: [number, number, number]; r?: [number, number, number]; s?: number | [number, number, number]; c?: string };

export const SEA_Y = 0;
/** Batas lunak: arus balik mulai mendorong kapal kembali. */
export const PLAY_RADIUS = 268;
/** Batas keras: posisi kapal dijepit di sini (sudah tertutup kabut laut). */
export const HARD_RADIUS = 300;
export const SEA_TIME = 420;

const smooth = THREE.MathUtils.smoothstep;
const clamp = THREE.MathUtils.clamp;

export type IslandKind = "pelabuhan" | "tropis" | "bakau" | "vulkanik" | "tebing" | "atol" | "tanjung" | "karang";

export interface Island {
  id: string;
  nama: string;
  kind: IslandKind;
  x: number;
  z: number;
  r: number;
  h: number;
  seed: number;
  /** Indeks toko di CHART_QUESTIONS[0].data (bila pulau punya toko). */
  shop?: number;
  color: string;
}

const SALES = CHART_QUESTIONS[0].data;
export const TREND = CHART_QUESTIONS[1].data;

export const ISLANDS: Island[] = [
  { id: "pelabuhan", nama: "Pelabuhan Gresik", kind: "pelabuhan", x: 0, z: 74, r: 36, h: 12, seed: 1, color: "#e9c46a" },
  { id: "makmur", nama: "Pulau Makmur", kind: "tropis", x: -98, z: -28, r: 26, h: 10, seed: 2, shop: 0, color: "#5b8def" },
  { id: "sejahtera", nama: "Pulau Sejahtera", kind: "bakau", x: -62, z: -152, r: 30, h: 5, seed: 3, shop: 1, color: "#2a9d8f" },
  { id: "barokah", nama: "Pulau Barokah", kind: "tropis", x: -178, z: 96, r: 19, h: 7, seed: 4, shop: 2, color: "#e76f51" },
  { id: "jaya", nama: "Pulau Jaya", kind: "tropis", x: 112, z: -70, r: 36, h: 15, seed: 5, shop: 3, color: "#ffc857" },
  { id: "amanah", nama: "Pulau Amanah", kind: "tebing", x: 62, z: -192, r: 28, h: 22, seed: 6, shop: 4, color: "#b36bd6" },
  { id: "sentosa", nama: "Atol Sentosa", kind: "atol", x: 176, z: 62, r: 34, h: 2, seed: 7, shop: 5, color: "#7ee8fa" },
  { id: "berkah", nama: "Gunung Berkah", kind: "vulkanik", x: 96, z: 152, r: 30, h: 40, seed: 8, shop: 6, color: "#ef476f" },
  { id: "mercusuar", nama: "Tanjung Mercusuar", kind: "tanjung", x: -12, z: -236, r: 22, h: 14, seed: 9, color: "#ffffff" },
  // Pulau-pulau kecil penghias (tanpa toko).
  { id: "k1", nama: "Karang Sunyi", kind: "karang", x: -132, z: -92, r: 8, h: 4, seed: 10, color: "#8d99ae" },
  { id: "k2", nama: "Gosong Kelapa", kind: "tropis", x: 30, z: -110, r: 10, h: 3, seed: 11, color: "#8d99ae" },
  { id: "k3", nama: "Batu Kembar", kind: "karang", x: 152, z: -162, r: 9, h: 7, seed: 12, color: "#8d99ae" },
  { id: "k4", nama: "Pulau Camar", kind: "tropis", x: -64, z: 152, r: 13, h: 5, seed: 13, color: "#8d99ae" },
  { id: "k5", nama: "Karang Tanduk", kind: "karang", x: 204, z: -22, r: 7, h: 6, seed: 14, color: "#8d99ae" },
  { id: "k6", nama: "Tebing Angin", kind: "tebing", x: -214, z: -58, r: 11, h: 14, seed: 15, color: "#8d99ae" },
  { id: "k7", nama: "Karang Biru", kind: "karang", x: -92, z: 62, r: 7, h: 3, seed: 16, color: "#8d99ae" },
  { id: "k8", nama: "Gosong Putih", kind: "atol", x: 40, z: 10, r: 9, h: 1, seed: 17, color: "#8d99ae" },
];

export const HARBOR = ISLANDS[0];
export const BAROKAH = ISLANDS[3];
export const LIGHTHOUSE_ISLAND = ISLANDS[8];

/* ------------------------------ karang Barokah --------------------- */

/** Cincin karang mengelilingi Barokah; satu-satunya celah menghadap laut lepas. */
export const REEF = { x: BAROKAH.x, z: BAROKAH.z, r: 44, gap: Math.atan2(BAROKAH.x, BAROKAH.z), gapHalf: 0.3 };

const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

function reefMask(x: number, z: number) {
  const d = Math.hypot(x - REEF.x, z - REEF.z);
  const a = Math.atan2(x - REEF.x, z - REEF.z);
  const inGap = Math.abs(wrapAngle(a - REEF.gap)) < REEF.gapHalf;
  return inGap ? 0 : 1 - smooth(Math.abs(d - REEF.r), 2.5, 7);
}

/* ------------------------------ ketinggian ------------------------- */

function groundOf(kind: IslandKind, t: number, h: number) {
  switch (kind) {
    case "pelabuhan":
      return 0.4 + 1.9 * smooth(t, 0, 0.1) + h * smooth(t, 0.55, 1) * (0.6 + 0.4 * smooth(t, 0.8, 1));
    case "tropis":
      return 0.35 + 0.9 * smooth(t, 0, 0.2) + h * Math.pow(smooth(t, 0.12, 1), 1.4);
    case "bakau":
      return 0.25 + 0.55 * smooth(t, 0, 0.45) + h * smooth(t, 0.5, 1);
    case "vulkanik":
      return 0.4 + 1.4 * smooth(t, 0, 0.1) + h * Math.pow(smooth(t, 0.05, 1), 1.7) - h * 0.28 * smooth(t, 0.86, 1);
    case "tebing":
      return 0.5 + 1.1 * smooth(t, 0, 0.1) + h * smooth(t, 0.16, 0.34) + h * 0.22 * smooth(t, 0.55, 1);
    case "atol":
      return -1.6 + 3.3 * (1 - smooth(Math.abs(t - 0.3), 0.05, 0.2));
    case "tanjung":
      return 0.6 + h * Math.pow(smooth(t, 0, 0.85), 1.1);
    case "karang":
      return 0.3 + h * Math.pow(smooth(t, 0, 1), 0.8);
  }
}

const SHORE0: Record<IslandKind, number> = { pelabuhan: 0.4, tropis: 0.35, bakau: 0.25, vulkanik: 0.4, tebing: 0.5, atol: -1.6, tanjung: 0.6, karang: 0.3 };

/** Jari-jari pantai (bergelombang) pulau pada titik tertentu. */
function shoreRadius(island: Island, x: number, z: number) {
  const n = fbm(x * 0.028 + island.seed * 17.3, z * 0.028 - island.seed * 9.1, 3);
  return island.r * (0.78 + 0.46 * n);
}

export function seabed(x: number, z: number) {
  const r = Math.hypot(x, z);
  return -10 + (fbm(x * 0.01 + 3, z * 0.01 - 8, 3) - 0.5) * 4 - smooth(r, 220, 420) * 10;
}

/** Ketinggian dasar laut / pulau. SEA_Y = 0 adalah permukaan air. */
export function terrainHeight(x: number, z: number) {
  let h = seabed(x, z);
  for (const island of ISLANDS) {
    const dx = x - island.x;
    const dz = z - island.z;
    const d2 = dx * dx + dz * dz;
    const reach = island.r * 3.2;
    if (d2 > reach * reach) continue;
    const d = Math.sqrt(d2);
    const rr = shoreRadius(island, x, z);
    const t = 1 - d / rr;
    let v: number;
    if (t >= 0) {
      v = groundOf(island.kind, t, island.h);
      // Kekasaran tanah daratan.
      v += (fbm(x * 0.12 + island.seed, z * 0.12, 2) - 0.5) * 1.4 * smooth(t, 0.05, 0.35) * (island.kind === "atol" ? 0.3 : 1);
    } else {
      // Paparan dangkal (warna toska) lalu tebing bawah laut.
      v = SHORE0[island.kind] + t * 9;
      v = Math.max(v, -2.4 + t * 3.2);
    }
    if (v > h) h = v;
  }
  // Paparan karang Barokah (dangkal tapi bisa dilewati; batu karangnya yang menghalangi).
  const reef = reefMask(x, z);
  if (reef > 0) h = Math.max(h, THREE.MathUtils.lerp(h, -1.2, reef));
  // Pulau-pulau jauh: siluet pegunungan di cakrawala, bercelah laut.
  const r = Math.hypot(x, z);
  if (r > 380) {
    const n = fbm(x * 0.005 + 11, z * 0.005 - 7, 4);
    const m = smooth(n, 0.46, 0.68) * smooth(r, 390, 530) * (1 - smooth(r, 660, 745));
    if (m > 0) h = Math.max(h, -8 + m * (45 + 130 * fbm(x * 0.018 + 4, z * 0.018 - 2, 3)));
  }
  return h;
}

/** Pulau terdekat & posisi relatif (t: 1 = pusat, 0 = garis pantai). */
export function islandAt(x: number, z: number) {
  let best = ISLANDS[0];
  let bestT = -Infinity;
  for (const island of ISLANDS) {
    const d = Math.hypot(x - island.x, z - island.z);
    if (d > island.r * 3) continue;
    const t = 1 - d / shoreRadius(island, x, z);
    if (t > bestT) {
      bestT = t;
      best = island;
    }
  }
  return { island: best, t: bestT };
}

/* ------------------------------ dermaga ---------------------------- */

export interface Dock {
  island: Island;
  /** Titik labuh di air. */
  x: number;
  z: number;
  /** Arah dermaga (dari laut menuju darat). */
  rot: number;
  /** Titik darat pertama & panjang dermaga. */
  land: XZ;
  len: number;
  /** Rumah/toko di darat. */
  house: XZ & { y: number };
}

function makeDock(island: Island, dir: XZ): Dock {
  const len = Math.hypot(dir.x, dir.z) || 1;
  const ux = dir.x / len;
  const uz = dir.z / len;
  const h = (d: number) => terrainHeight(island.x + ux * d, island.z + uz * d);
  // Dari laut menuju pulau: titik darat pertama (aman untuk atol yang berlaguna).
  let d = island.r * 1.9;
  while (d > 0 && h(d) <= 0.7) d -= 0.5;
  const landD = d;
  while (d < island.r * 3.5 && h(d) > -2.4) d += 0.5;
  const waterD = d + 3;
  // Rumah di dataran rendah dekat pantai (bukan di puncak tebing, bukan di laguna).
  let houseD = landD - 6;
  while (houseD < landD - 1.5 && (h(houseD) > 5 || h(houseD) < 0.8)) houseD += 0.5;
  const hx = island.x + ux * houseD;
  const hz = island.z + uz * houseD;
  return {
    island,
    x: island.x + ux * waterD,
    z: island.z + uz * waterD,
    rot: Math.atan2(-ux, -uz),
    land: { x: island.x + ux * landD, z: island.z + uz * landD },
    len: waterD - landD,
    house: { x: hx, z: hz, y: terrainHeight(hx, hz) },
  };
}

/** Arah dermaga tiap pulau (umumnya menghadap pelabuhan, Barokah menghadap celah karang). */
const DOCK_DIR: Record<string, XZ> = {
  pelabuhan: { x: 0, z: -1 },
  barokah: { x: Math.sin(REEF.gap), z: Math.cos(REEF.gap) },
  mercusuar: { x: 0.3, z: 1 },
  berkah: { x: -0.6, z: -1 },
  sentosa: { x: -1, z: -0.2 },
};

export const DOCKS: Dock[] = ISLANDS.filter((island) => island.shop !== undefined || island.id === "pelabuhan" || island.id === "mercusuar").map((island) =>
  makeDock(island, DOCK_DIR[island.id] ?? { x: HARBOR.x - island.x, z: HARBOR.z - 30 - island.z })
);
export const HARBOR_DOCK = DOCKS.find((dock) => dock.island.id === "pelabuhan")!;
export const LIGHTHOUSE_DOCK = DOCKS.find((dock) => dock.island.id === "mercusuar")!;
export const SHOP_DOCKS = DOCKS.filter((dock) => dock.island.shop !== undefined).sort((a, b) => a.island.shop! - b.island.shop!);
export const DOCK_RADIUS = 10;

export const START = { x: HARBOR_DOCK.x, z: HARBOR_DOCK.z - 13, heading: Math.PI };

/* ------------------------------ prediksi pengiriman ---------------- */

export interface ForecastOption {
  jumlah: number;
  label: string;
  benar: boolean;
  penjelasan: string;
}

export interface Forecast {
  shop: number;
  toko: string;
  nilai: number;
  opsi: ForecastOption[];
}

const up5 = (n: number) => Math.round(n * 1.05);

function forecastFor(k: number): Forecast {
  const { label, nilai } = SALES[k];
  let opsi: ForecastOption[];
  if (label === "Barokah") {
    opsi = [
      { jumlah: 0, label: "0 sak: datanya nol, berarti tidak laku", benar: false, penjelasan: "Hati-hati! Angka nol bukan berarti tidak ada permintaan. Kiriman ke Barokah terputus karena kapal suplai kandas, stoknya yang kosong." },
      { jumlah: 125, label: "125 sak: stok normal, permintaan tetap ada", benar: true, penjelasan: "Tepat! Penjualan nol karena stok kosong (kapal suplai kandas), bukan tidak laku. Pulihkan pasokan setara toko sejenis." },
      { jumlah: 15, label: "15 sak: coba sedikit dulu", benar: false, penjelasan: "Terlalu sedikit. Pelanggan Barokah sudah menunggu 3 minggu, toko akan kehabisan lagi dalam sehari." },
    ];
  } else if (label === "Berkah") {
    opsi = [
      { jumlah: up5(nilai), label: `${up5(nilai)} sak: ikuti tren +5%`, benar: true, penjelasan: `Benar. ${nilai} sak bulan lalu × 1,05 ≈ ${up5(nilai)} sak. Harga Rp650.000 di data lama adalah salah ketik, bukan lonjakan permintaan.` },
      { jumlah: nilai * 10, label: `${nilai * 10} sak: nilai transaksinya 10× lipat!`, benar: false, penjelasan: "Itu terkecoh anomali harga (Rp650.000, kelebihan satu nol). Jumlah unitnya tetap normal." },
      { jumlah: Math.round(nilai * 0.7), label: `${Math.round(nilai * 0.7)} sak: kurangi, harganya terlalu mahal`, benar: false, penjelasan: "Harga mahal itu salah ketik. Permintaan riil Berkah justru naik mengikuti tren." },
    ];
  } else {
    const low = Math.round(nilai * 0.75);
    const high = nilai * 2;
    opsi = [
      { jumlah: low, label: `${low} sak: kurangi, jaga-jaga`, benar: false, penjelasan: `Stok akan kurang. Tren total penjualan naik ±5% per bulan, jadi ${label} butuh lebih, bukan kurang.` },
      { jumlah: up5(nilai), label: `${up5(nilai)} sak: ikuti tren +5%`, benar: true, penjelasan: `Tepat! ${nilai} sak bulan lalu × 1,05 ≈ ${up5(nilai)} sak. Prediksi berbasis tren menjaga stok cukup tanpa menumpuk.` },
      { jumlah: high, label: `${high} sak: gandakan saja`, benar: false, penjelasan: "Berlebihan. Tidak ada data yang menunjukkan permintaan melonjak 2×; semen menumpuk & modal tertahan." },
    ];
  }
  // Urutan opsi diacak deterministik supaya jawaban benar tidak selalu di tengah.
  const rand = seeded(40 + k);
  for (let i = opsi.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [opsi[i], opsi[j]] = [opsi[j], opsi[i]];
  }
  return { shop: k, toko: label, nilai, opsi };
}

export const FORECASTS: Forecast[] = SALES.map((_, k) => forecastFor(k));

/* ------------------------------ ubur-ubur data --------------------- */

export interface Jelly {
  id: number;
  x: number;
  z: number;
  toko: string;
  teks: string;
  anomali: boolean;
  color: string;
  judul?: string;
  penjelasan?: string;
  konsep?: string;
}

const ANOMALIES: Omit<Jelly, "id" | "x" | "z" | "color" | "anomali">[] = [
  { toko: "Barokah", teks: "−5 unit", judul: "Nilai negatif", penjelasan: "Penjualan tidak mungkin negatif, ini salah input.", konsep: "Deteksi anomali" },
  { toko: "Berkah", teks: "Rp650.000", judul: "Harga 10× lipat", penjelasan: "Toko lain Rp65.000/sak. Kelebihan satu angka nol, outlier.", konsep: "Outlier" },
  { toko: "Sentosa", teks: "8.800 unit", judul: "Lonjakan mustahil", penjelasan: "Rata-rata Sentosa 88 unit; 8.800 itu 100× lipat, jauh di luar klaster.", konsep: "Outlier" },
  { toko: "Amanah", teks: "1.500 unit", judul: "Jauh dari klaster", penjelasan: "Amanah biasanya ±150 unit. Titik ini 10× lebih tinggi dari kelompoknya.", konsep: "Clustering" },
  { toko: "Jaya", teks: "−210 unit", judul: "Tanda terbalik", penjelasan: "Angka Jaya tercatat minus, kemungkinan retur yang salah kolom.", konsep: "Deteksi anomali" },
  { toko: "Makmur", teks: "120 · salinan", judul: "Baris duplikat", penjelasan: "Transaksi Makmur tercatat dua kali. Kalau dibiarkan, penjualannya terhitung ganda.", konsep: "Duplikat" },
  { toko: "Sejahtera", teks: "950 unit", judul: "Salah ketik angka", penjelasan: "Sejahtera biasanya ±95 unit. 950 = kelebihan satu digit.", konsep: "Outlier" },
  { toko: "Sentosa", teks: "0,88 unit", judul: "Desimal janggal", penjelasan: "Sak semen dijual utuh. 0,88 unit berarti salah format angka.", konsep: "Deteksi anomali" },
  { toko: "Jaya", teks: "99.999 unit", judul: "Angka pengganti", penjelasan: "99.999 adalah nilai 'placeholder' sistem lama, bukan penjualan asli.", konsep: "Deteksi anomali" },
  { toko: "Makmur", teks: "Rp6.500", judul: "Harga terlalu rendah", penjelasan: "Harga 10× lebih murah dari seharusnya, kurang satu angka nol.", konsep: "Outlier" },
];

export const JELLIES: Jelly[] = (() => {
  const rand = seeded(313);
  const list: Jelly[] = [];
  // Data normal berkumpul membentuk klaster di dekat pulau tokonya.
  SHOP_DOCKS.forEach((dock) => {
    const { label, nilai } = SALES[dock.island.shop!];
    const count = label === "Barokah" ? 0 : 3;
    for (let k = 0; k < count; k++) {
      const a = rand() * Math.PI * 2;
      const d = 14 + rand() * 12;
      const v = Math.round(nilai * (0.9 + rand() * 0.2));
      list.push({ id: list.length, x: dock.x + Math.sin(a) * d, z: dock.z + Math.cos(a) * d, toko: label, teks: `${v} unit`, anomali: false, color: dock.island.color });
    }
  });
  // Anomali menjauh dari klasternya (di jalur antar pulau).
  ANOMALIES.forEach((anomaly, k) => {
    const home = SHOP_DOCKS.find((dock) => SALES[dock.island.shop!].label === anomaly.toko) ?? SHOP_DOCKS[k % SHOP_DOCKS.length];
    const a = Math.atan2(HARBOR_DOCK.x - home.x, HARBOR_DOCK.z - home.z) + (rand() - 0.5) * 1.4;
    const d = 38 + rand() * 30 + (k % 3) * 8;
    list.push({ id: list.length, x: home.x + Math.sin(a) * d, z: home.z + Math.cos(a) * d, anomali: true, color: home.island.color, ...anomaly });
  });
  // Pastikan tidak ada yang terdampar di darat.
  list.forEach((jelly) => {
    for (let guard = 0; guard < 40 && terrainHeight(jelly.x, jelly.z) > -2.5; guard++) {
      jelly.x += (jelly.x - HARBOR.x) * 0.04 + 2;
      jelly.z += (jelly.z - HARBOR.z) * 0.04;
    }
  });
  return list;
})();

export const ANOMALY_TOTAL = JELLIES.filter((jelly) => jelly.anomali).length;

/* ------------------------------ bukti Barokah ---------------------- */

export const WRECK = (() => {
  const a = REEF.gap + 0.62;
  const x = REEF.x + Math.sin(a) * (REEF.r + 3);
  const z = REEF.z + Math.cos(a) * (REEF.r + 3);
  return { x, z, rot: a + 1.2, radius: 20 };
})();

/* ------------------------------ bahaya ----------------------------- */

export interface Rock {
  x: number;
  z: number;
  r: number;
  h: number;
}

export const ROCKS: Rock[] = (() => {
  const rand = seeded(77);
  const list: Rock[] = [];
  // Batu karang pengepung Barokah.
  for (let a = 0; a < Math.PI * 2; a += 0.12) {
    if (Math.abs(wrapAngle(a - REEF.gap)) < REEF.gapHalf + 0.04) continue;
    const r = REEF.r + (rand() - 0.5) * 2.4;
    list.push({ x: REEF.x + Math.sin(a) * r, z: REEF.z + Math.cos(a) * r, r: 1.5 + rand() * 1.1, h: 0.8 + rand() * 1.8 });
  }
  // Ladang batu di laut terbuka.
  const fields = [
    { x: -40, z: -60, n: 7 },
    { x: 150, z: -115, n: 6 },
    { x: -150, z: 20, n: 6 },
    { x: 60, z: 90, n: 5 },
    { x: -40, z: 200, n: 6 },
  ];
  fields.forEach((field) => {
    for (let k = 0; k < field.n; k++) {
      const a = rand() * Math.PI * 2;
      const d = 4 + rand() * 16;
      list.push({ x: field.x + Math.sin(a) * d, z: field.z + Math.cos(a) * d, r: 1.2 + rand() * 1.6, h: 0.6 + rand() * 2.6 });
    }
  });
  return list;
})();

export const WHIRLPOOLS = [
  { x: 8, z: -70, r: 15 },
  { x: 150, z: 5, r: 15 },
  { x: 20, z: 170, r: 14 },
  { x: -130, z: 150, r: 14 },
];

/** Botol pesan emas: +waktu & combo. */
export const BOTTLES: XZ[] = (() => {
  const rand = seeded(505);
  const list: XZ[] = [];
  [...SHOP_DOCKS, LIGHTHOUSE_DOCK].forEach((dock) => {
    [0.3, 0.55, 0.8].forEach((f) => {
      const x = THREE.MathUtils.lerp(HARBOR_DOCK.x, dock.x, f) + (rand() - 0.5) * 18;
      const z = THREE.MathUtils.lerp(HARBOR_DOCK.z, dock.z, f) + (rand() - 0.5) * 18;
      if (terrainHeight(x, z) < -2.5) list.push({ x, z });
    });
  });
  return list;
})();

/* ------------------------------ angin ------------------------------ */

/** Arah angin bertiup (sudut heading ke mana angin pergi), berubah pelan. */
export function windDir(time: number) {
  return 0.7 + Math.sin(time * 0.021) * 1.3 + Math.sin(time * 0.057 + 1.3) * 0.35;
}

/** Efisiensi layar menurut sudut kapal terhadap angin (0 = angin dari buritan). */
export function sailEfficiency(rel: number) {
  const a = Math.abs(wrapAngle(rel));
  if (a <= Math.PI / 2) return 0.8 + 0.2 * Math.sin(a);
  if (a <= 2.3) return 1 - ((a - Math.PI / 2) / (2.3 - Math.PI / 2)) * 0.25;
  return 0.75 - ((a - 2.3) / (Math.PI - 2.3)) * 0.57;
}

export function pointOfSail(rel: number) {
  const a = Math.abs(wrapAngle(rel));
  if (a < 0.7) return "Angin buritan";
  if (a < 2.2) return "Angin samping";
  if (a < 2.6) return "Menyamping haluan";
  return "Melawan angin";
}

/* ------------------------------ kuis mercusuar --------------------- */

export interface SeaQuestion {
  id: string;
  pertanyaan: string;
  opsi: { id: string; label: string; benar: boolean; penjelasan: string }[];
}

export const SEA_QUIZ: SeaQuestion[] = [
  ...INSIGHT_QUESTIONS.map((q) => ({ id: q.id, pertanyaan: q.pertanyaan, opsi: q.opsi })),
  {
    id: "q3",
    pertanyaan: "Sebelum membuat grafik laporan, apa yang sebaiknya dilakukan pada data Rp650.000 milik Toko Berkah?",
    opsi: [
      { id: "a", label: "Biarkan, semua data harus dipakai apa adanya", benar: false, penjelasan: "Outlier salah ketik akan membuat rata-rata harga melonjak dan menyesatkan kesimpulan." },
      { id: "b", label: "Cek ke sumbernya lalu perbaiki menjadi Rp65.000", benar: true, penjelasan: "Tepat! Anomali diverifikasi dulu, lalu dikoreksi, bukan asal dihapus atau dibiarkan." },
      { id: "c", label: "Hapus semua data Toko Berkah", benar: false, penjelasan: "Terlalu berlebihan, data penjualan Berkah yang lain valid dan penting." },
    ],
  },
];

/* ------------------------------ tabrakan --------------------------- */

/** Tinggi dasar di mana lambung kandas. */
export const KEEL = -0.9;

export function rockHit(x: number, z: number, radius: number) {
  for (const rock of ROCKS) {
    const d = Math.hypot(x - rock.x, z - rock.z);
    if (d < rock.r + radius) return { rock, d };
  }
  return null;
}

/* ------------------------------ flora ------------------------------ */

export interface SeaFlora {
  palms: Inst[];
  jungle: Inst[];
  mangroves: Inst[];
  bushes: Inst[];
  grass: Inst[];
  flowers: Inst[];
  rocks: Inst[];
  deadTrees: Inst[];
  corals: Inst[];
  seaweed: Inst[];
  driftwood: Inst[];
  huts: (XZ & { y: number; rot: number; color: string })[];
}

const LEAF = ["#3f8f3a", "#4d9d45", "#5aa84f", "#3b7f35", "#6bb04a"];
const PALM = ["#4f9a3c", "#5fae45", "#6fb64f", "#3f8a36"];
const CORAL = ["#ff7f6e", "#ffb3c1", "#ffd166", "#b388eb", "#ff9f1c", "#f7a072"];
const FLOWERS = ["#ffd166", "#ef476f", "#f8f9fa", "#ff9f1c", "#c77dff"];
const pick = <T,>(list: T[], r: number) => list[Math.floor(r * list.length) % list.length];

function nearStructure(x: number, z: number, margin: number) {
  for (const dock of DOCKS) {
    if (Math.hypot(x - dock.house.x, z - dock.house.z) < 6 + margin) return true;
    // Koridor dermaga.
    const dx = dock.x - dock.land.x;
    const dz = dock.z - dock.land.z;
    const len = Math.hypot(dx, dz) || 1;
    const t = clamp(((x - dock.land.x) * dx + (z - dock.land.z) * dz) / (len * len), -0.3, 1);
    if (Math.hypot(x - (dock.land.x + dx * t), z - (dock.land.z + dz * t)) < 3 + margin) return true;
  }
  if (Math.hypot(x - HARBOR.x, z - (HARBOR.z - 14)) < 24 + margin) return true;
  if (Math.hypot(x - LIGHTHOUSE_ISLAND.x, z - LIGHTHOUSE_ISLAND.z) < 6 + margin) return true;
  return false;
}

export function scatterFlora(quality: GameQuality): SeaFlora {
  const scale = quality === "hemat" ? 0.45 : quality === "tinggi" ? 1.25 : 0.8;
  const rand = seeded(2025);
  const f: SeaFlora = { palms: [], jungle: [], mangroves: [], bushes: [], grass: [], flowers: [], rocks: [], deadTrees: [], corals: [], seaweed: [], driftwood: [], huts: [] };
  for (const island of ISLANDS) {
    const tries = Math.round(island.r * island.r * 1.1 * scale);
    for (let i = 0; i < tries; i++) {
      const a = rand() * Math.PI * 2;
      const d = Math.sqrt(rand()) * island.r * 1.8;
      const x = island.x + Math.sin(a) * d;
      const z = island.z + Math.cos(a) * d;
      const h = terrainHeight(x, z);
      const { island: owner, t } = islandAt(x, z);
      if (owner !== island) continue;
      const r = rand();
      const rot: [number, number, number] = [0, rand() * Math.PI * 2, 0];
      // Bawah air: terumbu karang & rumput laut di paparan dangkal.
      if (h < -0.4) {
        if (h > -2.8 && island.kind !== "bakau" && r < 0.5) f.corals.push({ p: [x, h, z], r: [rand() * 0.4, rot[1], rand() * 0.4], s: 0.5 + rand() * 0.9, c: pick(CORAL, rand()) });
        else if (h < -1.4 && h > -4.5 && r < 0.75) f.seaweed.push({ p: [x, h, z], r: rot, s: Math.min(0.7 + rand() * 0.8, (-h - 0.5) / 3) });
        continue;
      }
      if (nearStructure(x, z, 1)) continue;
      if (island.kind === "bakau") {
        if (h < 1.6 && r < 0.55) f.mangroves.push({ p: [x, Math.min(h, 0.3) - 0.1, z], r: rot, s: 0.8 + rand() * 0.6, c: pick(LEAF, rand()) });
        else if (r < 0.8) f.jungle.push({ p: [x, h - 0.2, z], r: rot, s: 0.8 + rand() * 0.5, c: pick(LEAF, rand()) });
        else f.grass.push({ p: [x, h, z], r: rot, s: 0.9 + rand() * 0.6 });
        continue;
      }
      if (h < 0.3) continue;
      if (island.kind === "vulkanik") {
        if (h > island.h * 0.55) {
          if (r < 0.25) f.rocks.push({ p: [x, h - 0.2, z], r: [rand(), rand() * 6, rand()], s: 0.6 + rand() * 1.6, c: pick(["#4a4543", "#5c5552", "#3d3a39"], rand()) });
          else if (r < 0.32) f.deadTrees.push({ p: [x, h - 0.1, z], r: rot, s: 0.8 + rand() * 0.5 });
          continue;
        }
        if (t < 0.12 && r < 0.4) f.palms.push({ p: [x, h - 0.1, z], r: [0, rot[1], (rand() - 0.5) * 0.3], s: 0.8 + rand() * 0.45, c: pick(PALM, rand()) });
        else if (r < 0.55) f.jungle.push({ p: [x, h - 0.2, z], r: rot, s: 0.9 + rand() * 0.7, c: pick(LEAF, rand()) });
        else if (r < 0.75) f.bushes.push({ p: [x, h, z], r: rot, s: 0.7 + rand() * 0.7, c: pick(LEAF, rand()) });
        else f.grass.push({ p: [x, h, z], r: rot, s: 0.8 + rand() * 0.6 });
        continue;
      }
      if (island.kind === "karang" || (island.kind === "tebing" && h > island.h * 0.9 && r < 0.2) || (island.kind === "tanjung" && r < 0.25)) {
        f.rocks.push({ p: [x, h - 0.3, z], r: [rand(), rand() * 6, rand()], s: 0.6 + rand() * 1.8, c: pick(["#8b8b7e", "#9a958a", "#7d7a70"], rand()) });
        if (island.kind === "karang") continue;
      }
      const beach = t < 0.2 || h < 1.4;
      if (beach) {
        if (r < 0.35) f.palms.push({ p: [x, h - 0.1, z], r: [0, rot[1], (rand() - 0.5) * 0.35], s: 0.8 + rand() * 0.5, c: pick(PALM, rand()) });
        else if (r < 0.42) f.driftwood.push({ p: [x, h + 0.1, z], r: [Math.PI / 2, rot[1], 0], s: [0.8, 1.5 + rand() * 1.5, 0.8] });
        else if (r < 0.5) f.rocks.push({ p: [x, h - 0.2, z], r: [rand(), rand() * 6, rand()], s: 0.3 + rand() * 0.6, c: "#b6ab96" });
        continue;
      }
      if (r < 0.28) f.palms.push({ p: [x, h - 0.1, z], r: [0, rot[1], (rand() - 0.5) * 0.25], s: 0.9 + rand() * 0.5, c: pick(PALM, rand()) });
      else if (r < 0.52) f.jungle.push({ p: [x, h - 0.2, z], r: rot, s: 0.8 + rand() * 0.8, c: pick(LEAF, rand()) });
      else if (r < 0.66) f.bushes.push({ p: [x, h, z], r: rot, s: 0.6 + rand() * 0.8, c: pick(LEAF, rand()) });
      else if (r < 0.9) f.grass.push({ p: [x, h, z], r: rot, s: 0.8 + rand() * 0.7 });
      else f.flowers.push({ p: [x, h, z], r: rot, s: 0.8 + rand() * 0.6, c: pick(FLOWERS, rand()) });
    }
    // Gubuk warga di pulau berpenghuni.
    if (island.shop !== undefined && island.kind !== "atol") {
      for (let k = 0; k < 3; k++) {
        for (let guard = 0; guard < 30; guard++) {
          const a = rand() * Math.PI * 2;
          const d = island.r * (0.3 + rand() * 0.45);
          const x = island.x + Math.sin(a) * d;
          const z = island.z + Math.cos(a) * d;
          const h = terrainHeight(x, z);
          if (h < 0.8 || h > 6 || nearStructure(x, z, 3) || f.huts.some((hut) => Math.hypot(hut.x - x, hut.z - z) < 7)) continue;
          f.huts.push({ x, z, y: h, rot: Math.atan2(island.x - x, island.z - z) + Math.PI, color: pick(["#e9d8a6", "#e6ccb2", "#f4d6cc", "#d8e2dc"], rand()) });
          break;
        }
      }
    }
  }
  // Karang dangkal di cincin Barokah.
  for (let a = 0; a < Math.PI * 2; a += 0.07 / scale) {
    const r = REEF.r + (rand() - 0.5) * 9;
    const x = REEF.x + Math.sin(a) * r;
    const z = REEF.z + Math.cos(a) * r;
    const h = terrainHeight(x, z);
    if (h < -0.5 && h > -3) f.corals.push({ p: [x, h, z], r: [rand() * 0.4, rand() * 6, rand() * 0.4], s: 0.6 + rand() * 0.9, c: pick(CORAL, rand()) });
  }
  return f;
}

/* ------------------------------ kehidupan -------------------------- */

/** Rute perahu nelayan (lingkaran pelan di sela pulau). */
export const FISHING_BOATS = [
  { cx: -40, cz: 20, r: 38, speed: 0.05, sail: "#e63946" },
  { cx: 60, cz: -40, r: 46, speed: -0.04, sail: "#f4a261" },
  { cx: -120, cz: -140, r: 30, speed: 0.06, sail: "#ffffff" },
  { cx: 150, cz: 110, r: 34, speed: -0.05, sail: "#2a9d8f" },
  { cx: 10, cz: -170, r: 36, speed: 0.045, sail: "#ffd166" },
];

export function boatAt(k: number, time: number) {
  const b = FISHING_BOATS[k];
  const a = time * b.speed + k * 1.7;
  return { x: b.cx + Math.sin(a) * b.r, z: b.cz + Math.cos(a) * b.r, rot: a + (b.speed > 0 ? Math.PI / 2 : -Math.PI / 2) };
}

/** Titik-titik air dangkal untuk penyu. */
export const TURTLE_SPOTS: XZ[] = ISLANDS.filter((island) => island.kind === "tropis" || island.kind === "atol").map((island) => ({ x: island.x + island.r * 1.25, z: island.z - island.r * 0.4 }));
