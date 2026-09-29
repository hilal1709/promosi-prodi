-- =====================================================================
-- SISFOR UISI: Pilih Jalurmu: Skema Database Supabase
-- Sesuai bab "Skema Data (Supabase)" pada PRD.
-- Jalankan file ini di Supabase SQL Editor (Project > SQL Editor > New query)
-- =====================================================================

create extension if not exists "pgcrypto";

-- 1. quiz_questions ------------------------------------------------------
create table if not exists quiz_questions (
  id uuid primary key default gen_random_uuid(),
  urutan int not null,
  teks_pertanyaan text not null,
  opsi_jawaban jsonb not null, -- [{ id, teks, bobot: {it-audit, enterprise-system, data-science} }]
  bobot_peminatan jsonb, -- opsional: ringkasan bobot total pertanyaan
  dibuat_pada timestamptz not null default now()
);

-- 2. quiz_results ---------------------------------------------------------
create table if not exists quiz_results (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  jawaban jsonb not null, -- { [question_id]: option_id }
  peminatan_hasil text not null check (peminatan_hasil in ('it-audit','enterprise-system','data-science')),
  dibuat_pada timestamptz not null default now()
);
create index if not exists idx_quiz_results_session on quiz_results (session_id);

-- 3. workspace_menus -------------------------------------------------------
create table if not exists workspace_menus (
  id text primary key,
  peminatan text not null check (peminatan in ('it-audit','enterprise-system','data-science')),
  nama_menu text not null,
  deskripsi text,
  icon_slug text,
  urutan int not null default 1,
  -- dibaca app sebagai WorkspaceMenu.tipeInteraksi (lib/data/index.ts)
  tipe_interaksi text check (
    tipe_interaksi in ('erp-decision','audit-checklist','data-clean','data-chart','data-insight')
  )
);
-- untuk project yang tabelnya sudah terlanjur dibuat tanpa kolom ini:
alter table workspace_menus add column if not exists tipe_interaksi text;

-- 4. workspace_scenarios ----------------------------------------------------
create table if not exists workspace_scenarios (
  id text primary key,
  menu_id text references workspace_menus(id) on delete cascade,
  konten jsonb not null,
  tipe_interaksi text not null check (
    tipe_interaksi in ('erp-decision','audit-checklist','data-clean','data-chart','data-insight')
  )
);

-- 5. faq_items ---------------------------------------------------------------
create table if not exists faq_items (
  id uuid primary key default gen_random_uuid(),
  kategori text not null check (kategori in ('PMB','Kurikulum','Beasiswa')),
  pertanyaan text not null,
  jawaban text not null
);

-- 6. testimonials --------------------------------------------------------------
create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  jabatan_perusahaan text,
  kutipan text not null,
  foto_url text
);

-- 7. achievements -----------------------------------------------------------------
create table if not exists achievements (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  deskripsi text,
  tahun int not null,
  foto_url text
);

-- =====================================================================
-- Row Level Security
-- Semua tabel konten bisa dibaca publik (anon) karena memang untuk
-- ditampilkan di halaman promosi. quiz_results hanya bisa DI-INSERT oleh
-- publik (tanpa akun/login, sesuai PRD), tidak bisa dibaca/diubah/dihapus
-- oleh anon supaya jawaban pengguna lain tidak bisa diintip lewat client.
-- =====================================================================

alter table quiz_questions enable row level security;
alter table workspace_menus enable row level security;
alter table workspace_scenarios enable row level security;
alter table faq_items enable row level security;
alter table testimonials enable row level security;
alter table achievements enable row level security;
alter table quiz_results enable row level security;

drop policy if exists "public read quiz_questions" on quiz_questions;
create policy "public read quiz_questions" on quiz_questions for select using (true);
drop policy if exists "public read workspace_menus" on workspace_menus;
create policy "public read workspace_menus" on workspace_menus for select using (true);
drop policy if exists "public read workspace_scenarios" on workspace_scenarios;
create policy "public read workspace_scenarios" on workspace_scenarios for select using (true);
drop policy if exists "public read faq_items" on faq_items;
create policy "public read faq_items" on faq_items for select using (true);
drop policy if exists "public read testimonials" on testimonials;
create policy "public read testimonials" on testimonials for select using (true);
drop policy if exists "public read achievements" on achievements;
create policy "public read achievements" on achievements for select using (true);

drop policy if exists "public insert quiz_results" on quiz_results;
create policy "public insert quiz_results" on quiz_results for insert with check (true);
