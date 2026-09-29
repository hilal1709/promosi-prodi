import * as THREE from "three";
import type { ChartKind, ChartQuestion, GameQuality } from "@/lib/types";
import { CHART_QUESTIONS } from "@/lib/data/missions";
import { fbm, seeded } from "../erp/race-track";
import { pickOne, sample, shuffled } from "../quiz-bank";

/* ------------------------------------------------------------------ */
/* Sungai Visualisasi, tata letak deterministik Level 2 Data Science   */
/* Semua objek permainan memakai koordinat sungai: s (meter sepanjang   */
/* aliran) & lat (meter ke kanan dari garis tengah, menghadap hilir).  */
/* ------------------------------------------------------------------ */

const smooth = THREE.MathUtils.smoothstep;
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;

const CONTROL: [number, number][] = [
  [0, 70],
  [0, 0],
  [18, -70],
  [52, -140],
  [42, -215],
  [-4, -285],
  [-44, -360],
  [-40, -440],
  [-14, -520],
  [0, -600],
  [26, -680],
  [66, -750],
  [84, -830],
  [62, -910],
  [22, -980],
  [2, -1050],
  [-14, -1130],
  [-52, -1200],
  [-58, -1280],
  [-26, -1350],
  [18, -1412],
  [38, -1482],
  [36, -1560],
  [22, -1640],
  [12, -1705],
];

export const SAMPLES = 2400;

export const RIVER = (() => {
  const curve = new THREE.CatmullRomCurve3(
    CONTROL.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    false,
    "centripetal"
  );
  const pts = curve.getSpacedPoints(SAMPLES - 1);
  const length = curve.getLength();
  const px = new Float32Array(SAMPLES);
  const pz = new Float32Array(SAMPLES);
  const fx = new Float32Array(SAMPLES);
  const fz = new Float32Array(SAMPLES);
  pts.forEach((p, i) => {
    px[i] = p.x;
    pz[i] = p.z;
  });
  for (let i = 0; i < SAMPLES; i++) {
    const a = Math.max(0, i - 2);
    const b = Math.min(SAMPLES - 1, i + 2);
    const dx = px[b] - px[a];
    const dz = pz[b] - pz[a];
    const l = Math.hypot(dx, dz) || 1;
    fx[i] = dx / l;
    fz[i] = dz / l;
  }
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < SAMPLES; i++) {
    minX = Math.min(minX, px[i]);
    maxX = Math.max(maxX, px[i]);
    minZ = Math.min(minZ, pz[i]);
    maxZ = Math.max(maxZ, pz[i]);
  }
  return { length, px, pz, fx, fz, step: length / (SAMPLES - 1), bounds: { minX, maxX, minZ, maxZ } };
})();

export const L = RIVER.length;
/** Posisi relatif (0..1) → meter. */
export const at = (f: number) => f * L;

/* ------------------------------- zona ------------------------------ */

export type ZoneId = "bambu" | "pasar" | "sawah" | "ngarai" | "bakau";

export const ZONES: { id: ZoneId; nama: string; from: number; to: number; color: string }[] = [
  { id: "bambu", nama: "Hutan Bambu", from: 0, to: at(0.13), color: "#6fbf4a" },
  { id: "pasar", nama: "Pasar Toko Tepi Sungai", from: at(0.13), to: at(0.425), color: "#f4a261" },
  { id: "sawah", nama: "Sawah Terasering", from: at(0.425), to: at(0.685), color: "#c8d94a" },
  { id: "ngarai", nama: "Ngarai Batu Merah", from: at(0.685), to: at(0.8), color: "#d9674a" },
  { id: "bakau", nama: "Laguna Bakau", from: at(0.8), to: L + 1, color: "#3fa7a0" },
];

export function zoneAt(s: number) {
  return ZONES.find((zone) => s >= zone.from && s < zone.to) ?? ZONES[ZONES.length - 1];
}

/** Bobot tiap zona di posisi s (transisi halus ±35 m). */
export function zoneWeights(s: number): Record<ZoneId, number> {
  const out = { bambu: 0, pasar: 0, sawah: 0, ngarai: 0, bakau: 0 } as Record<ZoneId, number>;
  let total = 0;
  for (const zone of ZONES) {
    const enter = zone.from <= 0 ? 1 : smooth(s, zone.from - 35, zone.from + 35);
    const leave = zone.to > L ? 1 : 1 - smooth(s, zone.to - 35, zone.to + 35);
    out[zone.id] = enter * leave;
    total += out[zone.id];
  }
  for (const zone of ZONES) out[zone.id] /= total || 1;
  return out;
}

/* ---------------------------- percabangan --------------------------- */

export const FORK_LEN = 112;
export const FORK_WIDTH = 44;

export interface Fork {
  id: number;
  s: number;
  /** Soal diundi ulang tiap main (lihat `rerollRiver`). */
  question: ChartQuestion;
  /** Jenis grafik tiap kanal: kiri, tengah, kanan. */
  channels: ChartKind[];
  correct: number;
}

/** Bank studi kasus "grafik apa yang tepat?" untuk percabangan sungai. */
const FORK_BANK: ChartQuestion[] = [
  { id: "f-toko", pertanyaan: "Toko mana yang penjualannya paling tinggi dan paling rendah bulan lalu?", jawaban: "bar", penjelasan: "Membandingkan nilai antar kategori (toko) paling mudah dengan grafik batang.", data: [] },
  { id: "f-retur", pertanyaan: "Tim gudang ingin tahu cabang mana yang paling banyak mengembalikan sak rusak.", jawaban: "bar", penjelasan: "Tiap cabang adalah kategori terpisah; batang memudahkan melihat siapa tertinggi.", data: [] },
  { id: "f-truk", pertanyaan: "Bandingkan jumlah pengiriman 5 sopir truk minggu ini.", jawaban: "bar", penjelasan: "Perbandingan antar orang/kategori → grafik batang.", data: [] },
  { id: "f-produk9", pertanyaan: "Ada 9 jenis produk dengan porsi mirip-mirip. Mana yang terjual paling banyak?", jawaban: "bar", penjelasan: "Pie dengan 9 irisan mirip sulit dibaca. Batang lebih jelas untuk mengurutkan.", data: [] },
  { id: "f-tren", pertanyaan: "Bagaimana naik-turun total penjualan dari Januari sampai Juni?", jawaban: "line", penjelasan: "Perubahan dari waktu ke waktu paling jelas dengan grafik garis.", data: [] },
  { id: "f-iklan", pertanyaan: "Apakah penjualan Toko Jaya naik setelah iklan radio dimulai bulan April?", jawaban: "line", penjelasan: "Melihat efek sebelum-sesudah dalam urutan waktu → grafik garis.", data: [] },
  { id: "f-harga", pertanyaan: "Bagaimana harga batu bara (bahan bakar pabrik) bergerak tiap minggu tahun ini?", jawaban: "line", penjelasan: "Data mingguan berurutan waktu → garis menunjukkan polanya.", data: [] },
  { id: "f-puncak", pertanyaan: "Di bulan apa biasanya pesanan semen mencapai puncak dalam setahun?", jawaban: "line", penjelasan: "Pola musiman sepanjang tahun terlihat jelas pada grafik garis.", data: [] },
  { id: "f-produk", pertanyaan: "Berapa porsi tiap jenis produk (PCC, OPC, Mortar) dari total penjualan?", jawaban: "pie", penjelasan: "Bagian dari keseluruhan (komposisi) cocok dengan grafik lingkaran.", data: [] },
  { id: "f-bayar", pertanyaan: "Berapa persen pelanggan membayar tunai, transfer, atau kredit?", jawaban: "pie", penjelasan: "Tiga bagian yang totalnya 100% → grafik lingkaran.", data: [] },
  { id: "f-pelanggan", pertanyaan: "Seberapa besar porsi kontraktor, toko bangunan, dan perorangan dalam pembeli kita?", jawaban: "pie", penjelasan: "Komposisi pembeli dari keseluruhan → grafik lingkaran.", data: [] },
  { id: "f-biaya", pertanyaan: "Direksi ingin melihat pembagian biaya produksi: bahan baku, energi, dan tenaga kerja.", jawaban: "pie", penjelasan: "Pembagian satu total ke beberapa bagian → grafik lingkaran.", data: [] },
];

const FORK_CHANNELS: ChartKind[][] = [
  ["line", "bar", "pie"],
  ["line", "pie", "bar"],
  ["bar", "line", "pie"],
];

export const FORKS: Fork[] = [at(0.35), at(0.61), at(0.878)].map((s, id) => ({ id, s, question: FORK_BANK[0], channels: FORK_CHANNELS[id], correct: -1 }));

/** Jarak tengah kanal dari garis tengah sungai. */
export const CHANNEL_LAT = 14.2;
export const channelLat = (k: number) => (k - 1) * CHANNEL_LAT;
/** Setengah lebar pulau pemisah kanal di titik u (0..1) sepanjang cabang. */
export function islandHalf(u: number) {
  if (u <= 0 || u >= 1) return 0;
  return 2.9 * Math.pow(Math.sin(Math.PI * u), 0.45);
}
export const ISLAND_LAT = CHANNEL_LAT / 2;

export function forkAt(s: number) {
  return FORKS.find((fork) => s >= fork.s && s <= fork.s + FORK_LEN) ?? null;
}

/* --------------------------- lebar & air --------------------------- */

const LAGOON_START = at(0.955);

export function widthAt(s: number) {
  const z = zoneWeights(s);
  let w = z.bambu * 17 + z.pasar * 22 + z.sawah * 20 + z.ngarai * 14 + z.bakau * 25;
  // Menyempit di dekat air terjun ngarai.
  w -= 3 * (1 - smooth(Math.abs(s - WATERFALLS[1].s), 10, 60));
  for (const fork of FORKS) {
    const k = smooth(s, fork.s - 40, fork.s + 4) * (1 - smooth(s, fork.s + FORK_LEN - 4, fork.s + FORK_LEN + 40));
    w = lerp(w, FORK_WIDTH, k);
  }
  w = lerp(w, 118, smooth(s, LAGOON_START - 30, L - 10));
  // Sedikit berdenyut agar tepi tidak kaku.
  return w + (fbm(s * 0.02, 3.3, 2) - 0.5) * 3;
}

export const WATERFALLS = [
  { s: at(0.428), drop: 2.6 },
  { s: at(0.748), drop: 6.5 },
];
const FALL_LEN = 3.2;

export function waterY(s: number) {
  let y = 0;
  for (const fall of WATERFALLS) y -= fall.drop * smooth(s, fall.s, fall.s + FALL_LEN);
  return y;
}

/** Arus dasar (m/s), deras di ngarai, tenang di laguna. */
export function currentAt(s: number) {
  const z = zoneWeights(s);
  let c = z.bambu * 5.2 + z.pasar * 5.4 + z.sawah * 5.8 + z.ngarai * 7.6 + z.bakau * 5.4;
  for (const fall of WATERFALLS) c += 3 * (1 - smooth(Math.abs(s - fall.s), 4, 40));
  c = lerp(c, 2.4, smooth(s, LAGOON_START, L - 20));
  return c;
}

/* --------------------------- sampel & rangka ------------------------ */

export function indexOf(s: number) {
  return clamp(Math.round(s / RIVER.step), 0, SAMPLES - 1);
}

/** Posisi dunia dari koordinat sungai (interpolasi linear antar sampel). */
export function toWorld(s: number, lat: number, out = new THREE.Vector3()) {
  const f = clamp(s / RIVER.step, 0, SAMPLES - 1.001);
  const i = Math.floor(f);
  const t = f - i;
  const x = lerp(RIVER.px[i], RIVER.px[i + 1], t);
  const z = lerp(RIVER.pz[i], RIVER.pz[i + 1], t);
  const fx = lerp(RIVER.fx[i], RIVER.fx[i + 1], t);
  const fz = lerp(RIVER.fz[i], RIVER.fz[i + 1], t);
  const l = Math.hypot(fx, fz) || 1;
  return out.set(x + (-fz / l) * lat, 0, z + (fx / l) * lat);
}

/** Arah hilir (radian, untuk rotation.y objek yang menghadap +Z). */
export function headingAt(s: number) {
  const i = indexOf(s);
  return Math.atan2(RIVER.fx[i], RIVER.fz[i]);
}

const COARSE = 12;

/** Titik sampel terdekat + lateral bertanda dari posisi dunia. */
export function frameAt(x: number, z: number) {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < SAMPLES; i += COARSE) {
    const dx = x - RIVER.px[i];
    const dz = z - RIVER.pz[i];
    const d = dx * dx + dz * dz;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  const lo = Math.max(0, best - COARSE);
  const hi = Math.min(SAMPLES - 1, best + COARSE);
  for (let i = lo; i <= hi; i++) {
    const dx = x - RIVER.px[i];
    const dz = z - RIVER.pz[i];
    const d = dx * dx + dz * dz;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  const dx = x - RIVER.px[best];
  const dz = z - RIVER.pz[best];
  const along = dx * RIVER.fx[best] + dz * RIVER.fz[best];
  const lat = dx * -RIVER.fz[best] + dz * RIVER.fx[best];
  const s = clamp(best * RIVER.step + along, 0, L);
  return { i: best, s, lat, along, dist: Math.sqrt(bestD) };
}

/* ------------------------------ tanah ------------------------------ */

/** Ketinggian tanah dari rangka sungai. Diekspos terpisah agar pemanggil bisa memakai ulang `frameAt`. */
export function heightFromFrame(x: number, z: number, f: ReturnType<typeof frameAt>) {
  const s = f.s;
  const endOut = f.i === SAMPLES - 1 ? Math.max(0, f.along) : f.i === 0 ? Math.max(0, -f.along) : 0;
  const d = Math.hypot(f.lat, endOut);
  const w = widthAt(s) / 2;
  const wy = waterY(s);
  const zw = zoneWeights(s);
  const t = d - w;
  const n = fbm(x * 0.02 + 5, z * 0.02 - 2, 3);

  // Bukit & pegunungan jauh (sama untuk semua zona), menutup cakrawala.
  const far = smooth(t, 60, 260) * (24 + fbm(x * 0.006 + 11, z * 0.006 - 7, 4) * 70) + smooth(t, 220, 620) * (70 + fbm(x * 0.004 - 3, z * 0.004 + 5, 4) * 190);

  const bank = wy + 0.5 + smooth(t, 0, 7) * 1.4;
  const bambu = bank + smooth(t, 10, 80) * (5 + n * 14);
  const pasar = wy + 0.9 + smooth(t, 0, 3) * 0.4 + smooth(t, 34, 90) * (4 + n * 10);
  const stepH = 1.7;
  const terr = Math.min(9, Math.floor(Math.max(0, t - 3) / 8.5));
  const sawah = wy + 0.7 + terr * stepH + smooth(t, 3, 3.6) * 0.4 + smooth(t, 80, 140) * (6 + n * 10);
  const strata = (h: number) => Math.floor(h / 2.6) * 2.6 + (h % 2.6) * 0.25;
  const cliff = smooth(t, 0.2, 6) * (24 + fbm(x * 0.03, z * 0.03, 3) * 26) + smooth(t, 30, 100) * 18;
  const ngarai = wy + 0.4 + strata(cliff);
  const bakau = wy + 0.15 + (n - 0.45) * 1.4 + smooth(t, 20, 60) * (1.5 + n * 5) + smooth(t, 60, 140) * 6;

  let h = zw.bambu * bambu + zw.pasar * pasar + zw.sawah * sawah + zw.ngarai * ngarai + zw.bakau * bakau;
  h += far * (1 - zw.ngarai * 0.35);

  // Dasar sungai: selalu di bawah permukaan air.
  if (t < 1.5) {
    const bed = wy - 0.8 - 1.6 * (1 - clamp(d / w, 0, 1) ** 2);
    h = lerp(bed, h, smooth(t, -1.5, 1.5));
  }

  // Pulau pemisah kanal di percabangan.
  const fork = forkAt(s);
  if (fork) {
    const u = (s - fork.s) / FORK_LEN;
    const half = islandHalf(u);
    for (const side of [-1, 1]) {
      const di = Math.abs(f.lat - side * ISLAND_LAT);
      if (di < half + 1.8) {
        const top = wy + 0.9 + Math.sin(Math.PI * u) * 1.6 + (n - 0.5) * 0.8;
        h = Math.max(h, lerp(top, wy - 0.6, smooth(di, half - 0.8, half + 1.8)));
      }
    }
  }
  return h;
}

export function terrainHeight(x: number, z: number) {
  return heightFromFrame(x, z, frameAt(x, z));
}

/* ------------------------------------------------------------------ */
/* Isi permainan                                                        */
/* ------------------------------------------------------------------ */

export const RAFT_START = at(0.035);
export const PAR_TIME = 270;

export const CHECKPOINTS = [RAFT_START, at(0.13), at(0.435), at(0.69), at(0.8)];

/** Babak 1, grafik batang: 7 toko di tepi sungai. */
export interface ShopStop {
  index: number;
  s: number;
  side: 1 | -1;
  label: string;
  nilai: number;
  dirtyText: string;
  dirtyValue: number;
  alasan: string;
  okTeks?: string;
  cleanLeft: boolean;
}

type Dirty = { text: string; value: number; alasan: string; okTeks?: string };

/** Bank data kotor per toko (urutan = CHART_QUESTIONS[0].data), diundi tiap main. */
const DIRTY_BANK: Dirty[][] = [
  [
    { text: "1200", value: 240, alasan: "Salah ketik: satu nol berlebih membuat penjualan tampak 10× lipat." },
    { text: "12", value: 12, alasan: "Satu digit hilang saat input, penjualannya 120, bukan 12." },
  ],
  [
    { text: "95 + 95", value: 190, alasan: "Baris ganda (duplikat) membuat penjualan terhitung dua kali." },
    { text: "59", value: 59, alasan: "Digit tertukar saat mengetik: yang benar 95." },
  ],
  [
    { text: "−5", value: -5, alasan: "Penjualan tidak mungkin negatif, setelah dibersihkan nilainya 0.", okTeks: "Tepat! Penjualan negatif (−5) sudah dibersihkan menjadi 0." },
    { text: "125", value: 125, alasan: "Itu angka bulan lalu yang tersalin. Bulan ini Barokah memang 0 karena stoknya kosong.", okTeks: "Tepat! Nol di sini data asli: stok Barokah kosong, bukan salah input." },
  ],
  [
    { text: "(kosong)", value: 0, alasan: "Sel kosong tidak bisa digambar. Pakai nilai yang sudah dilengkapi: 210." },
    { text: "2,1 rb", value: 2, alasan: "Ditulis dengan singkatan ribuan & koma yang salah. Penjualan Jaya 210 sak." },
  ],
  [
    { text: "150 sak", value: 150, alasan: "Angka bercampur teks tidak bisa dihitung grafik. Simpan sebagai angka murni." },
    { text: "7,5 ton", value: 8, alasan: "Tercatat dalam ton. 7,5 ton = 150 sak (1 sak = 50 kg), satuannya harus seragam." },
  ],
  [
    { text: "8,8", value: 9, alasan: "Format desimal salah: tertulis 8,8 padahal penjualannya 88 unit." },
    { text: "880", value: 880, alasan: "Kelebihan satu nol, 10× dari penjualan Sentosa biasanya." },
  ],
  [
    { text: "999", value: 240, alasan: "999 adalah nilai 'placeholder', bukan penjualan nyata." },
    { text: "132 (2×)", value: 264, alasan: "Nota yang sama terinput dua kali, jadi terhitung ganda." },
  ],
];

export const SHOPS: ShopStop[] = (() => {
  const rand = seeded(31);
  return CHART_QUESTIONS[0].data.map((item, index) => ({
    index,
    s: at(0.158 + index * 0.0265),
    side: (index % 2 === 0 ? -1 : 1) as 1 | -1,
    label: item.label,
    nilai: item.nilai,
    dirtyText: DIRTY_BANK[index][0].text,
    dirtyValue: DIRTY_BANK[index][0].value,
    alasan: DIRTY_BANK[index][0].alasan,
    okTeks: DIRTY_BANK[index][0].okTeks,
    cleanLeft: rand() > 0.5,
  }));
})();

/** Babak 2, grafik garis: gerbang bulan dengan 3 celah. */
export interface MonthGate {
  index: number;
  s: number;
  label: string;
  nilai: number;
  options: number[];
  correct: number;
}

/** Pengecoh titik bulan: berbagai jenis salah catat, diundi tiap main. */
function monthDecoys(k: number, values: number[], rand: () => number) {
  const v = values[k];
  const digits = String(v).split("");
  const swapped = Number([digits[1], digits[0], ...digits.slice(2)].join(""));
  const candidates = [
    v * 10, // kelebihan nol
    Math.round(v / 10), // kurang satu digit
    swapped, // digit tertukar
    values[k - 1] ?? values[k + 1], // tersalin dari bulan sebelah
    values[k + 1] ?? values[k - 1],
    v + (rand() > 0.5 ? 100 : -100), // salah ketik digit ratusan
    Math.round(v * 0.5), // hanya separuh bulan tercatat
  ].filter((n, i, list) => n > 0 && n !== v && list.indexOf(n) === i);
  return sample(candidates, 2, rand);
}

export const MONTH_GATES: MonthGate[] = (() => {
  const rand = seeded(57);
  return CHART_QUESTIONS[1].data.map((item, index) => {
    const correct = Math.floor(rand() * 3);
    const decoys = monthDecoys(index, CHART_QUESTIONS[1].data.map((d) => d.nilai), rand);
    const options = [0, 1, 2].map((k) => (k === correct ? item.nilai : decoys.shift()!));
    return { index, s: at(0.458 + index * 0.0245), label: item.label, nilai: item.nilai, options, correct };
  });
})();
export const GATE_LAT = 6.4;

/** Babak 3, grafik lingkaran: pasangan pelampung porsi produk. */
export interface SliceStop {
  index: number;
  s: number;
  label: string;
  nilai: number;
  dirtyValue: number;
  cleanLeft: boolean;
}

/** Porsi keliru per irisan (urutan = CHART_QUESTIONS[2].data), diundi tiap main. */
const SLICE_DIRTY_BANK = [
  [75, 45, 65],
  [3, 10, 50],
  [40, 25, 5],
];

export const SLICES: SliceStop[] = (() => {
  const rand = seeded(91);
  return CHART_QUESTIONS[2].data.map((item, index) => ({
    index,
    s: at(0.818 + index * 0.02),
    label: item.label,
    nilai: item.nilai,
    dirtyValue: SLICE_DIRTY_BANK[index][0],
    cleanLeft: rand() > 0.5,
  }));
})();

export const PAIR_LAT = 4.6;

/**
 * Undi ulang studi kasus sungai: soal percabangan, data kotor, pengecoh bulan,
 * dan sisi pelampung. Objek diubah di tempat karena model 3D membacanya langsung;
 * dipanggil sekali setiap level dimulai (sebelum model pertama kali dirender).
 */
export function rerollRiver() {
  const rand = Math.random;
  SHOPS.forEach((shop) => {
    const dirty = pickOne(DIRTY_BANK[shop.index], rand);
    Object.assign(shop, { dirtyText: dirty.text, dirtyValue: dirty.value, alasan: dirty.alasan, okTeks: dirty.okTeks, cleanLeft: rand() > 0.5 });
  });
  const values = CHART_QUESTIONS[1].data.map((d) => d.nilai);
  MONTH_GATES.forEach((gate) => {
    const correct = Math.floor(rand() * 3);
    const decoys = monthDecoys(gate.index, values, rand);
    gate.options = [0, 1, 2].map((k) => (k === correct ? gate.nilai : decoys.shift()!));
    gate.correct = correct;
  });
  SLICES.forEach((slice) => {
    slice.dirtyValue = pickOne(SLICE_DIRTY_BANK[slice.index], rand);
    slice.cleanLeft = rand() > 0.5;
  });
  const questions = sample(FORK_BANK, FORKS.length, rand);
  FORKS.forEach((fork, k) => {
    fork.question = questions[k];
    fork.channels = shuffled(FORK_CHANNELS[k], rand);
    fork.correct = fork.channels.indexOf(fork.question.jawaban);
  });
}
rerollRiver();

/* ---------------------------- rintangan ---------------------------- */

export type HazardKind = "batu" | "kayu" | "pusaran" | "arus";

export interface Hazard {
  id: number;
  kind: HazardKind;
  s: number;
  lat: number;
  /** Batu/pusaran: jari-jari. Kayu: setengah panjang. Arus: setengah lebar. */
  r: number;
}

/** Rentang s yang harus bebas rintangan (pelampung, gerbang, awal & akhir). */
const CLEAR: [number, number][] = [
  [0, RAFT_START + 50],
  ...SHOPS.map((shop) => [shop.s - 16, shop.s + 10] as [number, number]),
  ...MONTH_GATES.map((gate) => [gate.s - 16, gate.s + 10] as [number, number]),
  ...SLICES.map((slice) => [slice.s - 16, slice.s + 10] as [number, number]),
  ...FORKS.map((fork) => [fork.s - 30, fork.s + FORK_LEN + 20] as [number, number]),
  ...WATERFALLS.map((fall) => [fall.s - 22, fall.s + 18] as [number, number]),
  [LAGOON_START - 20, L + 10],
];

const isClear = (s: number) => !CLEAR.some(([a, b]) => s > a && s < b);

export const HAZARDS: Hazard[] = (() => {
  const rand = seeded(404);
  const out: Hazard[] = [];
  let id = 0;
  const push = (kind: HazardKind, s: number, lat: number, r: number) => out.push({ id: id++, kind, s, lat, r });
  for (let s = RAFT_START + 60; s < LAGOON_START - 20; s += 9 + rand() * 12) {
    if (!isClear(s)) continue;
    const zone = zoneAt(s).id;
    const half = widthAt(s) / 2;
    const roll = rand();
    const lat = (rand() * 2 - 1) * (half - 3);
    if (zone === "ngarai") {
      if (roll < 0.55) push("batu", s, lat, 1 + rand() * 0.9);
      else if (roll < 0.72) push("arus", s, (rand() * 2 - 1) * (half - 4), 2.2);
      else if (roll < 0.84) push("kayu", s, (rand() * 2 - 1) * 2, half * 0.55);
      else if (roll < 0.9) push("pusaran", s, lat * 0.6, 3.6);
    } else {
      if (roll < 0.26) push("batu", s, lat, 0.9 + rand() * 0.7);
      else if (roll < 0.36) push("arus", s, (rand() * 2 - 1) * (half - 4), 2.2);
      else if (roll < 0.44 && zone !== "pasar") push("kayu", s, (rand() * 2 - 1) * 2.5, half * 0.45);
      else if (roll < 0.49 && zone !== "pasar") push("pusaran", s, lat * 0.6, 3.4);
    }
  }
  // Tiap kanal di percabangan mendapat rintangan setara, jadi jawaban tidak terbaca dari medannya.
  for (const fork of FORKS) {
    fork.channels.forEach((_, k) => {
      const c = channelLat(k);
      push("arus", fork.s + 34, c, 2.4);
      for (let j = 0; j < 2; j++) push("batu", fork.s + 48 + j * 22 + rand() * 6, c + (rand() > 0.5 ? 2.6 : -2.6), 0.9 + rand() * 0.5);
    });
  }
  return out;
})();

/** Tetes data (orb combo), barisan berkelok di celah antar rintangan. */
export const ORBS: { id: number; s: number; lat: number }[] = (() => {
  const rand = seeded(606);
  const out: { id: number; s: number; lat: number }[] = [];
  let id = 0;
  for (let s = RAFT_START + 40; s < LAGOON_START; s += 60 + rand() * 50) {
    if (!isClear(s) || !isClear(s + 24)) continue;
    const half = widthAt(s) / 2 - 3;
    const base = (rand() * 2 - 1) * half * 0.7;
    for (let k = 0; k < 5; k++) {
      const ss = s + k * 5;
      const lat = clamp(base + Math.sin(k * 0.9) * 2.4, -half, half);
      if (HAZARDS.some((hz) => Math.abs(hz.s - ss) < 4 && Math.abs(hz.lat - lat) < 3)) continue;
      out.push({ id: id++, s: ss, lat });
    }
  }
  for (const fork of FORKS) {
    for (let c = 0; c < 3; c++) for (let k = 0; k < 2; k++) out.push({ id: id++, s: fork.s + 24 + k * 30, lat: channelLat(c) + Math.sin(k + c) * 1.5 });
  }
  return out;
})();

/* --------------------------- dunia & hiasan ------------------------ */

export const BRIDGES = [at(0.085), at(0.255), at(0.535), at(0.705)];
export const WHEELS = [
  { s: at(0.47), side: 1 as const },
  { s: at(0.545), side: -1 as const },
  { s: at(0.6), side: 1 as const },
];
export const SIDE_FALLS = [
  { s: at(0.705), side: -1 as const, h: 22 },
  { s: at(0.728), side: 1 as const, h: 26 },
  { s: at(0.772), side: -1 as const, h: 19 },
  { s: at(0.79), side: 1 as const, h: 16 },
];
export const ARCH_S = at(0.72);
export const SAMPANS = [
  { s0: at(0.16), s1: at(0.33), lat: 0.62, speed: 1.1, color: "#b5651d" },
  { s0: at(0.2), s1: at(0.32), lat: -0.64, speed: 0.8, color: "#2a9d8f" },
  { s0: at(0.055), s1: at(0.12), lat: 0.55, speed: 0.9, color: "#e9c46a" },
  { s0: at(0.805), s1: at(0.866), lat: -0.6, speed: 1, color: "#e76f51" },
  { s0: at(0.81), s1: at(0.868), lat: 0.62, speed: 0.7, color: "#264653" },
];

export interface Placed {
  x: number;
  z: number;
  y: number;
  rot: number;
  s: number;
}

/** Posisi sampan NPC pada waktu tertentu (bolak-balik antara s0 dan s1). */
export function sampanAt(k: number, time: number) {
  const b = SAMPANS[k];
  const span = b.s1 - b.s0;
  const u = (time * b.speed / span + k * 0.37) % 2;
  const forward = u < 1;
  const s = b.s0 + span * (forward ? u : 2 - u);
  return { s, lat: b.lat * (widthAt(s) / 2), dir: forward ? 1 : -1 };
}

export function bankPoint(s: number, side: number, off: number): Placed {
  const lat = side * (widthAt(s) / 2 + off);
  const p = toWorld(s, lat);
  const f = frameAt(p.x, p.z);
  const y = heightFromFrame(p.x, p.z, f);
  return { x: p.x, z: p.z, y, rot: headingAt(s) + (side > 0 ? Math.PI / 2 : -Math.PI / 2), s };
}

/** Rumah panggung toko (menghadap sungai). */
export const SHOP_HOUSES = SHOPS.map((shop) => ({ ...bankPoint(shop.s, shop.side, 6.5), shop }));

/** Rumah warga lain di pasar & gubuk di sawah. */
export const HOUSES: (Placed & { color: string; roof: string; scale: number })[] = (() => {
  const rand = seeded(212);
  const out: (Placed & { color: string; roof: string; scale: number })[] = [];
  const walls = ["#e9d8a6", "#f1e3c6", "#d4a373", "#e6ccb2", "#cfe1b9"];
  const roofs = ["#9c3d2e", "#7f4f24", "#bc4b36", "#6b705c", "#a44a3f"];
  for (let k = 0; k < 16; k++) {
    const s = at(0.14) + rand() * (at(0.41) - at(0.14));
    if (SHOPS.some((shop) => Math.abs(shop.s - s) < 14)) continue;
    const side = rand() > 0.5 ? 1 : -1;
    const p = bankPoint(s, side, 9 + rand() * 18);
    out.push({ ...p, rot: p.rot + (rand() - 0.5) * 0.5, color: walls[k % walls.length], roof: roofs[(k * 3) % roofs.length], scale: 0.8 + rand() * 0.35 });
  }
  for (let k = 0; k < 6; k++) {
    const s = at(0.44) + rand() * (at(0.66) - at(0.44));
    const side = rand() > 0.5 ? 1 : -1;
    const p = bankPoint(s, side, 20 + rand() * 30);
    out.push({ ...p, color: "#d9c7a0", roof: "#8a6a3d", scale: 0.65 });
  }
  return out;
})();

export const DOCK_START = bankPoint(RAFT_START - 4, -1, -1.5);

/* ----------------------------- vegetasi ---------------------------- */

export type Inst = { p: [number, number, number]; r?: [number, number, number]; s?: number | [number, number, number]; c?: string };

export const CHUNKS = 14;
export type FloraKind =
  | "bamboo"
  | "banana"
  | "palm"
  | "jungle"
  | "fern"
  | "mangrove"
  | "rice"
  | "reed"
  | "flower"
  | "grass"
  | "rock"
  | "redRock"
  | "shrub"
  | "farTree"
  | "lily";

export type Flora = Record<FloraKind, Inst[][]>;

const FLOWERS = ["#ffd166", "#ef476f", "#f8f9fa", "#c77dff", "#ff9f1c"];
const LEAF = ["#4f8f3a", "#5f9e45", "#6aa84f", "#3f7f35", "#2f7a3a"];
const pick = <T,>(list: T[], r: number) => list[Math.floor(r * list.length) % list.length];

export function scatterFlora(quality: GameQuality): Flora {
  const scale = quality === "hemat" ? 0.45 : quality === "tinggi" ? 1.2 : 0.8;
  const rand = seeded(2025);
  const kinds: FloraKind[] = ["bamboo", "banana", "palm", "jungle", "fern", "mangrove", "rice", "reed", "flower", "grass", "rock", "redRock", "shrub", "farTree", "lily"];
  const flora = Object.fromEntries(kinds.map((k) => [k, Array.from({ length: CHUNKS }, () => [] as Inst[])])) as Flora;
  const add = (kind: FloraKind, s: number, inst: Inst) => flora[kind][Math.min(CHUNKS - 1, Math.floor((s / L) * CHUNKS))].push(inst);
  const houseNear = (x: number, z: number, r: number) =>
    SHOP_HOUSES.some((h) => Math.hypot(h.x - x, h.z - z) < r + 6) || HOUSES.some((h) => Math.hypot(h.x - x, h.z - z) < r + 5);

  // Tepi sungai (0–70 m dari tepi air).
  const tries = Math.round(9000 * scale);
  for (let i = 0; i < tries; i++) {
    const s = rand() * L;
    const side = rand() > 0.5 ? 1 : -1;
    const off = Math.pow(rand(), 1.6) * 75 + 0.8;
    const lat = side * (widthAt(s) / 2 + off);
    const p = toWorld(s, lat);
    const f = frameAt(p.x, p.z);
    if (Math.abs(f.s - s) > 8) continue;
    const h = heightFromFrame(p.x, p.z, f);
    const wy = waterY(f.s);
    if (h < wy + 0.15) continue;
    if (houseNear(p.x, p.z, 2)) continue;
    const zw = zoneWeights(s);
    const r = rand();
    const rot: [number, number, number] = [0, rand() * Math.PI * 2, 0];
    const pos: [number, number, number] = [p.x, h - 0.1, p.z];
    const zone = zw.bambu > 0.5 ? "bambu" : zw.pasar > 0.5 ? "pasar" : zw.sawah > 0.5 ? "sawah" : zw.ngarai > 0.5 ? "ngarai" : "bakau";
    if (zone === "bambu") {
      if (r < 0.3) add("bamboo", s, { p: pos, r: rot, s: 0.8 + rand() * 0.6 });
      else if (r < 0.42) add("banana", s, { p: pos, r: rot, s: 0.8 + rand() * 0.5 });
      else if (r < 0.52) add("jungle", s, { p: pos, r: rot, s: 0.9 + rand() * 0.8, c: pick(LEAF, rand()) });
      else if (r < 0.75) add("fern", s, { p: pos, r: rot, s: 0.7 + rand() * 0.7 });
      else if (r < 0.85) add("flower", s, { p: pos, r: rot, s: 0.7 + rand() * 0.5, c: pick(FLOWERS, rand()) });
      else add("rock", s, { p: pos, r: [rand(), rand() * 6, rand()], s: 0.4 + rand() * 0.7, c: "#8f8f82" });
    } else if (zone === "pasar") {
      if (off < 4) {
        if (r < 0.5) add("reed", s, { p: pos, r: rot, s: 0.7 + rand() * 0.5 });
        continue;
      }
      if (r < 0.2) add("palm", s, { p: pos, r: rot, s: 0.9 + rand() * 0.5 });
      else if (r < 0.32) add("banana", s, { p: pos, r: rot, s: 0.8 + rand() * 0.4 });
      else if (r < 0.4) add("jungle", s, { p: pos, r: rot, s: 0.8 + rand() * 0.6, c: pick(LEAF, rand()) });
      else if (r < 0.62) add("flower", s, { p: pos, r: rot, s: 0.7 + rand() * 0.5, c: pick(FLOWERS, rand()) });
      else add("grass", s, { p: pos, r: rot, s: 0.7 + rand() * 0.6, c: pick(["#6fae4a", "#7fbf55", "#8fb84a"], rand()) });
    } else if (zone === "sawah") {
      const stepOff = off - 3;
      const onFlat = stepOff > 0 && stepOff % 8.5 > 0.9 && stepOff % 8.5 < 7.8 && stepOff < 80;
      if (onFlat && r < 0.85) add("rice", s, { p: [p.x, h, p.z], r: rot, s: 0.7 + rand() * 0.5, c: pick(["#a7c957", "#b5d35a", "#90be4c", "#c9d66b"], rand()) });
      else if (r < 0.9 && off > 80) add("jungle", s, { p: pos, r: rot, s: 0.9 + rand() * 0.8, c: pick(LEAF, rand()) });
      else if (r < 0.95) add("palm", s, { p: pos, r: rot, s: 0.8 + rand() * 0.4 });
      else add("flower", s, { p: pos, r: rot, s: 0.7, c: pick(FLOWERS, rand()) });
    } else if (zone === "ngarai") {
      if (r < 0.25) add("redRock", s, { p: [p.x, h - 0.3, p.z], r: [rand(), rand() * 6, rand()], s: 0.8 + rand() * 1.8, c: pick(["#b5543c", "#c96a4a", "#9e4a35", "#d98b62"], rand()) });
      else if (r < 0.55) add("shrub", s, { p: pos, r: rot, s: 0.6 + rand() * 0.7, c: pick(["#6b8f3a", "#7a9a45", "#5c7f36"], rand()) });
      else if (r < 0.62) add("jungle", s, { p: pos, r: rot, s: 0.7 + rand() * 0.6, c: pick(LEAF, rand()) });
      else if (r < 0.7) add("fern", s, { p: pos, r: rot, s: 0.6 + rand() * 0.5 });
    } else {
      if (off < 9 && r < 0.45) add("mangrove", s, { p: [p.x, Math.max(h, wy) - 0.3, p.z], r: rot, s: 0.8 + rand() * 0.6 });
      else if (r < 0.55) add("palm", s, { p: pos, r: rot, s: 0.8 + rand() * 0.5 });
      else if (r < 0.7) add("reed", s, { p: pos, r: rot, s: 0.8 + rand() * 0.5 });
      else if (r < 0.8) add("jungle", s, { p: pos, r: rot, s: 0.8 + rand() * 0.6, c: pick(LEAF, rand()) });
      else add("grass", s, { p: pos, r: rot, s: 0.8, c: "#6a9f45" });
    }
  }

  // Bakau & teratai di air dangkal.
  const water = Math.round(900 * scale);
  for (let i = 0; i < water; i++) {
    const s = rand() * L;
    const zw = zoneWeights(s);
    const half = widthAt(s) / 2;
    const side = rand() > 0.5 ? 1 : -1;
    const lat = side * (half - 0.8 - rand() * 2.2);
    const p = toWorld(s, lat);
    const wy = waterY(s);
    if (forkAt(s)) continue;
    if (zw.bakau > 0.5 && rand() < 0.5 && s < L - 90) add("mangrove", s, { p: [p.x, wy - 0.4, p.z], r: [0, rand() * 6, 0], s: 0.7 + rand() * 0.5 });
    else if ((zw.sawah > 0.4 || zw.bakau > 0.4 || zw.pasar > 0.4) && rand() < 0.6) add("lily", s, { p: [p.x, wy + 0.03, p.z], r: [0, rand() * 6, 0], s: 0.6 + rand() * 0.7, c: rand() > 0.8 ? "#f4acb7" : "#4f9a45" });
  }

  // Pulau cabang: pohon & batu.
  for (const fork of FORKS) {
    for (const side of [-1, 1]) {
      for (let k = 0; k < 10 * scale + 3; k++) {
        const u = 0.12 + rand() * 0.76;
        const s = fork.s + u * FORK_LEN;
        const half = islandHalf(u);
        const lat = side * ISLAND_LAT + (rand() * 2 - 1) * half * 0.6;
        const p = toWorld(s, lat);
        const h = terrainHeight(p.x, p.z);
        if (h < waterY(s) + 0.3) continue;
        const r = rand();
        if (r < 0.5) add(zoneAt(s).id === "bakau" ? "mangrove" : "palm", s, { p: [p.x, h - 0.1, p.z], r: [0, rand() * 6, 0], s: 0.8 + rand() * 0.4 });
        else if (r < 0.8) add("fern", s, { p: [p.x, h, p.z], r: [0, rand() * 6, 0], s: 0.8 });
        else add("rock", s, { p: [p.x, h, p.z], r: [rand(), rand() * 6, rand()], s: 0.6 + rand() * 0.6, c: "#8a877a" });
      }
    }
  }

  // Hutan jauh di lereng bukit, latar yang menutup cakrawala.
  const farTries = Math.round(4200 * scale);
  for (let i = 0; i < farTries; i++) {
    const s = rand() * L;
    const side = rand() > 0.5 ? 1 : -1;
    const off = 70 + rand() * 360;
    const p = toWorld(s, side * (widthAt(s) / 2 + off));
    const f = frameAt(p.x, p.z);
    if (f.dist < widthAt(f.s) / 2 + 60) continue;
    const h = heightFromFrame(p.x, p.z, f);
    if (h > 190) continue;
    const zw = zoneWeights(f.s);
    add("farTree", s, { p: [p.x, h - 0.6, p.z], r: [0, rand() * 6, 0], s: 1.6 + rand() * 1.6, c: zw.ngarai > 0.5 ? pick(["#6b7f3a", "#5c7036"], rand()) : pick(["#2f6b35", "#3a7a3c", "#2c5f33", "#44803f"], rand()) });
  }
  return flora;
}

/* ------------------------------ grid tanah ------------------------- */

/** Koordinat sumbu yang rapat di inti (dekat sungai) dan merenggang ke luar. */
export function axisCoords(min: number, coreMin: number, coreMax: number, max: number, step: number) {
  const core: number[] = [];
  for (let v = coreMin; v <= coreMax + 0.001; v += step) core.push(v);
  const left: number[] = [];
  let d = step;
  for (let v = coreMin - d; v > min; v -= d) {
    left.unshift(v);
    d *= 1.13;
  }
  left.unshift(min);
  const right: number[] = [];
  d = step;
  for (let v = coreMax + d; v < max; v += d) {
    right.push(v);
    d *= 1.13;
  }
  right.push(max);
  return [...left, ...core, ...right];
}

/* ------------------------------ culling ---------------------------- */

/** Posisi pemain di sungai (diperbarui tiap frame) untuk menyembunyikan objek jauh. */
export const VIEW = { s: RAFT_START };
export const NEAR_BEHIND = 140;
export const NEAR_AHEAD = 480;
export const isNear = (s0: number, s1 = s0) => s1 > VIEW.s - NEAR_BEHIND && s0 < VIEW.s + NEAR_AHEAD;
