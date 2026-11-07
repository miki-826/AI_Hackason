"use client";

import { useShallow } from "zustand/react/shallow";
import { FURNITURE_DEFINITIONS, furnitureTypeFromId } from "@/game-core/definitions/furniture";
import { useGameStore } from "@/stores/gameStore";
import { Back, Sparkle } from "@/components/ui/icons";

/** SC-05 / SC-06: subtitles, timeline, explore hint, clue card, review. */
export function MemoryOverlay() {
  const { phase, memory, subtitles, leaveMemory, collectFragment, acknowledgeClue, replayMemory, returnFromMemory } = useGameStore(
    useShallow((s) => ({
      phase: s.phase,
      memory: s.memory,
      subtitles: s.settings.subtitles,
      leaveMemory: s.leaveMemory,
      collectFragment: s.collectFragment,
      acknowledgeClue: s.acknowledgeClue,
      replayMemory: s.replayMemory,
      returnFromMemory: s.returnFromMemory,
    })),
  );
  if (!memory) return null;
  const type = furnitureTypeFromId(memory.furnitureId);
  const event = memory.story.events[memory.eventIndex];
  const showSubtitle = event && (subtitles || event.clueId) && phase !== "MEMORY_REVIEW" && phase !== "MEMORY_CLUE";
  const observed = memory.story.events.filter((e) => memory.observedEventIds.includes(e.id));

  return (
    <div className="fixed inset-0 z-20">
      {phase !== "MEMORY_TRANSITION_OUT" && phase !== "MEMORY_CLUE" ? (
        <button
          type="button"
          className="pointer-events-auto absolute left-5 top-5 flex min-h-11 items-center gap-2 border border-brass/50 bg-ink/60 px-4 text-sm text-parchment hover:border-brass"
          onClick={leaveMemory}
        >
          <Back size={18} /> 戻る
        </button>
      ) : null}
      <div className="absolute left-1/2 top-6 -translate-x-1/2 text-center">
        <p className="font-mincho text-xl text-brass-bright drop-shadow">{memory.story.title}</p>
        <p className="mt-0.5 text-xs text-parchment/80">{type ? FURNITURE_DEFINITIONS[type].name : ""}の記憶</p>
      </div>

      {phase === "MEMORY_TRANSITION_IN" || (phase === "MEMORY_OBSERVE" && memory.eventIndex < 0) ? (
        <p className="absolute left-1/2 top-1/2 w-[min(90vw,34em)] -translate-x-1/2 -translate-y-1/2 text-center font-mincho text-xl leading-loose text-parchment drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
          {memory.story.narration}
        </p>
      ) : null}

      {showSubtitle ? (
        <p
          aria-live="polite"
          className="absolute bottom-16 left-1/2 w-[min(92vw,40em)] -translate-x-1/2 bg-ink/55 px-5 py-3 text-center text-lg leading-relaxed text-parchment"
        >
          {event.subtitle}
        </p>
      ) : null}

      {/* timeline dots */}
      <ol aria-label="記憶の進行" className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
        {memory.story.events.map((e, i) => (
          <li
            key={e.id}
            aria-current={i === memory.eventIndex ? "step" : undefined}
            className={`h-1.5 w-6 ${i < memory.eventIndex ? "bg-brass" : i === memory.eventIndex ? "bg-ember" : "bg-parchment/25"}`}
          />
        ))}
      </ol>

      {phase === "MEMORY_EXPLORE" ? (
        <div className="absolute bottom-32 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 text-center">
          <p className="bg-ink/60 px-4 py-2 text-sm text-ember">記憶の中で、琥珀色に光る欠片を見つけて触れる（クリック / [E]）</p>
          <button type="button" className="brass-button pointer-events-auto flex items-center gap-2 px-5 py-2.5" onClick={() => void collectFragment()}>
            <Sparkle size={18} /> 欠片に手を伸ばす
          </button>
        </div>
      ) : null}

      {phase === "MEMORY_CLUE" ? (
        <div className="pointer-events-auto absolute inset-0 grid place-items-center bg-ink/40 px-4">
          <section role="dialog" aria-modal="true" aria-labelledby="clue-title" className="brass-panel w-[min(92vw,30rem)] p-7 text-center">
            <p className="text-sm text-ember">手掛かりを見つけた</p>
            <h2 id="clue-title" className="mt-2 font-mincho text-2xl text-brass-bright">
              {memory.foundClue?.title ?? (memory.clueFailed ? "記録できなかった" : "記憶を書き留めています…")}
            </h2>
            <p className="mt-4 text-left leading-relaxed">
              {memory.foundClue?.content ?? (memory.clueFailed ? "通信に失敗したため、手掛かりを保存できなかった。もう一度記録する。" : "")}
            </p>
            {memory.clueFailed && !memory.foundClue ? (
              <button type="button" autoFocus className="brass-button mt-6 w-full py-3" onClick={() => void collectFragment()}>
                もう一度記録する
              </button>
            ) : (
              <button type="button" autoFocus className="brass-button mt-6 w-full py-3" onClick={acknowledgeClue} disabled={!memory.foundClue}>
                手掛かり帳に記録する
              </button>
            )}
          </section>
        </div>
      ) : null}

      {phase === "MEMORY_REVIEW" ? (
        <div className="pointer-events-auto absolute inset-0 grid place-items-center bg-ink/55 px-4">
          <section role="dialog" aria-modal="true" aria-labelledby="review-title" className="brass-panel max-h-[85vh] w-[min(92vw,34rem)] overflow-y-auto p-7">
            <h2 id="review-title" className="font-mincho text-2xl text-brass-bright">{memory.story.title}</h2>
            <p className="mt-1 text-sm text-mist">{memory.story.summary}</p>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed">
              {observed.map((e) => (
                <li key={e.id} className="border-l border-brass/40 pl-3">
                  {e.subtitle}
                </li>
              ))}
            </ul>
            <div className="mt-5 border-t border-brass/30 pt-4">
              {memory.foundClue ? (
                <p>
                  <span className="text-verdigris">{memory.alreadyCollected ? "手掛かり帳に記録済み：" : "見つけた手掛かり："}</span>
                  {memory.foundClue.title}
                </p>
              ) : (
                <p className="text-mist">この記憶では手掛かりを見つけられなかった。もう一度見ると、光る欠片に気づけるかもしれない。</p>
              )}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" className="brass-button py-3" onClick={() => void replayMemory()}>
                もう一度見る
              </button>
              <button type="button" autoFocus className="brass-button py-3" onClick={() => void returnFromMemory()}>
                部屋に戻る
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
