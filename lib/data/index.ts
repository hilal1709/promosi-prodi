import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { FaqItem, JalurId, QuizQuestion, QuizResultPayload, Testimonial, Achievement, WorkspaceMenu, WorkspaceScenario } from "@/lib/types";
import { QUIZ_QUESTIONS } from "./quiz-questions";
import { WORKSPACE_MENUS, getScenarioByMenuId } from "./workspace";
import { FAQ_ITEMS } from "./faq";
import { TESTIMONIALS } from "./testimonials";
import { ACHIEVEMENTS } from "./achievements";

/**
 * Lapisan akses data. Selama tabel Supabase (lihat supabase/schema.sql) belum
 * diisi atau kredensial belum dipasang di .env.local, semua fungsi ini
 * otomatis fallback ke data mock di lib/data/*, sehingga tampilan selalu
 * terisi (lihat mitigasi risiko di PRD: "isi data dummy sejak hari 2").
 */

export async function fetchQuizQuestions(): Promise<QuizQuestion[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("quiz_questions")
      .select("*")
      .order("urutan", { ascending: true });
    if (!error && data && data.length > 0) {
      return data.map((row) => ({
        id: row.id,
        urutan: row.urutan,
        teksPertanyaan: row.teks_pertanyaan,
        opsiJawaban: row.opsi_jawaban,
      }));
    }
  }
  return QUIZ_QUESTIONS;
}

export async function fetchWorkspaceMenus(jalur?: JalurId): Promise<WorkspaceMenu[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase.from("workspace_menus").select("*").order("urutan");
    if (jalur) query = query.eq("peminatan", jalur);
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data.map((row) => ({
        id: row.id,
        jalur: row.peminatan,
        namaMenu: row.nama_menu,
        deskripsi: row.deskripsi,
        iconSlug: row.icon_slug,
        urutan: row.urutan,
        tipeInteraksi: row.tipe_interaksi,
      }));
    }
  }
  return jalur ? WORKSPACE_MENUS.filter((m) => m.jalur === jalur) : WORKSPACE_MENUS;
}

export async function fetchScenarioByMenuId(menuId: string): Promise<WorkspaceScenario | undefined> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("workspace_scenarios")
      .select("*")
      .eq("menu_id", menuId)
      .maybeSingle();
    if (!error && data) {
      return {
        id: data.id,
        menuId: data.menu_id,
        konten: data.konten,
        tipeInteraksi: data.tipe_interaksi,
      };
    }
  }
  return getScenarioByMenuId(menuId);
}

export async function fetchFaqItems(): Promise<FaqItem[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from("faq_items").select("*");
    if (!error && data && data.length > 0) {
      return data.map((row) => ({
        id: row.id,
        kategori: row.kategori,
        pertanyaan: row.pertanyaan,
        jawaban: row.jawaban,
      }));
    }
  }
  return FAQ_ITEMS;
}

export async function fetchTestimonials(): Promise<Testimonial[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from("testimonials").select("*");
    if (!error && data && data.length > 0) {
      return data.map((row) => ({
        id: row.id,
        nama: row.nama,
        jabatanPerusahaan: row.jabatan_perusahaan,
        kutipan: row.kutipan,
      }));
    }
  }
  return TESTIMONIALS;
}

export async function fetchAchievements(): Promise<Achievement[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("achievements")
      .select("*")
      .order("tahun", { ascending: false });
    if (!error && data && data.length > 0) {
      return data.map((row) => ({
        id: row.id,
        judul: row.judul,
        deskripsi: row.deskripsi,
        tahun: row.tahun,
      }));
    }
  }
  return ACHIEVEMENTS;
}

export async function saveQuizResult(payload: QuizResultPayload): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from("quiz_results").insert({
      session_id: payload.sessionId,
      jawaban: payload.jawaban,
      peminatan_hasil: payload.peminatanHasil,
    });
  } catch {
    // Simpan hasil kuis bersifat best-effort; kegagalan tidak boleh
    // menghentikan pengalaman pengguna melihat hasil kuisnya.
  }
}
