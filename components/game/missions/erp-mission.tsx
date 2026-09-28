"use client";

import { useState } from "react";
import { AlertTriangle, ArrowRight, Factory, PackageCheck, Smile, Truck, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ERP_BOARD,
  ERP_BOARD_SCORES,
  ERP_EVENTS,
  ERP_MODULE_HINTS,
  ERP_MODULE_POOL,
  ERP_MODULES,
  ERP_ORDERS,
  ERP_SIM,
  MISSION_BRIEFS,
} from "@/lib/data/missions";
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

const LEVELS = MISSION_BRIEFS["enterprise-system"].level;

function FlowLevel({ onFinish }: LevelProps) {
  const [placed, setPlaced] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [shake, setShake] = useState<{ id: string; n: number } | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const done = placed.length === ERP_MODULES.length;
  const score = clampPercent(100 - mistakes * 10);

  const pick = (id: string) => {
    if (done) return;
    const expected = ERP_MODULES[placed.length];
    if (id === expected.id) {
      setPlaced((current) => [...current, id]);
      setFeedback({ ok: true, judul: `${expected.label} terpasang`, teks: expected.aliranData, konsep: expected.divisi });
    } else {
      setMistakes((value) => value + 1);
      setShake((current) => ({ id, n: (current?.n ?? 0) + 1 }));
      setFeedback({ ok: false, judul: "Belum tepat urutannya", teks: ERP_MODULE_HINTS[expected.id] });
    }
  };

  return (
    <LevelShell
      index={0}
      judul={LEVELS[0].judul}
      misi={LEVELS[0].misi}
      hud={<MissionHud progress={`${placed.length}/${ERP_MODULES.length} modul · ${mistakes} salah`} />}
    >
      <div className="relative">
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-6">
          {ERP_MODULES.map((step, index) => {
            const filled = index < placed.length;
            return (
              <li
                key={step.id}
                className={cn(
                  "relative flex min-h-20 flex-col justify-center rounded-2xl border-2 p-2.5 text-center text-xs",
                  filled ? "mission-pop border-track-erp bg-track-erp-soft" : "border-dashed border-border bg-card/50 text-muted-foreground",
                  index === placed.length && !done && "border-brand-navy"
                )}
              >
                <span className="text-[0.65rem] font-black tracking-wide text-muted-foreground">LANGKAH {index + 1}</span>
                {filled ? (
                  <>
                    <span className="mt-0.5 font-black text-foreground">{step.label}</span>
                    <span className="text-[0.7rem] font-semibold text-track-erp-foreground">{step.divisi}</span>
                  </>
                ) : (
                  <span className="mt-1 text-lg font-black">?</span>
                )}
              </li>
            );
          })}
        </ol>
        {done && (
          <div className="relative mx-4 mt-3 h-1.5 rounded-full bg-track-erp-soft" aria-hidden>
            <span className="mission-flow-dot" />
            <span className="mission-flow-dot" style={{ animationDelay: "-0.8s" }} />
            <span className="mission-flow-dot" style={{ animationDelay: "-1.6s" }} />
          </div>
        )}
      </div>

      {!done ? (
        <>
          <p className="mt-4 text-sm font-black">Pilih modul untuk langkah {placed.length + 1}:</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ERP_MODULE_POOL.filter((id) => !placed.includes(id)).map((id) => {
              const item = ERP_MODULES.find((entry) => entry.id === id)!;
              return (
                <button
                  key={shake?.id === id ? `${id}-${shake.n}` : id}
                  onClick={() => pick(id)}
                  className={cn(
                    "rounded-2xl border-2 border-border bg-card p-3 text-left text-sm transition hover:-translate-y-0.5 hover:border-track-erp hover:shadow-md",
                    shake?.id === id && "mission-shake border-track-audit"
                  )}
                >
                  <span className="block font-black">{item.label}</span>
                  <span className="text-xs text-muted-foreground">Divisi {item.divisi}</span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <p className="mt-3 rounded-2xl bg-track-erp-soft p-3 text-center text-sm font-semibold text-track-erp-foreground">
          Alur tersambung! Data pesanan kini mengalir otomatis antar divisi — dicatat sekali, dipakai semua.
        </p>
      )}
      <FeedbackToast feedback={feedback} />
      {done && <LevelComplete score={score} reason="Alur order-to-cash siap" detail={`${mistakes} kali salah pilih.`} onNext={() => onFinish(score)} />}
    </LevelShell>
  );
}

function Meter({ Icon, label, value, max, tone }: { Icon: typeof Warehouse; label: string; value: number; max: number; tone: string }) {
  return (
    <div className="rounded-2xl bg-card p-3 ring-1 ring-border">
      <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
        <span className="flex items-center gap-1.5"><Icon className="h-3.5 w-3.5" />{label}</span>
        <span className="font-black tabular-nums text-foreground">{value}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all duration-500", tone)} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
      </div>
    </div>
  );
}

function SimLevel({ onFinish }: LevelProps) {
  const [shipped, setShipped] = useState<string[]>([]);
  const [productions, setProductions] = useState<number[]>([]);
  const [answers, setAnswers] = useState<Record<string, { option: number; at: number }>>({});
  const [feedback, setFeedback] = useState<Feedback>(null);

  const eventAt = (elapsed: number) => ERP_EVENTS.find((event) => event.muncul <= elapsed && !answers[event.id]);
  const resolvedAt = (elapsed: number) =>
    ERP_ORDERS.every((order) => shipped.includes(order.id) || elapsed >= order.muncul + ERP_SIM.kesabaran) &&
    ERP_EVENTS.every((event) => answers[event.id]);
  // Waktu berhenti selama kejadian mendadak menunggu keputusan pemain.
  const { left } = useCountdown(ERP_SIM.durasi, (remaining) => {
    const at = ERP_SIM.durasi - remaining;
    return !eventAt(at) && !resolvedAt(at);
  });
  const elapsed = ERP_SIM.durasi - left;
  const activeEvent = eventAt(elapsed);
  const ended = left <= 0 || resolvedAt(elapsed);
  const failed = ERP_ORDERS.filter((order) => !shipped.includes(order.id) && elapsed >= order.muncul + ERP_SIM.kesabaran);
  const queue = ERP_ORDERS.filter((order) => order.muncul <= elapsed && !shipped.includes(order.id) && !failed.includes(order));
  const producing = productions.some((start) => elapsed < start + ERP_SIM.produksi.durasi);
  const productionLeft = producing ? Math.max(...productions.map((start) => start + ERP_SIM.produksi.durasi - elapsed)) : 0;

  const eventEffects = ERP_EVENTS.reduce(
    (total, event) => {
      const answer = answers[event.id];
      if (!answer) return total;
      const option = event.opsi[answer.option];
      total.stok += option.stok ?? 0;
      total.kepuasan += option.kepuasan ?? 0;
      if (option.stokSusulan && elapsed >= answer.at + 12) total.stok += option.stokSusulan;
      return total;
    },
    { stok: 0, kepuasan: 0 }
  );
  const lateSurprise = ERP_EVENTS.some((event) => {
    const answer = answers[event.id];
    return answer && event.opsi[answer.option].stokSusulan && elapsed >= answer.at + 12 && elapsed < answer.at + 18;
  });

  const stock = Math.max(
    0,
    ERP_SIM.stokAwal
      - ERP_ORDERS.filter((order) => shipped.includes(order.id)).reduce((sum, order) => sum + order.jumlah, 0)
      + productions.filter((start) => elapsed >= start + ERP_SIM.produksi.durasi).length * ERP_SIM.produksi.tambah
      + eventEffects.stok
  );
  const satisfaction = Math.max(0, Math.min(100, 100 - failed.length * 12 + eventEffects.kepuasan));
  const eventsCorrect = ERP_EVENTS.filter((event) => answers[event.id] && event.opsi[answers[event.id].option].benar).length;
  const score = clampPercent(
    (shipped.length / ERP_ORDERS.length) * 50 + (eventsCorrect / ERP_EVENTS.length) * 30 + satisfaction * 0.2
  );

  const ship = (id: string) => {
    const order = ERP_ORDERS.find((item) => item.id === id)!;
    if (ended || activeEvent || stock < order.jumlah) return;
    setShipped((current) => [...current, id]);
    setFeedback({ ok: true, judul: `${order.jumlah} ton terkirim ke ${order.pelanggan}`, teks: "Stok berkurang otomatis dan faktur langsung terbit di modul keuangan.", konsep: "Integrasi" });
  };

  const produce = () => {
    if (ended || producing || activeEvent) return;
    setProductions((current) => [...current, elapsed]);
    setFeedback({ ok: true, judul: "Produksi dijadwalkan", teks: `+${ERP_SIM.produksi.tambah} ton masuk gudang dalam ${ERP_SIM.produksi.durasi} detik.`, konsep: "Perencanaan produksi" });
  };

  const answer = (option: number) => {
    if (!activeEvent) return;
    const picked = activeEvent.opsi[option];
    setAnswers((current) => ({ ...current, [activeEvent.id]: { option, at: elapsed } }));
    setFeedback({ ok: picked.benar, judul: picked.benar ? "Keputusan tepat!" : "Kurang tepat", teks: picked.hasil, konsep: activeEvent.konsep });
  };

  return (
    <LevelShell
      index={1}
      judul={LEVELS[1].judul}
      misi={LEVELS[1].misi}
      hud={<MissionHud timeLeft={left} progress={`${shipped.length}/${ERP_ORDERS.length} terkirim`} />}
    >
      <div className="grid gap-2 sm:grid-cols-3">
        <Meter Icon={Warehouse} label="Stok gudang (ton)" value={stock} max={200} tone={stock < 40 ? "bg-track-audit" : "bg-track-erp"} />
        <Meter Icon={Smile} label="Kepuasan pelanggan" value={satisfaction} max={100} tone={satisfaction < 60 ? "bg-track-audit" : "bg-emerald-500"} />
        <Meter Icon={PackageCheck} label="Pesanan terkirim" value={shipped.length} max={ERP_ORDERS.length} tone="bg-brand-navy" />
      </div>

      {lateSurprise && (
        <p className="mission-shake mt-3 flex items-center gap-2 rounded-2xl bg-track-audit-soft p-3 text-sm font-bold text-track-audit-foreground">
          <AlertTriangle className="h-4 w-4 shrink-0" /> Selisih yang diabaikan membesar — stok fisik ternyata kurang 40 ton!
        </p>
      )}

      {activeEvent && !ended ? (
        <div key={activeEvent.id} className="mission-pop mt-3 rounded-3xl border-2 border-track-audit bg-card p-4">
          <p className="flex items-center gap-2 text-xs font-black tracking-[0.15em] text-track-audit"><AlertTriangle className="h-4 w-4" /> KEJADIAN MENDADAK · WAKTU DIJEDA</p>
          <p className="mt-1 text-lg font-black">{activeEvent.judul}</p>
          <p className="text-sm text-muted-foreground">{activeEvent.deskripsi}</p>
          <div className="mt-3 grid gap-2">
            {activeEvent.opsi.map((option, index) => (
              <button key={option.label} onClick={() => answer(index)} className="rounded-2xl border-2 border-border p-3 text-left text-sm font-semibold transition hover:border-track-erp hover:bg-track-erp-soft">
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : !ended ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_13rem]">
          <div className="grid content-start gap-2">
            <p className="text-xs font-black tracking-[0.15em] text-muted-foreground">ANTREAN PESANAN</p>
            {queue.length === 0 && <p className="rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">Menunggu pesanan masuk…</p>}
            {queue.map((order) => {
              const patience = order.muncul + ERP_SIM.kesabaran - elapsed;
              const enough = stock >= order.jumlah;
              return (
                <div key={order.id} className="mission-card-in flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black">{order.pelanggan}</p>
                    <p className="text-xs text-muted-foreground">{order.jumlah} ton semen</p>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className={cn("h-full rounded-full transition-all duration-1000", patience <= 8 ? "bg-track-audit" : "bg-emerald-500")} style={{ width: `${(patience / ERP_SIM.kesabaran) * 100}%` }} />
                    </div>
                  </div>
                  <Button size="sm" onClick={() => ship(order.id)} disabled={!enough} className="shrink-0">
                    <Truck className="h-4 w-4" /> {enough ? "Kirim" : "Stok kurang"}
                  </Button>
                </div>
              );
            })}
          </div>
          <div className="rounded-3xl bg-brand-navy p-4 text-white">
            <p className="text-xs font-black tracking-[0.15em] text-brand-gold">PABRIK</p>
            <p className="mt-1 text-sm text-white/70">Stok menipis? Jadwalkan produksi sebelum pesanan besar datang.</p>
            <Button onClick={produce} disabled={producing} className="mt-3 w-full bg-brand-gold text-brand-navy hover:bg-brand-gold/90">
              <Factory className="h-4 w-4" /> {producing ? `Produksi… ${productionLeft}s` : `Produksi +${ERP_SIM.produksi.tambah} ton`}
            </Button>
          </div>
        </div>
      ) : null}

      <FeedbackToast feedback={feedback} />
      {ended && (
        <LevelComplete
          score={score}
          reason={left <= 0 ? "Hari kerja selesai" : "Semua pesanan tertangani"}
          detail={`${shipped.length}/${ERP_ORDERS.length} pesanan terkirim · ${eventsCorrect}/${ERP_EVENTS.length} keputusan tepat · kepuasan ${satisfaction}%`}
          onNext={() => onFinish(score)}
        />
      )}
    </LevelShell>
  );
}

const IMPACTS = [
  { key: "efisiensi", label: "Efisiensi kerja", goodWhenPositive: true },
  { key: "biaya", label: "Penghematan biaya", goodWhenPositive: true },
  { key: "risiko", label: "Risiko salah data", goodWhenPositive: false },
] as const;

function BoardLevel({ onFinish }: LevelProps) {
  const [pickedId, setPickedId] = useState<string | null>(null);
  const picked = ERP_BOARD.opsi.find((item) => item.id === pickedId);
  const score = pickedId ? ERP_BOARD_SCORES[pickedId] ?? 0 : 0;

  return (
    <LevelShell index={2} judul={LEVELS[2].judul} misi={LEVELS[2].misi}>
      <div className="rounded-3xl bg-brand-navy p-4 text-white">
        <p className="text-xs font-black tracking-[0.15em] text-brand-gold">BESOK PAGI · RAPAT DIREKSI</p>
        <p className="mt-1 text-sm leading-relaxed text-white/85">{ERP_BOARD.situasi}</p>
      </div>
      <div className="mt-3 grid gap-2">
        {ERP_BOARD.opsi.map((option, index) => (
          <button
            key={option.id}
            disabled={Boolean(picked)}
            onClick={() => setPickedId(option.id)}
            className={cn(
              "flex gap-3 rounded-2xl border-2 p-3.5 text-left text-sm transition",
              pickedId === option.id ? "border-track-erp bg-track-erp-soft" : "border-border hover:border-track-erp",
              picked && pickedId !== option.id && "opacity-45"
            )}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-navy text-xs font-black text-white">{index + 1}</span>
            <span className="font-semibold leading-relaxed">{option.label}</span>
          </button>
        ))}
      </div>
      {picked && (
        <>
          <div className="mission-pop mt-3 rounded-3xl border border-border bg-card p-4">
            <p className="text-sm font-black">Dampak keputusan</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{picked.konsekuensi}</p>
            <div className="mt-3 grid gap-2">
              {IMPACTS.map((impact) => {
                const value = picked.dampak[impact.key] ?? 0;
                const good = impact.goodWhenPositive ? value > 0 : value < 0;
                return (
                  <div key={impact.key} className="grid grid-cols-[8.5rem_1fr_2.5rem] items-center gap-2 text-xs font-bold">
                    <span>{impact.label}</span>
                    <div className="relative h-2.5 rounded-full bg-muted">
                      <span className="absolute left-1/2 top-0 h-full w-px bg-border" />
                      <span
                        className={cn("absolute top-0 h-full rounded-full transition-all duration-700", good ? "bg-emerald-500" : value === 0 ? "bg-border" : "bg-track-audit")}
                        style={value >= 0 ? { left: "50%", width: `${(value / 25) * 50}%` } : { right: "50%", width: `${(-value / 25) * 50}%` }}
                      />
                    </div>
                    <span className="text-right tabular-nums">{value > 0 ? `+${value}` : value}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <LevelComplete
            score={score}
            reason={score === 100 ? "Direksi terkesan" : "Keputusan tercatat"}
            detail={score === 100 ? "Konsolidasi otomatis: cepat, seragam, dan bisa ditelusuri." : "Coba bayangkan: bagaimana ERP bisa membuat laporan ini otomatis?"}
            isLast
            onNext={() => onFinish(score)}
          />
        </>
      )}
      {!picked && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <ArrowRight className="h-3.5 w-3.5" /> Pilih satu strategi untuk melihat dampaknya.
        </p>
      )}
    </LevelShell>
  );
}

export default function ErpMission({ onComplete }: { onComplete: OnMissionComplete }) {
  return <MissionRunner missionId="enterprise-system" levels={[FlowLevel, SimLevel, BoardLevel]} onComplete={onComplete} />;
}
