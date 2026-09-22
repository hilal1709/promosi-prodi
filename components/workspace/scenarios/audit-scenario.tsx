"use client";

import { useMemo, useState } from "react";
import { RotateCcw, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { AuditScenarioContent } from "@/lib/types";

export default function AuditScenario({ konten }: { konten: AuditScenarioContent }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const itemBerisiko = konten.item.filter((i) => i.berisikoJikaTidakDicentang);
  const skor = useMemo(() => {
    if (itemBerisiko.length === 0) return 100;
    const tercentang = itemBerisiko.filter((i) => checked[i.id]).length;
    return Math.round((tercentang / itemBerisiko.length) * 100);
  }, [checked, itemBerisiko]);

  const temuan = itemBerisiko.filter((i) => !checked[i.id]);
  const aman = skor >= konten.ambangAman;

  const toggle = (id: string) => setChecked((c) => ({ ...c, [id]: !c[id] }));
  const reset = () => {
    setChecked({});
    setSubmitted(false);
  };

  return (
    <div>
      <p className="rounded-xl bg-muted p-4 text-sm leading-relaxed sm:text-base">{konten.konteks}</p>

      <div className="mt-5 flex flex-col gap-2.5">
        {konten.item.map((item) => (
          <label
            key={item.id}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-xl border-2 px-4 py-3 text-sm transition-colors",
              checked[item.id] ? "border-track-audit bg-track-audit-soft" : "border-border hover:bg-muted"
            )}
          >
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-[var(--color-track-audit)]"
              checked={!!checked[item.id]}
              onChange={() => toggle(item.id)}
            />
            <span>
              <span className="font-medium">{item.label}</span>
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                {item.kategori}
              </span>
            </span>
          </label>
        ))}
      </div>

      {!submitted ? (
        <Button className="mt-5" onClick={() => setSubmitted(true)}>
          Selesaikan Pemeriksaan
        </Button>
      ) : (
        <div
          className={cn(
            "mt-5 rounded-2xl border-2 p-5",
            aman ? "border-track-erp bg-track-erp-soft" : "border-track-audit bg-track-audit-soft"
          )}
        >
          <div className="flex items-center gap-2">
            {aman ? (
              <ShieldCheck className="h-5 w-5 text-track-erp-foreground" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-track-audit-foreground" />
            )}
            <p className={cn("font-bold", aman ? "text-track-erp-foreground" : "text-track-audit-foreground")}>
              Skor Kepatuhan: {skor}% {aman ? "— Aman" : "— Perlu Perbaikan"}
            </p>
          </div>
          <Progress
            value={skor}
            className="mt-3"
            indicatorClassName={aman ? "bg-track-erp" : "bg-track-audit"}
          />
          {temuan.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-bold text-foreground">Temuan yang perlu ditindaklanjuti:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {temuan.map((t) => (
                  <li key={t.id}>{t.label}</li>
                ))}
              </ul>
            </div>
          )}
          <Button variant="outline" size="sm" className="mt-5" onClick={reset}>
            <RotateCcw className="h-3.5 w-3.5" /> Ulangi Pemeriksaan
          </Button>
        </div>
      )}
    </div>
  );
}
