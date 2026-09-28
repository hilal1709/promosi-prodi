"use client";

import AuditMission from "@/components/game/missions/audit-mission";
import DataMission from "@/components/game/missions/data-mission";
import ErpMission from "@/components/game/missions/erp-mission";
import type { OnMissionComplete } from "@/components/game/missions/mission-kit";
import type { MissionId } from "@/lib/types";

export default function MissionPanel({
  missionId,
  onComplete,
}: {
  missionId: MissionId;
  onComplete: OnMissionComplete;
}) {
  if (missionId === "it-audit") return <AuditMission onComplete={onComplete} />;
  if (missionId === "enterprise-system") return <ErpMission onComplete={onComplete} />;
  return <DataMission onComplete={onComplete} />;
}
