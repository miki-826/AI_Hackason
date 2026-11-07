import { STORY_BIBLE } from "@/game-core/content/storyBible";

export const PROMPT_VERSION = "prompt-1.0";
export const systemPrompt = `あなたは家具の一人称で記憶を語る作家です。世界の事実: ${STORY_BIBLE.worldFacts.join("。")}。与えられた制約に従い、JSONのみ返してください。封印の答えを数字のコードとして明示しないでください。URL、HTML、コード、新しい登場人物、動作、手がかりを追加しないでください。`;

export type ConstraintPacket = {
  furnitureId: string; furnitureType: string; furnitureName: string; description: string;
  castNames: Record<string, string>; allowedActors: readonly string[]; allowedActions: readonly string[];
  allowedTargets: readonly string[]; clueId: string | null; clueContent: string | null;
};
export function furniturePrompt(packet: ConstraintPacket): string {
  return `この制約だけから家具の記憶を作成してください。タイトル40字以内、要約80字以内、語り200字以内、字幕各180字以内。イベントは時系列で1〜8件、総時間120秒以内。手がかりがある場合、探索可能なイベント一件だけで伝えてください。\n${JSON.stringify(packet)}`;
}
