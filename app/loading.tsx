import { GameLoader } from "@/components/game/game-loader";

/** Ditampilkan Next.js saat berpindah halaman (Info, Kuis, Ruang Kerja). */
export default function Loading() {
  return <GameLoader label="Memuat halaman…" className="min-h-svh" showTips={false} />;
}
