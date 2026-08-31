import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

import { validateApiKey } from "@/lib/builder/api-key";
import { getStore } from "@/lib/builder/store";
import type { WebsiteSettingConfig } from "@/lib/builder/types";

import { json, preflight, unauthorized } from "../_shared";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return preflight();
}

/** List all stored website settings (site-wide application config). */
export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorized(request);
  const settings = getStore().getAllWebsiteSettings();
  return json({
    success: true,
    count: Object.keys(settings).length,
    settings,
  });
}

/**
 * Push site-wide application config. Accepts either:
 *   { settings: { [slug]: WebsiteSettingConfig }, clearExisting?: boolean }
 *   { settings: WebsiteSettingConfig[] }
 *   a bare { [slug]: WebsiteSettingConfig } map
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
    body.settings && typeof body.settings === "object"
      ? (body.settings as Record<string, WebsiteSettingConfig> | WebsiteSettingConfig[])
      : (body as unknown as Record<string, WebsiteSettingConfig>);

  const entries: Array<[string, WebsiteSettingConfig]> = Array.isArray(raw)
    ? raw.map((s) => [String(s.slug ?? s.name ?? ""), s])
    : Object.entries(raw)
        .filter(([k]) => k !== "clearExisting" && k !== "settings")
        .map(([slug, setting]) => [slug, setting as WebsiteSettingConfig]);

  const store = getStore();
  store.beginSync();
  if (body.clearExisting) store.clearWebsiteSettings();

  let count = 0;
  for (const [slug, setting] of entries) {
    if (!slug) continue;
    store.upsertWebsiteSetting(slug, setting);
    count++;
  }

  const persist = store.persist();
  store.endSync();
  revalidatePath("/", "layout");

  return json({ success: true, count, persist, store: store.stats() });
}
