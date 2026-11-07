"use client";

import { useShallow } from "zustand/react/shallow";
import { FURNITURE_DEFINITIONS, furnitureTypeFromId } from "@/game-core/definitions/furniture";
import { useGameStore } from "@/stores/gameStore";
import { Close, Eye, FurnitureIcon, Magnifier } from "@/components/ui/icons";

/** SC-04: furniture detail — 調査する / 物の記憶を見る. */
export function InspectPanel() {
  const { inspecting, memoryLoading, visited, hasClue, examine, replayMemory, closeInspect } = useGameStore(
    useShallow((s) => {
      const id = s.inspecting?.furnitureId;
      return {
        inspecting: s.inspecting,
        memoryLoading: s.memoryLoading,
        visited: id ? Boolean(s.session?.progress.visitedFurnitureIds.includes(id)) : false,
        hasClue: id ? Boolean(s.session?.clues.some((c) => c.furnitureId === id)) : false,
        examine: s.examine,
        replayMemory: s.replayMemory,
        closeInspect: s.closeInspect,
      };
    }),
  );
  if (!inspecting) return null;
  const type = furnitureTypeFromId(inspecting.furnitureId);
  const def = type ? FURNITURE_DEFINITIONS[type] : null;
  const name = inspecting.detail?.name ?? def?.name ?? "";
  return (
    <div className="pointer-events-auto fixed inset-0 z-20 bg-gradient-to-l from-ink/80 via-ink/30 to-transparent">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="inspect-title"
        className="brass-panel absolute bottom-6 right-6 w-[min(92vw,26rem)] p-6 max-sm:inset-x-4 max-sm:w-auto"
      >
        <button type="button" aria-label="閉じる" className="absolute right-3 top-3 grid h-11 w-11 place-items-center text-mist hover:text-parchment" onClick={closeInspect}>
          <Close size={20} />
        </button>
        <div className="flex items-center gap-3 pr-10">
          {type ? (
            <span className="grid h-11 w-11 shrink-0 place-items-center border border-brass/50 bg-walnut/60 text-brass-bright">
              <FurnitureIcon type={type} size={24} />
            </span>
          ) : null}
          <h2 id="inspect-title" className="font-mincho text-2xl text-brass-bright">
            {name}
          </h2>
        </div>
        <p className="mt-3 leading-relaxed text-parchment">{inspecting.detail?.description ?? def?.description}</p>
        {visited || hasClue ? (
          <p className="mt-2 text-sm text-verdigris">{hasClue ? "手掛かり取得済み" : "記憶を見た"}</p>
        ) : null}
        {inspecting.examined ? (
          <p className="mt-4 border-l-2 border-brass/60 pl-3 text-sm leading-relaxed text-parchment/90" aria-live="polite">
            {inspecting.detail?.examineText ?? (inspecting.loading ? "……" : def?.examineText)}
          </p>
        ) : null}
        <div className="mt-6 grid gap-3">
          <button type="button" className="brass-button flex items-center justify-center gap-2 py-3 text-lg" onClick={examine} disabled={inspecting.examined}>
            <Magnifier size={20} /> 調査する
          </button>
          <button
            type="button"
            autoFocus
            className="brass-button flex items-center justify-center gap-2 py-3 text-lg"
            onClick={() => void replayMemory()}
            disabled={memoryLoading}
          >
            <Eye size={20} /> {memoryLoading ? "記憶をたどっています…" : "物の記憶を見る"}
          </button>
        </div>
      </section>
    </div>
  );
}
