"use client";

import { useState } from "react";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DataCleanContent, DataRow } from "@/lib/types";

export default function DataCleanScenario({ konten }: { konten: DataCleanContent }) {
  const [rows, setRows] = useState<DataRow[]>(konten.baris);
  const kotorCount = rows.filter((r) => r.kolomKotor && r.kolomKotor.length > 0).length;
  const semuaBersih = kotorCount === 0;

  const bersihkanSemua = () => {
    setRows((prev) =>
      prev.map((r) =>
        r.perbaikan
          ? { ...r, data: { ...r.data, ...r.perbaikan }, kolomKotor: [] }
          : r
      )
    );
  };

  const bersihkanSatu = (id: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id && r.perbaikan
          ? { ...r, data: { ...r.data, ...r.perbaikan }, kolomKotor: [] }
          : r
      )
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold">{konten.judul}</p>
        {!semuaBersih && (
          <Button size="sm" onClick={bersihkanSemua}>
            <Sparkles className="h-3.5 w-3.5" /> Bersihkan Semua
          </Button>
        )}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              {konten.kolom.map((k) => (
                <th key={k} className="px-3 py-2.5 font-bold">
                  {k}
                </th>
              ))}
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const kotor = row.kolomKotor && row.kolomKotor.length > 0;
              return (
                <tr key={row.id} className="border-t border-border">
                  {konten.kolom.map((k) => (
                    <td
                      key={k}
                      className={cn(
                        "px-3 py-2.5",
                        row.kolomKotor?.includes(k) && "bg-track-audit-soft font-semibold text-track-audit-foreground"
                      )}
                    >
                      {String(row.data[k])}
                    </td>
                  ))}
                  <td className="px-3 py-2.5">
                    {kotor ? (
                      <button
                        onClick={() => bersihkanSatu(row.id)}
                        className="rounded-full bg-track-data-soft px-3 py-1 text-xs font-bold text-track-data-foreground hover:opacity-80"
                      >
                        Perbaiki
                      </button>
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-track-erp" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {semuaBersih && (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-track-erp-soft px-4 py-3 text-sm font-semibold text-track-erp-foreground">
          <CheckCircle2 className="h-4 w-4" /> Semua data sudah bersih & siap divisualisasikan!
        </p>
      )}
    </div>
  );
}
