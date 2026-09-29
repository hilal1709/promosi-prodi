"use client";

import { useState } from "react";
import { IconCheck, IconClock, IconSearch, IconX } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ACCESS_POLICIES,
  ACCESS_REQUESTS,
  ACCESS_RULE_NOTE,
  AUDIT_FINDINGS,
  AUDIT_LOGS,
  MISSION_BRIEFS,
} from "@/lib/data/missions";
import type { RiskLevel } from "@/lib/types";
import {
  clampPercent,
  FeedbackToast,
  LevelComplete,
  LevelShell,
  MissionHud,
  MissionRunner,
  useCountdown,
  type Feedback,
  type LevelProps,
  type OnMissionComplete,
} from "./mission-kit";

const LEVELS = MISSION_BRIEFS["it-audit"].level;

function GateLevel({ onFinish }: LevelProps) {
  const total = ACCESS_REQUESTS.length;
  const [index, setIndex] = useState(0);
  const [lives, setLives] = useState(3);
  const [correct, setCorrect] = useState(0);
  const [combo, setCombo] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [shake, setShake] = useState(0);
  const finished = index >= total || lives <= 0;
  const { left } = useCountdown(90, !finished);
  const ended = finished || left <= 0;
  const request = ACCESS_REQUESTS[index];
  const score = clampPercent((correct / total) * 100);

  const decide = (allow: boolean) => {
    if (ended || !request) return;
    const ok = allow === request.izinkan;
    setFeedback({
      ok,
      judul: ok ? (allow ? "Akses diberikan dengan tepat" : "Bagus, akses ditolak!") : allow ? "Harusnya ditolak" : "Harusnya diizinkan",
      teks: request.penjelasan,
      konsep: request.konsep,
    });
    if (ok) {
      setCorrect((value) => value + 1);
      setCombo((value) => value + 1);
    } else {
      setLives((value) => value - 1);
      setCombo(0);
      setShake((value) => value + 1);
    }
    setIndex((value) => value + 1);
  };

  return (
    <LevelShell
      index={0}
      judul={LEVELS[0].judul}
      misi={LEVELS[0].misi}
      hud={<MissionHud timeLeft={left} lives={lives} combo={combo} progress={`${Math.min(index + 1, total)}/${total}`} />}
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_14rem]">
        <div key={shake} className={cn(shake > 0 && "mission-shake")}>
          {!ended && request ? (
            <div key={request.id} className="mission-card-in rounded-3xl border-2 border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-navy text-lg font-black text-white">{request.nama[0]}</span>
                <div>
                  <p className="font-black">{request.nama}</p>
                  <p className="text-xs font-bold text-muted-foreground">{request.peran}</p>
                </div>
                <span className="ml-auto rounded-full bg-muted px-3 py-1 text-xs font-black tabular-nums"><IconClock className="mr-1 inline h-3.5 w-3.5" />{request.jam}</span>
              </div>
              <dl className="mt-4 grid gap-2 text-sm">
                <div className="rounded-2xl bg-track-audit-soft/60 p-3">
                  <dt className="text-xs font-bold text-muted-foreground">Meminta akses ke</dt>
                  <dd className="font-black">{request.data}</dd>
                </div>
                <div className="rounded-2xl bg-muted/60 p-3">
                  <dt className="text-xs font-bold text-muted-foreground">Alasan</dt>
                  <dd className="font-semibold">“{request.alasan}”</dd>
                </div>
              </dl>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button onClick={() => decide(false)} className="h-12 bg-track-audit text-white hover:bg-track-audit/90">
                  Tolak
                </Button>
                <Button onClick={() => decide(true)} className="h-12 bg-emerald-600 text-white hover:bg-emerald-700">
                  Izinkan
                </Button>
              </div>
            </div>
          ) : (
            <LevelComplete
              score={score}
              reason={lives <= 0 ? "Nyawa habis" : left <= 0 && index < total ? "Waktu habis" : "Gerbang aman!"}
              detail={`${correct} dari ${total} keputusan tepat.`}
              onNext={() => onFinish(score)}
            />
          )}
        </div>
        <aside className="rounded-3xl bg-brand-navy p-4 text-white">
          <p className="text-xs font-black tracking-[0.15em] text-brand-gold">KEBIJAKAN AKSES</p>
          <ul className="mt-2 grid gap-1.5 text-xs">
            {ACCESS_POLICIES.map((policy) => (
              <li key={policy.peran} className="rounded-xl bg-white/8 px-2.5 py-1.5">
                <span className="font-black">{policy.peran}</span>
                <span className="block text-white/65">{policy.hakAkses}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs leading-relaxed text-brand-gold">{ACCESS_RULE_NOTE}</p>
        </aside>
      </div>
      <FeedbackToast feedback={feedback} />
    </LevelShell>
  );
}

function LogLevel({ onFinish }: LevelProps) {
  const target = AUDIT_LOGS.filter((log) => log.mencurigakan).length;
  const [found, setFound] = useState<string[]>([]);
  const [wrong, setWrong] = useState(0);
  const [flash, setFlash] = useState<{ id: string; n: number } | null>(null);
  const [combo, setCombo] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const finished = found.length >= target;
  const { left, penalize } = useCountdown(90, !finished);
  const ended = finished || left <= 0;
  const score = clampPercent((found.length / target) * 100 - wrong * 5);

  const inspect = (id: string) => {
    if (ended || found.includes(id)) return;
    const log = AUDIT_LOGS.find((item) => item.id === id)!;
    if (log.mencurigakan) {
      setFound((current) => [...current, id]);
      setCombo((value) => value + 1);
      setFeedback({ ok: true, judul: `Temuan: ${log.temuan}`, teks: `${log.pengguna} · ${log.detail}`, konsep: log.konsep });
    } else {
      penalize(5);
      setWrong((value) => value + 1);
      setCombo(0);
      setFlash((current) => ({ id, n: (current?.n ?? 0) + 1 }));
      setFeedback({ ok: false, judul: "Aktivitas ini normal (−5 detik)", teks: "Sesuai peran dan jam kerja. Cari pola yang janggal: jam, jumlah data, atau status akun." });
    }
  };

  return (
    <LevelShell
      index={1}
      judul={LEVELS[1].judul}
      misi={LEVELS[1].misi}
      hud={<MissionHud timeLeft={left} combo={combo} progress={`${found.length}/${target} temuan`} />}
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="hidden grid-cols-[3.5rem_11rem_6.5rem_1fr] gap-2 bg-brand-navy px-3 py-2.5 text-xs font-black text-white sm:grid">
          <span>Jam</span><span>Pengguna</span><span>Aksi</span><span>Detail</span>
        </div>
        <ul>
          {AUDIT_LOGS.map((log) => {
            const isFound = found.includes(log.id);
            const isFlash = flash?.id === log.id;
            return (
              <li key={log.id} className="border-t border-border first:border-t-0">
                <button
                  key={isFlash ? flash.n : 0}
                  disabled={ended && !isFound}
                  onClick={() => inspect(log.id)}
                  className={cn(
                    "grid w-full grid-cols-[3.5rem_1fr] gap-x-2 gap-y-0.5 px-3 py-2.5 text-left text-xs transition sm:grid-cols-[3.5rem_11rem_6.5rem_1fr] sm:text-sm",
                    isFound ? "bg-track-audit-soft font-bold text-track-audit-foreground" : "hover:bg-muted",
                    isFlash && "mission-shake bg-muted"
                  )}
                >
                  <span className="font-mono tabular-nums">{log.waktu}</span>
                  <span className="truncate font-semibold">{log.pengguna}</span>
                  <span className="col-start-2 sm:col-start-auto">{log.aksi}</span>
                  <span className="col-start-2 flex items-center gap-1.5 text-muted-foreground sm:col-start-auto">
                    {isFound && <IconSearch className="h-3.5 w-3.5 shrink-0 text-track-audit" />}{log.detail}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <FeedbackToast feedback={feedback} />
      {ended && (
        <LevelComplete
          score={score}
          reason={finished ? "Semua jejak ditemukan" : "Waktu habis"}
          detail={`${found.length}/${target} temuan · ${wrong} klik keliru.`}
          onNext={() => onFinish(score)}
        />
      )}
    </LevelShell>
  );
}

const RISKS: RiskLevel[] = ["Tinggi", "Sedang", "Rendah"];

function ReportLevel({ onFinish }: LevelProps) {
  const [answers, setAnswers] = useState<Record<string, { risk?: RiskLevel; rec?: number }>>({});
  const [submitted, setSubmitted] = useState(false);
  const complete = AUDIT_FINDINGS.every((item) => answers[item.id]?.risk && answers[item.id]?.rec !== undefined);
  const points = AUDIT_FINDINGS.reduce((sum, item) => {
    const answer = answers[item.id];
    return sum + (answer?.risk && item.risikoBenar.includes(answer.risk) ? 1 : 0) + (answer?.rec === item.rekomendasiBenar ? 1 : 0);
  }, 0);
  const score = clampPercent((points / (AUDIT_FINDINGS.length * 2)) * 100);

  const set = (id: string, patch: { risk?: RiskLevel; rec?: number }) => {
    if (submitted) return;
    setAnswers((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  };

  return (
    <LevelShell
      index={2}
      judul={LEVELS[2].judul}
      misi={LEVELS[2].misi}
      hud={<MissionHud progress={`${Object.values(answers).filter((a) => a.risk && a.rec !== undefined).length}/${AUDIT_FINDINGS.length} terisi`} />}
    >
      <div className="grid gap-3">
        {AUDIT_FINDINGS.map((item, index) => {
          const answer = answers[item.id] ?? {};
          const riskOk = answer.risk && item.risikoBenar.includes(answer.risk);
          const recOk = answer.rec === item.rekomendasiBenar;
          return (
            <article key={item.id} className="rounded-3xl border border-border bg-card p-4">
              <p className="text-xs font-black tracking-wide text-muted-foreground">TEMUAN {index + 1}</p>
              <p className="font-black">{item.judul}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">Risiko:</span>
                {RISKS.map((risk) => (
                  <button
                    key={risk}
                    onClick={() => set(item.id, { risk })}
                    className={cn(
                      "rounded-full border-2 px-3 py-1 text-xs font-black transition",
                      answer.risk === risk ? "border-brand-navy bg-brand-navy text-white" : "border-border hover:border-brand-navy",
                      submitted && item.risikoBenar.includes(risk) && "ring-2 ring-emerald-500 ring-offset-1"
                    )}
                  >
                    {risk}
                  </button>
                ))}
              </div>
              <div className="mt-3 grid gap-1.5">
                {item.rekomendasi.map((rec, recIndex) => (
                  <button
                    key={rec}
                    onClick={() => set(item.id, { rec: recIndex })}
                    className={cn(
                      "flex items-center gap-2 rounded-2xl border-2 px-3 py-2 text-left text-sm font-semibold transition",
                      answer.rec === recIndex ? "border-track-audit bg-track-audit-soft" : "border-border hover:border-track-audit",
                      submitted && recIndex === item.rekomendasiBenar && "border-emerald-500 bg-emerald-50"
                    )}
                  >
                    {submitted && recIndex === item.rekomendasiBenar && <IconCheck className="h-4 w-4 shrink-0 text-emerald-600" />}
                    {rec}
                  </button>
                ))}
              </div>
              {submitted && (
                <p className={cn("mt-3 flex gap-2 rounded-2xl p-3 text-sm", riskOk && recOk ? "bg-emerald-50 text-emerald-900" : "bg-muted")}>
                  {riskOk && recOk ? <IconCheck className="mt-0.5 h-4 w-4 shrink-0" /> : <IconX className="mt-0.5 h-4 w-4 shrink-0" />}
                  {item.penjelasan}
                </p>
              )}
            </article>
          );
        })}
      </div>
      {!submitted ? (
        <Button className="mt-4" disabled={!complete} onClick={() => setSubmitted(true)}>
          Kirim laporan audit
        </Button>
      ) : (
        <LevelComplete
          score={score}
          reason="Laporan terkirim"
          detail={`${points} dari ${AUDIT_FINDINGS.length * 2} penilaian tepat.`}
          isLast
          onNext={() => onFinish(score)}
        />
      )}
    </LevelShell>
  );
}

export default function AuditMission({ onComplete }: { onComplete: OnMissionComplete }) {
  return <MissionRunner missionId="it-audit" levels={[GateLevel, LogLevel, ReportLevel]} onComplete={onComplete} />;
}
