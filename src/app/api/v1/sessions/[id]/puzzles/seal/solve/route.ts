import { solveSealBody, type SolveSealResponse } from "@/lib/api/contract";
import { solveSeal } from "@/game-core/rules/sessionRules";
import { rateLimit } from "@/lib/security/rateLimit";
import { loadSession, publicSession, withSession } from "@/lib/server/gameService";
import { assertSameOrigin, jsonError, jsonOk, parseBody, ruleError } from "@/lib/server/http";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const originError = assertSameOrigin(request); if (originError) return originError;
  const { id } = await context.params; const session = loadSession(request, id); if (session instanceof Response) return session;
  if (!rateLimit(`solve:${id}`, 20, 60_000)) return jsonError("RATE_LIMITED", "しばらく待ってから再試行してください。", 429, true);
  const body = await parseBody(request, solveSealBody); if (body instanceof Response) return body;
  const result = solveSeal(session.record, session.plan, { ...body, now: new Date().toISOString() }); if (!result.ok) return ruleError(result.error);
  const response: SolveSealResponse = { correct: result.correct, unlocked: result.correct,
    revision: result.record.revision, session: publicSession(result.record, session.plan) };
  return withSession(jsonOk(response), result.record);
}
