import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

import { validateApiKey } from "@/lib/builder/api-key";
import { getStore } from "@/lib/builder/store";
import type { MenuGroup } from "@/lib/builder/types";

import { json, preflight, unauthorized } from "../_shared";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return preflight();
}

/** List all stored menus. */
export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorized(request);
  const menus = getStore().getAllMenus();
  return json({ success: true, count: Object.keys(menus).length, menus });
}

/**
 * Push menus. Accepts either:
 *   { menus: { [slug]: MenuGroup }, clearExisting?: boolean }
 *   { menus: MenuGroup[], clearExisting?: boolean }   (keyed by slug)
 */
export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorized(request);

  let body: { menus?: Record<string, MenuGroup> | MenuGroup[]; clearExisting?: boolean };
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: "Invalid JSON body" }, 400);
  }

  const entries: Array<[string, MenuGroup]> = [];
  const incoming = body.menus ?? {};
  if (Array.isArray(incoming)) {
    for (const menu of incoming) if (menu.slug) entries.push([menu.slug, menu]);
  } else {
    for (const [slug, menu] of Object.entries(incoming)) entries.push([slug, menu]);
  }

  const store = getStore();
  store.beginSync();
  if (body.clearExisting) store.clearMenus();
  for (const [slug, menu] of entries) store.upsertMenu(slug, menu);
  const persist = store.persist();
  store.endSync();

  revalidatePath("/", "layout");
  return json({ success: true, count: entries.length, persist, store: store.stats() });
}
