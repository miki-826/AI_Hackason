import type { FurnitureType } from "../types";

export type ClueDefinition = {
  id: string;
  furnitureType: FurnitureType;
  required: boolean;
  factId: string;
  title: string;
  /** what the player learns when they find it */
  content: string;
  /** clue ids that must also be found before this one can be decoded */
  relatedClueIds: string[];
  /** interpretation shown after decoding */
  decodedContent: string;
  /** keywords the memory event subtitle for this clue should echo (soft check) */
  unlocks: string[];
};

export const CLUE_DEFINITIONS: ClueDefinition[] = [
  {
    id: "clue-chair",
    furnitureType: "chair",
    required: true,
    factId: "fact-numbers",
    title: "食卓の数字",
    content:
      "最後の夕食の夜、父は時計を見上げて言った。「03 と 15。忘れないで」。椅子の背には、子どもが刻んだ「03」「15」の傷が残っている。",
    relatedClueIds: [],
    decodedContent: "「03」と「15」は、家族が何度も口にしていた二つの数字。単独では意味がわからない。",
    unlocks: ["seal-code-001"],
  },
  {
    id: "clue-clock",
    furnitureType: "clock",
    required: true,
    factId: "fact-date",
    title: "止まった針の意味",
    content:
      "時計は三時十五分で止まっているのではなかった。文字盤の裏には「三月十五日 — この日を封じる」と彫られている。",
    relatedClueIds: ["clue-chair"],
    decodedContent: "「03」は三月、「15」は十五日。数字は時刻ではなく、記憶を封じた日付の印だった。",
    unlocks: ["seal-code-001"],
  },
  {
    id: "clue-desk",
    furnitureType: "desk",
    required: true,
    factId: "fact-order",
    title: "書きかけの手紙",
    content:
      "「封印を解くときは、月、日の順に、左から並べること。装置は東の壁の奥にある」。手紙は主人公自身の筆跡で書かれていた。",
    relatedClueIds: ["clue-chair", "clue-clock"],
    decodedContent: "月 → 日の順に左から入力する。東の壁の封印装置に、四桁で。",
    unlocks: ["seal-code-001"],
  },
  {
    id: "clue-bookshelf",
    furnitureType: "bookshelf",
    required: false,
    factId: "fact-photo",
    title: "抜き取られた写真",
    content: "本棚から外された写真には、四人で並んだ家族が写っていた。裏には「来年もここで」と書かれている。",
    relatedClueIds: ["clue-chair"],
    decodedContent: "写真は、この部屋が家族の食卓だった頃のもの。約束は果たされなかった。",
    unlocks: [],
  },
  {
    id: "clue-drawer",
    furnitureType: "drawer",
    required: false,
    factId: "fact-gift",
    title: "渡せなかった贈り物",
    content: "引き出しには、リボンをかけたままの小箱。宛名は主人公の名前で、差出人は妹だった。",
    relatedClueIds: [],
    decodedContent: "妹は、翌日の誕生日に渡すつもりだった。贈り物は今も開けられていない。",
    unlocks: [],
  },
  {
    id: "clue-mirror",
    furnitureType: "mirror",
    required: false,
    factId: "fact-self",
    title: "鏡の中の住人",
    content: "鏡の記憶に映っていたのは、誰もいない食卓の前で、同じ言葉を繰り返す自分自身の姿だった。窓も扉も、いつの間にか消えていた。",
    relatedClueIds: ["clue-desk"],
    decodedContent: "この部屋は、自分の心残りが形になったものだった。言えなかった言葉が、ここに自分を留めている。",
    unlocks: [],
  },
];

export const CLUE_BY_ID = new Map(CLUE_DEFINITIONS.map((c) => [c.id, c]));

export function clueForFurnitureType(type: FurnitureType): ClueDefinition {
  const clue = CLUE_DEFINITIONS.find((c) => c.furnitureType === type);
  if (!clue) throw new Error(`No clue for ${type}`);
  return clue;
}
