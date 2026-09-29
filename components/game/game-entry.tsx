"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconArrowLeft, IconArrowRight, IconBook, IconChat, IconCheck, IconGraduation, IconHelp, IconInfo, IconMap, IconMute, IconPause, IconSettings, IconVolume } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { TrackIllustration } from "@/components/illustrations/track-illustration";
import { GameLoader } from "@/components/game/game-loader";
import { GameSoundContext, useGameAudio } from "@/components/game/use-game-audio";
import {
  DEFAULT_GAME_PROGRESS,
  GAME_STORAGE_KEY,
  MISSION_IDS,
  calculateTrackScores,
  getRecommendation,
  readGameProgress,
  saveGameProgress,
} from "@/lib/game";
import { isLowEndDevice, resolveQuality } from "@/lib/device-quality";
import { TRACKS } from "@/lib/data/tracks";
import { cn } from "@/lib/utils";
import type { CampusZone } from "@/components/game/game-canvas";
import type { GameAvatarId, GameProgress, GameQuality, JalurId, MissionId } from "@/lib/types";

const GameCanvas = dynamic(() => import("@/components/game/game-canvas"), {
  ssr: false,
  loading: () => <GameLoader label="Menyiapkan kampus virtual…" />,
});

const MissionWorld = dynamic(() => import("@/components/game/worlds/mission-world"), {
  ssr: false,
  loading: () => <GameLoader label="Memasuki dunia misi…" className="world-loading" />,
});

// Panel info, asisten, dan misi pop-up (tanpa WebGL) dimuat terpisah agar tidak
// memperberat layar awal; semuanya baru dibutuhkan setelah permainan dimulai.
const loadPanels = () => import("@/components/game/campus-panels");
const InfoCenter = dynamic(() => loadPanels().then((m) => m.InfoCenter), { ssr: false });
const CampusAssistant = dynamic(() => loadPanels().then((m) => m.CampusAssistant), { ssr: false });
const TrackDetails = dynamic(() => loadPanels().then((m) => m.TrackDetails), { ssr: false });
const MissionPanel = dynamic(() => import("@/components/game/mission-panel"), { ssr: false });

const ZONE_LABELS: Record<CampusZone | "plaza", string> = {
  plaza: "Plaza Digital",
  "it-audit": "Pusat Keamanan",
  "enterprise-system": "Pusat Operasi",
  "data-science": "Laboratorium Insight",
  info: "Pusat Informasi",
};

const CHARACTERS: Record<GameAvatarId, {
  id: GameAvatarId;
  name: string;
  gender: string;
  tagline: string;
  image: string;
}> = {
  arga: {
    id: "arga",
    name: "Arga",
    gender: "Karakter cowok",
    tagline: "Adaptif, santai, dan siap menjelajah setiap peluang.",
    image: "/characters/avatar-arga-neutral.webp",
  },
  nara: {
    id: "nara",
    name: "Nara",
    gender: "Karakter cewek",
    tagline: "Kreatif, cermat, dan selalu penasaran dengan hal baru.",
    image: "/characters/avatar-nara-neutral.webp",
  },
};

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function StartScreen({
  hasProgress,
  selectedCharacter,
  onSelectCharacter,
  onStart,
  onReset,
}: {
  hasProgress: boolean;
  selectedCharacter: GameAvatarId | null;
  onSelectCharacter: (character: GameAvatarId) => void;
  onStart: () => void;
  onReset: () => void;
}) {
  const [selecting, setSelecting] = useState(false);
  const selected = selectedCharacter ? CHARACTERS[selectedCharacter] : null;

  if (selecting) {
    return (
      // `key` berbeda agar React membuat <main> baru (scroll dari atas), bukan memakai ulang milik layar awal.
      <main key="character" className="game-start-screen game-character-screen">
        <div className="game-start-grid" aria-hidden="true" />
        <div className="game-start-orb game-start-orb-a" aria-hidden="true" />
        <div className="game-start-orb game-start-orb-b" aria-hidden="true" />
        <section className="game-character-stage">
          <header className="game-character-header">
            <button type="button" onClick={() => setSelecting(false)} className="game-character-back">
              <IconArrowLeft className="h-4 w-4" /> Kembali
            </button>
            <p className="game-eyebrow">LANGKAH 1 · PILIH KARAKTER</p>
            <h1>Siapa yang akan <span>menjelajah?</span></h1>
            <p>Pilih avatarmu. Karakter ini akan menemanimu di Kampus Digital Sistem Informasi.</p>
          </header>

          <div className="game-character-grid" role="radiogroup" aria-label="Pilihan karakter">
            {Object.values(CHARACTERS).map((character) => {
              const isSelected = selectedCharacter === character.id;
              return (
                <button
                  key={character.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={cn("game-character-card", isSelected && "is-selected")}
                  onClick={() => onSelectCharacter(character.id)}
                >
                  <span className="game-character-visual">
                    <Image
                      src={character.image}
                      alt={`Karakter ${character.name}`}
                      width={512}
                      height={768}
                      sizes="(max-width: 640px) 44vw, 24rem"
                      unoptimized
                    />
                  </span>
                  <span className="game-character-copy">
                    <span className="game-character-kind">{character.gender}</span>
                    <strong>{character.name}</strong>
                    <small>{character.tagline}</small>
                  </span>
                  <span className="game-character-check" aria-hidden="true"><IconCheck /></span>
                </button>
              );
            })}
          </div>

          <div className="game-character-actions">
            <div>
              <span>Karakter terpilih</span>
              <strong>{selected ? selected.name : "Belum dipilih"}</strong>
            </div>
            <Button size="lg" variant="accent" onClick={onStart} disabled={!selectedCharacter}>
              Mulai petualangan <IconArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main key="start" className="game-start-screen">
      <div className="game-start-grid" aria-hidden="true" />
      <div className="game-start-orb game-start-orb-a" aria-hidden="true" />
      <div className="game-start-orb game-start-orb-b" aria-hidden="true" />
      <section className="game-start-card">
        <Image className="game-brand-mark" src="/icons/icon-192.png" alt="Logo SISFOR UISI" width={56} height={56} priority unoptimized />
        <p className="game-eyebrow">SISTEM INFORMASI UISI · KAMPUS DIGITAL</p>
        <h1>Temukan jalurmu.<br /><span>Mainkan masa depanmu.</span></h1>
        <p className="game-start-copy">
          Jelajahi tiga pusat keahlian, selesaikan misi nyata, dan lihat bidang Sistem Informasi yang paling cocok untukmu.
        </p>
        <div className="game-start-actions">
          <Button size="lg" variant="accent" onClick={selectedCharacter ? onStart : () => setSelecting(true)}>
            {hasProgress && selected ? `Lanjutkan sebagai ${selected.name}` : selected ? `Mulai sebagai ${selected.name}` : "Pilih karakter"}
          </Button>
          {selectedCharacter && (
            <Button size="lg" variant="outline" onClick={() => setSelecting(true)}>Ganti karakter</Button>
          )}
          {hasProgress && (
            <Button size="lg" variant="outline" onClick={onReset}>Mulai baru</Button>
          )}
        </div>
        <div className="game-control-strip">
          <div className="hint-pointer"><kbd>WASD</kbd><span>Bergerak</span></div>
          <div className="hint-pointer"><kbd>Mouse</kbd><span>Putar kamera</span></div>
          <div className="hint-pointer"><kbd>E</kbd><span>Interaksi</span></div>
          <div className="hint-pointer"><kbd>Esc</kbd><span>Jeda</span></div>
          <div className="hint-touch"><kbd>Joystick</kbd><span>Bergerak</span></div>
          <div className="hint-touch"><kbd>Geser</kbd><span>Putar kamera</span></div>
          <div className="hint-touch"><kbd>Cubit</kbd><span>Zoom</span></div>
          <div className="hint-touch"><kbd>Tombol</kbd><span>Interaksi</span></div>
        </div>
        <p className="game-accreditation">Terakreditasi Baik Sekali · LAM INFOKOM</p>
      </section>
      <aside className="game-start-missions" aria-label="Tiga misi kampus">
        {MISSION_IDS.map((id, index) => (
          <div key={id} className="game-start-mission">
            <span>0{index + 1}</span>
            <div><strong>{TRACKS[id].singkatan}</strong><small>{TRACKS[id].tagline}</small></div>
          </div>
        ))}
      </aside>
    </main>
  );
}

function LiteCampus({
  completed,
  onSelect,
  onInfo,
}: {
  completed: MissionId[];
  onSelect: (id: MissionId) => void;
  onInfo: () => void;
}) {
  return (
    <div className="lite-campus">
      <div className="lite-campus-heading">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gold text-brand-navy"><IconMap className="h-5 w-5" /></span>
        <div><p className="text-xs font-black tracking-[0.14em] text-white/55">MODE RINGAN</p><h2 className="text-xl font-black text-white">Peta Kampus Digital</h2></div>
      </div>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65">Pilih gedung untuk menjalankan misi. Progres dan rekomendasimu sama dengan mode 3D.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {MISSION_IDS.map((id) => (
          <button key={id} onClick={() => onSelect(id)} className="lite-zone-card">
            <span className="lite-zone-art"><TrackIllustration id={id} className="h-14 w-14" />{completed.includes(id) && <span className="lite-zone-done" aria-label="Selesai"><IconCheck /></span>}</span>
            <strong>{TRACKS[id].singkatan}</strong>
            <small>{TRACKS[id].tagline}</small>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-black text-brand-gold">{completed.includes(id) ? "Mainkan ulang" : "Masuk misi"}<IconArrowRight className="h-3.5 w-3.5" /></span>
          </button>
        ))}
      </div>
      <button className="lite-info-card" onClick={onInfo}><IconInfo className="h-5 w-5" /><span><strong>Pusat Informasi</strong><small>Kurikulum, karier, alumni, dan prestasi</small></span><ChevronRightIcon /></button>
    </div>
  );
}

function ChevronRightIcon() {
  return <IconArrowRight className="ml-auto h-4 w-4 text-brand-gold" />;
}

export default function GameEntry() {
  const [progress, setProgress] = useState<GameProgress>(DEFAULT_GAME_PROGRESS);
  const [hydrated, setHydrated] = useState(false);
  const [started, setStarted] = useState(false);
  const [nearZone, setNearZone] = useState<CampusZone | null>(null);
  const [activeMission, setActiveMission] = useState<MissionId | null>(null);
  const [missionOpen, setMissionOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [liteMode, setLiteMode] = useState(false);
  // Dunia misi 3D juga dipakai di HP; hanya perangkat tanpa WebGL yang memakai misi pop-up.
  const [webglOk, setWebglOk] = useState(false);
  const [lowEnd, setLowEnd] = useState(false);
  const [worldOpen, setWorldOpen] = useState(false);
  const { startAudio, playSound, setMusic } = useGameAudio(progress.audio);
  const handleStep = useCallback(() => playSound("step"), [playSound]);
  const openDialogsRef = useRef(0);

  const completed = useMemo(() => MISSION_IDS.filter((id) => Boolean(progress.missions[id])), [progress.missions]);
  const scoreState = useMemo(() => getRecommendation(progress.missions, progress.recommendation ?? undefined), [progress.missions, progress.recommendation]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = readGameProgress();
      const params = new URLSearchParams(window.location.search);
      const zone = params.get("zone") as CampusZone | null;
      const next = { ...stored };
      if (zone && Object.keys(ZONE_LABELS).includes(zone)) next.spawnZone = zone;
      setProgress(next);
      setStarted(Boolean(stored.avatar) && (stored.phase !== "start" || params.has("zone") || params.has("panel") || params.has("mode")));
      setInfoOpen(params.get("panel") === "info");
      const webgl = supportsWebGL();
      setWebglOk(webgl);
      setLowEnd(isLowEndDevice());
      // Kampus 3D dipakai di semua ukuran layar (HP memakai joystick sentuh);
      // mode ringan hanya otomatis untuk perangkat tanpa WebGL.
      setLiteMode(!webgl);
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hydrated) saveGameProgress(progress);
  }, [hydrated, progress]);

  // Unduh model karakter selagi pemain masih di layar awal, agar kampus 3D cepat tampil.
  useEffect(() => {
    if (!hydrated || started || !webglOk || !progress.avatar) return;
    void fetch(`/characters/${progress.avatar}.glb`).catch(() => {});
  }, [hydrated, progress.avatar, started, webglOk]);

  const startGame = useCallback(() => {
    if (!progress.avatar) return;
    void startAudio().then(() => playSound("start"));
    setStarted(true);
    setProgress((current) => ({ ...current, phase: "explore" }));
  }, [playSound, progress.avatar, startAudio]);

  const selectCharacter = useCallback((avatar: GameAvatarId) => {
    playSound("click");
    setProgress((current) => ({ ...current, avatar }));
  }, [playSound]);

  const resetGame = useCallback(() => {
    window.localStorage.removeItem(GAME_STORAGE_KEY);
    setProgress(DEFAULT_GAME_PROGRESS);
    setStarted(false);
    setActiveMission(null);
    setMissionOpen(false);
    setInfoOpen(false);
    setAssistantOpen(false);
    setHelpOpen(false);
    setSettingsOpen(false);
    setResultOpen(false);
    setPaused(false);
  }, []);

  const openZone = useCallback((zone: CampusZone) => {
    playSound("interact");
    if (zone === "info") {
      setInfoOpen(true);
      return;
    }
    setActiveMission(zone);
    if (webglOk) setWorldOpen(true);
    else setMissionOpen(true);
    setProgress((current) => ({ ...current, phase: "mission", spawnZone: zone }));
  }, [playSound, webglOk]);

  const exitWorld = useCallback(() => {
    setWorldOpen(false);
    setActiveMission(null);
    setProgress((current) => ({ ...current, phase: "explore" }));
  }, []);

  const interact = useCallback(() => {
    if (nearZone) openZone(nearZone);
  }, [nearZone, openZone]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!started || worldOpen) return;
      if (event.key.toLowerCase() === "e" && !missionOpen && !infoOpen && !assistantOpen) interact();
      if (event.key === "Escape" && !missionOpen && !infoOpen && !assistantOpen && !helpOpen && !settingsOpen) {
        setPaused((current) => !current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeMission, assistantOpen, helpOpen, infoOpen, interact, missionOpen, settingsOpen, started, worldOpen]);

  const finishMission = (performance: number, affinityBonus: 0 | 15 | 30) => {
    if (!activeMission) return;
    playSound("missionComplete");
    const missionId = activeMission;
    const missions = {
      ...progress.missions,
      [missionId]: { missionId, performance, affinityBonus, completedAt: new Date().toISOString() },
    };
    const result = getRecommendation(missions);
    setProgress((current) => ({
      ...current,
      missions,
      recommendation: result.recommendation,
      phase: Object.keys(missions).length === 3 ? "complete" : "explore",
      spawnZone: missionId,
    }));
    setMissionOpen(false);
    setWorldOpen(false);
    setActiveMission(null);
    if (Object.keys(missions).length === 3) setResultOpen(true);
  };

  const chooseTieBreak = (id: JalurId) => {
    setProgress((current) => ({ ...current, recommendation: id }));
  };

  const quality = resolveQuality(progress.quality, lowEnd);
  const setQuality = (quality: GameQuality) => setProgress((current) => ({ ...current, quality }));
  const anyModal = missionOpen || infoOpen || assistantOpen || helpOpen || settingsOpen || resultOpen || paused;
  const openDialogs = [infoOpen, assistantOpen, helpOpen, settingsOpen, paused].filter(Boolean).length;

  // Dunia misi 3D mengatur temanya sendiri; misi pop-up memakai tema jalurnya,
  // selain itu musik plaza yang melembut saat menu/jendela terbuka.
  useEffect(() => {
    if (worldOpen) return;
    if (missionOpen && activeMission) setMusic(activeMission, 1);
    else setMusic("plaza", !started || anyModal ? 0.4 : 1);
  }, [activeMission, anyModal, missionOpen, setMusic, started, worldOpen]);

  useEffect(() => {
    if (openDialogs > openDialogsRef.current) playSound("open");
    else if (openDialogs < openDialogsRef.current) playSound("close");
    openDialogsRef.current = openDialogs;
  }, [openDialogs, playSound]);

  useEffect(() => {
    if (nearZone) playSound("near");
  }, [nearZone, playSound]);

  if (!hydrated) return <GameLoader label="Memuat Kampus Digital…" className="min-h-svh" showTips={false} />;
  if (!started) {
    return (
      <StartScreen
        hasProgress={completed.length > 0}
        selectedCharacter={progress.avatar}
        onSelectCharacter={selectCharacter}
        onStart={startGame}
        onReset={resetGame}
      />
    );
  }

  if (worldOpen && activeMission) {
    return (
      <GameSoundContext value={playSound}>
      <MissionWorld
        missionId={activeMission}
        avatar={progress.avatar ?? "arga"}
        quality={quality}
        sound={playSound}
        setMusic={setMusic}
        onComplete={finishMission}
        onExit={exitWorld}
      />
      </GameSoundContext>
    );
  }

  const currentRecommendation = progress.recommendation;
  const currentZone = nearZone ?? progress.spawnZone;
  const activeCharacterId = progress.avatar ?? "arga";
  const activeCharacter = CHARACTERS[activeCharacterId];

  return (
    <GameSoundContext value={playSound}>
    <main className="game-shell">
      <div className="game-viewport" aria-label="Kampus Digital Sistem Informasi UISI">
        {liteMode ? (
          <LiteCampus completed={completed} onSelect={openZone} onInfo={() => setInfoOpen(true)} />
        ) : (
          <GameCanvas
            avatar={activeCharacterId}
            completed={completed}
            paused={anyModal}
            spawnZone={progress.spawnZone}
            quality={quality}
            onNearZone={setNearZone}
            onStep={handleStep}
          />
        )}
      </div>

      <header className="game-hud-top">
        <div className="game-hud-identity">
          <div className="game-logo"><Image src="/icons/icon-192.png" alt="" width={30} height={30} className="game-logo-mark" unoptimized /><span>SISFOR UISI<small>KAMPUS DIGITAL</small></span></div>
          <div className="game-avatar-pill" aria-label={`Karakter aktif: ${activeCharacter.name}`}>
            <span className="game-avatar-portrait"><Image src={activeCharacter.image} alt="" width={56} height={84} unoptimized /></span>
            <span>{activeCharacter.name}<small>MAHASISWA SI</small></span>
          </div>
        </div>
        <div className="game-zone-pill"><IconMap className="h-4 w-4" /><span>{ZONE_LABELS[currentZone]}</span></div>
        <div className="game-hud-actions">
          <button onClick={() => setHelpOpen(true)} aria-label="Bantuan"><IconHelp /></button>
          <button onClick={() => setSettingsOpen(true)} aria-label="Pengaturan"><IconSettings /></button>
          <button onClick={() => setPaused(true)} aria-label="Jeda"><IconPause /></button>
        </div>
      </header>

      <aside className="game-objective-card">
        <div className="flex items-center justify-between gap-4">
          <div><p className="game-eyebrow">MISI KAMPUS</p><strong>{completed.length}/3 pusat selesai</strong></div>
          <span className="game-progress-number">{Math.round((completed.length / 3) * 100)}%</span>
        </div>
        <Progress value={(completed.length / 3) * 100} className="mt-3" indicatorClassName="bg-brand-gold" />
        <div className="mt-3 flex gap-2">
          {MISSION_IDS.map((id) => <span key={id} className={cn("game-mission-dot", completed.includes(id) && "is-done")} title={TRACKS[id].singkatan}>{completed.includes(id) ? <IconCheck /> : null}</span>)}
        </div>
      </aside>

      <nav className="game-hud-bottom" aria-label="Aksi kampus">
        <button onClick={() => setInfoOpen(true)}><IconBook /><span>Info Prodi</span></button>
        <button onClick={() => setAssistantOpen(true)}><IconChat /><span>Asisten</span></button>
        <a href="https://pmb.uisi.ac.id" target="_blank" rel="noreferrer"><IconGraduation /><span>Daftar UISI</span></a>
      </nav>

      {!liteMode && nearZone && !anyModal && (
        <button className="game-interact-prompt" onClick={interact}>
          <kbd className="hint-pointer">E</kbd><span>{nearZone === "info" ? "Buka Pusat Informasi" : completed.includes(nearZone) ? "Mainkan ulang misi" : "Mulai misi"}</span>
        </button>
      )}

      <Dialog open={missionOpen} onOpenChange={(open) => {
        setMissionOpen(open);
        if (!open) {
          setActiveMission(null);
          setProgress((current) => ({ ...current, phase: "explore" }));
        }
      }}>
        <DialogContent className="game-dialog max-w-3xl">
          {activeMission && <MissionPanel key={activeMission} missionId={activeMission} onComplete={finishMission} />}
        </DialogContent>
      </Dialog>

      <InfoCenter open={infoOpen} onOpenChange={setInfoOpen} />
      <CampusAssistant open={assistantOpen} onOpenChange={setAssistantOpen} />

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="game-dialog max-w-lg">
          <DialogHeader><DialogTitle>Cara menjelajah</DialogTitle><DialogDescription>Selesaikan ketiga misi dalam urutan bebas. Dekati kristal di depan setiap gedung untuk berinteraksi.</DialogDescription></DialogHeader>
          <div className="game-help-grid">
            <div className="hint-pointer"><kbd>WASD</kbd><span>Gerakkan avatar</span></div><div className="hint-pointer"><kbd>Mouse</kbd><span>Putar dan zoom kamera</span></div><div className="hint-pointer"><kbd>E</kbd><span>Masuk gedung</span></div><div className="hint-pointer"><kbd>Esc</kbd><span>Jeda permainan</span></div>
            <div className="hint-touch"><kbd>Joystick</kbd><span>Gerakkan avatar (kiri bawah)</span></div><div className="hint-touch"><kbd>Geser</kbd><span>Putar kamera, cubit untuk zoom</span></div><div className="hint-touch"><kbd>Tombol</kbd><span>Ketuk tombol emas untuk masuk gedung</span></div><div className="hint-touch"><kbd>Jeda</kbd><span>Tombol jeda di pojok kanan atas</span></div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="game-dialog max-w-lg">
          <DialogHeader><DialogTitle>Pengaturan pengalaman</DialogTitle><DialogDescription>Sesuaikan audio dan kualitas visual untuk perangkatmu.</DialogDescription></DialogHeader>
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between"><strong className="text-sm">Audio</strong><button onClick={() => setProgress((current) => ({ ...current, audio: { ...current.audio, muted: !current.audio.muted } }))} className="rounded-full bg-muted p-2" aria-label="Aktifkan atau matikan audio">{progress.audio.muted ? <IconMute className="h-5 w-5" /> : <IconVolume className="h-5 w-5" />}</button></div>
              <input aria-label="Volume" type="range" min="0" max="1" step="0.05" value={progress.audio.volume} onChange={(event) => setProgress((current) => ({ ...current, audio: { ...current.audio, volume: Number(event.target.value), muted: false } }))} className="mt-3 w-full accent-[var(--brand-gold)]" />
              {(["music", "sfx"] as const).map((key) => (
                <label key={key} className="mt-3 block text-xs font-bold text-muted-foreground">
                  {key === "music" ? "Musik latar" : "Efek suara"}
                  <input type="range" min="0" max="1" step="0.05" value={progress.audio[key]} onChange={(event) => setProgress((current) => ({ ...current, audio: { ...current.audio, [key]: Number(event.target.value) } }))} onPointerUp={() => key === "sfx" && playSound("pickup")} className="mt-1 w-full accent-[var(--brand-gold)]" />
                </label>
              ))}
            </div>
            <div><strong className="text-sm">Kualitas visual</strong><div className="mt-2 grid grid-cols-3 gap-2">{(["hemat", "auto", "tinggi"] as GameQuality[]).map((quality) => <button key={quality} onClick={() => setQuality(quality)} className={cn("rounded-2xl border px-3 py-2 text-sm font-bold capitalize", progress.quality === quality ? "border-brand-navy bg-brand-navy text-white" : "border-border")}>{quality}</button>)}</div>{progress.quality === "auto" && <p className="mt-2 text-xs text-muted-foreground">{lowEnd ? "Perangkat ini terdeteksi terbatas, jadi Auto memakai mode hemat." : "Auto menurunkan resolusi otomatis bila permainan mulai tersendat."}</p>}</div>
            <button onClick={() => setLiteMode((current) => !current)} className="w-full rounded-2xl border border-border p-3 text-left text-sm font-bold">{liteMode ? "Gunakan mode 3D" : "Gunakan mode ringan"}<span className="mt-1 block text-xs font-normal text-muted-foreground">Mode ringan memakai lebih sedikit daya dan tetap memiliki misi lengkap.</span></button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={paused} onOpenChange={setPaused}>
        <DialogContent className="game-dialog max-w-md text-center">
          <DialogHeader><DialogTitle className="text-center text-2xl">Eksplorasi dijeda</DialogTitle><DialogDescription className="text-center">Progresmu sudah tersimpan di perangkat ini.</DialogDescription></DialogHeader>
          <div className="grid gap-2 sm:grid-cols-2"><Button onClick={() => setPaused(false)}>Lanjutkan</Button><Button variant="outline" onClick={resetGame}>Mulai baru</Button></div>
        </DialogContent>
      </Dialog>

      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="game-dialog max-w-2xl">
          <DialogHeader>
            <p className="text-xs font-black tracking-[0.16em] text-brand-red">HASIL EKSPLORASI</p>
            <DialogTitle className="text-2xl sm:text-3xl">{currentRecommendation ? `Jalurmu: ${TRACKS[currentRecommendation].nama}` : "Dua jalurmu sama kuat"}</DialogTitle>
            <DialogDescription>{currentRecommendation ? TRACKS[currentRecommendation].tagline : "Pilih aktivitas yang paling ingin kamu pelajari lebih dalam."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-3">
            {MISSION_IDS.map((id) => {
              const scores = calculateTrackScores(progress.missions);
              return <div key={id} className={cn("rounded-3xl border-2 p-4", currentRecommendation === id ? "border-brand-gold bg-track-erp-soft" : "border-border bg-card")}><span className="text-3xl font-black text-brand-navy">{scores[id]}</span><small className="mt-1 block font-bold text-muted-foreground">{TRACKS[id].singkatan}</small></div>;
            })}
          </div>
          {!currentRecommendation && scoreState.ties.length > 1 && <div className="grid gap-2 sm:grid-cols-2">{scoreState.ties.map((id) => <Button key={id} variant="outline" onClick={() => chooseTieBreak(id)}>Aku pilih {TRACKS[id].singkatan}</Button>)}</div>}
          {currentRecommendation && <TrackDetails trackId={currentRecommendation} />}
          <div className="flex flex-col gap-2 sm:flex-row"><Button asChild variant="accent"><a href="https://pmb.uisi.ac.id" target="_blank" rel="noreferrer">Daftar di UISI <IconArrowRight className="h-4 w-4" /></a></Button><Button variant="outline" onClick={() => { setResultOpen(false); setInfoOpen(true); }}>Lihat kurikulum</Button><Button variant="ghost" onClick={() => setResultOpen(false)}>Kembali ke kampus</Button></div>
        </DialogContent>
      </Dialog>
    </main>
    </GameSoundContext>
  );
}
