import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { ApiErrorBody, ApiErrorCode } from "@/lib/api/contract";
import type { RuleError } from "@/game-core/rules/sessionRules";

export function requestId(): string { return randomUUID(); }
export function jsonOk(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
export function jsonError(code: ApiErrorCode, message: string, status: number, retryable = false): Response {
  const body: ApiErrorBody = { error: { code, message, requestId: requestId() }, retryable };
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function parseBody<T extends z.ZodType>(request: Request, schema: T): Promise<z.infer<T> | Response> {
  try {
    const parsed = schema.safeParse(await request.json());
    if (parsed.success) return parsed.data;
  } catch { /* Invalid JSON. */ }
  return jsonError("BAD_REQUEST", "リクエストの形式が正しくありません。", 400);
}

export function assertSameOrigin(request: Request): Response | null {
  // Idempotency-Key is accepted by route handlers; the pure rules make repeated
  // complete/decode requests no-ops, so no response header is required.
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return null;
  const origin = request.headers.get("origin");
  if (!origin) return null;
  try {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? new URL(request.url).host;
    if (new URL(origin).host === host) return null;
  } catch { /* Malformed origin. */ }
  return jsonError("FORBIDDEN", "この送信元からの操作は許可されていません。", 403);
}

const ruleMap: Record<RuleError, [ApiErrorCode, number, string]> = {
  FURNITURE_NOT_FOUND: ["NOT_FOUND", 404, "家具が見つかりません。"],
  CLUE_NOT_FOUND: ["NOT_FOUND", 404, "手がかりが見つかりません。"],
  CLUE_NOT_ALLOWED: ["BAD_REQUEST", 400, "この家具の手がかりではありません。"],
  INVALID_FORMAT: ["BAD_REQUEST", 400, "答えの形式が正しくありません。"],
  REVISION_CONFLICT: ["CONFLICT", 409, "状態が更新されました。再読み込みしてください。"],
  CLUES_MISSING: ["CLUES_MISSING", 400, "必要な手がかりが揃っていません。"],
  ALREADY_SOLVED: ["ALREADY_SOLVED", 409, "すでに解決済みです。"],
  NOT_SOLVED: ["NOT_SOLVED", 400, "まだ封印が解かれていません。"],
  VERSION_MISMATCH: ["VERSION_MISMATCH", 409, "セッションのバージョンが一致しません。"],
};
export function ruleError(error: RuleError): Response {
  const [code, status, message] = ruleMap[error];
  return jsonError(code, message, status);
}
