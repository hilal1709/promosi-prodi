import type { QuizQuestion } from "@/lib/types";

// bobot: { "it-audit": n, "enterprise-system": n, "data-science": n }
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    urutan: 1,
    teksPertanyaan:
      "Kalau ada proses di kampus yang berantakan, kamu lebih tertarik untuk...",
    opsiJawaban: [
      {
        id: "q1a",
        teks: "Menyusun aturan main & memastikan semua orang mengikutinya",
        bobot: { "it-audit": 3, "enterprise-system": 1, "data-science": 0 },
      },
      {
        id: "q1b",
        teks: "Merancang satu sistem terintegrasi supaya prosesnya otomatis",
        bobot: { "it-audit": 0, "enterprise-system": 3, "data-science": 1 },
      },
      {
        id: "q1c",
        teks: "Mengumpulkan data dulu untuk tahu apa akar masalahnya",
        bobot: { "it-audit": 1, "enterprise-system": 0, "data-science": 3 },
      },
    ],
  },
  {
    id: "q2",
    urutan: 2,
    teksPertanyaan: "Kamu lebih suka menyusun aturan atau membongkar pola dari angka?",
    opsiJawaban: [
      {
        id: "q2a",
        teks: "Menyusun aturan, checklist, dan standar yang jelas",
        bobot: { "it-audit": 3, "enterprise-system": 1, "data-science": 0 },
      },
      {
        id: "q2b",
        teks: "Membongkar pola dari angka dan menemukan insight tersembunyi",
        bobot: { "it-audit": 0, "enterprise-system": 0, "data-science": 3 },
      },
      {
        id: "q2c",
        teks: "Keduanya sama menariknya, tergantung konteksnya",
        bobot: { "it-audit": 1, "enterprise-system": 2, "data-science": 1 },
      },
    ],
  },
  {
    id: "q3",
    urutan: 3,
    teksPertanyaan: "Kegiatan mana yang paling bikin kamu penasaran untuk dicoba?",
    opsiJawaban: [
      {
        id: "q3a",
        teks: "Mengecek apakah sebuah sistem sudah aman dari celah/risiko",
        bobot: { "it-audit": 3, "enterprise-system": 0, "data-science": 1 },
      },
      {
        id: "q3b",
        teks: "Mendesain alur kerja gudang, keuangan, atau HR jadi satu sistem",
        bobot: { "it-audit": 0, "enterprise-system": 3, "data-science": 0 },
      },
      {
        id: "q3c",
        teks: "Membuat grafik dari data mentah supaya orang lain paham cepat",
        bobot: { "it-audit": 0, "enterprise-system": 1, "data-science": 3 },
      },
    ],
  },
  {
    id: "q4",
    urutan: 4,
    teksPertanyaan: "Saat kerja kelompok, peran yang paling nyaman buat kamu adalah...",
    opsiJawaban: [
      {
        id: "q4a",
        teks: "Yang mengecek ulang & memastikan tidak ada yang terlewat",
        bobot: { "it-audit": 3, "enterprise-system": 1, "data-science": 1 },
      },
      {
        id: "q4b",
        teks: "Yang merancang bagaimana semua bagian saling terhubung",
        bobot: { "it-audit": 1, "enterprise-system": 3, "data-science": 0 },
      },
      {
        id: "q4c",
        teks: "Yang mengolah hasil survei/data jadi kesimpulan akhir",
        bobot: { "it-audit": 0, "enterprise-system": 0, "data-science": 3 },
      },
    ],
  },
  {
    id: "q5",
    urutan: 5,
    teksPertanyaan: "Berita/isu digital seperti apa yang paling menarik perhatianmu?",
    opsiJawaban: [
      {
        id: "q5a",
        teks: "Kebocoran data & bagaimana perusahaan seharusnya mencegahnya",
        bobot: { "it-audit": 3, "enterprise-system": 0, "data-science": 1 },
      },
      {
        id: "q5b",
        teks: "Perusahaan yang berhasil efisien karena sistemnya terintegrasi",
        bobot: { "it-audit": 0, "enterprise-system": 3, "data-science": 0 },
      },
      {
        id: "q5c",
        teks: "Prediksi tren berdasarkan data besar (big data, AI)",
        bobot: { "it-audit": 0, "enterprise-system": 1, "data-science": 3 },
      },
    ],
  },
  {
    id: "q6",
    urutan: 6,
    teksPertanyaan: "Kalau boleh magang sekarang, kamu paling ingin ditempatkan di...",
    opsiJawaban: [
      {
        id: "q6a",
        teks: "Divisi Internal Audit / Risk & Compliance",
        bobot: { "it-audit": 3, "enterprise-system": 1, "data-science": 0 },
      },
      {
        id: "q6b",
        teks: "Divisi IT yang mengelola sistem ERP perusahaan",
        bobot: { "it-audit": 1, "enterprise-system": 3, "data-science": 0 },
      },
      {
        id: "q6c",
        teks: "Divisi Business Intelligence / Data Analytics",
        bobot: { "it-audit": 0, "enterprise-system": 0, "data-science": 3 },
      },
    ],
  },
];
