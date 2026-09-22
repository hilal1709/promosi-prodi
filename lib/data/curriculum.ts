import type { JalurId } from "@/lib/types";

export interface CurriculumSummary {
  jalur: JalurId;
  mataKuliahInti: string[];
  keahlianUtama: string[];
}

export const CURRICULUM: Record<JalurId, CurriculumSummary> = {
  "it-audit": {
    jalur: "it-audit",
    mataKuliahInti: [
      "Tata Kelola & Manajemen Risiko TI",
      "Audit Sistem Informasi",
      "Keamanan Informasi",
      "Manajemen Layanan TI (ITSM/ITIL)",
      "Etika & Regulasi Teknologi Informasi",
    ],
    keahlianUtama: [
      "Menyusun & menilai kontrol internal sistem digital",
      "Mengidentifikasi risiko dan celah keamanan",
      "Menyusun laporan audit & rekomendasi perbaikan",
    ],
  },
  "enterprise-system": {
    jalur: "enterprise-system",
    mataKuliahInti: [
      "Perencanaan Sumber Daya Perusahaan (ERP)",
      "Analisis & Perancangan Proses Bisnis",
      "Manajemen Rantai Pasok Digital",
      "Manajemen Proyek Sistem Informasi",
      "Integrasi & Interoperabilitas Sistem",
    ],
    keahlianUtama: [
      "Memetakan & mengoptimalkan proses bisnis end-to-end",
      "Mengonfigurasi modul sistem terintegrasi (mis. ERP)",
      "Mengelola implementasi sistem lintas divisi",
    ],
  },
  "data-science": {
    jalur: "data-science",
    mataKuliahInti: [
      "Penambangan Data (Data Mining)",
      "Statistika & Analitik Bisnis",
      "Visualisasi Data",
      "Pembelajaran Mesin (Machine Learning)",
      "Big Data & Business Intelligence",
    ],
    keahlianUtama: [
      "Membersihkan & mengolah data mentah",
      "Membangun model analitik & prediktif sederhana",
      "Menyajikan insight lewat visualisasi yang mudah dipahami",
    ],
  },
};
