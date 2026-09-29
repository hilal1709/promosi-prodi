# SISFOR UISI: Pilih Jalurmu

Web app (sekaligus PWA yang bisa diinstal di HP) untuk sayembara promosi Program Studi Sistem Informasi UISI. Dibangun sesuai PRD: landing page, kuis "Pilih Jalurmu", simulasi "Ruang Kerja Digital" untuk tiga peminatan (IT/Audit & Governance, Enterprise System, Data Science), halaman info prodi, dan chatbot FAQ.

## Tech stack

- **Next.js 16** (App Router, Turbopack) + TypeScript
- **Tailwind CSS v4** untuk styling (tanpa `tailwind.config.js`, token warna & radius didefinisikan langsung di `app/globals.css`)
- Komponen UI bergaya **shadcn/ui** (Radix UI primitives + `class-variance-authority`), ditulis manual di `components/ui/`
- **GSAP** untuk animasi & transisi halaman
- **Supabase** (`@supabase/supabase-js`) sebagai lapisan data opsional, aplikasi tetap berjalan penuh dengan **data mock** bila Supabase belum disambungkan
- **PWA manual** (manifest + service worker ditulis sendiri di `public/`, bukan lewat plugin), dipilih karena Next.js 16 memakai Turbopack sebagai default builder, dan plugin PWA populer (mis. `next-pwa`) masih bergantung pada konfigurasi Webpack yang tidak kompatibel dengan Turbopack

## Menjalankan secara lokal

```bash
npm install
npm run dev
```

Buka http://localhost:3000. Untuk build produksi:

```bash
npm run build
npm run start
```

## Menyambungkan Supabase (opsional, tapi direkomendasikan untuk data real)

Selama `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` belum diisi, seluruh konten (pertanyaan kuis, menu ruang kerja, FAQ, testimoni, prestasi) diambil dari data mock di `lib/data/*.ts`, jadi aplikasi **selalu bisa didemokan** tanpa setup tambahan (sesuai mitigasi risiko di PRD: "isi data dummy sejak hari ke-2").

Untuk memakai Supabase sungguhan:

1. Buat project di [supabase.com](https://supabase.com).
2. Buka **SQL Editor** → **New query**, tempel seluruh isi `supabase/setup-all.sql`, lalu **Run**. Satu file itu berisi skema + RLS + seluruh data awal (6 pertanyaan kuis, 9 menu, 9 skenario, 8 FAQ, 4 testimoni, 4 prestasi) dan aman dijalankan berulang tanpa membuat data dobel. (`schema.sql` dan `seed.sql` tetap disediakan terpisah kalau ingin dijalankan bertahap.)
3. Salin `.env.local.example` menjadi `.env.local`, lalu isi:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
   ```
4. Jalankan ulang `npm run dev`. Aplikasi otomatis membaca dari Supabase begitu kredensial terisi (lihat `lib/data/index.ts`), dan tetap fallback ke mock jika suatu tabel kosong/gagal diakses.

## Struktur folder penting

```
app/                     Routing (App Router): beranda, /kuis, /ruang-kerja/[jalur], /info
components/ui/           Komponen dasar bergaya shadcn/ui
components/quiz/         Alur & scoring kuis "Pilih Jalurmu"
components/workspace/    Ruang Kerja Digital: switcher jalur, grid menu, dialog skenario per tipe interaksi
components/info/         Kurikulum, prospek karier, testimoni, prestasi
components/chatbot/      Widget FAQ mengambang
components/pwa/          Prompt "Tambahkan ke Layar Utama" + registrasi service worker
components/gsap/         Wrapper animasi (page transition, stagger, reveal)
lib/data/                Data mock (quiz, workspace, faq, testimonial, achievement, kurikulum) + tracks.ts (meta 3 peminatan)
lib/data/index.ts        Lapisan akses data: Supabase kalau tersedia, fallback ke mock
lib/quiz.ts              Logika skoring kuis
lib/supabase.ts          Client Supabase (browser)
supabase/schema.sql      DDL + RLS sesuai skema data di PRD
supabase/seed.sql        Data awal (contoh; workspace_scenarios lain bisa ditambah lewat Table Editor)
public/manifest.json     Manifest PWA
public/sw.js             Service worker manual (app-shell caching + fallback offline.html)
public/icons/            Ikon PWA (placeholder monogram "SI", ganti dengan logo resmi UISI kalau ada)
scripts/generate-icons.py Skrip Python yang dipakai untuk membuat ikon placeholder di atas
```

## Yang sudah selesai vs. yang masih bisa dikembangkan

Mengikuti prioritas di PRD (alur inti dulu, baru pelengkap), semua fitur di bab "Fitur Utama" sudah diimplementasikan dan bisa didemokan end-to-end: landing → kuis → hasil (dengan share) → Ruang Kerja Digital (3 jalur, masing-masing 3 menu dengan simulasi interaktif berbeda) → info prodi → chatbot FAQ, plus PWA installable dengan ikon & service worker.

Yang disarankan disempurnakan lagi sebelum hari-H presentasi:

- Ganti ikon placeholder (`public/icons/*`, `app/icon.png`) dengan logo resmi UISI.
- Tambahkan foto asli untuk testimoni/prestasi (`foto_url` di skema sudah disiapkan, tinggal dipakai di komponen bila diperlukan).
- Uji di beberapa HP kelas menengah sungguhan (bukan cuma DevTools) sesuai mitigasi risiko GSAP di PRD.
