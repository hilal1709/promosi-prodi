import type {
  AccessPolicy,
  AccessRequest,
  AuditFinding,
  AuditLogEntry,
  ChartQuestion,
  DataDetectiveTable,
  DataInsightContent,
  ErpEvent,
  ErpModule,
  ErpOrder,
  ErpScenarioContent,
  InsightQuestion,
  MissionBrief,
  MissionId,
} from "@/lib/types";
import { WORKSPACE_SCENARIOS } from "@/lib/data/workspace";

export const MISSION_BRIEFS: Record<MissionId, MissionBrief> = {
  "it-audit": {
    kicker: "MISI 01 · PUSAT KEAMANAN",
    judul: "Penjaga Gerbang Data",
    npc: {
      nama: "Bu Rina",
      peran: "Kepala Audit TI",
      dialog: [
        "Selamat datang di Pusat Keamanan! Hari ini sistem data pelanggan kita dibanjiri permintaan akses.",
        "Tugasmu: jadi penjaga gerbang. Izinkan yang memang butuh, tolak yang mencurigakan. Setelah itu, kita telusuri log audit untuk mencari jejak aneh.",
        "Terakhir, susun laporan audit. Auditor TI bukan cuma mencari kesalahan, kita memastikan data semua orang tetap aman. Siap?",
      ],
    },
    level: [
      { judul: "Gerbang Akses", misi: "Izinkan atau tolak 8 permintaan akses sesuai kebijakan." },
      { judul: "Investigasi Log", misi: "Temukan 4 aktivitas mencurigakan di log audit." },
      { judul: "Laporan Audit", misi: "Nilai risiko tiap temuan dan pilih rekomendasinya." },
    ],
    pelajaran: [
      "Least privilege: setiap orang hanya diberi akses yang benar-benar dibutuhkan untuk tugasnya.",
      "Log audit adalah 'CCTV' sistem informasi, jejaknya membantu menemukan penyalahgunaan.",
      "Auditor menilai tingkat risiko lalu memberi rekomendasi kontrol yang realistis.",
    ],
  },
  "enterprise-system": {
    kicker: "MISI 02 · PUSAT OPERASI",
    judul: "Operasi Pabrik Semen",
    npc: {
      nama: "Pak Dimas",
      peran: "Manajer Operasi",
      dialog: [
        "Halo! Pabrik semen kita punya banyak divisi: penjualan, gudang, produksi, logistik, keuangan. Dulu tiap divisi punya catatan sendiri-sendiri, kacau!",
        "Sekarang kita pakai ERP: satu sistem terintegrasi. Pertama, bantu aku merakit alur pesanan dari pelanggan sampai pembayaran.",
        "Lalu kamu pegang kendali saat hari sibuk: kirim pesanan, atur produksi, dan tangani masalah yang muncul. Ayo mulai!",
      ],
    },
    level: [
      { judul: "Rakit Alur Bisnis", misi: "Susun 6 modul ERP sesuai alur pesanan (order-to-cash)." },
      { judul: "Hari Sibuk", misi: "Penuhi pesanan, jaga stok, dan tangani 3 kejadian mendadak." },
      { judul: "Rapat Direksi", misi: "Pilih cara menyajikan laporan konsolidasi untuk direksi." },
    ],
    pelajaran: [
      "ERP menyatukan data semua divisi dalam satu basis data, jadi informasi dicatat sekali dan dipakai bersama.",
      "Data stok yang akurat dan real-time mencegah kehabisan barang maupun pemborosan.",
      "Laporan terkonsolidasi otomatis membantu manajemen mengambil keputusan lebih cepat.",
    ],
  },
  "data-science": {
    kicker: "MISI 03 · LABORATORIUM INSIGHT",
    judul: "Detektif Data",
    npc: {
      nama: "Kak Salsa",
      peran: "Data Analyst",
      dialog: [
        "Hai, detektif! Tim sales mengirim data penjualan semen bulan lalu… tapi datanya berantakan.",
        "Data kotor menghasilkan keputusan yang salah. Jadi pertama, temukan sel yang bermasalah dan tebak jenis masalahnya.",
        "Setelah bersih, pilih grafik yang tepat lalu tarik kesimpulan untuk tim sales. Kacamata detektifmu sudah siap?",
      ],
    },
    level: [
      { judul: "Bersihkan Data", misi: "Cari 7 masalah di tabel dan tentukan jenisnya." },
      { judul: "Pilih Visualisasi", misi: "Cocokkan 3 pertanyaan bisnis dengan grafik yang tepat." },
      { judul: "Ambil Insight", misi: "Baca grafik dan beri rekomendasi ke tim sales." },
    ],
    pelajaran: [
      "Data cleaning (merapikan format, nilai tidak valid, duplikat, data kosong) adalah langkah pertama analisis.",
      "Grafik batang untuk membandingkan, garis untuk tren waktu, lingkaran untuk komposisi.",
      "Insight yang baik berujung pada tindakan nyata, bukan sekadar angka.",
    ],
  },
};

/** --- IT Audit --- */

export const ACCESS_POLICIES: AccessPolicy[] = [
  { peran: "Customer Service", hakAkses: "Kontak pelanggan" },
  { peran: "Staf HR", hakAkses: "Data karyawan & gaji" },
  { peran: "Staf Gudang", hakAkses: "Stok & pengiriman" },
  { peran: "Developer", hakAkses: "Server development saja" },
  { peran: "Admin Database", hakAkses: "Server produksi + tiket disetujui" },
  { peran: "Magang", hakAkses: "Data contoh (dummy)" },
];

export const ACCESS_RULE_NOTE = "Jam kerja 08.00–17.00. Di luar itu wajib ada persetujuan atasan.";

export const ACCESS_REQUESTS: AccessRequest[] = [
  {
    id: "a1",
    nama: "Rani",
    peran: "Customer Service",
    data: "Kontak pelanggan",
    jam: "09.15",
    alasan: "Menelepon balik pelanggan yang komplain.",
    izinkan: true,
    konsep: "Need-to-know",
    penjelasan: "Sesuai peran dan jam kerja, Rani memang butuh data ini untuk tugasnya.",
  },
  {
    id: "a2",
    nama: "Bayu",
    peran: "Staf Gudang",
    data: "Data gaji karyawan",
    jam: "10.30",
    alasan: "Penasaran gaji teman satu tim.",
    izinkan: false,
    konsep: "Least privilege",
    penjelasan: "Staf gudang tidak butuh data gaji. Rasa penasaran bukan alasan bisnis.",
  },
  {
    id: "a3",
    nama: "Dewi",
    peran: "Staf HR",
    data: "Data karyawan & gaji",
    jam: "13.00",
    alasan: "Memproses penggajian bulan ini.",
    izinkan: true,
    konsep: "Role-based access",
    penjelasan: "Penggajian adalah tugas HR, jadi aksesnya sesuai peran.",
  },
  {
    id: "a4",
    nama: "Andre",
    peran: "Developer",
    data: "Server produksi",
    jam: "14.20",
    alasan: "Mau tes fitur baru langsung di produksi biar cepat.",
    izinkan: false,
    konsep: "Segregation of duties",
    penjelasan: "Developer menguji di server development. Tes langsung di produksi bisa merusak data asli.",
  },
  {
    id: "a5",
    nama: "Sinta",
    peran: "Customer Service",
    data: "Kontak pelanggan",
    jam: "02.10",
    alasan: "Lembur, tapi belum minta izin atasan.",
    izinkan: false,
    konsep: "Kontrol waktu akses",
    penjelasan: "Akses di luar jam kerja tanpa persetujuan adalah tanda bahaya yang umum.",
  },
  {
    id: "a6",
    nama: "Fajar",
    peran: "Admin Database",
    data: "Server produksi",
    jam: "11.00",
    alasan: "Tiket perubahan #CR-204 sudah disetujui.",
    izinkan: true,
    konsep: "Change management",
    penjelasan: "Ada tiket perubahan yang disetujui, prosesnya tercatat dan bisa diaudit.",
  },
  {
    id: "a7",
    nama: "Lala",
    peran: "Magang",
    data: "Ekspor SEMUA data pelanggan",
    jam: "15.45",
    alasan: "Disuruh bikin slide presentasi.",
    izinkan: false,
    konsep: "Minimisasi data",
    penjelasan: "Presentasi cukup pakai data contoh. Ekspor data asli massal berisiko bocor.",
  },
  {
    id: "a8",
    nama: "Hendra",
    peran: "Staf Gudang",
    data: "Stok & pengiriman",
    jam: "08.40",
    alasan: "Cek stok semen sebelum truk berangkat.",
    izinkan: true,
    konsep: "Need-to-know",
    penjelasan: "Data stok memang bagian dari pekerjaan staf gudang.",
  },
];

export const AUDIT_LOGS: AuditLogEntry[] = ([
  { id: "l1", waktu: "08.01", pengguna: "hendra.gdg", aksi: "Login", detail: "Berhasil · PC gudang", mencurigakan: false },
  { id: "l2", waktu: "08.05", pengguna: "rani.cs", aksi: "Buka data", detail: "1 profil pelanggan", mencurigakan: false },
  {
    id: "l3", waktu: "08.11", pengguna: "budi.fin", aksi: "Login gagal", detail: "7× berturut-turut · IP luar negeri", mencurigakan: true,
    temuan: "Percobaan tebak password", konsep: "Brute force",
  },
  { id: "l4", waktu: "09.30", pengguna: "dewi.hr", aksi: "Ubah data", detail: "Rekening gaji 1 karyawan", mencurigakan: false },
  { id: "l5", waktu: "10.02", pengguna: "fajar.dba", aksi: "Deploy", detail: "Tiket #CR-204 · disetujui", mencurigakan: false },
  {
    id: "l6", waktu: "02.14", pengguna: "sinta.cs", aksi: "Buka data", detail: "300 profil pelanggan", mencurigakan: true,
    temuan: "Akses massal di luar jam kerja", konsep: "Anomali waktu",
  },
  { id: "l7", waktu: "11.40", pengguna: "andre.dev", aksi: "Login", detail: "Server development", mencurigakan: false },
  { id: "l8", waktu: "13.15", pengguna: "rani.cs", aksi: "Ubah data", detail: "Alamat 1 pelanggan", mencurigakan: false },
  {
    id: "l9", waktu: "16.50", pengguna: "lala.intern", aksi: "Ekspor", detail: "12.000 data pelanggan → USB", mencurigakan: true,
    temuan: "Ekspor data massal ke perangkat luar", konsep: "Kebocoran data",
  },
  { id: "l10", waktu: "14.05", pengguna: "hendra.gdg", aksi: "Ubah data", detail: "Stok keluar 40 ton", mencurigakan: false },
  {
    id: "l11", waktu: "10.05", pengguna: "rudi.hr (resign Juli)", aksi: "Login", detail: "Berhasil · dari rumah", mencurigakan: true,
    temuan: "Akun karyawan resign masih aktif", konsep: "Offboarding",
  },
  { id: "l12", waktu: "15.20", pengguna: "dewi.hr", aksi: "Cetak", detail: "Slip gaji divisi HR", mencurigakan: false },
] as AuditLogEntry[]).sort((a, b) => a.waktu.localeCompare(b.waktu));

export const AUDIT_FINDINGS: AuditFinding[] = [
  {
    id: "l3",
    judul: "Login gagal 7× dari IP luar negeri",
    risikoBenar: ["Sedang", "Tinggi"],
    rekomendasi: ["Abaikan, toh loginnya gagal", "Kunci akun setelah 5× gagal & aktifkan MFA", "Matikan server login selamanya"],
    rekomendasiBenar: 1,
    penjelasan: "Belum berhasil, tapi ancamannya nyata. MFA dan penguncian akun menutup celah ini.",
  },
  {
    id: "l6",
    judul: "Akses 300 data pelanggan jam 02.14",
    risikoBenar: ["Sedang", "Tinggi"],
    rekomendasi: ["Konfirmasi ke atasan & batasi akses di luar jam kerja", "Pecat staf tersebut hari ini juga", "Tidak perlu tindakan"],
    rekomendasiBenar: 0,
    penjelasan: "Auditor mengonfirmasi dulu fakta di lapangan, lalu memperkuat kontrolnya.",
  },
  {
    id: "l9",
    judul: "Ekspor 12.000 data pelanggan ke USB",
    risikoBenar: ["Tinggi"],
    rekomendasi: ["Beri teguran lisan saja", "Blokir port USB & investigasi potensi kebocoran", "Hapus semua data pelanggan"],
    rekomendasiBenar: 1,
    penjelasan: "Data pribadi dalam jumlah besar keluar dari sistem, risiko tertinggi dan melanggar perlindungan data.",
  },
  {
    id: "l11",
    judul: "Akun karyawan resign masih bisa login",
    risikoBenar: ["Tinggi"],
    rekomendasi: ["Nonaktifkan akun & otomatiskan offboarding dari sistem HR", "Ganti password akunnya", "Biarkan, mungkin dia mau ambil barang"],
    rekomendasiBenar: 0,
    penjelasan: "Akun yatim adalah pintu belakang. Integrasi HR → IT memastikan akses dicabut saat karyawan keluar.",
  },
  {
    id: "doc",
    judul: "Dokumen kebijakan password terakhir diperbarui 2 tahun lalu",
    risikoBenar: ["Rendah"],
    rekomendasi: ["Jadwalkan pembaruan dokumen kebijakan", "Hentikan operasional sampai dokumen diperbarui", "Tidak perlu dicatat"],
    rekomendasiBenar: 0,
    penjelasan: "Penting tapi tidak mendesak, cukup dijadwalkan agar dokumentasi tetap relevan.",
  },
];

/** --- Enterprise System --- */

export const ERP_MODULES: ErpModule[] = [
  { id: "m1", label: "Pesanan Pelanggan", divisi: "CRM", aliranData: "Pelanggan memesan 50 ton semen lewat portal." },
  { id: "m2", label: "Sales Order", divisi: "Penjualan", aliranData: "Pesanan dicatat sekali, langsung terlihat gudang & keuangan." },
  { id: "m3", label: "Cek Stok", divisi: "Gudang", aliranData: "Sistem mengecek stok real-time dan memesan barang." },
  { id: "m4", label: "Produksi", divisi: "Manufaktur", aliranData: "Jika stok kurang, jadwal produksi dibuat otomatis." },
  { id: "m5", label: "Pengiriman", divisi: "Logistik", aliranData: "Surat jalan dibuat, truk dijadwalkan, status bisa dilacak." },
  { id: "m6", label: "Faktur & Pembayaran", divisi: "Keuangan", aliranData: "Faktur terbit otomatis, pembayaran tercatat di laporan." },
];

/** Urutan tampilan modul di "rak" (sengaja diacak). */
export const ERP_MODULE_POOL = ["m5", "m2", "m6", "m1", "m4", "m3"];

export const ERP_MODULE_HINTS: Record<string, string> = {
  m1: "Alur selalu dimulai dari permintaan pelanggan.",
  m2: "Pesanan harus dicatat di sistem dulu sebelum diproses divisi lain.",
  m3: "Sebelum produksi, cek dulu apakah stok gudang masih cukup.",
  m4: "Produksi dijalankan hanya jika stok gudang kurang.",
  m5: "Barang baru bisa dikirim setelah tersedia.",
  m6: "Tagihan dibuat setelah barang terkirim ke pelanggan.",
};

export const ERP_SIM = {
  durasi: 100,
  stokAwal: 120,
  produksi: { tambah: 80, durasi: 6 },
  kesabaran: 24,
};

export const ERP_ORDERS: ErpOrder[] = [
  { id: "p1", pelanggan: "PT Beton Jaya", jumlah: 40, muncul: 1 },
  { id: "p2", pelanggan: "Proyek Tol Gresik", jumlah: 60, muncul: 6 },
  { id: "p3", pelanggan: "Toko Makmur", jumlah: 20, muncul: 14 },
  { id: "p4", pelanggan: "Perumahan Asri", jumlah: 50, muncul: 30 },
  { id: "p5", pelanggan: "PT Karya Bangun", jumlah: 70, muncul: 40 },
  { id: "p6", pelanggan: "Toko Sentosa", jumlah: 30, muncul: 55 },
  { id: "p7", pelanggan: "Proyek Jembatan", jumlah: 80, muncul: 64 },
  { id: "p8", pelanggan: "Toko Berkah", jumlah: 25, muncul: 76 },
];

export const ERP_EVENTS: ErpEvent[] = [
  {
    id: "e1",
    muncul: 20,
    judul: "Selisih data stok!",
    deskripsi: "Sistem mencatat stok lebih banyak dari hitungan fisik di gudang. Apa yang kamu lakukan?",
    konsep: "Stock opname",
    opsi: [
      { label: "Jalankan stock opname & koreksi data di sistem", benar: true, hasil: "Ketemu salah input barang keluar. Data stok sekarang akurat.", stok: -10 },
      { label: "Abaikan, selisihnya kecil", benar: false, hasil: "Selisih dibiarkan… nanti stok fisik ternyata jauh lebih sedikit.", stokSusulan: -40 },
      { label: "Pesan bahan baku besar-besaran", benar: false, hasil: "Gudang penuh dan biaya membengkak, akar masalah tetap tidak ketemu.", kepuasan: -5 },
    ],
  },
  {
    id: "e2",
    muncul: 48,
    judul: "Pesanan ganda terdeteksi",
    deskripsi: "Pesanan PT Karya Bangun masuk dua kali, dari admin cabang Gresik dan Tuban.",
    konsep: "Data terpusat",
    opsi: [
      { label: "Kirim dua-duanya biar aman", benar: false, hasil: "70 ton semen terkirim sia-sia dan harus ditarik kembali.", stok: -70 },
      { label: "Cek nomor pesanan di data terpusat & gabungkan", benar: true, hasil: "Karena semua cabang memakai satu basis data, duplikat langsung ketahuan." },
      { label: "Tolak dua-duanya", benar: false, hasil: "Pelanggan kecewa karena pesanannya hilang.", kepuasan: -15 },
    ],
  },
  {
    id: "e3",
    muncul: 72,
    judul: "Truk pengiriman terlambat",
    deskripsi: "Truk ke Proyek Jembatan tertahan macet 2 jam.",
    konsep: "Visibilitas rantai pasok",
    opsi: [
      { label: "Diam saja, nanti juga sampai", benar: false, hasil: "Pelanggan menelepon marah karena tidak ada kabar.", kepuasan: -15 },
      { label: "Kirim notifikasi otomatis & jadwal ulang dari sistem", benar: true, hasil: "Pelanggan mendapat estimasi baru dan tetap tenang." },
      { label: "Batalkan pengiriman", benar: false, hasil: "Proyek terhambat dan pelanggan kecewa berat.", kepuasan: -20 },
    ],
  },
];

export const ERP_BOARD = WORKSPACE_SCENARIOS.find((item) => item.id === "sc-erp-keuangan")
  ?.konten as ErpScenarioContent;
export const ERP_BOARD_SCORES: Record<string, number> = { o1: 50, o2: 100, o3: 20 };

/** --- Data Science --- */

export const DATA_ISSUE_LABELS: Record<string, string> = {
  format: "Format tidak konsisten",
  invalid: "Nilai tidak masuk akal",
  duplikat: "Baris duplikat",
  kosong: "Data kosong",
};

export const DATA_TABLE: DataDetectiveTable = {
  kolom: ["Toko", "Kota", "Unit Terjual", "Harga (Rp)"],
  baris: [
    { id: "r1", data: { Toko: "Toko Makmur", Kota: "Gresik", "Unit Terjual": 120, "Harga (Rp)": 65000 } },
    { id: "r2", data: { Toko: "toko sejahtera ", Kota: "Surabaya", "Unit Terjual": 95, "Harga (Rp)": 65000 } },
    { id: "r3", data: { Toko: "Toko Barokah", Kota: "Lamongan", "Unit Terjual": -5, "Harga (Rp)": 65000 } },
    { id: "r4", data: { Toko: "TOKO JAYA", Kota: "Gresik", "Unit Terjual": 210, "Harga (Rp)": "65rb" } },
    { id: "r5", data: { Toko: "Toko Amanah", Kota: "", "Unit Terjual": 150, "Harga (Rp)": 65000 } },
    { id: "r6", data: { Toko: "Toko Makmur", Kota: "Gresik", "Unit Terjual": 120, "Harga (Rp)": 65000 } },
    { id: "r7", data: { Toko: "Toko Sentosa", Kota: "Sidoarjo", "Unit Terjual": 88, "Harga (Rp)": 65000 } },
    { id: "r8", data: { Toko: "Toko Berkah", Kota: "Mojokerto", "Unit Terjual": 132, "Harga (Rp)": 650000 } },
  ],
  masalah: [
    { baris: "r2", kolom: "Toko", jenis: "format", perbaikan: "Toko Sejahtera", penjelasan: "Huruf kecil & spasi berlebih membuat 'toko sejahtera ' dianggap toko berbeda." },
    { baris: "r3", kolom: "Unit Terjual", jenis: "invalid", perbaikan: 0, penjelasan: "Penjualan tidak mungkin negatif. Setelah dicek, toko ini tidak menjual apa pun." },
    { baris: "r4", kolom: "Toko", jenis: "format", perbaikan: "Toko Jaya", penjelasan: "Penulisan huruf kapital semua tidak seragam dengan data lain." },
    { baris: "r4", kolom: "Harga (Rp)", jenis: "format", perbaikan: 65000, penjelasan: "'65rb' adalah teks, bukan angka, tidak bisa dijumlahkan." },
    { baris: "r5", kolom: "Kota", jenis: "kosong", perbaikan: "Tuban", penjelasan: "Kota kosong dilengkapi dari data master toko." },
    { baris: "r6", kolom: "*", jenis: "duplikat", asli: "r1", penjelasan: "Baris ini sama persis dengan Toko Makmur di atas, kalau tidak dihapus, penjualannya terhitung dua kali." },
    { baris: "r8", kolom: "Harga (Rp)", jenis: "invalid", perbaikan: 65000, penjelasan: "Harga 10× lipat dari toko lain, kemungkinan salah ketik satu angka nol." },
  ],
};

export const CHART_QUESTIONS: ChartQuestion[] = [
  {
    id: "c1",
    pertanyaan: "Toko mana yang penjualannya paling tinggi dan paling rendah bulan lalu?",
    jawaban: "bar",
    penjelasan: "Grafik batang paling mudah untuk membandingkan nilai antar kategori.",
    data: [
      { label: "Makmur", nilai: 120 },
      { label: "Sejahtera", nilai: 95 },
      { label: "Barokah", nilai: 0 },
      { label: "Jaya", nilai: 210 },
      { label: "Amanah", nilai: 150 },
      { label: "Sentosa", nilai: 88 },
      { label: "Berkah", nilai: 132 },
    ],
  },
  {
    id: "c2",
    pertanyaan: "Bagaimana tren total penjualan dari Januari sampai Juni?",
    jawaban: "line",
    penjelasan: "Grafik garis menunjukkan naik-turun nilai dari waktu ke waktu.",
    data: [
      { label: "Jan", nilai: 610 },
      { label: "Feb", nilai: 640 },
      { label: "Mar", nilai: 700 },
      { label: "Apr", nilai: 690 },
      { label: "Mei", nilai: 760 },
      { label: "Jun", nilai: 795 },
    ],
  },
  {
    id: "c3",
    pertanyaan: "Berapa porsi tiap jenis produk dari total penjualan?",
    jawaban: "pie",
    penjelasan: "Grafik lingkaran cocok untuk menunjukkan bagian dari keseluruhan (komposisi).",
    data: [
      { label: "Semen PCC", nilai: 55 },
      { label: "Semen OPC", nilai: 30 },
      { label: "Mortar", nilai: 15 },
    ],
  },
];

const insightContent = WORKSPACE_SCENARIOS.find((item) => item.id === "sc-data-kesimpulan")
  ?.konten as DataInsightContent;

export const INSIGHT_QUESTIONS: InsightQuestion[] = [
  {
    id: "q1",
    pertanyaan: insightContent.pertanyaan,
    grafik: "bar",
    data: CHART_QUESTIONS[0].data,
    opsi: insightContent.opsi,
  },
  {
    id: "q2",
    pertanyaan: "Jika tren ini berlanjut, langkah apa yang paling tepat untuk stok bulan Juli?",
    grafik: "line",
    data: CHART_QUESTIONS[1].data,
    opsi: [
      {
        id: "o1",
        label: "Kurangi stok karena April sempat turun",
        benar: false,
        penjelasan: "Penurunan kecil di satu bulan belum tentu tren. Secara keseluruhan grafiknya naik.",
      },
      {
        id: "o2",
        label: "Tambah stok bertahap sekitar 5% mengikuti tren naik",
        benar: true,
        penjelasan: "Tepat! Rata-rata penjualan naik ±5% per bulan, jadi stok disiapkan sedikit lebih banyak.",
      },
      {
        id: "o3",
        label: "Samakan stok dengan bulan Januari",
        benar: false,
        penjelasan: "Penjualan Juni sudah jauh di atas Januari, stok akan kurang.",
      },
    ],
  },
];
