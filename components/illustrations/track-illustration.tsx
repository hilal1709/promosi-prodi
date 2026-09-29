import type { JalurId } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAVY = "#1e1e24";
const RED = "#e54b4b";
const PEACH = "#ffa987";
const STONE = "#444140";
const PAPER = "#ffffff";

/** Ilustrasi identitas jalur: IT Audit, Enterprise System, dan Data Science. */
export function TrackIllustration({ id, className, title }: { id: JalurId; className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 96 96"
      className={cn("h-16 w-16 shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {id === "it-audit" && <AuditScene />}
      {id === "enterprise-system" && <ErpScene />}
      {id === "data-science" && <DataScene />}
    </svg>
  );
}

/** Dokumen diperiksa kaca pembesar, dijaga perisai berlubang kunci. */
function AuditScene() {
  return (
    <>
      <rect width="96" height="96" rx="24" fill="#fce0dc" />
      <rect x="18" y="16" width="40" height="52" rx="6" fill={PAPER} stroke={NAVY} strokeWidth="3" />
      <path d="M26 28h24M26 36h24M26 44h14" stroke={NAVY} strokeWidth="3" strokeLinecap="round" opacity=".35" />
      <path d="M26 52h10" stroke={RED} strokeWidth="3" strokeLinecap="round" />
      <path d="M56 46c7 0 12-3 12-3s5 3 12 3v10c0 10-6 17-12 20-6-3-12-10-12-20V46Z" fill={RED} stroke={NAVY} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="68" cy="58" r="3.5" fill={PAPER} />
      <path d="M68 60v6" stroke={PAPER} strokeWidth="3" strokeLinecap="round" />
      <circle cx="54" cy="26" r="11" fill="#ffffffcc" stroke={NAVY} strokeWidth="3" />
      <path d="M62 34l8 8" stroke={NAVY} strokeWidth="4" strokeLinecap="round" />
    </>
  );
}

/** Tiga modul bisnis tersambung ke satu pusat data. */
function ErpScene() {
  return (
    <>
      <rect width="96" height="96" rx="24" fill="#fff0ea" />
      <path d="M48 48 26 26M48 48l22-22M48 48v24" stroke={NAVY} strokeWidth="3" strokeDasharray="4 4" />
      <rect x="12" y="14" width="26" height="22" rx="6" fill={PEACH} stroke={NAVY} strokeWidth="3" />
      <path d="M18 22h14M18 28h8" stroke={NAVY} strokeWidth="2.5" strokeLinecap="round" />
      <rect x="58" y="14" width="26" height="22" rx="6" fill={RED} stroke={NAVY} strokeWidth="3" />
      <path d="M64 30v-6M70 30v-10M76 30v-4" stroke={PAPER} strokeWidth="3" strokeLinecap="round" />
      <rect x="35" y="64" width="26" height="20" rx="6" fill={STONE} stroke={NAVY} strokeWidth="3" />
      <path d="M41 70h14M41 76h10" stroke={PAPER} strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="48" cy="44" rx="11" ry="4" fill={PAPER} stroke={NAVY} strokeWidth="3" />
      <path d="M37 44v8c0 2.2 4.9 4 11 4s11-1.8 11-4v-8" fill={PAPER} stroke={NAVY} strokeWidth="3" />
    </>
  );
}

/** Papan grafik batang dengan garis tren dan diagram lingkaran kecil. */
function DataScene() {
  return (
    <>
      <rect width="96" height="96" rx="24" fill="#eee9e7" />
      <rect x="14" y="18" width="60" height="54" rx="6" fill={PAPER} stroke={NAVY} strokeWidth="3" />
      <rect x="22" y="48" width="9" height="16" rx="2" fill={STONE} />
      <rect x="36" y="40" width="9" height="24" rx="2" fill={PEACH} />
      <rect x="50" y="30" width="9" height="34" rx="2" fill={RED} />
      <path d="M22 40l14-9 12 4 14-11" fill="none" stroke={NAVY} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="62" cy="24" r="3" fill={NAVY} />
      <circle cx="70" cy="70" r="14" fill={PEACH} stroke={NAVY} strokeWidth="3" />
      <path d="M70 56v14h14a14 14 0 0 0-14-14Z" fill={NAVY} />
    </>
  );
}
