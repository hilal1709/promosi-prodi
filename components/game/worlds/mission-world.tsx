"use client";

import { useEffect, useState, type ComponentType, type CSSProperties } from "react";
import { ArrowLeft, Gamepad2, Keyboard, Play, RotateCcw, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AffinityStep,
  clampPercent,
  LearningCard,
  MISSION_THEME,
  MissionIntro,
  type OnMissionComplete,
} from "@/components/game/missions/mission-kit";
import type { SoundName } from "@/components/game/use-game-audio";
import { WORLD_BRIEFS, WORLD_LEVELS } from "@/lib/data/worlds";
import type { GameAvatarId, GameQuality, MissionId } from "@/lib/types";
import { useWorldInput } from "./world-controls";
import type { WorldLevelProps } from "./world-kit";
import { AUDIT_LEVELS } from "./audit/inspektur-world";
import { DATA_LEVELS } from "./data/data-lab-world";
import { ERP_LEVELS } from "./erp/race-world";

const LEVELS: Record<MissionId, ComponentType<WorldLevelProps>[]> = {
  "it-audit": AUDIT_LEVELS,
  "enterprise-system": ERP_LEVELS,
  "data-science": DATA_LEVELS,
};

export default function MissionWorld({
  missionId,
  avatar,
  quality,
  sound,
  onComplete,
  onExit,
}: {
  missionId: MissionId;
  avatar: GameAvatarId;
  quality: GameQuality;
  sound: (name: SoundName) => void;
  onComplete: OnMissionComplete;
  onExit: () => void;
}) {
  const levels = LEVELS[missionId];
  const brief = WORLD_BRIEFS[missionId];
  const theme = MISSION_THEME[missionId];
  const [stage, setStage] = useState(-1);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const playing = stage >= 0 && stage < levels.length;
  const done = stage >= levels.length;
  const input = useWorldInput(playing && started && !paused);
  const Level = playing ? levels[stage] : null;
  const info = playing ? WORLD_LEVELS[missionId][stage] : null;
  const performance = clampPercent(scores.reduce((sum, value) => sum + value, 0) / levels.length);

  useEffect(() => {
    if (!playing || !started) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPaused((value) => !value);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing, started]);

  const finishLevel = (score: number) => {
    sound("success");
    setScores((current) => [...current, clampPercent(score)]);
    setStage((current) => current + 1);
    setStarted(false);
    setPaused(false);
  };

  const restartLevel = () => {
    setAttempt((value) => value + 1);
    setStarted(false);
    setPaused(false);
  };

  return (
    <div
      className="world-shell"
      style={{ "--mission": theme.color, "--mission-soft": theme.soft, "--mission-ink": theme.ink } as CSSProperties}
      role="application"
      aria-label={`Dunia misi ${brief.judul}`}
    >
      {!playing && <div className="world-backdrop" />}

      {Level && info && (
        <Level
          key={`${stage}-${attempt}`}
          levelIndex={stage}
          info={info}
          paused={!started || paused}
          avatar={avatar}
          quality={quality}
          input={input}
          sound={sound}
          onPause={() => setPaused(true)}
          onFinish={finishLevel}
        />
      )}

      {stage === -1 && (
        <>
          <button className="world-exit" onClick={onExit}><ArrowLeft className="h-4 w-4" /> Kembali ke kampus</button>
          <div className="world-panel-wrap">
            <div className="world-panel">
              <p className="text-xs font-black tracking-[0.15em] text-muted-foreground">{brief.kicker}</p>
              <h2 className="text-2xl font-black">{brief.judul}</h2>
              <MissionIntro missionId={missionId} brief={brief} onStart={() => setStage(0)} />
            </div>
          </div>
        </>
      )}

      {playing && info && !started && (
        <div className="world-panel-wrap">
          <div className="world-panel mission-pop max-w-lg">
            <p className="text-xs font-black tracking-[0.15em] text-muted-foreground">LEVEL {stage + 1} / {levels.length}</p>
            <h2 className="text-2xl font-black">{info.judul}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{info.misi}</p>
            <div className="mt-4 grid gap-2 text-sm">
              <p className="flex items-center gap-2 rounded-2xl bg-card p-3 ring-1 ring-border"><Keyboard className="h-4 w-4 shrink-0" /> {info.kontrol}</p>
              <p className="flex items-center gap-2 rounded-2xl bg-card p-3 ring-1 ring-border"><Smartphone className="h-4 w-4 shrink-0" /> {info.kontrolSentuh}</p>
            </div>
            <Button className="mt-5 w-full" onClick={() => setStarted(true)} autoFocus>
              <Gamepad2 className="h-4 w-4" /> Mulai level
            </Button>
          </div>
        </div>
      )}

      {playing && started && paused && (
        <div className="world-panel-wrap">
          <div className="world-panel mission-pop max-w-sm text-center">
            <h2 className="text-2xl font-black">Permainan dijeda</h2>
            <div className="mt-4 grid gap-2">
              <Button onClick={() => setPaused(false)} autoFocus><Play className="h-4 w-4" /> Lanjutkan</Button>
              <Button variant="outline" onClick={restartLevel}><RotateCcw className="h-4 w-4" /> Ulangi level</Button>
              <Button variant="ghost" onClick={onExit}><ArrowLeft className="h-4 w-4" /> Keluar ke kampus</Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Keluar sekarang tidak menyimpan progres misi ini.</p>
          </div>
        </div>
      )}

      {done && (
        <div className="world-panel-wrap">
          <div className="world-panel">
            <p className="text-xs font-black tracking-[0.15em] text-muted-foreground">{brief.kicker} · MISI SELESAI</p>
            <h2 className="text-2xl font-black">{brief.judul}</h2>
            <LearningCard missionId={missionId} brief={brief} scores={scores} performance={performance} />
            <AffinityStep performance={performance} onComplete={onComplete} />
          </div>
        </div>
      )}
    </div>
  );
}
