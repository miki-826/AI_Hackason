"use client";

import { useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "@/stores/gameStore";
import { Close, Keyhole } from "@/components/ui/icons";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

/** SC-08: 4-digit seal input. */
export function PuzzlePanel() {
  const { puzzle, attemptsLeft, submitCode, closePuzzle, openJournal } = useGameStore(
    useShallow((s) => ({
      puzzle: s.puzzle,
      attemptsLeft: s.session?.progress.attemptsLeft ?? 0,
      submitCode: s.submitCode,
      closePuzzle: s.closePuzzle,
      openJournal: s.openJournal,
    })),
  );
  const [code, setCode] = useState("");

  const press = (d: string) => setCode((c) => (c.length < 4 ? c + d : c));
  const erase = () => setCode((c) => c.slice(0, -1));
  const submit = async (value: string) => {
    if (value.length !== 4 || useGameStore.getState().puzzle.submitting) return;
    await submitCode(value);
    if (useGameStore.getState().puzzle.result === "wrong") setCode("");
  };
  const shaking = puzzle.result === "wrong";

  const submitRef = useRef(() => {});
  useEffect(() => {
    submitRef.current = () => void submit(code);
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (useGameStore.getState().journalOpen) return;
      if (/^[0-9]$/.test(e.key)) setCode((c) => (c.length < 4 ? c + e.key : c));
      else if (e.key === "Backspace") setCode((c) => c.slice(0, -1));
      else if (e.key === "Enter") {
        submitRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="pointer-events-auto fixed inset-0 z-20 grid place-items-center bg-ink/70 px-4">
      <section role="dialog" aria-modal="true" aria-labelledby="seal-title" className="brass-panel w-[min(94vw,24rem)] p-7">
        <button type="button" aria-label="閉じる" className="absolute right-3 top-3 grid h-11 w-11 place-items-center text-mist hover:text-parchment" onClick={closePuzzle}>
          <Close size={20} />
        </button>
        <div className="flex items-center gap-3">
          <Keyhole size={26} className="text-ember" />
          <h2 id="seal-title" className="font-mincho text-2xl text-brass-bright">封印装置</h2>
        </div>
        <p className="mt-2 text-sm text-mist">四つの数字を、左から順に。</p>
        <div key={shaking ? (puzzle.message ?? "w") : "idle"} className={`mt-5 flex justify-center gap-3 ${shaking ? "motion-safe:animate-[shake_0.4s_ease-in-out]" : ""}`} aria-label={`入力中の数字 ${code.length} 桁`}>
          {Array.from({ length: 4 }, (_, i) => (
            <span key={i} className={`grid h-16 w-12 place-items-center border-2 bg-ink font-mincho text-3xl ${code[i] ? "border-brass text-brass-bright" : "border-brass/30 text-mist/40"}`}>
              {code[i] ?? "・"}
            </span>
          ))}
        </div>
        <p aria-live="polite" className={`mt-3 min-h-6 text-center text-sm ${puzzle.result === "error" || puzzle.result === "wrong" ? "text-rust" : "text-verdigris"}`}>
          {puzzle.message ?? ""}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {KEYS.slice(0, 9).map((k) => (
            <button key={k} type="button" className="brass-button h-12 text-xl" onClick={() => press(k)}>
              {k}
            </button>
          ))}
          <button type="button" className="brass-button h-12 text-sm" onClick={erase}>
            消す
          </button>
          <button type="button" className="brass-button h-12 text-xl" onClick={() => press("0")}>
            0
          </button>
          <button type="button" className="brass-button h-12 text-sm" onClick={() => void submit(code)} disabled={code.length !== 4 || puzzle.submitting}>
            {puzzle.submitting ? "…" : "決定"}
          </button>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-mist">残り {attemptsLeft} 回</span>
          <button type="button" className="text-brass-bright underline-offset-4 hover:underline" onClick={openJournal}>
            手掛かり帳を見る
          </button>
        </div>
      </section>
    </div>
  );
}
