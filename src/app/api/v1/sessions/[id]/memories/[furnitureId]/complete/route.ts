import { completeMemoryBody, type CompleteMemoryResponse } from "@/lib/api/contract";
import { completeMemory } from "@/game-core/rules/sessionRules";
import { loadSession, publicSession, withSession } from "@/lib/server/gameService";
import { assertSameOrigin, jsonOk, parseBody, ruleError } from "@/lib/server/http";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request, context: { params: Promise<{ id: string; furnitureId: string }> }): Promise<Response> {
  const originError = assertSameOrigin(request); if (originError) return originError;
  const { id, furnitureId } = await context.params; const session = loadSession(request, id); if (session instanceof Response) return session;
  const body = await parseBody(request, completeMemoryBody); if (body instanceof Response) return body;
  const result = completeMemory(session.record, session.plan, { furnitureId, ...body, now: new Date().toISOString() });
  if (!result.ok) return ruleError(result.error);
  const response: CompleteMemoryResponse = { session: publicSession(result.record, session.plan), newClueIds: result.newClueIds };
  return withSession(jsonOk(response), result.record);
}
