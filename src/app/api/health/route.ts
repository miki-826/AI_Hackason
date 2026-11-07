import type { HealthResponse } from "@/lib/api/contract";
import { aiEnabled } from "@/lib/ai/storyGenerator";
import { isTtsEnabled } from "@/lib/ai/tts";
import { jsonOk } from "@/lib/server/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET(): Response {
  const body: HealthResponse = { status: "ok", version: process.env.NEXT_PUBLIC_APP_VERSION || "2.0.0", ai: aiEnabled() ? "enabled" : "disabled", tts: isTtsEnabled() ? "enabled" : "disabled", time: new Date().toISOString() };
  return jsonOk(body);
}
