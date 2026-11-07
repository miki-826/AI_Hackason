import type {
  CheckpointResponse,
  CompleteMemoryResponse,
  DecodeClueResponse,
  EndingResponse,
  FurnitureDetailResponse,
  MemoryResponse,
  SolveSealResponse,
} from "@/lib/api/contract";
import type { Checkpoint, PublicSession } from "@/game-core/types";

/** Thrown by gateways for any failed call. `code` mirrors ApiErrorCode. */
export class GatewayError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "GatewayError";
  }
}

/**
 * Everything the client needs from the authoritative game server.
 * `ServerGateway` talks to /api/v1; `DemoGateway` runs the same rules
 * locally when the network is unavailable (only if demo mode is enabled).
 */
export interface GameGateway {
  readonly mode: "server" | "demo";
  createSession(): Promise<PublicSession>;
  currentSession(): Promise<PublicSession | null>;
  furnitureDetail(sessionId: string, furnitureId: string): Promise<FurnitureDetailResponse>;
  generateMemory(sessionId: string, furnitureId: string): Promise<MemoryResponse>;
  completeMemory(
    sessionId: string,
    furnitureId: string,
    body: { observedEventIds: string[]; foundClueIds: string[] },
  ): Promise<CompleteMemoryResponse>;
  decodeClue(sessionId: string, clueId: string, relatedClueIds: string[]): Promise<DecodeClueResponse>;
  solveSeal(sessionId: string, answer: string, revision: number): Promise<SolveSealResponse>;
  saveCheckpoint(sessionId: string, checkpoint: Checkpoint, revision: number): Promise<CheckpointResponse>;
  finishEnding(sessionId: string, revision: number): Promise<EndingResponse>;
  deleteSession(sessionId: string): Promise<void>;
}
