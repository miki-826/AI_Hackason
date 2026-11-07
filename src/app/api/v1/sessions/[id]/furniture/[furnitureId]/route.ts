import { FURNITURE_DEFINITIONS } from "@/game-core/definitions/furniture";
import type { FurnitureDetailResponse } from "@/lib/api/contract";
import { hasCachedStory } from "@/lib/ai/storyGenerator";
import { loadSession } from "@/lib/server/gameService";
import { jsonError, jsonOk } from "@/lib/server/http";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ id: string; furnitureId: string }> }): Promise<Response> {
  const { id, furnitureId } = await context.params; const session = loadSession(request, id); if (session instanceof Response) return session;
  const furniture = session.plan.furniture.find((item) => item.id === furnitureId);
  if (!furniture) return jsonError("NOT_FOUND", "家具が見つかりません。", 404);
  const def = FURNITURE_DEFINITIONS[furniture.type];
  const body: FurnitureDetailResponse = { furnitureId, name: def.name, description: def.description, examineText: def.examineText,
    memoryStatus: hasCachedStory(session.record, furnitureId) ? "ready" : "none", visited: session.record.visited.includes(furnitureId) };
  return jsonOk(body);
}
