export type JalurId = "it-audit" | "enterprise-system" | "data-science";

export type MissionId = JalurId;
export type GamePhase = "start" | "explore" | "mission" | "paused" | "complete";
export type GameQuality = "auto" | "hemat" | "tinggi";
export type GameAvatarId = "arga" | "nara";

export interface MissionResult {
  missionId: MissionId;
  performance: number;
  affinityBonus: 0 | 15 | 30;
  completedAt: string;
}

export type TrackScore = Record<JalurId, number>;

export interface AudioSettings {
  muted: boolean;
  volume: number;
}

export interface GameProgress {
  version: 1;
  phase: GamePhase;
  avatar: GameAvatarId | null;
  spawnZone: "plaza" | MissionId | "info";
  missions: Partial<Record<MissionId, MissionResult>>;
  recommendation: JalurId | null;
  audio: AudioSettings;
  quality: GameQuality;
}

export interface TrackMeta {
  id: JalurId;
  nama: string;
  singkatan: string;
  tagline: string;
  deskripsi: string;
  icon: string; // nama lucide-react icon
  warna: string; // css var color token, mis. "track-audit"
  prospekKarier: string[];
}

export interface QuizOptionBobot {
  "it-audit": number;
  "enterprise-system": number;
  "data-science": number;
}

export interface QuizOption {
  id: string;
  teks: string;
  bobot: QuizOptionBobot;
}

export interface QuizQuestion {
  id: string;
  urutan: number;
  teksPertanyaan: string;
  opsiJawaban: QuizOption[];
}

export interface QuizResultPayload {
  sessionId: string;
  jawaban: Record<string, string>; // questionId -> optionId
  peminatanHasil: JalurId;
  skor: QuizOptionBobot;
}

/** --- Ruang Kerja Digital --- */

export type TipeInteraksi =
  | "erp-decision"
  | "audit-checklist"
  | "data-clean"
  | "data-chart"
  | "data-insight";

export interface WorkspaceMenu {
  id: string;
  jalur: JalurId;
  namaMenu: string;
  deskripsi: string;
  iconSlug: string;
  urutan: number;
  tipeInteraksi: TipeInteraksi;
}

export interface ErpOpsi {
  id: string;
  label: string;
  konsekuensi: string;
  dampak: { efisiensi?: number; biaya?: number; risiko?: number };
}

export interface ErpScenarioContent {
  situasi: string;
  opsi: ErpOpsi[];
}

export interface AuditItem {
  id: string;
  label: string;
  kategori: string;
  berisikoJikaTidakDicentang: boolean;
}

export interface AuditScenarioContent {
  konteks: string;
  item: AuditItem[];
  ambangAman: number; // persentase
}

export interface DataRow {
  id: string;
  data: Record<string, string | number>;
  kolomKotor?: string[];
  perbaikan?: Record<string, string | number>;
}

export interface DataCleanContent {
  judul: string;
  kolom: string[];
  baris: DataRow[];
}

export interface DataChartContent {
  judul: string;
  satuan: string;
  kategori: { label: string; nilai: number }[];
}

export interface DataInsightOpsi {
  id: string;
  label: string;
  benar: boolean;
  penjelasan: string;
}

export interface DataInsightContent {
  pertanyaan: string;
  opsi: DataInsightOpsi[];
}

export type WorkspaceScenarioContent =
  | ErpScenarioContent
  | AuditScenarioContent
  | DataCleanContent
  | DataChartContent
  | DataInsightContent;

export interface WorkspaceScenario {
  id: string;
  menuId: string;
  konten: WorkspaceScenarioContent;
  tipeInteraksi: TipeInteraksi;
}

/** --- FAQ Chatbot --- */

export interface FaqItem {
  id: string;
  kategori: "PMB" | "Kurikulum" | "Beasiswa";
  pertanyaan: string;
  jawaban: string;
}

/** --- Info Prodi --- */

export interface Testimonial {
  id: string;
  nama: string;
  jabatanPerusahaan: string;
  kutipan: string;
  jalur?: JalurId;
}

export interface Achievement {
  id: string;
  judul: string;
  deskripsi: string;
  tahun: number;
}
