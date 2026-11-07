"use client";

import { useEffect } from "react";
import { TEXT_SCALE } from "@/stores/settings";
import { useGameStore } from "@/stores/gameStore";

/** Applies the 文字の大きさ setting by scaling the root font-size (all UI text is rem-based). */
export function useTextScale() {
  const textSize = useGameStore((s) => s.settings.textSize);
  useEffect(() => {
    document.documentElement.style.fontSize = TEXT_SCALE[textSize];
  }, [textSize]);
}
