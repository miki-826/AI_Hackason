"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "@/stores/gameStore";
import endingBg from "../../../public/images/ending-bg.jpg";

/** SC-09 / SC-10: truth, epilogue and replay over the open-door morning room. */
export function EndingScreen() {
  const router = useRouter();
  const { ending, goToTitle, startNewGame } = useGameStore(useShallow((s) => ({ ending: s.ending, goToTitle: s.goToTitle, startNewGame: s.startNewGame })));
  return (
    <div className="pointer-events-auto fixed inset-0 z-40 overflow-hidden bg-[#1a120b] motion-safe:animate-[fadein_2.4s_ease-out]">
      <Image
        src={endingBg}
        alt=""
        fill
        priority
        placeholder="blur"
        sizes="100vw"
        className="object-cover motion-safe:animate-[kenburns_60s_ease-out_forwards]"
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-[#120c07]/92 via-[#120c07]/72 to-[#120c07]/10" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#120c07]/70 via-transparent to-transparent" />
      {ending ? (
        <article className="relative h-full overflow-y-auto">
          <div className="max-w-[42em] px-6 py-16 font-mincho leading-[2.05] text-parchment sm:px-14 sm:py-20">
            <p className="text-sm tracking-widest text-brass-bright">脱出</p>
            <h1 className="mt-2 whitespace-nowrap text-[clamp(1.2rem,4vw,2.4rem)] font-bold tracking-[0.02em] text-[#fff3dc] drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">{ending.title}</h1>
            <section className="mt-10 space-y-5 text-lg">
              {ending.truth.map((t) => (
                <p key={t} className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
                  {t}
                </p>
              ))}
            </section>
            <section className="mt-12 space-y-4 border-t border-brass/40 pt-8 text-lg text-parchment/90">
              {ending.epilogue.map((t) => (
                <p key={t} className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
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
          </div>
        </article>
      ) : (
        <p role="status" className="relative grid h-full place-items-center font-mincho text-xl text-parchment">
          扉の向こうへ…
        </p>
      )}
    </div>
  );
}
