import { randomInt } from "node:crypto";

const TTL_MS = 10 * 60 * 1000;
/** @type {Map<string, { code: string, expiresAt: number }>} */
const store = new Map();

function prune() {
  const now = Date.now();
  for (const [k, v] of store.entries()) {
    if (v.expiresAt < now) store.delete(k);
  }
}

export function createAndStoreOtp(key) {
  prune();
  const code = String(randomInt(100000, 1000000));
  store.set(key, { code, expiresAt: Date.now() + TTL_MS });
  return code;
}

/** @returns {boolean} */
export function consumeOtp(key, code) {
  prune();
  if (!code || typeof code !== "string") return false;
  const trimmed = code.trim();
  const entry = store.get(key);
  if (!entry || entry.expiresAt < Date.now()) {
    store.delete(key);
    return false;
  }
  if (entry.code !== trimmed) return false;
  store.delete(key);
  return true;
}
