"use client";

import { useState } from "react";
import { RotateCcw, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ErpScenarioContent } from "@/lib/types";

function DampakBadge({ label, value }: { label: string; value?: number }) {
  if (value === undefined) return null;
  const positive = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
        positive ? "bg-track-erp-soft text-track-erp-foreground" : "bg-track-audit-soft text-track-audit-foreground"
      )}
    >
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {label} {positive ? "+" : ""}
      {value}
    </span>
  );
}

export default function ErpScenario({ konten }: { konten: ErpScenarioContent }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = konten.opsi.find((o) => o.id === selectedId);

  return (
    <div>
      <p className="rounded-xl bg-muted p-4 text-sm leading-relaxed sm:text-base">{konten.situasi}</p>

      {!selected ? (
        <div className="mt-5 flex flex-col gap-3">
          <p className="text-sm font-bold text-muted-foreground">Apa yang akan kamu lakukan?</p>
          {konten.opsi.map((opsi) => (
            <button
              key={opsi.id}
              onClick={() => setSelectedId(opsi.id)}
              className="rounded-2xl border-2 border-border px-4 py-3.5 text-left text-sm font-medium transition-all hover:border-track-erp hover:bg-track-erp-soft sm:text-base"
            >
              {opsi.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border-2 border-track-erp bg-track-erp-soft p-5">
          <p className="text-sm font-bold text-track-erp-foreground">Keputusanmu: {selected.label}</p>
          <p className="mt-2 text-sm leading-relaxed sm:text-base">{selected.konsekuensi}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <DampakBadge label="Efisiensi" value={selected.dampak.efisiensi} />
            <DampakBadge label="Biaya" value={selected.dampak.biaya} />
            <DampakBadge label="Risiko" value={selected.dampak.risiko} />
          </div>
          <Button variant="outline" size="sm" className="mt-5" onClick={() => setSelectedId(null)}>
            <RotateCcw className="h-3.5 w-3.5" /> Coba opsi lain
          </Button>
        </div>
      )}
    </div>
  );
}
