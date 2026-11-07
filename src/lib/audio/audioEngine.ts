"use client";

/**
 * Synthesised audio (WebAudio) — no third-party sound files, so nothing to
 * license (spec 11.2). Starts only after a user gesture (autoplay policy).
 */
type Bus = { master: GainNode; sfx: GainNode; amb: GainNode };

let ctx: AudioContext | null = null;
let bus: Bus | null = null;
let ambience: { stop(): void; mode: "room" | "memory" } | null = null;
let tickTimer: ReturnType<typeof setInterval> | null = null;

function ensure(): { ctx: AudioContext; bus: Bus } | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    const master = ctx.createGain();
    const sfx = ctx.createGain();
    const amb = ctx.createGain();
    sfx.connect(master);
    amb.connect(master);
    master.connect(ctx.destination);
    bus = { master, sfx, amb };
  }
  if (ctx.state === "suspended") void ctx.resume();
  return bus ? { ctx, bus } : null;
}

function noiseBuffer(c: AudioContext, seconds: number): AudioBuffer {
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02; // brown-ish
    data[i] = last * 3.5;
  }
  return buf;
}

export const audio = {
  unlock() {
    ensure();
  },
  setVolumes(v: { master: number; sfx: number; ambience: number }) {
    if (!bus || !ctx) return;
    const t = ctx.currentTime;
    bus.master.gain.setTargetAtTime(v.master, t, 0.05);
    bus.sfx.gain.setTargetAtTime(v.sfx, t, 0.05);
    bus.amb.gain.setTargetAtTime(v.ambience, t, 0.05);
  },
  setMuted(muted: boolean) {
    if (!ctx) return;
    if (muted) void ctx.suspend();
    else void ctx.resume();
  },
  ambience(mode: "room" | "memory" | "off") {
    const e = ensure();
    if (!e) return;
    if (ambience?.mode === mode) return;
    ambience?.stop();
    ambience = null;
    if (tickTimer) clearInterval(tickTimer);
    tickTimer = null;
    if (mode === "off") return;
    const { ctx: c, bus: b } = e;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, 4);
    src.loop = true;
    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = mode === "room" ? 220 : 600;
    const g = c.createGain();
    g.gain.value = mode === "room" ? 0.22 : 0.08;
    src.connect(filter).connect(g).connect(b.amb);
    src.start();
    const oscs: OscillatorNode[] = [];
    if (mode === "memory") {
      // warm, slow pad (A major-ish, detuned)
      for (const f of [110, 164.8, 220.5, 277.2]) {
        const o = c.createOscillator();
        o.type = "triangle";
        o.frequency.value = f;
        const og = c.createGain();
        og.gain.value = 0.025;
        o.connect(og).connect(b.amb);
        o.start();
        oscs.push(o);
      }
    } else {
      // grandfather clock tick
      let tock = false;
      tickTimer = setInterval(() => {
        const t = c.currentTime;
        const o = c.createOscillator();
        o.type = "square";
        o.frequency.value = tock ? 1400 : 1900;
        tock = !tock;
        const tg = c.createGain();
        tg.gain.setValueAtTime(0.05, t);
        tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
        const bp = c.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 2400;
        o.connect(bp).connect(tg).connect(b.amb);
        o.start(t);
        o.stop(t + 0.06);
      }, 1000);
    }
    ambience = {
      mode,
      stop() {
        src.stop();
        oscs.forEach((o) => o.stop());
      },
    };
  },
  /** short one-shots */
  play(kind: "transition" | "clue" | "unlock" | "wrong" | "select") {
    const e = ensure();
    if (!e) return;
    const { ctx: c, bus: b } = e;
    const t = c.currentTime;
    if (kind === "transition") {
      const src = c.createBufferSource();
      src.buffer = noiseBuffer(c, 1.6);
      const f = c.createBiquadFilter();
      f.type = "bandpass";
      f.Q.value = 3;
      f.frequency.setValueAtTime(3000, t);
      f.frequency.exponentialRampToValueAtTime(200, t + 1.4);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.5, t + 0.3);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
      src.connect(f).connect(g).connect(b.sfx);
      src.start(t);
      return;
    }
    const notes: Record<"clue" | "unlock" | "wrong" | "select", number[]> = {
      clue: [880, 1320, 1760],
      unlock: [220, 330, 440, 660],
      wrong: [110, 98],
      select: [660],
    };
    notes[kind].forEach((freq, i) => {
      const o = c.createOscillator();
      o.type = kind === "wrong" ? "sawtooth" : "sine";
      o.frequency.value = freq;
      const g = c.createGain();
      const start = t + i * (kind === "unlock" ? 0.12 : 0.07);
      const len = kind === "select" ? 0.12 : 1.2;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(kind === "wrong" ? 0.12 : 0.2, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, start + len);
      o.connect(g).connect(b.sfx);
      o.start(start);
      o.stop(start + len + 0.05);
    });
  },
};
