import type { MemoryResponse } from "@/lib/api/contract";
import { getMemoryStory } from "@/lib/ai/storyGenerator";
import { loadSession, withSession } from "@/lib/server/gameService";
import { jsonError, jsonOk } from "@/lib/server/http";
import { rateLimit } from "@/lib/security/rateLimit";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ id: string; furnitureId: string }> }): Promise<Response> {
  const { id, furnitureId } = await context.params; const session = loadSession(request, id); if (session instanceof Response) return session;
  if (!session.plan.furniture.some((item) => item.id === furnitureId)) return jsonError("NOT_FOUND", "家具が見つかりません。", 404);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`memory:${ip}`, 30, 600_000)) return jsonError("RATE_LIMITED", "しばらく待ってから再試行してください。", 429, true);
  const result = await getMemoryStory({ ...session, furnitureId });
  const body: MemoryResponse = { status: "ready", memory: result.story, source: result.source };
  return withSession(jsonOk(body), result.record);
}
