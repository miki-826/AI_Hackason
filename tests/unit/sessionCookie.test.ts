import { describe, expect, it } from "vitest";
import { createSessionRecord } from "@/game-core/rules/sessionRules";
import { signSession, verifySession } from "@/lib/server/sessionCookie";
const record = createSessionRecord({ id: "test", seed: "a".repeat(32), now: new Date().toISOString() });
describe("session cookie", () => {
  it("roundtrips a signed record", () => expect(verifySession(signSession(record))).toEqual(record));
  it("rejects tampering", () => {
    const signed = signSession(record);
    const [payload, signature] = signed.split(".");
    expect(verifySession(`${payload[0] === "A" ? "B" : "A"}${payload.slice(1)}.${signature}`)).toBeNull();
  });
  it("rejects wrong version", () => {
    const invalid = { ...record, v: 2 } as unknown as typeof record;
    expect(verifySession(signSession(invalid))).toBeNull();
  });
});
