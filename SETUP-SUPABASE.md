# Cara Menyambungkan Supabase (khusus project ini)

Project Supabase kamu: **`sxmaoviudfyfcawnpsfs`**

Tinggal 2 langkah. Total sekitar 3 menit.

---

## Langkah 1 — Buat tabel & isi datanya (sekali saja)

1. Buka dashboard Supabase → project kamu → menu **SQL Editor** → **New query**.
2. Buka file `supabase/setup-all.sql`, salin **seluruh isinya**, tempel ke editor.
3. Klik **Run**.

Selesai. Satu file itu sudah berisi struktur tabel, aturan keamanan (RLS), dan seluruh konten: 6 pertanyaan kuis, 9 menu ruang kerja, 9 skenario simulasi, 8 FAQ, 4 testimoni, dan 4 prestasi.

File ini sudah diuji dijalankan berulang kali di PostgreSQL 16 dan aman — kalau kamu jalankan dua kali, datanya tidak akan dobel.

---

## Langkah 2 — Ambil kunci API dan buat file `.env.local`

Yang dibutuhkan aplikasi **bukan** password database, melainkan **anon key** (kunci publik yang memang dirancang untuk dipakai di browser).

1. Di dashboard Supabase, buka **Project Settings** → **API**.
2. Salin nilai **Project URL** dan **anon / public key** (bentuknya panjang, diawali `eyJ...`).
3. Di folder project ini, buat file baru bernama `.env.local`, lalu isi seperti ini:

```
NEXT_PUBLIC_SUPABASE_URL=https://sxmaoviudfyfcawnpsfs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...(tempel anon key kamu di sini)
```

4. Jalankan ulang server:

```bash
npm run dev
```

Kalau berhasil, konten yang tampil sekarang dibaca dari Supabase, bukan lagi dari data contoh di `lib/data/`. Cara cepat mengeceknya: ubah satu testimoni lewat **Table Editor** di Supabase, refresh halaman `/info` — kalau berubah, berarti sudah tersambung.

---

## Penting soal keamanan

**Password database jangan dimasukkan ke aplikasi ini.** Connection string `postgresql://postgres:...@db.xxx.supabase.co:5432/postgres` itu kredensial admin penuh — siapa pun yang memegangnya bisa membaca, mengubah, dan menghapus seluruh isi database.

Dua hal yang perlu diperhatikan:

**Pertama, jangan pernah menaruhnya di variabel berawalan `NEXT_PUBLIC_`.** Semua variabel dengan awalan itu ikut dikirim ke browser pengunjung dan bisa dibaca siapa saja lewat Developer Tools. Aplikasi ini sengaja hanya memakai anon key, yang aman dipublikasikan karena aksesnya sudah dibatasi oleh aturan RLS di `setup-all.sql` — publik cuma boleh membaca konten promosi, dan hasil kuis hanya boleh ditulis, tidak boleh dibaca balik.

**Kedua, password yang tadi kamu kirim lewat chat sebaiknya diganti.** Kredensial yang sudah pernah dikirim lewat chat, email, atau grup sebaiknya dianggap tidak rahasia lagi. Gantinya gampang: **Project Settings → Database → Reset database password**. Aplikasi ini tidak akan terpengaruh sama sekali, karena memang tidak memakai password itu.
