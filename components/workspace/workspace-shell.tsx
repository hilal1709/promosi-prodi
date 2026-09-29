"use client";

import { useEffect, useState } from "react";
import { TrackIllustration } from "@/components/illustrations/track-illustration";
import TrackSwitcher from "./track-switcher";
import MenuGrid from "./menu-grid";
import ScenarioDialog from "./scenario-dialog";
import { getTrack } from "@/lib/data/tracks";
import { fetchWorkspaceMenus, fetchScenarioByMenuId } from "@/lib/data";
import type { JalurId, WorkspaceMenu, WorkspaceScenario } from "@/lib/types";

export default function WorkspaceShell({ jalur }: { jalur: JalurId }) {
  const track = getTrack(jalur);

  const [menus, setMenus] = useState<WorkspaceMenu[]>([]);
  const [activeMenu, setActiveMenu] = useState<WorkspaceMenu | null>(null);
  const [activeScenario, setActiveScenario] = useState<WorkspaceScenario | null | undefined>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchWorkspaceMenus(jalur).then((data) => {
      if (!cancelled) setMenus(data);
    });
    return () => {
      cancelled = true;
    };
  }, [jalur]);

  const handleSelectMenu = async (menu: WorkspaceMenu) => {
    setActiveMenu(menu);
    setDialogOpen(true);
    const scenario = await fetchScenarioByMenuId(menu.id);
    setActiveScenario(scenario ?? null);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div
        className="rounded-3xl p-6 text-white sm:p-8"
        style={{
          background: `linear-gradient(135deg, var(--color-${track.warna}), var(--color-brand-navy-dark))`,
        }}
      >
        <div className="flex items-center gap-3">
          <TrackIllustration id={track.id} className="h-14 w-14" />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/70">Ruang Kerja Digital</p>
            <h1 className="text-xl font-extrabold sm:text-2xl">{track.nama}</h1>
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-sm text-white/85 sm:text-base">{track.deskripsi}</p>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Ganti jalur kapan saja
        </p>
        <TrackSwitcher active={jalur} />
      </div>

      <div className="mt-8">
        <p className="mb-4 text-sm font-bold text-muted-foreground">
          Klik salah satu menu untuk mencoba simulasinya:
        </p>
        <MenuGrid jalur={jalur} menus={menus} onSelect={handleSelectMenu} />
      </div>

      <ScenarioDialog
        menu={activeMenu}
        scenario={activeScenario}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
