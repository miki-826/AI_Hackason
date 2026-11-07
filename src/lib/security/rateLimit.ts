/** Per-instance sliding window. A shared Upstash Redis limiter can replace this in multi-instance deployments. */
const hits = new Map<string, number[]>();
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => time > now - windowMs);
  if (recent.length >= limit) { hits.set(key, recent); return false; }
  recent.push(now);
  hits.set(key, recent);
  return true;
}
