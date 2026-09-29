export type JalurId = "it-audit" | "enterprise-system" | "data-science";

export type MissionId = JalurId;
export type GamePhase = "start" | "explore" | "mission" | "paused" | "complete";
export type GameQuality = "auto" | "hemat" | "tinggi";
export type GameAvatarId = "arga" | "nara";
/** Orientasi layar pilihan pemain di HP/tablet. */
export type GameOrientation = "auto" | "portrait" | "landscape";

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
  /** Volume musik latar relatif terhadap master (0–1). */
  music: number;
  /** Volume efek suara relatif terhadap master (0–1). */
  sfx: number;
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
  orientation: GameOrientation;
}

export interface TrackMeta {
  id: JalurId;
  nama: string;
  singkatan: string;
  tagline: string;
  deskripsi: string;
  icon: string; // tidak dipakai lagi untuk tampilan; identitas jalur memakai TrackIllustration
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

/** --- Misi Kampus (mini-game) --- */

export interface MissionNpc {
  nama: string;
  peran: string;
  dialog: string[];
}

export interface MissionBrief {
  kicker: string;
  judul: string;
  npc: MissionNpc;
  level: { judul: string; misi: string }[];
  pelajaran: string[];
}

export interface AccessPolicy {
  peran: string;
  hakAkses: string;
}

export interface AccessRequest {
  id: string;
  nama: string;
  peran: string;
  data: string;
  jam: string;
  alasan: string;
  izinkan: boolean;
  konsep: string;
  penjelasan: string;
}

export interface AuditLogEntry {
  id: string;
  waktu: string;
  pengguna: string;
  aksi: string;
  detail: string;
  mencurigakan: boolean;
  temuan?: string;
  konsep?: string;
}

export type RiskLevel = "Tinggi" | "Sedang" | "Rendah";

export interface AuditFinding {
  id: string;
  judul: string;
  risikoBenar: RiskLevel[];
  rekomendasi: string[];
  rekomendasiBenar: number;
  penjelasan: string;
}

export interface ErpModule {
  id: string;
  label: string;
  divisi: string;
  aliranData: string;
}

export interface ErpOrder {
  id: string;
  pelanggan: string;
  jumlah: number;
  muncul: number;
}

export interface ErpEventOption {
  label: string;
  benar: boolean;
  hasil: string;
  stok?: number;
  kepuasan?: number;
  stokSusulan?: number;
}

export interface ErpEvent {
  id: string;
  muncul: number;
  judul: string;
  deskripsi: string;
  konsep: string;
  opsi: ErpEventOption[];
}

export type DataIssueType = "format" | "invalid" | "duplikat" | "kosong";

export interface DataIssue {
  baris: string;
  kolom: string | "*";
  jenis: DataIssueType;
  perbaikan?: string | number;
  /** Untuk duplikat: id baris aslinya (yang dipertahankan). */
  asli?: string;
  penjelasan: string;
}

export interface DataDetectiveTable {
  kolom: string[];
  baris: { id: string; data: Record<string, string | number> }[];
  masalah: DataIssue[];
}

export type ChartKind = "bar" | "line" | "pie";

export interface ChartQuestion {
  id: string;
  pertanyaan: string;
  jawaban: ChartKind;
  penjelasan: string;
  data: { label: string; nilai: number }[];
}

export interface InsightQuestion {
  id: string;
  pertanyaan: string;
  grafik: ChartKind;
  data: { label: string; nilai: number }[];
  opsi: DataInsightOpsi[];
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
