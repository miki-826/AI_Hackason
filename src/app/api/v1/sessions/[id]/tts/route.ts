import { ttsBody } from "@/lib/api/contract";
import { isSpeakableForSession, isTtsEnabled, synthesize } from "@/lib/ai/tts";
import { loadSession } from "@/lib/server/gameService";
import { assertSameOrigin, jsonError, parseBody } from "@/lib/server/http";
import { rateLimit } from "@/lib/security/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const originError = assertSameOrigin(request);
  if (originError) return originError;
  const { id } = await context.params;
  const session = loadSession(request, id);
  if (session instanceof Response) return session;
  const body = await parseBody(request, ttsBody);
  if (body instanceof Response) return body;
  if (!isTtsEnabled()) return jsonError("NOT_FOUND", "音声読み上げは無効です。", 404);
  if (!isSpeakableForSession(session.record, session.plan, body.text)) {
    return jsonError("BAD_REQUEST", "このセッションで読み上げられる文章ではありません。", 400);
  }
  if (!rateLimit(`tts:${id}`, 80, 600_000)) return jsonError("RATE_LIMITED", "しばらく待ってから再試行してください。", 429, true);
  try {
    const audio = await synthesize(body.text.trim());
    return new Response(audio, { status: 200, headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=86400" } });
  } catch {
    return jsonError("INTERNAL", "音声の生成に失敗しました。", 503, true);
  }
}
