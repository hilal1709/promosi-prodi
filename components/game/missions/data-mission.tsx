"use client";

import { useState } from "react";
import { ArrowRight, BarChart3, Check, LineChart, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CHART_QUESTIONS,
  DATA_ISSUE_LABELS,
  DATA_TABLE,
  INSIGHT_QUESTIONS,
  MISSION_BRIEFS,
} from "@/lib/data/missions";
import type { ChartKind, DataIssueType } from "@/lib/types";
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

const LEVELS = MISSION_BRIEFS["data-science"].level;
const PALETTE = ["#444140", "#ffa987", "#e54b4b", "#8a8483"];

const issueKey = (row: string, column: string) => `${row}:${column}`;

function findIssue(row: string, column: string) {
  return DATA_TABLE.masalah.find((issue) => issue.baris === row && (issue.kolom === column || issue.kolom === "*"));
}

function CleanLevel({ onFinish }: LevelProps) {
  const total = DATA_TABLE.masalah.length;
  const [fixed, setFixed] = useState<string[]>([]);
  const [selected, setSelected] = useState<{ row: string; column: string } | null>(null);
  const [wrong, setWrong] = useState(0);
  const [combo, setCombo] = useState(0);
  const [shake, setShake] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const finished = fixed.length >= total;
  const { left, penalize } = useCountdown(90, !finished);
  const ended = finished || left <= 0;
  const score = clampPercent((fixed.length / total) * 100 - wrong * 5);

  const isFixed = (row: string, column: string) => {
    const issue = findIssue(row, column);
    return Boolean(issue && fixed.includes(issueKey(issue.baris, issue.kolom)));
  };

  const miss = (judul: string, teks: string) => {
    penalize(5);
    setWrong((value) => value + 1);
    setCombo(0);
    setShake((value) => value + 1);
    setFeedback({ ok: false, judul: `${judul} (−5 detik)`, teks });
  };

  const diagnose = (answer: DataIssueType | "bersih") => {
    if (!selected || ended) return;
    const issue = findIssue(selected.row, selected.column);
    if (!issue) {
      if (answer === "duplikat" && DATA_TABLE.masalah.some((item) => item.asli === selected.row)) {
        setFeedback({ ok: false, judul: "Hampir!", teks: "Baris ini memang punya kembaran, tapi ini data aslinya. Tandai salinan yang muncul belakangan." });
        return;
      }
      if (answer === "bersih") {
        setFeedback({ ok: true, judul: "Betul, sel ini bersih", teks: "Cari sel lain yang terlihat janggal." });
        setSelected(null);
      } else {
        miss("Sel ini sebenarnya bersih", "Bandingkan dengan baris lain: format, nilai, dan kelengkapannya sudah wajar.");
      }
      return;
    }
    if (answer === issue.jenis) {
      setFixed((current) => [...current, issueKey(issue.baris, issue.kolom)]);
      setCombo((value) => value + 1);
      setFeedback({ ok: true, judul: "Diperbaiki!", teks: issue.penjelasan, konsep: DATA_ISSUE_LABELS[issue.jenis] });
      setSelected(null);
    } else {
      miss(answer === "bersih" ? "Ada yang janggal di sel ini" : "Jenis masalahnya belum tepat", "Perhatikan lagi baik-baik, lalu coba jenis lain.");
    }
  };

  const selectedValue = selected ? DATA_TABLE.baris.find((row) => row.id === selected.row)?.data[selected.column] : undefined;

  return (
    <LevelShell
      index={0}
      judul={LEVELS[0].judul}
      misi={LEVELS[0].misi}
      hud={<MissionHud timeLeft={left} combo={combo} progress={`${fixed.length}/${total} masalah`} />}
    >
      <div className="overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="w-full min-w-[24rem] text-left text-sm">
          <thead className="bg-brand-navy text-white">
            <tr>
              <th className="px-2 py-2.5 text-xs font-bold">#</th>
              {DATA_TABLE.kolom.map((column) => <th key={column} className="px-2 py-2.5 text-xs font-bold">{column}</th>)}
            </tr>
          </thead>
          <tbody>
            {DATA_TABLE.baris.map((row, rowIndex) => {
              const rowRemoved = isFixed(row.id, "*") && findIssue(row.id, "*")?.jenis === "duplikat";
              return (
                <tr key={row.id} className={cn("border-t border-border transition", rowRemoved && "bg-muted/60 line-through opacity-40")}>
                  <td className="px-2 py-1.5 text-xs text-muted-foreground">{rowIndex + 1}</td>
                  {DATA_TABLE.kolom.map((column) => {
                    const issue = findIssue(row.id, column);
                    const cellFixed = !rowRemoved && isFixed(row.id, column) && issue?.perbaikan !== undefined;
                    const raw = cellFixed ? issue!.perbaikan! : row.data[column];
                    const isSelected = selected?.row === row.id && selected.column === column;
                    return (
                      <td key={column} className="px-0.5 py-1">
                        <button
                          disabled={ended || rowRemoved || cellFixed}
                          onClick={() => setSelected({ row: row.id, column })}
                          className={cn(
                            "w-full whitespace-nowrap rounded-lg px-1.5 py-1.5 text-left font-mono text-xs transition sm:text-sm",
                            cellFixed ? "bg-emerald-50 font-bold text-emerald-800" : "hover:bg-track-data-soft",
                            isSelected && "bg-track-data-soft ring-2 ring-track-data"
                          )}
                        >
                          {cellFixed && <Check className="mr-1 inline h-3.5 w-3.5" />}
                          {raw === "" ? <span className="italic text-muted-foreground">(kosong)</span> : String(raw)}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!ended && (
        <div key={shake} className={cn("mt-3 rounded-3xl bg-brand-navy p-4 text-white", shake > 0 && "mission-shake")}>
          {selected ? (
            <>
              <p className="text-sm">
                Sel <span className="font-black">{selected.column}</span> berisi{" "}
                <code className="rounded bg-white/15 px-1.5 py-0.5 font-bold">“{String(selectedValue)}”</code>. Apa masalahnya?
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {(Object.keys(DATA_ISSUE_LABELS) as DataIssueType[]).map((type) => (
                  <button key={type} onClick={() => diagnose(type)} className="rounded-2xl bg-white/10 px-3 py-2 text-xs font-bold transition hover:bg-brand-gold hover:text-brand-navy">
                    {DATA_ISSUE_LABELS[type]}
                  </button>
                ))}
                <button onClick={() => diagnose("bersih")} className="rounded-2xl border border-white/25 px-3 py-2 text-xs font-bold transition hover:bg-white/15">
                  Tidak ada masalah
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-white/75">Klik sel yang menurutmu janggal. Petunjuk: ada masalah format, nilai tidak masuk akal, data kosong, dan satu baris kembar.</p>
          )}
        </div>
      )}
      <FeedbackToast feedback={feedback} />
      {ended && (
        <LevelComplete
          score={score}
          reason={finished ? "Data bersih berkilau" : "Waktu habis"}
          detail={`${fixed.length}/${total} masalah diperbaiki · ${wrong} tebakan keliru.`}
          onNext={() => onFinish(score)}
        />
      )}
    </LevelShell>
  );
}

export function MiniChart({ kind, data }: { kind: ChartKind; data: { label: string; nilai: number }[] }) {
  const width = 340;
  const height = 190;
  const pad = { top: 22, right: 12, bottom: 30, left: 12 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  if (kind === "pie") {
    const sum = data.reduce((total, item) => total + item.nilai, 0);
    const starts = data.map((_, index) =>
      -Math.PI / 2 + data.slice(0, index).reduce((total, item) => total + (item.nilai / sum) * Math.PI * 2, 0)
    );
    const cx = 95;
    const cy = height / 2;
    const r = 72;
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="mission-pop h-auto w-full" role="img" aria-label="Grafik lingkaran">
        {data.map((item, index) => {
          const slice = (item.nilai / sum) * Math.PI * 2;
          const x1 = cx + r * Math.cos(starts[index]);
          const y1 = cy + r * Math.sin(starts[index]);
          const x2 = cx + r * Math.cos(starts[index] + slice);
          const y2 = cy + r * Math.sin(starts[index] + slice);
          return (
            <path
              key={item.label}
              d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${slice > Math.PI ? 1 : 0} 1 ${x2},${y2} Z`}
              fill={PALETTE[index % PALETTE.length]}
              stroke="white"
              strokeWidth={2}
            />
          );
        })}
        {data.map((item, index) => (
          <g key={item.label} transform={`translate(190, ${50 + index * 30})`}>
            <rect width={14} height={14} rx={4} fill={PALETTE[index % PALETTE.length]} />
            <text x={22} y={12} fontSize={13} fontWeight={700} fill="#1e1e24">{item.label} · {Math.round((item.nilai / sum) * 100)}%</text>
          </g>
        ))}
      </svg>
    );
  }

  const max = Math.max(...data.map((item) => item.nilai));
  const min = kind === "line" ? Math.min(...data.map((item) => item.nilai)) * 0.9 : 0;
  const y = (value: number) => pad.top + innerH - ((value - min) / (max - min || 1)) * innerH;
  const step = innerW / data.length;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mission-pop h-auto w-full" role="img" aria-label={kind === "bar" ? "Grafik batang" : "Grafik garis"}>
      <line x1={pad.left} x2={width - pad.right} y1={pad.top + innerH} y2={pad.top + innerH} stroke="#d9cfcc" />
      {kind === "bar" &&
        data.map((item, index) => {
          const barW = step * 0.62;
          const x = pad.left + index * step + (step - barW) / 2;
          const top = y(item.nilai);
          return (
            <g key={item.label}>
              <rect x={x} y={top} width={barW} height={Math.max(2, pad.top + innerH - top)} rx={5} fill={item.nilai === 0 ? PALETTE[2] : PALETTE[0]} />
              <text x={x + barW / 2} y={top - 5} textAnchor="middle" fontSize={11} fontWeight={800} fill="#1e1e24">{item.nilai}</text>
            </g>
          );
        })}
      {kind === "line" && (
        <>
          <polyline
            fill="none"
            stroke={PALETTE[0]}
            strokeWidth={3}
            strokeLinejoin="round"
            points={data.map((item, index) => `${pad.left + index * step + step / 2},${y(item.nilai)}`).join(" ")}
          />
          {data.map((item, index) => (
            <g key={item.label}>
              <circle cx={pad.left + index * step + step / 2} cy={y(item.nilai)} r={5} fill={PALETTE[1]} stroke={PALETTE[0]} strokeWidth={2} />
              <text x={pad.left + index * step + step / 2} y={y(item.nilai) - 10} textAnchor="middle" fontSize={11} fontWeight={800} fill="#1e1e24">{item.nilai}</text>
            </g>
          ))}
        </>
      )}
      {data.map((item, index) => (
        <text key={item.label} x={pad.left + index * step + step / 2} y={height - 10} textAnchor="middle" fontSize={11} fill="#5c5654">{item.label}</text>
      ))}
    </svg>
  );
}

const CHART_OPTIONS: { kind: ChartKind; label: string; Icon: typeof BarChart3 }[] = [
  { kind: "bar", label: "Batang", Icon: BarChart3 },
  { kind: "line", label: "Garis", Icon: LineChart },
  { kind: "pie", label: "Lingkaran", Icon: PieChart },
];

function ChartLevel({ onFinish }: LevelProps) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<ChartKind | null>(null);
  const [correct, setCorrect] = useState(0);
  const done = index >= CHART_QUESTIONS.length;
  const question = CHART_QUESTIONS[index];
  const score = clampPercent((correct / CHART_QUESTIONS.length) * 100);

  const choose = (kind: ChartKind) => {
    if (picked) return;
    setPicked(kind);
    if (kind === question.jawaban) setCorrect((value) => value + 1);
  };

  return (
    <LevelShell
      index={1}
      judul={LEVELS[1].judul}
      misi={LEVELS[1].misi}
      hud={<MissionHud progress={`Soal ${Math.min(index + 1, CHART_QUESTIONS.length)}/${CHART_QUESTIONS.length} · ${correct} benar`} />}
    >
      {!done ? (
        <div key={question.id} className="mission-card-in">
          <p className="rounded-3xl bg-track-data-soft p-4 font-black text-track-data-foreground">“{question.pertanyaan}”</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {CHART_OPTIONS.map(({ kind, label, Icon }) => (
              <button
                key={kind}
                disabled={Boolean(picked)}
                onClick={() => choose(kind)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 text-sm font-black transition",
                  !picked && "border-border hover:-translate-y-0.5 hover:border-track-data",
                  picked && kind === question.jawaban && "border-emerald-500 bg-emerald-50",
                  picked === kind && kind !== question.jawaban && "mission-shake border-track-audit bg-track-audit-soft",
                  picked && kind !== question.jawaban && picked !== kind && "opacity-45"
                )}
              >
                <Icon className="h-7 w-7" /> {label}
              </button>
            ))}
          </div>
          {picked && (
            <>
              <div className="mt-3 rounded-3xl border border-border bg-white p-3">
                <MiniChart kind={question.jawaban} data={question.data} />
              </div>
              <FeedbackToast
                feedback={{
                  ok: picked === question.jawaban,
                  judul: picked === question.jawaban ? "Grafik yang pas!" : `Lebih tepat grafik ${CHART_OPTIONS.find((item) => item.kind === question.jawaban)?.label.toLowerCase()}`,
                  teks: question.penjelasan,
                  konsep: "Visualisasi data",
                }}
              />
              <Button className="mt-3" onClick={() => { setPicked(null); setIndex((value) => value + 1); }}>
                {index + 1 < CHART_QUESTIONS.length ? "Soal berikutnya" : "Selesai"} <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ) : (
        <LevelComplete score={score} reason="Dasbor siap" detail={`${correct} dari ${CHART_QUESTIONS.length} grafik tepat.`} onNext={() => onFinish(score)} />
      )}
    </LevelShell>
  );
}

function InsightLevel({ onFinish }: LevelProps) {
  const [index, setIndex] = useState(0);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const done = index >= INSIGHT_QUESTIONS.length;
  const question = INSIGHT_QUESTIONS[index];
  const picked = question?.opsi.find((item) => item.id === pickedId);
  const score = clampPercent((correct / INSIGHT_QUESTIONS.length) * 100);

  const choose = (id: string) => {
    if (pickedId) return;
    setPickedId(id);
    if (question.opsi.find((item) => item.id === id)?.benar) setCorrect((value) => value + 1);
  };

  return (
    <LevelShell
      index={2}
      judul={LEVELS[2].judul}
      misi={LEVELS[2].misi}
      hud={<MissionHud progress={`Kasus ${Math.min(index + 1, INSIGHT_QUESTIONS.length)}/${INSIGHT_QUESTIONS.length}`} />}
    >
      {!done ? (
        <div key={question.id} className="mission-card-in">
          <div className="rounded-3xl border border-border bg-white p-3">
            <MiniChart kind={question.grafik} data={question.data} />
          </div>
          <p className="mt-3 text-sm font-black">{question.pertanyaan}</p>
          <div className="mt-2 grid gap-2">
            {question.opsi.map((option) => (
              <button
                key={option.id}
                disabled={Boolean(pickedId)}
                onClick={() => choose(option.id)}
                className={cn(
                  "rounded-2xl border-2 p-3 text-left text-sm font-semibold transition",
                  !pickedId && "border-border hover:border-track-data hover:bg-track-data-soft",
                  pickedId && option.benar && "border-emerald-500 bg-emerald-50",
                  pickedId === option.id && !option.benar && "mission-shake border-track-audit bg-track-audit-soft",
                  pickedId && !option.benar && pickedId !== option.id && "opacity-45"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          {picked && (
            <>
              <FeedbackToast feedback={{ ok: picked.benar, judul: picked.benar ? "Insight tajam!" : "Belum tepat", teks: picked.penjelasan, konsep: "Data-driven decision" }} />
              <Button className="mt-3" onClick={() => { setPickedId(null); setIndex((value) => value + 1); }}>
                {index + 1 < INSIGHT_QUESTIONS.length ? "Kasus berikutnya" : "Selesai"} <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ) : (
        <LevelComplete score={score} reason="Rekomendasi terkirim" detail={`${correct} dari ${INSIGHT_QUESTIONS.length} insight tepat.`} isLast onNext={() => onFinish(score)} />
      )}
    </LevelShell>
  );
}

export default function DataMission({ onComplete }: { onComplete: OnMissionComplete }) {
  return <MissionRunner missionId="data-science" levels={[CleanLevel, ChartLevel, InsightLevel]} onComplete={onComplete} />;
}
