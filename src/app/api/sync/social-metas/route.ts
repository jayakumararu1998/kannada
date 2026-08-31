import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

import { validateApiKey } from "@/lib/builder/api-key";
import { getStore } from "@/lib/builder/store";
import { syncSocialMetaSchemas } from "@/lib/seo/custom-schema-sync";
import type { SocialMetaConfig } from "@/lib/builder/types";

import { json, preflight, unauthorized } from "../_shared";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return preflight();
}

/** List all stored per-URL social metas. */
export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorized(request);
  const socialMetas = getStore().getAllSocialMetas();
  return json({
    success: true,
    count: Object.keys(socialMetas).length,
    socialMetas,
  });
}

/**
 * Push per-URL social/OG/Twitter overrides. Accepts either:
 *   { socialMetas: { [slug]: SocialMetaConfig }, clearExisting?: boolean }
 *   { socialMetas: SocialMetaConfig[] }
 *   a bare { [slug]: SocialMetaConfig } map
 * Any `customSchemaScripts` on a record are extracted into the custom-schema
 * store (scoped to that record's pageUrl), mirroring dinamani.
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
    body.socialMetas && typeof body.socialMetas === "object"
      ? (body.socialMetas as Record<string, SocialMetaConfig> | SocialMetaConfig[])
      : (body as unknown as Record<string, SocialMetaConfig>);

  const entries: SocialMetaConfig[] = Array.isArray(raw)
    ? raw
    : Object.entries(raw)
        .filter(([k]) => k !== "clearExisting" && k !== "socialMetas")
        .map(([slug, meta]) => ({ ...(meta as SocialMetaConfig), slug }));

  const store = getStore();
  store.beginSync();
  if (body.clearExisting) store.clearSocialMetas();

  let count = 0;
  for (const meta of entries) {
    const slug = String(meta.slug ?? meta.id ?? "");
    if (!slug) continue;
    store.upsertSocialMeta(slug, { ...meta, slug });
    syncSocialMetaSchemas(store, slug, meta);
    count++;
  }

  const persist = store.persist();
  store.endSync();
  revalidatePath("/", "layout");

  return json({ success: true, count, persist, store: store.stats() });
}
