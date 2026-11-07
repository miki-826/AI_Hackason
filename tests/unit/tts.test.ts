import { afterEach, describe, expect, it, vi } from "vitest";
import { isTtsEnabled, synthesize } from "@/lib/ai/tts";

const originalFetch = global.fetch;
const original = {
  key: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_TTS_MODEL,
  voice: process.env.OPENAI_TTS_VOICE,
  disabled: process.env.DISABLE_AI_GENERATION,
};
afterEach(() => {
  global.fetch = originalFetch;
  for (const [name, value] of Object.entries({ OPENAI_API_KEY: original.key, OPENAI_TTS_MODEL: original.model, OPENAI_TTS_VOICE: original.voice, DISABLE_AI_GENERATION: original.disabled })) {
    if (value === undefined) delete process.env[name]; else process.env[name] = value;
  }
  vi.useRealTimers();
});

function enable() {
  process.env.OPENAI_API_KEY = "test-key";
  process.env.OPENAI_TTS_MODEL = "test-tts-model";
  delete process.env.OPENAI_TTS_VOICE;
  delete process.env.DISABLE_AI_GENERATION;
}

describe("TTS", () => {
  it("requires a key, model, and enabled AI generation", () => {
    enable(); expect(isTtsEnabled()).toBe(true);
    delete process.env.OPENAI_TTS_MODEL; expect(isTtsEnabled()).toBe(false);
    process.env.OPENAI_TTS_MODEL = "test-tts-model";
    delete process.env.OPENAI_API_KEY; expect(isTtsEnabled()).toBe(false);
    process.env.OPENAI_API_KEY = "test-key";
    process.env.DISABLE_AI_GENERATION = "true"; expect(isTtsEnabled()).toBe(false);
  });

  it("posts MP3 speech with the configured model and default voice, then uses cache", async () => {
    enable();
    const bytes = new Uint8Array([1, 2, 3]);
    global.fetch = vi.fn().mockResolvedValue(new Response(bytes));
    const text = `cache test ${crypto.randomUUID()}`;
    expect(new Uint8Array(await synthesize(text))).toEqual(bytes);
    expect(new Uint8Array(await synthesize(text))).toEqual(bytes);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = vi.mocked(global.fetch).mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/audio/speech");
    expect(options?.method).toBe("POST");
    expect(options?.headers).toEqual({ Authorization: "Bearer test-key", "Content-Type": "application/json" });
    expect(JSON.parse(String(options?.body))).toEqual({
      model: "test-tts-model", voice: "sage", input: text, response_format: "mp3",
      instructions: "落ち着いた、静かで少し懐かしさのある語り口の日本語で、ゆっくり読み上げてください。",
    });
  });

  it("aborts after 15 seconds and rejects", async () => {
    enable(); vi.useFakeTimers();
    global.fetch = vi.fn((_url: string | URL | Request, options?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      options?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    }));
    const pending = expect(synthesize(`timeout ${crypto.randomUUID()}`)).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(15_000);
    await pending;
  });
});
