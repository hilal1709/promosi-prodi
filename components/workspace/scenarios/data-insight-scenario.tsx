"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DataInsightContent } from "@/lib/types";

export default function DataInsightScenario({ konten }: { konten: DataInsightContent }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = konten.opsi.find((o) => o.id === selectedId);

  return (
    <div>
      <p className="rounded-xl bg-muted p-4 text-sm font-semibold leading-relaxed sm:text-base">
        {konten.pertanyaan}
      </p>

      <div className="mt-5 flex flex-col gap-3">
        {konten.opsi.map((opsi) => {
          const isSelected = selectedId === opsi.id;
          const showState = selected && (isSelected || opsi.benar);
          return (
            <button
              key={opsi.id}
              onClick={() => setSelectedId(opsi.id)}
              disabled={!!selected}
              className={cn(
                "flex items-start gap-3 rounded-2xl border-2 px-4 py-3.5 text-left text-sm transition-all sm:text-base",
                !selected && "border-border hover:border-track-data hover:bg-track-data-soft",
                showState && opsi.benar && "border-track-erp bg-track-erp-soft",
                showState && !opsi.benar && "border-track-audit bg-track-audit-soft",
                selected && !showState && "opacity-50"
              )}
            >
              {selected && (opsi.benar || isSelected) ? (
                opsi.benar ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-track-erp-foreground" />
                ) : (
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-track-audit" />
                )
              ) : (
                <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-border" />
              )}
              <span>{opsi.label}</span>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="mt-5 rounded-2xl bg-secondary p-4 text-sm leading-relaxed">
          <p className="font-bold">{selected.benar ? "Tepat sekali!" : "Belum tepat."}</p>
          <p className="mt-1 text-muted-foreground">{selected.penjelasan}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => setSelectedId(null)}>
            <RotateCcw className="h-3.5 w-3.5" /> Pilih ulang
          </Button>
        </div>
      )}
    </div>
  );
}
