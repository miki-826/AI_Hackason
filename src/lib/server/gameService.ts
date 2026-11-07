import { planForRecord, toPublicSession, type SessionRecord } from "@/game-core/rules/sessionRules";
import type { GamePlan } from "@/game-core/generation/generateGamePlan";
import { jsonError, ruleError } from "./http";
import { readSessionCookie, sessionSetCookie } from "./sessionCookie";

export function loadSession(request: Request, idParam: string): { record: SessionRecord; plan: GamePlan } | Response {
  const record = readSessionCookie(request);
  if (!record) return jsonError("UNAUTHORIZED", "セッションがありません。", 401);
  if (record.id !== idParam) return jsonError("FORBIDDEN", "このセッションにはアクセスできません。", 403);
  const result = planForRecord(record);
  if (!result.ok) return ruleError(result.error);
  return { record, plan: result.plan };
}

export function publicSession(record: SessionRecord, plan: GamePlan) { return toPublicSession(record, plan); }
export function withSession(response: Response, record: SessionRecord): Response {
  response.headers.append("Set-Cookie", sessionSetCookie(record));
  return response;
}
