import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { SESSION_COOKIE } from "@/lib/api/contract";
import type { SessionRecord } from "@/game-core/rules/sessionRules";

let warned = false;
function secret(): string {
  if (process.env.SESSION_COOKIE_SECRET) return process.env.SESSION_COOKIE_SECRET;
  if (!warned) {
    warned = true;
    console.warn("SESSION_COOKIE_SECRET is unset; using the development secret.");
  }
  return "truth-seeker-fixed-development-secret-change-in-production";
}

export function newSessionIdentity(): { id: string; seed: string } {
  return { id: randomUUID(), seed: randomBytes(16).toString("hex") };
}

export function signSession(record: SessionRecord): string {
  const payload = Buffer.from(JSON.stringify(record)).toString("base64url");
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifySession(value: string | null | undefined): SessionRecord | null {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  if (!payload || !signature || !/^[A-Za-z0-9_-]+$/.test(payload) || !/^[A-Za-z0-9_-]+$/.test(signature)) return null;
  const expected = createHmac("sha256", secret()).update(payload).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const record: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!record || typeof record !== "object" || (record as SessionRecord).v !== 1) return null;
    const r = record as SessionRecord;
    if (typeof r.id !== "string" || typeof r.seed !== "string" || !Array.isArray(r.found) || !Array.isArray(r.visited) || !Array.isArray(r.decoded)) return null;
    return r;
  } catch { return null; }
}

export function readSessionCookie(request: Request): SessionRecord | null {
  const value = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
  return verifySession(value);
}

export function sessionSetCookie(record: SessionRecord): string {
  return `${SESSION_COOKIE}=${signSession(record)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

export function sessionClearCookie(): string {
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}
