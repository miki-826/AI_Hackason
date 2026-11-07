import { API_BASE, type ApiErrorBody, type SessionResponse } from "@/lib/api/contract";
import type { GameGateway } from "./gateway";
import { GatewayError } from "./gateway";

const TIMEOUT_MS = 30_000;

function idempotencyKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET") headers["Idempotency-Key"] = idempotencyKey();
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === "AbortError";
    throw new GatewayError(
      aborted ? "サーバーの応答がありません。通信状況を確認して、もう一度お試しください。" : "サーバーに接続できません。",
      0,
      "NETWORK",
      true,
    );
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const e = data as Partial<ApiErrorBody> | null;
    throw new GatewayError(
      e?.error?.message ?? `通信エラー (${res.status})`,
      res.status,
      e?.error?.code ?? "INTERNAL",
      e?.retryable ?? res.status >= 500,
    );
  }
  return data as T;
}

const s = (id: string) => `/sessions/${encodeURIComponent(id)}`;

export const serverGateway: GameGateway = {
  mode: "server",
  async createSession() {
    return (await call<SessionResponse>("POST", "/sessions", {})).session;
  },
  async currentSession() {
    try {
      return (await call<SessionResponse>("GET", "/sessions/current")).session;
    } catch (err) {
      if (err instanceof GatewayError && (err.status === 404 || err.status === 401)) return null;
      throw err;
    }
  },
  furnitureDetail: (sid, fid) => call("GET", `${s(sid)}/furniture/${encodeURIComponent(fid)}`),
  generateMemory: (sid, fid) => call("POST", `${s(sid)}/memories/${encodeURIComponent(fid)}/generate`, {}),
  completeMemory: (sid, fid, body) => call("POST", `${s(sid)}/memories/${encodeURIComponent(fid)}/complete`, body),
  decodeClue: (sid, clueId, relatedClueIds) =>
    call("POST", `${s(sid)}/clues/${encodeURIComponent(clueId)}/decode`, { relatedClueIds }),
  solveSeal: (sid, answer, revision) => call("POST", `${s(sid)}/puzzles/seal/solve`, { answer, revision }),
  saveCheckpoint: (sid, checkpoint, revision) =>
    call("PATCH", `${s(sid)}/checkpoint`, { position: checkpoint.position, yaw: checkpoint.yaw, revision }),
  finishEnding: (sid, revision) => call("POST", `${s(sid)}/ending`, { revision }),
  async deleteSession(sid) {
    await call<void>("DELETE", s(sid));
  },
};
