import { describe, expect, it } from "vitest";
import { POST as create } from "@/app/api/v1/sessions/route";
import { GET as current } from "@/app/api/v1/sessions/current/route";
import { GET as getSession, DELETE as deleteSession } from "@/app/api/v1/sessions/[id]/route";
import { POST as complete } from "@/app/api/v1/sessions/[id]/memories/[furnitureId]/complete/route";
import { POST as solve } from "@/app/api/v1/sessions/[id]/puzzles/seal/solve/route";
import { POST as ending } from "@/app/api/v1/sessions/[id]/ending/route";
import type { PublicSession } from "@/game-core/types";

const base = "http://localhost/api/v1/sessions";
const context = (id: string) => ({ params: Promise.resolve({ id }) });
const furnitureContext = (id: string, furnitureId: string) => ({ params: Promise.resolve({ id, furnitureId }) });
function request(path: string, method: string, cookie?: string, body?: unknown) {
  return new Request(`${base}${path}`, { method, headers: { ...(cookie ? { cookie } : {}), ...(body ? { "content-type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
}
function cookieOf(response: Response) { return response.headers.get("set-cookie")!.split(";")[0]; }
async function makeSession() {
  const response = await create(request("", "POST", undefined, {}));
  expect(response.status).toBe(201);
  return { cookie: cookieOf(response), session: (await response.json()).session as PublicSession };
}

describe("session API", () => {
  it("creates, protects, progresses, solves and deletes", async () => {
    process.env.DISABLE_AI_GENERATION = "true";
    let { cookie, session } = await makeSession(); const id = session.sessionId;
    const currentResponse = await current(request("/current", "GET", cookie)); expect(currentResponse.status).toBe(200);
    expect((await currentResponse.json()).session.sessionId).toBe(id);
    const other = await makeSession();
    expect((await getSession(request(`/${other.session.sessionId}`, "GET", cookie), context(other.session.sessionId))).status).toBe(403);
    expect((await getSession(request(`/${id}`, "GET"), context(id))).status).toBe(401);
    const tampered = `${cookie.slice(0, -1)}x`;
    expect((await getSession(request(`/${id}`, "GET", tampered), context(id))).status).toBe(401);
    const chair = session.furniture.find((f) => f.type === "chair")!;
    const foreign = await complete(request(`/${id}/memories/${chair.id}/complete`, "POST", cookie, { observedEventIds: [], foundClueIds: ["clue-clock"] }), furnitureContext(id, chair.id));
    expect(foreign.status).toBe(400);
    const before = await solve(request(`/${id}/puzzles/seal/solve`, "POST", cookie, { answer: "0000", revision: session.revision }), context(id));
    expect((await before.json()).error.code).toBe("CLUES_MISSING");
    for (const type of ["chair", "clock", "desk"] as const) {
      const furniture = session.furniture.find((f) => f.type === type)!;
      const response = await complete(request(`/${id}/memories/${furniture.id}/complete`, "POST", cookie, { observedEventIds: [`evt-${type}`], foundClueIds: [`clue-${type}`] }), furnitureContext(id, furniture.id));
      expect(response.status).toBe(200); cookie = cookieOf(response);
      const text = await response.text(); expect(text).not.toContain("0315");
      session = JSON.parse(text).session;
    }
    expect(session.clues.map((clue) => clue.id)).toEqual(["clue-chair", "clue-clock", "clue-desk"]);
    const stale = await solve(request(`/${id}/puzzles/seal/solve`, "POST", cookie, { answer: "0000", revision: 1 }), context(id));
    expect(stale.status).toBe(409);
    const wrong = await solve(request(`/${id}/puzzles/seal/solve`, "POST", cookie, { answer: "0000", revision: session.revision }), context(id));
    const wrongBody = await wrong.json(); expect(wrongBody.correct).toBe(false); expect(wrongBody.attemptsLeft).toBe(29);
    cookie = cookieOf(wrong); session = wrongBody.session;
    const correct = await solve(request(`/${id}/puzzles/seal/solve`, "POST", cookie, { answer: "0315", revision: session.revision }), context(id));
    const correctBody = await correct.json(); expect(correctBody.correct).toBe(true);
    cookie = cookieOf(correct); session = correctBody.session;
    const finished = await ending(request(`/${id}/ending`, "POST", cookie, { revision: session.revision }), context(id));
    expect((await finished.json()).endingId).toMatch(/^ending-/); cookie = cookieOf(finished);
    const deleted = await deleteSession(request(`/${id}`, "DELETE", cookie), context(id));
    expect(deleted.status).toBe(204); expect(deleted.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
