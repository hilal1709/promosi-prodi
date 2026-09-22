"use client";

import {
  Warehouse,
  Wallet,
  Users,
  ClipboardCheck,
  AlertTriangle,
  FileSearch,
  Sparkles,
  BarChart3,
  Lightbulb,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import StaggerChildren from "@/components/gsap/stagger-children";
import type { JalurId, WorkspaceMenu } from "@/lib/types";
import { getTrack } from "@/lib/data/tracks";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Warehouse,
  Wallet,
  Users,
  ClipboardCheck,
  AlertTriangle,
  FileSearch,
  Sparkles,
  BarChart3,
  Lightbulb,
};

export default function MenuGrid({
  jalur,
  menus,
  onSelect,
}: {
  jalur: JalurId;
  menus: WorkspaceMenu[];
  onSelect: (menu: WorkspaceMenu) => void;
}) {
  const track = getTrack(jalur);

  return (
    <StaggerChildren className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" deps={[jalur]}>
      {menus.map((menu) => {
        const Icon = ICONS[menu.iconSlug] ?? ClipboardCheck;
        return (
          <Card
            key={menu.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(menu)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onSelect(menu);
            }}
            className="cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <CardContent className="p-5">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `var(--color-${track.warna}-soft)`,
                  color: `var(--color-${track.warna}-foreground)`,
                }}
              >
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-bold">{menu.namaMenu}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{menu.deskripsi}</p>
              <span
                className="mt-3 inline-flex items-center gap-1 text-sm font-bold"
                style={{ color: `var(--color-${track.warna})` }}
              >
                Buka simulasi <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </CardContent>
          </Card>
        );
      })}
    </StaggerChildren>
  );
}
