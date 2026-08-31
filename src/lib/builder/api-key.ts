import "server-only";

import { timingSafeEqual } from "node:crypto";

import { SYNC_API_KEY } from "./config";

/** Header names we accept the key under (checked in order). */
const KEY_HEADERS = [
  "x-api-key",
  "x-sync-api-key",
  "x-sync-key",
  "api-key",
  "apikey",
];

/** Is a sync key configured on the server at all? */
export function isKeyConfigured(): boolean {
  return SYNC_API_KEY.trim().length > 0;
}

/** Trim whitespace and strip a single pair of surrounding quotes. */
function clean(v: string): string {
  return v.trim().replace(/^["']|["']$/g, "").trim();
}

/** Query-param names we also accept the key under (some builders append it). */
const KEY_PARAMS = ["api_key", "apiKey", "apikey", "key", "sync_key", "token"];

/**
 * Pull the key from any accepted transport:
 *   - headers: X-API-Key / X-Sync-Api-Key / X-Sync-Key / Api-Key / apikey
 *   - Authorization: Bearer <key>
 *   - URL query param: ?api_key= / ?apiKey= / ?key= / ?token= …
 */
function extractKey(request: Request): string {
  for (const h of KEY_HEADERS) {
    const v = request.headers.get(h);
    if (v) return clean(v);
  }
  const auth = request.headers.get("authorization");
  if (auth) return clean(auth.replace(/^Bearer\s+/i, ""));
  try {
    const params = new URL(request.url).searchParams;
    for (const p of KEY_PARAMS) {
      const v = params.get(p);
      if (v) return clean(v);
    }
  } catch {
    /* non-absolute URL — ignore */
  }
  return "";
}

/**
 * Timing-safe check of the incoming key against SYNC_API_KEY (both trimmed).
 * Fail-closed: if the secret is not configured, every request is rejected.
 */
export function validateApiKey(request: Request): boolean {
  const expected = SYNC_API_KEY.trim();
  if (!expected) return false;

  const got = extractKey(request);
  if (!got) return false;

  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  // timingSafeEqual throws on length mismatch — length is not secret.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Non-sensitive diagnostics for 401 responses (never leaks the key). */
export function authDebug(request: Request): {
  keyConfigured: boolean;
  receivedKey: boolean;
} {
  return { keyConfigured: isKeyConfigured(), receivedKey: !!extractKey(request) };
}
