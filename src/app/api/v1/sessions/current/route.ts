import type { SessionResponse } from "@/lib/api/contract";
import { planForRecord } from "@/game-core/rules/sessionRules";
import { readSessionCookie } from "@/lib/server/sessionCookie";
import { jsonError, jsonOk } from "@/lib/server/http";
import { publicSession } from "@/lib/server/gameService";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET(request: Request): Response {
  const record = readSessionCookie(request);
  if (!record) return jsonError("NOT_FOUND", "セッションがありません。", 404);
  const result = planForRecord(record);
  if (!result.ok) return jsonError("NOT_FOUND", "セッションが見つかりません。", 404);
  const body: SessionResponse = { session: publicSession(record, result.plan) };
  return jsonOk(body);
}
