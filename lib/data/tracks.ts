import type { TrackMeta } from "@/lib/types";

export const TRACKS: Record<string, TrackMeta> = {
  "it-audit": {
    id: "it-audit",
    nama: "IT / Audit & Governance",
    singkatan: "IT Audit",
    tagline: "Menjaga sistem tetap aman, patuh, dan bisa dipercaya",
    deskripsi:
      "Peminatan yang berfokus pada tata kelola TI, kepatuhan terhadap standar/regulasi, manajemen risiko, dan audit sistem informasi. Lulusannya jadi 'penjaga gerbang' yang memastikan sistem digital organisasi berjalan aman dan sesuai aturan.",
    icon: "ShieldCheck",
    warna: "track-audit",
    prospekKarier: [
      "IT/IS Auditor",
      "Governance, Risk & Compliance (GRC) Analyst",
      "IT Consultant",
      "Information Security Analyst",
    ],
  },
  "enterprise-system": {
    id: "enterprise-system",
    nama: "Enterprise System",
    singkatan: "Enterprise System",
    tagline: "Merancang sistem yang menggerakkan roda bisnis",
    deskripsi:
      "Peminatan yang berfokus pada perencanaan, implementasi, dan optimalisasi sistem terintegrasi seperti ERP (Enterprise Resource Planning) untuk mendukung proses bisnis mulai dari inventaris, keuangan, hingga SDM.",
    icon: "Boxes",
    warna: "track-erp",
    prospekKarier: [
      "Enterprise System Analyst",
      "ERP Consultant/Functional Consultant",
      "Business Process Analyst",
      "System Implementation Specialist",
    ],
  },
  "data-science": {
    id: "data-science",
    nama: "Data Science",
    singkatan: "Data Science",
    tagline: "Mengubah tumpukan data jadi keputusan yang tepat",
    deskripsi:
      "Peminatan yang berfokus pada pengolahan, analisis, dan visualisasi data untuk menghasilkan wawasan (insight) yang mendukung pengambilan keputusan bisnis berbasis data.",
    icon: "ChartSpline",
    warna: "track-data",
    prospekKarier: [
      "Data Analyst",
      "Business Intelligence Analyst",
      "Junior Data Scientist",
      "Data & Reporting Specialist",
    ],
  },
};

export const TRACK_LIST = Object.values(TRACKS);

export function getTrack(id: string): TrackMeta {
  return TRACKS[id] ?? TRACKS["enterprise-system"];
}
