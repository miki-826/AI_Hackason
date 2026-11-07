"use client";

import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { FURNITURE_DEFINITIONS } from "@/game-core/definitions/furniture";
import { HINTS } from "@/game-core/definitions/hints";
import type { HintLevel, PublicClue } from "@/game-core/types";
import { useGameStore } from "@/stores/gameStore";
import { Close, Eye, FurnitureIcon, Lock, Question, Unlock } from "@/components/ui/icons";

function ClueRow({ clue, others }: { clue: PublicClue; others: PublicClue[] }) {
  const decodeClue = useGameStore((s) => s.decodeClue);
  const [picking, setPicking] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const toggle = (id: string) => setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const submit = async () => {
    setBusy(true);
    const ok = await decodeClue(clue.id, selected);
    setBusy(false);
    setFailed(!ok);
    if (ok) setPicking(false);
  };
  const medal = clue.decoded ? "border-ember text-ember" : clue.decodable ? "border-verdigris text-verdigris" : "border-mist/60 text-mist";
  return (
    <li className={`grid grid-cols-[auto_auto_1fr_auto] items-start gap-4 border p-4 ${clue.decoded ? "border-brass/60 bg-walnut/40" : "border-brass/25 bg-night-2/70"}`}>
      <span className={`grid h-11 w-11 place-items-center rounded-full border-2 ${medal}`} aria-hidden>
        {clue.decoded ? <Unlock size={20} /> : clue.decodable ? <Eye size={20} /> : <Question size={20} />}
      </span>
      <span className="grid h-11 w-11 place-items-center border border-brass/40 bg-parchment/90 text-walnut" aria-hidden>
        <FurnitureIcon type={clue.furnitureType} size={24} />
      </span>
      <div className="min-w-0">
        <h3 className="font-mincho text-lg text-brass-bright">
          <span className="mr-2 text-sm text-mist">#{clue.order}</span>
          {clue.title}
          {clue.required ? null : <span className="ml-2 text-xs text-verdigris">追加の記憶</span>}
        </h3>
        <p className="mt-1 text-sm leading-relaxed">{clue.content}</p>
        {clue.decodedContent ? <p className="mt-2 border-l-2 border-ember/70 pl-3 text-sm leading-relaxed text-ember">{clue.decodedContent}</p> : null}
        <p className="mt-2 text-xs text-mist">発見元：{FURNITURE_DEFINITIONS[clue.furnitureType].name}</p>
        {!clue.decoded ? (
          clue.decodable ? (
            picking ? (
              <div className="mt-3">
                <p className="text-xs text-mist">この手掛かりとつながる記憶を選ぶ（なければ選ばずに解読）</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {others.map((o) => (
                    <button
                      type="button"
                      key={o.id}
                      aria-pressed={selected.includes(o.id)}
                      onClick={() => toggle(o.id)}
                      className={`min-h-9 border px-3 text-sm ${selected.includes(o.id) ? "border-ember bg-ember/20 text-parchment" : "border-brass/40 text-mist hover:text-parchment"}`}
                    >
                      {o.title}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex gap-3">
                  <button type="button" className="brass-button px-4 py-2 text-sm" onClick={() => void submit()} disabled={busy}>
                    この組み合わせで解読
                  </button>
                  <button type="button" className="text-sm text-mist hover:text-parchment" onClick={() => setPicking(false)}>
                    やめる
                  </button>
                </div>
                {failed ? <p className="mt-2 text-sm text-rust" role="status">記憶がつながらない。別の組み合わせを試す。</p> : null}
              </div>
            ) : (
              <button type="button" className="brass-button mt-3 px-4 py-1.5 text-sm" onClick={() => setPicking(true)}>
                解読する
              </button>
            )
          ) : (
            <p className="mt-2 text-xs text-mist">関連する記憶がまだ足りない</p>
          )
        ) : null}
      </div>
      <span className={clue.decoded ? "text-ember" : "text-mist"} aria-label={clue.decoded ? "解読済み" : "未解読"}>
        {clue.decoded ? <Unlock size={24} /> : <Lock size={24} />}
      </span>
    </li>
  );
}

function HintsTab() {
  const { hintLevel, setHintLevel } = useGameStore(useShallow((s) => ({ hintLevel: s.hintLevel, setHintLevel: s.setHintLevel })));
  const levels: HintLevel[] = [1, 2, 3];
  return (
    <div className="space-y-4">
      {levels.map((lv) =>
        hintLevel >= lv ? (
          <article key={lv} className="border border-brass/30 bg-night-2/70 p-4">
            <h3 className="font-mincho text-lg text-brass-bright">ヒント{lv}：{HINTS[lv].title}</h3>
            <p className="mt-2 text-sm leading-relaxed">{HINTS[lv].body}</p>
          </article>
        ) : hintLevel === lv - 1 ? (
          <div key={lv}>
            {lv === 3 ? <p className="mb-2 text-sm text-mist">ヒント3は、封印装置への入力の形式を教えます。</p> : null}
            <button type="button" className="brass-button px-5 py-2.5" onClick={() => setHintLevel(lv)}>
              ヒント{lv}を見る
            </button>
          </div>
        ) : null,
      )}
    </div>
  );
}

/** SC-07: clue journal with decoding and staged hints. */
export function ClueJournal() {
  const { session, closeJournal } = useGameStore(useShallow((s) => ({ session: s.session, closeJournal: s.closeJournal })));
  const [tab, setTab] = useState<"clues" | "hints">("clues");
  if (!session) return null;
  const p = session.progress;
  const clues = [...session.clues].sort((a, b) => a.order - b.order);
  const missingRequired = p.requiredClueCount - p.requiredCollectedCount;
  const missingOptional = p.optionalClueCount - p.optionalCollectedCount;
  return (
    <div className="pointer-events-auto fixed inset-0 z-30 grid place-items-center bg-ink/75 p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="journal-title" className="brass-panel flex max-h-[92vh] w-[min(96vw,56rem)] flex-col">
        <header className="flex flex-wrap items-center gap-3 border-b border-brass/30 px-6 pb-3 pt-5">
          <h2 id="journal-title" className="font-mincho text-2xl text-brass-bright">手掛かり帳</h2>
          <div role="tablist" aria-label="表示切替" className="ml-4 flex gap-1">
            {(["clues", "hints"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                className={`min-h-10 border-b-2 px-4 ${tab === t ? "border-ember text-parchment" : "border-transparent text-mist hover:text-parchment"}`}
                onClick={() => setTab(t)}
              >
                {t === "clues" ? "手掛かり" : "ヒント"}
              </button>
            ))}
          </div>
          <p className="ml-auto text-sm text-mist">
            必須の記憶 {p.requiredCollectedCount} / {p.requiredClueCount} ・ 追加の記憶 {p.optionalCollectedCount} / {p.optionalClueCount}
          </p>
          <button type="button" aria-label="手掛かり帳を閉じる" className="grid h-11 w-11 place-items-center text-mist hover:text-parchment" onClick={closeJournal}>
            <Close size={22} />
          </button>
        </header>
        <div className="overflow-y-auto px-6 py-5">
          {tab === "clues" ? (
            <ul className="space-y-3">
              {clues.map((c) => (
                <ClueRow key={c.id} clue={c} others={clues.filter((o) => o.id !== c.id)} />
              ))}
              {Array.from({ length: missingRequired }, (_, i) => (
                <li key={`missing-${i}`} className="flex items-center gap-4 border border-dashed border-mist/30 p-4 text-mist">
                  <span className="grid h-11 w-11 place-items-center rounded-full border-2 border-mist/40" aria-hidden>
                    <Question size={20} />
                  </span>
                  <span className="font-mincho text-lg tracking-widest">？？？？</span>
                  <span className="text-sm">まだ見ぬ必須の記憶</span>
                </li>
              ))}
              {missingOptional > 0 ? <li className="text-sm text-mist">この部屋には、まだ {missingOptional} つの追加の記憶が眠っている。</li> : null}
              {clues.length === 0 ? <li className="text-mist">まだ何も記録していない。家具に近づき、物の記憶を見てみよう。</li> : null}
            </ul>
          ) : (
            <HintsTab />
          )}
        </div>
      </section>
    </div>
  );
}
