"use client";

import { narrator } from "@/lib/audio/narrator";
import { useGameStore } from "@/stores/gameStore";

/** One-click 読み上げ ON/OFF (also: V key). */
export function VoiceToggle({ className = "" }: { className?: string }) {
  const on = useGameStore((s) => s.settings.voiceEnabled);
  const updateSettings = useGameStore((s) => s.updateSettings);
  const toggle = () => {
    if (on) narrator.cancel();
    updateSettings({ voiceEnabled: !on });
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "読み上げをオフにする（V）" : "読み上げをオンにする（V）"}
      title={on ? "読み上げ：オン（V で切替）" : "読み上げ：オフ（V で切替）"}
      className={`pointer-events-auto flex min-h-11 items-center gap-2 border bg-night/80 px-3 text-sm ${
        on ? "border-brass/70 text-brass-bright" : "border-mist/40 text-mist"
      } hover:border-brass ${className}`}
    >
      <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 9h4l5-4v14l-5-4H4z" />
        {on ? (
          <>
            <path d="M16.5 8.5a5 5 0 0 1 0 7" />
            <path d="M19 6a8.5 8.5 0 0 1 0 12" />
          </>
        ) : (
          <path d="M17 9l5 6M22 9l-5 6" />
        )}
      </svg>
      <span className="max-sm:sr-only">読み上げ {on ? "オン" : "オフ"}</span>
    </button>
  );
}
