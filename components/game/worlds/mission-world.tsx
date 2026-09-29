"use client";

import { lazy, Suspense, useEffect, useRef, useState, type ComponentType, type CSSProperties } from "react";
import { IconArrowLeft, IconKeyboard, IconPhone } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import {
  AffinityStep,
  clampPercent,
  LearningCard,
  MISSION_THEME,
  MissionIntro,
  type OnMissionComplete,
} from "@/components/game/missions/mission-kit";
import type { MusicThemeId, SoundName } from "@/components/game/use-game-audio";
import { WORLD_BRIEFS, WORLD_LEVELS } from "@/lib/data/worlds";
import type { GameAvatarId, GameQuality, MissionId } from "@/lib/types";
import { GameLoader } from "@/components/game/game-loader";
import { useWorldInput } from "./world-controls";
import type { WorldLevelProps } from "./world-kit";
type LevelModule = () => Promise<ComponentType<WorldLevelProps>>;

// Setiap level dimuat terpisah: masuk satu misi hanya mengunduh kode level yang
// sedang dimainkan, bukan kesembilan level sekaligus.
const LEVEL_MODULES: Record<MissionId, LevelModule[]> = {
  "it-audit": [
    () => import("./audit/inspektur-world").then((m) => m.InspectLevel),
    () => import("./audit/inspektur-world").then((m) => m.FirewallLevel),
    () => import("./audit/hacker-arena").then((m) => m.ArenaLevel),
  ],
  "enterprise-system": [
    () => import("./erp/route-level").then((m) => m.RouteLevel),
    () => import("./erp/ops-level").then((m) => m.OpsLevel),
    () => import("./erp/drone-level").then((m) => m.DroneLevel),
  ],
  // Level 1 · Pemburu Data Liar, Level 2 · Arung Jeram Data, Level 3 · Armada Prediksi.
  "data-science": [
    () => import("./data/hunt-level").then((m) => m.HuntLevel),
    () => import("./data/river-level").then((m) => m.RiverLevel),
    () => import("./data/sea-level").then((m) => m.SeaLevel),
  ],
};

const lazyLevels = (modules: LevelModule[]) =>
  modules.map((load) => lazy(() => load().then((component) => ({ default: component }))));

const LEVELS: Record<MissionId, ComponentType<WorldLevelProps>[]> = {
  "it-audit": lazyLevels(LEVEL_MODULES["it-audit"]),
  "enterprise-system": lazyLevels(LEVEL_MODULES["enterprise-system"]),
  "data-science": lazyLevels(LEVEL_MODULES["data-science"]),
};

export default function MissionWorld({
  missionId,
  avatar,
  quality,
  sound,
  setMusic,
  onComplete,
  onExit,
}: {
  missionId: MissionId;
  avatar: GameAvatarId;
  quality: GameQuality;
  sound: (name: SoundName) => void;
  setMusic: (theme: MusicThemeId | null, intensity?: number) => void;
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

  // Unduh kode level berikutnya selagi pemain membaca briefing, agar tidak menunggu.
  const upcoming = LEVEL_MODULES[missionId][Math.max(0, stage)];
  useEffect(() => {
    if (upcoming) void upcoming();
  }, [upcoming]);
  const Level = playing ? levels[stage] : null;
  const info = playing ? WORLD_LEVELS[missionId][stage] : null;
  const performance = clampPercent(scores.reduce((sum, value) => sum + value, 0) / levels.length);

  // Musik tema misi: penuh saat bermain, lembut saat briefing, jeda, atau rangkuman.
  const active = playing && started && !paused;
  useEffect(() => {
    setMusic(missionId, active ? 1 : 0.4);
  }, [active, missionId, setMusic]);

  const wasPaused = useRef(paused);
  useEffect(() => {
    if (wasPaused.current !== paused && playing && started) sound(paused ? "open" : "close");
    wasPaused.current = paused;
  }, [paused, playing, sound, started]);

  useEffect(() => {
    if (!playing || !started) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPaused((value) => !value);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing, started]);

  const finishLevel = (score: number) => {
    setScores((current) => [...current, clampPercent(score)]);
    setStage((current) => current + 1);
    setStarted(false);
    setPaused(false);
  };

  const restartLevel = () => {
    sound("click");
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
        <Suspense
          fallback={<GameLoader label="Memuat level…" className="is-overlay" />}
        >
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
        </Suspense>
      )}

      {stage === -1 && (
        <>
          <button className="world-exit" onClick={() => { sound("close"); onExit(); }}><IconArrowLeft className="h-4 w-4" /> Kembali ke kampus</button>
          <div className="world-panel-wrap">
            <div className="world-panel">
              <p className="text-xs font-black tracking-[0.15em] text-muted-foreground">{brief.kicker}</p>
              <h2 className="text-2xl font-black">{brief.judul}</h2>
              <MissionIntro missionId={missionId} brief={brief} onStart={() => { sound("start"); setStage(0); }} />
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
              <p className="flex items-center gap-2 rounded-2xl bg-card p-3 ring-1 ring-border"><IconKeyboard className="h-4 w-4 shrink-0" /> {info.kontrol}</p>
              <p className="flex items-center gap-2 rounded-2xl bg-card p-3 ring-1 ring-border"><IconPhone className="h-4 w-4 shrink-0" /> {info.kontrolSentuh}</p>
            </div>
            <Button className="mt-5 w-full" onClick={() => { sound("start"); setStarted(true); }} autoFocus>
              Mulai level
            </Button>
          </div>
        </div>
      )}

      {playing && started && paused && (
        <div className="world-panel-wrap">
          <div className="world-panel mission-pop max-w-sm text-center">
            <h2 className="text-2xl font-black">Permainan dijeda</h2>
            <div className="mt-4 grid gap-2">
              <Button onClick={() => setPaused(false)} autoFocus>Lanjutkan</Button>
              <Button variant="outline" onClick={restartLevel}>Ulangi level</Button>
              <Button variant="ghost" onClick={() => { sound("close"); onExit(); }}><IconArrowLeft className="h-4 w-4" /> Keluar ke kampus</Button>
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
