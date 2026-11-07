"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MANUAL_SLIDES } from "@/game-core/definitions/manual";
import { narrator } from "@/lib/audio/narrator";
import { useGameStore } from "@/stores/gameStore";

/**
 * 遊び方 — illustrated slide manual (images generated with ChatGPT image
 * generation). Skippable at any time; ← → / Enter / Esc work.
 */
export function ManualSlides({ onClose, startLabel = "はじめる" }: { onClose: () => void; startLabel?: string }) {
  const [index, setIndex] = useState(0);
  const slide = MANUAL_SLIDES[index];
  const last = index === MANUAL_SLIDES.length - 1;
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    narrator.cancel();
    onClose();
  }, [onClose]);
  const next = useCallback(() => (last ? close() : setIndex((i) => i + 1)), [last, close]);
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  // read each slide aloud
  useEffect(() => {
    const sessionId = useGameStore.getState().session?.sessionId ?? null;
    narrator.speak([slide.title, ...slide.body], { interrupt: true, sessionId });
  }, [slide]);

  useEffect(() => () => narrator.cancel(), []);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, close]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-roledescription="スライド"
      aria-labelledby="manual-title"
      className="pointer-events-auto fixed inset-0 z-50 overflow-hidden bg-ink text-parchment"
    >
      {/* illustrations, cross-faded */}
      {MANUAL_SLIDES.map((s, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- full-bleed local art, no layout shift concerns
        <img
          key={s.id}
          src={s.image}
          alt={i === index ? s.alt : ""}
          aria-hidden={i !== index}
          loading={i <= 1 ? "eager" : "lazy"}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${i === index ? "opacity-100 motion-safe:animate-[kenburns_14s_ease-out_forwards]" : "opacity-0"}`}
        />
      ))}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/10" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-ink/80 via-transparent to-transparent" />

      <header className="absolute inset-x-0 top-0 flex items-center justify-between px-6 py-5">
        <p className="font-mincho text-lg tracking-widest text-brass-bright">遊び方</p>
        <button ref={closeRef} type="button" onClick={close} className="min-h-11 border border-brass/50 bg-ink/60 px-5 text-sm text-parchment hover:border-brass">
          スキップ
        </button>
      </header>

      <section className="absolute inset-x-0 bottom-0 px-6 pb-8 sm:px-12 sm:pb-12" aria-live="polite">
        <div className="max-w-[40rem]">
          <p className="text-sm text-brass">
            {index + 1} / {MANUAL_SLIDES.length}
          </p>
          <h2 id="manual-title" className="mt-2 font-mincho text-[clamp(1.6rem,3.4vw,2.6rem)] font-bold leading-snug text-parchment drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            {slide.title}
          </h2>
          <div className="mt-4 space-y-3 text-[1.05rem] leading-[1.9] text-parchment/95 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
            {slide.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          {slide.keys ? (
            <ul className="mt-5 flex flex-wrap gap-3">
              {slide.keys.map((k) => (
                <li key={k.key} className="flex items-center gap-2 text-sm">
                  <kbd className="border border-brass/70 bg-night/80 px-2.5 py-1 font-gothic text-brass-bright">{k.key}</kbd>
                  <span className="text-parchment/85">{k.label}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button type="button" onClick={prev} disabled={index === 0} className="brass-button min-h-12 px-6 text-base">
            前へ
          </button>
          <button type="button" onClick={next} className="brass-button min-h-12 px-8 text-lg">
            {last ? startLabel : "次へ"}
          </button>
          <ol className="ml-2 flex gap-2" aria-label="スライド位置">
            {MANUAL_SLIDES.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  aria-label={`${i + 1} 枚目: ${s.title}`}
                  aria-current={i === index ? "step" : undefined}
                  onClick={() => setIndex(i)}
                  className={`block h-2 w-8 ${i === index ? "bg-ember" : i < index ? "bg-brass" : "bg-parchment/30"}`}
                />
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
