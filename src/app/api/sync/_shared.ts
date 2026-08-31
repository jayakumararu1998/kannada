import "server-only";

import { NextResponse } from "next/server";

import { authDebug } from "@/lib/builder/api-key";

/** Permissive CORS headers so the external builder can call these endpoints. */
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, X-API-Key, X-Sync-Api-Key, X-Sync-Key, Api-Key, apikey, Authorization",
  "Access-Control-Max-Age": "86400",
} as const;

export function json(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: CORS_HEADERS });
}

export function unauthorized(request?: Request): NextResponse {
  // Include non-sensitive diagnostics so the caller can tell whether the SERVER
  // is missing SYNC_API_KEY vs. the REQUEST not sending / mismatching the key.
  const debug = request ? authDebug(request) : {};
  const hint =
    request && !authDebug(request).keyConfigured
      ? "Server has no SYNC_API_KEY set — add it to .env.local (NOT .env.example) and restart."
      : "Send header 'X-API-Key: <SYNC_API_KEY>'. Check for whitespace/newline mismatch.";
  return json(
    { success: false, error: "Invalid or missing API key", hint, ...debug },
    401,
  );
}

export function preflight(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
