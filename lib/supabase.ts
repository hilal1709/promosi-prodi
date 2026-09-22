import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Client Supabase untuk browser. Bernilai `null` jika env var belum diisi
 * (mis. saat demo lokal / sebelum kredensial Supabase dipasang), sehingga
 * seluruh pemanggil WAJIB fallback ke data mock lewat lib/data/*.
 *
 * Isi NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY di .env.local
 * (lihat .env.local.example) untuk mengaktifkan koneksi Supabase sungguhan.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string)
  : null;
