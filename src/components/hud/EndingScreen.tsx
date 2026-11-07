"use client";

import { useRouter } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "@/stores/gameStore";

/** SC-09 / SC-10: truth, epilogue and replay. */
export function EndingScreen() {
  const router = useRouter();
  const { ending, goToTitle, startNewGame } = useGameStore(useShallow((s) => ({ ending: s.ending, goToTitle: s.goToTitle, startNewGame: s.startNewGame })));
  if (!ending) {
    return (
      <div className="pointer-events-auto fixed inset-0 z-40 grid place-items-center bg-[#f4ead6] motion-safe:animate-[fadein_1.2s_ease-out]" role="status">
        <p className="font-mincho text-xl text-walnut">扉の向こうへ…</p>
      </div>
    );
  }
  return (
    <div className="pointer-events-auto fixed inset-0 z-40 overflow-y-auto bg-gradient-to-b from-[#f4ead6] via-[#d9c7a3] to-ink text-ink motion-safe:animate-[fadein_2.4s_ease-out]">
      <article className="mx-auto max-w-[34em] px-6 py-20 font-mincho leading-loose">
        <p className="text-sm text-walnut">脱出</p>
        <h1 className="mt-2 text-4xl font-bold tracking-wider text-walnut">{ending.title}</h1>
        <section className="mt-10 space-y-5 text-lg">
          {ending.truth.map((t) => (
            <p key={t}>{t}</p>
          ))}
        </section>
        <section className="mt-12 space-y-4 border-t border-walnut/30 pt-8 text-lg text-parchment">
          {ending.epilogue.map((t) => (
            <p key={t} className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
              {t}
            </p>
          ))}
        </section>
        <p className="mt-10 font-gothic text-sm text-mist">追加で見つけた記憶：{ending.extraMemoryCount}</p>
        <div className="mt-8 flex flex-wrap gap-3 font-gothic">
          <button
            type="button"
            className="brass-button px-6 py-3"
            onClick={() => {
              goToTitle();
              router.push("/");
            }}
          >
            タイトルへ戻る
          </button>
          <button type="button" className="brass-button px-6 py-3" onClick={() => void startNewGame()}>
            もう一度追体験する
          </button>
        </div>
      </article>
    </div>
  );
}
