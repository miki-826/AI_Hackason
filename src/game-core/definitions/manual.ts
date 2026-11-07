/**
 * 遊び方マニュアル (slides shown before a new game; skippable).
 * Illustrations are generated with ChatGPT image generation (public/images/manual).
 * No spoilers: never mention the code or the truth here.
 */
export type ManualSlide = {
  id: string;
  image: string;
  /** short alt text describing the illustration */
  alt: string;
  title: string;
  /** body paragraphs; each one is also read aloud */
  body: string[];
  /** optional key hints rendered as keycaps */
  keys?: { key: string; label: string }[];
};

export const MANUAL_SLIDES: ManualSlide[] = [
  {
    id: "awaken",
    image: "/images/manual/01-awaken.jpg",
    alt: "窓も扉もない薄暗い部屋。吊りランプの下に椅子と柱時計と書斎机がある。",
    title: "窓も扉もない部屋で、目を覚ます",
    body: [
      "気がつくと、どこか懐かしい部屋の床に横たわっていた。窓も、扉もない。",
      "この部屋の家具は、どれもかなり年季が入っている。",
      "なぜだかわからないが、物の記憶を見ることができそうだ。物の記憶をたどり、この部屋の真実を見つけ出そう。",
    ],
  },
  {
    id: "move",
    image: "/images/manual/02-move.jpg",
    alt: "古いキーボードとマウスの向こうに、ランプに照らされた椅子が見える。",
    title: "歩いて、見回す",
    body: [
      "画面をクリックすると視点の操作が始まる。マウスで見回し、W・A・S・D キーで歩く。",
      "ESC キーで一時停止。メニューやパネルを開いている間は、マウスカーソルが表示される。",
    ],
    keys: [
      { key: "W A S D", label: "移動" },
      { key: "マウス", label: "見回す" },
      { key: "ESC", label: "一時停止" },
      { key: "V", label: "読み上げ オン / オフ" },
    ],
  },
  {
    id: "memory",
    image: "/images/manual/03-memory.jpg",
    alt: "椅子の背もたれ越しに、琥珀色に光る家族が食卓を囲む過去の光景が見える。",
    title: "物に触れ、その記憶を見る",
    body: [
      "家具に照準を合わせて E キーを押すと、調べることができる。「物の記憶を見る」を選ぶと、その家具の視点で過去を追体験する。",
      "記憶の中で琥珀色に光る欠片が現れたら、カーソルを合わせてクリックしよう。それが手掛かりになる。記憶は「記憶をスキップ」で飛ばすこともできる。",
    ],
    keys: [
      { key: "E", label: "調べる / 欠片に触れる" },
      { key: "クリック", label: "欠片に触れる" },
    ],
  },
  {
    id: "journal",
    image: "/images/manual/04-journal.jpg",
    alt: "赤い糸で手掛かりが結ばれた古い手帳と真鍮の虫眼鏡。",
    title: "手掛かりを結びつける",
    body: [
      "見つけた手掛かりは手掛かり帳に記録される。J キーか、画面左下の鞄から開ける。",
      "関係のある記憶同士を選んで「解読」すると、断片の本当の意味がわかる。迷ったら、ヒントを一段ずつ見てもいい。",
    ],
    keys: [{ key: "J", label: "手掛かり帳" }],
  },
  {
    id: "seal",
    image: "/images/manual/05-seal.jpg",
    alt: "壁に埋め込まれた真鍮の封印装置と、光の漏れる扉の輪郭。",
    title: "封印を解き、外へ",
    body: [
      "三つの大切な記憶がそろうと、どこかの壁に封印装置が現れる。手掛かりから導いた四桁の数字を入力しよう。",
      "封印が解ければ、扉が開く。ほかの家具の記憶も集めるほど、結末で見えるものが増えていく。",
    ],
  },
];

/** Every line the manual may read aloud (also the server TTS allowlist). */
export const SPOKEN_MANUAL_LINES: string[] = MANUAL_SLIDES.flatMap((s) => [s.title, ...s.body]);
