"use client";

import { useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Flag, Gauge, Package, Smile, Timer, Trophy } from "lucide-react";
import { clampPercent, type Feedback } from "@/components/game/missions/mission-kit";
import { ERP_BOARD_SCORES, ERP_EVENTS, ERP_MODULES, ERP_ORDERS } from "@/lib/data/missions";
import { BOARD_GATES, RACE_PADS, RUSH_STOPS, TRACK_POINTS } from "@/lib/data/worlds";
import { TouchControls } from "../touch-controls";
import { readAxis, type WorldInput } from "../world-controls";
import {
  clampDelta,
  HudChip,
  HudMeter,
  Label,
  LevelEnd,
  WorldHud,
  WorldLights,
  WorldStage,
  useThrottled,
  type WorldLevelProps,
} from "../world-kit";

/* ------------------------------------------------------------------ */
/* Lintasan & fisika truk                                             */
/* ------------------------------------------------------------------ */

const ROAD_WIDTH = 10;
const SAMPLES = 600;

const TRACK = (() => {
  const curve = new THREE.CatmullRomCurve3(TRACK_POINTS.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, "centripetal");
  const points = curve.getSpacedPoints(SAMPLES).slice(0, SAMPLES);
  const tangents = points.map((_, index) => curve.getTangentAt(index / SAMPLES));
  // Normal "kanan" di bidang XZ. Offset gerbang dan posisi lateral truk memakai normal yang sama.
  const normals = tangents.map((t) => new THREE.Vector3(-t.z, 0, t.x));
  return { points, tangents, normals, length: curve.getLength() };
})();

const indexAt = (t: number) => ((Math.round(t * SAMPLES) % SAMPLES) + SAMPLES) % SAMPLES;

function pointAt(t: number, offset = 0) {
  const index = indexAt(t);
  return TRACK.points[index].clone().addScaledVector(TRACK.normals[index], offset);
}

function nearestIndex(position: THREE.Vector3, hint: number) {
  let best = hint;
  let bestDistance = Infinity;
  for (let step = -40; step <= 40; step++) {
    const index = (hint + step + SAMPLES) % SAMPLES;
    const distance = TRACK.points[index].distanceToSquared(position);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = index;
    }
  }
  return best;
}

/** Apakah perjalanan dari indeks `from` ke `to` (maju) melewati indeks `mark`. */
function crossed(from: number, to: number, mark: number) {
  if (from === to) return false;
  if (to > from) return mark > from && mark <= to;
  return mark > from || mark <= to;
}

function Road() {
  const geometry = useMemo(() => {
    const vertices: number[] = [];
    const indices: number[] = [];
    TRACK.points.forEach((point, index) => {
      const n = TRACK.normals[index];
      vertices.push(point.x + n.x * (ROAD_WIDTH / 2), 0.02, point.z + n.z * (ROAD_WIDTH / 2));
      vertices.push(point.x - n.x * (ROAD_WIDTH / 2), 0.02, point.z - n.z * (ROAD_WIDTH / 2));
      const a = index * 2;
      const b = ((index + 1) % SAMPLES) * 2;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    });
    const shape = new THREE.BufferGeometry();
    shape.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    shape.setIndex(indices);
    shape.computeVertexNormals();
    return shape;
  }, []);

  return (
    <group>
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial color="#3a3f4b" side={THREE.DoubleSide} roughness={0.9} />
      </mesh>
      {TRACK.points.map((point, index) =>
        index % 12 === 0 ? (
          <mesh key={index} position={[point.x, 0.04, point.z]} rotation={[-Math.PI / 2, 0, Math.atan2(TRACK.tangents[index].x, TRACK.tangents[index].z)]}>
            <planeGeometry args={[0.35, 2.6]} />
            <meshBasicMaterial color="#f7ebe8" />
          </mesh>
        ) : null
      )}
      {TRACK.points.map((point, index) =>
        index % 6 === 0
          ? [1, -1].map((side) => {
              const edge = point.clone().addScaledVector(TRACK.normals[index], side * (ROAD_WIDTH / 2 + 0.3));
              return (
                <mesh key={`${index}-${side}`} position={[edge.x, 0.15, edge.z]}>
                  <boxGeometry args={[0.6, 0.3, 0.6]} />
                  <meshStandardMaterial color={(index / 6) % 2 === 0 ? "#e54b4b" : "#f7ebe8"} />
                </mesh>
              );
            })
          : null
      )}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 25]} receiveShadow>
        <circleGeometry args={[130, 48]} />
        <meshStandardMaterial color="#86b86c" />
      </mesh>
    </group>
  );
}

function Scenery() {
  const trees = useMemo(
    () =>
      Array.from({ length: 46 }, (_, index) => {
        const t = index / 46;
        const side = index % 2 === 0 ? 1 : -1;
        const p = pointAt(t, side * (ROAD_WIDTH / 2 + 5 + (index % 5)));
        return { x: p.x, z: p.z, s: 0.8 + ((index * 37) % 10) / 20 };
      }),
    []
  );
  return (
    <group>
      {trees.map((tree, index) => (
        <group key={index} position={[tree.x, 0, tree.z]} scale={tree.s}>
          <mesh position={[0, 0.8, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.28, 1.6, 6]} />
            <meshStandardMaterial color="#6b4a2f" />
          </mesh>
          <mesh position={[0, 2.2, 0]} castShadow>
            <coneGeometry args={[1.3, 2.6, 7]} />
            <meshStandardMaterial color={index % 3 ? "#3f8f4b" : "#2f7a44"} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function TruckModel({ color = "#ffa987", drum = "#e8e2dc", label }: { color?: string; drum?: string; label?: string }) {
  const drumRef = useRef<THREE.Mesh>(null);
  useFrame((_, raw) => {
    if (drumRef.current) drumRef.current.rotation.y += clampDelta(raw) * 2.4;
  });
  return (
    <group>
      <mesh position={[0, 1.15, 1.55]} castShadow>
        <boxGeometry args={[2.1, 1.6, 1.3]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 1.45, 2.22]}>
        <boxGeometry args={[1.8, 0.7, 0.05]} />
        <meshStandardMaterial color="#9fd3ff" emissive="#9fd3ff" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0, 0.55, -0.2]} castShadow>
        <boxGeometry args={[2.2, 0.4, 4.4]} />
        <meshStandardMaterial color="#2a2f3a" />
      </mesh>
      <group position={[0, 1.65, -0.5]} rotation={[Math.PI / 2 - 0.25, 0, 0]}>
        <mesh ref={drumRef} castShadow>
          <cylinderGeometry args={[0.95, 1.1, 2.9, 12]} />
          <meshStandardMaterial color={drum} flatShading />
        </mesh>
      </group>
      {[[-1.05, 1.5], [1.05, 1.5], [-1.05, -1.3], [1.05, -1.3]].map(([x, z], index) => (
        <mesh key={index} position={[x, 0.45, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.45, 0.45, 0.35, 12]} />
          <meshStandardMaterial color="#15171c" />
        </mesh>
      ))}
      {label && <Label position={[0, 3.6, 0]} className="is-red" distanceFactor={16}>{label}</Label>}
    </group>
  );
}

type TruckState = {
  pos: THREE.Vector3;
  heading: number;
  speed: number;
  index: number;
  lap: number;
  lateral: number;
  boost: number;
  slow: number;
};

function createTruck(): TruckState {
  const t = TRACK.tangents[0];
  return { pos: TRACK.points[0].clone(), heading: Math.atan2(t.x, t.z), speed: 0, index: 0, lap: 0, lateral: 0, boost: 0, slow: 0 };
}

/**
 * Menjalankan fisika truk dan kamera kejar. `onMove(from, to, lapDone)` dipanggil
 * setiap frame dengan indeks lintasan sebelum/sesudah untuk deteksi gerbang.
 */
function PlayerTruck({
  input,
  running,
  truckRef,
  onMove,
}: {
  input: WorldInput;
  running: boolean;
  truckRef: RefObject<TruckState>;
  onMove: (from: number, to: number, lapDone: boolean, delta: number) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3());

  useFrame((_, raw) => {
    const s = truckRef.current;
    const delta = clampDelta(raw);
    if (running) {
      const axis = readAxis(input.current);
      const onRoad = Math.abs(s.lateral) < ROAD_WIDTH / 2 + 0.6;
      s.boost = Math.max(0, s.boost - delta);
      s.slow = Math.max(0, s.slow - delta);
      const maxSpeed = (onRoad ? 18 : 8) * (s.boost > 0 ? 1.45 : 1) * (s.slow > 0 ? 0.5 : 1);
      if (axis.y > 0.1) s.speed += 15 * axis.y * delta;
      else if (axis.y < -0.1) s.speed += 24 * axis.y * delta;
      else s.speed -= Math.sign(s.speed) * Math.min(Math.abs(s.speed), 5 * delta);
      if (s.boost > 0) s.speed += 10 * delta;
      if (s.speed > maxSpeed) s.speed = THREE.MathUtils.damp(s.speed, maxSpeed, 4, delta);
      s.speed = Math.max(-6, s.speed);
      s.heading -= axis.x * 1.9 * delta * THREE.MathUtils.clamp(s.speed / 7, -1, 1);
      s.pos.x += Math.sin(s.heading) * s.speed * delta;
      s.pos.z += Math.cos(s.heading) * s.speed * delta;

      const from = s.index;
      s.index = nearestIndex(s.pos, s.index);
      const lapDone = s.index < from - SAMPLES / 2;
      if (lapDone) s.lap += 1;
      // Mundur melewati garis start tidak dihitung sebagai putaran.
      if (s.index > from + SAMPLES / 2) s.lap -= 1;
      s.lateral = s.pos.clone().sub(TRACK.points[s.index]).dot(TRACK.normals[s.index]);
      onMove(from, s.index, lapDone, delta);
    }

    if (group.current) {
      group.current.position.copy(s.pos);
      group.current.rotation.y = s.heading;
    }
    const forward = new THREE.Vector3(Math.sin(s.heading), 0, Math.cos(s.heading));
    const desired = s.pos.clone().addScaledVector(forward, -11).add(new THREE.Vector3(0, 5.5, 0));
    camera.position.lerp(desired, 1 - Math.exp(-delta * 4));
    look.current.lerp(s.pos.clone().addScaledVector(forward, 6).add(new THREE.Vector3(0, 1.2, 0)), 1 - Math.exp(-delta * 8));
    camera.lookAt(look.current);
  });

  return (
    <group ref={group}>
      <TruckModel />
    </group>
  );
}

const GATE_OFFSETS = [-3.3, 0, 3.3];

function GateRow({
  t,
  labels,
  status,
}: {
  t: number;
  labels: string[];
  status?: { picked: number; correct: number | null } | null;
}) {
  const index = indexAt(t);
  const tangent = TRACK.tangents[index];
  const rotation = Math.atan2(tangent.x, tangent.z);
  const offsets = labels.length === 1 ? [0] : GATE_OFFSETS;
  return (
    <group>
      {labels.map((label, k) => {
        const p = pointAt(t, offsets[k]);
        const isPicked = status?.picked === k;
        const isCorrect = status?.correct === k;
        const color = status ? (isCorrect ? "#2fae66" : isPicked ? "#e54b4b" : "#555b66") : "#ffa987";
        return (
          <group key={k} position={[p.x, 0, p.z]} rotation={[0, rotation, 0]}>
            {[-1.4, 1.4].map((x) => (
              <mesh key={x} position={[x, 1.6, 0]} castShadow>
                <boxGeometry args={[0.25, 3.2, 0.25]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} />
              </mesh>
            ))}
            <mesh position={[0, 3.25, 0]}>
              <boxGeometry args={[3.1, 0.3, 0.3]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} />
            </mesh>
            <Label position={[0, 4.1, 0]} className={status ? (isCorrect ? "is-green" : isPicked ? "is-red" : undefined) : "is-gold"} distanceFactor={18}>
              <span className="block max-w-[9rem] whitespace-normal">{label}</span>
            </Label>
          </group>
        );
      })}
    </group>
  );
}

function pickGate(lateral: number, count: number) {
  if (count === 1) return 0;
  let best = 0;
  GATE_OFFSETS.forEach((offset, k) => {
    if (Math.abs(lateral - offset) < Math.abs(lateral - GATE_OFFSETS[best])) best = k;
  });
  return best;
}

function RaceWorld({ children }: { children: ReactNode }) {
  return (
    <>
      <WorldLights />
      <color attach="background" args={["#bcd9ef"]} />
      <fog attach="fog" args={["#bcd9ef", 60, 150]} />
      <Road />
      <Scenery />
      {(() => {
        const p = pointAt(0);
        const tangent = TRACK.tangents[0];
        return (
          <mesh position={[p.x, 0.05, p.z]} rotation={[-Math.PI / 2, 0, Math.atan2(tangent.x, tangent.z)]}>
            <planeGeometry args={[ROAD_WIDTH, 1.2]} />
            <meshBasicMaterial color="#f7ebe8" />
          </mesh>
        );
      })()}
      {children}
    </>
  );
}

const DRIVE_TOUCH = [{ press: "up" as const, label: "Gas", holdKey: "w" }, { press: "down" as const, label: "Rem", holdKey: "s", tone: "light" as const }];

/* ------------------------------------------------------------------ */
/* Level 1 · Rute order-to-cash                                       */
/* ------------------------------------------------------------------ */

const ROUTE = ERP_MODULES.map((module, k) => {
  const distractors = [ERP_MODULES[(k + 1) % 6], ERP_MODULES[(k + 3) % 6]];
  const options = [module, ...distractors];
  const shift = k % 3;
  const ordered = [...options.slice(shift), ...options.slice(0, shift)];
  return { t: 0.1 + k * 0.13, options: ordered, correct: ordered.indexOf(module) };
});

function RouteLevel({ levelIndex, info, paused, quality, input, sound, onPause, onFinish }: WorldLevelProps) {
  const truck = useRef<TruckState>(createTruck());
  const [results, setResults] = useState<number[]>([]);
  const [hud, setHud] = useState({ time: 0, speed: 0 });
  const push = useThrottled(setHud, 8);
  const [toast, setToast] = useState<Feedback>(null);
  const [finished, setFinished] = useState(false);
  const elapsed = useRef(0);
  const mistakes = results.filter((picked, k) => picked !== ROUTE[k].correct).length;
  const score = clampPercent(100 - mistakes * 12 - Math.max(0, hud.time - 70) * 0.5);

  const onMove = (from: number, to: number, lapDone: boolean, delta: number) => {
    elapsed.current += delta;
    push({ time: elapsed.current, speed: truck.current.speed });
    const next = results.length;
    if (next < ROUTE.length && crossed(from, to, indexAt(ROUTE[next].t))) {
      const row = ROUTE[next];
      const picked = pickGate(truck.current.lateral, 3);
      const ok = picked === row.correct;
      const target = row.options[row.correct];
      setResults((current) => [...current, picked]);
      sound(ok ? "pickup" : "error");
      if (!ok) {
        truck.current.speed = -4;
        truck.current.slow = 1.2;
      }
      setToast({
        ok,
        judul: ok ? `${target.label} ✓` : `Harusnya: ${target.label}`,
        teks: target.aliranData,
        konsep: `Modul ${target.divisi}`,
      });
    }
    if (lapDone && next >= ROUTE.length) {
      setFinished(true);
      push({ time: elapsed.current, speed: 0 }, true);
      sound("success");
    }
  };

  return (
    <WorldStage
      quality={quality}
      paused={paused || finished}
      camera={{ position: [0, 8, -14], fov: 60 }}
      overlay={
        <>
          <WorldHud
            levelIndex={levelIndex}
            info={info}
            onPause={onPause}
            toast={toast}
            stats={
              <>
                <HudChip><Timer />{hud.time.toFixed(1)}s</HudChip>
                <HudChip tone="gold"><Flag />{results.length}/{ROUTE.length} modul</HudChip>
                <HudChip><Gauge />{Math.round(Math.abs(hud.speed) * 6)} km/j</HudChip>
              </>
            }
            prompt={results.length >= ROUTE.length && !finished ? <>Semua modul terlewati — kembali ke garis finis!</> : undefined}
          />
          <TouchControls inputRef={input} mode="stick" buttons={DRIVE_TOUCH} />
          {finished && (
            <LevelEnd
              score={score}
              reason="Alur order-to-cash tuntas"
              detail={`${ROUTE.length - mistakes}/${ROUTE.length} gerbang benar · waktu ${hud.time.toFixed(1)} detik.`}
              onNext={() => onFinish(score)}
            />
          )}
        </>
      }
    >
      <RaceWorld>
        {ROUTE.map((row, k) => (
          <GateRow
            key={k}
            t={row.t}
            labels={row.options.map((module) => module.label)}
            status={k < results.length ? { picked: results[k], correct: row.correct } : null}
          />
        ))}
        <PlayerTruck input={input} running={!paused && !finished} truckRef={truck} onMove={onMove} />
      </RaceWorld>
    </WorldStage>
  );
}

/* ------------------------------------------------------------------ */
/* Level 2 · Jam sibuk                                                */
/* ------------------------------------------------------------------ */

const RUSH_TIME = 130;
const CAPACITY = 100;
const PATIENCE = 45;
const CUSTOMER_STOPS = ["A", "B", "C"];
const RUSH_ORDERS = ERP_ORDERS.map((order, index) => ({ ...order, stop: CUSTOMER_STOPS[index % 3], muncul: order.muncul * 1.2 }));
const RUSH_EVENT_TIMES = [24, 58, 92];

type RushState = {
  delivered: string[];
  answers: Record<string, number>;
  eventRows: Record<string, number>;
  cargo: number;
  susulan: number | null;
};

const createRush = (): RushState => ({ delivered: [], answers: {}, eventRows: {}, cargo: CAPACITY, susulan: null });

function RushLevel({ levelIndex, info, paused, quality, input, sound, onPause, onFinish }: WorldLevelProps) {
  const truck = useRef<TruckState>(createTruck());
  const clock = useRef(0);
  const [time, setTime] = useState(0);
  const push = useThrottled(setTime, 6);
  const live = useRef<RushState>(createRush());
  const [state, setState] = useState<RushState>(createRush);
  const [toast, setToast] = useState<Feedback>(null);
  const [done, setDone] = useState(false);

  const failed = RUSH_ORDERS.filter((order) => !state.delivered.includes(order.id) && time >= order.muncul + PATIENCE);
  const active = RUSH_ORDERS.filter((order) => order.muncul <= time && !state.delivered.includes(order.id) && !failed.includes(order));
  const kepuasanEvents = ERP_EVENTS.reduce((sum, event) => sum + (state.answers[event.id] !== undefined ? event.opsi[state.answers[event.id]].kepuasan ?? 0 : 0), 0);
  const satisfaction = Math.max(0, Math.min(100, 100 - failed.length * 12 + kepuasanEvents));
  const eventsCorrect = ERP_EVENTS.filter((event) => state.answers[event.id] !== undefined && event.opsi[state.answers[event.id]].benar).length;
  const allResolved =
    RUSH_ORDERS.every((order) => state.delivered.includes(order.id) || time >= order.muncul + PATIENCE) &&
    ERP_EVENTS.every((event) => state.answers[event.id] !== undefined);
  const ended = done || time >= RUSH_TIME || allResolved;
  const score = clampPercent((state.delivered.length / RUSH_ORDERS.length) * 50 + (eventsCorrect / ERP_EVENTS.length) * 30 + satisfaction * 0.2);

  const onMove = (from: number, to: number, _lap: boolean, delta: number) => {
    clock.current += delta;
    const now = clock.current;
    push(now);
    if (now >= RUSH_TIME) {
      setDone(true);
      push(now, true);
    }

    const st = live.current;
    let changed = false;
    const update = (patch: Partial<RushState>) => {
      Object.assign(st, patch);
      changed = true;
    };
    // Munculkan gerbang kejadian di depan truk.
    ERP_EVENTS.forEach((event, k) => {
      if (now < RUSH_EVENT_TIMES[k] || st.eventRows[event.id] !== undefined) return;
      update({ eventRows: { ...st.eventRows, [event.id]: (to / SAMPLES + 0.1) % 1 } });
      setToast({ ok: false, judul: `Kejadian: ${event.judul}`, teks: `${event.deskripsi} Setir ke gerbang jawabanmu!`, konsep: event.konsep });
      sound("interact");
    });
    // Lewati gerbang kejadian.
    ERP_EVENTS.forEach((event) => {
      const rowT = st.eventRows[event.id];
      if (rowT === undefined || st.answers[event.id] !== undefined || !crossed(from, to, indexAt(rowT))) return;
      const picked = pickGate(truck.current.lateral, 3);
      const option = event.opsi[picked];
      update({
        answers: { ...st.answers, [event.id]: picked },
        cargo: Math.max(0, Math.min(CAPACITY, st.cargo + (option.stok ?? 0))),
        susulan: option.stokSusulan ? now + 12 : st.susulan,
      });
      sound(option.benar ? "pickup" : "error");
      setToast({ ok: option.benar, judul: option.benar ? "Keputusan tepat!" : "Kurang tepat", teks: option.hasil, konsep: event.konsep });
    });
    if (st.susulan !== null && now >= st.susulan) {
      update({ cargo: Math.max(0, st.cargo - 40), susulan: null });
      setToast({ ok: false, judul: "Selisih stok membesar!", teks: "Selisih yang diabaikan ternyata membuat muatan fisik kurang 40 ton.", konsep: "Stock opname" });
      sound("error");
    }
    // Pemberhentian.
    RUSH_STOPS.forEach((stop) => {
      if (!crossed(from, to, indexAt(stop.t))) return;
      if (stop.id === "pabrik") {
        if (st.cargo < CAPACITY) {
          update({ cargo: CAPACITY });
          setToast({ ok: true, judul: "Muatan penuh lagi", teks: "Produksi tercatat otomatis dan stok gudang langsung ter-update di ERP.", konsep: "Real-time inventory" });
          sound("pickup");
        }
        return;
      }
      RUSH_ORDERS.filter(
        (order) => order.stop === stop.id && order.muncul <= now && now < order.muncul + PATIENCE && !st.delivered.includes(order.id)
      ).forEach((order) => {
        if (st.cargo >= order.jumlah) {
          update({ cargo: st.cargo - order.jumlah, delivered: [...st.delivered, order.id] });
          setToast({ ok: true, judul: `${order.jumlah} ton → ${order.pelanggan}`, teks: "Faktur terbit otomatis di modul keuangan.", konsep: "Integrasi" });
          sound("success");
        } else {
          setToast({ ok: false, judul: "Muatan kurang!", teks: `${order.pelanggan} butuh ${order.jumlah} ton. Isi ulang di Pabrik & Gudang.`, konsep: "Perencanaan stok" });
          sound("error");
        }
      });
    });
    if (changed) setState({ ...st });
  };

  return (
    <WorldStage
      quality={quality}
      paused={paused || ended}
      camera={{ position: [0, 8, -14], fov: 60 }}
      overlay={
        <>
          <WorldHud
            levelIndex={levelIndex}
            info={info}
            onPause={onPause}
            toast={toast}
            stats={
              <>
                <HudChip tone={RUSH_TIME - time <= 15 ? "red" : "dark"}><Timer />{Math.max(0, Math.ceil(RUSH_TIME - time))}s</HudChip>
                <HudChip tone="gold"><Package />{state.delivered.length}/{RUSH_ORDERS.length}</HudChip>
                <HudMeter label={`MUATAN ${state.cargo} TON`} value={state.cargo} tone={state.cargo < 30 ? "red" : "gold"} />
                <HudChip tone={satisfaction < 60 ? "red" : "green"}><Smile />{satisfaction}%</HudChip>
              </>
            }
          />
          <TouchControls inputRef={input} mode="stick" buttons={DRIVE_TOUCH} />
          {ended && (
            <LevelEnd
              score={score}
              reason={allResolved ? "Semua pesanan tertangani" : "Jam kerja selesai"}
              detail={`${state.delivered.length}/${RUSH_ORDERS.length} terkirim · ${eventsCorrect}/${ERP_EVENTS.length} keputusan tepat · kepuasan ${satisfaction}%`}
              onNext={() => onFinish(score)}
            />
          )}
        </>
      }
    >
      <RaceWorld>
        {RUSH_STOPS.map((stop) => {
          const p = pointAt(stop.t, ROAD_WIDTH / 2 + 2.5);
          const waiting = active.filter((order) => order.stop === stop.id);
          const isFactory = stop.id === "pabrik";
          return (
            <group key={stop.id} position={[p.x, 0, p.z]}>
              <mesh position={[0, isFactory ? 2 : 1.2, 0]} castShadow>
                <boxGeometry args={isFactory ? [4, 4, 4] : [2.6, 2.4, 2.6]} />
                <meshStandardMaterial color={isFactory ? "#7d95a3" : waiting.length ? "#ffa987" : "#c9bfb8"} />
              </mesh>
              <Label position={[0, isFactory ? 5 : 3.4, 0]} className={waiting.length ? "is-gold" : undefined} distanceFactor={20}>
                <span className="block">{stop.nama}</span>
                {waiting.map((order) => (
                  <span key={order.id} className="block text-[0.7rem]">
                    {order.pelanggan}: {order.jumlah} t · {Math.max(0, Math.ceil(order.muncul + PATIENCE - time))}s
                  </span>
                ))}
              </Label>
            </group>
          );
        })}
        {ERP_EVENTS.map((event) => {
          const rowT = state.eventRows[event.id];
          if (rowT === undefined) return null;
          const answered = state.answers[event.id];
          if (answered !== undefined) return null;
          return <GateRow key={event.id} t={rowT} labels={event.opsi.map((option) => option.label)} />;
        })}
        <PlayerTruck input={input} running={!paused && !ended} truckRef={truck} onMove={onMove} />
      </RaceWorld>
    </WorldStage>
  );
}

/* ------------------------------------------------------------------ */
/* Level 3 · Balapan vs Sistem Manual                                 */
/* ------------------------------------------------------------------ */

const LAPS = 2;
const BOARD_T = 0.5;
const RACE_LIMIT = 200;

function RivalTruck({ distanceRef }: { distanceRef: RefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!group.current) return;
    const t = (distanceRef.current / TRACK.length) % 1;
    const index = indexAt(t);
    const p = pointAt(t, 2.2);
    const tangent = TRACK.tangents[index];
    group.current.position.copy(p);
    group.current.rotation.y = Math.atan2(tangent.x, tangent.z);
  });
  return (
    <group ref={group}>
      <TruckModel color="#8a8483" drum="#f5f1e8" label="Sistem Manual" />
    </group>
  );
}

function RaceLevel({ levelIndex, info, paused, quality, input, sound, onPause, onFinish }: WorldLevelProps) {
  const truck = useRef<TruckState>(createTruck());
  const rival = useRef(0);
  const clock = useRef(0);
  const [hud, setHud] = useState({ time: 0, lap: 0, ahead: true, rivalLap: 0 });
  const push = useThrottled(setHud, 6);
  const [board, setBoard] = useState<number | null>(null);
  const [padsHit, setPadsHit] = useState<string[]>([]);
  const [toast, setToast] = useState<Feedback>(null);
  const [result, setResult] = useState<null | { won: boolean; time: number }>(null);
  const boardScore = board === null ? 0 : ERP_BOARD_SCORES[BOARD_GATES[board].id] ?? 0;
  const boosts = padsHit.filter((key) => RACE_PADS[Number(key.split(":")[1])].type === "boost").length;
  const score = clampPercent((result?.won ? 60 : 30) + boardScore * 0.3 + Math.min(10, boosts * 2));

  const onMove = (from: number, to: number, lapDone: boolean, delta: number) => {
    const s = truck.current;
    clock.current += delta;
    const playerDistance = s.lap * TRACK.length + (to / SAMPLES) * TRACK.length;
    const gap = rival.current - playerDistance;
    const rivalSpeed = 13.2 + (gap > 45 ? -1.8 : gap < -45 ? 1.8 : 0);
    if (rival.current < LAPS * TRACK.length) rival.current += rivalSpeed * delta;
    push({ time: clock.current, lap: s.lap, ahead: playerDistance >= rival.current, rivalLap: Math.floor(rival.current / TRACK.length) });

    RACE_PADS.forEach((pad, k) => {
      const key = `${s.lap}:${k}`;
      if (!crossed(from, to, indexAt(pad.t)) || Math.abs(s.lateral - pad.offset) > 2 || padsHit.includes(key)) return;
      setPadsHit((current) => [...current, key]);
      if (pad.type === "boost") {
        s.boost = 2.2;
        sound("pickup");
        setToast({ ok: true, judul: `Boost: ${pad.label}`, teks: "Proses otomatis di ERP memangkas pekerjaan manual.", konsep: "Sistem terintegrasi" });
      } else {
        s.slow = 1.5;
        sound("error");
        setToast({ ok: false, judul: `Terjebak: ${pad.label}`, teks: "Pekerjaan manual memperlambat alur dan rawan salah input.", konsep: "Proses manual" });
      }
    });

    if (s.lap === 0 && board === null && crossed(from, to, indexAt(BOARD_T))) {
      const picked = pickGate(s.lateral, 3);
      const option = BOARD_GATES[picked];
      const value = ERP_BOARD_SCORES[option.id] ?? 0;
      setBoard(picked);
      if (value === 100) s.boost = 3.5;
      else s.slow = 1.5;
      sound(value === 100 ? "success" : "error");
      setToast({
        ok: value === 100,
        judul: value === 100 ? "Direksi terkesan — BOOST!" : "Laporan terlambat…",
        teks: value === 100 ? "Konsolidasi otomatis: cepat, seragam, bisa ditelusuri." : "Laporan manual lambat dan rawan salah. Konsolidasi otomatis di ERP jauh lebih cepat.",
        konsep: "Laporan terkonsolidasi",
      });
    }

    if ((lapDone && s.lap >= LAPS) || clock.current >= RACE_LIMIT) {
      const won = s.lap >= LAPS && rival.current < LAPS * TRACK.length;
      setResult({ won, time: clock.current });
      sound(won ? "success" : "error");
    }
  };

  return (
    <WorldStage
      quality={quality}
      paused={paused || Boolean(result)}
      camera={{ position: [0, 8, -14], fov: 60 }}
      overlay={
        <>
          <WorldHud
            levelIndex={levelIndex}
            info={info}
            onPause={onPause}
            toast={toast}
            stats={
              <>
                <HudChip><Timer />{hud.time.toFixed(1)}s</HudChip>
                <HudChip tone="gold"><Flag />Putaran {Math.min(hud.lap + 1, LAPS)}/{LAPS}</HudChip>
                <HudChip tone={hud.ahead ? "green" : "red"}><Trophy />{hud.ahead ? "Posisi 1" : "Posisi 2"}</HudChip>
              </>
            }
          />
          <TouchControls inputRef={input} mode="stick" buttons={DRIVE_TOUCH} />
          {result && (
            <LevelEnd
              score={score}
              reason={result.won ? "Kamu menang!" : "Sistem Manual unggul"}
              detail={`${result.won ? "ERP terbukti lebih cepat." : "Coba ambil lebih banyak boost ERP."} Waktu ${result.time.toFixed(1)} detik · ${boosts} boost.`}
              isLast
              onNext={() => onFinish(score)}
            />
          )}
        </>
      }
    >
      <RaceWorld>
        {RACE_PADS.map((pad, k) => {
          const p = pointAt(pad.t, pad.offset);
          const tangent = TRACK.tangents[indexAt(pad.t)];
          const boost = pad.type === "boost";
          return (
            <group key={k} position={[p.x, 0, p.z]} rotation={[0, Math.atan2(tangent.x, tangent.z), 0]}>
              <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[3, 3.6]} />
                <meshStandardMaterial color={boost ? "#3fd0ff" : "#f5f1e8"} emissive={boost ? "#3fd0ff" : "#000"} emissiveIntensity={boost ? 0.9 : 0} />
              </mesh>
              {!boost && [0, 1, 2].map((i) => (
                <mesh key={i} position={[(i - 1) * 0.8, 0.3 + i * 0.12, 0]} rotation={[0, i * 0.4, 0]} castShadow>
                  <boxGeometry args={[0.9, 0.5, 1.2]} />
                  <meshStandardMaterial color="#fffdf5" />
                </mesh>
              ))}
              <Label position={[0, 2, 0]} className={boost ? "is-green" : "is-red"} distanceFactor={18}>{boost ? "⚡ " : ""}{pad.label}</Label>
            </group>
          );
        })}
        {board === null && hud.lap === 0 && <GateRow t={BOARD_T} labels={BOARD_GATES.map((gate) => gate.label)} />}
        <RivalTruck distanceRef={rival} />
        <PlayerTruck input={input} running={!paused && !result} truckRef={truck} onMove={onMove} />
      </RaceWorld>
    </WorldStage>
  );
}

export const ERP_LEVELS = [RouteLevel, RushLevel, RaceLevel];
