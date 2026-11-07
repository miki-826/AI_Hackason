import { GET as getMemory } from "../route";
import { assertSameOrigin } from "@/lib/server/http";
export const runtime = "nodejs"; export const dynamic = "force-dynamic"; export const maxDuration = 60;
export async function POST(request: Request, context: { params: Promise<{ id: string; furnitureId: string }> }): Promise<Response> {
  const originError = assertSameOrigin(request); if (originError) return originError;
  return getMemory(request, context);
}
