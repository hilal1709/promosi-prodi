import type {
  AuditScenarioContent,
  DataChartContent,
  DataCleanContent,
  DataInsightContent,
  ErpScenarioContent,
  WorkspaceMenu,
  WorkspaceScenario,
} from "@/lib/types";

export const WORKSPACE_MENUS: WorkspaceMenu[] = [
  // Enterprise System
  {
    id: "erp-inventaris",
    jalur: "enterprise-system",
    namaMenu: "Modul Inventaris",
    deskripsi: "Kelola stok gudang perusahaan manufaktur semen.",
    iconSlug: "Warehouse",
    urutan: 1,
    tipeInteraksi: "erp-decision",
  },
  {
    id: "erp-keuangan",
    jalur: "enterprise-system",
    namaMenu: "Modul Keuangan",
    deskripsi: "Rekonsiliasi arus kas antar-cabang secara real-time.",
    iconSlug: "Wallet",
    urutan: 2,
    tipeInteraksi: "erp-decision",
  },
  {
    id: "erp-sdm",
    jalur: "enterprise-system",
    namaMenu: "Modul SDM",
    deskripsi: "Otomatisasi proses cuti & penggajian karyawan.",
    iconSlug: "Users",
    urutan: 3,
    tipeInteraksi: "erp-decision",
  },
  // IT/Audit & Governance
  {
    id: "audit-kepatuhan",
    jalur: "it-audit",
    namaMenu: "Cek Kepatuhan",
    deskripsi: "Nilai apakah proses akses data pelanggan sudah sesuai standar.",
    iconSlug: "ClipboardCheck",
    urutan: 1,
    tipeInteraksi: "audit-checklist",
  },
  {
    id: "audit-temuan-risiko",
    jalur: "it-audit",
    namaMenu: "Temuan Risiko",
    deskripsi: "Identifikasi celah keamanan sebelum sistem baru diluncurkan.",
    iconSlug: "AlertTriangle",
    urutan: 2,
    tipeInteraksi: "audit-checklist",
  },
  {
    id: "audit-laporan",
    jalur: "it-audit",
    namaMenu: "Laporan Audit",
    deskripsi: "Susun rekomendasi akhir dari hasil audit sistem HR.",
    iconSlug: "FileSearch",
    urutan: 3,
    tipeInteraksi: "audit-checklist",
  },
  // Data Science
  {
    id: "data-bersihkan",
    jalur: "data-science",
    namaMenu: "Bersihkan Data",
    deskripsi: "Rapikan data penjualan yang masih berantakan.",
    iconSlug: "Broom",
    urutan: 1,
    tipeInteraksi: "data-clean",
  },
  {
    id: "data-visualisasi",
    jalur: "data-science",
    namaMenu: "Buat Visualisasi",
    deskripsi: "Ubah data bersih jadi grafik yang mudah dibaca.",
    iconSlug: "BarChart3",
    urutan: 2,
    tipeInteraksi: "data-chart",
  },
  {
    id: "data-kesimpulan",
    jalur: "data-science",
    namaMenu: "Ambil Kesimpulan",
    deskripsi: "Tentukan rekomendasi bisnis dari grafik yang sudah dibuat.",
    iconSlug: "Lightbulb",
    urutan: 3,
    tipeInteraksi: "data-insight",
  },
];

export const WORKSPACE_SCENARIOS: WorkspaceScenario[] = [
  {
    id: "sc-erp-inventaris",
    menuId: "erp-inventaris",
    tipeInteraksi: "erp-decision",
    konten: {
      situasi:
        "Stok semen di gudang Cabang Gresik menipis, tapi permintaan dari 3 proyek besar sedang naik. Sistem ERP mendeteksi selisih antara stok fisik dan stok di sistem sebesar 4%.",
      opsi: [
        {
          id: "o1",
          label: "Langsung pesan stok tambahan besar-besaran ke pabrik",
          konsekuensi:
            "Stok aman sementara, tapi biaya gudang membengkak karena tidak tahu penyebab selisih datanya, masalah aslinya belum selesai.",
          dampak: { efisiensi: -10, biaya: -20, risiko: 10 },
        },
        {
          id: "o2",
          label:
            "Jalankan modul stock opname otomatis untuk cari akar selisih data dulu",
          konsekuensi:
            "Ditemukan kesalahan input saat barang keluar dari 2 minggu lalu. Setelah data dikoreksi, sistem bisa merekomendasikan jumlah pesan ulang yang akurat.",
          dampak: { efisiensi: 20, biaya: 10, risiko: -15 },
        },
        {
          id: "o3",
          label: "Abaikan selisihnya karena kelihatannya kecil (cuma 4%)",
          konsekuensi:
            "Dalam 2 bulan, selisih membesar jadi 15% dan menyebabkan proyek besar nyaris kehabisan semen di tengah jalan.",
          dampak: { efisiensi: -15, biaya: -15, risiko: 25 },
        },
      ],
    } as ErpScenarioContent,
  },
  {
    id: "sc-erp-keuangan",
    menuId: "erp-keuangan",
    tipeInteraksi: "erp-decision",
    konten: {
      situasi:
        "Laporan arus kas dari 5 cabang belum sinkron di akhir bulan. Tim finance pusat butuh laporan konsolidasi besok pagi untuk rapat direksi.",
      opsi: [
        {
          id: "o1",
          label: "Minta tiap cabang kirim laporan manual lewat email/Excel",
          konsekuensi:
            "Laporan terkumpul tapi formatnya beda-beda, tim finance harus lembur menyamakan format dan rawan salah input.",
          dampak: { efisiensi: -20, biaya: -5, risiko: 15 },
        },
        {
          id: "o2",
          label: "Jalankan modul konsolidasi otomatis di ERP untuk semua cabang",
          konsekuensi:
            "Dalam hitungan menit, laporan konsolidasi tersaji dengan format seragam dan bisa ditelusuri sampai transaksi asalnya.",
          dampak: { efisiensi: 25, biaya: 15, risiko: -10 },
        },
        {
          id: "o3",
          label: "Tunda laporan sampai semua cabang benar-benar sinkron manual",
          konsekuensi:
            "Rapat direksi jalan tanpa data lengkap, keputusan strategis jadi kurang akurat.",
          dampak: { efisiensi: -25, biaya: 0, risiko: 20 },
        },
      ],
    } as ErpScenarioContent,
  },
  {
    id: "sc-erp-sdm",
    menuId: "erp-sdm",
    tipeInteraksi: "erp-decision",
    konten: {
      situasi:
        "Musim akhir tahun, pengajuan cuti karyawan melonjak dan tim HR kewalahan mengecek sisa cuti tiap orang secara manual.",
      opsi: [
        {
          id: "o1",
          label: "Tetap proses manual, HR kerja lembur untuk mengejar antrian",
          konsekuensi:
            "Beberapa pengajuan cuti disetujui melebihi sisa kuota karena human error, HR jadi kelelahan.",
          dampak: { efisiensi: -15, biaya: -10, risiko: 15 },
        },
        {
          id: "o2",
          label: "Aktifkan modul self-service cuti otomatis di ERP",
          konsekuensi:
            "Karyawan bisa cek sisa cuti & ajukan sendiri, sistem otomatis validasi kuota. HR tinggal approve, waktu proses turun drastis.",
          dampak: { efisiensi: 25, biaya: 10, risiko: -10 },
        },
        {
          id: "o3",
          label: "Bekukan pengajuan cuti sementara sampai musim sibuk lewat",
          konsekuensi:
            "Karyawan kecewa, kepuasan kerja turun, beberapa memilih ambil cuti mendadak tanpa izin.",
          dampak: { efisiensi: -10, biaya: 0, risiko: 10 },
        },
      ],
    } as ErpScenarioContent,
  },
  {
    id: "sc-audit-kepatuhan",
    menuId: "audit-kepatuhan",
    tipeInteraksi: "audit-checklist",
    konten: {
      konteks:
        "Kamu ditugaskan mengaudit proses akses data pelanggan di sebuah aplikasi internal. Centang praktik yang SUDAH diterapkan tim pengembang berdasarkan dokumen yang kamu terima.",
      ambangAman: 75,
      item: [
        {
          id: "i1",
          label: "Setiap akses data pelanggan tercatat dalam log audit",
          kategori: "Pencatatan",
          berisikoJikaTidakDicentang: true,
        },
        {
          id: "i2",
          label: "Password disimpan dalam bentuk terenkripsi (hashed)",
          kategori: "Keamanan",
          berisikoJikaTidakDicentang: true,
        },
        {
          id: "i3",
          label: "Ada pemisahan hak akses antara staf biasa dan admin",
          kategori: "Kontrol Akses",
          berisikoJikaTidakDicentang: true,
        },
        {
          id: "i4",
          label: "Dokumentasi kebijakan privasi diperbarui tahun ini",
          kategori: "Dokumentasi",
          berisikoJikaTidakDicentang: false,
        },
        {
          id: "i5",
          label: "Ada mekanisme hapus data atas permintaan pelanggan",
          kategori: "Kepatuhan Data",
          berisikoJikaTidakDicentang: true,
        },
      ],
    } as AuditScenarioContent,
  },
  {
    id: "sc-audit-temuan-risiko",
    menuId: "audit-temuan-risiko",
    tipeInteraksi: "audit-checklist",
    konten: {
      konteks:
        "Sebuah sistem baru akan diluncurkan minggu depan. Centang kontrol keamanan yang sudah terbukti ada di sistem berdasarkan hasil wawancaramu dengan tim developer.",
      ambangAman: 70,
      item: [
        {
          id: "i1",
          label: "Sudah ada uji penetrasi (penetration test) sebelum rilis",
          kategori: "Keamanan",
          berisikoJikaTidakDicentang: true,
        },
        {
          id: "i2",
          label: "Server produksi dipisah dari server development",
          kategori: "Infrastruktur",
          berisikoJikaTidakDicentang: true,
        },
        {
          id: "i3",
          label: "Ada rencana backup & pemulihan bencana (disaster recovery)",
          kategori: "Kontinuitas",
          berisikoJikaTidakDicentang: true,
        },
        {
          id: "i4",
          label: "Tim sudah dilatih menangani insiden keamanan",
          kategori: "Kesiapan Tim",
          berisikoJikaTidakDicentang: false,
        },
      ],
    } as AuditScenarioContent,
  },
  {
    id: "sc-audit-laporan",
    menuId: "audit-laporan",
    tipeInteraksi: "audit-checklist",
    konten: {
      konteks:
        "Audit sistem HR selesai dilakukan. Centang rekomendasi yang paling relevan untuk dimasukkan ke laporan akhir berdasarkan temuan di lapangan.",
      ambangAman: 60,
      item: [
        {
          id: "i1",
          label: "Rekomendasikan rotasi password berkala untuk akun admin HR",
          kategori: "Rekomendasi",
          berisikoJikaTidakDicentang: true,
        },
        {
          id: "i2",
          label: "Rekomendasikan pelatihan kesadaran keamanan untuk staf HR",
          kategori: "Rekomendasi",
          berisikoJikaTidakDicentang: true,
        },
        {
          id: "i3",
          label: "Ganti seluruh sistem HR meski belum ada bukti kebocoran",
          kategori: "Rekomendasi",
          berisikoJikaTidakDicentang: false,
        },
        {
          id: "i4",
          label: "Tetapkan jadwal audit ulang setiap 6 bulan",
          kategori: "Rekomendasi",
          berisikoJikaTidakDicentang: true,
        },
      ],
    } as AuditScenarioContent,
  },
  {
    id: "sc-data-bersihkan",
    menuId: "data-bersihkan",
    tipeInteraksi: "data-clean",
    konten: {
      judul: "Data penjualan semen per toko, bulan lalu",
      kolom: ["Toko", "Unit Terjual", "Harga Satuan (Rp)"],
      baris: [
        {
          id: "r1",
          data: { Toko: "Toko Makmur", "Unit Terjual": 120, "Harga Satuan (Rp)": 65000 },
        },
        {
          id: "r2",
          data: { Toko: "toko sejahtera ", "Unit Terjual": "95", "Harga Satuan (Rp)": 65000 },
          kolomKotor: ["Toko", "Unit Terjual"],
          perbaikan: { Toko: "Toko Sejahtera", "Unit Terjual": 95 },
        },
        {
          id: "r3",
          data: { Toko: "Toko Barokah", "Unit Terjual": -5, "Harga Satuan (Rp)": 65000 },
          kolomKotor: ["Unit Terjual"],
          perbaikan: { "Unit Terjual": 0 },
        },
        {
          id: "r4",
          data: { Toko: "TOKO JAYA", "Unit Terjual": 210, "Harga Satuan (Rp)": "65rb" },
          kolomKotor: ["Toko", "Harga Satuan (Rp)"],
          perbaikan: { Toko: "Toko Jaya", "Harga Satuan (Rp)": 65000 },
        },
        {
          id: "r5",
          data: { Toko: "Toko Amanah", "Unit Terjual": 150, "Harga Satuan (Rp)": 65000 },
        },
      ],
    } as DataCleanContent,
  },
  {
    id: "sc-data-visualisasi",
    menuId: "data-visualisasi",
    tipeInteraksi: "data-chart",
    konten: {
      judul: "Total unit terjual per toko (setelah data dibersihkan)",
      satuan: "unit",
      kategori: [
        { label: "Toko Makmur", nilai: 120 },
        { label: "Toko Sejahtera", nilai: 95 },
        { label: "Toko Barokah", nilai: 0 },
        { label: "Toko Jaya", nilai: 210 },
        { label: "Toko Amanah", nilai: 150 },
      ],
    } as DataChartContent,
  },
  {
    id: "sc-data-kesimpulan",
    menuId: "data-kesimpulan",
    tipeInteraksi: "data-insight",
    konten: {
      pertanyaan:
        "Berdasarkan grafik penjualan, rekomendasi apa yang paling tepat untuk tim sales bulan depan?",
      opsi: [
        {
          id: "o1",
          label: "Fokuskan promosi tambahan ke Toko Jaya karena sudah paling laris",
          benar: false,
          penjelasan:
            "Toko yang sudah tinggi penjualannya bukan prioritas utama untuk tambahan promosi, potensi kenaikannya lebih kecil dibanding toko yang tertinggal.",
        },
        {
          id: "o2",
          label:
            "Selidiki Toko Barokah (0 unit) dan berikan dukungan/promosi khusus",
          benar: true,
          penjelasan:
            "Tepat! Toko dengan penjualan 0 unit menandakan ada masalah (stok kosong, lokasi kurang ramai, atau kesalahan pencatatan) yang perlu ditindaklanjuti lebih dulu.",
        },
        {
          id: "o3",
          label: "Tutup saja Toko Barokah karena dianggap tidak menguntungkan",
          benar: false,
          penjelasan:
            "Terlalu cepat mengambil keputusan drastis dari satu bulan data. Perlu digali dulu penyebabnya sebelum memutuskan menutup toko.",
        },
      ],
    } as DataInsightContent,
  },
];

export function getMenusByJalur(jalur: string): WorkspaceMenu[] {
  return WORKSPACE_MENUS.filter((m) => m.jalur === jalur).sort(
    (a, b) => a.urutan - b.urutan
  );
}

export function getScenarioByMenuId(menuId: string): WorkspaceScenario | undefined {
  return WORKSPACE_SCENARIOS.find((s) => s.menuId === menuId);
}
