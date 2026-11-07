import { createSessionBody, type SessionResponse } from "@/lib/api/contract";
import { createSessionRecord, planForRecord } from "@/game-core/rules/sessionRules";
import { assertSameOrigin, jsonError, jsonOk, parseBody } from "@/lib/server/http";
import { newSessionIdentity } from "@/lib/server/sessionCookie";
import { publicSession, withSession } from "@/lib/server/gameService";
import { rateLimit } from "@/lib/security/rateLimit";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request): Promise<Response> {
  const originError = assertSameOrigin(request); if (originError) return originError;
  const body = await parseBody(request, createSessionBody); if (body instanceof Response) return body;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`create:${ip}`, 10, 600_000)) return jsonError("RATE_LIMITED", "しばらく待ってから再試行してください。", 429, true);
  const record = createSessionRecord({ ...newSessionIdentity(), now: new Date().toISOString() });
  const result = planForRecord(record);
  if (!result.ok) return jsonError("INTERNAL", "セッションを作成できません。", 500, true);
  const response: SessionResponse = { session: publicSession(record, result.plan) };
  return withSession(jsonOk(response, 201), record);
}
