import type { HealthResponse } from "@/lib/api/contract";
import { aiEnabled } from "@/lib/ai/storyGenerator";
import { isTtsEnabled } from "@/lib/ai/tts";
import { jsonOk } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXPECTED = ["OPENAI_API_KEY", "OPENAI_MODEL", "OPENAI_TTS_MODEL", "SESSION_COOKIE_SECRET"] as const;

/**
 * Configuration hints for operators. Reports variable NAMES only — never
 * values — so a missing or misspelled Vercel environment variable is easy
 * to spot.
 */
function diagnostics(): NonNullable<HealthResponse["config"]> {
  const set = (name: string) => Boolean(process.env[name]?.trim());
  const missing = EXPECTED.filter((name) => !set(name));
  const similar = Object.keys(process.env).filter(
    (k) => /open.?ai|gpt|tts|model/i.test(k) && !(EXPECTED as readonly string[]).includes(k) && k !== "OPENAI_TTS_VOICE",
  );
  return {
    missing: [...missing],
    similarlyNamed: similar.slice(0, 10),
    aiSwitchedOff: process.env.DISABLE_AI_GENERATION === "true",
    vercelEnv: process.env.VERCEL_ENV ?? "local",
  };
}

export function GET(): Response {
  const body: HealthResponse = {
    status: "ok",
    version: process.env.NEXT_PUBLIC_APP_VERSION || "2.0.0",
    ai: aiEnabled() ? "enabled" : "disabled",
    tts: isTtsEnabled() ? "enabled" : "disabled",
    time: new Date().toISOString(),
    config: diagnostics(),
  };
  return jsonOk(body);
}
