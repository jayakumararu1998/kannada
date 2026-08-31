import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

import { validateApiKey } from "@/lib/builder/api-key";
import { runHeaderFooterPull } from "@/lib/builder/pull";
import { getStore } from "@/lib/builder/store";

import { json, preflight, unauthorized } from "../_shared";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return preflight();
}

/** Return the stored dynamic header/footer config. */
export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorized(request);
  const headerFooter = getStore().getHeaderFooter();
  return json({ success: true, headerFooter });
}

/**
 * Update the dynamic header/footer config from the builder. Two modes:
 *
 *   1. Push  — the body carries the config (`{ header, footer, slug, … }` or a
 *              `{ headerFooter: {...} }` wrapper). Stored instantly. `merge: true`
 *              shallow-merges onto the existing config instead of replacing it.
 *   2. Ping  — no config in the body (e.g. an empty `{}` "something changed"
 *              webhook). The endpoint pulls the latest config from the builder
 *              itself. This makes wiring a save-hook trivial (just POST the URL
 *              with the API key) and prevents an empty body from wiping the config.
 */
export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorized(request);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    // No/invalid body → treat as a ping and refetch from the builder.
    body = {};
  }

  const incoming =
    body.headerFooter && typeof body.headerFooter === "object"
      ? (body.headerFooter as Record<string, unknown>)
      : body;

  const store = getStore();

  // Ping mode: nothing usable in the body → pull the latest from the builder.
  const hasConfig =
    !!incoming &&
    typeof incoming === "object" &&
    ("header" in incoming || "footer" in incoming);
  if (!hasConfig) {
    const pulled = await runHeaderFooterPull();
    revalidatePath("/", "layout");
    return json({ success: true, mode: "pull", pulled, store: store.stats() });
  }

  // Push mode: store the config carried in the body.
  store.beginSync();
  store.setHeaderFooter(incoming, body.merge === true);
  const persist = store.persist();
  store.endSync();

  revalidatePath("/", "layout");
  return json({ success: true, mode: "push", persist, store: store.stats() });
}
