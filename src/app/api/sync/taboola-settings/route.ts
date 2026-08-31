import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

import { validateApiKey } from "@/lib/builder/api-key";
import { getStore } from "@/lib/builder/store";

import { json, preflight, unauthorized } from "../_shared";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return preflight();
}

/**
 * Taboola settings. With `?slug=` returns that single entry; otherwise returns
 * the full map — matching the builder's own shape:
 *   `{ success, taboolaSettings: { <slug>: { slug, config, … } }, total, timestamp }`.
 */
export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorized(request);
  const store = getStore();
  const slug = new URL(request.url).searchParams.get("slug");

  if (slug) {
    const settings = store.getTaboolaSettings(slug);
    return json({ success: true, slug, settings });
  }

  const taboolaSettings = store.getAllTaboolaSettings();
  return json({
    success: true,
    taboolaSettings,
    total: Object.keys(taboolaSettings).length,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Sync the Taboola settings. Accepts the bare `{ slug, config }` shape (as the
 * builder pushes it) or the generic envelope `{ action, slug, data }`.
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
          "No Taboola config found. Send { slug, config: { enabled, publisherId, pages, amp } }.",
      },
      400,
    );
  }

  const store = getStore();
  store.beginSync();
  if (action === "delete") store.setTaboolaSettings(slug, null);
  else store.setTaboolaSettings(slug, { slug, config });
  const persist = store.persist();
  store.endSync();

  revalidatePath("/", "layout");
  return json({ success: true, slug, action, persist, store: store.stats() });
}
