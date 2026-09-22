"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type {
  WorkspaceMenu,
  WorkspaceScenario,
  ErpScenarioContent,
  AuditScenarioContent,
  DataCleanContent,
  DataChartContent,
  DataInsightContent,
} from "@/lib/types";
import ErpScenario from "./scenarios/erp-scenario";
import AuditScenario from "./scenarios/audit-scenario";
import DataCleanScenario from "./scenarios/data-clean-scenario";
import DataChartScenario from "./scenarios/data-chart-scenario";
import DataInsightScenario from "./scenarios/data-insight-scenario";

export default function ScenarioDialog({
  menu,
  scenario,
  open,
  onOpenChange,
}: {
  menu: WorkspaceMenu | null;
  scenario: WorkspaceScenario | null | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {menu && (
          <DialogHeader>
            <DialogTitle>{menu.namaMenu}</DialogTitle>
            <DialogDescription>{menu.deskripsi}</DialogDescription>
          </DialogHeader>
        )}

        {!scenario && (
          <p className="text-sm text-muted-foreground">Skenario untuk menu ini belum tersedia.</p>
        )}

        {scenario?.tipeInteraksi === "erp-decision" && (
          <ErpScenario konten={scenario.konten as ErpScenarioContent} />
        )}
        {scenario?.tipeInteraksi === "audit-checklist" && (
          <AuditScenario konten={scenario.konten as AuditScenarioContent} />
        )}
        {scenario?.tipeInteraksi === "data-clean" && (
          <DataCleanScenario konten={scenario.konten as DataCleanContent} />
        )}
        {scenario?.tipeInteraksi === "data-chart" && (
          <DataChartScenario konten={scenario.konten as DataChartContent} />
        )}
        {scenario?.tipeInteraksi === "data-insight" && (
          <DataInsightScenario konten={scenario.konten as DataInsightContent} />
        )}
      </DialogContent>
    </Dialog>
  );
}
