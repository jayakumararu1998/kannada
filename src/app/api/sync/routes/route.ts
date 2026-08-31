import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

import { validateApiKey } from "@/lib/builder/api-key";
import { getStore, isRoutablePattern, segmentCount } from "@/lib/builder/store";
import type { RouteConfig } from "@/lib/builder/types";

import { json, preflight, unauthorized } from "../_shared";

export const dynamic = "force-dynamic";

function isValidRoute(r: unknown): r is RouteConfig {
  if (!r || typeof r !== "object") return false;
  // Must have a routable pattern ("/..."); null/empty patterns would collapse to
  // "/" and clobber the homepage route, so reject them.
  return isRoutablePattern((r as Record<string, unknown>).url_pattern);
}

export async function OPTIONS() {
  return preflight();
}

/** List all stored routes. */
export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorized(request);
  const routes = getStore().getAllRoutes();
  return json({ success: true, count: routes.length, routes });
}

/** Push routes: { routes: RouteConfig[], clearExisting?: boolean }. */
export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorized(request);

  let body: { routes?: unknown[]; clearExisting?: boolean };
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: "Invalid JSON body" }, 400);
  }

  const valid = (body.routes ?? [])
    .filter(isValidRoute)
    .map((r) => ({ ...r, segment_count: segmentCount(r.url_pattern) }));

  const store = getStore();
  store.beginSync();
  if (body.clearExisting) store.clearRoutes();
  for (const route of valid) store.upsertRoute(route);
  const persist = store.persist();
  store.endSync();

  revalidatePath("/", "layout");
  return json({
    success: true,
    count: valid.length,
    persist,
    store: store.stats(),
  });
}
