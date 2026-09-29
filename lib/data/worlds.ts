import type { DataIssueType, ErpEvent, MissionBrief, MissionId } from "@/lib/types";
import { ERP_ORDERS, MISSION_BRIEFS } from "@/lib/data/missions";

/** Info level versi dunia 3D, termasuk petunjuk kontrol. */
export interface WorldLevelInfo {
  judul: string;
  misi: string;
  kontrol: string;
  kontrolSentuh: string;
}

export const WORLD_LEVELS: Record<MissionId, WorldLevelInfo[]> = {
  "it-audit": [
    {
      judul: "Inspeksi Malam",
      misi: "Jelajahi kantor, pindai, tandai 6 pelanggaran, lalu amankan temuanmu. Ambil baterai, kopi, dan dokumen log, dan jangan masuk sorotan drone patroli!",
      kontrol: "WASD jalan · Shift lari · C jongkok · Spasi pindai · E periksa · hindari sorotan drone",
      kontrolSentuh: "Joystick jalan · tahan Lari/Jongkok · tombol Pindai & Periksa",
    },
    {
      judul: "Firewall Defender",
      misi: "Paket data mengalir ke server database. Blokir yang mencurigakan, biarkan aktivitas normal lewat. Jangan biarkan server kebobolan!",
      kontrol: "Klik paket untuk memblokir",
      kontrolSentuh: "Ketuk paket untuk memblokir",
    },
    {
      judul: "Serbuan Peretas",
      misi: "Peretas menyerbu server database! Tembak virus & bot sebelum menembus server, jangan kena staf yang bekerja normal, lalu kalahkan boss Peretas Bayangan dengan kontrol audit yang tepat.",
      kontrol: "WASD gerak · tahan Spasi tembak · Shift dash",
      kontrolSentuh: "Joystick gerak · tahan Tembak · tombol Dash",
    },
  ],
  "enterprise-system": [
    {
      judul: "Rute Order-to-Cash",
      misi: "Balapan melawan waktu! Jawab studi kasus di 6 gerbang modul ERP sepanjang alur order-to-cash (gerbang benar = +15 detik & combo). Kumpulkan paket data untuk nitro, lompati ramp, basmi drone bug, dan hindari kerucut, tumpukan kertas, serta genangan data error.",
      kontrol: "W gas · S rem · A/D belok · tahan Spasi nitro",
      kontrolSentuh: "Joystick untuk menyetir · tahan tombol Nitro untuk ngebut",
    },
    {
      judul: "Shift Gudang Pintar",
      misi: "Truk pelanggan antre di dermaga! Ambil palet semen yang tepat dari rak, muat ke truk sebelum sopirnya bosan, jalankan produksi saat dasbor ERP bilang stok menipis, dan tangani alarm di Terminal ERP. Awas forklift yang lewat!",
      kontrol: "WASD jalan · Shift lari · E ambil / muat / produksi",
      kontrolSentuh: "Joystick jalan · tombol Aksi · tahan Lari",
    },
    {
      judul: "Drone Integrasi: Hari Go-Live",
      misi: "Terbangkan drone kargo ERP di atas kawasan industri. Ambil paket data (pesanan, sales order, PO, faktur…) lalu antar ke divisi yang memprosesnya berikutnya. Lewati cincin sinkron untuk turbo, isi baterai, tabrak drone bug 'Data Silo' dengan turbo, lalu kembali ke Pusat Operasi untuk Go-Live!",
      kontrol: "W/S maju-mundur · A/D belok · Spasi naik · C turun · Shift turbo · E ambil/antar",
      kontrolSentuh: "Joystick terbang · tahan Naik/Turun/Turbo · tombol Aksi",
    },
  ],
  "data-science": [
    {
      judul: "Pemburu Data Liar",
      misi: "12 sprite data kabur ke Lembah Data! Jelajahi padang, hutan, danau & reruntuhan server, tangkap tiap sprite dengan scanner, lalu tentukan masalah datanya, format, tidak masuk akal, duplikat, kosong, atau bersih. Isi Menara Data Lake sebelum waktu habis.",
      kontrol: "WASD jalan · Shift lari · tahan E/Spasi scan · 1–5 pilih jenis · seret mouse putar kamera",
      kontrolSentuh: "Joystick jalan · tahan Lari/Scan · ketuk jenis data · geser layar putar kamera",
    },
    {
      judul: "Arung Jeram Data",
      misi: "Naik rakit bambu menyusuri Sungai Visualisasi! Tabrak pelampung berisi data BERSIH untuk membangun grafik batang, lewati celah gerbang bulan yang cocok dengan catatan untuk grafik garis, dan kumpulkan porsi produk yang totalnya 100%. Di tiap percabangan, pilih kanal dengan jenis grafik yang tepat. Awas batu, kayu hanyut, dan pusaran outlier!",
      kontrol: "A/D belok · W dayung · S tahan · Shift dayung kuat · Spasi lompat · seret mouse putar kamera",
      kontrolSentuh: "Joystick untuk mengarahkan rakit · tahan Kuat · tombol Lompat · geser layar putar kamera",
    },
    {
      judul: "Armada Prediksi",
      misi: "Nakhodai kapal pinisi di Kepulauan Insight! Manfaatkan angin untuk berlayar, tembak ubur-ubur ANOMALI (data janggal) dengan meriam sonar tanpa membuang data normal, lalu labuh di tiap pulau dan baca studi kasus tiap pulau (musim, promo, stok, kapasitas…) untuk memprediksi kiriman semen. Ungkap kenapa penjualan Toko Barokah nol, lalu tarik kesimpulan di Mercusuar Insight.",
      kontrol: "A/D kemudi · W/S naik-turun layar · Shift mesin · Spasi meriam sonar · E labuh · seret mouse putar kamera",
      kontrolSentuh: "Joystick kemudi & layar · tahan Mesin · tombol Sonar & Labuh · geser layar putar kamera",
    },
  ],
};

export const WORLD_BRIEFS: Record<MissionId, MissionBrief> = {
  "it-audit": {
    ...MISSION_BRIEFS["it-audit"],
    judul: "Operasi Inspektur",
    npc: {
      ...MISSION_BRIEFS["it-audit"].npc,
      dialog: [
        "Inspektur, ada laporan kebocoran data pelanggan di kantor pusat. Malam ini kamu turun langsung.",
        "Periksa kantor: cari kontrol yang bolong. Setelah itu jaga firewall server database, blokir lalu lintas data yang mencurigakan.",
        "Terakhir, peretas akan menyerbu server langsung. Lindungi datanya dan jebol perisai bos mereka dengan kontrol yang tepat. Siap bertugas?",
      ],
    },
    level: WORLD_LEVELS["it-audit"],
  },
  "enterprise-system": {
    ...MISSION_BRIEFS["enterprise-system"],
    judul: "Ekspedisi ERP",
    npc: {
      ...MISSION_BRIEFS["enterprise-system"].npc,
      dialog: [
        "Selamat datang, sopir andalan! Truk semen ini terhubung ke sistem ERP pabrik kita.",
        "Setiap gerbang yang kamu lewati adalah modul ERP: penjualan, gudang, produksi, logistik, keuangan. Urutannya penting!",
        "Setelah itu kamu pegang shift gudang: muat palet ke truk pelanggan, jalankan produksi, dan pantau dasbor ERP.",
        "Terakhir, hari Go-Live! Terbangkan drone dari Pusat Operasi dan alirkan data antar divisi, tunjukkan kalau sistem terintegrasi menghapus data silo!",
      ],
    },
    level: WORLD_LEVELS["enterprise-system"],
  },
  "data-science": {
    ...MISSION_BRIEFS["data-science"],
    npc: {
      ...MISSION_BRIEFS["data-science"].npc,
      dialog: [
        "Hai, detektif! Data penjualan semen masuk ke lab… tapi banyak yang rusak.",
        "Pertama, buru sprite data liar di lembah dan kenali masalah datanya. Lalu arungi Sungai Visualisasi dan bangun grafik dari data bersih.",
        "Terakhir, nakhodai pinisi ke kepulauan toko: bersihkan anomali, kirim stok sesuai prediksi, dan ungkap kenapa ada toko yang penjualannya nol!",
      ],
    },
    level: WORLD_LEVELS["data-science"],
  },
};

/** --- Data Science --- */

export type BinId = DataIssueType | "bersih";

export const DATA_BINS: { id: BinId; label: string; color: string }[] = [
  { id: "format", label: "Format", color: "#5b8def" },
  { id: "invalid", label: "Tidak masuk akal", color: "#e54b4b" },
  { id: "bersih", label: "Bersih", color: "#2fae66" },
  { id: "duplikat", label: "Duplikat", color: "#b36bd6" },
  { id: "kosong", label: "Kosong", color: "#f2a93b" },
];

export interface DataCube {
  id: string;
  /** Nama kolom (menentukan bentuk sprite), atau "Baris N" untuk kasus satu baris utuh. */
  kolom: string;
  nilai: string;
  jenis: BinId;
  penjelasan: string;
  /** Nomor baris sel ini di tabel. */
  baris?: number;
  /** Nilai lain di kolom / baris lain sebagai pembanding. */
  konteks?: string[];
  /** Keterangan lapangan yang perlu dibaca sebelum menilai. */
  catatan?: string;
}

/** Jumlah sprite data per permainan. */
export const HUNT_CUBE_COUNT = 12;

/**
 * Bank studi kasus sel data. Setiap main diundi HUNT_CUBE_COUNT kasus
 * (minimal dua per jenis), jadi isi & jumlah tiap jenis berubah-ubah.
 */
export const HUNT_CUBE_BANK: DataCube[] = [
  // --- format ---
  { id: "f-toko-kecil", kolom: "Toko", baris: 2, nilai: "toko sejahtera ", jenis: "format", konteks: ["Toko Makmur", "Toko Jaya", "Toko Amanah"], penjelasan: "Huruf kecil & spasi berlebih membuat 'toko sejahtera ' dianggap toko berbeda saat dikelompokkan." },
  { id: "f-toko-kapital", kolom: "Toko", baris: 4, nilai: "TOKO JAYA", jenis: "format", konteks: ["Toko Makmur", "Toko Sentosa", "Toko Berkah"], penjelasan: "Penulisan kapital semua tidak seragam dengan nama toko lain." },
  { id: "f-harga-rb", kolom: "Harga (Rp)", baris: 4, nilai: "65rb", jenis: "format", konteks: ["65000", "64500", "66000"], penjelasan: "'65rb' adalah teks, bukan angka, sehingga tidak bisa dijumlahkan atau dirata-rata." },
  { id: "f-harga-rp", kolom: "Harga (Rp)", baris: 6, nilai: "Rp 65.000,-", jenis: "format", konteks: ["65000", "66000", "64500"], penjelasan: "Nilainya wajar, tapi ditulis dengan simbol & titik ribuan sehingga terbaca sebagai teks." },
  { id: "f-kota-singkat", kolom: "Kota", baris: 3, nilai: "Sby", jenis: "format", konteks: ["Surabaya", "Gresik", "Sidoarjo"], penjelasan: "Singkatan 'Sby' dan 'Surabaya' akan dihitung sebagai dua kota berbeda." },
  { id: "f-unit-sak", kolom: "Unit Terjual", baris: 5, nilai: "120 sak", jenis: "format", konteks: ["95", "210", "88"], penjelasan: "Kolom angka berisi teks satuan. Satuan cukup ada di nama kolom." },
  { id: "f-tanggal", kolom: "Tanggal", baris: 7, nilai: "07/03/2025", jenis: "format", konteks: ["2025-03-05", "2025-03-06", "2025-03-08"], penjelasan: "Format tanggal berbeda & ambigu: 7 Maret atau 3 Juli? Seragamkan ke format TTTT-BB-HH." },
  // --- tidak masuk akal ---
  { id: "i-unit-negatif", kolom: "Unit Terjual", baris: 3, nilai: "-5", jenis: "invalid", konteks: ["120", "95", "150"], penjelasan: "Penjualan tidak mungkin negatif, ini salah input." },
  { id: "i-harga-10x", kolom: "Harga (Rp)", baris: 8, nilai: "650000", jenis: "invalid", konteks: ["65000", "64500", "66000"], penjelasan: "Harga 10× lipat dari toko lain, kemungkinan kelebihan satu angka nol." },
  { id: "i-tanggal-30feb", kolom: "Tanggal", baris: 5, nilai: "2025-02-30", jenis: "invalid", konteks: ["2025-02-27", "2025-02-28", "2025-03-01"], penjelasan: "Tanggal 30 Februari tidak ada di kalender." },
  { id: "i-unit-desimal", kolom: "Unit Terjual", baris: 6, nilai: "12,5", jenis: "invalid", konteks: ["12", "15", "9"], penjelasan: "Semen dijual per sak utuh, setengah sak tidak mungkin tercatat." },
  { id: "i-harga-nol", kolom: "Harga (Rp)", baris: 2, nilai: "0", jenis: "invalid", catatan: "Bulan ini tidak ada program gratis atau hadiah semen.", konteks: ["65000", "66000", "64500"], penjelasan: "Tanpa program gratis, harga Rp0 berarti datanya salah." },
  { id: "i-unit-placeholder", kolom: "Unit Terjual", baris: 9, nilai: "99999", jenis: "invalid", konteks: ["120", "150", "132"], penjelasan: "99999 adalah angka pengganti bawaan sistem lama, bukan penjualan asli." },
  // --- bersih (termasuk yang terlihat janggal tapi sah) ---
  { id: "b-toko", kolom: "Toko", baris: 1, nilai: "Toko Makmur", jenis: "bersih", konteks: ["Toko Jaya", "Toko Amanah", "Toko Berkah"], penjelasan: "Penulisan nama toko seragam dengan data lain." },
  { id: "b-kota", kolom: "Kota", baris: 7, nilai: "Sidoarjo", jenis: "bersih", konteks: ["Surabaya", "Gresik", "Tuban"], penjelasan: "Nama kota lengkap dan sesuai data master." },
  { id: "b-unit-nol", kolom: "Unit Terjual", baris: 4, nilai: "0", jenis: "bersih", catatan: "Toko Barokah tutup renovasi sepanjang minggu ini.", konteks: ["120", "95", "150"], penjelasan: "Nol di sini memang benar: tokonya tutup. Nilai janggal belum tentu salah, cek konteksnya." },
  { id: "b-harga-diskon", kolom: "Harga (Rp)", baris: 5, nilai: "58500", jenis: "bersih", catatan: "Pembelian ≥ 100 sak mendapat diskon 10%.", konteks: ["65000", "65000", "66000"], penjelasan: "65.000 × 0,9 = 58.500. Harga lebih rendah karena diskon borongan yang sah." },
  { id: "b-unit-borongan", kolom: "Unit Terjual", baris: 8, nilai: "480", jenis: "bersih", catatan: "Pembeli: kontraktor Proyek Tol Gresik (pesanan borongan, ada nota).", konteks: ["120", "95", "150"], penjelasan: "Outlier asli: nilainya ekstrem tapi benar terjadi & ada buktinya. Jangan dibuang." },
  { id: "b-baris-mirip", kolom: "Baris 5", nilai: "Toko Jaya · Gresik · 40 · 2025-03-06 · NOTA-0415", jenis: "bersih", konteks: ["Baris 2: Toko Jaya · Gresik · 40 · 2025-03-05 · NOTA-0408"], penjelasan: "Mirip, tapi tanggal & nomor notanya beda: dua transaksi sah, bukan duplikat." },
  // --- duplikat ---
  { id: "d-persis", kolom: "Baris 6", nilai: "Toko Makmur · Gresik · 120 · 2025-03-05 · NOTA-0412", jenis: "duplikat", konteks: ["Baris 1: Toko Makmur · Gresik · 120 · 2025-03-05 · NOTA-0412"], penjelasan: "Sama persis sampai nomor notanya. Kalau tidak dihapus, penjualan terhitung dua kali." },
  { id: "d-kapital", kolom: "Baris 7", nilai: "toko amanah · Tuban · 150 · 2025-03-06 · NOTA-0419", jenis: "duplikat", konteks: ["Baris 3: Toko Amanah · Tuban · 150 · 2025-03-06 · NOTA-0419"], penjelasan: "Hanya beda huruf besar-kecil, nomor nota sama: transaksi yang sama diinput dua kali." },
  { id: "d-cabang", kolom: "Baris 9", nilai: "Toko Sentosa · Sidoarjo · 88 · 2025-03-08 · NOTA-0433", jenis: "duplikat", catatan: "Baris ini diinput admin cabang Sidoarjo.", konteks: ["Baris 4: Toko Sentosa · Sidoarjo · 88 · 2025-03-08 · NOTA-0433 (input kantor pusat)"], penjelasan: "Nota yang sama dicatat pusat & cabang. Satu transaksi, dua baris." },
  // --- kosong ---
  { id: "k-kota", kolom: "Kota", baris: 5, nilai: "", jenis: "kosong", konteks: ["Surabaya", "Gresik", "Tuban"], penjelasan: "Kota kosong bisa dilengkapi dari data master toko." },
  { id: "k-strip", kolom: "Kota", baris: 8, nilai: "-", jenis: "kosong", konteks: ["Gresik", "Sidoarjo", "Mojokerto"], penjelasan: "Tanda '-' hanya pengganti nilai yang tidak diisi, datanya tetap hilang." },
  { id: "k-na", kolom: "Harga (Rp)", baris: 3, nilai: "N/A", jenis: "kosong", konteks: ["65000", "66000", "64500"], penjelasan: "'N/A' berarti harganya tidak tercatat, bukan format angka yang salah." },
  { id: "k-null", kolom: "Unit Terjual", baris: 7, nilai: "null", jenis: "kosong", konteks: ["120", "88", "132"], penjelasan: "'null' dari sistem berarti nilainya tidak ada. Jangan diganti 0 tanpa dicek." },
];

/** --- IT Audit --- */

export type OfficeObjectKind = "monitor" | "door" | "usb" | "cctv" | "card" | "printer" | "server" | "book";

export interface OfficeObject {
  id: string;
  nama: string;
  kind: OfficeObjectKind;
  x: number;
  z: number;
  pelanggaran: boolean;
  detail: string;
  konsep: string;
  /** Tindakan cepat untuk mengamankan pelanggaran (hanya untuk pelanggaran). */
  aksi?: string;
}

export const OFFICE_OBJECTS: OfficeObject[] = [
  { id: "v1", nama: "Monitor staf keuangan", kind: "monitor", x: -7, z: -4, pelanggaran: true, detail: "Ada kertas tempel di monitor: “admin / Semen2024!”.", konsep: "Keamanan password", aksi: "Copot kertas password" },
  { id: "v2", nama: "PC meja HR", kind: "monitor", x: -1.5, z: -4, pelanggaran: true, detail: "Layar menampilkan data gaji, pemiliknya pergi makan 40 menit lalu.", konsep: "Clear screen policy", aksi: "Kunci layar PC HR" },
  { id: "v3", nama: "Pintu ruang server", kind: "door", x: 9, z: -1.4, pelanggaran: true, detail: "Pintu ruang server diganjal kursi dan tidak ada log masuk.", konsep: "Kontrol akses fisik", aksi: "Tutup & kunci pintu server" },
  { id: "v4", nama: "PC bagian keuangan", kind: "usb", x: 3.5, z: 3.5, pelanggaran: true, detail: "Flashdisk tanpa label tertancap di PC keuangan.", konsep: "Risiko malware & kebocoran", aksi: "Cabut flashdisk" },
  { id: "v5", nama: "Kamera CCTV lobi", kind: "cctv", x: -11.8, z: 5.5, pelanggaran: true, detail: "CCTV mati sejak 2 minggu, tidak ada tiket perbaikan.", konsep: "Monitoring", aksi: "Buat tiket perbaikan CCTV" },
  { id: "v6", nama: "Pembaca kartu akses", kind: "card", x: 11.8, z: 4.5, pelanggaran: true, detail: "Kartu akses satpam dipinjamkan ke kurir paket supaya bisa naik lift sendiri.", konsep: "Akuntabilitas akses", aksi: "Tarik kartu pinjaman" },
  { id: "d1", nama: "Printer bersama", kind: "printer", x: -5, z: 3.5, pelanggaran: false, detail: "Mencetak laporan terjadwal; antrean cetak tercatat di sistem.", konsep: "Kontrol berjalan baik" },
  { id: "d2", nama: "Rak server backup", kind: "server", x: 10, z: -4, pelanggaran: false, detail: "Backup harian sukses dan log-nya lengkap.", konsep: "Kontrol berjalan baik" },
  { id: "d3", nama: "PC resepsionis", kind: "monitor", x: 4, z: -4, pelanggaran: false, detail: "Layar terkunci otomatis setelah 5 menit tidak dipakai.", konsep: "Kontrol berjalan baik" },
  { id: "d4", nama: "Buku tamu", kind: "book", x: -9.5, z: -0.5, pelanggaran: false, detail: "Setiap tamu mencatat nama & jam, dan didampingi staf.", konsep: "Kontrol berjalan baik" },
];

export type OfficeCase = Pick<OfficeObject, "detail" | "konsep" | "aksi">;

/**
 * Bank studi kasus per objek kantor. Objek, posisi, dan statusnya (pelanggaran/aman)
 * tetap karena terkait model 3D; yang diundi tiap main adalah kasusnya.
 */
export const OFFICE_VARIANTS: Record<string, OfficeCase[]> = {
  v1: [
    { detail: "Ada kertas tempel di monitor: “admin / Semen2024!”.", konsep: "Keamanan password", aksi: "Copot kertas password" },
    { detail: "Kertas tempel di monitor: “VPN: budi.fin / Gresik#1 · PIN brankas 4471”.", konsep: "Kerahasiaan kredensial", aksi: "Copot kertas & minta ganti PIN" },
    { detail: "Kertas tempel berisi 10 kode OTP cadangan untuk login aplikasi bank perusahaan.", konsep: "Autentikasi multi-faktor", aksi: "Amankan kode OTP cadangan" },
  ],
  v2: [
    { detail: "Layar menampilkan data gaji, pemiliknya pergi makan 40 menit lalu.", konsep: "Clear screen policy", aksi: "Kunci layar PC HR" },
    { detail: "PC login dengan akun “hr_umum” yang dipakai bergantian 4 orang; file data KTP karyawan terbuka.", konsep: "Akun bersama (shared account)", aksi: "Logout & bekukan akun bersama" },
    { detail: "Layar menampilkan email “Reset password payroll, klik di sini” yang tautannya sudah diklik. Pemiliknya sudah pulang.", konsep: "Phishing", aksi: "Isolasi PC & lapor tim keamanan" },
  ],
  v3: [
    { detail: "Pintu ruang server diganjal kursi dan tidak ada log masuk.", konsep: "Kontrol akses fisik", aksi: "Tutup & kunci pintu server" },
    { detail: "Pintu terbuka, teknisi vendor AC bekerja sendirian di dalam tanpa pendamping & tidak tercatat.", konsep: "Pengawasan pihak ketiga", aksi: "Dampingi & catat teknisi vendor" },
    { detail: "PIN pintu ruang server “1234” ditulis spidol di kusen pintu.", konsep: "Kontrol akses fisik", aksi: "Ganti PIN & hapus tulisan" },
  ],
  v4: [
    { detail: "Flashdisk tanpa label tertancap di PC keuangan.", konsep: "Risiko malware", aksi: "Cabut flashdisk" },
    { detail: "Flashdisk pribadi staf berisi salinan laporan keuangan, katanya mau dikerjakan di rumah.", konsep: "Kebocoran data", aksi: "Cabut & amankan flashdisk" },
    { detail: "Flashdisk “hadiah seminar” dari pihak tak dikenal tertancap, dan antivirus PC ini dimatikan.", konsep: "Risiko malware", aksi: "Cabut flashdisk & nyalakan antivirus" },
  ],
  v5: [
    { detail: "CCTV mati sejak 2 minggu, tidak ada tiket perbaikan.", konsep: "Monitoring", aksi: "Buat tiket perbaikan CCTV" },
    { detail: "CCTV menyala, tapi rekamannya hanya disimpan 1 hari lalu tertimpa otomatis.", konsep: "Retensi bukti", aksi: "Atur retensi rekaman 30 hari" },
    { detail: "Kamera diputar menghadap tembok sejak renovasi minggu lalu, tidak ada yang sadar.", konsep: "Monitoring", aksi: "Arahkan ulang kamera & catat insiden" },
  ],
  v6: [
    { detail: "Kartu akses satpam dipinjamkan ke kurir paket supaya bisa naik lift sendiri.", konsep: "Akuntabilitas akses", aksi: "Tarik kartu pinjaman" },
    { detail: "Kartu anak magang yang kontraknya berakhir Juni masih bisa membuka pintu.", konsep: "Offboarding", aksi: "Nonaktifkan kartu magang" },
    { detail: "Satu kartu “MASTER” tanpa nama membuka semua pintu dan dipakai bergantian.", konsep: "Akses tanpa identitas", aksi: "Tarik kartu MASTER" },
  ],
  d1: [
    { detail: "Mencetak laporan terjadwal; antrean cetak tercatat di sistem.", konsep: "Log aktivitas" },
    { detail: "Dokumen gaji hanya tercetak setelah pemiliknya menempelkan kartu di printer.", konsep: "Secure print" },
    { detail: "Tumpukan kertas di sebelah printer ternyata sudah dicacah mesin penghancur kertas.", konsep: "Pemusnahan dokumen" },
  ],
  d2: [
    { detail: "Backup harian sukses dan log-nya lengkap.", konsep: "Backup & log" },
    { detail: "Lampu rak berkedip merah, tapi tiket #INC-88 sudah dibuka dan teknisi dijadwalkan pagi ini.", konsep: "Manajemen insiden" },
    { detail: "Backup mingguan dikirim ke lokasi kedua dan uji restore bulan lalu berhasil.", konsep: "Pemulihan bencana" },
  ],
  d3: [
    { detail: "Layar terkunci otomatis setelah 5 menit tidak dipakai.", konsep: "Clear screen policy" },
    { detail: "PC menyala tengah malam karena update keamanan terjadwal; layarnya tetap terkunci.", konsep: "Patch management" },
    { detail: "Ada catatan “Wi-Fi tamu: Tamu2024”. Jaringan tamu terpisah total dari jaringan kantor.", konsep: "Segmentasi jaringan" },
  ],
  d4: [
    { detail: "Setiap tamu mencatat nama & jam, dan didampingi staf.", konsep: "Pengawasan tamu" },
    { detail: "Tamu terakhir keluar 21.10, ada paraf satpam yang mendampinginya.", konsep: "Pengawasan tamu" },
    { detail: "Buku tamu digital: data KTP tamu terenkripsi dan otomatis dihapus setelah 30 hari.", konsep: "Perlindungan data pribadi" },
  ],
};

/** Konsep pengecoh tambahan untuk kuis "kontrol apa yang dilanggar?". */
export const OFFICE_EXTRA_CONCEPTS = ["Segregation of duties", "Change management", "Enkripsi data", "Kontrol waktu akses", "Least privilege"];

export type BonusKind = "baterai" | "kopi" | "dokumen";

/** Titik lantai yang bebas furnitur; level memilih beberapa secara acak tiap main. */
export const BONUS_SPOTS: [number, number][] = [
  [-9, -6], [-4.2, -6.5], [1.5, -6.6], [5.2, -5.8], [-9.5, 2], [-7.5, 6.2],
  [-1, 5.8], [1.2, 1.4], [7, 1.2], [8.5, 5.5], [-3.5, -1.2], [4.8, -1.5],
];
export const BONUS_KINDS: BonusKind[] = ["baterai", "baterai", "kopi", "kopi", "dokumen", "dokumen"];

export interface FirewallPacket {
  id: string;
  pengguna: string;
  aksi: string;
  jam: string;
  bahaya: boolean;
  konsep: string;
  alasan: string;
}

/**
 * Bank lalu lintas data menuju server database (level Firewall Defender).
 * Tiap main diambil FIREWALL_DRAW paket acak (seimbang bahaya/normal).
 */
export const FIREWALL_PACKETS: FirewallPacket[] = [
  // --- berbahaya ---
  { id: "f1", pengguna: "wulan.fin", aksi: "Login gagal 9× dalam 1 menit", jam: "07.52", bahaya: true, konsep: "Brute force", alasan: "Percobaan menebak password berulang kali dalam waktu singkat." },
  { id: "f2", pengguna: "yoga.mkt", aksi: "Tarik seluruh tabel pelanggan via API", jam: "22.47", bahaya: true, konsep: "Anomali volume", alasan: "Staf marketing tidak pernah butuh seluruh tabel, apalagi larut malam." },
  { id: "f3", pengguna: "gilang.it", aksi: "Commit API key produksi ke repo publik", jam: "16.12", bahaya: true, konsep: "Kebocoran kredensial", alasan: "Kunci rahasia di repo publik bisa dipakai siapa saja." },
  { id: "f4", pengguna: "vpn: laptop-tak-terdaftar", aksi: "Login VPN akun direktur", jam: "04.30", bahaya: true, konsep: "Perangkat tak dikenal", alasan: "Akun penting masuk dari perangkat yang tidak pernah didaftarkan." },
  { id: "f5", pengguna: "andre.dev", aksi: "Deploy ke server produksi tanpa tiket", jam: "14.20", bahaya: true, konsep: "Change management", alasan: "Perubahan di produksi wajib punya tiket yang disetujui." },
  { id: "f6", pengguna: "bayu.gdg", aksi: "Buka data gaji karyawan", jam: "10.30", bahaya: true, konsep: "Least privilege", alasan: "Staf gudang tidak butuh data gaji untuk pekerjaannya." },
  { id: "f7", pengguna: "admin.tmp", aksi: "Hapus log audit bulan Juli", jam: "23.40", bahaya: true, konsep: "Audit trail", alasan: "Menghapus log sama dengan menghapus jejak, tanda bahaya besar." },
  { id: "f8", pengguna: "nina.sales", aksi: "Kirim daftar harga kontrak ke email @pesaing.co.id", jam: "17.05", bahaya: true, konsep: "Kebocoran data", alasan: "Data rahasia dagang dikirim ke domain pesaing." },
  { id: "f9", pengguna: "perangkat tamu", aksi: "Scan port server database", jam: "03.02", bahaya: true, konsep: "Serangan jaringan", alasan: "Perangkat tamu tidak punya urusan dengan server database." },
  { id: "f10", pengguna: "dewi.hr", aksi: "Login dari 2 negara dalam 5 menit", jam: "09.00", bahaya: true, konsep: "Akun dibajak", alasan: "Mustahil pindah negara dalam 5 menit, password kemungkinan dicuri." },
  { id: "f11", pengguna: "tono.fin", aksi: "Buat vendor baru & setujui pembayarannya sendiri", jam: "11.20", bahaya: true, konsep: "Segregation of duties", alasan: "Orang yang sama membuat dan menyetujui pembayaran, rawan fraud." },
  { id: "f12", pengguna: "reza.ga", aksi: "Unduh rekaman CCTV ruang direksi 30 hari", jam: "18.40", bahaya: true, konsep: "Least privilege", alasan: "Staf umum tidak berwenang mengambil rekaman CCTV sebanyak itu." },
  { id: "f13", pengguna: "db.backup", aksi: "Kirim backup database ke IP luar negeri", jam: "02.15", bahaya: true, konsep: "Eksfiltrasi data", alasan: "Backup seharusnya hanya ke server cadangan internal, bukan IP asing." },
  { id: "f14", pengguna: "maya.cs", aksi: "Matikan antivirus di 12 PC sekaligus", jam: "12.10", bahaya: true, konsep: "Pelemahan kontrol", alasan: "CS tidak berwenang mematikan antivirus, pola khas persiapan serangan." },
  { id: "f15", pengguna: "printer-lt2", aksi: "Login SSH ke server keuangan", jam: "01.44", bahaya: true, konsep: "Perangkat disusupi", alasan: "Printer tidak pernah butuh login ke server; kemungkinan sudah dibobol." },
  { id: "f16", pengguna: "arif.prod", aksi: "Naikkan hak aksesnya sendiri jadi admin", jam: "13.37", bahaya: true, konsep: "Eskalasi hak akses", alasan: "Hak akses hanya boleh diubah admin lewat permintaan resmi." },
  { id: "f17", pengguna: "joko.gdg", aksi: "Ubah 50 transaksi stok bulan lalu", jam: "20.15", bahaya: true, konsep: "Integritas data", alasan: "Mengubah transaksi lama secara massal bisa menutupi selisih stok." },
  { id: "f18", pengguna: "form web", aksi: "Kirim input ' OR 1=1 -- ke kolom login", jam: "05.20", bahaya: true, konsep: "SQL injection", alasan: "Pola input ini mencoba membobol database lewat celah query." },
  // --- normal (termasuk yang tampak janggal tapi sah) ---
  { id: "n1", pengguna: "rani.cs", aksi: "Buka 1 profil pelanggan yang komplain", jam: "09.15", bahaya: false, konsep: "Need-to-know", alasan: "Sesuai peran CS dan jam kerja." },
  { id: "n2", pengguna: "hendra.gdg", aksi: "Cek stok semen sebelum truk berangkat", jam: "08.40", bahaya: false, konsep: "Need-to-know", alasan: "Data stok memang bagian dari tugas gudang." },
  { id: "n3", pengguna: "dewi.hr", aksi: "Proses penggajian bulan ini", jam: "13.00", bahaya: false, konsep: "Role-based access", alasan: "Penggajian adalah tugas HR." },
  { id: "n4", pengguna: "fajar.dba", aksi: "Deploy tiket #CR-204 (disetujui)", jam: "11.00", bahaya: false, konsep: "Change management", alasan: "Perubahan punya tiket yang disetujui dan tercatat." },
  { id: "n5", pengguna: "andre.dev", aksi: "Login ke server development", jam: "11.40", bahaya: false, konsep: "Pemisahan lingkungan", alasan: "Server development memang tempat kerja developer." },
  { id: "n6", pengguna: "oncall.it", aksi: "Restart server produksi, tiket insiden #INC-91", jam: "02.05", bahaya: false, konsep: "Manajemen insiden", alasan: "Tengah malam, tapi petugas jaga menangani insiden resmi yang tercatat." },
  { id: "n7", pengguna: "lala.intern", aksi: "Buka data contoh (dummy)", jam: "10.20", bahaya: false, konsep: "Minimisasi data", alasan: "Magang memang diberi akses data contoh." },
  { id: "n8", pengguna: "budi.fin", aksi: "Cetak laporan keuangan terjadwal", jam: "15.00", bahaya: false, konsep: "Role-based access", alasan: "Laporan rutin bagian keuangan." },
  { id: "n9", pengguna: "backup.sys", aksi: "Backup harian ke server cadangan internal", jam: "01.00", bahaya: false, konsep: "Proses terjadwal", alasan: "Proses otomatis terjadwal ke lokasi yang sah." },
  { id: "n10", pengguna: "helpdesk.it", aksi: "Reset password atas tiket #HD-310", jam: "08.55", bahaya: false, konsep: "Verifikasi identitas", alasan: "Reset dilakukan helpdesk lewat tiket setelah identitas diverifikasi." },
  { id: "n11", pengguna: "auditor.ext", aksi: "Baca log akses 3 bulan (hanya baca)", jam: "10.10", bahaya: false, konsep: "Akses auditor", alasan: "Auditor eksternal diberi akses baca sementara sesuai surat penugasan." },
  { id: "n12", pengguna: "fajar.dba", aksi: "Ganti password admin (jadwal 90 hari)", jam: "08.30", bahaya: false, konsep: "Kebijakan password", alasan: "Mengganti password berkala justru kontrol yang baik." },
  { id: "n13", pengguna: "sinta.cs", aksi: "Lembur dengan izin atasan", jam: "20.00", bahaya: false, konsep: "Kontrol waktu akses", alasan: "Di luar jam kerja, tapi sudah ada persetujuan atasan." },
  { id: "n14", pengguna: "patch.sys", aksi: "Pasang update keamanan di 40 PC", jam: "23.30", bahaya: false, konsep: "Patch management", alasan: "Jadwal patch malam agar tidak mengganggu kerja, sesuai kalender IT." },
  { id: "n15", pengguna: "vpn: laptop-kantor-117", aksi: "Login VPN saat dinas luar kota", jam: "19.20", bahaya: false, konsep: "Akses jarak jauh", alasan: "Perangkat terdaftar, MFA berhasil, dan jadwal dinasnya tercatat." },
  { id: "n16", pengguna: "tono.fin", aksi: "Ajukan pembayaran vendor (menunggu persetujuan)", jam: "10.45", bahaya: false, konsep: "Segregation of duties", alasan: "Tono hanya mengajukan; persetujuan tetap oleh manajer." },
  { id: "n17", pengguna: "etl.sys", aksi: "Salin 50.000 baris penjualan ke gudang data", jam: "03.00", bahaya: false, konsep: "Proses terjadwal", alasan: "Volume besar, tapi ini job ETL malam ke server internal." },
  { id: "n18", pengguna: "reza.ga", aksi: "Lihat rekaman CCTV lobi 1 jam (laporan kehilangan)", jam: "09.40", bahaya: false, konsep: "Need-to-know", alasan: "Ada laporan kehilangan resmi dan hanya rekaman terkait yang dibuka." },
];

/** Jumlah paket per main (lalu dikocok ulang bila habis). */
export const FIREWALL_DRAW = 24;

export type ArenaEnemyKind = "virus" | "bot" | "phish" | "yatim";

export interface ArenaEnemyInfo {
  nama: string;
  konsep: string;
  alasan: string;
  hp: number;
  speed: number;
  /** Kerusakan pada server bila berhasil menembus; 0 = mengejar pemain. */
  damage: number;
  color: string;
}

/** Ancaman di level Serbuan Peretas. */
export const ARENA_ENEMIES: Record<ArenaEnemyKind, ArenaEnemyInfo> = {
  virus: { nama: "Virus USB", konsep: "Malware", alasan: "Flashdisk tak dikenal bisa membawa malware, port USB perlu dibatasi.", hp: 1, speed: 3.3, damage: 5, color: "#e54b4b" },
  bot: { nama: "Bot brute force", konsep: "Brute force", alasan: "Bot menebak password berulang kali, kunci akun & MFA menghentikannya.", hp: 2, speed: 2.3, damage: 7, color: "#9b5de5" },
  phish: { nama: "Email phishing", konsep: "Phishing", alasan: "Phishing menyasar manusia, bukan server, pelatihan kesadaran keamanan itu penting.", hp: 2, speed: 3, damage: 0, color: "#f2a93b" },
  yatim: { nama: "Akun resign", konsep: "Offboarding", alasan: "Akun karyawan yang sudah keluar harus dinonaktifkan di hari terakhirnya.", hp: 3, speed: 1.8, damage: 10, color: "#8a94a6" },
};

/** Staf yang mengakses server secara sah, jangan ditembak. */
export const ARENA_STAFF: string[] = [
  "siti.qc · uji mutu semen",
  "agus.log · jadwal truk",
  "lina.pr · rilis berita",
  "doni.k3 · laporan K3",
  "sensor.kiln · suhu tungku",
  "wati.legal · arsip kontrak",
  "eka.proc · daftar pemasok",
];

/** --- Enterprise System --- */

/** Titik kendali lintasan (x, z); dibuat lingkaran tertutup dengan Catmull-Rom. */
export const TRACK_POINTS: [number, number][] = [
  [0, 0], [46, -24], [96, -24], [136, 2], [148, 46], [128, 90], [92, 110], [60, 102],
  [26, 112], [-14, 130], [-62, 122], [-100, 88], [-108, 42], [-80, 10], [-40, 10],
];

export const RUSH_STOPS = [
  { id: "pabrik", nama: "Pabrik & Gudang", t: 0.03 },
  { id: "A", nama: "Proyek Tol", t: 0.3 },
  { id: "B", nama: "Perumahan", t: 0.55 },
  { id: "C", nama: "Toko Bangunan", t: 0.8 },
];

/** --- Level Shift Gudang Pintar --- */

export type OpsProductId = "pcc" | "opc" | "putih";

export const OPS_PRODUCTS: Record<OpsProductId, { nama: string; singkat: string; color: string; sack: string }> = {
  pcc: { nama: "Semen PCC", singkat: "PCC", color: "#e0513f", sack: "#f0d9c4" },
  opc: { nama: "Semen OPC", singkat: "OPC", color: "#3f7fd8", sack: "#dfe6ee" },
  putih: { nama: "Semen Putih", singkat: "PUTIH", color: "#f4f1ea", sack: "#fbfaf6" },
};

export const OPS_PRODUCT_IDS: OpsProductId[] = ["pcc", "opc", "putih"];

export interface OpsOrder {
  id: string;
  pelanggan: string;
  jumlah: number;
  /** Detik munculnya truk di jalan masuk. */
  muncul: number;
  /** Palet yang harus dimuat (1 palet ≈ 20–30 ton). */
  palet: OpsProductId[];
}

const OPS_ORDER_MIX: OpsProductId[][] = [
  ["opc", "opc"],
  ["pcc", "pcc"],
  ["putih"],
  ["pcc", "opc"],
  ["pcc", "pcc", "opc"],
  ["putih", "putih"],
  ["opc", "opc", "putih"],
  ["pcc"],
];
const OPS_ORDER_TIMES = [1, 8, 20, 36, 52, 70, 88, 106];

/** Pesanan ERP yang sama dengan misi kampus, dikemas jadi palet per jenis semen. */
export const OPS_ORDERS: OpsOrder[] = ERP_ORDERS.map((order, index) => ({
  id: order.id,
  pelanggan: order.pelanggan,
  jumlah: order.jumlah,
  muncul: OPS_ORDER_TIMES[index] ?? order.muncul * 1.4,
  palet: OPS_ORDER_MIX[index % OPS_ORDER_MIX.length],
}));

/** Waktu (detik) alarm kejadian ERP berbunyi di Terminal Ruang Kendali. */
export const OPS_EVENT_TIMES = [30, 78, 124];

/**
 * Bank kejadian ERP untuk Level Hari Sibuk: satu slot per waktu alarm,
 * tiap main diundi satu kejadian per slot dan urutan opsinya diacak.
 */
export const OPS_EVENT_BANK: ErpEvent[][] = [
  [
    {
      id: "ops-gipsum",
      muncul: 30,
      judul: "Kiriman gipsum terlambat",
      deskripsi: "Pemasok gipsum mengabarkan kirimannya telat 2 hari, padahal produksi OPC besok butuh gipsum.",
      konsep: "Perencanaan material (MRP)",
      opsi: [
        { label: "Cek stok pengaman gipsum di ERP & geser jadwal ke produk yang bahannya tersedia", benar: true, hasil: "Produksi tetap jalan dengan PCC dulu; pesanan OPC dijadwal ulang tanpa kejutan." },
        { label: "Tetap jalankan jadwal, gipsumnya pasti datang", benar: false, hasil: "Kiln berhenti di tengah jalan karena bahan habis, pesanan ikut terlambat.", kepuasan: -10 },
        { label: "Beli gipsum darurat dari pemasok lain dengan harga 2×", benar: false, hasil: "Ternyata stok pengaman masih cukup 3 hari. Biaya membengkak tanpa perlu.", kepuasan: -5 },
      ],
    },
    {
      id: "ops-opname",
      muncul: 30,
      judul: "Hitung fisik tidak cocok",
      deskripsi: "Hitung fisik rak PCC: 18 palet. ERP mencatat 20 palet.",
      konsep: "Stock opname",
      opsi: [
        { label: "Telusuri riwayat transaksi rak PCC lalu koreksi dengan dokumen penyesuaian", benar: true, hasil: "Ketemu: 2 palet rusak belum dicatat. Data kini sesuai fisik & ada jejak auditnya.", stok: -20 },
        { label: "Ganti angka di ERP jadi 18 tanpa catatan apa pun", benar: false, hasil: "Angkanya cocok, tapi penyebabnya tak ketemu dan tidak ada jejak audit. Selisih berulang.", stokSusulan: -40 },
        { label: "Anggap salah hitung, hitung ulang minggu depan", benar: false, hasil: "Selisih dibiarkan… stok fisik ternyata terus berkurang.", stokSusulan: -40 },
      ],
    },
    {
      id: "ops-packer",
      muncul: 30,
      judul: "Mesin pengantong mati",
      deskripsi: "Mesin packer mati 1 jam. Pesanan Perumahan Asri dijadwalkan kirim siang ini.",
      konsep: "Visibilitas stok & pesanan",
      opsi: [
        { label: "Tunda semua pengiriman hari ini sampai mesin pulih", benar: false, hasil: "Pesanan yang sebenarnya bisa dipenuhi dari stok ikut tertunda. Pelanggan kecewa.", kepuasan: -15 },
        { label: "Cek di ERP pesanan mana yang bisa dipenuhi dari stok jadi, kabari yang terdampak", benar: true, hasil: "Perumahan Asri tetap terkirim dari stok gudang; hanya 1 pelanggan yang dijadwal ulang." },
        { label: "Kirim semen curah tanpa kantong supaya cepat", benar: false, hasil: "Pelanggan memesan semen kantong, kirimannya ditolak di lokasi.", kepuasan: -10 },
      ],
    },
  ],
  [
    {
      id: "ops-harga",
      muncul: 78,
      judul: "Harga faktur beda dengan kontrak",
      deskripsi: "PT Karya Bangun protes: faktur memakai Rp68.000/sak, padahal kontraknya Rp65.000.",
      konsep: "Data master",
      opsi: [
        { label: "Beri potongan manual di faktur ini saja", benar: false, hasil: "Faktur ini beres, tapi data master masih salah. Faktur bulan depan salah lagi.", kepuasan: -5 },
        { label: "Cek harga kontrak di data master ERP, koreksi faktur & data masternya", benar: true, hasil: "Sumber kesalahannya diperbaiki; semua faktur berikutnya otomatis memakai harga yang benar." },
        { label: "Minta pelanggan bayar dulu, selisihnya dikembalikan nanti", benar: false, hasil: "Pelanggan merasa dirugikan dan menunda pembayaran.", kepuasan: -15 },
      ],
    },
    {
      id: "ops-kredit",
      muncul: 78,
      judul: "Limit kredit terlampaui",
      deskripsi: "Proyek Jembatan memesan 80 ton, tapi piutangnya sudah melewati limit kredit di ERP.",
      konsep: "Kontrol kredit",
      opsi: [
        { label: "Kirim saja, pelanggan besar pasti bayar", benar: false, hasil: "Barang keluar, piutang makin menumpuk dan kas perusahaan seret.", stok: -40 },
        { label: "Tolak pesanannya untuk selamanya", benar: false, hasil: "Pelanggan besar pindah ke pesaing.", kepuasan: -15 },
        { label: "Tahan pesanan otomatis & minta persetujuan manajer keuangan", benar: true, hasil: "Pelanggan membayar sebagian dulu, pesanan dilepas. Risiko piutang macet terkendali." },
      ],
    },
    {
      id: "ops-alamat",
      muncul: 78,
      judul: "Lokasi bongkar berubah",
      deskripsi: "Perumahan Asri memindahkan lokasi bongkar ke blok baru, sopir masih membawa surat jalan lama.",
      konsep: "Data terintegrasi",
      opsi: [
        { label: "Perbarui alamat di Sales Order; surat jalan & rute ikut ter-update", benar: true, hasil: "Sopir mendapat rute baru di aplikasinya, dan faktur memakai alamat yang benar." },
        { label: "Telepon sopir saja, sistem tidak perlu diubah", benar: false, hasil: "Barang sampai, tapi data pengiriman & faktur masih alamat lama. Tagihan salah kirim.", kepuasan: -5 },
        { label: "Batalkan & buat pesanan baru dari awal", benar: false, hasil: "Pengiriman tertunda sehari dan muncul data pesanan ganda.", kepuasan: -10 },
      ],
    },
  ],
  [
    {
      id: "ops-retur",
      muncul: 124,
      judul: "Retur semen menggumpal",
      deskripsi: "Toko Sentosa mengembalikan 20 sak yang menggumpal karena terkena hujan di perjalanan.",
      konsep: "Retur penjualan",
      opsi: [
        { label: "Masukkan lagi ke rak stok jual", benar: false, hasil: "Semen rusak tercampur stok bagus; ketahuan saat opname dan harus dibuang.", stokSusulan: -40 },
        { label: "Tolak retur, kerusakan di jalan bukan urusan kita", benar: false, hasil: "Toko Sentosa kecewa dan mengurangi pesanan.", kepuasan: -15 },
        { label: "Catat retur di ERP, kirim pengganti & tandai batch untuk dicek", benar: true, hasil: "Stok rusak dipisahkan, pelanggan dapat pengganti, dan penyebabnya (terpal truk) ketemu.", stok: -20 },
      ],
    },
    {
      id: "ops-mendadak",
      muncul: 124,
      judul: "Tambahan pesanan mendadak",
      deskripsi: "Proyek Tol minta tambahan 60 ton untuk besok pagi.",
      konsep: "Available-to-promise",
      opsi: [
        { label: "Cek kapasitas produksi & stok di ERP sebelum menjanjikan tanggal", benar: true, hasil: "ERP menunjukkan 40 ton siap besok & 20 ton lusa. Pelanggan setuju dikirim bertahap." },
        { label: "Langsung janjikan besok pagi", benar: false, hasil: "Stok tidak cukup, janji meleset dan pelanggan kecewa.", kepuasan: -15 },
        { label: "Ambil stok yang sudah dipesan pelanggan lain", benar: false, hasil: "Pesanan Toko Berkah jadi kekurangan barang.", stok: -40 },
      ],
    },
    {
      id: "ops-kiln",
      muncul: 124,
      judul: "Konsumsi batu bara melonjak",
      deskripsi: "Dasbor ERP: konsumsi batu bara kiln naik 15% minggu ini, padahal produksi tidak naik.",
      konsep: "Analisis biaya produksi",
      opsi: [
        { label: "Abaikan, mungkin kebetulan", benar: false, hasil: "Ternyata ada kebocoran panas di kiln; biaya produksi terus naik.", kepuasan: -5 },
        { label: "Kurangi produksi 50% supaya hemat bahan bakar", benar: false, hasil: "Stok menipis dan pesanan terancam telat, masalah kiln tetap ada.", stok: -40 },
        { label: "Bandingkan data produksi & konsumsi bahan bakar, minta maintenance cek kiln", benar: true, hasil: "Ditemukan segel pintu kiln bocor; setelah diperbaiki konsumsi kembali normal." },
      ],
    },
  ],
];

/** --- Level Drone Integrasi --- */

export type DroneSiteId = "hq" | "penjualan" | "keuangan" | "gudang" | "pabrik" | "pelabuhan" | "proyek" | "perumahan";

export interface DroneSite {
  id: DroneSiteId;
  nama: string;
  divisi: string;
  /** Pusat landasan antar-jemput (x, z). */
  x: number;
  z: number;
  color: string;
}

export const DRONE_SITES: DroneSite[] = [
  { id: "hq", nama: "Pusat Operasi", divisi: "Menara ERP", x: 0, z: 0, color: "#ffc857" },
  { id: "penjualan", nama: "Kantor Penjualan", divisi: "Penjualan (SD/CRM)", x: 140, z: -70, color: "#3fa7ff" },
  { id: "keuangan", nama: "Kantor Keuangan", divisi: "Keuangan (FI/CO)", x: 170, z: -5, color: "#2fae66" },
  { id: "gudang", nama: "Gudang Distribusi", divisi: "Gudang (WM)", x: -140, z: 125, color: "#f2a93b" },
  { id: "pabrik", nama: "Pabrik Semen", divisi: "Produksi (PP)", x: -210, z: 20, color: "#e5664b" },
  { id: "pelabuhan", nama: "Pelabuhan Pemasok", divisi: "Pengadaan (MM)", x: 190, z: 268, color: "#8e7cf0" },
  { id: "proyek", nama: "Proyek Tol Gresik", divisi: "Pelanggan", x: 40, z: -230, color: "#ff8fb1" },
  { id: "perumahan", nama: "Perumahan Asri", divisi: "Pelanggan", x: 240, z: 140, color: "#4fd1c5" },
];

export interface DroneJob {
  id: string;
  paket: string;
  kode: string;
  deskripsi: string;
  dari: DroneSiteId;
  ke: DroneSiteId;
  pengecoh: [DroneSiteId, DroneSiteId];
  konsep: string;
  benar: string;
  petunjuk: string;
}

/**
 * Bank tugas drone: rantai data ERP end-to-end (order-to-cash & procure-to-pay).
 * Satu slot per tugas; tiap main diundi satu varian per slot.
 */
export const DRONE_JOB_BANK: DroneJob[][] = [
  [
    {
      id: "j1a",
      paket: "Pesanan Pelanggan",
      kode: "PO-TOL-80T",
      deskripsi: "Proyek Tol Gresik memesan 80 ton semen OPC.",
      dari: "proyek",
      ke: "penjualan",
      pengecoh: ["gudang", "keuangan"],
      konsep: "Order entry",
      benar: "Pesanan dicatat sekali di modul Penjualan, langsung terlihat oleh gudang, produksi, dan keuangan.",
      petunjuk: "Pesanan harus dicatat dulu sebagai Sales Order sebelum divisi lain bisa bergerak.",
    },
    {
      id: "j1b",
      paket: "Permintaan Penawaran",
      kode: "RFQ-ASRI-12",
      deskripsi: "Perumahan Asri minta penawaran harga untuk 30 ton semen PCC. Siapa yang menyusun penawarannya?",
      dari: "perumahan",
      ke: "penjualan",
      pengecoh: ["keuangan", "pabrik"],
      konsep: "Quotation (CRM)",
      benar: "Penawaran disusun di modul Penjualan/CRM memakai daftar harga resmi, lalu bisa dikonversi jadi Sales Order.",
      petunjuk: "Harga & penawaran untuk pelanggan dikelola oleh tim Penjualan.",
    },
  ],
  [
    {
      id: "j2a",
      paket: "Sales Order",
      kode: "SO-1042",
      deskripsi: "SO sudah tercatat. Siapa yang mengecek ketersediaan barangnya?",
      dari: "penjualan",
      ke: "gudang",
      pengecoh: ["pabrik", "pelabuhan"],
      konsep: "Cek stok real-time",
      benar: "Gudang melihat SO secara real-time dan langsung mengecek stok yang tersedia.",
      petunjuk: "Sebelum memproduksi atau membeli, cek dulu apakah stok gudang masih cukup.",
    },
    {
      id: "j2b",
      paket: "Cek Limit Kredit",
      kode: "SO-1057",
      deskripsi: "SO Perumahan Asri senilai Rp400 juta menunggu. Plafon kredit pelanggan dicek oleh siapa?",
      dari: "penjualan",
      ke: "keuangan",
      pengecoh: ["gudang", "pabrik"],
      konsep: "Kontrol kredit",
      benar: "Keuangan membandingkan piutang berjalan dengan limit kredit sebelum SO dilepas ke gudang.",
      petunjuk: "Piutang & limit kredit pelanggan dipegang oleh Keuangan.",
    },
  ],
  [
    {
      id: "j3a",
      paket: "Permintaan Produksi",
      kode: "MRP-077",
      deskripsi: "Stok OPC kurang 50 ton. Kebutuhan ini harus dipenuhi siapa?",
      dari: "gudang",
      ke: "pabrik",
      pengecoh: ["keuangan", "penjualan"],
      konsep: "Perencanaan kebutuhan (MRP)",
      benar: "ERP membuat jadwal produksi otomatis begitu stok di bawah kebutuhan.",
      petunjuk: "Kekurangan stok barang jadi ditutup dengan menjadwalkan produksi.",
    },
    {
      id: "j3b",
      paket: "Permintaan Pembelian",
      kode: "PR-KTG-09",
      deskripsi: "Stok kantong semen (kemasan) di gudang tinggal cukup untuk 2 hari. Permintaan pembelian dikirim ke…",
      dari: "gudang",
      ke: "pelabuhan",
      pengecoh: ["pabrik", "penjualan"],
      konsep: "Reorder point",
      benar: "Stok di bawah titik pesan ulang memicu permintaan pembelian ke modul Pengadaan.",
      petunjuk: "Barang yang dibeli dari pemasok diurus oleh Pengadaan (MM).",
    },
  ],
  [
    {
      id: "j4a",
      paket: "Purchase Order Gipsum",
      kode: "PO-MM-311",
      deskripsi: "Produksi butuh bahan baku gipsum. Ke mana PO dikirim?",
      dari: "pabrik",
      ke: "pelabuhan",
      pengecoh: ["gudang", "keuangan"],
      konsep: "Pengadaan (procure-to-pay)",
      benar: "Modul Pengadaan mengirim PO ke pemasok, bahan baku datang lewat pelabuhan.",
      petunjuk: "Bahan baku dibeli dari pemasok melalui modul Pengadaan.",
    },
    {
      id: "j4b",
      paket: "Hasil Produksi",
      kode: "GR-PP-450",
      deskripsi: "50 ton OPC selesai dikantongi. Laporan hasil produksi diserahkan ke…",
      dari: "pabrik",
      ke: "gudang",
      pengecoh: ["penjualan", "pelabuhan"],
      konsep: "Goods receipt produksi",
      benar: "Hasil produksi dicatat sebagai barang masuk gudang, sehingga stok siap jual langsung bertambah.",
      petunjuk: "Barang jadi disimpan & dicatat stoknya oleh Gudang.",
    },
  ],
  [
    {
      id: "j5a",
      paket: "Tagihan Pemasok",
      kode: "INV-SUP-58",
      deskripsi: "Gipsum sudah diterima. Tagihan pemasok diproses siapa?",
      dari: "pelabuhan",
      ke: "keuangan",
      pengecoh: ["pabrik", "penjualan"],
      konsep: "Three-way match",
      benar: "Keuangan mencocokkan PO, bukti terima barang, dan tagihan secara otomatis sebelum membayar.",
      petunjuk: "Tagihan dibayar oleh Keuangan setelah dicocokkan dengan PO dan penerimaan barang.",
    },
    {
      id: "j5b",
      paket: "Bukti Terima Gipsum",
      kode: "GR-MM-302",
      deskripsi: "Kapal selesai bongkar 300 ton gipsum. Bahan baku ini disimpan & dicatat stoknya di…",
      dari: "pelabuhan",
      ke: "pabrik",
      pengecoh: ["keuangan", "proyek"],
      konsep: "Penerimaan bahan baku",
      benar: "Gipsum masuk silo bahan baku pabrik; bukti terimanya nanti dipakai Keuangan untuk three-way match.",
      petunjuk: "Bahan baku dipakai & disimpan di Pabrik, bukan di gudang barang jadi.",
    },
  ],
  [
    {
      id: "j6a",
      paket: "Surat Jalan",
      kode: "DO-221",
      deskripsi: "Semen Proyek Tol siap kirim dari gudang. Surat jalan dibawa ke mana?",
      dari: "gudang",
      ke: "proyek",
      pengecoh: ["perumahan", "pelabuhan"],
      konsep: "Pengiriman terlacak",
      benar: "Surat jalan mengikuti truk ke pelanggan yang memesan, statusnya bisa dilacak di ERP.",
      petunjuk: "Barang dikirim ke pelanggan yang memesan: Proyek Tol Gresik.",
    },
    {
      id: "j6b",
      paket: "Nota Retur Pemasok",
      kode: "RTV-014",
      deskripsi: "20 ton gipsum ternyata basah & tidak layak. Barang dikembalikan beserta nota retur ke…",
      dari: "gudang",
      ke: "pelabuhan",
      pengecoh: ["keuangan", "proyek"],
      konsep: "Retur ke pemasok",
      benar: "Nota retur dikirim ke pemasok lewat modul Pengadaan; tagihannya otomatis dikurangi.",
      petunjuk: "Barang yang dikembalikan ke pemasok diurus oleh Pengadaan di pelabuhan.",
    },
  ],
  [
    {
      id: "j7a",
      paket: "Faktur Penjualan",
      kode: "FKT-9001",
      deskripsi: "Semen sudah diterima Perumahan Asri. Faktur terbit otomatis, kirim ke siapa?",
      dari: "keuangan",
      ke: "perumahan",
      pengecoh: ["penjualan", "proyek"],
      konsep: "Faktur otomatis",
      benar: "Faktur terbit otomatis dari data pengiriman, tanpa input ulang.",
      petunjuk: "Tagihan dikirim ke pelanggan yang menerima barang: Perumahan Asri.",
    },
    {
      id: "j7b",
      paket: "Pembayaran Pemasok",
      kode: "PAY-SUP-58",
      deskripsi: "Three-way match beres, Keuangan mentransfer pembayaran gipsum. Bukti transfer dikirim ke…",
      dari: "keuangan",
      ke: "pelabuhan",
      pengecoh: ["pabrik", "penjualan"],
      konsep: "Utang usaha",
      benar: "Pemasok menerima bukti bayar; utang usaha di ERP otomatis tertutup.",
      petunjuk: "Pemasok gipsum dihubungi lewat Pengadaan di pelabuhan.",
    },
  ],
  [
    {
      id: "j8a",
      paket: "Bukti Pembayaran",
      kode: "PAY-TOL-80T",
      deskripsi: "Proyek Tol sudah membayar. Siapa yang mencatat pembayarannya?",
      dari: "proyek",
      ke: "keuangan",
      pengecoh: ["gudang", "pabrik"],
      konsep: "Rekonsiliasi kas",
      benar: "Pembayaran tercatat di Keuangan dan laporan laba-rugi langsung terbarui.",
      petunjuk: "Pembayaran pelanggan dicatat oleh Keuangan untuk menutup piutang.",
    },
    {
      id: "j8b",
      paket: "Pesanan Ulang",
      kode: "RO-TOL-02",
      deskripsi: "Proyek Tol puas & ingin pesanan yang sama tiap bulan selama setahun. Kontrak berulang ini diurus…",
      dari: "proyek",
      ke: "penjualan",
      pengecoh: ["keuangan", "gudang"],
      konsep: "Kontrak penjualan",
      benar: "Penjualan membuat kontrak berulang; ERP otomatis menerbitkan SO tiap bulan.",
      petunjuk: "Kontrak & pesanan pelanggan dikelola tim Penjualan.",
    },
  ],
];
