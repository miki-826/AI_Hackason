import { checkpointBody, type CheckpointResponse } from "@/lib/api/contract";
import { saveCheckpoint } from "@/game-core/rules/sessionRules";
import { loadSession, withSession } from "@/lib/server/gameService";
import { assertSameOrigin, jsonOk, parseBody } from "@/lib/server/http";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const originError = assertSameOrigin(request); if (originError) return originError;
  const { id } = await context.params; const session = loadSession(request, id); if (session instanceof Response) return session;
  const body = await parseBody(request, checkpointBody); if (body instanceof Response) return body;
  const savedAt = new Date().toISOString(); const record = saveCheckpoint(session.record, { checkpoint: { position: body.position, yaw: body.yaw }, now: savedAt });
  const response: CheckpointResponse = { savedAt, revision: record.revision }; return withSession(jsonOk(response), record);
}
