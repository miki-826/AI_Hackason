"use client";

import { useGameStore } from "@/stores/gameStore";
import { Sparkle } from "./icons";

export function Toast() {
  const toast = useGameStore((s) => s.toast);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
    >
      <div
        key={toast.id}
        className="brass-panel flex max-w-lg items-center gap-3 px-5 py-3 text-sm text-parchment shadow-2xl"
      >
        <Sparkle size={16} className="shrink-0 text-ember" />
        <p className="leading-relaxed">{toast.text}</p>
      </div>
    </div>
  );
}
