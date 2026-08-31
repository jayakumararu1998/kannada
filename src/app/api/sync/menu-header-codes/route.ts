import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

import { validateApiKey } from "@/lib/builder/api-key";
import { getStore } from "@/lib/builder/store";
import type { MenuHeaderCodeConfig } from "@/lib/builder/types";

import { json, preflight, unauthorized } from "../_shared";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return preflight();
}

/** List all stored menu header codes. */
export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorized(request);
  const codes = getStore().getAllMenuHeaderCodes();
  return json({ success: true, count: Object.keys(codes).length, menuHeaderCodes: codes });
}

/**
 * Push the CMS menu header codes (image/HTML banners above the header / below
 * breaking news). Accepts `{ menuHeaderCodes: [...] | { [slug]: cfg } }`, a bare
 * `{ [slug]: cfg }` map, or `{ data: ... }`. `clearExisting` replaces the set.
 */
export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorized(request);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ success: false, error: "Invalid JSON body" }, 400);
  }

  const raw = (body.menuHeaderCodes ?? body.data ?? body) as
    | Record<string, MenuHeaderCodeConfig>
    | MenuHeaderCodeConfig[];

  const entries: MenuHeaderCodeConfig[] = Array.isArray(raw)
    ? raw
    : Object.entries(raw)
        .filter(([k]) => k !== "clearExisting" && k !== "menuHeaderCodes" && k !== "data")
        .map(([slug, cfg]) => ({ ...(cfg as MenuHeaderCodeConfig), slug }));

  const store = getStore();
  store.beginSync();
  if (body.clearExisting) store.clearMenuHeaderCodes();

  let count = 0;
  for (const entry of entries) {
    const slug = String(entry.slug ?? "");
    if (!slug || typeof entry !== "object") continue;
    store.upsertMenuHeaderCode(slug, { ...entry, slug });
    count++;
  }

  const persist = store.persist();
  store.endSync();
  revalidatePath("/", "layout");
  return json({ success: true, count, persist, store: store.stats() });
}
