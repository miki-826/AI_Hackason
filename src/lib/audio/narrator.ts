"use client";

import { API_BASE } from "@/lib/api/contract";
import { audio } from "./audioEngine";

/**
 * Reads subtitles / narration aloud.
 * 1. Server neural TTS (OpenAI) when /api/health reports tts=enabled.
 * 2. Otherwise the best Japanese voice the browser offers (Web Speech API).
 * Lines are queued; `interrupt` drops whatever is playing.
 */
type Line = { text: string; sessionId: string | null };

let enabled = true;
let volume = 0.9;
let serverTts = false;
let serverFailures = 0;
let queue: Line[] = [];
let speaking = false;
let generation = 0;
let currentSource: AudioBufferSourceNode | null = null;
let cachedVoice: SpeechSynthesisVoice | null | undefined;

const PREFERRED = [/Nanami/i, /Natural/i, /Neural/i, /Google.*日本語|Google.*Japanese/i, /Kyoko/i, /O-?ren/i, /Haruka/i, /Ayumi/i];

function pickVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice !== undefined) return cachedVoice;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return (cachedVoice = null);
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("ja"));
  if (voices.length === 0) return null; // not loaded yet; retry next time
  for (const re of PREFERRED) {
    const hit = voices.find((v) => re.test(v.name));
    if (hit) return (cachedVoice = hit);
  }
  return (cachedVoice = voices[0]);
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.addEventListener?.("voiceschanged", () => {
    cachedVoice = undefined;
  });
}

/** Spoken form: drop speaker brackets so 「…」 reads naturally. */
function spoken(text: string): string {
  return text.replace(/[「」『』]/g, " ").replace(/\s+/g, " ").trim();
}

function browserSpeak(text: string, gen: number): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return resolve();
    const u = new SpeechSynthesisUtterance(spoken(text));
    u.lang = "ja-JP";
    const v = pickVoice();
    if (v) u.voice = v;
    u.rate = 0.95;
    u.pitch = 0.95;
    u.volume = volume;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    u.onend = finish;
    u.onerror = finish;
    // safety: never block the game if the engine stalls
    setTimeout(finish, 1500 + text.length * 260);
    if (gen !== generation) return finish();
    window.speechSynthesis.speak(u);
  });
}

async function serverSpeak(line: Line, gen: number): Promise<boolean> {
  const ctx = audio.context;
  const out = audio.voiceBus;
  if (!ctx || !out || !line.sessionId) return false;
  try {
    const res = await fetch(`${API_BASE}/sessions/${encodeURIComponent(line.sessionId)}/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ text: line.text }),
    });
    if (!res.ok) throw new Error(String(res.status));
    const buf = await ctx.decodeAudioData(await res.arrayBuffer());
    if (gen !== generation) return true;
    await new Promise<void>((resolve) => {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(out);
      src.onended = () => resolve();
      currentSource = src;
      src.start();
    });
    currentSource = null;
    serverFailures = 0;
    return true;
  } catch {
    serverFailures += 1;
    if (serverFailures >= 2) serverTts = false;
    return false;
  }
}

async function pump() {
  if (speaking) return;
  speaking = true;
  audio.duck(true);
  while (queue.length > 0) {
    const line = queue.shift()!;
    const gen = generation;
    const ok = serverTts ? await serverSpeak(line, gen) : false;
    if (!ok && gen === generation) await browserSpeak(line.text, gen);
  }
  speaking = false;
  audio.duck(false);
}

export const narrator = {
  configure(opts: { enabled?: boolean; volume?: number; serverTts?: boolean }) {
    if (opts.enabled !== undefined) {
      enabled = opts.enabled;
      if (!enabled) narrator.cancel();
    }
    if (opts.volume !== undefined) volume = opts.volume;
    if (opts.serverTts !== undefined) serverTts = opts.serverTts;
  },
  speak(text: string | string[], opts: { sessionId?: string | null; interrupt?: boolean } = {}) {
    if (!enabled) return;
    const lines = (Array.isArray(text) ? text : [text]).map((t) => t.trim()).filter(Boolean);
    if (lines.length === 0) return;
    if (opts.interrupt) narrator.cancel();
    queue.push(...lines.map((t) => ({ text: t, sessionId: opts.sessionId ?? null })));
    void pump();
  },
  cancel() {
    generation += 1;
    queue = [];
    try {
      currentSource?.stop();
    } catch {
      /* already stopped */
    }
    currentSource = null;
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  },
  isSpeaking(): boolean {
    return enabled && (speaking || queue.length > 0);
  },
};
