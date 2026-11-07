/**
 * Normalises a 4-digit code: full-width digits -> ASCII, whitespace removed.
 * Returns null when the input is not exactly four digits.
 */
export function normalizeCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const ascii = input
    .replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xfee0))
    .replace(/\s+/g, "");
  return /^[0-9]{4}$/.test(ascii) ? ascii : null;
}

export type SealCheck =
  | { ok: true; correct: boolean }
  | { ok: false; reason: "INVALID_FORMAT" | "CLUES_MISSING" | "ALREADY_SOLVED" };

/**
 * Seal success rule (spec 6.2): required clues collected, answer matches,
 * and not already solved.
 */
export function checkSeal(params: {
  input: unknown;
  expectedAnswer: string;
  requiredClueIds: readonly string[];
  collectedClueIds: readonly string[];
  solved: boolean;
}): SealCheck {
  if (params.solved) return { ok: false, reason: "ALREADY_SOLVED" };
  const code = normalizeCode(params.input);
  if (code === null) return { ok: false, reason: "INVALID_FORMAT" };
  const collected = new Set(params.collectedClueIds);
  if (!params.requiredClueIds.every((id) => collected.has(id))) return { ok: false, reason: "CLUES_MISSING" };
  return { ok: true, correct: code === params.expectedAnswer };
}
