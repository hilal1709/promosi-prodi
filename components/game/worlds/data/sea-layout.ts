import * as THREE from "three";
import type { GameQuality } from "@/lib/types";
import { CHART_QUESTIONS } from "@/lib/data/missions";
import { fbm, seeded } from "../erp/race-track";
import { drawVariants, sample, shuffled } from "../quiz-bank";

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
  /** Penjualan bulan lalu (Juni). */
  nilai: number;
  pertanyaan: string;
  konsep: string;
  /** Riwayat penjualan toko ini; `null` = data hilang. */
  riwayat: { label: string; nilai: number | null }[];
  catatan: string;
  /** Kasus Barokah: keterangan tambahan muncul setelah bukti kapal kandas ditemukan. */
  butuhBukti?: boolean;
  opsi: ForecastOption[];
}

type ForecastCase = Omit<Forecast, "shop" | "toko" | "nilai">;

const JULI = "berapa sak semen yang kamu turunkan untuk bulan Juli?";

/** Bank studi kasus per toko (index = toko di SALES). Tiap main diundi satu kasus per toko. */
export const FORECAST_BANK: ForecastCase[][] = [
  // Makmur
  [
    {
      pertanyaan: JULI,
      konsep: "Pola musiman",
      riwayat: [{ label: "Mar", nilai: 110 }, { label: "Apr", nilai: 114 }, { label: "Mei", nilai: 118 }, { label: "Jun", nilai: 120 }],
      catatan: "Tahun lalu: Juni 115 sak lalu Juli anjlok ke 80 sak karena musim hujan (pengecoran ditunda). Prakiraan cuaca Juli tahun ini juga hujan lebat.",
      opsi: [
        { jumlah: 84, label: "84 sak: turun ±30% seperti musim hujan tahun lalu", benar: true, penjelasan: "Tepat! Pola musiman lebih kuat daripada tren bulanan. 120 × 0,7 ≈ 84 sak." },
        { jumlah: 126, label: "126 sak: tren 4 bulan terakhir naik terus", benar: false, penjelasan: "Tren naik itu terjadi di musim kemarau. Data tahun lalu menunjukkan Juli selalu turun saat hujan." },
        { jumlah: 40, label: "40 sak: hujan berarti proyek berhenti total", benar: false, penjelasan: "Terlalu pesimis. Tahun lalu penjualan hanya turun ±30%, bukan berhenti. Toko akan kehabisan." },
      ],
    },
    {
      pertanyaan: JULI,
      konsep: "Pesanan di muka",
      riwayat: [{ label: "Mar", nilai: 118 }, { label: "Apr", nilai: 121 }, { label: "Mei", nilai: 119 }, { label: "Jun", nilai: 120 }],
      catatan: "Penjualan eceran Makmur stabil ±120 sak. Kontraktor drainase desa sudah membayar uang muka untuk 60 sak yang diambil awal Juli.",
      opsi: [
        { jumlah: 120, label: "120 sak: penjualannya stabil, samakan saja", benar: false, penjelasan: "Pesanan kontraktor 60 sak sudah pasti tapi terlupa. Pelanggan eceran akan kehabisan." },
        { jumlah: 180, label: "180 sak: eceran 120 + pesanan kontraktor 60", benar: true, penjelasan: "Benar! Permintaan rutin ditambah pesanan yang sudah pasti (sudah dibayar) = 180 sak." },
        { jumlah: 240, label: "240 sak: ada proyek, gandakan saja", benar: false, penjelasan: "Proyeknya hanya butuh 60 sak. Menggandakan stok membuat semen menumpuk dan modal tertahan." },
      ],
    },
  ],
  // Sejahtera
  [
    {
      pertanyaan: JULI,
      konsep: "Lonjakan sekali terjadi",
      riwayat: [{ label: "Feb", nilai: 60 }, { label: "Mar", nilai: 62 }, { label: "Apr", nilai: 58 }, { label: "Mei", nilai: 61 }, { label: "Jun", nilai: 95 }],
      catatan: "Juni ada satu pesanan borongan 35 sak untuk renovasi masjid. Pesanan itu tidak akan berulang.",
      opsi: [
        { jumlah: 100, label: "100 sak: Juni 95 sak, tambah 5%", benar: false, penjelasan: "Angka Juni terdongkrak pesanan sekali. Kalau dijadikan patokan, 35-an sak akan menumpuk." },
        { jumlah: 130, label: "130 sak: lonjakan Juni akan berlanjut", benar: false, penjelasan: "Tidak ada bukti lonjakan berlanjut; renovasi masjid sudah selesai." },
        { jumlah: 60, label: "60 sak: kembali ke pola normal ±60 sak", benar: true, penjelasan: "Tepat! Pisahkan kejadian sekali dari permintaan rutin. Baseline Sejahtera ±60 sak." },
      ],
    },
    {
      pertanyaan: JULI,
      konsep: "Faktor eksternal",
      riwayat: [{ label: "Mar", nilai: 94 }, { label: "Apr", nilai: 96 }, { label: "Mei", nilai: 95 }, { label: "Jun", nilai: 95 }],
      catatan: "Awal Juli toko bangunan besar dibuka 200 m dari Sejahtera. Tahun lalu, saat hal serupa terjadi di pulau lain, penjualan toko lama turun ±20%.",
      opsi: [
        { jumlah: 95, label: "95 sak: datanya stabil 4 bulan", benar: false, penjelasan: "Data masa lalu belum mencerminkan pesaing baru. Faktor eksternal harus ikut dihitung." },
        { jumlah: 76, label: "76 sak: turun ±20% karena ada pesaing", benar: true, penjelasan: "Benar! Kasus serupa di pulau lain jadi acuan. 95 × 0,8 = 76 sak." },
        { jumlah: 30, label: "30 sak: pelanggan pasti pindah semua", benar: false, penjelasan: "Terlalu pesimis. Pelanggan setia & jarak dekat tetap membuat Sejahtera laku." },
      ],
    },
  ],
  // Barokah
  [
    {
      pertanyaan: JULI,
      konsep: "Stok kosong ≠ tidak laku",
      butuhBukti: true,
      riwayat: [{ label: "Feb", nilai: 118 }, { label: "Mar", nilai: 122 }, { label: "Apr", nilai: 125 }, { label: "Mei", nilai: 40 }, { label: "Jun", nilai: 0 }],
      catatan: "Penjualan Barokah jatuh sejak pertengahan Mei.",
      opsi: [
        { jumlah: 0, label: "0 sak: datanya nol, berarti tidak laku", benar: false, penjelasan: "Hati-hati! Angka nol bukan berarti tidak ada permintaan. Kiriman ke Barokah terputus karena kapal suplai kandas, stoknya yang kosong." },
        { jumlah: 125, label: "125 sak: pulihkan ke tingkat sebelum stok kosong", benar: true, penjelasan: "Tepat! Penjualan nol karena stok kosong, bukan tidak laku. Pulihkan pasokan seperti April." },
        { jumlah: 15, label: "15 sak: coba sedikit dulu", benar: false, penjelasan: "Terlalu sedikit. Pelanggan Barokah sudah menunggu berminggu-minggu, toko akan kehabisan lagi dalam sehari." },
      ],
    },
    {
      pertanyaan: JULI,
      konsep: "Permintaan tertunda",
      butuhBukti: true,
      riwayat: [{ label: "Mar", nilai: 120 }, { label: "Apr", nilai: 124 }, { label: "Mei", nilai: 0 }, { label: "Jun", nilai: 0 }],
      catatan: "Pemilik toko mencatat 60 sak pesanan warga yang tertunda selama stok kosong.",
      opsi: [
        { jumlah: 125, label: "125 sak: kembali ke penjualan normal", benar: false, penjelasan: "Kurang. Permintaan normal ±125 sak belum termasuk 60 sak pesanan yang tertunda." },
        { jumlah: 185, label: "185 sak: normal 125 + pesanan tertunda 60", benar: true, penjelasan: "Tepat! Selama stok kosong permintaan tidak hilang, melainkan menumpuk (backlog)." },
        { jumlah: 0, label: "0 sak: 2 bulan tanpa penjualan", benar: false, penjelasan: "Nol karena tidak ada barang, bukan tidak ada pembeli. Kapal suplainya yang kandas." },
      ],
    },
  ],
  // Jaya
  [
    {
      pertanyaan: JULI,
      konsep: "Rata-rata bergerak",
      riwayat: [{ label: "Mar", nilai: 150 }, { label: "Apr", nilai: 260 }, { label: "Mei", nilai: 130 }, { label: "Jun", nilai: 210 }],
      catatan: "Penjualan Jaya naik-turun tajam tanpa pola musim atau proyek khusus.",
      opsi: [
        { jumlah: 290, label: "290 sak: Mei→Juni naik 80, lanjutkan naiknya", benar: false, penjelasan: "Menarik tren dari 2 titik yang berfluktuasi itu menyesatkan. Bulan berikutnya bisa saja turun lagi." },
        { jumlah: 200, label: "200 sak: rata-rata 3 bulan terakhir", benar: true, penjelasan: "Tepat! (260 + 130 + 210) ÷ 3 = 200. Rata-rata bergerak meredam naik-turun acak." },
        { jumlah: 130, label: "130 sak: pakai angka terendah biar aman", benar: false, penjelasan: "Terlalu rendah. Dua dari tiga bulan terakhir jauh di atas 130, toko sering kehabisan." },
      ],
    },
    {
      pertanyaan: "Toko Jaya: berapa sak yang perlu dikirim untuk bulan Juli?",
      konsep: "Kebutuhan bersih",
      riwayat: [{ label: "Mar", nilai: 205 }, { label: "Apr", nilai: 208 }, { label: "Mei", nilai: 212 }, { label: "Jun", nilai: 210 }],
      catatan: "Gudang Jaya masih menyimpan 90 sak sisa Juni. Stok pengaman akhir bulan cukup 50 sak.",
      opsi: [
        { jumlah: 210, label: "210 sak: sama dengan penjualan Juni", benar: false, penjelasan: "Lupa menghitung 90 sak yang masih ada di gudang, stok akan menumpuk." },
        { jumlah: 260, label: "260 sak: penjualan 210 + stok pengaman 50", benar: false, penjelasan: "Hampir! Tapi sisa 90 sak di gudang belum dikurangkan." },
        { jumlah: 170, label: "170 sak: 210 + 50 pengaman − 90 sisa gudang", benar: true, penjelasan: "Tepat! Kebutuhan bersih = perkiraan permintaan + stok pengaman − stok yang sudah ada." },
      ],
    },
  ],
  // Amanah
  [
    {
      pertanyaan: JULI,
      konsep: "Efek promosi",
      riwayat: [{ label: "Mar", nilai: 100 }, { label: "Apr", nilai: 102 }, { label: "Mei", nilai: 98 }, { label: "Jun", nilai: 150 }],
      catatan: "Juni ada diskon 20% untuk ulang tahun toko. Mulai Juli harga kembali normal.",
      opsi: [
        { jumlah: 158, label: "158 sak: Juni 150 sak, tambah 5%", benar: false, penjelasan: "Lonjakan Juni dipicu diskon. Tanpa promo, pembeli kembali ke pola biasa." },
        { jumlah: 100, label: "100 sak: pola normal sebelum promo", benar: true, penjelasan: "Tepat! Pisahkan efek promo dari permintaan dasar. Tanpa diskon, Amanah ±100 sak." },
        { jumlah: 150, label: "150 sak: pelanggan baru pasti bertahan", benar: false, penjelasan: "Sebagian pembeli promo hanya menimbun saat murah. Juli malah bisa sedikit lebih sepi." },
      ],
    },
    {
      pertanyaan: JULI,
      konsep: "Tren naik konsisten",
      riwayat: [{ label: "Feb", nilai: 118 }, { label: "Mar", nilai: 125 }, { label: "Apr", nilai: 133 }, { label: "Mei", nilai: 141 }, { label: "Jun", nilai: 150 }],
      catatan: "Perumahan baru di Pulau Amanah terus bertambah, penjualan naik ±8 sak tiap bulan tanpa promo.",
      opsi: [
        { jumlah: 141, label: "141 sak: rata-rata 3 bulan terakhir", benar: false, penjelasan: "Rata-rata tertinggal saat trennya konsisten naik. Juli justru di atas Juni." },
        { jumlah: 150, label: "150 sak: samakan dengan Juni", benar: false, penjelasan: "Kenaikan ±8 sak per bulan sudah terjadi 5 bulan berturut-turut, jadi Juli akan kurang." },
        { jumlah: 158, label: "158 sak: lanjutkan kenaikan ±8 sak", benar: true, penjelasan: "Tepat! Tren linier yang stabil & punya alasan jelas (perumahan baru) layak dilanjutkan." },
      ],
    },
  ],
  // Sentosa
  [
    {
      pertanyaan: "Toko Sentosa: kapal mampir 2× sebulan. Berapa sak yang diturunkan di kiriman awal Juli ini?",
      konsep: "Kendala kapasitas",
      riwayat: [{ label: "Mar", nilai: 80 }, { label: "Apr", nilai: 84 }, { label: "Mei", nilai: 86 }, { label: "Jun", nilai: 88 }],
      catatan: "Perkiraan Juli ±92 sak. Gudang di atol hanya muat 60 sak; semen di luar gudang cepat lembap.",
      opsi: [
        { jumlah: 92, label: "92 sak: kebutuhan sebulan sekaligus", benar: false, penjelasan: "Melebihi kapasitas gudang 60 sak. Sisa 32 sak di luar gudang akan rusak kena lembap." },
        { jumlah: 46, label: "46 sak: separuh kebutuhan, sisanya kapal kedua", benar: true, penjelasan: "Tepat! Prediksi harus menyesuaikan kendala nyata: 92 sak dibagi 2 kiriman, muat di gudang." },
        { jumlah: 30, label: "30 sak: sedikit saja supaya tidak lembap", benar: false, penjelasan: "Stok habis sebelum kapal kedua datang di pertengahan bulan." },
      ],
    },
    {
      pertanyaan: JULI,
      konsep: "Data hilang (missing value)",
      riwayat: [{ label: "Mar", nilai: 84 }, { label: "Apr", nilai: null }, { label: "Mei", nilai: 86 }, { label: "Jun", nilai: 88 }],
      catatan: "Buku catatan April basah terkena air laut, datanya tidak terbaca. Toko tetap buka normal sepanjang April.",
      opsi: [
        { jumlah: 65, label: "65 sak: rata-rata 4 bulan, April dihitung 0", benar: false, penjelasan: "Data hilang bukan berarti nol! Mengisi 0 membuat rata-ratanya anjlok." },
        { jumlah: 90, label: "90 sak: abaikan April, ikuti tren data yang ada", benar: true, penjelasan: "Tepat! Data kosong dikeluarkan dari perhitungan (atau diisi perkiraan), bukan dianggap nol." },
        { jumlah: 45, label: "45 sak: datanya tidak lengkap, kirim separuh", benar: false, penjelasan: "Tiga bulan data yang ada sudah cukup menunjukkan pola ±86 sak." },
      ],
    },
  ],
  // Berkah
  [
    {
      pertanyaan: JULI,
      konsep: "Outlier salah ketik",
      riwayat: [{ label: "Mar", nilai: 120 }, { label: "Apr", nilai: 124 }, { label: "Mei", nilai: 128 }, { label: "Jun", nilai: 132 }],
      catatan: "Nilai transaksi Juni melonjak 10× karena ada harga Rp650.000/sak (toko lain Rp65.000).",
      opsi: [
        { jumlah: 136, label: "136 sak: lanjutkan kenaikan ±4 sak", benar: true, penjelasan: "Benar. Harga Rp650.000 salah ketik (kelebihan satu nol), jumlah unitnya tetap normal & naik pelan." },
        { jumlah: 1320, label: "1.320 sak: nilai transaksinya 10× lipat!", benar: false, penjelasan: "Terkecoh anomali harga. Yang diprediksi jumlah sak, dan jumlahnya tidak berubah." },
        { jumlah: 92, label: "92 sak: kurangi, harganya terlalu mahal", benar: false, penjelasan: "Harga mahal itu salah ketik, pembeli tidak benar-benar membayar Rp650.000." },
      ],
    },
    {
      pertanyaan: JULI,
      konsep: "Satuan tidak konsisten",
      riwayat: [{ label: "Mar", nilai: 120 }, { label: "Apr", nilai: 124 }, { label: "Mei", nilai: 6.4 }, { label: "Jun", nilai: 132 }],
      catatan: "Data Mei tertulis 6,4 karena admin baru mencatat dalam ton (1 sak = 50 kg).",
      opsi: [
        { jumlah: 96, label: "96 sak: rata-rata 4 bulan apa adanya", benar: false, penjelasan: "Angka 6,4 masih dalam ton. Satuan dicampur membuat rata-ratanya tidak bermakna." },
        { jumlah: 136, label: "136 sak: Mei = 128 sak, tren naik ±4 sak", benar: true, penjelasan: "Tepat! 6,4 ton ÷ 0,05 ton = 128 sak. Setelah satuan diseragamkan, trennya naik pelan." },
        { jumlah: 200, label: "200 sak: dari 6,4 melonjak ke 132!", benar: false, penjelasan: "Itu bukan lonjakan, hanya perbedaan satuan ton vs sak." },
      ],
    },
    {
      pertanyaan: JULI,
      konsep: "Data ganda",
      riwayat: [{ label: "Mar", nilai: 120 }, { label: "Apr", nilai: 124 }, { label: "Mei", nilai: 256 }, { label: "Jun", nilai: 132 }],
      catatan: "Audit kasir: seluruh nota Mei ter-input dua kali saat sistem kasir error.",
      opsi: [
        { jumlah: 158, label: "158 sak: rata-rata 4 bulan apa adanya", benar: false, penjelasan: "Data Mei terhitung ganda (256 = 2 × 128) sehingga rata-ratanya terlalu tinggi." },
        { jumlah: 256, label: "256 sak: Mei membuktikan Berkah bisa laku segitu", benar: false, penjelasan: "256 sak tidak pernah benar-benar terjual, itu nota dobel." },
        { jumlah: 136, label: "136 sak: Mei dikoreksi 128, tren naik ±4 sak", benar: true, penjelasan: "Tepat! Bersihkan duplikat dulu: 120 → 124 → 128 → 132, jadi Juli ±136 sak." },
      ],
    },
  ],
];

/** Undi satu studi kasus per toko & acak urutan opsinya. Dipanggil setiap level dimulai. */
export function drawForecasts(): Forecast[] {
  return drawVariants(FORECAST_BANK).map((item, k) => ({ ...item, shop: k, toko: SALES[k].label, nilai: SALES[k].nilai }));
}

export const SHOP_NAMES = SALES.map((item) => item.label);

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

/** Bank soal kesimpulan; tiap main diambil SEA_QUIZ_COUNT soal acak. */
export const SEA_QUIZ_BANK: SeaQuestion[] = [
  {
    id: "korelasi",
    pertanyaan: "Pulau yang punya banyak warung kopi ternyata juga penjualan semennya tinggi. Kesimpulan yang tepat?",
    opsi: [
      { id: "a", label: "Buka warung kopi di tiap pulau supaya semen laris", benar: false, penjelasan: "Korelasi bukan sebab-akibat. Warung kopi tidak membuat orang membeli semen." },
      { id: "b", label: "Keduanya mungkin dipengaruhi faktor ketiga, misalnya jumlah penduduk", benar: true, penjelasan: "Tepat! Pulau yang ramai penduduk punya banyak warung sekaligus banyak pembangunan." },
      { id: "c", label: "Datanya pasti salah, hapus kolom warung kopi", benar: false, penjelasan: "Datanya tidak salah, hanya perlu ditafsirkan dengan hati-hati." },
    ],
  },
  {
    id: "error",
    pertanyaan: "Prediksi Mei 110 sak, realisasi 108. Prediksi Juni 100 sak, realisasi 120. Penilaian yang tepat?",
    opsi: [
      { id: "a", label: "Error Juni (20 sak) jauh lebih besar, cari penyebabnya sebelum memakai model lagi", benar: true, penjelasan: "Tepat! Evaluasi prediksi vs realisasi membantu menemukan faktor yang terlewat." },
      { id: "b", label: "Modelnya gagal, buang dan pakai perasaan saja", benar: false, penjelasan: "Satu bulan meleset belum berarti modelnya tidak berguna; Mei hampir tepat." },
      { id: "c", label: "Error tidak penting selama stok tidak habis", benar: false, penjelasan: "Error besar berarti stok kurang atau menumpuk, keduanya merugikan." },
    ],
  },
  {
    id: "sampel",
    pertanyaan: "Survei kepuasan hanya dibagikan ke pembeli yang datang ke toko hari Minggu, hasilnya 95% puas. Apa masalahnya?",
    opsi: [
      { id: "a", label: "Tidak ada, 95% sudah sangat tinggi", benar: false, penjelasan: "Angka tinggi belum tentu mewakili semua pelanggan." },
      { id: "b", label: "Jumlah pertanyaannya terlalu sedikit", benar: false, penjelasan: "Masalah utamanya bukan jumlah pertanyaan, tapi siapa yang ditanya." },
      { id: "c", label: "Sampel bias: pelanggan yang kecewa & pindah toko tidak ikut tersurvei", benar: true, penjelasan: "Tepat! Sampel harus mewakili seluruh pelanggan, bukan hanya yang masih setia datang." },
    ],
  },
  {
    id: "median",
    pertanyaan: "Rata-rata penjualan 8 toko 190 sak, padahal 7 toko di bawah 150 dan 1 toko 800 sak (proyek tol). Angka apa yang lebih mewakili toko biasa?",
    opsi: [
      { id: "a", label: "Median", benar: true, penjelasan: "Tepat! Median tidak terseret satu nilai ekstrem seperti rata-rata." },
      { id: "b", label: "Rata-rata, karena memakai semua data", benar: false, penjelasan: "Rata-rata terdongkrak toko 800 sak, jadi terlalu tinggi untuk toko biasa." },
      { id: "c", label: "Nilai tertinggi", benar: false, penjelasan: "Nilai tertinggi justru toko paling tidak biasa." },
    ],
  },
  {
    id: "data-pendek",
    pertanyaan: "Tim ingin memprediksi penjualan 12 bulan ke depan hanya dari data Mei & Juni. Saran terbaik?",
    opsi: [
      { id: "a", label: "Cukup, tarik garis lurus dari 2 titik itu", benar: false, penjelasan: "Dua titik tidak bisa menangkap pola musim hujan, libur, atau promo." },
      { id: "b", label: "Kumpulkan data minimal 1–2 tahun agar pola musiman terlihat", benar: true, penjelasan: "Tepat! Prediksi jangka panjang butuh riwayat yang mencakup satu siklus penuh." },
      { id: "c", label: "Prediksi saja sama dengan Juni untuk 12 bulan", benar: false, penjelasan: "Mengabaikan perubahan musim dan tren sepanjang tahun." },
    ],
  },
  {
    id: "ab-test",
    pertanyaan: "Setelah spanduk baru dipasang di Toko Makmur, penjualannya naik 10%. Direktur ingin memasang spanduk di semua pulau. Langkah analis?",
    opsi: [
      { id: "a", label: "Langsung pasang, buktinya sudah ada", benar: false, penjelasan: "Kenaikan bisa karena hal lain (cuaca, proyek). Satu toko belum cukup bukti." },
      { id: "b", label: "Tolak, spanduk tidak ada hubungannya dengan penjualan", benar: false, penjelasan: "Menolak tanpa data juga keliru, justru perlu diuji." },
      { id: "c", label: "Uji di beberapa toko & bandingkan dengan toko tanpa spanduk", benar: true, penjelasan: "Tepat! Kelompok pembanding (A/B test) memisahkan efek spanduk dari faktor lain." },
    ],
  },
  {
    id: "indikator",
    pertanyaan: "Data mana yang paling membantu memprediksi permintaan semen 2 bulan ke depan?",
    opsi: [
      { id: "a", label: "Jumlah izin mendirikan bangunan (PBG) yang baru terbit", benar: true, penjelasan: "Tepat! Izin bangunan adalah indikator awal (leading indicator): pembangunan dimulai beberapa minggu kemudian." },
      { id: "b", label: "Jumlah pengunjung toko kemarin", benar: false, penjelasan: "Itu menggambarkan kondisi hari ini, bukan 2 bulan lagi." },
      { id: "c", label: "Warna cat yang paling laku", benar: false, penjelasan: "Tidak ada hubungan kuat dengan kebutuhan semen." },
    ],
  },
  {
    id: "komunikasi",
    pertanyaan: "Direktur hanya punya 1 menit untuk mendengar hasil analisis armada. Cara menyampaikannya?",
    opsi: [
      { id: "a", label: "Tampilkan semua 15 tabel agar lengkap", benar: false, penjelasan: "Terlalu banyak detail membuat pesan utamanya hilang." },
      { id: "b", label: "Satu grafik kunci, rekomendasi tindakan, dan dampaknya dalam angka", benar: true, penjelasan: "Tepat! Insight yang baik singkat, visual, dan berujung pada keputusan." },
      { id: "c", label: "Cukup bilang \"datanya bagus, Pak\"", benar: false, penjelasan: "Tanpa bukti & rekomendasi, direktur tidak bisa mengambil keputusan." },
    ],
  },
];

export const SEA_QUIZ_COUNT = 3;

export function drawSeaQuiz(): SeaQuestion[] {
  return sample(SEA_QUIZ_BANK, SEA_QUIZ_COUNT).map((q) => ({ ...q, opsi: shuffled(q.opsi) }));
}

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
