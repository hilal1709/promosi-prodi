"use client";

import { useMemo, useState } from "react";
import { BarChart3, Check, Database, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { WORKSPACE_SCENARIOS } from "@/lib/data/workspace";
import type {
  AuditScenarioContent,
  DataCleanContent,
  DataInsightContent,
  ErpScenarioContent,
  MissionId,
} from "@/lib/types";

const auditContent = WORKSPACE_SCENARIOS.find((item) => item.id === "sc-audit-kepatuhan")
  ?.konten as AuditScenarioContent;
const erpContent = WORKSPACE_SCENARIOS.find((item) => item.id === "sc-erp-inventaris")
  ?.konten as ErpScenarioContent;
const dataCleanContent = WORKSPACE_SCENARIOS.find((item) => item.id === "sc-data-bersihkan")
  ?.konten as DataCleanContent;
const dataInsightContent = WORKSPACE_SCENARIOS.find((item) => item.id === "sc-data-kesimpulan")
  ?.konten as DataInsightContent;

const META = {
  "it-audit": {
    kicker: "MISI 01 · PUSAT KEAMANAN",
    title: "Audit Kontrol Akses",
    color: "#e54b4b",
    Icon: ShieldCheck,
  },
  "enterprise-system": {
    kicker: "MISI 02 · PUSAT OPERASI",
    title: "Selamatkan Inventaris",
    color: "#ffa987",
    Icon: Database,
  },
  "data-science": {
    kicker: "MISI 03 · LABORATORIUM INSIGHT",
    title: "Bersihkan Data Penjualan",
    color: "#444140",
    Icon: BarChart3,
  },
} as const;

function MissionHeader({ missionId, progress }: { missionId: MissionId; progress: number }) {
  const meta = META[missionId];
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl text-white" style={{ background: meta.color }}>
          <meta.Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-black tracking-[0.15em] text-muted-foreground">{meta.kicker}</p>
          <h2 className="text-xl font-black text-foreground sm:text-2xl">{meta.title}</h2>
        </div>
      </div>
      <Progress value={progress} className="mt-4 h-2.5" indicatorClassName="bg-brand-gold" />
    </div>
  );
}

function AffinityStep({
  performance,
  onComplete,
}: {
  performance: number;
  onComplete: (performance: number, affinity: 0 | 15 | 30) => void;
}) {
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

function AuditMission({ onComplete }: { onComplete: (score: number, affinity: 0 | 15 | 30) => void }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState<number | null>(null);
  const selected = Object.values(checked).filter(Boolean).length;

  const submit = () => {
    const mistakes = auditContent.item.filter(
      (item) => Boolean(checked[item.id]) !== item.berisikoJikaTidakDicentang
    ).length;
    setScore(Math.max(0, 100 - mistakes * 20));
  };

  return (
    <>
      <MissionHeader missionId="it-audit" progress={score !== null ? 100 : (selected / auditContent.item.length) * 70} />
      <p className="mt-5 rounded-2xl bg-track-audit-soft p-4 text-sm leading-relaxed text-track-audit-foreground">
        Tim akan merilis sistem pelanggan. Tandai semua kontrol yang wajib tersedia agar akses data tetap aman dan dapat diaudit.
      </p>
      <div className="mt-4 grid gap-2.5">
        {auditContent.item.map((item) => (
          <label
            key={item.id}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-3.5 text-sm transition",
              checked[item.id] ? "border-track-audit bg-track-audit-soft" : "border-border bg-card hover:border-track-audit"
            )}
          >
            <input
              type="checkbox"
              checked={Boolean(checked[item.id])}
              disabled={score !== null}
              onChange={() => setChecked((current) => ({ ...current, [item.id]: !current[item.id] }))}
              className="mt-0.5 h-4 w-4 accent-[var(--track-audit)]"
            />
            <span>
              <strong className="font-bold">{item.label}</strong>
              <span className="mt-1 block text-xs text-muted-foreground">{item.kategori}</span>
            </span>
          </label>
        ))}
      </div>
      {score === null ? (
        <Button className="mt-5" onClick={submit} disabled={selected === 0}>Kirim hasil audit</Button>
      ) : (
        <AffinityStep performance={score} onComplete={onComplete} />
      )}
    </>
  );
}

function ErpMission({ onComplete }: { onComplete: (score: number, affinity: 0 | 15 | 30) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = erpContent.opsi.find((item) => item.id === selectedId);
  const performance = selectedId === "o2" ? 100 : selectedId === "o1" ? 60 : 30;

  return (
    <>
      <MissionHeader missionId="enterprise-system" progress={selected ? 100 : 35} />
      <p className="mt-5 rounded-2xl bg-track-erp-soft p-4 text-sm leading-relaxed text-track-erp-foreground">{erpContent.situasi}</p>
      <p className="mt-4 text-sm font-black text-foreground">Pilih langkah operasionalmu:</p>
      <div className="mt-3 grid gap-2.5">
        {erpContent.opsi.map((item, index) => (
          <button
            key={item.id}
            disabled={Boolean(selected)}
            onClick={() => setSelectedId(item.id)}
            className={cn(
              "flex gap-3 rounded-2xl border-2 p-4 text-left text-sm transition",
              selectedId === item.id ? "border-track-erp bg-track-erp-soft" : "border-border hover:border-track-erp",
              selected && selectedId !== item.id && "opacity-45"
            )}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-navy text-xs font-black text-white">{index + 1}</span>
            <span className="font-semibold leading-relaxed">{item.label}</span>
          </button>
        ))}
      </div>
      {selected && (
        <>
          <div className="mt-4 rounded-2xl border border-track-erp bg-card p-4 text-sm leading-relaxed">
            <p className="font-black text-track-erp-foreground">Dampak keputusan</p>
            <p className="mt-1 text-muted-foreground">{selected.konsekuensi}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-track-erp-soft px-3 py-1">Efisiensi {selected.dampak.efisiensi}</span>
              <span className="rounded-full bg-brand-gold/30 px-3 py-1">Biaya {selected.dampak.biaya}</span>
              <span className="rounded-full bg-track-audit-soft px-3 py-1">Risiko {selected.dampak.risiko}</span>
            </div>
          </div>
          <AffinityStep performance={performance} onComplete={onComplete} />
        </>
      )}
    </>
  );
}

function DataMission({ onComplete }: { onComplete: (score: number, affinity: 0 | 15 | 30) => void }) {
  const dirtyCells = useMemo(
    () => dataCleanContent.baris
      .flatMap((row) => (row.kolomKotor ?? []).map((column) => ({ row, column })))
      .filter(({ row, column }) => `${row.id}:${column}` !== "r2:Unit Terjual"),
    []
  );
  const [fixed, setFixed] = useState<Record<string, boolean>>({});
  const [insightId, setInsightId] = useState<string | null>(null);
  const fixedCount = Object.values(fixed).filter(Boolean).length;
  const cleaned = fixedCount === dirtyCells.length;
  const insight = dataInsightContent.opsi.find((item) => item.id === insightId);
  const performance = 80 + (insight?.benar ? 20 : 0);

  return (
    <>
      <MissionHeader missionId="data-science" progress={(fixedCount / dirtyCells.length) * 80 + (insight ? 20 : 0)} />
      <p className="mt-5 rounded-2xl bg-track-data-soft p-4 text-sm leading-relaxed text-track-data-foreground">
        Temukan empat sel yang tidak konsisten. Klik sel bercahaya untuk memperbaikinya, lalu ambil kesimpulan dari data bersih.
      </p>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead className="bg-brand-navy text-white">
            <tr>{dataCleanContent.kolom.map((column) => <th key={column} className="px-3 py-3 font-bold">{column}</th>)}</tr>
          </thead>
          <tbody>
            {dataCleanContent.baris.map((row) => (
              <tr key={row.id} className="border-t border-border">
                {dataCleanContent.kolom.map((column) => {
                  const key = `${row.id}:${column}`;
                  const dirty = dirtyCells.some((cell) => cell.row.id === row.id && cell.column === column);
                  const isFixed = fixed[key];
                  const value = isFixed ? row.perbaikan?.[column] : row.data[column];
                  return (
                    <td key={column} className="px-3 py-2.5">
                      {dirty ? (
                        <button
                          disabled={isFixed}
                          onClick={() => setFixed((current) => ({ ...current, [key]: true }))}
                          className={cn(
                            "rounded-lg px-2 py-1 font-bold transition",
                            isFixed ? "bg-track-erp-soft text-track-erp-foreground" : "animate-pulse bg-track-data-soft text-track-data-foreground ring-2 ring-track-data"
                          )}
                        >
                          {isFixed && <Check className="mr-1 inline h-3.5 w-3.5" />}{String(value)}
                        </button>
                      ) : String(value)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {cleaned && !insight && (
        <div className="mt-5">
          <p className="text-sm font-black">{dataInsightContent.pertanyaan}</p>
          <div className="mt-3 grid gap-2">
            {dataInsightContent.opsi.map((item) => (
              <button key={item.id} onClick={() => setInsightId(item.id)} className="rounded-2xl border-2 border-border p-3.5 text-left text-sm font-semibold hover:border-track-data hover:bg-track-data-soft">
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {insight && (
        <>
          <div className={cn("mt-4 rounded-2xl p-4 text-sm", insight.benar ? "bg-track-erp-soft text-track-erp-foreground" : "bg-track-audit-soft text-track-audit-foreground")}>
            <p className="font-black">{insight.benar ? "Insight tepat!" : "Data bersih, insight perlu dipertajam."}</p>
            <p className="mt-1 leading-relaxed">{insight.penjelasan}</p>
          </div>
          <AffinityStep performance={performance} onComplete={onComplete} />
        </>
      )}
    </>
  );
}

export default function MissionPanel({
  missionId,
  onComplete,
}: {
  missionId: MissionId;
  onComplete: (performance: number, affinity: 0 | 15 | 30) => void;
}) {
  if (missionId === "it-audit") return <AuditMission onComplete={onComplete} />;
  if (missionId === "enterprise-system") return <ErpMission onComplete={onComplete} />;
  return <DataMission onComplete={onComplete} />;
}
