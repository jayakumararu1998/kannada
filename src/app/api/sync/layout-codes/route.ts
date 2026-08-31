import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

import { validateApiKey } from "@/lib/builder/api-key";
import { runLayoutCodesPull } from "@/lib/builder/pull";
import { getStore } from "@/lib/builder/store";

import { json, preflight, unauthorized } from "../_shared";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return preflight();
}

/**
 * Layout ad-codes (GAM/GPT). With `?slug=` returns that single entry; otherwise
 * returns the full map — matching the builder's own shape:
 *   `{ success, layoutCodes: { <slug>: { name, slug, scope, … } }, total, timestamp }`.
 */
export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorized(request);
  const store = getStore();
  const slug = new URL(request.url).searchParams.get("slug");

  if (slug) {
    const layoutCode = store.getLayoutCode(slug);
    return json({ success: true, slug, layoutCode });
  }

  const layoutCodes = store.getAllLayoutCodes();
  return json({
    success: true,
    layoutCodes,
    total: Object.keys(layoutCodes).length,
    timestamp: new Date().toISOString(),
  });
}

/** A layout-code entry looks like a config object once it carries a slug/name. */
function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/**
 * Sync layout ad-codes from the builder. Accepts, in order:
 *
 *   1. Map    — `{ layoutCodes: { <slug>: {…} } }` (the builder echoing its GET
 *               shape). Every entry is upserted by its slug/key.
 *   2. Entry  — a single `{ slug, name, scope, … }`, a `{ layoutCode: {…} }`
 *               wrapper, or the generic envelope `{ action, slug, data }`.
 *               `action:"delete"` removes the slug.
 *   3. Ping   — no usable slug/entry in the body (e.g. an empty `{}` webhook).
 *               The endpoint pulls the latest codes from the builder itself, so
 *               a bare "something changed" POST just works — and an empty body
 *               never wipes the store.
 */
export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorized(request);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    // No/invalid body → treat as a ping and refetch from the builder.
    body = {};
  }

  const store = getStore();

  // 1. Full map push: `{ layoutCodes: { <slug>: {…} } }`.
  if (isPlainObject(body.layoutCodes)) {
    const map = body.layoutCodes as Record<string, unknown>;
    store.beginSync();
    for (const [key, value] of Object.entries(map)) {
      if (isPlainObject(value)) {
        const slug = String(value.slug ?? key);
        store.setLayoutCode(slug, { ...value, slug });
      }
    }
    const persist = store.persist();
    store.endSync();
    revalidatePath("/", "layout");
    return json({
      success: true,
      mode: "map",
      count: Object.keys(map).length,
      persist,
      store: store.stats(),
    });
  }

  // 2. Single entry: bare, `{ layoutCode }` wrapper, or `{ data }` envelope.
  const entry = (
    isPlainObject(body.layoutCode)
      ? body.layoutCode
      : isPlainObject(body.data)
        ? body.data
        : body
  ) as Record<string, unknown>;
  const slug = String(body.slug ?? entry.slug ?? "");
  const action = body.action === "delete" ? "delete" : "upsert";

  if (slug) {
    store.beginSync();
    if (action === "delete") store.setLayoutCode(slug, null);
    else store.setLayoutCode(slug, { ...entry, slug });
    const persist = store.persist();
    store.endSync();
    revalidatePath("/", "layout");
    return json({
      success: true,
      mode: "entry",
      slug,
      action,
      persist,
      store: store.stats(),
    });
  }

  // 3. Ping: nothing usable in the body → pull the latest from the builder.
  const count = await runLayoutCodesPull();
  revalidatePath("/", "layout");
  return json({ success: true, mode: "pull", count, store: store.stats() });
}
