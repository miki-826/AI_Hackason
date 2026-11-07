export type QualityPreset = "low" | "standard" | "high";

export type Settings = {
  /** multiplier, 0.2 – 3.0 */
  mouseSensitivity: number;
  /** degrees, 60 – 85 */
  fov: number;
  /** 0 – 1 */
  masterVolume: number;
  sfxVolume: number;
  ambienceVolume: number;
  quality: QualityPreset;
  subtitles: boolean;
  invertY: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  mouseSensitivity: 1,
  fov: 70,
  masterVolume: 0.8,
  sfxVolume: 0.8,
  ambienceVolume: 0.6,
  quality: "standard",
  subtitles: true,
  invertY: false,
};

const KEY = "ts:settings:v1";

const clamp = (v: unknown, min: number, max: number, d: number) =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : d;

export function sanitizeSettings(raw: Partial<Settings> | null | undefined): Settings {
  const r = raw ?? {};
  return {
    mouseSensitivity: clamp(r.mouseSensitivity, 0.2, 3, DEFAULT_SETTINGS.mouseSensitivity),
    fov: clamp(r.fov, 60, 85, DEFAULT_SETTINGS.fov),
    masterVolume: clamp(r.masterVolume, 0, 1, DEFAULT_SETTINGS.masterVolume),
    sfxVolume: clamp(r.sfxVolume, 0, 1, DEFAULT_SETTINGS.sfxVolume),
    ambienceVolume: clamp(r.ambienceVolume, 0, 1, DEFAULT_SETTINGS.ambienceVolume),
    quality: r.quality === "low" || r.quality === "high" || r.quality === "standard" ? r.quality : DEFAULT_SETTINGS.quality,
    subtitles: typeof r.subtitles === "boolean" ? r.subtitles : DEFAULT_SETTINGS.subtitles,
    invertY: typeof r.invertY === "boolean" ? r.invertY : DEFAULT_SETTINGS.invertY,
  };
}

export function loadSettings(): Settings {
  try {
    const raw = window.localStorage.getItem(KEY);
    return sanitizeSettings(raw ? (JSON.parse(raw) as Partial<Settings>) : null);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function persistSettings(settings: Settings): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* storage unavailable (private mode) — settings stay in memory */
  }
}
