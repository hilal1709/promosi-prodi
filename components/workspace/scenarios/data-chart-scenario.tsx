"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import type { DataChartContent } from "@/lib/types";

export default function DataChartScenario({ konten }: { konten: DataChartContent }) {
  const ref = useRef<HTMLDivElement>(null);
  const max = Math.max(...konten.kategori.map((k) => k.nilai), 1);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const bars = el.querySelectorAll("[data-bar]");
    const ctx = gsap.context(() => {
      gsap.fromTo(
        bars,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.8, stagger: 0.1, ease: "power3.out", transformOrigin: "left" }
      );
    }, el);
    return () => ctx.revert();
  }, [konten]);

  return (
    <div ref={ref}>
      <p className="text-sm font-bold">{konten.judul}</p>
      <div className="mt-5 flex flex-col gap-3">
        {konten.kategori.map((k) => (
          <div key={k.label} className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-xs font-semibold sm:w-36 sm:text-sm">{k.label}</span>
            <div className="h-7 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                data-bar
                className="flex h-full items-center justify-end rounded-full bg-track-data px-2 text-[10px] font-bold text-white"
                style={{ width: `${Math.max((k.nilai / max) * 100, 6)}%` }}
              >
                {k.nilai}
              </div>
            </div>
            <span className="w-14 shrink-0 text-right text-xs text-muted-foreground">{konten.satuan}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
