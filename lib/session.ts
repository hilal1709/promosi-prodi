"use client";

const SESSION_KEY = "sisfor_session_id";

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

/**
 * Sesi anonim untuk mengaitkan hasil kuis & progres eksplorasi tanpa akun/login,
 * sesuai PRD (quiz_results.session_id). Disimpan di localStorage perangkat pengguna.
 */
export function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = randomId();
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function getStoredJalur(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("sisfor_jalur_hasil");
}

export function setStoredJalur(jalur: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("sisfor_jalur_hasil", jalur);
}
