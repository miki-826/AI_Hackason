import type { CluesResponse } from "@/lib/api/contract";
import { loadSession, publicSession } from "@/lib/server/gameService";
import { jsonOk } from "@/lib/server/http";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params; const session = loadSession(request, id); if (session instanceof Response) return session;
  const body: CluesResponse = { clues: publicSession(session.record, session.plan).clues }; return jsonOk(body);
}
