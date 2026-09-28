"use client";

import { useRef, useState, type ReactNode, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { BarChart3, Flame, LineChart, PieChart, Search, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clampPercent, type Feedback } from "@/components/game/missions/mission-kit";
import { cn } from "@/lib/utils";
import { CHART_QUESTIONS, DATA_ISSUE_LABELS, INSIGHT_QUESTIONS } from "@/lib/data/missions";
import { DATA_BINS, DATA_CUBES } from "@/lib/data/worlds";
import type { ChartKind } from "@/lib/types";
import { TouchControls } from "../touch-controls";
import { usePressReader, type WorldInput } from "../world-controls";
import {
  clampDelta,
  FixedCamera,
  HudChip,
  Label,
  LevelEnd,
  Walker,
  WorldHud,
  WorldLights,
  WorldStage,
  useThrottled,
  type WorldLevelProps,
} from "../world-kit";

/* ------------------------------------------------------------------ */
/* Level 1 · Ban berjalan                                             */
/* ------------------------------------------------------------------ */

const LANES = DATA_BINS.map((_, index) => (index - 2) * 2.2);
const BELT_START = -20;
const BELT_END = 2.4;
const SORT_TIME = 110;

function Belt() {
  const slats = useRef<THREE.Group>(null);
  useFrame((_, raw) => {
    slats.current?.children.forEach((child) => {
      child.position.z += clampDelta(raw) * 2.5;
      if (child.position.z > BELT_END) child.position.z -= BELT_END - BELT_START;
    });
  });
  return (
    <group>
      <mesh position={[0, 0.2, (BELT_START + BELT_END) / 2]} receiveShadow>
        <boxGeometry args={[12, 0.4, BELT_END - BELT_START]} />
        <meshStandardMaterial color="#2a2f3a" roughness={0.8} />
      </mesh>
      <group ref={slats}>
        {Array.from({ length: 14 }, (_, index) => (
          <mesh key={index} position={[0, 0.41, BELT_START + index * ((BELT_END - BELT_START) / 14)]}>
            <boxGeometry args={[11.6, 0.02, 0.18]} />
            <meshStandardMaterial color="#454c5c" />
          </mesh>
        ))}
      </group>
      {[-6.2, 6.2].map((x) => (
        <mesh key={x} position={[x, 0.55, (BELT_START + BELT_END) / 2]} castShadow>
          <boxGeometry args={[0.4, 0.5, BELT_END - BELT_START]} />
          <meshStandardMaterial color="#ffa987" metalness={0.2} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function Bins({ flash }: { flash: { lane: number; ok: boolean; n: number } | null }) {
  return (
    <group position={[0, 0, BELT_END + 2]}>
      {DATA_BINS.map((bin, index) => {
        const lit = flash?.lane === index;
        return (
          <group key={bin.id} position={[LANES[index], 0, 0]}>
            <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
              <boxGeometry args={[2, 1.2, 2]} />
              <meshStandardMaterial color={bin.color} emissive={lit ? (flash.ok ? "#2fae66" : "#e54b4b") : "#000000"} emissiveIntensity={lit ? 0.8 : 0} />
            </mesh>
            <mesh position={[0, 1.21, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.6, 1.6]} />
              <meshStandardMaterial color="#0d0f14" />
            </mesh>
            <Label position={[0, 1.9, 0.4]} fixed>{bin.label}</Label>
          </group>
        );
      })}
    </group>
  );
}

function ConveyorScene({
  input,
  running,
  onResolve,
  onTick,
}: {
  input: WorldInput;
  running: boolean;
  onResolve: (index: number, lane: number) => boolean;
  onTick: (time: number, index: number) => void;
}) {
  const cube = useRef<THREE.Group>(null);
  const marker = useRef<THREE.Mesh>(null);
  const pressed = usePressReader(input);
  const state = useRef({ index: 0, lane: 2, x: 0, z: BELT_START, drop: 0, fast: false, time: SORT_TIME, speed: 3.4 });
  const [index, setIndex] = useState(0);
  const [flash, setFlash] = useState<{ lane: number; ok: boolean; n: number } | null>(null);
  const current = DATA_CUBES[index];

  useFrame((_, raw) => {
    const s = state.current;
    const delta = clampDelta(raw);
    if (running && s.index < DATA_CUBES.length && s.time > 0) {
      s.time = Math.max(0, s.time - delta);
      if (pressed("left")) s.lane = Math.max(0, s.lane - 1);
      if (pressed("right")) s.lane = Math.min(DATA_BINS.length - 1, s.lane + 1);
      if (pressed("action") || pressed("down")) s.fast = true;
      s.x = THREE.MathUtils.damp(s.x, LANES[s.lane], 14, delta);
      if (s.z < BELT_END + 2) {
        s.z += s.speed * (s.fast ? 5 : 1) * delta;
      } else {
        s.drop += delta;
        if (s.drop > 0.3) {
          const ok = onResolve(s.index, s.lane);
          s.speed = ok ? Math.min(6.5, s.speed + 0.3) : 3.4;
          setFlash({ lane: s.lane, ok, n: s.index });
          s.index += 1;
          s.z = BELT_START;
          s.drop = 0;
          s.fast = false;
          setIndex(s.index);
        }
      }
      onTick(s.time, s.index);
    }
    if (cube.current) {
      cube.current.position.set(s.x, 1 - s.drop * s.drop * 14, s.z);
      cube.current.rotation.y += delta * 0.6;
    }
    if (marker.current) marker.current.position.x = THREE.MathUtils.damp(marker.current.position.x, LANES[s.lane], 14, delta);
  });

  return (
    <>
      <FixedCamera position={[0, 12, 13.5]} target={[0, 0, -1.5]} />
      <WorldLights />
      <fog attach="fog" args={["#10131a", 24, 48]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#1b2029" />
      </mesh>
      <Belt />
      <mesh ref={marker} position={[LANES[2], 0.43, (BELT_START + BELT_END) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2, BELT_END - BELT_START]} />
        <meshBasicMaterial color="#ffa987" transparent opacity={0.16} />
      </mesh>
      <Bins flash={flash} />
      {current && (
        <group ref={cube} position={[0, 1, BELT_START]}>
          <RoundedBox args={[1.5, 1.2, 1.5]} radius={0.12} castShadow>
            <meshStandardMaterial color="#f7ebe8" emissive="#ffa987" emissiveIntensity={0.15} />
          </RoundedBox>
          <Label position={[0, 1.4, 0]} className="is-light" fixed>
            <span className="block text-[0.65rem] font-black text-muted-foreground">{current.kolom}</span>
            {current.nilai}
          </Label>
        </group>
      )}
    </>
  );
}

function ConveyorLevel({ levelIndex, info, paused, quality, input, sound, onPause, onFinish }: WorldLevelProps) {
  const total = DATA_CUBES.length;
  const [hud, setHud] = useState({ time: SORT_TIME, index: 0 });
  const push = useThrottled(setHud);
  const [correct, setCorrect] = useState(0);
  const [combo, setCombo] = useState(0);
  const [toast, setToast] = useState<Feedback>(null);
  const ended = hud.index >= total || hud.time <= 0;
  const score = clampPercent((correct / total) * 100);

  const resolve = (index: number, lane: number) => {
    const cube = DATA_CUBES[index];
    const bin = DATA_BINS[lane];
    const ok = bin.id === cube.jenis;
    sound(ok ? "pickup" : "error");
    if (ok) {
      setCorrect((value) => value + 1);
      setCombo((value) => value + 1);
    } else {
      setCombo(0);
    }
    const right = cube.jenis === "bersih" ? "Bersih" : DATA_ISSUE_LABELS[cube.jenis];
    setToast({
      ok,
      judul: ok ? `Tepat! ${cube.kolom}: ${cube.nilai}` : `Seharusnya: ${right}`,
      teks: cube.penjelasan,
      konsep: right,
    });
    return ok;
  };

  return (
    <WorldStage
      quality={quality}
      paused={paused || ended}
      overlay={
        <>
          <WorldHud
            levelIndex={levelIndex}
            info={info}
            onPause={onPause}
            toast={toast}
            prompt={!ended && DATA_CUBES[hud.index] ? <><kbd>{DATA_CUBES[hud.index].kolom}</kbd>{DATA_CUBES[hud.index].nilai}</> : undefined}
            stats={
              <>
                <HudChip tone={hud.time <= 15 ? "red" : "dark"} pulse={hud.time <= 15}><Timer />{Math.ceil(hud.time)}s</HudChip>
                <HudChip>{Math.min(hud.index + 1, total)}/{total} kubus</HudChip>
                {combo >= 2 && <HudChip tone="gold"><Flame />×{combo}</HudChip>}
              </>
            }
          />
          <TouchControls inputRef={input} mode="lanes" buttons={[{ press: "action", label: "Jatuhkan" }]} />
          {ended && (
            <LevelEnd
              score={score}
              reason={hud.index >= total ? "Semua kubus tersortir" : "Waktu habis"}
              detail={`${correct} dari ${total} kubus masuk keranjang yang benar.`}
              onNext={() => onFinish(score)}
            />
          )}
        </>
      }
    >
      <ConveyorScene input={input} running={!paused && !ended} onResolve={resolve} onTick={(time, index) => push({ time, index }, index !== hud.index || time <= 0)} />
    </WorldStage>
  );
}

/* ------------------------------------------------------------------ */
/* Level 2 · Bangun grafik                                            */
/* ------------------------------------------------------------------ */

const BAR_DATA = CHART_QUESTIONS[0].data;
const BAR_SCALE = 1 / 30;
const BAR_X = (index: number) => (index - (BAR_DATA.length - 1) / 2) * 2.1;
const TYPE_QUESTIONS = CHART_QUESTIONS.slice(1);
const CHART_FACES: { kind: ChartKind; label: string }[] = [
  { kind: "bar", label: "Batang" },
  { kind: "line", label: "Garis" },
  { kind: "pie", label: "Lingkaran" },
];

function BarColumn({ index, value, selected, status, labels }: { index: number; value: number; selected: boolean; status: "idle" | "ok" | "bad"; labels: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((_, raw) => {
    if (!mesh.current) return;
    const height = Math.max(0.02, value * BAR_SCALE);
    mesh.current.scale.y = THREE.MathUtils.damp(mesh.current.scale.y, height, 12, clampDelta(raw));
    mesh.current.position.y = mesh.current.scale.y / 2;
  });
  const color = status === "ok" ? "#2fae66" : status === "bad" ? "#e54b4b" : selected ? "#ffa987" : "#6d7a93";
  return (
    <group position={[BAR_X(index), 0, 0]}>
      <mesh ref={mesh} castShadow>
        <boxGeometry args={[1.4, 1, 1.4]} />
        <meshStandardMaterial color={color} emissive={selected ? "#ffa987" : "#000"} emissiveIntensity={selected ? 0.35 : 0} />
      </mesh>
      {labels && (
        <>
          <Label position={[0, value * BAR_SCALE + 0.7, 0]} className={selected ? "is-gold" : undefined} fixed>{value}</Label>
          <Label position={[0, -0.2, 1.4]} fixed>{BAR_DATA[index].label}</Label>
        </>
      )}
    </group>
  );
}

function FaceIcon({ kind }: { kind: ChartKind }) {
  const ink = <meshStandardMaterial color="#1e1e24" />;
  if (kind === "bar") {
    return (
      <group>
        {[0.35, 0.7, 0.5].map((h, i) => (
          <mesh key={i} position={[(i - 1) * 0.38, h / 2 - 0.4, 0]}><boxGeometry args={[0.26, h, 0.08]} />{ink}</mesh>
        ))}
      </group>
    );
  }
  if (kind === "line") {
    const points: [number, number][] = [[-0.55, -0.3], [-0.18, -0.05], [0.18, -0.15], [0.55, 0.3]];
    return (
      <group>
        {points.map(([x, y], i) => (
          <mesh key={i} position={[x, y, 0]}><sphereGeometry args={[0.08, 10, 8]} />{ink}</mesh>
        ))}
        {points.slice(1).map(([x, y], i) => {
          const [px, py] = points[i];
          return (
            <mesh key={`s${i}`} position={[(x + px) / 2, (y + py) / 2, 0]} rotation={[0, 0, Math.atan2(y - py, x - px)]}>
              <boxGeometry args={[Math.hypot(x - px, y - py), 0.05, 0.05]} />{ink}
            </mesh>
          );
        })}
      </group>
    );
  }
  return (
    <group>
      <mesh><circleGeometry args={[0.5, 32, 0, Math.PI * 1.3]} /><meshStandardMaterial color="#1e1e24" side={THREE.DoubleSide} /></mesh>
      <mesh position={[0.05, 0.05, 0]}><circleGeometry args={[0.5, 32, Math.PI * 1.3, Math.PI * 0.7]} /><meshStandardMaterial color="#e54b4b" side={THREE.DoubleSide} /></mesh>
    </group>
  );
}

function Prism({ face }: { face: number }) {
  const group = useRef<THREE.Group>(null);
  // Sisi prisma segitiga menghadap sudut 60°, 180°, 300°; putar agar sisi terpilih menghadap kamera (+Z).
  const target = -(face * ((Math.PI * 2) / 3) + Math.PI / 3);
  useFrame((_, raw) => {
    if (group.current) group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, target, 8, clampDelta(raw));
  });
  return (
    <Float speed={2} floatIntensity={0.3} rotationIntensity={0.05}>
      <group position={[0, 3.2, 4.5]}>
        <group ref={group}>
          <mesh castShadow>
            <cylinderGeometry args={[2, 2, 2.4, 3]} />
            <meshStandardMaterial color="#ffa987" flatShading />
          </mesh>
          {CHART_FACES.map((item, index) => {
            const angle = (index * Math.PI * 2) / 3 + Math.PI / 3;
            return (
              <group key={item.kind} position={[Math.sin(angle) * 1.02, 0.1, Math.cos(angle) * 1.02]} rotation={[0, angle, 0]}>
                <FaceIcon kind={item.kind} />
              </group>
            );
          })}
        </group>
        <Label position={[0, 2, 0]} className="is-light" fixed>
          ‹ {CHART_FACES[face].label} ›
        </Label>
      </group>
    </Float>
  );
}

function ChartScene({
  input,
  running,
  phase,
  onMove,
  onAdjust,
  onConfirm,
  children,
}: {
  input: WorldInput;
  running: boolean;
  phase: "build" | "type";
  onMove: (dir: -1 | 1) => void;
  onAdjust: (amount: number) => void;
  onConfirm: () => void;
  children: ReactNode;
}) {
  const pressed = usePressReader(input);
  const hold = useRef({ key: "", time: 0 });
  useFrame((_, raw) => {
    if (!running) return;
    const delta = clampDelta(raw);
    if (pressed("left")) onMove(-1);
    if (pressed("right")) onMove(1);
    if (pressed("action")) onConfirm();
    if (phase !== "build") return;
    if (pressed("up")) { onAdjust(5); hold.current = { key: "w", time: 0 }; }
    if (pressed("down")) { onAdjust(-5); hold.current = { key: "s", time: 0 }; }
    const key = input.current.held.w ? "w" : input.current.held.s ? "s" : "";
    if (key && key === hold.current.key) {
      hold.current.time += delta;
      if (hold.current.time > 0.35) {
        hold.current.time -= 0.07;
        onAdjust(key === "w" ? 5 : -5);
      }
    } else {
      hold.current = { key: "", time: 0 };
    }
  });
  return (
    <>
      <FixedCamera position={[0, 7, 15]} target={[0, 2.8, 0]} />
      <WorldLights />
      <fog attach="fog" args={["#10131a", 26, 50]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#1b2029" />
      </mesh>
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[16, 0.1, 3.2]} />
        <meshStandardMaterial color="#2a2f3a" />
      </mesh>
      {children}
    </>
  );
}

function ChartLevel({ levelIndex, info, paused, quality, input, sound, onPause, onFinish }: WorldLevelProps) {
  const [values, setValues] = useState(() => BAR_DATA.map(() => 60));
  const [selected, setSelected] = useState(0);
  const [phase, setPhase] = useState<"build" | "type" | "done">("build");
  const [checked, setChecked] = useState<boolean[] | null>(null);
  const [question, setQuestion] = useState(0);
  const [face, setFace] = useState(0);
  const [typeCorrect, setTypeCorrect] = useState(0);
  const [toast, setToast] = useState<Feedback>(null);
  const barsCorrect = checked?.filter(Boolean).length ?? 0;
  const score = clampPercent((barsCorrect / BAR_DATA.length) * 60 + (typeCorrect / TYPE_QUESTIONS.length) * 40);

  const move = (dir: -1 | 1) => {
    if (phase === "build") setSelected((value) => (value + dir + BAR_DATA.length) % BAR_DATA.length);
    if (phase === "type") setFace((value) => (value + dir + CHART_FACES.length) % CHART_FACES.length);
  };
  const adjust = (amount: number) => {
    setValues((current) => current.map((value, index) => (index === selected ? Math.max(0, Math.min(240, value + amount)) : value)));
  };
  const confirm = () => {
    if (phase === "build") {
      const result = BAR_DATA.map((item, index) => Math.abs(values[index] - item.nilai) <= 5);
      const count = result.filter(Boolean).length;
      setChecked(result);
      sound(count >= 5 ? "success" : "error");
      setToast({
        ok: count >= 5,
        judul: `${count}/${BAR_DATA.length} batang akurat`,
        teks: result[2] ? "Toko Barokah benar di 0 — nilai negatif sudah kamu bersihkan." : "Ingat: Toko Barokah tercatat -5, setelah dibersihkan nilainya 0.",
        konsep: "Visualisasi data",
      });
      setPhase("type");
      return;
    }
    if (phase === "type") {
      const q = TYPE_QUESTIONS[question];
      const ok = CHART_FACES[face].kind === q.jawaban;
      sound(ok ? "pickup" : "error");
      if (ok) setTypeCorrect((value) => value + 1);
      setToast({ ok, judul: ok ? "Grafik yang pas!" : `Lebih tepat grafik ${CHART_FACES.find((item) => item.kind === q.jawaban)?.label.toLowerCase()}`, teks: q.penjelasan, konsep: "Visualisasi data" });
      if (question + 1 >= TYPE_QUESTIONS.length) setPhase("done");
      else setQuestion((value) => value + 1);
    }
  };

  const typeQuestion = TYPE_QUESTIONS[question];
  return (
    <WorldStage
      quality={quality}
      paused={paused || phase === "done"}
      overlay={
        <>
          <WorldHud
            levelIndex={levelIndex}
            info={info}
            onPause={onPause}
            toast={toast}
            stats={
              <HudChip tone="gold">
                {phase === "build" ? <><BarChart3 /> Atur batang {selected + 1}/{BAR_DATA.length}</> : phase === "type" ? <><PieChart /> Soal {question + 1}/{TYPE_QUESTIONS.length}</> : <><LineChart /> Selesai</>}
              </HudChip>
            }
            prompt={
              phase === "build" ? <><kbd>W/S</kbd>atur tinggi · <kbd>Spasi</kbd>kunci grafik</>
                : phase === "type" ? <span className="whitespace-normal">“{typeQuestion.pertanyaan}” <kbd className="ml-1">A/D</kbd>putar · <kbd>Spasi</kbd>pilih</span>
                  : undefined
            }
          />
          {phase === "build" && (
            <aside className="world-side">
              <h4>DATA BERSIH</h4>
              <ul className="grid gap-0.5">
                {BAR_DATA.map((item, index) => (
                  <li key={item.label} className={cn("flex justify-between", index === selected && "font-black text-brand-gold")}>
                    <span>{item.label}</span>
                    <span className="tabular-nums">{index === 2 ? "-5 → ?" : item.nilai}</span>
                  </li>
                ))}
              </ul>
            </aside>
          )}
          <TouchControls
            inputRef={input}
            mode="lanes"
            buttons={
              phase === "build"
                ? [
                    { press: "up", label: "▲", holdKey: "w", tone: "light" },
                    { press: "down", label: "▼", holdKey: "s", tone: "light" },
                    { press: "action", label: "Kunci" },
                  ]
                : [{ press: "action", label: "Pilih" }]
            }
          />
          {phase === "done" && (
            <LevelEnd
              score={score}
              reason="Dasbor siap"
              detail={`${barsCorrect}/${BAR_DATA.length} batang akurat · ${typeCorrect}/${TYPE_QUESTIONS.length} jenis grafik tepat.`}
              onNext={() => onFinish(score)}
            />
          )}
        </>
      }
    >
      <ChartScene input={input} running={!paused && phase !== "done"} phase={phase === "build" ? "build" : "type"} onMove={move} onAdjust={adjust} onConfirm={confirm}>
        <group position={[0, 0, phase === "build" ? 0 : -9]} scale={phase === "build" ? 1 : 0.7}>
        {BAR_DATA.map((_, index) => (
          <BarColumn
            key={index}
            index={index}
            value={values[index]}
            selected={phase === "build" && index === selected}
            status={checked ? (checked[index] ? "ok" : "bad") : "idle"}
            labels={phase === "build"}
          />
        ))}
        </group>
        {phase !== "build" && <Prism face={face} />}
      </ChartScene>
    </WorldStage>
  );
}

/* ------------------------------------------------------------------ */
/* Level 3 · Kota data                                                */
/* ------------------------------------------------------------------ */

const CITY_TIME = 80;
const CITY = BAR_DATA.map((item, index) => ({ ...item, x: (index - 3) * 4.4, z: -8, h: item.nilai * 0.035 }));
const CLUES = [
  { id: "c1", x: CITY[2].x, z: -8, judul: "TKP: Toko Barokah", teks: "Catatan gudang: Toko Barokah tidak menerima kiriman semen selama 3 minggu — stoknya kosong, bukan karena tidak laku." },
  { id: "c2", x: CITY[3].x, z: -5, judul: "Toko Jaya", teks: "Toko Jaya penjualannya tertinggi (210 unit) dan sudah sering kehabisan stok sore hari." },
  { id: "c3", x: 13, z: 2.5, judul: "Papan tren", teks: "Total penjualan Jan–Jun naik rata-rata ±5% per bulan; April hanya turun sedikit." },
];
const BOARD: [number, number] = [0, 3.5];

function cityBlocked(x: number, z: number) {
  if (Math.abs(x) > 18 || z < -13 || z > 9) return true;
  return CITY.some((b) => b.h > 0 && Math.abs(x - b.x) < 1.9 && Math.abs(z - b.z) < 1.9) || (Math.abs(x - BOARD[0]) < 1.4 && Math.abs(z - (BOARD[1] - 1)) < 0.5);
}

function CityScene({
  avatar,
  input,
  running,
  found,
  boardOpen,
  onClue,
  onNearBoard,
  onBoard,
  onStep,
}: {
  avatar: WorldLevelProps["avatar"];
  input: WorldInput;
  running: boolean;
  found: string[];
  boardOpen: boolean;
  onClue: (id: string) => void;
  onNearBoard: (near: boolean) => void;
  onBoard: () => void;
  onStep: () => void;
}) {
  const player = useRef<THREE.Group>(null);
  const pressed = usePressReader(input);
  const near = useRef(false);
  useFrame(() => {
    const p = player.current;
    if (!p || !running) return;
    CLUES.forEach((clue) => {
      if (!found.includes(clue.id) && Math.hypot(p.position.x - clue.x, p.position.z - clue.z) < 1.5) onClue(clue.id);
    });
    const isNear = Math.hypot(p.position.x - BOARD[0], p.position.z - BOARD[1]) < 2.6;
    if (isNear !== near.current) {
      near.current = isNear;
      onNearBoard(isNear);
    }
    if (isNear && pressed("interact")) onBoard();
    else pressed("interact");
  });

  return (
    <>
      <WorldLights />
      <fog attach="fog" args={["#bcd3e6", 30, 70]} />
      <color attach="background" args={["#bcd3e6"]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#8fb87a" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -2]} receiveShadow>
        <planeGeometry args={[40, 3]} />
        <meshStandardMaterial color="#6c6f78" />
      </mesh>
      {CITY.map((building, index) => (
        <group key={building.label} position={[building.x, 0, building.z]}>
          {building.h > 0 ? (
            <mesh position={[0, building.h / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[3, building.h, 3]} />
              <meshStandardMaterial color={index === 3 ? "#ffa987" : "#7d95a3"} />
            </mesh>
          ) : (
            <>
              <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[3, 3]} />
                <meshStandardMaterial color="#c9a676" />
              </mesh>
              {[[-1.5, 0], [1.5, 0], [0, -1.5], [0, 1.5]].map(([x, z], i) => (
                <mesh key={i} position={[x, 0.5, z]} rotation={[0, i < 2 ? Math.PI / 2 : 0, 0]}>
                  <boxGeometry args={[3, 0.12, 0.04]} />
                  <meshStandardMaterial color="#f2c230" emissive="#f2c230" emissiveIntensity={0.3} />
                </mesh>
              ))}
            </>
          )}
          <Label position={[0, building.h + 0.9, 0]} className={building.h === 0 ? "is-red" : undefined} fixed>
            {building.label} · {building.nilai}
          </Label>
        </group>
      ))}
      <group position={[13, 0, 0]}>
        <mesh position={[0, 1.6, 0]} castShadow>
          <boxGeometry args={[4, 2.4, 0.2]} />
          <meshStandardMaterial color="#1e1e24" />
        </mesh>
        <Label position={[0, 1.6, 0.2]} fixed>Tren Jan–Jun ↗</Label>
      </group>
      {CLUES.filter((clue) => !found.includes(clue.id)).map((clue) => (
        <Float key={clue.id} speed={3} floatIntensity={0.6}>
          <mesh position={[clue.x, 1.2, clue.z]}>
            <octahedronGeometry args={[0.45]} />
            <meshStandardMaterial color="#ffd166" emissive="#ffd166" emissiveIntensity={0.8} />
          </mesh>
        </Float>
      ))}
      <group position={[BOARD[0], 0, BOARD[1] - 1]}>
        <mesh position={[0, 1.4, 0]} castShadow>
          <boxGeometry args={[2.6, 1.8, 0.2]} />
          <meshStandardMaterial color={boardOpen ? "#ffa987" : "#444140"} emissive={boardOpen ? "#ffa987" : "#000"} emissiveIntensity={boardOpen ? 0.4 : 0} />
        </mesh>
        <Label position={[0, 2.8, 0]} className={boardOpen ? "is-gold" : undefined} fixed>
          {boardOpen ? "Papan Kesimpulan" : "Kumpulkan 3 petunjuk"}
        </Label>
      </group>
      <Walker avatar={avatar} input={input} playerRef={player} start={[0, 7]} frozen={!running} blocked={cityBlocked} cameraOffset={[0, 11, 11.5]} onStep={onStep} />
    </>
  );
}

function CityLevel({ levelIndex, info, paused, quality, avatar, input, sound, onPause, onFinish }: WorldLevelProps) {
  const [found, setFound] = useState<string[]>([]);
  const [time, setTime] = useState(CITY_TIME);
  const [nearBoard, setNearBoard] = useState(false);
  const [asking, setAsking] = useState(false);
  const [question, setQuestion] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [toast, setToast] = useState<Feedback>(null);
  const clock = useRef({ time: CITY_TIME });
  const push = useThrottled(setTime, 4);
  const boardOpen = found.length >= CLUES.length || time <= 0;
  const ended = question >= INSIGHT_QUESTIONS.length;
  const score = clampPercent((found.length / CLUES.length) * 30 + (correct / INSIGHT_QUESTIONS.length) * 70);
  const q = INSIGHT_QUESTIONS[question];
  const running = !paused && !asking && !ended;

  const clue = (id: string) => {
    const item = CLUES.find((entry) => entry.id === id)!;
    setFound((current) => (current.includes(id) ? current : [...current, id]));
    sound("pickup");
    setToast({ ok: true, judul: `Petunjuk: ${item.judul}`, teks: item.teks, konsep: "Investigasi data" });
  };

  const answer = (id: string) => {
    if (picked) return;
    const option = q.opsi.find((item) => item.id === id)!;
    setPicked(id);
    sound(option.benar ? "success" : "error");
    if (option.benar) setCorrect((value) => value + 1);
  };

  return (
    <WorldStage
      quality={quality}
      paused={paused || ended}
      overlay={
        <>
          <WorldHud
            levelIndex={levelIndex}
            info={info}
            onPause={onPause}
            toast={asking ? null : toast}
            stats={
              <>
                <HudChip tone={time <= 15 && !boardOpen ? "red" : "dark"}><Timer />{boardOpen ? "Papan terbuka" : `${Math.ceil(time)}s`}</HudChip>
                <HudChip tone="gold"><Search />{found.length}/{CLUES.length} petunjuk</HudChip>
              </>
            }
            prompt={nearBoard && boardOpen && !asking && !ended ? <><kbd>E</kbd>Ambil kesimpulan</> : undefined}
          />
          <TouchControls inputRef={input} mode="stick" buttons={[{ press: "interact", label: "Periksa" }]} />
          {asking && !ended && (
            <div className="world-overlay-card mission-pop">
              <p className="text-xs font-black tracking-[0.15em] text-muted-foreground">KESIMPULAN {question + 1}/{INSIGHT_QUESTIONS.length}</p>
              <p className="mt-1 font-black">{q.pertanyaan}</p>
              <div className="mt-3 grid gap-2">
                {q.opsi.map((option) => (
                  <button
                    key={option.id}
                    disabled={Boolean(picked)}
                    onClick={() => answer(option.id)}
                    className={cn(
                      "rounded-2xl border-2 p-3 text-left text-sm font-semibold transition",
                      !picked && "border-border hover:border-track-data hover:bg-track-data-soft",
                      picked && option.benar && "border-emerald-500 bg-emerald-50",
                      picked === option.id && !option.benar && "border-track-audit bg-track-audit-soft"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {picked && (
                <>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{q.opsi.find((item) => item.id === picked)?.penjelasan}</p>
                  <Button
                    className="mt-3 w-full"
                    onClick={() => {
                      setPicked(null);
                      setQuestion((value) => value + 1);
                      if (question + 1 >= INSIGHT_QUESTIONS.length) setAsking(false);
                    }}
                  >
                    {question + 1 < INSIGHT_QUESTIONS.length ? "Pertanyaan berikutnya" : "Selesai"}
                  </Button>
                </>
              )}
            </div>
          )}
          {ended && (
            <LevelEnd
              score={score}
              reason="Kasus terpecahkan"
              detail={`${found.length}/${CLUES.length} petunjuk · ${correct}/${INSIGHT_QUESTIONS.length} kesimpulan tepat.`}
              isLast
              onNext={() => onFinish(score)}
            />
          )}
        </>
      }
    >
      <CityClock clockRef={clock} running={running && !boardOpen} onTick={(value) => push(value, value <= 0)} />
      <CityScene
        avatar={avatar}
        input={input}
        running={running}
        found={found}
        boardOpen={boardOpen}
        onClue={clue}
        onNearBoard={setNearBoard}
        onBoard={() => {
          if (!boardOpen) {
            setToast({ ok: false, judul: "Belum cukup bukti", teks: "Temukan semua petunjuk (kristal kuning) sebelum mengambil kesimpulan." });
            return;
          }
          sound("interact");
          setAsking(true);
        }}
        onStep={() => sound("step")}
      />
    </WorldStage>
  );
}

function CityClock({ clockRef, running, onTick }: { clockRef: RefObject<{ time: number }>; running: boolean; onTick: (time: number) => void }) {
  useFrame((_, raw) => {
    if (!running || clockRef.current.time <= 0) return;
    clockRef.current.time = Math.max(0, clockRef.current.time - clampDelta(raw));
    onTick(clockRef.current.time);
  });
  return null;
}

export const DATA_LEVELS = [ConveyorLevel, ChartLevel, CityLevel];
