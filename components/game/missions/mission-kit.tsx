"use client";

import { useCallback, useEffect, useState, type ComponentType, type CSSProperties, type ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Check,
  Database,
  Flame,
  GraduationCap,
  Heart,
  ShieldCheck,
  Sparkles,
  Star,
  Timer,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CURRICULUM } from "@/lib/data/curriculum";
import { MISSION_BRIEFS } from "@/lib/data/missions";
import { TRACKS } from "@/lib/data/tracks";
import type { MissionBrief, MissionId } from "@/lib/types";

export type Affinity = 0 | 15 | 30;
export type OnMissionComplete = (performance: number, affinity: Affinity) => void;
export type LevelProps = { onFinish: (score: number) => void };

export const MISSION_THEME = {
  "it-audit": { color: "#e54b4b", soft: "#fce0dc", ink: "#ffffff", Icon: ShieldCheck },
  "enterprise-system": { color: "#ffa987", soft: "#fff0ea", ink: "#1e1e24", Icon: Database },
  "data-science": { color: "#444140", soft: "#eee9e7", ink: "#ffffff", Icon: BarChart3 },
} as const;

export function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function starsFor(score: number) {
  return score >= 85 ? 3 : score >= 60 ? 2 : score >= 30 ? 1 : 0;
}

/**
 * Hitung mundur per detik. `running` bisa berupa fungsi dari sisa waktu, untuk
 * level yang jedanya bergantung pada waktu itu sendiri. `penalize` memotong sisa waktu.
 */
export function useCountdown(seconds: number, running: boolean | ((left: number) => boolean)) {
  const [left, setLeft] = useState(seconds);
  const active = typeof running === "function" ? running(left) : running;
  useEffect(() => {
    if (!active || left <= 0) return;
    const id = window.setTimeout(() => setLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [active, left]);
  const penalize = useCallback((amount: number) => setLeft((value) => Math.max(0, value - amount)), []);
  return { left, penalize };
}

function Stars({ count, size = "h-6 w-6" }: { count: number; size?: string }) {
  return (
    <span className="inline-flex gap-1" aria-label={`${count} dari 3 bintang`}>
      {[0, 1, 2].map((index) => (
        <Star
          key={index}
          className={cn(size, index < count ? "fill-brand-gold text-brand-gold" : "text-border")}
        />
      ))}
    </span>
  );
}

function TypedLine({ text }: { text: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (count >= text.length) return;
    const id = window.setTimeout(() => setCount((value) => Math.min(text.length, value + 2)), 16);
    return () => window.clearTimeout(id);
  }, [count, text.length]);
  return (
    <p className="min-h-[4.5rem] text-sm leading-relaxed sm:text-base" onClick={() => setCount(text.length)}>
      {text.slice(0, count)}
      {count < text.length && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-current align-middle" />}
    </p>
  );
}

export function MissionIntro({
  missionId,
  onStart,
  brief = MISSION_BRIEFS[missionId],
}: {
  missionId: MissionId;
  onStart: () => void;
  brief?: MissionBrief;
}) {
  const [line, setLine] = useState(0);
  const lastLine = line >= brief.npc.dialog.length - 1;
  const initials = brief.npc.nama.split(" ").map((word) => word[0]).join("");

  return (
    <div className="mt-5">
      <div className="flex gap-3 rounded-3xl bg-brand-navy p-4 text-white sm:p-5">
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-black"
          style={{ background: "var(--mission)", color: "var(--mission-ink)" }}
          aria-hidden
        >
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black">
            {brief.npc.nama} <span className="font-semibold text-white/60">· {brief.npc.peran}</span>
          </p>
          <div className="mt-1.5" aria-live="polite">
            <TypedLine key={line} text={brief.npc.dialog[line]} />
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-white/50">{line + 1}/{brief.npc.dialog.length}</span>
            <div className="flex gap-2">
              {!lastLine && (
                <button onClick={() => setLine(brief.npc.dialog.length - 1)} className="rounded-full px-3 py-1.5 text-xs font-bold text-white/60 hover:text-white">
                  Lewati
                </button>
              )}
              <button
                onClick={() => (lastLine ? onStart() : setLine((value) => value + 1))}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-gold px-4 py-1.5 text-sm font-black text-brand-navy transition hover:brightness-105"
              >
                {lastLine ? "Mulai misi" : "Lanjut"} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <ol className="mt-4 grid gap-2 sm:grid-cols-3">
        {brief.level.map((item, index) => (
          <li key={item.judul} className="rounded-2xl border border-border bg-card p-3 text-sm">
            <p className="text-xs font-black tracking-wide text-muted-foreground">LEVEL {index + 1}</p>
            <p className="mt-0.5 font-black">{item.judul}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.misi}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function MissionHud({
  timeLeft,
  lives,
  maxLives = 3,
  combo,
  progress,
}: {
  timeLeft?: number;
  lives?: number;
  maxLives?: number;
  combo?: number;
  progress?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-black">
      {timeLeft !== undefined && (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-3 py-1.5 tabular-nums",
            timeLeft <= 10 ? "animate-pulse bg-track-audit text-white" : "bg-brand-navy text-white"
          )}
          aria-label={`Sisa waktu ${timeLeft} detik`}
        >
          <Timer className="h-3.5 w-3.5" /> {timeLeft}s
        </span>
      )}
      {lives !== undefined && (
        <span className="inline-flex items-center gap-0.5 rounded-full bg-card px-2.5 py-1.5 ring-1 ring-border" aria-label={`Nyawa ${lives} dari ${maxLives}`}>
          {Array.from({ length: maxLives }, (_, index) => (
            <Heart key={index} className={cn("h-3.5 w-3.5", index < lives ? "fill-track-audit text-track-audit" : "text-border")} />
          ))}
        </span>
      )}
      {progress && <span className="rounded-full bg-card px-3 py-1.5 ring-1 ring-border">{progress}</span>}
      {combo !== undefined && combo >= 2 && (
        <span key={combo} className="mission-pop inline-flex items-center gap-1 rounded-full bg-brand-gold px-3 py-1.5 text-brand-navy">
          <Flame className="h-3.5 w-3.5" /> Combo ×{combo}
        </span>
      )}
    </div>
  );
}

export function LevelShell({
  index,
  judul,
  misi,
  hud,
  children,
}: {
  index: number;
  judul: string;
  misi: string;
  hud?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black tracking-[0.15em] text-muted-foreground">LEVEL {index + 1} / 3</p>
          <h3 className="text-lg font-black">{judul}</h3>
          <p className="text-sm text-muted-foreground">{misi}</p>
        </div>
        {hud}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export type Feedback = { ok: boolean; judul: string; teks: string; konsep?: string } | null;

export function FeedbackToast({ feedback }: { feedback: Feedback }) {
  return (
    <div aria-live="polite" className="min-h-[1px]">
      {feedback && (
        <div
          key={`${feedback.judul}-${feedback.teks}`}
          className={cn(
            "mt-3 flex gap-3 rounded-2xl p-3.5 text-sm animate-in fade-in slide-in-from-bottom-2 duration-300",
            feedback.ok ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200" : "bg-track-audit-soft text-track-audit-foreground ring-1 ring-track-audit/30"
          )}
        >
          <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white", feedback.ok ? "bg-emerald-600" : "bg-track-audit")}>
            {feedback.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
          </span>
          <div className="min-w-0">
            <p className="font-black">
              {feedback.judul}
              {feedback.konsep && (
                <span className="ml-2 rounded-full bg-white/80 px-2 py-0.5 text-[0.7rem] font-black tracking-wide text-brand-navy">
                  {feedback.konsep}
                </span>
              )}
            </p>
            <p className="mt-0.5 leading-relaxed">{feedback.teks}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function LevelComplete({
  score,
  reason,
  detail,
  isLast,
  onNext,
}: {
  score: number;
  reason?: string;
  detail?: string;
  isLast?: boolean;
  onNext: () => void;
}) {
  return (
    <div className="mission-pop mt-4 rounded-3xl bg-brand-navy p-5 text-center text-white">
      {reason && <p className="text-xs font-black tracking-[0.15em] text-brand-gold">{reason.toUpperCase()}</p>}
      <div className="mt-2 flex justify-center"><Stars count={starsFor(score)} size="h-8 w-8" /></div>
      <p className="mt-2 text-3xl font-black tabular-nums">{score}<span className="text-base text-white/60">/100</span></p>
      {detail && <p className="mx-auto mt-1 max-w-md text-sm text-white/70">{detail}</p>}
      <Button onClick={onNext} className="mt-4 bg-brand-gold text-brand-navy hover:bg-brand-gold/90">
        {isLast ? "Lihat hasil misi" : "Level berikutnya"} <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function AffinityStep({ performance, onComplete }: { performance: number; onComplete: OnMissionComplete }) {
  return (
    <div className="mt-5 rounded-3xl bg-brand-navy p-5 text-white">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 text-brand-gold" />
        <div>
          <p className="font-black">Misi selesai · skor {performance}</p>
          <p className="mt-1 text-sm leading-relaxed text-white/70">Seberapa cocok aktivitas ini dengan hal yang ingin kamu pelajari?</p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {([
          [0, "Kurang cocok"],
          [15, "Menarik"],
          [30, "Ini aku banget"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            onClick={() => onComplete(performance, value)}
            className="rounded-2xl border border-white/15 bg-white/8 px-3 py-3 text-sm font-bold transition hover:border-brand-gold hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function LearningCard({
  missionId,
  scores,
  performance,
  brief = MISSION_BRIEFS[missionId],
}: {
  missionId: MissionId;
  scores: number[];
  performance: number;
  brief?: MissionBrief;
}) {
  return (
    <div className="mt-5 grid gap-3">
      <div className="mission-pop rounded-3xl border-2 p-5 text-center" style={{ borderColor: "var(--mission)", background: "var(--mission-soft)" }}>
        <Stars count={starsFor(performance)} size="h-9 w-9" />
        <p className="mt-2 text-4xl font-black tabular-nums">{performance}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs font-bold">
          {brief.level.map((item, index) => (
            <span key={item.judul} className="rounded-full bg-card px-3 py-1 ring-1 ring-border">
              {item.judul} · {scores[index] ?? 0}
            </span>
          ))}
        </div>
      </div>
      <div className="rounded-3xl border border-border bg-card p-5">
        <p className="flex items-center gap-2 font-black"><Sparkles className="h-4 w-4 text-brand-gold" /> Yang barusan kamu pelajari</p>
        <ul className="mt-3 grid gap-2 text-sm leading-relaxed">
          {brief.pelajaran.map((item) => (
            <li key={item} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{item}</li>
          ))}
        </ul>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-4">
          <p className="flex items-center gap-2 text-sm font-black"><GraduationCap className="h-4 w-4" /> Mata kuliah terkait</p>
          <ul className="mt-2 grid gap-1 text-sm text-muted-foreground">
            {CURRICULUM[missionId].mataKuliahInti.slice(0, 3).map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </div>
        <div className="rounded-3xl border border-border bg-card p-4">
          <p className="flex items-center gap-2 text-sm font-black"><Briefcase className="h-4 w-4" /> Contoh profesi</p>
          <ul className="mt-2 grid gap-1 text-sm text-muted-foreground">
            {TRACKS[missionId].prospekKarier.slice(0, 3).map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** Alur umum misi: intro NPC → 3 level → kartu belajar → pilihan minat. */
export function MissionRunner({
  missionId,
  levels,
  onComplete,
}: {
  missionId: MissionId;
  levels: ComponentType<LevelProps>[];
  onComplete: OnMissionComplete;
}) {
  const brief = MISSION_BRIEFS[missionId];
  const theme = MISSION_THEME[missionId];
  const [stage, setStage] = useState(-1);
  const [scores, setScores] = useState<number[]>([]);
  const done = stage >= levels.length;
  const performance = clampPercent(scores.reduce((sum, value) => sum + value, 0) / levels.length);
  const Level = !done && stage >= 0 ? levels[stage] : null;

  const finishLevel = (score: number) => {
    setScores((current) => [...current, clampPercent(score)]);
    setStage((current) => current + 1);
  };

  return (
    <div className="min-w-0" style={{ "--mission": theme.color, "--mission-soft": theme.soft, "--mission-ink": theme.ink } as CSSProperties}>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: theme.color, color: theme.ink }}>
          <theme.Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-black tracking-[0.15em] text-muted-foreground">{brief.kicker}</p>
          <h2 className="text-xl font-black text-foreground sm:text-2xl">{brief.judul}</h2>
        </div>
      </div>
      <Progress value={done ? 100 : (Math.max(0, stage) / levels.length) * 100} className="mt-4 h-2.5" indicatorClassName="bg-brand-gold" />

      {stage === -1 && <MissionIntro missionId={missionId} onStart={() => setStage(0)} />}
      {Level && <Level key={stage} onFinish={finishLevel} />}
      {done && (
        <>
          <LearningCard missionId={missionId} scores={scores} performance={performance} />
          <AffinityStep performance={performance} onComplete={onComplete} />
        </>
      )}
    </div>
  );
}
