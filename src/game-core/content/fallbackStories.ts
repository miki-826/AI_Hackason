import type { CastNames, FurnitureType, MemoryEvent, MemoryStory } from "../types";

/**
 * Fixed, hand-written memories. Used when AI generation is disabled, fails
 * validation, or times out (spec 5.2 B-5). Always clearable.
 */
type Template = (cast: CastNames) => Omit<MemoryStory, "furnitureId">;

const ev = (
  id: string,
  atMs: number,
  durationMs: number,
  action: MemoryEvent["action"],
  actorId: MemoryEvent["actorId"],
  subtitle: string,
  cameraTargetId: MemoryEvent["cameraTargetId"],
  clueId: string | null = null,
  allowExplore = false,
): MemoryEvent => ({ id, atMs, durationMs, action, actorId, subtitle, cameraTargetId, clueId, allowExplore });

const TEMPLATES: Record<FurnitureType, Template> = {
  chair: (c) => ({
    title: "最後の晩餐",
    summary: "家族が最後に食卓を囲んだ夜の記憶",
    narration: "私は毎晩、食卓を囲む家族の声を聞いていた。あの夜も、いつもと同じはずだった。",
    actors: ["adult_a", "adult_b", "child_a", "protagonist"],
    events: [
      ev("evt-chair-01", 600, 3800, "PLAY_AMBIENCE", null, "食器の触れ合う音。温かいスープの匂い。", "dining_table"),
      ev("evt-chair-02", 4600, 3800, "SIT_DOWN", "adult_a", `${c.adult_a}「さあ、冷めないうちに食べましょう」`, "family"),
      ev("evt-chair-03", 8600, 3800, "SIT_DOWN", "child_a", `${c.child_a}が椅子によじ登る。小さな手が、背もたれに何かを刻んでいる。`, "family"),
      ev(
        "evt-chair-04",
        12600,
        4800,
        "CHECK_CLOCK",
        "adult_b",
        `${c.adult_b}が時計を見上げる。「03 と 15。この二つだけは、忘れないで」`,
        "clock_face",
        "clue-chair",
        true,
      ),
      ev("evt-chair-05", 17800, 3800, "LOOK_AROUND", "protagonist", `${c.protagonist}「どうしてそんな数字を？」 誰も答えず、ただ笑っていた。`, "family"),
      ev("evt-chair-06", 21800, 3200, "LIGHT_FADE", null, "灯りがゆっくりと滲んでいく。", "dining_table"),
    ],
  }),
  clock: (c) => ({
    title: "止まらない振り子",
    summary: "時計が見下ろしていた、夜更けの約束",
    narration: "私は時を刻むのが役目だった。けれど、あの日だけは刻みたくなかった。",
    actors: ["adult_b", "protagonist"],
    events: [
      ev("evt-clock-01", 600, 3600, "PLAY_AMBIENCE", null, "コチ、コチ、と振り子の音だけが響く。", "family"),
      ev("evt-clock-02", 4400, 4000, "STAND_UP", "adult_b", `${c.adult_b}が私の前に立ち、ガラス戸を開けた。`, "clock_face"),
      ev("evt-clock-03", 8600, 4200, "CHECK_CLOCK", "adult_b", `${c.adult_b}「時刻じゃない。これは日付なんだ」`, "clock_face"),
      ev(
        "evt-clock-04",
        13000,
        5000,
        "LOOK_AROUND",
        "protagonist",
        `文字盤の裏に彫られた文字 —「三月十五日。この日を封じる」。${c.protagonist}はそれを見つめていた。`,
        "clock_face",
        "clue-clock",
        true,
      ),
      ev("evt-clock-05", 18400, 3600, "LIGHT_FADE", null, "針は、そこで止まった。", "clock_face"),
    ],
  }),
  desk: (c) => ({
    title: "書きかけの手紙",
    summary: "机が覚えていた、未来の自分への手紙",
    narration: "私の上で、たくさんの手紙が書かれた。最後の一通は、宛名のない手紙だった。",
    actors: ["protagonist"],
    events: [
      ev("evt-desk-01", 600, 3600, "PLAY_AMBIENCE", null, "ペン先が紙を走る、かすかな音。", "letter"),
      ev("evt-desk-02", 4400, 4200, "SIT_DOWN", "protagonist", `大人になった${c.protagonist}が、震える手でペンを取る。`, "letter"),
      ev("evt-desk-03", 8800, 4400, "PLACE_LETTER", "protagonist", `${c.protagonist}「いつか、これを読む私へ」`, "letter"),
      ev(
        "evt-desk-04",
        13400,
        5200,
        "LOOK_AROUND",
        "protagonist",
        "「封印を解くときは、月、日の順に、左から並べること。装置は東の壁の奥に」",
        "letter",
        "clue-desk",
        true,
      ),
      ev("evt-desk-05", 19000, 3600, "STAND_UP", "protagonist", "手紙は封をされないまま、机に残された。", "old_door"),
    ],
  }),
  bookshelf: (c) => ({
    title: "四人の写真",
    summary: "本棚の上から見ていた、家族の記念写真",
    narration: "私の一番上の段には、いつも一枚の写真が飾られていた。",
    actors: ["adult_a", "adult_b", "child_a", "protagonist"],
    events: [
      ev("evt-bookshelf-01", 600, 3600, "PLAY_AMBIENCE", null, "シャッターの音と、誰かの笑い声。", "family"),
      ev("evt-bookshelf-02", 4400, 4200, "LOOK_AROUND", "child_a", `${c.child_a}「もう一枚！ 今度はちゃんと目をあけるから」`, "family"),
      ev(
        "evt-bookshelf-03",
        8800,
        5000,
        "PLACE_LETTER",
        "adult_a",
        `${c.adult_a}が写真の裏に書き込む。「来年もここで」`,
        "bookshelf",
        "clue-bookshelf",
        true,
      ),
      ev("evt-bookshelf-04", 14000, 3400, "LIGHT_FADE", null, "写真立ては、そっと私の上に戻された。", "bookshelf"),
    ],
  }),
  drawer: (c) => ({
    title: "リボンの小箱",
    summary: "引き出しの奥に隠された、誕生日の準備",
    narration: "私の中には、秘密がしまわれていた。小さな手が、そっと隠した秘密。",
    actors: ["child_a", "adult_a"],
    events: [
      ev("evt-drawer-01", 600, 3400, "OPEN_DRAWER", "child_a", `${c.child_a}が辺りを見回して、私を開けた。`, "drawer"),
      ev(
        "evt-drawer-02",
        4200,
        5000,
        "PLACE_LETTER",
        "child_a",
        `${c.child_a}「お兄ちゃんには内緒。明日の誕生日まで」 リボンの小箱が、奥へしまわれる。`,
        "drawer",
        "clue-drawer",
        true,
      ),
      ev("evt-drawer-03", 9400, 3600, "LOOK_AROUND", "adult_a", `${c.adult_a}「ふふ、見なかったことにしておくわ」`, "family"),
      ev("evt-drawer-04", 13200, 3200, "LIGHT_FADE", null, "引き出しは、それきり開けられなかった。", "drawer"),
    ],
  }),
  mirror: (c) => ({
    title: "設計者の横顔",
    summary: "鏡が映していた、部屋を作る人の姿",
    narration: "私は、映すものを選べない。だから、あの人の決意も映してしまった。",
    actors: ["protagonist"],
    events: [
      ev("evt-mirror-01", 600, 3600, "PLAY_AMBIENCE", null, "紙を広げる音。定規が机を叩く音。", "mirror"),
      ev(
        "evt-mirror-02",
        4400,
        5200,
        "LOOK_AROUND",
        "protagonist",
        `鏡の中で、年を重ねた${c.protagonist}が図面を広げている。窓も扉もない部屋の図面を。`,
        "mirror",
        "clue-mirror",
        true,
      ),
      ev("evt-mirror-03", 9800, 4000, "STAND_UP", "protagonist", `${c.protagonist}「忘れるためじゃない。いつか、思い出すために」`, "mirror"),
      ev("evt-mirror-04", 14000, 3200, "LIGHT_FADE", null, "鏡は、そこで曇りはじめた。", "mirror"),
    ],
  }),
};

export function buildFallbackStory(furnitureId: string, type: FurnitureType, cast: CastNames): MemoryStory {
  return { furnitureId, ...TEMPLATES[type](cast) };
}
