import type { EndingContent, EndingId } from "../types";

const TRUTH = [
  "この部屋は牢屋ではなかった。三月十五日の夜を失わないために、あなた自身が作った「記憶再構成室」だった。",
  "翌日の事故で、家族は帰らなかった。耐えきれなかったあなたは、最後の食卓の記憶を封じ、家具たちに預けた。",
  "いつか受け止められる日が来たら、自分の手で取り戻せるように。",
];

const EPILOGUES: Record<EndingId, { title: string; epilogue: string[] }> = {
  "ending-quiet": {
    title: "静かな扉",
    epilogue: [
      "壁に現れた扉の向こうから、白い光が差し込む。",
      "思い出せたのは、あの夜のほんの一部だけ。それでも、もう忘れたふりはしない。",
      "残りの記憶は、また会いに来るまで家具たちが預かってくれる。",
    ],
  },
  "ending-warm": {
    title: "灯りの残る食卓",
    epilogue: [
      "扉を開ける前に、もう一度だけ振り返る。",
      "椅子の傷、止まった時計、書きかけの手紙。そして、家具たちが見せてくれた小さな続き。",
      "あの夜の食卓には、確かに笑い声があった。あなたはそれを持って、外へ出る。",
    ],
  },
  "ending-whole": {
    title: "すべての記憶とともに",
    epilogue: [
      "写真の裏の約束、渡せなかった贈り物、鏡の中で部屋を設計していた自分。",
      "すべての欠片がつながったとき、部屋は役目を終えて、静かに明るくなった。",
      "あなたは妹の小箱を手に取り、扉の外の春の光の中へ歩き出す。",
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
