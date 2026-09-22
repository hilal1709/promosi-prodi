"use client";

import Link from "next/link";
import { ShieldCheck, Boxes, ChartSpline } from "lucide-react";
import { cn } from "@/lib/utils";
import { TRACK_LIST } from "@/lib/data/tracks";
import type { JalurId } from "@/lib/types";

const TRACK_ICONS: Record<string, React.ComponentType<{ className?: string }>> = { ShieldCheck, Boxes, ChartSpline };

export default function TrackSwitcher({ active }: { active: JalurId }) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
      {TRACK_LIST.map((track) => {
        const Icon = TRACK_ICONS[track.icon] ?? Boxes;
        const isActive = track.id === active;
        return (
          <Link
            key={track.id}
            href={`/ruang-kerja/${track.id}`}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full border-2 px-4 py-2.5 text-sm font-bold transition-all",
              isActive
                ? "text-white shadow-md"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            )}
            style={
              isActive
                ? { backgroundColor: `var(--color-${track.warna})`, borderColor: `var(--color-${track.warna})` }
                : undefined
            }
          >
            <Icon className="h-4 w-4" />
            {track.singkatan}
          </Link>
        );
      })}
    </div>
  );
}
