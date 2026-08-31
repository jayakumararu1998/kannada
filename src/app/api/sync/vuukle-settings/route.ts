import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

import { validateApiKey } from "@/lib/builder/api-key";
import { getStore } from "@/lib/builder/store";

import { json, preflight, unauthorized } from "../_shared";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return preflight();
}

/** Current Vuukle settings for a slug (default: "default"). */
export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorized(request);
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug") || "default";
  const settings = getStore().getVuukleSettings(slug);
  return json({ success: true, slug, settings });
}

/**
 * Sync the Vuukle comment settings. Accepts either the dedicated shape
 * `{ slug, config }` or the generic sync envelope `{ action, slug, data }`.
 * `action:"delete"` removes the slug's settings.
 */
export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorized(request);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ success: false, error: "Invalid JSON body" }, 400);
  }

  // The payload may nest the real object under `data` (generic envelope) or be
  // the bare `{ slug, config }`.
  const data = (body.data ?? body) as Record<string, unknown>;
  const slug = String(body.slug ?? data.slug ?? "default");
  const action = body.action === "delete" ? "delete" : "upsert";

  const config = data.config ?? body.config;
  if (action === "upsert" && (!config || typeof config !== "object")) {
    return json(
      {
        success: false,
        error:
          "No Vuukle config found. Send { slug, config: { enabled, apiKey, host, nonAmp, amp, dynamicFields } }.",
      },
      400,
    );
  }

  const store = getStore();
  store.beginSync();
  if (action === "delete") store.setVuukleSettings(slug, null);
  else store.setVuukleSettings(slug, { slug, config });
  const persist = store.persist();
  store.endSync();

  revalidatePath("/", "layout");
  return json({ success: true, slug, action, persist, store: store.stats() });
}
