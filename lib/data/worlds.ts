import type { DataIssueType, MissionBrief, MissionId } from "@/lib/types";
import { DATA_TABLE, ERP_BOARD, MISSION_BRIEFS } from "@/lib/data/missions";

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
      misi: "Jelajahi kantor, pindai, tandai 6 pelanggaran, lalu amankan temuanmu. Ambil baterai, kopi, dan dokumen log — dan jangan masuk sorotan drone patroli!",
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
      judul: "Konfrontasi",
      misi: "Bantah pernyataan tersangka dengan bukti yang tepat, lalu tentukan tingkat risikonya.",
      kontrol: "Klik kartu bukti",
      kontrolSentuh: "Ketuk kartu bukti",
    },
  ],
  "enterprise-system": [
    {
      judul: "Rute Order-to-Cash",
      misi: "Setir truk melewati gerbang modul ERP sesuai urutan alur pesanan, lalu kembali ke garis finis.",
      kontrol: "W gas · S rem · A/D belok",
      kontrolSentuh: "Joystick: dorong ke atas untuk gas, kiri/kanan untuk belok",
    },
    {
      judul: "Jam Sibuk",
      misi: "Antar semen ke pelanggan sebelum mereka menunggu terlalu lama. Isi muatan di pabrik dan pilih jalur yang tepat saat ada kejadian.",
      kontrol: "W gas · S rem · A/D belok",
      kontrolSentuh: "Joystick untuk menyetir",
    },
    {
      judul: "Balapan vs Sistem Manual",
      misi: "Kalahkan truk 'Sistem Manual' dalam 2 putaran. Ambil boost ERP, hindari tumpukan kertas, dan jawab gerbang rapat direksi.",
      kontrol: "W gas · S rem · A/D belok",
      kontrolSentuh: "Joystick untuk menyetir",
    },
  ],
  "data-science": [
    {
      judul: "Ban Berjalan Data",
      misi: "Arahkan tiap kubus data ke keranjang yang sesuai jenis masalahnya. Data bersih masuk keranjang hijau.",
      kontrol: "A/D geser kubus · Spasi jatuhkan cepat",
      kontrolSentuh: "Tombol ‹ › geser · Jatuhkan",
    },
    {
      judul: "Bangun Grafik",
      misi: "Atur tinggi 7 batang sesuai data bersih, kunci grafiknya, lalu pilih bentuk grafik untuk 2 pertanyaan.",
      kontrol: "A/D pilih batang · W/S naik-turun · Spasi kunci",
      kontrolSentuh: "Tombol ‹ › ▲ ▼ · Kunci",
    },
    {
      judul: "Kota Data",
      misi: "Grafikmu jadi kota! Jelajahi, kumpulkan 3 petunjuk, lalu ambil kesimpulan di papan tengah kota.",
      kontrol: "WASD jalan · E periksa papan",
      kontrolSentuh: "Joystick jalan · tombol Periksa",
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
        "Periksa kantor: cari kontrol yang bolong. Setelah itu jaga firewall server database — blokir lalu lintas data yang mencurigakan.",
        "Terakhir, konfrontasi dengan bukti. Auditor TI bekerja dengan fakta, bukan tebakan. Siap bertugas?",
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
        "Nanti kita juga balapan melawan truk 'Sistem Manual' yang masih pakai kertas. Tunjukkan kalau sistem terintegrasi lebih unggul!",
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
        "Pertama, sortir kubus data di ban berjalan. Lalu bangun grafik dari data bersih.",
        "Grafikmu akan berubah jadi kota. Jelajahi dan temukan kenapa ada toko yang penjualannya nol!",
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
  kolom: string;
  nilai: string;
  jenis: BinId;
  penjelasan: string;
}

function cellCube(row: string, column: string): DataCube {
  const issue = DATA_TABLE.masalah.find((item) => item.baris === row && (item.kolom === column || item.kolom === "*"));
  const value = DATA_TABLE.baris.find((item) => item.id === row)!.data[column];
  return {
    id: `${row}:${column}`,
    kolom: column,
    nilai: value === "" ? "(kosong)" : String(value),
    jenis: issue?.jenis ?? "bersih",
    penjelasan: issue?.penjelasan ?? "Nilai ini wajar dan formatnya konsisten — biarkan masuk gudang data.",
  };
}

export const DATA_CUBES: DataCube[] = [
  cellCube("r1", "Toko"),
  cellCube("r2", "Toko"),
  cellCube("r3", "Unit Terjual"),
  cellCube("r7", "Kota"),
  cellCube("r4", "Harga (Rp)"),
  cellCube("r5", "Kota"),
  cellCube("r1", "Unit Terjual"),
  {
    id: "r6:*",
    kolom: "Baris 6",
    nilai: "Toko Makmur · Gresik · 120 (sama dengan baris 1)",
    jenis: "duplikat",
    penjelasan: DATA_TABLE.masalah.find((item) => item.jenis === "duplikat")!.penjelasan,
  },
  cellCube("r8", "Harga (Rp)"),
  cellCube("r4", "Toko"),
  cellCube("r7", "Unit Terjual"),
  cellCube("r2", "Kota"),
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
  { id: "v6", nama: "Pembaca kartu akses", kind: "card", x: 11.8, z: 4.5, pelanggaran: true, detail: "Kartu akses atas nama Rudi (resign Juli) masih bisa membuka pintu.", konsep: "Offboarding", aksi: "Nonaktifkan kartu Rudi" },
  { id: "d1", nama: "Printer bersama", kind: "printer", x: -5, z: 3.5, pelanggaran: false, detail: "Mencetak laporan terjadwal; antrean cetak tercatat di sistem.", konsep: "Kontrol berjalan baik" },
  { id: "d2", nama: "Rak server backup", kind: "server", x: 10, z: -4, pelanggaran: false, detail: "Backup harian sukses dan log-nya lengkap.", konsep: "Kontrol berjalan baik" },
  { id: "d3", nama: "PC resepsionis", kind: "monitor", x: 4, z: -4, pelanggaran: false, detail: "Layar terkunci otomatis setelah 5 menit tidak dipakai.", konsep: "Kontrol berjalan baik" },
  { id: "d4", nama: "Buku tamu", kind: "book", x: -9.5, z: -0.5, pelanggaran: false, detail: "Setiap tamu mencatat nama & jam, dan didampingi staf.", konsep: "Kontrol berjalan baik" },
];

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

/** Lalu lintas data menuju server database (level Firewall Defender). */
export const FIREWALL_PACKETS: FirewallPacket[] = [
  { id: "f1", pengguna: "budi.fin", aksi: "Login gagal 7× dari IP luar negeri", jam: "08.11", bahaya: true, konsep: "Brute force", alasan: "Ada yang mencoba menebak password berulang kali." },
  { id: "f2", pengguna: "sinta.cs", aksi: "Buka 300 profil pelanggan", jam: "02.14", bahaya: true, konsep: "Anomali waktu", alasan: "Akses massal tengah malam tanpa izin atasan." },
  { id: "f3", pengguna: "lala.intern", aksi: "Ekspor 12.000 data pelanggan → USB", jam: "16.50", bahaya: true, konsep: "Kebocoran data", alasan: "Data pribadi dalam jumlah besar keluar ke perangkat luar." },
  { id: "f4", pengguna: "rudi.hr (resign)", aksi: "Login berhasil dari rumah", jam: "10.05", bahaya: true, konsep: "Offboarding", alasan: "Akun karyawan yang sudah keluar harusnya sudah dinonaktifkan." },
  { id: "f5", pengguna: "andre.dev", aksi: "Deploy ke server produksi tanpa tiket", jam: "14.20", bahaya: true, konsep: "Segregation of duties", alasan: "Developer menguji di server development, bukan langsung di produksi." },
  { id: "f6", pengguna: "bayu.gdg", aksi: "Buka data gaji karyawan", jam: "10.30", bahaya: true, konsep: "Least privilege", alasan: "Staf gudang tidak butuh data gaji untuk pekerjaannya." },
  { id: "f7", pengguna: "admin.tmp", aksi: "Hapus log audit bulan Juli", jam: "23.40", bahaya: true, konsep: "Audit trail", alasan: "Menghapus log sama dengan menghapus jejak — tanda bahaya besar." },
  { id: "f8", pengguna: "sinta.cs", aksi: "Upload file pelanggan ke drive pribadi", jam: "19.05", bahaya: true, konsep: "Kebocoran data", alasan: "Data perusahaan tidak boleh disimpan di akun pribadi." },
  { id: "f9", pengguna: "perangkat tamu", aksi: "Scan port server database", jam: "03.02", bahaya: true, konsep: "Serangan jaringan", alasan: "Perangkat tamu tidak punya urusan dengan server database." },
  { id: "f10", pengguna: "dewi.hr", aksi: "Login dari 2 negara dalam 5 menit", jam: "09.00", bahaya: true, konsep: "Akun dibajak", alasan: "Mustahil pindah negara dalam 5 menit — password kemungkinan dicuri." },
  { id: "f11", pengguna: "hendra.gdg", aksi: "Ubah harga semen di modul keuangan", jam: "11.20", bahaya: true, konsep: "Least privilege", alasan: "Staf gudang tidak berwenang mengubah data keuangan." },
  { id: "n1", pengguna: "rani.cs", aksi: "Buka 1 profil pelanggan yang komplain", jam: "09.15", bahaya: false, konsep: "Need-to-know", alasan: "Sesuai peran CS dan jam kerja." },
  { id: "n2", pengguna: "hendra.gdg", aksi: "Cek stok semen sebelum truk berangkat", jam: "08.40", bahaya: false, konsep: "Need-to-know", alasan: "Data stok memang bagian dari tugas gudang." },
  { id: "n3", pengguna: "dewi.hr", aksi: "Proses penggajian bulan ini", jam: "13.00", bahaya: false, konsep: "Role-based access", alasan: "Penggajian adalah tugas HR." },
  { id: "n4", pengguna: "fajar.dba", aksi: "Deploy tiket #CR-204 (disetujui)", jam: "11.00", bahaya: false, konsep: "Change management", alasan: "Perubahan punya tiket yang disetujui dan tercatat." },
  { id: "n5", pengguna: "andre.dev", aksi: "Login ke server development", jam: "11.40", bahaya: false, konsep: "Segregation of duties", alasan: "Server development memang tempat kerja developer." },
  { id: "n6", pengguna: "rani.cs", aksi: "Ubah alamat 1 pelanggan", jam: "13.15", bahaya: false, konsep: "Need-to-know", alasan: "Perubahan kecil sesuai permintaan pelanggan." },
  { id: "n7", pengguna: "lala.intern", aksi: "Buka data contoh (dummy)", jam: "10.20", bahaya: false, konsep: "Minimisasi data", alasan: "Magang memang diberi akses data contoh." },
  { id: "n8", pengguna: "budi.fin", aksi: "Cetak laporan keuangan terjadwal", jam: "15.00", bahaya: false, konsep: "Role-based access", alasan: "Laporan rutin bagian keuangan." },
  { id: "n9", pengguna: "backup.sys", aksi: "Backup harian database", jam: "01.00", bahaya: false, konsep: "Proses terjadwal", alasan: "Proses otomatis terjadwal — aktivitas malam ini memang wajar." },
  { id: "n10", pengguna: "hendra.gdg", aksi: "Catat stok keluar 40 ton", jam: "14.05", bahaya: false, konsep: "Need-to-know", alasan: "Pencatatan stok adalah tugas gudang." },
  { id: "n11", pengguna: "dewi.hr", aksi: "Cetak slip gaji divisi HR", jam: "15.20", bahaya: false, konsep: "Role-based access", alasan: "Sesuai peran HR dan jam kerja." },
  { id: "n12", pengguna: "fajar.dba", aksi: "Ganti password admin (jadwal 90 hari)", jam: "08.30", bahaya: false, konsep: "Kebijakan password", alasan: "Mengganti password berkala justru kontrol yang baik." },
  { id: "n13", pengguna: "sinta.cs", aksi: "Lembur dengan izin atasan", jam: "20.00", bahaya: false, konsep: "Kontrol waktu akses", alasan: "Di luar jam kerja, tapi sudah ada persetujuan atasan." },
];

export interface Statement {
  teks: string;
  bukti: string;
  bantahan: string;
}

export const EVIDENCE: { id: string; judul: string; isi: string }[] = [
  { id: "l3", judul: "Log 08.11", isi: "budi.fin · login gagal 7× dari IP luar negeri" },
  { id: "l6", judul: "Log 02.14", isi: "sinta.cs · buka 300 profil pelanggan" },
  { id: "l9", judul: "Log 16.50", isi: "lala.intern · ekspor 12.000 data ke USB" },
  { id: "l11", judul: "Log 10.05", isi: "rudi.hr (resign) · login berhasil" },
  { id: "doc", judul: "Dokumen", isi: "Kebijakan password terakhir diperbarui 2 tahun lalu" },
];

export const STATEMENTS: Statement[] = [
  { teks: "Semua akses data pelanggan di kantor ini terjadi di jam kerja.", bukti: "l6", bantahan: "Log 02.14 menunjukkan 300 profil dibuka tengah malam!" },
  { teks: "Tidak pernah ada data pelanggan yang keluar dari kantor.", bukti: "l9", bantahan: "12.000 data diekspor ke USB pukul 16.50!" },
  { teks: "Karyawan yang sudah keluar otomatis tidak bisa login.", bukti: "l11", bantahan: "Akun rudi.hr yang resign masih berhasil login!" },
  { teks: "Sistem login kita aman, tidak ada yang mencoba menebak password.", bukti: "l3", bantahan: "Ada 7 kali login gagal dari IP luar negeri!" },
  { teks: "Semua dokumen kebijakan keamanan kami selalu terbaru.", bukti: "doc", bantahan: "Kebijakan password sudah 2 tahun tidak diperbarui!" },
];

/** --- Enterprise System --- */

/** Titik kendali lintasan (x, z); dibuat lingkaran tertutup dengan Catmull-Rom. */
export const TRACK_POINTS: [number, number][] = [
  [0, 0], [28, -14], [58, -6], [70, 22], [52, 50], [22, 58], [-10, 64], [-38, 50], [-50, 22], [-34, 2],
];

export const BOARD_GATES = ERP_BOARD.opsi.map((option) => ({
  id: option.id,
  label: option.id === "o1" ? "Laporan manual via email/Excel" : option.id === "o2" ? "Konsolidasi otomatis di ERP" : "Tunda sampai sinkron manual",
}));

export const RUSH_STOPS = [
  { id: "pabrik", nama: "Pabrik & Gudang", t: 0.03 },
  { id: "A", nama: "Proyek Tol", t: 0.3 },
  { id: "B", nama: "Perumahan", t: 0.55 },
  { id: "C", nama: "Toko Bangunan", t: 0.8 },
];

export const RACE_PADS: { t: number; offset: number; type: "boost" | "trap"; label: string }[] = [
  { t: 0.12, offset: -2.5, type: "boost", label: "Sinkron data otomatis" },
  { t: 0.22, offset: 2.5, type: "trap", label: "Input ulang manual" },
  { t: 0.35, offset: 2.5, type: "boost", label: "Stok real-time" },
  { t: 0.62, offset: -2.5, type: "trap", label: "Rekap Excel" },
  { t: 0.72, offset: 0, type: "boost", label: "Faktur otomatis" },
  { t: 0.86, offset: -2.5, type: "boost", label: "Dasbor terpadu" },
  { t: 0.93, offset: 2.5, type: "trap", label: "Tumpukan kertas" },
];
