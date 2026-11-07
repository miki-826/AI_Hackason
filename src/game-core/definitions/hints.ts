import type { HintLevel } from "../types";

/**
 * Three-step hints (spec 6.3). They never contain the answer itself.
 * Level 3 explains only the input FORMAT.
 */
export const HINTS: Record<HintLevel, { title: string; body: string }> = {
  1: {
    title: "調べる対象",
    body: "部屋に必ずある三つの家具 — 古びた椅子、振り子時計、書斎机 — の記憶を見てみよう。近づいて照準を合わせ、[E] で調べられる。",
  },
  2: {
    title: "手掛かりの関係",
    body: "椅子の記憶にある数字の断片は、時計の記憶で意味が変わる。机の記憶は、それをどの順番で並べるかを教えてくれる。手掛かり帳で「解読」すると関係がつながる。",
  },
  3: {
    title: "入力の形式",
    body: "封印装置は 4 桁の数字を受け付ける。月を 2 桁、日を 2 桁、左から順に並べる。例: 1 月 2 日なら 0102。",
  },
};
