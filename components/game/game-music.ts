"use client";

/**
 * Musik latar prosedural: sequencer Web Audio kecil tanpa file audio.
 * Tiap tema berisi pola 4 birama × 16 langkah untuk pad, bass, arpeggio, melodi, dan drum.
 */

export type MusicThemeId = "plaza" | "it-audit" | "enterprise-system" | "data-science";

interface MusicTheme {
  bpm: number;
  /** Nada dasar (MIDI) di oktaf 3; bass satu oktaf di bawah, arpeggio & melodi satu oktaf di atas. */
  root: number;
  scale: number[];
  /** Derajat tangga nada akor untuk tiap birama. */
  chords: number[];
  /** 16 langkah, digit = jarak derajat dari akar akor, "." = diam. */
  bass: string;
  arp: string;
  /** 4 birama × 16 langkah, digit/huruf = derajat absolut (0–9, a–e), "-" = tahan, "." = diam. */
  melody: string[];
  kick: string;
  snare: string;
  hat: string;
  waves: { bass: OscillatorType; arp: OscillatorType; lead: OscillatorType; pad: OscillatorType };
  /** Gema untuk arpeggio & melodi (detik), 0 = mati. */
  echo: number;
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const HARMONIC_MINOR = [0, 2, 3, 5, 7, 8, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const DORIAN = [0, 2, 3, 5, 7, 9, 10];

const THEMES: Record<MusicThemeId, MusicTheme> = {
  // Plaza kampus: santai dan ceria.
  plaza: {
    bpm: 100,
    root: 48,
    scale: MAJOR,
    chords: [0, 5, 3, 4],
    bass: "0..0..4.0..0..4.",
    arp: "0.2.4.2.7.4.2.4.",
    melody: ["4-2-0-2-4---4---", "5-4-2-0-2-------", "3-3-5-7-5-3-2---", "1-2-4-1-6---4---"],
    kick: "x.......x.......",
    snare: "....x.......x...",
    hat: "..x...x...x...x.",
    waves: { bass: "triangle", arp: "sine", lead: "triangle", pad: "sine" },
    echo: 0,
  },
  // Operasi Inspektur: misterius dan tegang.
  "it-audit": {
    bpm: 108,
    root: 45,
    scale: HARMONIC_MINOR,
    chords: [0, 5, 3, 4],
    bass: "0.0.0.0.0.0.4.0.",
    arp: "0.4.2.4.0.4.2.4.",
    melody: ["4---------3-2---", "5-------4-------", "3---------2-0---", "1-------6-------"],
    kick: "x.....x...x.....",
    snare: "....x.......x...",
    hat: "x.x.x.x.x.x.x.x.",
    waves: { bass: "sawtooth", arp: "square", lead: "square", pad: "triangle" },
    echo: 0.28,
  },
  // Ekspedisi ERP: enerjik, cocok untuk balap, gudang, dan drone.
  "enterprise-system": {
    bpm: 128,
    root: 52,
    scale: MINOR,
    chords: [0, 5, 6, 0],
    bass: "0707070707070707",
    arp: "0.4.7.4.0.4.7.4.",
    melody: ["0-2-4---4-2-4-7-", "7---5-4-2---0---", "6-5-4-5-6---8---", "7-------4---2---"],
    kick: "x...x...x...x...",
    snare: "....x.......x...",
    hat: "x.xxx.xxx.xxx.xx",
    waves: { bass: "square", arp: "square", lead: "sawtooth", pad: "triangle" },
    echo: 0,
  },
  // Ekspedisi Data: petualangan air, dengan gema.
  "data-science": {
    bpm: 116,
    root: 50,
    scale: DORIAN,
    chords: [0, 3, 0, 6],
    bass: "0..0..4..0..6.4.",
    arp: "0.2.4.2.7.4.2.4.",
    melody: ["4---2-3-4---7---", "6-4-3-2-3-------", "4-5-7-5-4-2-0---", "2-3-2-0-1---0---"],
    kick: "x.....x.x.......",
    snare: "....x.......x...",
    hat: "..x...x...x...x.",
    waves: { bass: "triangle", arp: "sine", lead: "sine", pad: "sine" },
    echo: 0.32,
  },
};

type Layer = "pad" | "bass" | "arp" | "lead" | "drums";
const LAYERS: Layer[] = ["pad", "bass", "arp", "lead", "drums"];

interface Track {
  id: MusicThemeId;
  theme: MusicTheme;
  out: GainNode;
  filter: BiquadFilterNode;
  layers: Record<Layer, GainNode>;
  step: number;
  nextTime: number;
  endAt: number | null;
}

export interface MusicPlayer {
  setTheme: (id: MusicThemeId | null) => void;
  setIntensity: (value: number) => void;
  stop: () => void;
}

const LOOKAHEAD = 0.12;
const FADE = 0.8;

const midiToFreq = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

function degreeToMidi(theme: MusicTheme, degree: number, octave: number) {
  const size = theme.scale.length;
  const index = ((degree % size) + size) % size;
  return theme.root + octave * 12 + theme.scale[index] + Math.floor(degree / size) * 12;
}

function parseDegree(char: string) {
  const value = parseInt(char, 36);
  return Number.isNaN(value) ? null : value;
}

/** Pengaturan lapisan: intensitas rendah (briefing/jeda) hanya menyisakan pad, bass, dan arpeggio pelan. */
function layerLevels(intensity: number): Record<Layer, number> {
  const full = intensity >= 0.7;
  return { pad: 1, bass: full ? 1 : 0.7, arp: full ? 1 : 0.55, lead: full ? 1 : 0, drums: full ? 1 : 0 };
}

export function createMusicPlayer(context: AudioContext, bus: AudioNode): MusicPlayer {
  const noise = context.createBuffer(1, context.sampleRate, context.sampleRate);
  const samples = noise.getChannelData(0);
  for (let i = 0; i < samples.length; i += 1) samples[i] = Math.random() * 2 - 1;

  let tracks: Track[] = [];
  let intensity = 1;

  const tone = (dest: AudioNode, freq: number, time: number, length: number, wave: OscillatorType, volume: number, attack = 0.01) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = wave;
    oscillator.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(volume, time + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + length);
    oscillator.connect(gain).connect(dest);
    oscillator.start(time);
    oscillator.stop(time + length + 0.05);
  };

  const hiss = (dest: AudioNode, time: number, length: number, cutoff: number, volume: number) => {
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = noise;
    filter.type = "highpass";
    filter.frequency.value = cutoff;
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + length);
    source.connect(filter).connect(gain).connect(dest);
    source.start(time);
    source.stop(time + length + 0.05);
  };

  const kick = (dest: AudioNode, time: number) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(150, time);
    oscillator.frequency.exponentialRampToValueAtTime(45, time + 0.12);
    gain.gain.setValueAtTime(0.55, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.26);
    oscillator.connect(gain).connect(dest);
    oscillator.start(time);
    oscillator.stop(time + 0.3);
  };

  const scheduleStep = (track: Track, time: number) => {
    const { theme, layers } = track;
    const stepLength = 60 / theme.bpm / 4;
    const bar = Math.floor(track.step / 16) % theme.chords.length;
    const step = track.step % 16;
    const chord = theme.chords[bar];

    if (step === 0) {
      [0, 2, 4].forEach((offset) => {
        tone(layers.pad, midiToFreq(degreeToMidi(theme, chord + offset, 0)), time, stepLength * 16, theme.waves.pad, 0.045, 0.3);
      });
    }

    const bass = parseDegree(theme.bass[step]);
    if (bass !== null) tone(layers.bass, midiToFreq(degreeToMidi(theme, chord + bass, -1)), time, stepLength * 1.8, theme.waves.bass, 0.14);

    const arp = parseDegree(theme.arp[step]);
    if (arp !== null) tone(layers.arp, midiToFreq(degreeToMidi(theme, chord + arp, 1)), time, stepLength * 1.5, theme.waves.arp, 0.035);

    const line = theme.melody[bar];
    const note = parseDegree(line[step]);
    if (note !== null) {
      let hold = 1;
      while (step + hold < 16 && line[step + hold] === "-") hold += 1;
      tone(layers.lead, midiToFreq(degreeToMidi(theme, note, 1)), time, stepLength * hold * 0.95, theme.waves.lead, 0.06, 0.02);
    }

    if (theme.kick[step] === "x") kick(layers.drums, time);
    if (theme.snare[step] === "x") {
      hiss(layers.drums, time, 0.16, 1500, 0.13);
      tone(layers.drums, 190, time, 0.08, "triangle", 0.08, 0.002);
    }
    if (theme.hat[step] === "x") hiss(layers.drums, time, 0.04, 7000, 0.045);
  };

  const createTrack = (id: MusicThemeId): Track => {
    const theme = THEMES[id];
    const out = context.createGain();
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = intensity >= 0.7 ? 12000 : 1400;
    out.gain.setValueAtTime(0.0001, context.currentTime);
    out.gain.exponentialRampToValueAtTime(1, context.currentTime + FADE);
    filter.connect(out).connect(bus);

    const levels = layerLevels(intensity);
    const layers = Object.fromEntries(
      LAYERS.map((layer) => {
        const gain = context.createGain();
        gain.gain.value = levels[layer];
        gain.connect(filter);
        return [layer, gain];
      })
    ) as Record<Layer, GainNode>;

    if (theme.echo > 0) {
      const delay = context.createDelay(1);
      const feedback = context.createGain();
      const wet = context.createGain();
      delay.delayTime.value = theme.echo;
      feedback.gain.value = 0.3;
      wet.gain.value = 0.35;
      delay.connect(feedback).connect(delay);
      delay.connect(wet).connect(filter);
      layers.arp.connect(delay);
      layers.lead.connect(delay);
    }

    return { id, theme, out, filter, layers, step: 0, nextTime: context.currentTime + 0.05, endAt: null };
  };

  const retire = (track: Track) => {
    if (track.endAt !== null) return;
    const now = context.currentTime;
    track.out.gain.cancelScheduledValues(now);
    track.out.gain.setValueAtTime(Math.max(track.out.gain.value, 0.0001), now);
    track.out.gain.exponentialRampToValueAtTime(0.0001, now + FADE);
    track.endAt = now + FADE + 0.1;
  };

  const tick = () => {
    if (context.state !== "running") return;
    const now = context.currentTime;
    tracks = tracks.filter((track) => {
      if (track.endAt !== null && now >= track.endAt) {
        track.out.disconnect();
        return false;
      }
      return true;
    });
    tracks.forEach((track) => {
      // Timer yang tertahan (tab di latar belakang) tidak boleh memicu rentetan not yang terlambat.
      if (track.nextTime < now - 0.2) track.nextTime = now + 0.02;
      const stepLength = 60 / track.theme.bpm / 4;
      while (track.nextTime < now + LOOKAHEAD) {
        if (track.endAt === null || track.nextTime < track.endAt) scheduleStep(track, track.nextTime);
        track.nextTime += stepLength;
        track.step += 1;
      }
    });
  };

  const timer = window.setInterval(tick, 25);

  return {
    setTheme(id) {
      const current = tracks.find((track) => track.endAt === null);
      if (current?.id === id) return;
      if (current) retire(current);
      if (id) tracks.push(createTrack(id));
    },
    setIntensity(value) {
      if (value === intensity) return;
      intensity = value;
      const levels = layerLevels(value);
      const now = context.currentTime;
      tracks.forEach((track) => {
        LAYERS.forEach((layer) => track.layers[layer].gain.setTargetAtTime(levels[layer], now, 0.25));
        track.filter.frequency.setTargetAtTime(value >= 0.7 ? 12000 : 1400, now, 0.3);
      });
    },
    stop() {
      window.clearInterval(timer);
      tracks.forEach((track) => track.out.disconnect());
      tracks = [];
    },
  };
}
