import type { SessionResponse } from "@/lib/api/contract";
import { loadSession, publicSession } from "@/lib/server/gameService";
import { assertSameOrigin, jsonOk } from "@/lib/server/http";
import { sessionClearCookie } from "@/lib/server/sessionCookie";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context): Promise<Response> {
  const { id } = await context.params; const session = loadSession(request, id); if (session instanceof Response) return session;
  const body: SessionResponse = { session: publicSession(session.record, session.plan) }; return jsonOk(body);
}
export async function DELETE(request: Request, context: Context): Promise<Response> {
  const originError = assertSameOrigin(request); if (originError) return originError;
  const { id } = await context.params; const session = loadSession(request, id); if (session instanceof Response) return session;
  const response = new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  response.headers.append("Set-Cookie", sessionClearCookie()); return response;
}
