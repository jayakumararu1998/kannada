import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

import { validateApiKey } from "@/lib/builder/api-key";
import { getStore } from "@/lib/builder/store";
import type { CustomSchemaScript } from "@/lib/builder/types";

import { json, preflight, unauthorized } from "../_shared";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return preflight();
}

/** List all stored custom JSON-LD schema scripts. */
export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorized(request);
  const scripts = getStore().getAllCustomSchemaScripts();
  return json({
    success: true,
    count: Object.keys(scripts).length,
    customSchemaScripts: scripts,
  });
}

/**
 * Push builder-authored custom JSON-LD. Accepts either:
 *   { customSchemaScripts: CustomSchemaScript[] }
 *   { customSchemaScripts: { [id]: CustomSchemaScript } }
 *   a bare { [id]: CustomSchemaScript } map
 * `clearExisting` replaces only the GLOBAL (non page-scoped, non social-meta)
 * scripts so per-page schemas synced elsewhere aren't wiped.
 */
export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorized(request);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ success: false, error: "Invalid JSON body" }, 400);
  }

  const raw =
    body.customSchemaScripts && typeof body.customSchemaScripts === "object"
      ? (body.customSchemaScripts as Record<string, CustomSchemaScript> | CustomSchemaScript[])
      : (body as unknown as Record<string, CustomSchemaScript>);

  const entries: CustomSchemaScript[] = Array.isArray(raw)
    ? raw
    : Object.entries(raw)
        .filter(([k]) => k !== "clearExisting" && k !== "customSchemaScripts")
        .map(([id, cfg]) => ({ ...(cfg as CustomSchemaScript), id }));

  const store = getStore();
  store.beginSync();

  if (body.clearExisting) {
    // Only drop globals pushed via this endpoint — keep `_socialmeta_*` entries.
    for (const [id, cfg] of Object.entries(store.getAllCustomSchemaScripts())) {
      if (!id.startsWith("_socialmeta_") && !cfg.pageUrl) {
        store.deleteCustomSchemaScript(id);
      }
    }
  }

  let count = 0;
  for (const entry of entries) {
    const id = String(entry.id ?? entry.label ?? "");
    if (!id) continue;
    store.upsertCustomSchemaScript(id, { ...entry, id });
    count++;
  }

  const persist = store.persist();
  store.endSync();
  revalidatePath("/", "layout");

  return json({ success: true, count, persist, store: store.stats() });
}
