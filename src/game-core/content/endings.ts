import type { EndingContent, EndingId } from "../types";

const TRUTH = [
  "この部屋は牢屋ではなかった。あなた自身の心残りから生み出された、あの後の部屋だった。",
  "翌日の事故で、家族は帰らなかった。最後の食卓で、言えなかった言葉がある。その心残りから、あなたは死してなお、同じことを考え続けている。",
  "家具たちが覚えていたのは、その答えにたどり着くための記憶だった。",
];

const EPILOGUES: Record<EndingId, { title: string; epilogue: string[] }> = {
  "ending-quiet": {
    title: "静かな扉",
    epilogue: [
      "壁に現れた扉の向こうから、白い光が差し込む。",
      "思い出せたのは、あの夜のほんの一部だけ。それでも、同じ問いを繰り返すのは、もう終わりにしていい。",
      "光の中へ一歩を踏み出すと、遠くで時計の音が止んだ。",
    ],
  },
  "ending-warm": {
    title: "灯りの残る食卓",
    epilogue: [
      "扉を開ける前に、もう一度だけ振り返る。",
      "椅子の傷、止まった時計、書きかけの手紙。そして、家具たちが見せてくれた小さな続き。",
      "あの夜の食卓には、確かに笑い声があった。その温もりを抱いて、あなたは光の中へ歩いていく。",
    ],
  },
  "ending-whole": {
    title: "すべての記憶とともに",
    epilogue: [
      "写真の裏の約束、渡せなかった贈り物、鏡の中で立ち尽くしていた自分。",
      "すべての欠片がつながったとき、言えなかった言葉は、ようやく声になった。「ありがとう。またね」",
      "部屋は静かに明るくなり、あなたは妹の小箱を手に、家族の待つ春の光の中へ歩き出す。",
    ],
  },
};

export function endingIdFor(extraMemoryCount: number, optionalAvailable: number): EndingId {
  if (optionalAvailable > 0 && extraMemoryCount >= optionalAvailable) return "ending-whole";
  if (extraMemoryCount > 0) return "ending-warm";
  return "ending-quiet";
}

export function buildEnding(endingId: EndingId, extraMemoryCount: number): EndingContent {
  const e = EPILOGUES[endingId];
  return { endingId, title: e.title, truth: [...TRUTH], epilogue: [...e.epilogue], extraMemoryCount };
}
