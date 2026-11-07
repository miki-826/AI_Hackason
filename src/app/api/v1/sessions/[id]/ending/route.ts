import { endingBody, type EndingResponse } from "@/lib/api/contract";
import { finishEnding } from "@/game-core/rules/sessionRules";
import { loadSession, publicSession, withSession } from "@/lib/server/gameService";
import { assertSameOrigin, jsonOk, parseBody, ruleError } from "@/lib/server/http";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const originError = assertSameOrigin(request); if (originError) return originError;
  const { id } = await context.params; const session = loadSession(request, id); if (session instanceof Response) return session;
  const body = await parseBody(request, endingBody); if (body instanceof Response) return body;
  const result = finishEnding(session.record, session.plan, { revision: body.revision, now: new Date().toISOString() }); if (!result.ok) return ruleError(result.error);
  const response: EndingResponse = { endingId: result.ending.endingId, completedAt: result.record.completedAt!, ending: result.ending,
    session: publicSession(result.record, session.plan) };
  return withSession(jsonOk(response), result.record);
}
