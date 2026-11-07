"use client";

/**
 * Game audio (WebAudio).
 * - BGM: owner-provided track (public/audio/bgm-house-at-evening.mp4), streamed
 *   through an <audio> element so playback starts without decoding the file.
 * - Ambience and one-shots are synthesised (no third-party samples).
 * - Voice: narration clips from the narrator are played on their own bus and
 *   duck the BGM while speaking.
 * Everything starts only after a user gesture (autoplay policy).
 */
type Bus = { master: GainNode; sfx: GainNode; amb: GainNode; bgm: GainNode; voice: GainNode };

export type BgmMode = "title" | "room" | "memory" | "ending" | "off";

const BGM_SRC = "/audio/bgm-house-at-evening.mp4";
const BGM_LEVEL: Record<BgmMode, number> = { title: 1, room: 0.55, memory: 0.85, ending: 1, off: 0 };

let ctx: AudioContext | null = null;
let bus: Bus | null = null;
let ambience: { stop(): void; mode: "room" | "memory" } | null = null;
let tickTimer: ReturnType<typeof setInterval> | null = null;
let bgmEl: HTMLAudioElement | null = null;
let bgmGainNode: GainNode | null = null;
let bgmMode: BgmMode = "off";
let ducked = false;
let userBgm = 0.55;
let muted = false;

function ensure(): { ctx: AudioContext; bus: Bus } | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    const master = ctx.createGain();
    const mk = () => {
      const g = ctx!.createGain();
      g.connect(master);
      return g;
    };
    bus = { master, sfx: mk(), amb: mk(), bgm: mk(), voice: mk() };
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended" && !muted) void ctx.resume();
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

function applyBgmLevel() {
  if (!ctx || !bgmGainNode) return;
  const level = BGM_LEVEL[bgmMode] * (ducked ? 0.35 : 1);
  bgmGainNode.gain.setTargetAtTime(level, ctx.currentTime, ducked ? 0.15 : 0.6);
}

export const audio = {
  unlock() {
    ensure();
  },
  get context(): AudioContext | null {
    return ensure()?.ctx ?? null;
  },
  get voiceBus(): GainNode | null {
    return ensure()?.bus.voice ?? null;
  },
  setVolumes(v: { master: number; sfx: number; ambience: number; bgm: number; voice: number }) {
    userBgm = v.bgm;
    if (!bus || !ctx) return;
    const t = ctx.currentTime;
    bus.master.gain.setTargetAtTime(v.master, t, 0.05);
    bus.sfx.gain.setTargetAtTime(v.sfx, t, 0.05);
    bus.amb.gain.setTargetAtTime(v.ambience, t, 0.05);
    bus.bgm.gain.setTargetAtTime(userBgm, t, 0.05);
    bus.voice.gain.setTargetAtTime(v.voice, t, 0.05);
  },
  setMuted(next: boolean) {
    muted = next;
    if (!ctx) return;
    if (muted) {
      void ctx.suspend();
      bgmEl?.pause();
    } else {
      void ctx.resume();
      if (bgmMode !== "off") void bgmEl?.play().catch(() => undefined);
    }
  },
  /** Background music; keeps playing across title -> game navigation. */
  bgm(mode: BgmMode) {
    const e = ensure();
    if (!e) return;
    if (!bgmEl) {
      bgmEl = new Audio(BGM_SRC);
      bgmEl.loop = true;
      bgmEl.preload = "auto";
      bgmEl.crossOrigin = "anonymous";
      const src = e.ctx.createMediaElementSource(bgmEl);
      bgmGainNode = e.ctx.createGain();
      bgmGainNode.gain.value = 0;
      src.connect(bgmGainNode).connect(e.bus.bgm);
    }
    bgmMode = mode;
    applyBgmLevel();
    if (mode === "off") {
      const el = bgmEl;
      setTimeout(() => {
        if (bgmMode === "off") el.pause();
      }, 1500);
    } else if (bgmEl.paused && !muted) {
      void bgmEl.play().catch(() => undefined);
    }
  },
  duck(on: boolean) {
    if (ducked === on) return;
    ducked = on;
    applyBgmLevel();
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
    g.gain.value = mode === "room" ? 0.16 : 0.05;
    src.connect(filter).connect(g).connect(b.amb);
    src.start();
    if (mode === "room") {
      // grandfather clock tick
      let tock = false;
      tickTimer = setInterval(() => {
        const t = c.currentTime;
        const o = c.createOscillator();
        o.type = "square";
        o.frequency.value = tock ? 1400 : 1900;
        tock = !tock;
        const tg = c.createGain();
        tg.gain.setValueAtTime(0.045, t);
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
