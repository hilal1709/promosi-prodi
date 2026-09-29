import type {
  AudioSettings,
  GameAvatarId,
  GameOrientation,
  GameProgress,
  JalurId,
  MissionId,
  MissionResult,
  TrackScore,
} from "@/lib/types";

export const GAME_STORAGE_KEY = "sisfor-game-progress:v1";
export const MISSION_IDS: MissionId[] = ["it-audit", "enterprise-system", "data-science"];

export const DEFAULT_AUDIO: AudioSettings = { muted: false, volume: 0.45, music: 0.6, sfx: 0.9 };

function readLevel(value: unknown, fallback: number) {
  const number = Number(value);
  return value === undefined || !Number.isFinite(number) ? fallback : Math.max(0, Math.min(1, number));
}

export const DEFAULT_GAME_PROGRESS: GameProgress = {
  version: 1,
  phase: "start",
  avatar: null,
  spawnZone: "plaza",
  missions: {},
  recommendation: null,
  audio: DEFAULT_AUDIO,
  quality: "auto",
  orientation: "auto",
};

export function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateTrackScores(
  missions: Partial<Record<MissionId, MissionResult>>
): TrackScore {
  return MISSION_IDS.reduce(
    (scores, id) => {
      const result = missions[id];
      scores[id] = result
        ? clampScore(result.performance * 0.7 + result.affinityBonus)
        : 0;
      return scores;
    },
    { "it-audit": 0, "enterprise-system": 0, "data-science": 0 } as TrackScore
  );
}

export function getRecommendation(
  missions: Partial<Record<MissionId, MissionResult>>,
  tieBreak?: JalurId
): { recommendation: JalurId | null; ties: JalurId[]; scores: TrackScore } {
  const scores = calculateTrackScores(missions);
  if (Object.keys(missions).length < MISSION_IDS.length) {
    return { recommendation: null, ties: [], scores };
  }

  const max = Math.max(...MISSION_IDS.map((id) => scores[id]));
  const ties = MISSION_IDS.filter((id) => scores[id] === max);
  return {
    recommendation: ties.length === 1 ? ties[0] : tieBreak && ties.includes(tieBreak) ? tieBreak : null,
    ties,
    scores,
  };
}

export function readGameProgress(): GameProgress {
  if (typeof window === "undefined") return DEFAULT_GAME_PROGRESS;
  try {
    const raw = window.localStorage.getItem(GAME_STORAGE_KEY);
    if (!raw) return DEFAULT_GAME_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<GameProgress>;
    if (parsed.version !== 1 || !parsed.missions || !parsed.audio) return DEFAULT_GAME_PROGRESS;

    const missions = Object.fromEntries(
      Object.entries(parsed.missions).filter(([id, result]) => {
        const value = result as MissionResult | undefined;
        return (
          MISSION_IDS.includes(id as MissionId) &&
          value &&
          typeof value.performance === "number" &&
          [0, 15, 30].includes(value.affinityBonus)
        );
      })
    ) as GameProgress["missions"];

    return {
      ...DEFAULT_GAME_PROGRESS,
      ...parsed,
      avatar: (["arga", "nara"] as GameAvatarId[]).includes(parsed.avatar as GameAvatarId)
        ? (parsed.avatar as GameAvatarId)
        : null,
      phase: parsed.phase === "mission" || parsed.phase === "paused" ? "explore" : parsed.phase ?? "start",
      missions,
      orientation: (["auto", "portrait", "landscape"] as GameOrientation[]).includes(parsed.orientation as GameOrientation)
        ? (parsed.orientation as GameOrientation)
        : "auto",
      audio: {
        muted: Boolean(parsed.audio.muted),
        volume: Math.max(0, Math.min(1, Number(parsed.audio.volume) || DEFAULT_AUDIO.volume)),
        music: readLevel(parsed.audio.music, DEFAULT_AUDIO.music),
        sfx: readLevel(parsed.audio.sfx, DEFAULT_AUDIO.sfx),
      },
    };
  } catch {
    return DEFAULT_GAME_PROGRESS;
  }
}

export function saveGameProgress(progress: GameProgress) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(progress));
}
