import { decodeClueBody, type DecodeClueResponse } from "@/lib/api/contract";
import { decodeClue } from "@/game-core/rules/sessionRules";
import { loadSession, publicSession, withSession } from "@/lib/server/gameService";
import { assertSameOrigin, jsonOk, parseBody, ruleError } from "@/lib/server/http";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request, context: { params: Promise<{ id: string; clueId: string }> }): Promise<Response> {
  const originError = assertSameOrigin(request); if (originError) return originError;
  const { id, clueId } = await context.params; const session = loadSession(request, id); if (session instanceof Response) return session;
  const body = await parseBody(request, decodeClueBody); if (body instanceof Response) return body;
  const result = decodeClue(session.record, { clueId, ...body, now: new Date().toISOString() }); if (!result.ok) return ruleError(result.error);
  const response: DecodeClueResponse = { decoded: result.decoded, session: publicSession(result.record, session.plan) };
  return withSession(jsonOk(response), result.record);
}
