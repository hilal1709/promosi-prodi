import type { JalurId, QuizOptionBobot, QuizQuestion } from "@/lib/types";

const JALUR_URUTAN: JalurId[] = ["it-audit", "enterprise-system", "data-science"];

/**
 * Menjumlahkan bobot semua jawaban lalu mengambil peminatan dengan skor
 * tertinggi. Jika seri, dimenangkan berdasarkan urutan JALUR_URUTAN supaya
 * hasilnya konsisten (deterministik) untuk kombinasi jawaban yang sama.
 */
export function hitungHasilKuis(
  questions: QuizQuestion[],
  jawaban: Record<string, string>
): { peminatan: JalurId; skor: QuizOptionBobot } {
  const skor: QuizOptionBobot = { "it-audit": 0, "enterprise-system": 0, "data-science": 0 };

  for (const q of questions) {
    const optionId = jawaban[q.id];
    if (!optionId) continue;
    const opsi = q.opsiJawaban.find((o) => o.id === optionId);
    if (!opsi) continue;
    skor["it-audit"] += opsi.bobot["it-audit"];
    skor["enterprise-system"] += opsi.bobot["enterprise-system"];
    skor["data-science"] += opsi.bobot["data-science"];
  }

  let peminatan: JalurId = JALUR_URUTAN[0];
  let maxSkor = -Infinity;
  for (const jalur of JALUR_URUTAN) {
    if (skor[jalur] > maxSkor) {
      maxSkor = skor[jalur];
      peminatan = jalur;
    }
  }

  return { peminatan, skor };
}
