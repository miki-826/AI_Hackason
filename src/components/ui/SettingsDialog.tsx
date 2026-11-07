"use client";

import type { TextSize } from "@/stores/settings";

import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "@/stores/gameStore";
import type { QualityPreset } from "@/stores/settings";
import { Close } from "./icons";

const QUALITY_OPTIONS: ReadonlyArray<{ value: QualityPreset; label: string; hint: string }> = [
  { value: "low", label: "低", hint: "動作優先（影・粒子を軽減）" },
  { value: "standard", label: "標準", hint: "画質と動作のバランス" },
  { value: "high", label: "高", hint: "陰影と空気感を最大化" },
];

type RangeRowProps = {
  id: string;
  label: string;
  valueText: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (next: number) => void;
};

function RangeRow({ id, label, valueText, min, max, step, value, onChange }: RangeRowProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <label htmlFor={id} className="font-medium text-parchment">
          {label}
        </label>
        <span className="font-mincho text-sm text-brass-bright">{valueText}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none bg-ink accent-brass"
      />
    </div>
  );
}

type ToggleRowProps = {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

function ToggleRow({ id, label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-brass-dim/30 pt-3">
      <div>
        <label htmlFor={id} className="block cursor-pointer text-sm font-medium text-parchment">
          {label}
        </label>
        <p className="text-sm text-mist">{description}</p>
      </div>
      <input
        id={id}
        type="checkbox"
        role="switch"
        aria-checked={checked}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 shrink-0 cursor-pointer accent-brass"
      />
    </div>
  );
}

const TEXT_SIZE_OPTIONS: { value: TextSize; label: string; preview: string }[] = [
  { value: "small", label: "小", preview: "0.85rem" },
  { value: "standard", label: "標準", preview: "1rem" },
  { value: "large", label: "大", preview: "1.15rem" },
  { value: "xlarge", label: "特大", preview: "1.3rem" },
];

export function SettingsDialog() {
  const { settings, updateSettings, closeSettings } = useGameStore(
    useShallow((s) => ({
      settings: s.settings,
      updateSettings: s.updateSettings,
      closeSettings: s.closeSettings,
    })),
  );

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeSettings();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-dialog-title"
        className="brass-panel relative max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 sm:p-8"
      >
        <div className="flex items-center justify-between border-b border-brass-dim/40 pb-4">
          <h2 id="settings-dialog-title" className="font-mincho text-xl tracking-wider text-brass-bright">
            設定
          </h2>
          <button
            type="button"
            onClick={closeSettings}
            aria-label="設定を閉じる"
            className="flex h-11 w-11 items-center justify-center border border-brass-dim/50 bg-night text-parchment transition-colors hover:border-brass hover:text-brass-bright"
          >
            <Close size={18} />
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <section aria-labelledby="settings-camera-heading" className="space-y-4">
            <h3 id="settings-camera-heading" className="font-mincho text-sm tracking-widest text-brass">
              視点と操作
            </h3>
            <RangeRow
              id="setting-mouse-sensitivity"
              label="マウス感度"
              valueText={settings.mouseSensitivity.toFixed(1)}
              min={0.2}
              max={3}
              step={0.1}
              value={settings.mouseSensitivity}
              onChange={(v) => updateSettings({ mouseSensitivity: v })}
            />
            <RangeRow
              id="setting-fov"
              label="視野角 FOV"
              valueText={`${Math.round(settings.fov)}°`}
              min={60}
              max={85}
              step={1}
              value={settings.fov}
              onChange={(v) => updateSettings({ fov: v })}
            />
          </section>

          <section aria-labelledby="settings-audio-heading" className="space-y-4 border-t border-brass-dim/30 pt-4">
            <h3 id="settings-audio-heading" className="font-mincho text-sm tracking-widest text-brass">
              音量
            </h3>
            <RangeRow
              id="setting-master-volume"
              label="全体音量"
              valueText={`${Math.round(settings.masterVolume * 100)}%`}
              min={0}
              max={100}
              step={1}
              value={Math.round(settings.masterVolume * 100)}
              onChange={(v) => updateSettings({ masterVolume: v / 100 })}
            />
            <RangeRow
              id="setting-sfx-volume"
              label="効果音"
              valueText={`${Math.round(settings.sfxVolume * 100)}%`}
              min={0}
              max={100}
              step={1}
              value={Math.round(settings.sfxVolume * 100)}
              onChange={(v) => updateSettings({ sfxVolume: v / 100 })}
            />
            <RangeRow
              id="setting-ambience-volume"
              label="環境音"
              valueText={`${Math.round(settings.ambienceVolume * 100)}%`}
              min={0}
              max={100}
              step={1}
              value={Math.round(settings.ambienceVolume * 100)}
              onChange={(v) => updateSettings({ ambienceVolume: v / 100 })}
            />
            <RangeRow
              id="setting-bgm-volume"
              label="BGM"
              valueText={`${Math.round(settings.bgmVolume * 100)}%`}
              min={0}
              max={100}
              step={1}
              value={Math.round(settings.bgmVolume * 100)}
              onChange={(v) => updateSettings({ bgmVolume: v / 100 })}
            />
            <RangeRow
              id="setting-voice-volume"
              label="読み上げ音声"
              valueText={`${Math.round(settings.voiceVolume * 100)}%`}
              min={0}
              max={100}
              step={1}
              value={Math.round(settings.voiceVolume * 100)}
              onChange={(v) => updateSettings({ voiceVolume: v / 100 })}
            />
          </section>

          <fieldset className="border-t border-brass-dim/30 pt-4">
            <legend className="font-mincho text-sm tracking-widest text-brass">画質</legend>
            <div className="mt-3 grid grid-cols-3 gap-2.5">
              {QUALITY_OPTIONS.map((opt) => {
                const selected = settings.quality === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`flex min-h-11 cursor-pointer flex-col items-center justify-center border px-3 py-2 text-center transition-colors ${
                      selected
                        ? "border-brass bg-walnut text-brass-bright"
                        : "border-brass-dim/40 bg-ink/70 text-parchment hover:border-brass/70"
                    }`}
                  >
                    <input
                      type="radio"
                      name="quality"
                      value={opt.value}
                      checked={selected}
                      onChange={() => updateSettings({ quality: opt.value })}
                      className="sr-only"
                    />
                    <span className="font-mincho text-sm font-semibold">{opt.label}</span>
                    <span className="mt-0.5 text-xs text-mist">{opt.hint}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="border-t border-brass-dim/30 pt-4">
            <legend className="font-mincho text-sm tracking-widest text-brass">文字の大きさ</legend>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {TEXT_SIZE_OPTIONS.map((opt) => {
                const selected = settings.textSize === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`flex min-h-11 cursor-pointer items-center justify-center border px-2 py-2 text-center transition-colors ${
                      selected ? "border-brass bg-walnut text-brass-bright" : "border-brass-dim/40 bg-ink/70 text-parchment hover:border-brass/70"
                    }`}
                  >
                    <input
                      type="radio"
                      name="text-size"
                      value={opt.value}
                      checked={selected}
                      onChange={() => updateSettings({ textSize: opt.value })}
                      className="sr-only"
                    />
                    <span className="font-mincho font-semibold" style={{ fontSize: opt.preview }}>
                      {opt.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="space-y-3">
            <ToggleRow
              id="setting-subtitles"
              label="字幕"
              description="記憶の追体験中に会話と情景の字幕を表示します"
              checked={settings.subtitles}
              onChange={(checked) => updateSettings({ subtitles: checked })}
            />
            <ToggleRow
              id="setting-voice"
              label="読み上げ"
              description="記憶の語り・字幕・遊び方を音声で読み上げます"
              checked={settings.voiceEnabled}
              onChange={(checked) => updateSettings({ voiceEnabled: checked })}
            />
            <ToggleRow
              id="setting-invert-y"
              label="上下反転"
              description="マウスによる上下の視点移動を反転します"
              checked={settings.invertY}
              onChange={(checked) => updateSettings({ invertY: checked })}
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end border-t border-brass-dim/40 pt-4">
          <button type="button" onClick={closeSettings} className="brass-button min-h-11 px-6 py-2 text-sm">
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
