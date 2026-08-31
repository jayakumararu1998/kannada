import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

import { validateApiKey } from "@/lib/builder/api-key";
import { getStore } from "@/lib/builder/store";
import type { SectionMeta } from "@/lib/builder/types";

import { json, preflight, unauthorized } from "../_shared";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return preflight();
}

/** List all stored section metas. */
export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorized(request);
  const sectionMetas = getStore().getAllSectionMetas();
  return json({
    success: true,
    count: Object.keys(sectionMetas).length,
    sectionMetas,
  });
}

/**
 * Push section metas. Accepts either:
 *   { sectionMetas: { [ownerId]: SectionMeta }, clearExisting?: boolean }
 *   { sectionMetas: SectionMeta[], clearExisting?: boolean }   (keyed by ownerId/id)
 */
export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorized(request);

  let body: {
    sectionMetas?: Record<string, SectionMeta> | SectionMeta[];
    clearExisting?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: "Invalid JSON body" }, 400);
  }

  const entries: Array<[string, SectionMeta]> = [];
  const incoming = body.sectionMetas ?? {};
  if (Array.isArray(incoming)) {
    for (const meta of incoming) {
      const key = String(meta.ownerId ?? meta.id ?? "");
      if (key) entries.push([key, meta]);
    }
  } else {
    for (const [key, meta] of Object.entries(incoming)) entries.push([key, meta]);
  }

  const store = getStore();
  store.beginSync();
  if (body.clearExisting) store.clearSectionMetas();
  for (const [key, meta] of entries) store.upsertSectionMeta(key, meta);
  const persist = store.persist();
  store.endSync();

  revalidatePath("/", "layout");
  return json({
    success: true,
    count: entries.length,
    persist,
    store: store.stats(),
  });
}
